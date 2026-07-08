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
  { id:'95', home:'Argentina',  homeFlag:'🇦🇷', away:'Egipt',      awayFlag:'🇪🇬' },
  { id:'96', home:'Elvetia',    homeFlag:'🇨🇭', away:'Columbia',   awayFlag:'🇨🇴' },
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

// ── TEAM → MATCH LOOKUP (for auto-repair) ────────────────────────────────────
// Each R16 team appears in exactly one fixture.
const _TEAM_TO_MATCH_ID = {};
R16_MATCHES.forEach(m => { _TEAM_TO_MATCH_ID[m.home] = m.id; _TEAM_TO_MATCH_ID[m.away] = m.id; });

// Valid teams per matchId — used for is-correctly-placed check.
const _R16_VALID = Object.fromEntries(R16_MATCHES.map(m => [m.id, new Set([m.home, m.away])]));
const _isCorrectlyPlaced = (id, team) => !!team && (_R16_VALID[id]?.has(team) ?? false);

// repairQFPicks — runtime-only, in-memory, never writes to Firestore.
//
// Old buggy UI versions saved picks under wrong matchIds (e.g. the user
// correctly chose Argentina and Elveția but the data was stored as
// {95:"Elveția", 96:"Argentina"} instead of {95:"Argentina", 96:"Elveția"}).
//
// Algorithm (iterates until stable, handles chains and swaps):
//   For each misplaced pick (team not valid for its saved matchId):
//     1. Find the correct matchId for that team.
//     2. If the correct slot is empty → move there.
//     3. If the correct slot has a valid pick → remove the misplaced one (don't overwrite).
//     4. If the correct slot also has a misplaced pick → swap atomically, then re-evaluate.
//     5. If the team doesn't belong to any R16 fixture → remove (truly unknown).
//
// Valid picks are NEVER overwritten.
export function repairQFPicks(qf) {
  if (!qf) return {};
  const result = { ...qf };
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 16) {
    changed = false;
    iterations++;
    for (const [id, team] of Object.entries(result)) {
      if (!team) { delete result[id]; changed = true; break; }
      if (_isCorrectlyPlaced(id, team)) continue;

      const correctId = _TEAM_TO_MATCH_ID[team];
      if (!correctId) { delete result[id]; changed = true; break; }  // unknown team

      const atDest = result[correctId];
      if (!atDest) {
        result[correctId] = team; delete result[id]; changed = true; break;
      }
      if (_isCorrectlyPlaced(correctId, atDest)) {
        delete result[id]; changed = true; break;                // dest valid — remove misplaced
      }
      // Both sides misplaced — swap atomically
      result[correctId] = team; result[id] = atDest;
      changed = true; break;
    }
  }
  return result;
}

// Internal helper — counts matches where user picked the real winner.
// Applies repairQFPicks first so old buggy swapped picks score correctly.
function _countQFCorrect(userQF, realQF) {
  if (!userQF || !realQF) return 0;
  const fixed = repairQFPicks(userQF);
  return Object.entries(realQF).filter(([id, winner]) => fixed[id] === winner).length;
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
    // Bonus only when all 8 results are entered
    if (Object.keys(results.quarterFinalists).length === 8) {
      if (c === 8) pts += 200;
      else if (c === 7) pts += 100;
    }
  }
  // SF ("Calificate în Semifinale") scoring — +100/correct, +250 bonus only at 4/4
  if (results.qualifiedToSemis && userPred.qualifiedToSemis) {
    const realSF = results.qualifiedToSemis;
    const userSF = userPred.qualifiedToSemis;
    const c = Object.entries(realSF).filter(([id, w]) => userSF[id] === w).length;
    pts += c * 100;
    if (Object.keys(realSF).length === 4 && c === 4) pts += 250;
  }
  return pts;
}

// Public breakdown for QF display in UI.
export function calcQFPoints(userPred, results) {
  const realQF  = results?.quarterFinalists || {};
  const rawQF   = userPred?.quarterFinalists || {};
  const userQF  = repairQFPicks(rawQF);             // repair before display/scoring
  const entered = Object.keys(realQF).length;
  const correct = _countQFCorrect(rawQF, realQF);   // _countQFCorrect also repairs internally
  const base    = correct * 50;
  const allDone = entered === 8;
  const bonus   = allDone ? (correct === 8 ? 200 : correct === 7 ? 100 : 0) : 0;
  return { correct, entered, base, bonus, total: base + bonus, allDone, repairedQF: userQF };
}

// ── CALIFICATE ÎN SEMIFINALE ──────────────────────────────────────────────────
// Separate from "Calificate în Sferturi" (QF).
// Users pick ONE winner from each of the 4 QF fixtures.
// Stored as { "97":"Franta", "98":"Spania", ... } on specialPredictions/{uid}.qualifiedToSemis
// Admin stores results on specialResults/main.qualifiedToSemis

// The 4 confirmed QF fixtures (teams that play in the quarterfinals)
export const SF_MATCHES = [
  { id:'97',  home:'Franta',    homeFlag:'🇫🇷', away:'Maroc',   awayFlag:'🇲🇦' },
  { id:'98',  home:'Spania',    homeFlag:'🇪🇸', away:'Belgia',  awayFlag:'🇧🇪' },
  { id:'99',  home:'Norvegia',  homeFlag:'🇳🇴', away:'Anglia',  awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:'100', home:'Argentina', homeFlag:'🇦🇷', away:'Elvetia', awayFlag:'🇨🇭' },
];

// Lock: first QF kicks off 09 Jul 2026 20:00 UTC (23:00 RO)
export const SF_PRED_LOCK_TIME = new Date('2026-07-09T20:00:00.000Z');

export function isSFPredLocked() {
  return Date.now() >= SF_PRED_LOCK_TIME.getTime();
}

export function sfPredLockCountdown() {
  const ms = SF_PRED_LOCK_TIME.getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}z`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

// Breakdown for display: correct count, base, bonus, total, allDone
export function calcSFPoints(userPred, results) {
  const realSF  = results?.qualifiedToSemis || {};
  const userSF  = userPred?.qualifiedToSemis || {};
  const entered = Object.keys(realSF).length;
  const correct = Object.entries(realSF).filter(([id, w]) => userSF[id] === w).length;
  const base    = correct * 100;
  const allDone = entered === 4;
  const bonus   = allDone && correct === 4 ? 250 : 0;
  return { correct, entered, base, bonus, total: base + bonus, allDone };
}

// Save user's SF picks onto specialPredictions/{uid} (merge — doesn't touch other fields)
export async function saveSFPrediction(uid, qualifiedToSemis) {
  if (isSFPredLocked()) return { success: false, error: 'Predicția pentru semifinale este blocată.' };
  if (!uid) return { success: false, error: 'Utilizator neautentificat.' };
  if (!FIREBASE_CONFIGURED) {
    try {
      const existing = JSON.parse(localStorage.getItem('wc_sp_' + uid) || '{}');
      localStorage.setItem('wc_sp_' + uid, JSON.stringify({ ...existing, qualifiedToSemis }));
      return { success: true };
    } catch { return { success: false, error: 'Eroare localStorage.' }; }
  }
  try {
    await setDoc(
      doc(db, 'specialPredictions', uid),
      { qualifiedToSemis, uid, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// Admin saves real SF results onto specialResults/main (partial saves allowed, merge:true)
export async function saveSFResults(adminUid, qualifiedToSemis) {
  if (!FIREBASE_CONFIGURED) {
    try {
      const existing = JSON.parse(localStorage.getItem('wc_special_results') || '{}');
      const merged = { ...(existing.qualifiedToSemis || {}), ...qualifiedToSemis };
      localStorage.setItem('wc_special_results', JSON.stringify({ ...existing, qualifiedToSemis: merged }));
      return { success: true };
    } catch { return { success: false, error: 'Eroare localStorage.' }; }
  }
  try {
    await setDoc(
      doc(db, 'specialResults', 'main'),
      { qualifiedToSemis, updatedBy: adminUid, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
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
  // Allow partial saves — admin can enter results one by one as matches finish.
  // merge:true ensures previously saved winners are kept unless overwritten.
  if (!FIREBASE_CONFIGURED) {
    try {
      const existing = JSON.parse(localStorage.getItem('wc_special_results') || '{}');
      const merged = { ...(existing.quarterFinalists || {}), ...quarterFinalists };
      localStorage.setItem('wc_special_results', JSON.stringify({ ...existing, quarterFinalists: merged }));
      return { success: true };
    } catch { return { success: false, error: 'Eroare localStorage.' }; }
  }
  try {
    // Use dot-notation path update via setDoc merge so only changed keys are written
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
