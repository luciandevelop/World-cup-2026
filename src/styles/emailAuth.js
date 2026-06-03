// ─── src/services/emailAuth.js ────────────────────────────────────────────────
// Email authentication — two completely separate paths:
//
//   FIREBASE_CONFIGURED = true
//     firebaseSignInWithEmail(email, password) from firebase.js
//     Standard Firebase Email/Password auth.
//     No OTP. No Firestore writes for auth. No demoCode. No fake UIDs.
//     The functions sendEmailCode / verifyEmailCode still exist so
//     AuthScreens.jsx doesn't need to know which mode it's in, but their
//     behaviour changes completely.
//
//   FIREBASE_CONFIGURED = false  (Demo mode)
//     Unchanged: generates a 6-digit code in localStorage, reveals it in the
//     UI via demoCode, creates a deterministic fake UID from the email.
// ─────────────────────────────────────────────────────────────────────────────

import { FIREBASE_CONFIGURED, firebaseSignInWithEmail } from './firebase.js';

// ── Demo-mode localStorage keys ───────────────────────────────────────────────
const CODE_KEY    = 'wc2026_email_code';
const CODE_EMAIL  = 'wc2026_code_email';
const CODE_EXPIRY = 'wc2026_code_expiry';
const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

// ─── SEND "CODE" ──────────────────────────────────────────────────────────────
// Firebase mode : no-ops — we don't send codes; the caller will switch to
//                 a password input instead.  Returns { success:true, usePassword:true }.
// Demo mode     : generates & stores OTP in localStorage; returns { success:true, demoCode }.
export async function sendEmailCode(email) {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !normalised.includes('@')) {
    return { success: false, error: 'Email invalid.' };
  }

  if (FIREBASE_CONFIGURED) {
    // Signal to the UI that we want a password field, not a code field.
    return { success: true, usePassword: true };
  }

  // ── Demo mode ──────────────────────────────────────────────────────────────
  const code = generateCode();
  localStorage.setItem(CODE_KEY,    code);
  localStorage.setItem(CODE_EMAIL,  normalised);
  localStorage.setItem(CODE_EXPIRY, String(Date.now() + CODE_TTL_MS));
  await new Promise(r => setTimeout(r, 800));
  return { success: true, demoCode: code };
}

// ─── VERIFY "CODE" ────────────────────────────────────────────────────────────
// Firebase mode : `input` is treated as the password.
//                 Calls firebaseSignInWithEmail — creates account on first use.
// Demo mode     : validates the 6-digit OTP from localStorage.
export async function verifyEmailCode(email, input) {
  const normalised = email.trim().toLowerCase();

  if (FIREBASE_CONFIGURED) {
    if (!input || input.length < 6) {
      return { success: false, error: 'Parola trebuie să aibă cel puțin 6 caractere.' };
    }
    try {
      const user = await firebaseSignInWithEmail(normalised, input);
      return { success: true, ...user };
    } catch (e) {
      // Translate common Firebase Auth error codes to Romanian
      const msg = _translateAuthError(e.code);
      return { success: false, error: msg };
    }
  }

  // ── Demo mode ──────────────────────────────────────────────────────────────
  const stored      = localStorage.getItem(CODE_KEY);
  const storedEmail = localStorage.getItem(CODE_EMAIL);
  const expiry      = Number(localStorage.getItem(CODE_EXPIRY) || '0');

  if (!stored)                      return { success: false, error: 'Niciun cod activ. Trimite din nou.' };
  if (Date.now() > expiry)          { _clearCode(); return { success: false, error: 'Codul a expirat. Trimite din nou.' }; }
  if (storedEmail !== normalised)   return { success: false, error: 'Email diferit de cel folosit la trimitere.' };
  if (input.trim() !== stored)      return { success: false, error: 'Cod incorect. Încearcă din nou.' };

  _clearCode();
  const uid = 'email_' + btoa(normalised).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  await new Promise(r => setTimeout(r, 400));
  return { success: true, uid, email: normalised, name: normalised.split('@')[0], provider: 'email' };
}

function _clearCode() {
  localStorage.removeItem(CODE_KEY);
  localStorage.removeItem(CODE_EMAIL);
  localStorage.removeItem(CODE_EXPIRY);
}

function _translateAuthError(code) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':  return 'Parolă incorectă. Încearcă din nou.';
    case 'auth/user-not-found':      return 'Nu există cont cu acest email.';
    case 'auth/email-already-in-use':return 'Email deja înregistrat. Folosește parola existentă.';
    case 'auth/weak-password':       return 'Parola trebuie să aibă cel puțin 6 caractere.';
    case 'auth/too-many-requests':   return 'Prea multe încercări. Încearcă mai târziu.';
    case 'auth/network-request-failed': return 'Eroare de rețea. Verifică conexiunea.';
    case 'auth/invalid-email':       return 'Email invalid.';
    default:                         return 'Eroare la autentificare. Încearcă din nou.';
  }
}
