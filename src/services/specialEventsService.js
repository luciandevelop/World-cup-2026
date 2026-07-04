// ─── src/services/specialEventsService.js ─────────────────────────────────────
// Special event predictions + results for World Cup 2026.
// Firestore:
//   specialPredictions/{uid}  — user's picks
//   specialResults/main       — admin outcomes
// ─────────────────────────────────────────────────────────────────────────────

import { db, FIREBASE_CONFIGURED } from './firebase.js';
import {
  doc, getDoc, setDoc, collection, getDocs,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';

// ── LOCK TIME — "Evenimente Speciale" (campioană, semifinaliste, golgheter) ───
export const SPECIAL_LOCK_TIME = new Date('2026-06-14T11:00:00.000Z'); // 14:00 RO — blocat

export function isSpecialLocked() {
  return Date.now() >= SPECIAL_LOCK_TIME.getTime();
}

export function specialLockCountdown() {
  const ms = SPECIAL_LOCK_TIME.getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}z`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

// ── QF LOCK — "Calificate în Sferturi" closes 04 Jul 2026 19:00 RO = 16:00 UTC
export const QF_LOCK_TIME = new Date('2026-07-04T16:00:00.000Z');

export function isQFLocked() {
  return Date.now() >= QF_LOCK_TIME.getTime();
}

export function qfLockCountdown() {
  const ms = QF_LOCK_TIME.getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}z`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

// ── R16 MATCHES — the 8 confirmed Round of 16 matchups ───────────────────────
// id = internal app match ID used in matches.js and BracketScreen.jsx.
// Users pick ONE winner (home or away) from each match.
// Firestore stores: quarterFinalists: { "89": "Canada", "90": "Brazilia", ... }
export const R16_MATCHES = [
  { id:'89', home:'Canada',     homeFlag:'🇨🇦', away:'Maroc',      awayFlag:'🇲🇦' },
  { id:'90', home:'Brazilia',   homeFlag:'🇧🇷', away:'Norvegia',   awayFlag:'🇳🇴' },
  { id:'91', home:'Paraguay',   homeFlag:'🇵🇾', away:'Franta',     awayFlag:'🇫🇷' },
  { id:'92', home:'Mexic',      homeFlag:'🇲🇽', away:'Anglia',     awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:'93', home:'Spania',     homeFlag:'🇪🇸', away:'Portugalia', awayFlag:'🇵🇹' },
  { id:'94', home:'Belgia',     homeFlag:'🇧🇪', away:'SUA',        awayFlag:'🇺🇸' },
  { id:'95', home:'Australia',  homeFlag:'🇦🇺', away:'Elvetia',    awayFlag:'🇨🇭' },
  { id:'96', home:'Argentina',  homeFlag:'🇦🇷', away:'Columbia',   awayFlag:'🇨🇴' },
];

// ── TEAMS LIST (for campioană / semifinaliste / golgheter) ────────────────────
export const WC_TEAMS = [
  { name:'Mexic',            flag:'🇲🇽' }, { name:'Africa de Sud',   flag:'🇿🇦' },
  { name:'Coreea de Sud',    flag:'🇰🇷' }, { name:'Cehia',           flag:'🇨🇿' },
  { name:'Canada',           flag:'🇨🇦' }, { name:'Bosnia',          flag:'🇧🇦' },
  { name:'Qatar',            flag:'🇶🇦' }, { name:'Elveția',         flag:'🇨🇭' },
  { name:'Brazilia',         flag:'🇧🇷' }, { name:'Maroc',           flag:'🇲🇦' },
  { name:'Haiti',            flag:'🇭🇹' }, { name:'Scoția',          flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name:'SUA',              flag:'🇺🇸' }, { name:'Paraguay',        flag:'🇵🇾' },
  { name:'Australia',        flag:'🇦🇺' }, { name:'Turcia',          flag:'🇹🇷' },
  { name:'Germania',         flag:'🇩🇪' }, { name:'Curaçao',         flag:'🇨🇼' },
  { name:'Coasta de Fildeș', flag:'🇨🇮' }, { name:'Ecuador',         flag:'🇪🇨' },
  { name:'Olanda',           flag:'🇳🇱' }, { name:'Japonia',         flag:'🇯🇵' },
  { name:'Suedia',           flag:'🇸🇪' }, { name:'Tunisia',         flag:'🇹🇳' },
  { name:'Belgia',           flag:'🇧🇪' }, { name:'Egipt',           flag:'🇪🇬' },
  { name:'Iran',             flag:'🇮🇷' }, { name:'Noua Zeelandă',   flag:'🇳🇿' },
  { name:'Spania',           flag:'🇪🇸' }, { name:'Capul Verde',     flag:'🇨🇻' },
  { name:'Arabia Saudită',   flag:'🇸🇦' }, { name:'Uruguay',         flag:'🇺🇾' },
  { name:'Franța',           flag:'🇫🇷' }, { name:'Senegal',         flag:'🇸🇳' },
  { name:'Irak',             flag:'🇮🇶' }, { name:'Norvegia',        flag:'🇳🇴' },
  { name:'Argentina',        flag:'🇦🇷' }, { name:'Algeria',         flag:'🇩🇿' },
  { name:'Austria',          flag:'🇦🇹' }, { name:'Iordania',        flag:'🇯🇴' },
  { name:'Portugalia',       flag:'🇵🇹' }, { name:'Congo RD',        flag:'🇨🇩' },
  { name:'Uzbekistan',       flag:'🇺🇿' }, { name:'Columbia',        flag:'🇨🇴' },
  { name:'Anglia',           flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { name:'Croația',         flag:'🇭🇷' },
  { name:'Ghana',            flag:'🇬🇭' }, { name:'Panama',          flag:'🇵🇦' },
];

// ── SCORING ───────────────────────────────────────────────────────────────────
// Single source of truth for ALL special prediction points.
// winner=500, each correct semifinalist=200 (max 800), topScorer=300
// quarterFinalists: +50/match correct, bonus +100 at 7/8, +200 at 8/8

// Internal helper — counts matches where user picked the real winner.
function _countQFCorrect(userQF, realQF) {
  if (!userQF || !realQF) return 0;
  return Object.entries(realQF).filter(([id, winner]) => userQF[id] === winner).length;
}

export function calcSpecialPoints(userPred, results) {
  if (!userPred || !results) return 0;
  let pts = 0;
  if (results.winner && userPred.winner === results.winner) pts += 500;
  if (results.semifinalists && userPred.semifinalists) {
    const correct = (userPred.semifinalists || []).filter(t =>
      (results.semifinalists || []).includes(t)
    );
    pts += correct.length * 200;
  }
  if (results.topScorerCountry && userPred.topScorerCountry === results.topScorerCountry) pts += 300;
  // QF scoring — only if both user and results have the field
  if (results.quarterFinalists && userPred.quarterFinalists) {
    const c = _countQFCorrect(userPred.quarterFinalists, results.quarterFinalists);
    pts += c * 50;
    if (c === 8) pts += 200;
    else if (c === 7) pts += 100;
  }
  return pts;
}

// Public breakdown for display in UI.
export function calcQFPoints(userPred, results) {
  const correct = _countQFCorrect(userPred?.quarterFinalists, results?.quarterFinalists);
  const base    = correct * 50;
  const bonus   = correct === 8 ? 200 : correct === 7 ? 100 : 0;
  return { correct, base, bonus, total: base + bonus };
}

// ── READ ──────────────────────────────────────────────────────────────────────
export async function loadSpecialPrediction(uid) {
  if (!uid) return null;
  if (!FIREBASE_CONFIGURED) {
    try { return JSON.parse(localStorage.getItem('wc_sp_' + uid) || 'null'); } catch { return null; }
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
    // d.data() returns the full document — quarterFinalists included automatically
    snap.forEach(d => { out[d.id] = d.data(); });
    return out;
  } catch { return {}; }
}

export async function loadSpecialResults() {
  if (!FIREBASE_CONFIGURED) {
    try { return JSON.parse(localStorage.getItem('wc_special_results') || 'null'); } catch { return null; }
  }
  try {
    const snap = await getDoc(doc(db, 'specialResults', 'main'));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

// ── WRITE ─────────────────────────────────────────────────────────────────────
export async function saveSpecialPrediction(uid, prediction) {
  if (isSpecialLocked()) return { success: false, error: 'Evenimentele speciale sunt blocate.' };
  if (!uid) return { success: false, error: 'Utilizator neautentificat.' };
  const data = { ...prediction, uid, updatedAt: serverTimestamp() };
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('wc_sp_' + uid, JSON.stringify(prediction));
    return { success: true };
  }
  try {
    await setDoc(doc(db, 'specialPredictions', uid), data, { merge: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

export async function saveSpecialResults(adminUid, results) {
  const data = { ...results, updatedBy: adminUid, updatedAt: serverTimestamp() };
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('wc_special_results', JSON.stringify(results));
    return { success: true };
  }
  try {
    await setDoc(doc(db, 'specialResults', 'main'), data, { merge: true });
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// Saves user's QF picks onto specialPredictions/{uid} using merge:true
// so winner/semifinalists/topScorerCountry are not overwritten.
export async function saveQFPrediction(uid, quarterFinalists) {
  if (isQFLocked()) return { success: false, error: 'Predicția pentru sferturi este blocată.' };
  if (!uid) return { success: false, error: 'Utilizator neautentificat.' };
  const filled = Object.values(quarterFinalists).filter(Boolean).length;
  if (filled !== 8) return { success: false, error: 'Alege câștigătorul pentru toate cele 8 meciuri.' };
  if (!FIREBASE_CONFIGURED) {
    try {
      const existing = JSON.parse(localStorage.getItem('wc_sp_' + uid) || '{}');
      localStorage.setItem('wc_sp_' + uid, JSON.stringify({ ...existing, quarterFinalists }));
      return { success: true };
    } catch { return { success: false, error: 'Eroare localStorage.' }; }
  }
  try {
    await setDoc(
      doc(db, 'specialPredictions', uid),
      { quarterFinalists, uid, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// Admin saves the real qualified teams onto specialResults/main using merge:true.
// No Firestore rules change needed — admin writes to specialResults/main already allowed.
export async function saveQFResults(adminUid, quarterFinalists) {
  const filled = Object.values(quarterFinalists).filter(Boolean).length;
  if (filled !== 8) return { success: false, error: 'Setează câștigătorul pentru toate cele 8 meciuri.' };
  if (!FIREBASE_CONFIGURED) {
    try {
      const existing = JSON.parse(localStorage.getItem('wc_special_results') || '{}');
      localStorage.setItem('wc_special_results', JSON.stringify({ ...existing, quarterFinalists }));
      return { success: true };
    } catch { return { success: false, error: 'Eroare localStorage.' }; }
  }
  try {
    await setDoc(
      doc(db, 'specialResults', 'main'),
      { quarterFinalists, updatedBy: adminUid, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// ── RESET ─────────────────────────────────────────────────────────────────────
export async function resetSpecialData() {
  if (!FIREBASE_CONFIGURED) {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wc_sp_'))
      .forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('wc_special_results');
    return { success: true };
  }
  try {
    const snap = await getDocs(collection(db, 'specialPredictions'));
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'specialResults', 'main'));
    await batch.commit();
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}
