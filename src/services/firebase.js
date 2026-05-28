// ─── src/services/firebase.js ─────────────────────────────────────────────────
// Firebase initialisation + real Google Authentication.
// Falls back gracefully when env vars are not set (dev / demo mode).
//
// TO ACTIVATE:
//   1. npm install firebase  (already in package.json)
//   2. Create a Firebase project → enable Google Sign-In provider
//   3. Copy .env.example → .env and fill in your values
//   4. On Vercel: add the same env vars in Project Settings → Environment Variables
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
export const FIREBASE_CONFIGURED = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

// ─── INIT (lazy — only if configured) ────────────────────────────────────────
let app = null;
let auth = null;

if (FIREBASE_CONFIGURED) {
  app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Persist auth across browser sessions
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { auth };

// ─── REAL GOOGLE SIGN-IN ──────────────────────────────────────────────────────
export async function firebaseSignInWithGoogle() {
  if (!FIREBASE_CONFIGURED || !auth) {
    throw new Error('Firebase not configured');
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  const u = result.user;
  return {
    uid:      u.uid,
    email:    u.email,
    name:     u.displayName,
    photoURL: u.photoURL,
    provider: 'google',
  };
}

// ─── REAL SIGN-OUT ────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  if (auth) await fbSignOut(auth);
}

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
// Returns unsubscribe function. Callback receives Firebase user or null.
export function onFirebaseAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
