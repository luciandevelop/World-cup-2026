// ─── src/services/firebase.js ─────────────────────────────────────────────────
// Firebase initialisation — Auth + Firestore.
// Gracefully no-ops when env vars are absent (localStorage demo mode).
//
// AUTH MODES
//   FIREBASE_CONFIGURED = false → Demo (localStorage OTP, fake UID)
//   FIREBASE_CONFIGURED = true  → Real Firebase Auth + Firestore
//     Google  : signInWithPopup
//     Email   : createUserWithEmailAndPassword / signInWithEmailAndPassword
//               (standard Firebase Email/Password — no OTP, no stored passwords)
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

export const FIREBASE_CONFIGURED = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// ─── INIT ─────────────────────────────────────────────────────────────────────
let app  = null;
let auth = null;
let db   = null;

if (FIREBASE_CONFIGURED) {
  try {
    app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  } catch (e) {
    console.error('[Firebase] Init error:', e);
  }
}

export { auth, db };

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
export async function firebaseSignInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');
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
// Checks whether the account exists first so we can call the right method.
// Returns the same shape as firebaseSignInWithGoogle.
export async function firebaseSignInWithEmail(email, password) {
  if (!auth) throw new Error('Firebase not configured');

  const normalised = email.trim().toLowerCase();
  let firebaseUser;
  let isNewUser = false;

  // Try sign-in first. If the account doesn't exist yet, create it.
  // This avoids fetchSignInMethodsForEmail which is deprecated in Firebase 10+.
  try {
    const result = await signInWithEmailAndPassword(auth, normalised, password);
    firebaseUser  = result.user;
  } catch (signInErr) {
    if (
      signInErr.code === 'auth/user-not-found' ||
      signInErr.code === 'auth/invalid-credential' ||
      signInErr.code === 'auth/invalid-email' // first time, no account yet
    ) {
      // Account does not exist — create it
      try {
        const result = await createUserWithEmailAndPassword(auth, normalised, password);
        firebaseUser  = result.user;
        isNewUser     = true;
      } catch (createErr) {
        throw createErr; // e.g. weak-password — let caller handle
      }
    } else {
      throw signInErr; // wrong password, too-many-requests, etc.
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
  if (auth) await fbSignOut(auth);
}

// ─── AUTH STATE LISTENER ──────────────────────────────────────────────────────
export function onFirebaseAuthChange(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE RE-EXPORTS ─────────────────────────────────────────────────────
export {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
  writeBatch, getDocs,
};
