// ─── src/services/firestoreService.js ────────────────────────────────────────
// Central data layer: users · predictions · match results.
//
// Auto-switch:
//   FIREBASE_CONFIGURED = true  → Firestore (real, multi-device)
//   FIREBASE_CONFIGURED = false → localStorage (demo / offline)
//
// COLLECTIONS
//   users/{uid}
//     uid, email, nickname, nicknameLower, avatarId, isAdmin,
//     createdAt (Timestamp), updatedAt (Timestamp)
//
//   predictions/{matchId}_{uid}         ← spec doc id format
//     uid, matchId (Number),
//     scoreA, scoreB, possession, corners,
//     createdAt (Timestamp), updatedAt (Timestamp)
//
//   results/{matchId}
//     matchId (Number), homeScore, awayScore,
//     homePossession, awayPossession, homeCorners, awayCorners,
//     liveStatus, updatedAt (Timestamp), updatedBy (uid)
//     (legacy aliases realScoreA/B, liveScoreA/B also present for compat)
// ─────────────────────────────────────────────────────────────────────────────

import {
  FIREBASE_CONFIGURED, db,
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp, getDocs,
} from './firebase.js';

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_PROFILES  = 'wc2026_profile_';
const LS_PREDS     = 'wc2026_preds_';
const LS_RESULTS   = 'wc2026_admin_results';
const LS_ALL_PREDS = 'wc2026_all_preds';

export const REALTIME_MODE = FIREBASE_CONFIGURED;

// ─── RESULT NORMALIZER ────────────────────────────────────────────────────────
function normalizeResult(raw = {}) {
  const matchId   = raw.matchId != null ? Number(raw.matchId) : raw.id != null ? Number(raw.id) : null;
  const status    = String(raw.liveStatus || raw.status || raw.matchStatus || '').toLowerCase();
  const homeScore = raw.homeScore  ?? raw.realScoreA ?? raw.liveScoreA ?? null;
  const awayScore = raw.awayScore  ?? raw.realScoreB ?? raw.liveScoreB ?? null;
  const homePoss  = raw.homePossession ?? raw.realPossession ?? null;
  const awayPoss  = raw.awayPossession ?? (homePoss != null ? 100 - Number(homePoss) : null);
  const homeCorn  = raw.homeCorners ?? null;
  const awayCorn  = raw.awayCorners ?? null;
  const realCorn  = raw.realCorners ?? (homeCorn != null && awayCorn != null ? Number(homeCorn) + Number(awayCorn) : null);
  return {
    ...raw, matchId,
    homeScore:      homeScore != null ? Number(homeScore) : null,
    awayScore:      awayScore != null ? Number(awayScore) : null,
    realScoreA:     homeScore != null ? Number(homeScore) : null,
    realScoreB:     awayScore != null ? Number(awayScore) : null,
    liveScoreA:     raw.liveScoreA ?? (homeScore != null ? Number(homeScore) : null),
    liveScoreB:     raw.liveScoreB ?? (awayScore != null ? Number(awayScore) : null),
    liveStatus:     status,
    homePossession: homePoss != null ? Number(homePoss) : null,
    awayPossession: awayPoss != null ? Number(awayPoss) : null,
    realPossession: homePoss != null ? Number(homePoss) : null,
    homeCorners:    homeCorn != null ? Number(homeCorn) : null,
    awayCorners:    awayCorn != null ? Number(awayCorn) : null,
    realCorners:    realCorn != null ? Number(realCorn) : null,
  };
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function saveUserProfile(uid, profile) {
  const now  = FIREBASE_CONFIGURED ? serverTimestamp() : Date.now();

  // Strip isAdmin — this field is ONLY set via Firebase Console or a trusted
  // server script. No client call to saveUserProfile may elevate privileges.
  // The Firestore rules enforce this at the server side too, but we strip it
  // here as defence-in-depth so the write doesn't even attempt the forbidden field.
  const { isAdmin: _stripped, ...safeProfile } = profile || {};

  const dataRaw = {
    uid,
    ...safeProfile,
    nicknameLower: safeProfile?.nickname
      ? safeProfile.nickname.toLowerCase()
      : (safeProfile?.nicknameLower ?? undefined),
    updatedAt: now,
  };
  // Strip undefined values — Firestore updateDoc rejects them
  const data = Object.fromEntries(Object.entries(dataRaw).filter(([, v]) => v !== undefined));

  if (FIREBASE_CONFIGURED) {
    const ref  = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
    return data;
  }

  const key      = LS_PROFILES + uid;
  const existing = JSON.parse(localStorage.getItem(key) || '{}');
  const merged   = { ...existing, ...data };
  localStorage.setItem(key, JSON.stringify(merged));
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

export async function checkNicknameAvailable(nick) {
  const lower = nick.toLowerCase();
  if (FIREBASE_CONFIGURED) {
    const q    = query(collection(db, 'users'), where('nicknameLower', '==', lower));
    const snap = await getDocs(q);
    return snap.empty;
  }
  return !_getLocalNicknames().includes(lower);
}

export async function loadAllUsers() {
  if (FIREBASE_CONFIGURED) {
    const snap  = await getDocs(collection(db, 'users'));
    const users = {};
    snap.forEach(d => { users[d.id] = d.data(); });
    return users;
  }
  return _loadLocalUsers();
}

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

export async function savePrediction(uid, matchId, pred) {
  // Document id: {matchId}_{uid}  ← per spec
  const docId = `${matchId}_${uid}`;
  const now   = FIREBASE_CONFIGURED ? serverTimestamp() : Date.now();
  const data  = {
    uid,
    matchId:    Number(matchId),
    scoreA:     pred.scoreA     ?? null,
    scoreB:     pred.scoreB     ?? null,
    possession: pred.possession ?? null,
    corners:    pred.corners    ?? null,
    updatedAt:  now,
  };
  // BUGFIX: usedJoker was being silently dropped here — it was sent correctly
  // by PredictionModal but never written to Firestore, so the joker was lost
  // on every refresh/reload for everyone (including the player who set it).
  // Only include the field when present, so old predictions without it are
  // completely unaffected (no false usedJoker:false gets written over old docs
  // that simply never had the concept).
  if (pred.usedJoker !== undefined) {
    data.usedJoker = pred.usedJoker === true;
  }

  if (FIREBASE_CONFIGURED) {
    const ref  = doc(db, 'predictions', docId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    }
    return;
  }

  const key = LS_PREDS + uid;
  const cur = JSON.parse(localStorage.getItem(key) || '{}');
  cur[matchId] = pred;
  localStorage.setItem(key, JSON.stringify(cur));
  _saveToAllPreds(uid, matchId, pred);
}

// ─── TEMPORARY ADMIN REPAIR (one-time use) ────────────────────────────────────
// EMERGENCY FIX: sets usedJoker:true on an EXISTING prediction document. Does
// NOT create a new prediction, does NOT touch scoreA/scoreB/possession/corners,
// does NOT touch scoring logic — purely flips the one field that was being
// silently dropped before the savePrediction bugfix above. Throws clearly if
// the target document doesn't exist, so it can never accidentally fabricate
// a prediction the player never actually made.
export async function adminRepairSetJoker(uid, matchId) {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase nu este configurat — nimic de reparat.');
  const docId = `${matchId}_${uid}`;
  const ref = doc(db, 'predictions', docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error(`Nu există predicție salvată pentru acest utilizator la meciul ${matchId} (doc ${docId} nu există).`);
  }
  await updateDoc(ref, { usedJoker: true });
  return true;
}

export async function loadUserPredictions(uid) {
  if (FIREBASE_CONFIGURED) {
    // Primary query: new docs use 'uid' field
    // Compat query: old docs (written with userId) — handles data from previous deploys
    const [snap1, snap2] = await Promise.all([
      getDocs(query(collection(db, 'predictions'), where('uid',    '==', uid))),
      getDocs(query(collection(db, 'predictions'), where('userId', '==', uid))),
    ]);
    const result = {};
    const toResult = (d) => {
      const data = d.data();
      result[data.matchId] = {
        scoreA:     data.scoreA,
        scoreB:     data.scoreB,
        possession: data.possession,
        corners:    data.corners,
        // BUGFIX: usedJoker was missing here — pass through whatever Firestore
        // has (undefined for old docs, true/false for new ones written after
        // the savePrediction fix above).
        ...(data.usedJoker !== undefined ? { usedJoker: data.usedJoker } : {}),
      };
    };
    snap1.forEach(toResult);
    snap2.forEach(toResult);
    return result;
  }
  try { return JSON.parse(localStorage.getItem(LS_PREDS + uid)) || {}; }
  catch { return {}; }
}

export async function loadAllPredictions() {
  if (FIREBASE_CONFIGURED) {
    const snap   = await getDocs(collection(db, 'predictions'));
    const byUser = {};
    snap.forEach(d => {
      const data  = d.data();
      const owner = data.uid || data.userId; // compat
      if (!owner) return;
      if (!byUser[owner]) byUser[owner] = {};
      byUser[owner][data.matchId] = {
        scoreA:     data.scoreA,
        scoreB:     data.scoreB,
        possession: data.possession,
        corners:    data.corners,
        // BUGFIX (critical): usedJoker was missing here — this is the exact
        // reason Friends predictions and Player Detail modal never showed the
        // 🔥 JOKER ×2 badge for anyone, even when it was correctly set in the
        // modal and even after the Firestore write was fixed above. Reading
        // code must also include the field, or it gets silently dropped here.
        ...(data.usedJoker !== undefined ? { usedJoker: data.usedJoker } : {}),
      };
    });
    return byUser;
  }
  try { return JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}'); }
  catch { return {}; }
}

// ─── MATCH RESULTS ────────────────────────────────────────────────────────────

export async function saveMatchResult(adminUid, update) {
  const matchId    = String(update.matchId);
  const normalized = normalizeResult({ ...update, matchId: Number(matchId), updatedBy: adminUid });
  const now        = FIREBASE_CONFIGURED ? serverTimestamp() : Date.now();
  const data       = { ...normalized, updatedBy: adminUid, updatedAt: now };

  if (FIREBASE_CONFIGURED) {
    // Write to 'results' (spec) and also 'matchResults' (legacy compat)
    await setDoc(doc(db, 'results',      matchId), data, { merge: true });
    await setDoc(doc(db, 'matchResults', matchId), data, { merge: true });
    return;
  }

  const cur = JSON.parse(localStorage.getItem(LS_RESULTS) || '{}');
  cur[matchId] = data;
  localStorage.setItem(LS_RESULTS, JSON.stringify(cur));
}

export async function loadMatchResults() {
  if (FIREBASE_CONFIGURED) {
    const results = {};
    // Try 'results' first (spec collection name)
    const snap = await getDocs(collection(db, 'results'));
    snap.forEach(d => {
      const data = normalizeResult(d.data());
      if (data.matchId != null) results[data.matchId] = data;
    });
    // Merge legacy 'matchResults' if 'results' is empty
    if (Object.keys(results).length === 0) {
      const legacy = await getDocs(collection(db, 'matchResults'));
      legacy.forEach(d => {
        const data = normalizeResult(d.data());
        if (data.matchId != null) results[data.matchId] = data;
      });
    }
    return results;
  }
  try {
    const raw = JSON.parse(localStorage.getItem(LS_RESULTS) || '{}');
    return Object.fromEntries(
      Object.entries(raw).map(([id, v]) => [
        id, normalizeResult({ ...v, matchId: v?.matchId ?? Number(id) }),
      ])
    );
  } catch { return {}; }
}

// ─── REALTIME LISTENERS ───────────────────────────────────────────────────────

export function subscribeToMatchResults(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(
      collection(db, 'results'),
      (snap) => {
        const results = {};
        snap.forEach(d => {
          const data = normalizeResult(d.data());
          if (data.matchId != null) results[data.matchId] = data;
        });
        callback(results);
      },
      (err) => {
        console.error('[Firestore] subscribeToMatchResults:', err);
        loadMatchResults().then(callback);
      }
    );
  }
  const tick = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_RESULTS) || '{}');
      callback(Object.fromEntries(
        Object.entries(raw).map(([id, v]) => [
          id, normalizeResult({ ...v, matchId: v?.matchId ?? Number(id) }),
        ])
      ));
    } catch {}
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}

export function subscribeToPredictions(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(
      collection(db, 'predictions'),
      (snap) => {
        const byUser = {};
        snap.forEach(d => {
          const data  = d.data();
          const owner = data.uid || data.userId;
          if (!owner) return;
          if (!byUser[owner]) byUser[owner] = {};
          byUser[owner][data.matchId] = {
            scoreA: data.scoreA, scoreB: data.scoreB,
            possession: data.possession, corners: data.corners,
            // usedJoker must be preserved here — same pattern as loadAllPredictions.
            // Without this, every realtime snapshot silently drops the field and
            // the Joker badge disappears from Friends / Player Detail for everyone.
            ...(data.usedJoker !== undefined ? { usedJoker: data.usedJoker } : {}),
          };
        });
        callback(byUser);
      },
      (err) => console.error('[Firestore] subscribeToPredictions:', err)
    );
  }
  try { callback(JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}')); } catch {}
  return () => {};
}

export function subscribeToUsers(callback) {
  if (FIREBASE_CONFIGURED) {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const users = {};
        snap.forEach(d => { users[d.id] = d.data(); });
        callback(users);
      },
      (err) => console.error('[Firestore] subscribeToUsers:', err)
    );
  }
  try { callback(_loadLocalUsers()); } catch {}
  return () => {};
}

// ─── LOCAL HELPERS ────────────────────────────────────────────────────────────

function _registerNicknameLocal(uid, nickname) {
  if (!nickname) return;
  const key   = 'wc2026_nicknames';
  const list  = JSON.parse(localStorage.getItem(key) || '[]');
  const entry = { uid, nickname: nickname.toLowerCase() };
  const idx   = list.findIndex(x => x.uid === uid);
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  localStorage.setItem(key, JSON.stringify(list));
}

function _getLocalNicknames() {
  try {
    return JSON.parse(localStorage.getItem('wc2026_nicknames') || '[]')
      .map(x => x.nickname.toLowerCase());
  } catch { return []; }
}

function _saveToAllPreds(uid, matchId, pred) {
  const all = JSON.parse(localStorage.getItem(LS_ALL_PREDS) || '{}');
  if (!all[uid]) all[uid] = {};
  all[uid][matchId] = pred;
  localStorage.setItem(LS_ALL_PREDS, JSON.stringify(all));
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

// ─── RESET TEST / AMICALE DATA ────────────────────────────────────────────────
// Deletes all predictions and results for test matches (IDs 901-910).
// Does NOT delete users, real match predictions, or real match results.
export async function resetTestData() {
  const TEST_IDS = [901,902,903,904,905,906,907,908,909,910];

  if (FIREBASE_CONFIGURED) {
    const batch1 = [];
    // Delete predictions for test matches
    for (const matchId of TEST_IDS) {
      const snap = await getDocs(
        query(collection(db, 'predictions'), where('matchId', '==', matchId))
      );
      snap.forEach(d => batch1.push(d.ref));
    }
    // Delete results for test matches
    for (const matchId of TEST_IDS) {
      const ref = doc(db, 'results', String(matchId));
      batch1.push(ref);
    }
    // Execute in batches of 500
    const { writeBatch: wb } = await import('firebase/firestore');
    for (let i = 0; i < batch1.length; i += 400) {
      const b = wb(db);
      batch1.slice(i, i+400).forEach(ref => b.delete(ref));
      await b.commit();
    }
    return { success: true };
  }

  // localStorage fallback
  const LS_PREDS = 'wc2026_preds_';
  TEST_IDS.forEach(id => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREDS))
      .forEach(k => {
        try {
          const preds = JSON.parse(localStorage.getItem(k) || '{}');
          delete preds[id];
          localStorage.setItem(k, JSON.stringify(preds));
        } catch {}
      });
    const results = JSON.parse(localStorage.getItem('wc2026_admin_results') || '{}');
    delete results[id];
    localStorage.setItem('wc2026_admin_results', JSON.stringify(results));
  });
  return { success: true };
}

// ─── SPECIAL EVENTS ───────────────────────────────────────────────────────────
export async function loadAllSpecialPredictionsFS() {
  if (!FIREBASE_CONFIGURED) return {};
  try {
    const { getDocs: gd, collection: col } = await import('firebase/firestore');
    const snap = await gd(col(db, 'specialPredictions'));
    const out = {};
    snap.forEach(d => { out[d.id] = d.data(); });
    return out;
  } catch(e) { console.error('loadAllSpecialPredictionsFS:', e); return {}; }
}

export async function loadSpecialResultsFS() {
  if (!FIREBASE_CONFIGURED) {
    try { return JSON.parse(localStorage.getItem('wc2026_special_results') || 'null'); } catch { return null; }
  }
  try {
    const { getDoc: gd, doc: docFn } = await import('firebase/firestore');
    const snap = await gd(docFn(db, 'specialResults', 'main'));
    return snap.exists() ? snap.data() : null;
  } catch(e) { console.error('loadSpecialResultsFS:', e); return null; }
}

export async function resetSpecialDataFS() {
  if (!FIREBASE_CONFIGURED) {
    Object.keys(localStorage).filter(k => k.startsWith('wc2026_special_')).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('wc2026_special_results');
    return { success: true };
  }
  try {
    const { getDocs: gd, collection: col, doc: docFn, writeBatch: wb } = await import('firebase/firestore');
    const snap = await gd(col(db, 'specialPredictions'));
    const batch = wb(db);
    snap.forEach(d => batch.delete(d.ref));
    batch.delete(docFn(db, 'specialResults', 'main'));
    await batch.commit();
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}
