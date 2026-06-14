// ─── src/services/specialEventsService.js ────────────────────────────────────
// Special event predictions + results for World Cup 2026.
// Lock time: Saturday 13 June 2026 23:00 Romania = 20:00 UTC
// Firestore:
//   specialPredictions/{uid}  — user's picks
//   specialResults/main       — admin outcomes
// ─────────────────────────────────────────────────────────────────────────────

import { db, FIREBASE_CONFIGURED } from './firebase.js';
import {
  doc, getDoc, setDoc, collection, getDocs,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';

// ── LOCK TIME ─────────────────────────────────────────────────────────────────
export const SPECIAL_LOCK_TIME = new Date('2026-06-14T18:00:00.000Z'); // 21:00 RO

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

// ── TEAMS LIST ────────────────────────────────────────────────────────────────
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
// winner=500, each correct semifinalist=200 (max 800), topScorer=300
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
  return pts;
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
