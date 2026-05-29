// ─── src/services/firebase.js ─────────────────────────────────────────────────
// Firebase initialisation — Auth + Firestore.
// Falls back gracefully when env vars are not set (localStorage demo mode).
//
// ── SETUP GUIDE ──────────────────────────────────────────────────────────────
//   1. firebase.google.com → create project
//   2. Enable: Authentication (Email/Password + Google) + Firestore Database
//   3. Copy .env.example → .env  and fill in VITE_FIREBASE_* values
//   4. On Vercel: Project Settings → Environment Variables → add same keys
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  signOut as fbSignOut, onAuthStateChanged, browserLocalPersistence, setPersistence,
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
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
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

// ─── INIT ────────────────────────────────────────────────────────────────────
let app  = null;
let auth = null;
let db   = null;

if (FIREBASE_CONFIGURED) {
  app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { auth, db };

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
export async function firebaseSignInWithGoogle() {
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  provider.addScope('profile'); provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  return { uid:result.user.uid, email:result.user.email, name:result.user.displayName, photoURL:result.user.photoURL, provider:'google' };
}

export async function firebaseSignOut() {
  if (auth) await fbSignOut(auth);
}

export function onFirebaseAuthChange(callback) {
  if (!auth) { callback(null); return () => {}; }
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
// Re-export what firestoreService.js needs, so only firebase.js imports from firebase SDK.
export {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
  writeBatch, getDocs,
};
