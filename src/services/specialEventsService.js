// ─── src/services/specialEventsService.js ─────────────────────────────────────
// Handles "Evenimente Speciale" predictions and results.
// Lock time: Saturday 13 June 2026, 23:00 Romania (= 20:00 UTC)
// Collections:
//   specialPredictions/{uid}  — user's special predictions
//   specialResults/main       — admin-set outcomes
// ─────────────────────────────────────────────────────────────────────────────

import { db, FIREBASE_CONFIGURED } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// Lock time: 13 June 2026, 23:00 Romania = 20:00 UTC
export const SPECIAL_LOCK_TIME = new Date('2026-06-13T20:00:00.000Z');

export function isSpecialLocked() {
  return Date.now() >= SPECIAL_LOCK_TIME.getTime();
}

export function specialLockCountdown() {
  const ms = SPECIAL_LOCK_TIME.getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h/24)}z`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

// All 48 WC teams for selection
export const WC_TEAMS = [
  { name:"Mexic",            flag:"🇲🇽" }, { name:"Africa de Sud",   flag:"🇿🇦" },
  { name:"Coreea de Sud",    flag:"🇰🇷" }, { name:"Cehia",           flag:"🇨🇿" },
  { name:"Canada",           flag:"🇨🇦" }, { name:"Bosnia",          flag:"🇧🇦" },
  { name:"Qatar",            flag:"🇶🇦" }, { name:"Elveția",         flag:"🇨🇭" },
  { name:"Brazilia",         flag:"🇧🇷" }, { name:"Maroc",           flag:"🇲🇦" },
  { name:"Haiti",            flag:"🇭🇹" }, { name:"Scoția",          flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name:"SUA",              flag:"🇺🇸" }, { name:"Paraguay",        flag:"🇵🇾" },
  { name:"Australia",        flag:"🇦🇺" }, { name:"Turcia",          flag:"🇹🇷" },
  { name:"Germania",         flag:"🇩🇪" }, { name:"Curaçao",         flag:"🇨🇼" },
  { name:"Coasta de Fildeș", flag:"🇨🇮" }, { name:"Ecuador",         flag:"🇪🇨" },
  { name:"Olanda",           flag:"🇳🇱" }, { name:"Japonia",         flag:"🇯🇵" },
  { name:"Suedia",           flag:"🇸🇪" }, { name:"Tunisia",         flag:"🇹🇳" },
  { name:"Belgia",           flag:"🇧🇪" }, { name:"Egipt",           flag:"🇪🇬" },
  { name:"Iran",             flag:"🇮🇷" }, { name:"Noua Zeelandă",   flag:"🇳🇿" },
  { name:"Spania",           flag:"🇪🇸" }, { name:"Capul Verde",     flag:"🇨🇻" },
  { name:"Arabia Saudită",   flag:"🇸🇦" }, { name:"Uruguay",         flag:"🇺🇾" },
  { name:"Franța",           flag:"🇫🇷" }, { name:"Senegal",         flag:"🇸🇳" },
  { name:"Irak",             flag:"🇮🇶" }, { name:"Norvegia",        flag:"🇳🇴" },
  { name:"Argentina",        flag:"🇦🇷" }, { name:"Algeria",         flag:"🇩🇿" },
  { name:"Austria",          flag:"🇦🇹" }, { name:"Iordania",        flag:"🇯🇴" },
  { name:"Portugalia",       flag:"🇵🇹" }, { name:"Congo RD",        flag:"🇨🇩" },
  { name:"Uzbekistan",       flag:"🇺🇿" }, { name:"Columbia",        flag:"🇨🇴" },
  { name:"Anglia",           flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name:"Croația",         flag:"🇭🇷" },
  { name:"Ghana",            flag:"🇬🇭" }, { name:"Panama",          flag:"🇵🇦" },
];

// ── READ ──────────────────────────────────────────────────────────────────────
export async function loadSpecialPrediction(uid) {
  if (!FIREBASE_CONFIGURED || !uid) {
    try { return JSON.parse(localStorage.getItem(`wc2026_special_${uid}`) || 'null'); } catch { return null; }
  }
  try {
    const snap = await getDoc(doc(db, 'specialPredictions', uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

export async function loadAllSpecialPredictions() {
  if (!FIREBASE_CONFIGURED) return {};
  try {
    const snap = await getDocs(collection(db, 'specialPredictions'));
    const out = {};
    snap.forEach(d => { out[d.id] = d.data(); });
    return out;
  } catch { return {}; }
}

export async function loadSpecialResults() {
  if (!FIREBASE_CONFIGURED) {
    try { return JSON.parse(localStorage.getItem('wc2026_special_results') || 'null'); } catch { return null; }
  }
  try {
    const snap = await getDoc(doc(db, 'specialResults', 'main'));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

// ── SAVE USER PREDICTION ──────────────────────────────────────────────────────
export async function saveSpecialPrediction(uid, prediction) {
  if (isSpecialLocked()) throw new Error('Evenimentele speciale sunt blocate.');
  const data = { ...prediction, uid, updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString() };

  if (!FIREBASE_CONFIGURED || !uid) {
    localStorage.setItem(`wc2026_special_${uid}`, JSON.stringify(prediction));
    return { success: true };
  }
  try {
    await setDoc(doc(db, 'specialPredictions', uid), data, { merge: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// ── ADMIN SAVE RESULTS ────────────────────────────────────────────────────────
export async function saveSpecialResults(adminUid, results) {
  const data = { ...results, updatedBy: adminUid, updatedAt: serverTimestamp ? serverTimestamp() : new Date().toISOString() };
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('wc2026_special_results', JSON.stringify(results));
    return { success: true };
  }
  try {
    await setDoc(doc(db, 'specialResults', 'main'), data, { merge: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// ── SCORING ───────────────────────────────────────────────────────────────────
// winner: 500pts, each semifinalist: 200pts (max 800), topScorer: 300pts
export function calcSpecialPoints(userPred, results) {
  if (!userPred || !results) return 0;
  let pts = 0;

  // Winner
  if (results.winner && userPred.winner === results.winner) pts += 500;

  // Semifinalists (4 picks, 200 each)
  if (results.semifinalists && userPred.semifinalists) {
    const correct = (userPred.semifinalists || []).filter(t => results.semifinalists.includes(t));
    pts += correct.length * 200;
  }

  // Top scorer country
  if (results.topScorerCountry && userPred.topScorerCountry === results.topScorerCountry) pts += 300;

  return pts;
}

// ── RESET ─────────────────────────────────────────────────────────────────────
export async function resetSpecialData() {
  if (!FIREBASE_CONFIGURED) {
    Object.keys(localStorage).filter(k => k.startsWith('wc2026_special_')).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('wc2026_special_results');
    return { success: true };
  }
  try {
    // Delete all special predictions
    const snap = await getDocs(collection(db, 'specialPredictions'));
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    // Delete results
    batch.delete(doc(db, 'specialResults', 'main'));
    await batch.commit();
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}
