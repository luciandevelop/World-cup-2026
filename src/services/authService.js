// ─── src/services/authService.js ──────────────────────────────────────────────
// Uses REAL Firebase Auth when VITE_FIREBASE_* env vars are set.
// Falls back to localStorage mock when running without Firebase (demo mode).
// ─────────────────────────────────────────────────────────────────────────────

import {
  FIREBASE_CONFIGURED,
  firebaseSignInWithGoogle,
  firebaseSignOut,
  onFirebaseAuthChange,
} from './firebase.js';

const SESSION_KEY    = 'wc2026_session';
const PROFILE_PREFIX = 'wc2026_profile_';

export { onFirebaseAuthChange };

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (FIREBASE_CONFIGURED) {
    return firebaseSignInWithGoogle();
  }
  // Demo fallback — simulates real flow
  return new Promise(resolve => {
    setTimeout(() => resolve({
      uid:      'demo_' + Math.random().toString(36).slice(2, 8),
      email:    'demo@worldcup2026.app',
      name:     'Demo User',
      photoURL: null,
      provider: 'google',
    }), 900);
  });
}

// ─── APPLE (coming soon) ──────────────────────────────────────────────────────
export async function signInWithApple() {
  throw new Error('coming_soon');
}

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

// ─── NICKNAME ─────────────────────────────────────────────────────────────────
export async function checkNicknameAvailable(nick, takenList) {
  return new Promise(resolve =>
    setTimeout(() => resolve(!takenList.map(n => n.toLowerCase()).includes(nick.toLowerCase())), 400)
  );
}

// ─── PROFILE (localStorage — swap for Firestore in production) ────────────────
export async function saveUserProfile(uid, profile) {
  const existing = await getUserProfile(uid) || {};
  const merged   = { ...existing, ...profile, updatedAt: Date.now() };
  localStorage.setItem(PROFILE_PREFIX + uid, JSON.stringify(merged));
  return merged;
}
export async function getUserProfile(uid) {
  try { return JSON.parse(localStorage.getItem(PROFILE_PREFIX + uid)); } catch { return null; }
}
export async function updateUserAvatar(uid, avatarId) {
  return saveUserProfile(uid, { avatarId });
}
