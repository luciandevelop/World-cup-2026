// ─── src/services/authService.js ──────────────────────────────────────────────
// Auth service — email OTP (primary) + Google (secondary).
// Profile reads/writes route through firestoreService (Firestore ↔ localStorage).
// ─────────────────────────────────────────────────────────────────────────────

import {
  FIREBASE_CONFIGURED,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  onFirebaseAuthChange,
} from './firebase.js';
import { sendEmailCode, verifyEmailCode } from './emailAuth.js';
import {
  saveUserProfile   as fssSaveProfile,
  getUserProfile    as fssGetProfile,
  checkNicknameAvailable as fssCheckNick,
} from './firestoreService.js';

export { sendEmailCode, verifyEmailCode, onFirebaseAuthChange };
export { FIREBASE_CONFIGURED };

const SESSION_KEY = 'wc2026_session';

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (FIREBASE_CONFIGURED) return firebaseSignInWithGoogle();
  return new Promise(resolve => setTimeout(() => resolve({
    uid:'demo_' + Math.random().toString(36).slice(2,8),
    email:'demo@worldcup2026.app', name:'Demo User', photoURL:null, provider:'google',
  }), 900));
}

export async function signInWithApple() { throw new Error('coming_soon'); }

// ─── SIGN-OUT ─────────────────────────────────────────────────────────────────
export async function signOut() {
  if (FIREBASE_CONFIGURED) await firebaseSignOut();
  localStorage.removeItem(SESSION_KEY);
}

// ─── SESSION ─────────────────────────────────────────────────────────────────
export function getPersistedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function persistSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// ─── PROFILE (routes to Firestore or localStorage via firestoreService) ───────
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
// Uses Firestore query when configured, local nickname list otherwise.
export async function checkNicknameAvailable(nick, _takenList) {
  return fssCheckNick(nick);
}
