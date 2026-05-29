// ─── src/services/emailAuth.js ────────────────────────────────────────────────
// Email-based passwordless authentication.
//
// CURRENT MODE: Demo/local simulation.
//   - Generates a 6-digit code and stores it in localStorage.
//   - Simulates a 1-second "send" delay.
//   - In demo mode the code is revealed in the UI for testing (no real email).
//
// ── TO CONNECT FIREBASE EMAIL LINK AUTH ──────────────────────────────────────
//   1. In Firebase console: Authentication → Sign-in providers → Email/Password
//      → Email link (passwordless) → Enable
//   2. npm install firebase (already in package.json)
//   3. In this file, uncomment the FIREBASE block in sendEmailCode()
//   4. Set VITE_FIREBASE_* vars in .env
//   Reference: https://firebase.google.com/docs/auth/web/email-link-auth
//
// ── TO CONNECT SUPABASE MAGIC LINK ───────────────────────────────────────────
//   1. npm install @supabase/supabase-js
//   2. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
//   3. Uncomment the SUPABASE block in sendEmailCode()
//   Reference: https://supabase.com/docs/guides/auth/auth-magic-link
// ─────────────────────────────────────────────────────────────────────────────

const CODE_KEY    = 'wc2026_email_code';
const CODE_EMAIL  = 'wc2026_code_email';
const CODE_EXPIRY = 'wc2026_code_expiry';
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Generate a cryptographically random 6-digit code
function generateCode() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

// ─── SEND CODE ────────────────────────────────────────────────────────────────
// Returns { success, code (demo only), error }
export async function sendEmailCode(email) {
  const normalised = email.trim().toLowerCase();
  if (!normalised || !normalised.includes('@')) {
    return { success:false, error:'Email invalid.' };
  }

  const code = generateCode();

  // ── FIREBASE EMAIL LINK (uncomment to activate) ───────────────────────────
  // import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
  // const actionCodeSettings = {
  //   url: window.location.origin + '/?email=' + encodeURIComponent(normalised),
  //   handleCodeInApp: true,
  // };
  // await sendSignInLinkToEmail(getAuth(), normalised, actionCodeSettings);
  // window.localStorage.setItem('wc2026_emailForSignIn', normalised);
  // return { success:true };

  // ── SUPABASE MAGIC LINK (uncomment to activate) ───────────────────────────
  // import { createClient } from '@supabase/supabase-js';
  // const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  // const { error } = await supabase.auth.signInWithOtp({ email: normalised });
  // if (error) return { success:false, error: error.message };
  // return { success:true };

  // ── DEMO MODE: store code locally ─────────────────────────────────────────
  localStorage.setItem(CODE_KEY,    code);
  localStorage.setItem(CODE_EMAIL,  normalised);
  localStorage.setItem(CODE_EXPIRY, String(Date.now() + CODE_TTL_MS));

  // Simulate network delay
  await new Promise(r => setTimeout(r, 900));

  // Return code so demo UI can show it (remove this in production!)
  return { success:true, demoCode:code };
}

// ─── VERIFY CODE ──────────────────────────────────────────────────────────────
// Returns { success, uid, email, error }
export async function verifyEmailCode(email, inputCode) {
  const normalised = email.trim().toLowerCase();
  const stored     = localStorage.getItem(CODE_KEY);
  const storedEmail= localStorage.getItem(CODE_EMAIL);
  const expiry     = Number(localStorage.getItem(CODE_EXPIRY) || '0');

  if (!stored) return { success:false, error:'Niciun cod activ. Trimite din nou.' };
  if (Date.now() > expiry) {
    clearCode();
    return { success:false, error:'Codul a expirat. Trimite din nou.' };
  }
  if (storedEmail !== normalised) return { success:false, error:'Email diferit de cel folosit la trimitere.' };
  if (inputCode.trim() !== stored) return { success:false, error:'Cod incorect. Încearcă din nou.' };

  clearCode();

  // Generate stable UID from email (deterministic for same device — not globally unique)
  // PRODUCTION: replace with Firebase/Supabase UID
  const uid = 'email_' + btoa(normalised).replace(/[^a-zA-Z0-9]/g,'').slice(0,16);

  await new Promise(r => setTimeout(r, 400));
  return { success:true, uid, email:normalised, name: normalised.split('@')[0], provider:'email' };
}

function clearCode() {
  localStorage.removeItem(CODE_KEY);
  localStorage.removeItem(CODE_EMAIL);
  localStorage.removeItem(CODE_EXPIRY);
}
