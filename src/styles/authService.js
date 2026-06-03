// ─── src/services/authService.js ──────────────────────────────────────────────
// Auth service — routes to Firebase or demo mode based on FIREBASE_CONFIGURED.
// All other files import from here, never from firebase.js directly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  FIREBASE_CONFIGURED,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  onFirebaseAuthChange,
} from './firebase.js';
import { sendEmailCode, verifyEmailCode } from './emailAuth.js';
import {
  saveUserProfile as fssSaveProfile,
  getUserProfile  as fssGetProfile,
  checkNicknameAvailable as fssCheckNick,
} from './firestoreService.js';

// Re-export for AuthScreens usage
export { sendEmailCode, verifyEmailCode, onFirebaseAuthChange, FIREBASE_CONFIGURED };

const SESSION_KEY = 'wc2026_session';

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (FIREBASE_CONFIGURED) return firebaseSignInWithGoogle();
  // Demo fallback
  return new Promise(resolve => setTimeout(() => resolve({
    uid: 'demo_' + Math.random().toString(36).slice(2, 8),
    email: 'demo@worldcup2026.app',
    name: 'Demo User',
    photoURL: null,
    provider: 'google',
  }), 900));
}

export async function signInWithApple() {
  throw new Error('coming_soon');
}

// ─── SIGN-OUT ─────────────────────────────────────────────────────────────────
export async function signOut() {
  if (FIREBASE_CONFIGURED) await firebaseSignOut();
  localStorage.removeItem(SESSION_KEY);
}

// ─── SESSION ─────────────────────────────────────────────────────────────────
// localStorage session is the fallback / cache for non-Firebase mode.
// In Firebase mode, onFirebaseAuthChange is the source of truth.
export function getPersistedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function persistSession(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export async function saveUserProfile(uid, profile) {
  return fssSaveProfile(uid, profile);
}

export async function getUserProfile(uid) {
  return fssGetProfile(uid);
}

export async function updateUserAvatar(uid, avatarId) {
  return fssSaveProfile(uid, { avatarId });
}

// ─── NICKNAME CHECK ───────────────────────────────────────────────────────────
export async function checkNicknameAvailable(nick, _takenList) {
  return fssCheckNick(nick);
}
