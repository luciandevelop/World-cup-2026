// ─── src/services/firebase.js ─────────────────────────────────────────────────
// Firebase initialisation — Auth + Firestore.
// NO demo mode. NO fallbacks. NO fake users.
// If env vars are missing the app shows a config error and stops.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
  writeBatch, getDocs,
} from 'firebase/firestore';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when all required env vars are present.
// Components read this to decide whether to show a config-error screen.
export const FIREBASE_CONFIGURED = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// ─── INIT ─────────────────────────────────────────────────────────────────────
// Throws at startup if config is present but invalid (malformed key, etc.).
// If config is absent entirely, auth/db remain null and every function
// below throws "Firebase not configured" — which surfaces as a UI error.
let app  = null;
let auth = null;
let db   = null;

if (FIREBASE_CONFIGURED) {
  app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
  // Persist auth token in localStorage so the user stays logged in after refresh.
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { auth, db };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function requireAuth() {
  if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');
}

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
export async function firebaseSignInWithGoogle() {
  requireAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  return {
    uid:      result.user.uid,
    email:    result.user.email,
    name:     result.user.displayName,
    photoURL: result.user.photoURL,
    provider: 'google',
  };
}

// ─── EMAIL / PASSWORD SIGN-IN ─────────────────────────────────────────────────
// Tries signIn first; falls back to createUser on auth/user-not-found.
// This avoids the deprecated fetchSignInMethodsForEmail.
export async function firebaseSignInWithEmail(email, password) {
  requireAuth();
  const normalised = email.trim().toLowerCase();
  let firebaseUser;
  let isNewUser = false;

  try {
    const result = await signInWithEmailAndPassword(auth, normalised, password);
    firebaseUser  = result.user;
  } catch (signInErr) {
    if (
      signInErr.code === 'auth/user-not-found' ||
      signInErr.code === 'auth/invalid-credential'
    ) {
      // No account yet — create one with this password.
      const result = await createUserWithEmailAndPassword(auth, normalised, password);
      firebaseUser  = result.user;
      isNewUser     = true;
    } else {
      throw signInErr; // wrong password, too-many-requests, etc. — caller handles
    }
  }

  return {
    uid:      firebaseUser.uid,
    email:    firebaseUser.email,
    name:     firebaseUser.displayName || normalised.split('@')[0],
    photoURL: null,
    provider: 'email',
    isNewUser,
  };
}

// ─── SIGN-OUT ─────────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  requireAuth();
  await fbSignOut(auth);
}

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
// Calls callback(firebaseUser) whenever auth state changes.
// If Firebase is not configured, callback is never called — the app stays
// on the login screen showing a config-error message.
export function onFirebaseAuthChange(callback) {
  if (!auth) return () => {}; // no-op unsubscribe — login screen handles the error UI
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE RE-EXPORTS ─────────────────────────────────────────────────────
export {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
  writeBatch, getDocs,
};
