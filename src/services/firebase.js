// ─── src/services/firebase.js ─────────────────────────────────────────────────
// Firebase initialisation — Auth + Firestore.
// NO demo mode. NO fallbacks. NO fake users.
// If env vars are missing the app shows a config error and stops.
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
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
  app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}

export { auth, db };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function requireAuth() {
  if (!auth) throw new Error('FIREBASE_NOT_CONFIGURED');
}

// ─── GOOGLE SIGN-IN (redirect — works on all browsers including mobile) ───────
// Step 1: call this to start the redirect flow.
export async function firebaseSignInWithGoogle() {
  requireAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  // signInWithRedirect navigates away; result is picked up on return via
  // firebaseGetRedirectResult() called once at app startup.
  await signInWithRedirect(auth, provider);
  // This line is never reached — the page redirects.
  return null;
}

// Step 2: call this once on app load to pick up the result after redirect.
// Returns the user object if returning from Google, or null otherwise.
export async function firebaseGetRedirectResult() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return {
      uid:      result.user.uid,
      email:    result.user.email,
      name:     result.user.displayName,
      photoURL: result.user.photoURL,
      provider: 'google',
    };
  } catch (e) {
    console.error('Redirect result error:', e);
    return null;
  }
}

// ─── EMAIL / PASSWORD SIGN-IN ─────────────────────────────────────────────────
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
      const result = await createUserWithEmailAndPassword(auth, normalised, password);
      firebaseUser  = result.user;
      isNewUser     = true;
    } else {
      throw signInErr;
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
export function onFirebaseAuthChange(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ─── FIRESTORE RE-EXPORTS ─────────────────────────────────────────────────────
export {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp,
  writeBatch, getDocs,
};
