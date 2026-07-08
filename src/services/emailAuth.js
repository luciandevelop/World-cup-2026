// ─── src/services/emailAuth.js ────────────────────────────────────────────────
// Email/password authentication via Firebase Auth only.
// NO demo codes. NO localStorage OTP. NO fake UIDs.
// If Firebase is not configured, every function returns an error.
// ─────────────────────────────────────────────────────────────────────────────

import { FIREBASE_CONFIGURED, firebaseSignInWithEmail } from './firebase.js';
import { auth } from './firebase.js';
import { sendPasswordResetEmail } from 'firebase/auth';

// ─── SEND "CODE" ──────────────────────────────────────────────────────────────
// Firebase mode: signals the UI to show a password field (not a code field).
// No config:     returns an error — login is blocked.
export async function sendEmailCode(email) {
  if (!FIREBASE_CONFIGURED) {
    return { success: false, error: 'Firebase nu este configurat. Contactează administratorul.' };
  }

  const normalised = email.trim().toLowerCase();
  if (!normalised || !normalised.includes('@')) {
    return { success: false, error: 'Email invalid.' };
  }

  // Tell the UI to switch from the "enter code" step to the "enter password" step.
  return { success: true, usePassword: true };
}

// ─── VERIFY / SIGN IN ────────────────────────────────────────────────────────
// In password mode, `input` is the user's password.
// Calls Firebase signInWithEmailAndPassword (or createUser on first login).
// No config: returns an error.
export async function verifyEmailCode(email, input) {
  if (!FIREBASE_CONFIGURED) {
    return { success: false, error: 'Firebase nu este configurat. Contactează administratorul.' };
  }

  if (!input || input.length < 6) {
    return { success: false, error: 'Parola trebuie să aibă cel puțin 6 caractere.' };
  }

  try {
    const user = await firebaseSignInWithEmail(email.trim().toLowerCase(), input);
    return { success: true, ...user };
  } catch (e) {
    return { success: false, error: _translateAuthError(e.code) };
  }
}

function _translateAuthError(code) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Parolă incorectă. Încearcă din nou.';
    case 'auth/user-not-found':        return 'Nu există cont cu acest email.';
    case 'auth/email-already-in-use':  return 'Email deja înregistrat. Folosește parola existentă.';
    case 'auth/weak-password':         return 'Parola trebuie să aibă cel puțin 6 caractere.';
    case 'auth/too-many-requests':     return 'Prea multe încercări. Încearcă mai târziu.';
    case 'auth/network-request-failed':return 'Eroare de rețea. Verifică conexiunea.';
    case 'auth/invalid-email':         return 'Email invalid.';
    case 'FIREBASE_NOT_CONFIGURED':    return 'Firebase nu este configurat. Contactează administratorul.';
    default:                           return 'Eroare la autentificare. Încearcă din nou.';
  }
}

export async function sendPasswordReset(email) {
  if (!FIREBASE_CONFIGURED || !auth) return { success: false, error: 'Firebase nu este configurat.' };
  const normalised = (email || '').trim().toLowerCase();
  if (!normalised || !normalised.includes('@')) return { success: false, error: 'Email invalid.' };
  try {
    await sendPasswordResetEmail(auth, normalised);
    return { success: true };
  } catch(e) {
    const code = e.code || '';
    if (code === 'auth/user-not-found')    return { success: false, error: 'Nu există cont cu acest email.' };
    if (code === 'auth/invalid-email')     return { success: false, error: 'Email invalid.' };
    if (code === 'auth/too-many-requests') return { success: false, error: 'Prea multe cereri. Încearcă mai târziu.' };
    return { success: false, error: 'Eroare la trimiterea emailului.' };
  }
}
