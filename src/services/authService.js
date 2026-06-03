// ─── src/services/authService.js ──────────────────────────────────────────────
// Auth service — Firebase only. NO demo mode. NO fake users.
// Every function throws or returns an error if Firebase is not configured.
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

export { sendEmailCode, verifyEmailCode, onFirebaseAuthChange, FIREBASE_CONFIGURED };

const SESSION_KEY = 'wc2026_session';

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
// Throws if Firebase is not configured — caller must handle the error.
export async function signInWithGoogle() {
  if (!FIREBASE_CONFIGURED) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return firebaseSignInWithGoogle();
}

export async function signInWithApple() {
  throw new Error('coming_soon');
}

// ─── SIGN-OUT ─────────────────────────────────────────────────────────────────
// Always calls Firebase signOut (throws if not configured, which is fine —
// if Firebase isn't configured there's no session to clear).
// Also clears the localStorage cache.
export async function signOut() {
  try {
    await firebaseSignOut();
  } catch {
    // Ignore — if Firebase isn't configured there's nothing to sign out from.
  }
  localStorage.removeItem(SESSION_KEY);
}

// ─── SESSION CACHE ────────────────────────────────────────────────────────────
// localStorage is ONLY used as a read-cache to avoid a flash on refresh.
// It is NOT an authentication gate. The real gate is onFirebaseAuthChange.
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
export async function checkNicknameAvailable(nick) {
  return fssCheckNick(nick);
}
