// ─── src/services/authService.js ──────────────────────────────────────────────
// Authentication service.
// Currently uses localStorage mock for demo. 
// PRODUCTION SETUP:
//   1. npm install firebase
//   2. Create Firebase project → enable Google + Apple auth
//   3. Replace mock functions below with real Firebase SDK calls
//   4. Set VITE_FIREBASE_* env vars
// ─────────────────────────────────────────────────────────────────────────────

// ─── MOCK IMPLEMENTATION ──────────────────────────────────────────────────────
// These simulate Firebase Auth behavior using localStorage.

export async function signInWithGoogle() {
  // PRODUCTION: 
  //   import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
  //   const auth = getAuth();
  //   const provider = new GoogleAuthProvider();
  //   const result = await signInWithPopup(auth, provider);
  //   return { uid: result.user.uid, email: result.user.email, name: result.user.displayName, photoURL: result.user.photoURL };
  
  // Mock: simulate Google login
  return new Promise(resolve => {
    setTimeout(() => resolve({
      uid:      "mock_google_" + Math.random().toString(36).slice(2),
      email:    "user@gmail.com",
      name:     "Radu Popescu",
      photoURL: null,
      provider: "google",
    }), 1200);
  });
}

export async function signInWithApple() {
  // PRODUCTION:
  //   import { getAuth, signInWithPopup, OAuthProvider } from 'firebase/auth';
  //   const auth = getAuth();
  //   const provider = new OAuthProvider('apple.com');
  //   const result = await signInWithPopup(auth, provider);
  //   return { uid: result.user.uid, email: result.user.email, name: result.user.displayName };
  
  return new Promise(resolve => {
    setTimeout(() => resolve({
      uid:      "mock_apple_" + Math.random().toString(36).slice(2),
      email:    "user@icloud.com",
      name:     "Utilizator Apple",
      photoURL: null,
      provider: "apple",
    }), 1200);
  });
}

export function signOut() {
  // PRODUCTION: import { getAuth } from 'firebase/auth'; getAuth().signOut();
  localStorage.removeItem("wc2026_session");
}

export function getPersistedSession() {
  const raw = localStorage.getItem("wc2026_session");
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function persistSession(user) {
  localStorage.setItem("wc2026_session", JSON.stringify(user));
}

// ─── NICKNAME SERVICE ─────────────────────────────────────────────────────────
export async function checkNicknameAvailable(nick, takenList) {
  // PRODUCTION: Query Supabase `profiles` table: SELECT 1 FROM profiles WHERE lower(nickname) = lower($1)
  return new Promise(resolve => {
    setTimeout(() => {
      const taken = takenList.map(n => n.toLowerCase());
      resolve(!taken.includes(nick.toLowerCase()));
    }, 500);
  });
}

export async function saveUserProfile(uid, profile) {
  // PRODUCTION: INSERT INTO profiles (uid, nickname, avatar_config, created_at) VALUES (...)
  const key = `wc2026_profile_${uid}`;
  localStorage.setItem(key, JSON.stringify(profile));
  return profile;
}

export async function getUserProfile(uid) {
  const key = `wc2026_profile_${uid}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
