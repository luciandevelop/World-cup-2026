// ─── src/services/firestoreService.js ────────────────────────────────────────
// Central data layer: users, predictions, match results, leaderboard.
//
// Auto-mode:
//   FIREBASE_CONFIGURED = true  → reads/writes Firestore  (real multiplayer)
//   FIREBASE_CONFIGURED = false → reads/writes localStorage (solo/demo mode)
//
// ── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
//   users/          {uid}  → { uid, email, nickname, avatarId, createdAt, points }
//   predictions/    {uid_matchId} → { userId, matchId, scoreA, scoreB, possession, corners, ts }
//   matchResults/   {matchId}     → { matchId, realScoreA, realScoreB, realPossession, realCorners, liveMinute, liveStatus, updatedAt, updatedBy }
//
// ── SECURITY RULES (paste in Firebase Console → Firestore → Rules) ────────────
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /users/{uid} {
//         allow read: if request.auth != null;
//         allow write: if request.auth != null && request.auth.uid == uid;
//       }
//       match /predictions/{docId} {
//         allow read: if request.auth != null;
//         allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
//       }
//       match /matchResults/{matchId} {
//         allow read: if request.auth != null;
//         // Write only from admin (enforce via server-side in production or custom claims)
//         allow write: if request.auth != null;
//       }
//     }
//   }
// ─────────────────────────────────────────────────────────────────────────────

import {
  FIREBASE_CONFIGURED, db,
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp, getDocs,
} from './firebase.js';

// localStorage keys (fallback)
const LS_PROFILES    = 'wc2026_profile_';
const LS_PREDS       = 'wc2026_preds_';
const LS_RESULTS     = 'wc2026_admin_results';
const LS_ALL_PREDS   = 'wc2026_all_preds'; // all users' predictions for leaderboard

// ─── MODE INDICATOR ──────────────────────────────────────────────────────────
export const REALTIME_MODE = FIREBASE_CONFIGURED; // true = Firestore, false = localStorage

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function saveUserProfile(uid, profile) {
  const data = { uid, ...profile, updatedAt: FIREBASE_CONFIGURED ? serverTimestamp() : Date.now() };

  if (FIREBASE_CONFIGURED) {
    const ref  = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
    return { ...data };
  }

  // localStorage fallback
  const key      = LS_PROFILES + uid;
  const existing = JSON.parse(localStorage.getItem(key) || '{}');
  const merged   = { ...existing, ...data };
  localStorage.setItem(key, JSON.stringify(merged));

  // Also register nickname globally for leaderboard
  _registerNicknameLocal(uid, merged.nickname);
  return merged;
}

export async function getUserProfile(uid) {
  if (FIREBASE_CONFIGURED) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  }
  try { return JSON.parse(localStorage.getItem(LS_PROFILES + uid)); }
  catch { return null; }
}

// Check nickname uniqueness across all users
export async function checkNicknameAvailable(nick) {
  const lower = nick.toLowerCase();
  if (FIREBASE_CONFIGURED) {
    const q    = query(collection(db, 'users'), where('nicknameLower', '==', lower));
    const snap = await getDocs(q);
    return snap.empty;
  }
  // localStorage: check all profiles
  const taken = _getLocalNicknames();
  return !taken.includes(lower);
}

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

// Save one user's prediction for one match
export async function savePrediction(uid, matchId, pred) {
  const docId = `${uid}_${matchId}`;
  const data  = {
    userId:     uid,
    matchId:    Number(matchId),
    scoreA:     pred.scoreA,
    scoreB:     pred.scoreB,
    possession: pred.possession,
    corners:    pred.corners,
    ts:         FIREBASE_CONFIGURED ? serverTimestamp() : Date.now(),
  };

  if (FIREBASE_CONFIGURED) {
    await setDoc(doc(db, 'predictions', docId), data, { merge:true });
    return;
  }

  // localStorage: per-user predictions
  const key   = LS_PREDS + uid;
  const cur   = JSON.parse(localStorage.getItem(key) || '{}');
  cur[matchId] = pred;
  localStorage.setItem(key, JSON.stringify(cur));

  // Also persist to shared all-preds for leaderboard
  _saveToAllPreds(uid, matchId, pred);
}

// Load all predictions for a single user
export async function loadUserPredictions(uid) {
  if (FIREBASE_CONFIGURED) {
    const q    = query(collection(db, 'predictions'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const result = {};
    snap.forEach(d => {
      const data = d.data();
      result[data.matchId] = {
        scoreA: data.scoreA, scoreB: data.scoreB,
        possession: data.possession, corners: data.corners,
      };
    });
    return result;
  }
  try { return JSON.parse(localStorage.getItem(LS_PREDS + uid)) || {}; }
  catch { return {}; }
}

// Load ALL users' predictions (for leaderboard + friends tab)
export async function loadAllPredictions() {
  if (FIREBASE_CONFIGURED) {
    const snap = await getDocs(collection(db, 'predictions'));
    // Group by userId → matchId
    const byUser = {};
    snap.forEach(d => {
      const data = d.data();
      if (!byUser[data.userId]) byUser[data.userId] = {};
      byUser[data.userId][data.matchId] = {
        scoreA: data.scoreA, scoreB: data.scoreB,
        possession: data.possession, corners: data.corners,
      };
    });
    return byUser; // { uid: { matchId: pred } }
  }
  try { return JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}'); }
  catch { return {}; }
}

// Load all user profiles (for leaderboard nicknames)
export async function loadAllUsers() {
  if (FIREBASE_CONFIGURED) {
    const snap  = await getDocs(collection(db, 'users'));
    const users = {};
    snap.forEach(d => { users[d.id] = d.data(); });
    return users;
  }
  // localStorage: scan all profile keys
  const users = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PROFILES)) {
      try {
        const p = JSON.parse(localStorage.getItem(key));
        if (p?.uid) users[p.uid] = p;
      } catch {}
    }
  }
  return users;
}

// ─── MATCH RESULTS (admin writes, all users read) ─────────────────────────────

export async function saveMatchResult(adminUid, update) {
  const matchId = String(update.matchId);
  const data    = {
    matchId:        Number(matchId),
    realScoreA:     update.realScoreA,
    realScoreB:     update.realScoreB,
    realPossession: update.realPossession,
    realCorners:    update.realCorners,
    liveScoreA:     update.liveScoreA,
    liveScoreB:     update.liveScoreB,
    liveMinute:     update.liveMinute,
    liveStatus:     update.liveStatus,
    updatedBy:      adminUid,
    updatedAt:      FIREBASE_CONFIGURED ? serverTimestamp() : Date.now(),
  };

  if (FIREBASE_CONFIGURED) {
    await setDoc(doc(db, 'matchResults', matchId), data, { merge:true });
    return;
  }

  // localStorage fallback
  const cur = JSON.parse(localStorage.getItem(LS_RESULTS) || '{}');
  cur[update.matchId] = data;
  localStorage.setItem(LS_RESULTS, JSON.stringify(cur));
}

export async function loadMatchResults() {
  if (FIREBASE_CONFIGURED) {
    const snap    = await getDocs(collection(db, 'matchResults'));
    const results = {};
    snap.forEach(d => { const data = d.data(); results[data.matchId] = data; });
    return results;
  }
  try { return JSON.parse(localStorage.getItem(LS_RESULTS) || '{}'); }
  catch { return {}; }
}

// ─── REALTIME LISTENERS ───────────────────────────────────────────────────────
// Each returns an unsubscribe function.

// Listen for match result changes → triggers leaderboard/standings/bracket recalc
export function subscribeToMatchResults(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(collection(db, 'matchResults'), (snap) => {
      const results = {};
      snap.forEach(d => { const data = d.data(); results[data.matchId] = data; });
      callback(results);
    });
  }
  // localStorage: poll every 5 seconds (for multi-tab testing on same device)
  const tick = () => {
    try { callback(JSON.parse(localStorage.getItem(LS_RESULTS) || '{}')); } catch {}
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}

// Listen for prediction changes (for friends tab real-time updates)
export function subscribeToPredictions(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(collection(db, 'predictions'), (snap) => {
      const byUser = {};
      snap.forEach(d => {
        const data = d.data();
        if (!byUser[data.userId]) byUser[data.userId] = {};
        byUser[data.userId][data.matchId] = {
          scoreA: data.scoreA, scoreB: data.scoreB,
          possession: data.possession, corners: data.corners,
        };
      });
      callback(byUser);
    });
  }
  // localStorage: no multi-device sync, return current snapshot once
  try { callback(JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}')); } catch {}
  return () => {};
}

// Listen for user profile changes (nickname, avatar, points)
export function subscribeToUsers(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const users = {};
      snap.forEach(d => { users[d.id] = d.data(); });
      callback(users);
    });
  }
  try { callback(_loadLocalUsers()); } catch {}
  return () => {};
}

function _loadLocalUsers() {
  const users = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PROFILES)) {
      try {
        const p = JSON.parse(localStorage.getItem(key));
        if (p?.uid) users[p.uid] = p;
      } catch {}
    }
  }
  return users;
}

// ─── LOCALHOST HELPERS ────────────────────────────────────────────────────────

function _registerNicknameLocal(uid, nickname) {
  if (!nickname) return;
  const key  = 'wc2026_nicknames';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const entry = { uid, nickname: nickname.toLowerCase() };
  const idx   = list.findIndex(x => x.uid === uid);
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  localStorage.setItem(key, JSON.stringify(list));
}

function _getLocalNicknames() {
  try {
    const list = JSON.parse(localStorage.getItem('wc2026_nicknames') || '[]');
    return list.map(x => x.nickname.toLowerCase());
  } catch { return []; }
}

function _saveToAllPreds(uid, matchId, pred) {
  const all = JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}');
  if (!all[uid]) all[uid] = {};
  all[uid][matchId] = pred;
  localStorage.setItem(LS_ALL_PREDS, JSON.stringify(all));
}
