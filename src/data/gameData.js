// ─── src/data/gameData.js ─────────────────────────────────────────────────────
// Scoring engine, lock logic, leaderboard engine, mock data.
// All pure JS — no React imports.
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_MATCHES, ALL_GROUPS, getGroupLabel } from './matches.js';
export { getGroupLabel };

// ─── MATCH STATUS OVERRIDES ───────────────────────────────────────────────────
// Admin sets real results here. In production: replace with Supabase query.
export let FINISHED_RESULTS = {};

export const LOCK_BEFORE_MS = 30 * 60 * 1000; // 30 min before kickoff

// ─── ADMIN EMAILS ─────────────────────────────────────────────────────────────
// Only users whose email appears here can access admin mode.
export const ADMIN_EMAILS = [
  "admin@worldcup2026.app",
  "luciavram87@gmail.com",   // primary admin
];

// ─── MATCHES (computed) ───────────────────────────────────────────────────────
export function buildMatches(finishedResults = FINISHED_RESULTS, { includeTests = false } = {}) {
  const now = Date.now();
  const source = includeTests ? [...ALL_MATCHES, ...TEST_MATCHES] : ALL_MATCHES;
  return source.map((m) => {
    const kickoff    = new Date(m.time).getTime();
    const isLocked   = now >= kickoff - LOCK_BEFORE_MS;
    const result     = finishedResults[m.id] ?? null;
    // isFinished only when status is explicitly 'ft' — not live, scheduled, or locked
    const isFinished = result?.liveStatus === 'ft' &&
                       result?.realScoreA !== null && result?.realScoreA !== undefined &&
                       result?.realScoreB !== null && result?.realScoreB !== undefined;
    const isLive     = result?.liveStatus === 'live' || result?.liveStatus === 'ht';
    return {
      ...m,
      isLocked,
      isFinished,
      isLive,
      realScoreA:     (isFinished || isLive) && result?.realScoreA != null ? Number(result.realScoreA) : null,
      realScoreB:     (isFinished || isLive) && result?.realScoreB != null ? Number(result.realScoreB) : null,
      // Canonical admin result stores homePossession/awayPossession — use home side as realPossession
      realPossession: result?.homePossession  ?? result?.realPossession ?? null,
      realPossessionAway: result?.awayPossession ?? null,
      // Canonical admin result stores homeCorners+awayCorners — sum them for realCorners
      realCorners:    (result?.homeCorners != null && result?.awayCorners != null)
                        ? (Number(result.homeCorners) + Number(result.awayCorners))
                        : (result?.realCorners ?? null),
      realHomeCorners: result?.homeCorners ?? null,
      realAwayCorners: result?.awayCorners ?? null,
      liveMinute:     result?.liveMinute     ?? null,
      goalScorers:    result?.goalScorers    ?? null,
      homeScorers:    result?.homeScorers    ?? null,
      awayScorers:    result?.awayScorers    ?? null,
      liveCards:      result?.liveCards      ?? null,
      liveCorners:    result?.liveCorners    ?? null,
      liveStatus:     result?.liveStatus     ?? (isLive ? "live" : isFinished ? "ft" : now >= kickoff - LOCK_BEFORE_MS ? "locked" : "open"),
    };
  });
}

export const MATCHES = buildMatches(); // official WC matches only
export const GROUPS  = ALL_GROUPS;
// TEST_MATCHES removed from production exports

// ─── TIME FORMATTING ──────────────────────────────────────────────────────────
// Format ISO string to Romanian local time (Europe/Bucharest = EEST/EET)
export function formatTimeRO(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", {
    timeZone:    "Europe/Bucharest",
    weekday:     "short",
    day:         "numeric",
    month:       "short",
    hour:        "2-digit",
    minute:      "2-digit",
  });
}

export function formatDateRO(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", {
    timeZone: "Europe/Bucharest",
    weekday:  "long",
    day:      "numeric",
    month:    "long",
  });
}

export function formatKickoffRO(iso) {
  // Returns: "joi, 11 iun. • 22:00 RO"
  // Always uses Europe/Bucharest regardless of viewer's local timezone.
  const d = new Date(iso);
  const date = d.toLocaleDateString("ro-RO", { timeZone:"Europe/Bucharest", weekday:"short", day:"numeric", month:"short" });
  const time = d.toLocaleTimeString("ro-RO", { timeZone:"Europe/Bucharest", hour:"2-digit", minute:"2-digit" });
  return date + " \u2022 " + time + " RO";
}

// ─── LOCK STATE ───────────────────────────────────────────────────────────────
export function matchLockState(match) {
  if (match.isFinished) return { state:"finished", label:"✓ Final" };
  const kickoff  = new Date(match.time).getTime();
  const now      = Date.now();
  const msToLock = kickoff - LOCK_BEFORE_MS - now;

  if (now >= kickoff)                  return { state:"live",   label:"🔴 Live" };
  if (now >= kickoff - LOCK_BEFORE_MS) return { state:"locked", label:"🔒 Blocat" };

  if (msToLock <= LOCK_BEFORE_MS) {
    const h = Math.floor(msToLock / 3600000);
    const m = Math.floor((msToLock % 3600000) / 60000);
    return { state:"soon", label:`⚠ ${h > 0 ? `${h}h ${m}m` : `${m}m`} rămas` };
  }

  const h   = Math.floor(msToLock / 3600000);
  const min = Math.floor((msToLock % 3600000) / 60000);
  const cd  = h > 48 ? `${Math.floor(h/24)}z` : h > 0 ? `${h}h ${min}m` : `${min}m`;
  return { state:"open", label:`🔓 ${cd}` };
}

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
// Max per match = 200 pts (100 + 50 + 20 + 15 + 15)
export function calcBreakdown(pred, match) {
  if (!match.isFinished || match.realScoreA === null || match.realScoreB === null) return null;

  // Real scores (numbers)
  const rA = Number(match.realScoreA);
  const rB = Number(match.realScoreB);

  // Predicted scores — support both scoreA and homeScore field names
  const pA = Number(pred.scoreA ?? pred.homeScore ?? 0);
  const pB = Number(pred.scoreB ?? pred.awayScore ?? 0);

  // Real possession — homePossession field (canonical admin shape)
  const rP = match.realPossession;            // already mapped in buildMatches

  // Real corners — total (already summed in buildMatches as realCorners)
  const rC = match.realCorners;

  // Predicted possession — single "possession" field (home %)
  const pPoss = pred.possession != null ? Number(pred.possession) : null;

  // Predicted corners — single "corners" field (total predicted)
  const pC = pred.corners != null ? Number(pred.corners) : null;

  // 1. Exact score: +100
  const exactScore = (pA === rA && pB === rB) ? 100 : 0;

  // 2. Correct 1X2 outcome: +50 (home/draw/away)
  const realRes = rA > rB ? "1" : rA < rB ? "2" : "X";
  const predRes = pA > pB ? "1" : pA < pB ? "2" : "X";
  const correctRes = (predRes === realRes) ? 50 : 0;

  // 3. Correct total goals: +20
  const totalGoals = (pA + pB === rA + rB) ? 20 : 0;

  // 4. Cartonașe accuracy: stepped scoring (exact=15, ±1=10, ±2=5, >2=0)
  let possession = 0;
  if (pPoss != null && rP != null) {
    const diff = Math.abs(pPoss - rP);
    possession = diff === 0 ? 15 : diff === 1 ? 10 : diff === 2 ? 5 : 0;
  }

  // 5. Corners accuracy: stepped (exact=15, ±1=10, ±2=5, ±3=2, >3=0)
  let corners = 0;
  if (pC != null && rC != null) {
    const dK = Math.abs(pC - rC);
    corners = dK === 0 ? 15 : dK === 1 ? 10 : dK === 2 ? 5 : dK === 3 ? 2 : 0;
  }

  // Perfect prediction: exact score + exact cards + exact corners = 200 total (not additive bonus)
  const isPerfect = exactScore === 100 && possession === 15 && corners === 15;
  const total = isPerfect ? 200 : exactScore + correctRes + totalGoals + possession + corners;

  return {
    exactScore, correctRes, totalGoals, possession, corners, total,
    isPerfect,
    // Debug breakdown strings
    _debug: {
      rA, rB, pA, pB, realRes, predRes,
      rP, pPoss, possessionDiff: (pPoss != null && rP != null) ? Math.abs(pPoss - rP) : null,
      rC, pC, cornerDiff: (pC != null && rC != null) ? Math.abs(pC - rC) : null,
    },
  };
}

export function calcPoints(pred, match) {
  const b = calcBreakdown(pred, match);
  return b ? b.total : null;
}

// ─── SINGLE SOURCE OF TRUTH ───────────────────────────────────────────────────
// calculateUserScore: ONE function used by profile, header, leaderboard, user card.
// ALL UI must call this or buildLeaderboard (which calls this internally).
// Args:
//   userPreds      — { matchId(Number): pred }
//   finishedResults — the canonical wc2026_admin_results object
// Returns: { points, exactScores, lastMatchPts }
export function calculateUserScore(userPreds, finishedResults = {}) {
  const fm = buildMatches(finishedResults).filter(m => m.isFinished); // official WC only
  let points = 0, exactScores = 0, lastMatchPts = null, lastMatchId = null;
  fm.forEach(match => {
    const pred = userPreds[match.id] || userPreds[String(match.id)];
    if (!pred) return;
    const b = calcBreakdown(pred, match);
    if (!b) return;
    points += b.total;
    if (b.exactScore > 0) exactScores++;
    if (lastMatchId === null || match.id > lastMatchId) {
      lastMatchPts = b.total;
      lastMatchId  = match.id;
    }
  });
  return { points, exactScores, lastMatchPts, finishedCount: fm.length };
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
// All players compete for the entire tournament — no elimination, no cutoff.
export const QUALIFY_PCT   = 1.0;   // kept for import compatibility; not used for elimination
export const CURRENT_STAGE = "Faza grupelor";

export function buildLeaderboard(allPlayerPreds, currentUser, finishedMatches = null) {
  const fm = finishedMatches || buildMatches({}).filter(m => m.isFinished); // official WC only
  const nicknames = new Set([currentUser, ...Object.keys(allPlayerPreds)]);

  const players = Array.from(nicknames).map(nick => {
    const preds = allPlayerPreds[nick] || {};
    let totalPoints = 0, exactScores = 0, lastMatchPts = null, lastMatchId = null;
    fm.forEach(match => {
      const pred = preds[match.id];
      if (!pred) return;
      const b = calcBreakdown(pred, match);
      if (!b) return;
      totalPoints += b.total;
      if (b.exactScore > 0) exactScores++;
      if (lastMatchId === null || match.id > lastMatchId) { lastMatchPts = b.total; lastMatchId = match.id; }
    });
    return { nickname:nick, points:totalPoints, exactScores, lastMatchPts };
  });

  players.sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname));
  // qualified is always true — no one is eliminated from the fantasy competition
  return players.map((p, i) => ({ ...p, rank:i+1, qualified:true }));
}

// ─── IDENTITY ────────────────────────────────────────────────────────────────
export function getBadge(exactScores, points) {
  if (exactScores >= 3) return "🔮 Nostradamus";
  if (exactScores >= 1) return "🎯 Ghicitor";
  if (points > 100)     return "📺 Expert Canapea";
  if (points > 0)       return "🍺 Patron de Bar";
  return "🆕 Nou venit";
}

export function getPredictionStyle(exactScores, points, corners) {
  if (exactScores >= 2)                 return { label:"Exact Score Hunter", color:"#FFD700", icon:"🎯" };
  if (exactScores === 0 && points > 60) return { label:"Safe Player",        color:"#00E5A0", icon:"🛡"  };
  if (exactScores === 1 && points < 50) return { label:"Risk Taker",         color:"#FF6B6B", icon:"💣"  };
  if (corners > 0)                      return { label:"Corner King",        color:"#4A9EFF", icon:"📐"  };
  return                                       { label:"Late Clutcher",      color:"#7B5EA7", icon:"⚡"  };
}

export function getAvatarRing(style) {
  const map = {
    "#FFD700":"linear-gradient(135deg,#FFD700,#FF9800)",
    "#00E5A0":"linear-gradient(135deg,#00E5A0,#00C27A)",
    "#FF6B6B":"linear-gradient(135deg,#FF6B6B,#FF4444)",
    "#4A9EFF":"linear-gradient(135deg,#4A9EFF,#7B5EA7)",
    "#7B5EA7":"linear-gradient(135deg,#7B5EA7,#4A9EFF)",
  };
  return map[style?.color] || "linear-gradient(135deg,#4285F4,#34A853)";
}

export function getRivalryMessage(myRank, myPts, sorted, currentUser) {
  if (!sorted || sorted.length < 2) return null;
  const above   = sorted.find(p => p.rank === myRank - 1 && p.nickname !== currentUser);
  const chasers = sorted.filter(p => p.rank > myRank && p.nickname !== currentUser);
  const rival   = sorted.find(p => p.nickname !== currentUser && p.rank <= 3);
  if (above && (above.points - myPts) <= 20)  return { text:`${above.points - myPts} pts îl despart de ${above.nickname}`, urgency:"high" };
  if (above && (above.points - myPts) <= 50)  return { text:`Un scor exact te poate urca peste ${above.nickname}`, urgency:"medium" };
  if (chasers.length >= 2)                     return { text:`${chasers.length} jucători te urmăresc`, urgency:"medium" };
  if (rival)                                   return { text:`${rival.nickname} a prezis opus`, urgency:"low" };
  return null;
}

export function getPlayerForm(nick, exactScores, mov) {
  if (exactScores >= 3) return { icon:"🎯", text:`${exactScores} scoruri exacte`, color:"#FFD700" };
  if (mov >= 2)         return { icon:"⬆",  text:`+${mov} locuri azi`,            color:"#00E5A0" };
  if (mov <= -2)        return { icon:"🧊",  text:"Formă slabă",                  color:"#4A9EFF" };
  return null;
}

// ─── AVATARS ─────────────────────────────────────────────────────────────────
// 20 distinct football-style cartoon avatar configurations
const AVATAR_CONFIGS = [
  { bg:"#1a3a5c", hair:"#2d1b00", skin:"#FDBCB4", accent:"#FFD700" },
  { bg:"#1a2d1a", hair:"#1a1a1a", skin:"#8D5524", accent:"#00E5A0" },
  { bg:"#2d1a3a", hair:"#8B4513", skin:"#FDBCB4", accent:"#9B59B6" },
  { bg:"#3a1a1a", hair:"#4a3000", skin:"#C68642", accent:"#FF6B6B" },
  { bg:"#1a2d3a", hair:"#2c1810", skin:"#F1C27D", accent:"#4A9EFF" },
  { bg:"#2d2d1a", hair:"#1a1a1a", skin:"#FDBCB4", accent:"#F59E0B" },
  { bg:"#1a3a3a", hair:"#6b3a2a", skin:"#8D5524", accent:"#00E5A0" },
  { bg:"#3a2d1a", hair:"#1a1a1a", skin:"#F1C27D", accent:"#EF4444" },
  { bg:"#1a1a3a", hair:"#4a4a2a", skin:"#C68642", accent:"#7C3AED" },
  { bg:"#2d3a1a", hair:"#2c1810", skin:"#FDBCB4", accent:"#059669" },
  { bg:"#3a1a2d", hair:"#1a1a1a", skin:"#8D5524", accent:"#DC2626" },
  { bg:"#1a3a2d", hair:"#8B4513", skin:"#F1C27D", accent:"#0EA5E9" },
  { bg:"#2d1a1a", hair:"#3d2b1f", skin:"#FDBCB4", accent:"#FFD700" },
  { bg:"#1a2d2d", hair:"#1a1a1a", skin:"#C68642", accent:"#10B981" },
  { bg:"#3a3a1a", hair:"#2c1810", skin:"#8D5524", accent:"#F97316" },
  { bg:"#1a1a2d", hair:"#4a3000", skin:"#FDBCB4", accent:"#A855F7" },
  { bg:"#2d3a3a", hair:"#1a1a1a", skin:"#F1C27D", accent:"#14B8A6" },
  { bg:"#3a2d2d", hair:"#6b3a2a", skin:"#C68642", accent:"#F43F5E" },
  { bg:"#1a3a1a", hair:"#2d1b00", skin:"#FDBCB4", accent:"#84CC16" },
  { bg:"#2d2d3a", hair:"#1a1a1a", skin:"#8D5524", accent:"#06B6D4" },
];

export function getAvatarConfig(nickname) {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) - hash) + nickname.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_CONFIGS[Math.abs(hash) % AVATAR_CONFIGS.length];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const MOCK_PREDICTIONS_FINISHED = [
  { nickname:"RaduGoalz",  scoreA:2, scoreB:0, possession:60, corners:7  },
  { nickname:"AndreiFC",   scoreA:1, scoreB:1, possession:55, corners:9  },
  { nickname:"MihaiUltra", scoreA:2, scoreB:1, possession:58, corners:8  },
  { nickname:"AlexTactic", scoreA:0, scoreB:1, possession:45, corners:6  },
  { nickname:"CostinPro",  scoreA:2, scoreB:0, possession:62, corners:10 },
  { nickname:"IonelFC",    scoreA:1, scoreB:0, possession:57, corners:7  },
];

export const TAKEN_NICKNAMES = [];

export const POPULAR_PICKS = {
  13: { homeWin:68, draw:18, awayWin:14 },
  25: { homeWin:74, draw:16, awayWin:10 },
  43: { homeWin:72, draw:15, awayWin:13 },
  49: { homeWin:72, draw:15, awayWin:13 },
  55: { homeWin:79, draw:12, awayWin:9  },
  61: { homeWin:76, draw:14, awayWin:10 },
  67: { homeWin:48, draw:28, awayWin:24 },
};

export const MOST_PREDICTED = {
  13: { scoreA:2, scoreB:0, pct:31 },
  25: { scoreA:2, scoreB:1, pct:28 },
  43: { scoreA:2, scoreB:0, pct:34 },
  55: { scoreA:3, scoreB:1, pct:26 },
  61: { scoreA:2, scoreB:0, pct:29 },
  67: { scoreA:1, scoreB:1, pct:22 },
};

export const LIVE_FEED_EVENTS = [];

// ─── ACTIVITY FEED v8 ────────────────────────────────────────────────────────
// Think: sports tabloid + pub conversation + WhatsApp group + trivia page.
// Mission: user spends 30-60 seconds reading even without caring about leaderboard.
// Mix per 12 items: 4 match stories, 3 curiosities, 2 football facts, 2 banter, 1 leaderboard.
// Latest 2 finished matches dominate. Old matches disappear.
// Contextual facts only (live/last-2-finished/today/next). No Firestore writes.
// ─────────────────────────────────────────────────────────────────────────────

const _A8={"Țările de Jos":"Olanda","Netherlands":"Olanda","Franța":"Franta","France":"Franta","Curaçao":"Curacao","Coasta de Fildeș":"Coasta de Fildes","DR Congo":"RD Congo","Congo RD":"RD Congo","Cape Verde":"Capul Verde","Bosnia & Herzegovina":"Bosnia","Bosnia & Herțegovina":"Bosnia"};
const _n8=t=>_A8[t]??t;
const _WC8=new Set(["Africa de Sud","Algeria","Anglia","Arabia Saudita","Argentina","Australia","Austria","Belgia","Bosnia","Brazilia","Canada","Capul Verde","Cehia","Coasta de Fildes","Columbia","Coreea de Sud","Croatia","Curacao","Ecuador","Egipt","Elvetia","Franta","Germania","Ghana","Haiti","Iordania","Irak","Iran","Japonia","Maroc","Mexic","Norvegia","Noua Zeelanda","Olanda","Panama","Paraguay","Portugalia","Qatar","RD Congo","SUA","Scotia","Senegal","Spania","Suedia","Tunisia","Turcia","Uruguay","Uzbekistan"]);
const _isOff8=t=>_WC8.has(_n8(t));
const _isWCM8=m=>m&&m.id>=1&&m.id<=72;
const _p8=(arr,...seeds)=>{const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,7));return arr[h%arr.length];};
const _c8=(arr,seeds,...args)=>{const fn=_p8(arr,...seeds);return typeof fn==='function'?fn(...args):String(fn);};


const CUR8={
  "Africa de Sud":["🇿🇦 Africa de Sud are 11 limbi oficiale. Dacă vrei să insulți arbitrul corect, ai de ales.", "🇿🇦 Vuvuzela — cornul de plastic care a scos din minți televiziunile în 2010 — e invenție sud-africană. Și nu, nu și-au cerut scuze.", "🇿🇦 Africa de Sud produce 80% din platina mondială și 0% din titlurile mondiale la fotbal. Bogăție selectivă.", "🇿🇦 Bafana Bafana înseamnă «băieții băieților». Entuziasmul din poreclă n-a ajuns întotdeauna pe teren.", "🇿🇦 Nelson Mandela a folosit CM 2010 ca instrument de unitate națională. Fotbalul face uneori ceea ce politicienii nu pot.", "🇿🇦 Pinguinii trăiesc pe plajele din Cape Town. Nu e o metaforă. Chiar trăiesc acolo.", "🇿🇦 Africa de Sud e una din puținele țări cu 3 capitale: executivă, legislativă, judecătorească. Organizare complexă, fotbal la fel."],
  "Algeria":["🇩🇿 Algeria e cea mai mare țară din Africa, dar 85% e Sahara. Fotbalul se joacă în restul de 15% — intensitate maximă.", "🇩🇿 Algeria a eliminat Germania la CM 2014, câștigând 2-1 după prelungiri. Nimeni nu s-a așteptat. Algeria s-a așteptat.", "🇩🇿 Riyad Mahrez a câștigat Premier League cu Leicester în 2016. Un titlu la fel de improbabil ca și cel al Algeriei la CAN 2019.", "🇩🇿 Algeria a câștigat CAN 2019 fără să piardă un meci. Portarul a primit mai puține goluri decât minute jucate.", "🇩🇿 Orașul Timgad din Algeria e un oraș roman antic complet conservat în deșert. Fotbalul algerian e la fel de bine conservat în tradiție.", "🇩🇿 Algeria exportă gaz natural în toată Europa. Și fotbaliști buni în tot Franța."],
  "Anglia":["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia a inventat fotbalul în 1863 și a câștigat un singur Mondial, în 1966. Cel mai prolific inventator cu cel mai slab palmares la propria invenție.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Football's coming home — cântecul englezilor la fiecare turneu din 1996. De fiecare dată, fotbalul a ales alt drum.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Gary Lineker nu a primit niciodată un cartonaș în cariera sa. Sfântul fotbalului englezesc.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League e transmisă în 212 teritorii — mai mult decât ONU are membri. Fotbalul englezesc e mai global decât politica.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia a pierdut de 3 ori împotriva Germaniei la penaltii la turnee importante. Trauma are statistici proprii.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Wembley a găzduit finala CM 1966, concertele lui Adele și finala Euro 2020. Priorități clare.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia bea 100 milioane de căni de ceai pe zi. Ceaiul nu ajută la penaltii."],
  "Arabia Saudita":["🇸🇦 Arabia Saudită a bătut Argentina 2-1 la CM 2022. Messi a stat 5 minute nemișcat pe bancă după fluierul final.", "🇸🇦 Arabia Saudită a cumpărat fotbal la pachet: Ronaldo, Benzema, Kanté, Mahrez — în același an. Strategia e clară.", "🇸🇦 Arabia Saudită a câștigat Cupa Asiei de 3 ori. Nu e doar petrol — e și fotbal cu ambiții reale.", "🇸🇦 Riad e printre cele mai calde orașe în care se joacă fotbal internațional. Hidratarea e armă tactică.", "🇸🇦 Arabia Saudită organizează CM 2034. Lumea fotbalului se mișcă spre est, cu viteze diferite.", "🇸🇦 Mecca primește 2 milioane de pelerini anual. Fotbalul saudit vrea audiențe similare."],
  "Argentina":["🇦🇷 Maradona a produs Mâna lui Dumnezeu și Golul Secolului în același meci, contra Angliei, 1986. Cel mai bun și cel mai controversat minut din istoria fotbalului.", "🇦🇷 Messi a plâns pe teren după câștigarea CM 2022. Publicul mondial a plâns cu el, inclusiv suporterii echipelor adverse.", "🇦🇷 Lotul Argentinei la CM 2022 valora peste 1 miliard de euro. La propriu. Un miliard.", "🇦🇷 Buenos Aires are cea mai mare densitate de psihologi din lume. Fotbalul explică cel puțin 30% din nevoi.", "🇦🇷 Argentina a câștigat Copa América de 15 ori. Dacă o comparezi cu numărul de crize politice, e aproape la egalitate.", "🇦🇷 Tango-ul s-a născut în mahalalele Buenos Aires-ului. La fel și stilul de fotbal al Argentinei.", "🇦🇷 Gabriel Batistuta a marcat 10 goluri la Cupe Mondiale. Fiecare a venit cu o grimasă de lup."],
  "Australia":["🇦🇺 Australia a bătut Argentina la penaltii la CM 2022. Nimeni — absolut nimeni — nu se gândea la asta.", "🇦🇺 Există mai mulți canguri decât oameni în Australia. Pe teren de fotbal, echipa e la fel de imprevizibilă.", "🇦🇺 Australia e singurul continent care e și o singură țară. Dimensiune de continent, lot de 23.", "🇦🇺 Tim Cahill a marcat cu capul de la 30 de metri contra Germaniei la CM 2010. Înălțimea contează mai puțin decât momentul.", "🇦🇺 Koala nu e urs — e marsupial. Doarme 22 de ore pe zi. Portarul australian a dormit mai puțin la CM 2022.", "🇦🇺 Marea Barieră de Corali e singurul organism viu vizibil din spațiu. Schimbările climatice o distrug. O emoție similară cu un gol în minutul 90."],
  "Austria":["🇦🇹 Salzburg a produs pe Haaland, Mané și Upamecano. Poate cel mai productiv club de talente din lume. Din Austria, nu din Spania.", "🇦🇹 Viena a fost de 3 ori consecutiv cel mai bun oraș în care să trăiești. Fotbalul nu a intrat în calcul.", "🇦🇹 Red Bull e austriac. Sponsorizează Salzburg, Leipzig, New York. Fotbalul, cafeina și ambițiile au același sponsor.", "🇦🇹 Austria a terminat pe locul 3 la CM 1954. De atunci, participările au venit și plecat discret.", "🇦🇹 Mozart s-a născut în Salzburg. Același oraș care produce acum fotbaliști pentru Champions League."],
  "Belgia":["🇧🇪 Belgia a stat 3 ani pe locul 1 FIFA. Titlu major câștigat în această perioadă: zero. Paradoxul suprem al fotbalului modern.", "🇧🇪 Kevin De Bruyne a fost cotat cel mai bun pasator din lume 4 ani consecutivi. Belgia nu a câștigat nimic în acei 4 ani.", "🇧🇪 Belgia a funcționat fără guvern 541 de zile în 2010-11 — record mondial. Fotbalul a mers tot timpul.", "🇧🇪 Belgia produce 750 de tipuri de bere. Bere câte beri, trofee mondiale — mai puține.", "🇧🇪 Jan Vertonghen a jucat pentru Belgia 15 ani. A văzut generația de aur de la start la final. Fără trofeu.", "🇧🇪 Bruxelles e capitala UE și sediul NATO. Belgia coordonează Europa dar nu reușește să câștige un titlu major."],
  "Bosnia":["🇧🇦 Bosnia a participat la CM pentru prima dată în 2014. Džeko a marcat la primul meci. Fotbalul nu a așteptat invitație.", "🇧🇦 Zlatan Ibrahimović are origini bosniace pe linie paternă. Baza genetică explică parțial.", "🇧🇦 Sarajevo a găzduit JO de iarnă 1984. Același oraș a văzut și un război. Rezistența e în ADN.", "🇧🇦 Bosniacii beau mai multă cafea per capita decât aproape orice națiune europeană. Cafea neagră, tare. Ca fotbalul lor.", "🇧🇦 Podul Stari Most din Mostar a fost construit în 1566, distrus în 1993 și reconstruit în 2004. Unesco și rezistență."],
  "Brazilia":["🇧🇷 Brazilia are 5 titluri mondiale. Trofeul Jules Rimet le-a fost dat definitiv în 1970. Practic l-au câștigat în proprietate.", "🇧🇷 7-1 cu Germania în 2014, pe teren propriu, în semifinale. 5 goluri în 18 minute. Brazilia a primit 5 goluri înainte de a înțelege ce se întâmplă.", "🇧🇷 Pelé a câștigat 3 Cupe Mondiale la 17, 21 și 29 de ani. Nicio altă persoană nu a bifat acest achievement.", "🇧🇷 Ronaldinho a câștigat Balonul de Aur 2005 și a jucat Beach Soccer la pensie. Unicitate completă.", "🇧🇷 Capoeira — arta marțială-dans braziliană — a fost inventată de sclavi ca să se antreneze fără să pară că se antrenează.", "🇧🇷 Brazilia e singura țară din America care vorbește portugheză. Și unica cu 5 titluri mondiale.", "🇧🇷 Neymar e cel mai scump transfer din istoria fotbalului: 222 milioane euro. Brazilia nu a câștigat un Mondial de la acel transfer."],
  "Canada":["🇨🇦 Canada are mai multe lacuri decât restul lumii la un loc. 563 mai mari de 100 km². Apa nu e problemă.", "🇨🇦 Alphonso Davies s-a născut în tabără de refugiați, a crescut în Canada și valorează 70 milioane euro la Bayern München. Povestea secolului.", "🇨🇦 Canada nu a marcat niciun gol la CM 1986 — prima și singura participare până în 2022. A revenit cu scor mai bun.", "🇨🇦 Hockey pe gheață e religie în Canada. Wayne Gretzky e Dumnezeul lui. Fotbalul e fratele mai mic care vrea și el atenție.", "🇨🇦 Toronto vorbește 200 de limbi zilnic — mai mult decât orice alt oraș din lume.", "🇨🇦 Canada are granița neguardată cea mai lungă din lume cu SUA — 8.891 km. Relație mai bună decât ar sugera fotbalul."],
  "Capul Verde":["🇨🇻 Capul Verde are o diasporă de 3 ori mai mare decât populația insulelor. Echipa națională vine din toată lumea.", "🇨🇻 Capul Verde nu are râuri permanente. Zero. Apa de băut vine din ploi și desalinizare. Adversarii vin cu mai multe resurse, dar nu întotdeauna mai mult curaj.", "🇨🇻 Capul Verde a eliminat Maroc la CAN 2021. Favoritul clar. Surpriza turneului.", "🇨🇻 Muzica Morna din Capul Verde e UNESCO — gen melancolic creat de oameni care trăiesc departe de casă. La fel ca jucătorii lor.", "🇨🇻 Insulele Capului Verde au fost nelocuite până în sec. XV. Portughezii le-au descoperit. Fotbaliștii lor descoperă Europa.", "🇨🇻 Capul Verde e format din 10 insule vulcanice. Cea mai înaltă are 2.829 m. Adversarii vin cu altitudinea lor."],
  "Cehia":["🇨🇿 Panenka a inventat lovitura cu chip la Euro 1976 contra lui Sepp Maier. Lovitura îi poartă numele pentru totdeauna. Faimă eternă dintr-o secundă.", "🇨🇿 Cehia produce și consumă mai multă bere per capita decât orice altă țară. Prioritățile sunt clare.", "🇨🇿 Petr Čech a purtat cască de hochei pe gheață la fotbal pentru tot restul carierei după 2006. Cel mai recognoscibil portar al generației.", "🇨🇿 Cehia (ca Cehoslovacia) a terminat pe locul 2 la CM 1934 și 1962. Finalist fără titlu — un club select.", "🇨🇿 Franz Kafka s-a născut în Praga. A scris despre absurd, birocrație și transformare. Un meci de fotbal ceh conține uneori toate trei."],
  "Coasta de Fildes":["🇨🇮 Drogba a negociat personal un armistițiu în războiul civil din Coasta de Fildes în 2006. Fotbalul a oprit un conflict real. Literalmente.", "🇨🇮 Coasta de Fildes produce 40% din cacaoul mondial. Ciocolata din toată lumea are rădăcini acolo.", "🇨🇮 Generația lui Drogba era considerată cea mai bună din Africa în 2006-2014. Niciodată n-a câștigat Mondialul.", "🇨🇮 Yaya Touré a câștigat Premier League, La Liga și CAN. A jucat ca centrul-box al generalei de aur ivoriene.", "🇨🇮 Abidjan e cel mai mare port din Africa de Vest. Cacao, cafea și fotbaliști buni ies pe acolo."],
  "Columbia":["🇨🇴 James Rodríguez a câștigat Gheata de Aur la CM 2014 cu 6 goluri. A venit practic din neant la nivel mondial.", "🇨🇴 René Higuita, portarul columbian, a inventat Scorpion Kick în 1995 — o apărare cu călcâiele în aer, la un meci demonstrativ. Nu oficial. Nu contează.", "🇨🇴 Columbia produce 10% din cafeaua mondială. Energia de la cafea se vede uneori pe teren.", "🇨🇴 Columbia a câștigat Copa América 2024 fără să primească gol în fazele eliminatorii. Apărare sau magie — dezbatere deschisă.", "🇨🇴 Carlos Valderrama, cu părul afro iconic, a fost capitanul Columbiei la 3 Cupe Mondiale. Coafura e la fel de faimoasă ca pasele lui."],
  "Coreea de Sud":["🇰🇷 Coreea de Sud a ajuns în semifinalele CM 2002. A eliminat Spania și Italia pe drum. Arbitrajul a rămas controversat. Performanța, nu.", "🇰🇷 Son Heung-min a câștigat Gheata de Aur în Premier League fără să bată un singur penalti. 23 de goluri, zero penaltii.", "🇰🇷 Park Ji-sung juca pe 3 posturi la Manchester United simultan, conform lui Sir Alex Ferguson.", "🇰🇷 Coreea de Sud e lider mondial în viteza internetului. K-pop e mai popular decât K-football, dar ambele au audiențe globale.", "🇰🇷 Seul are 25 de milioane de oameni în zona metropolitană. Suportul pentru echipa națională e proporțional."],
  "Croatia":["🇭🇷 Croatia a terminat pe locul 2 la CM 2018 și locul 3 în 2022. 4 milioane de oameni, rezultate de țară mare.", "🇭🇷 Luka Modrić a câștigat Balonul de Aur 2018 — primul altul decât Messi sau Ronaldo în 10 ani. A plâns la discurs.", "🇭🇷 Cravata a fost inventată în Croatia în sec. XVII. Un export cultural care valorează miliarde azi.", "🇭🇷 Croatia a eliminat Brazilia la CM 2022 la penaltii. Livaković a apărat 3 lovituri. Nimeni nu l-a prezis.", "🇭🇷 Coasta dalmată a Croației are peste 1.000 de insule. La fel de greu de numărat ca golurile ratate de adversarii lor."],
  "Curacao":["🇨🇼 Curaçao are 150.000 de locuitori — mai puțin decât un cartier din București. Una din cele mai mici echipe de la un Mondial.", "🇨🇼 Willemstad, capitala, e UNESCO pentru arhitectura olandezo-caribbeană colorată din sec. XVII.", "🇨🇼 Curaçao a eliminat Costa Rica la barajul CONCACAF pentru CM 2026. O victorie istorică pentru 150.000 de oameni.", "🇨🇼 Jucătorii lui Curaçao provin mai ales din Olanda, unde au crescut. Diaspora e strategia națională.", "🇨🇼 Curaçao e o insulă de 444 km². Pentru comparație, județul Ilfov e de 3 ori mai mare."],
  "Ecuador":["🇪🇨 Ecuador a deschis CM 2022 cu un 2-0 contra gazdei Qatar în meciul inaugural. Gazda n-a mai câștigat după aceea.", "🇪🇨 Enner Valencia a marcat 3 din cele 5 goluri ale Ecuadorului la CM 2022. Un singur om, un turneu întreg.", "🇪🇨 Quito, capitala, e la 2.850 m altitudine. Adversarii vin și nu pot respira normal câteva zile.", "🇪🇨 Insulele Galapagos fac parte din Ecuador. Darwin a vizitat insulele și a inventat teoria evoluției. Ecuador a evoluat și la fotbal.", "🇪🇨 Ecuador e traversat de Ecuator — linia de 0° latitudine. Există o linie galbenă pe un deal care marchează exact locul."],
  "Egipt":["🇪🇬 Egipt a câștigat CAN de 7 ori — record absolut. Nicio altă echipă africană nu e la mai mult de 4.", "🇪🇬 Mohamed Salah a marcat 200+ goluri pentru Liverpool. Orașul Liverpool i-a pus porecla «Egyptian King».", "🇪🇬 Egipt a câștigat CAN 2006, 2008, 2010 — 3 titluri consecutive. Record mondial la orice competiție continentală.", "🇪🇬 Ahmed Hassan a jucat 184 de meciuri pentru Egipt — record african.", "🇪🇬 Piramidele de la Giza sunt singura minune antică rămasă în picioare. Egipt a supraviețuit mai mult decât orice altă civilizație.", "🇪🇬 Cairo e cel mai mare oraș din Africa. Traficul e legendar. Fotbalul e singura activitate mai haotică."],
  "Elvetia":["🇨🇭 Elveția a eliminat Franta la Euro 2020 în optimi, de la 1-3, la penaltii. Favorita clară a pierdut. Elveția nu știa că ar fi trebuit să fie îngrijorată.", "🇨🇭 Elveția are 4 limbi oficiale. Echipa națională e multilingvă — franceză, germană, italiană în cabine.", "🇨🇭 CERN, cel mai mare accelerator de particule din lume, e la Geneva. Elveția produce știință și fotbal surprinzător.", "🇨🇭 Ceasurile elvețiene sunt atât de precise că sunt referință mondială. Portarul lor nu e mai puțin precis.", "🇨🇭 Granit Xhaka a fost huiduit la Arsenal, a revenit, a câștigat Bundesliga cu Leverkusen. Revenirile sunt tradiție elvețiană."],
  "Franta":["🇫🇷 Mbappé a marcat hat-trick în finala CM 2022 în ultimele 8 minute. Franta a pierdut la penaltii totuși. Dramă pură.", "🇫🇷 Franta a câștigat CM 1998 și 2018. Două generații complet diferite, același rezultat.", "🇫🇷 Lotul Frantei la CM 2022 valora peste 1,2 miliarde euro — cel mai scump din turneu. Și au ajuns în finală.", "🇫🇷 Zidane a marcat de 2 ori cu capul în finala CM 1998. La ultimul meci oficial, a dat cu capul în Materazzi. Carieră cinematografică.", "🇫🇷 Franta e cel mai vizitat stat din lume. Turnul Eiffel era planificat a fi demolat în 1909. Nimeni nu a vrut să-l dărâme.", "🇫🇷 Thierry Henry a marcat cu mâna la barajul cu Irlanda și s-a calificat. S-a calificat."],
  "Germania":["🇩🇪 Germania are 4 titluri mondiale și obiceiul enervant de a apărea exact când turneele devin serioase.", "🇩🇪 7-1 cu Brazilia în semifinale, 2014 — pe teren propriu. 5 goluri în 18 minute. Cel mai mare șoc din istoria turneului.", "🇩🇪 Miroslav Klose are 16 goluri la Mondiale — record mondial absolut. Nimeni nu s-a apropiat.", "🇩🇪 Germania are legea purității berii din 1516. Disciplina e în ADN. Pe teren, la fel.", "🇩🇪 Oliver Kahn a câștigat Mingea de Aur la CM 2002 — primul și singurul portar care a primit-o.", "🇩🇪 Thomas Müller a marcat 10 goluri la CM 2010 și 2014 combinate. E «Raumdeuter» — interpretul spațiului."],
  "Ghana":["🇬🇭 Ghana a ratat semifinala CM 2010 la penaltii cu Uruguay. Suárez a blocat cu mâna pe linie în ultimul minut. Fotbalul poate fi crud.", "🇬🇭 Ghana a câștigat CAN de 4 ori. Prima țară din Africa Sub-Sahariană independentă față de britanici, în 1957.", "🇬🇭 Asamoah Gyan e golgheterul all-time african la Mondiale cu 6 goluri — și a ratat penaltiul decisiv în 2010. Ironia supremă.", "🇬🇭 Ghana produce 30% din exportul mondial de cacao. Ciocolata Toblerone ar trebui să spună «mulțumim» în twi."],
  "Haiti":["🇭🇹 Haiti a fost prima republică neagră din lume, în 1804. Cu 200 de ani înainte de independența multor state africane.", "🇭🇹 Emmanuel Sanon a marcat pentru Haiti contra Italiei la CM 1974. Primul gol haitian la un Mondial. Legendă națională.", "🇭🇹 Haiti a câștigat Copa Caribe de mai multe ori. Forță tradițională în zona Caraibelor, ignorată de restul lumii.", "🇭🇹 Creola haitiană e singura limbă creolă cu statut oficial de limbă națională în Americi.", "🇭🇹 Haiti și Republica Dominicană împart insula Hispaniola. Granița e una din cele mai contrastante ecologic din lume."],
  "Iordania":["🇯🇴 Iordania conține Marea Moartă — cel mai jos punct de pe suprafața terestră: 430 m sub nivelul mării.", "🇯🇴 Iordania a ajuns în finala Cupei Asiei 2023. Cel mai bun rezultat din istoria lor.", "🇯🇴 Petra, orașul antic săpat în stâncă, a apărut în Indiana Jones. E și mai impresionant în realitate.", "🇯🇴 Iordania s-a calificat la CM 2026 prin baraj intercontinental. Un traseu care merită respect.", "🇯🇴 Wadi Rum, deșertul de nisip roșu, a servit ca decor pentru Lawrence of Arabia și Marte. Scenografie de Mondial."],
  "Irak":["🇮🇶 Irak a câștigat Cupa Asiei în 2007 — în timp ce țara era în plină instabilitate politică. Fotbalul a unit când nimic altceva nu putea.", "🇮🇶 Ahmed Radhi a marcat singurul gol al Irakului la un Mondial, în 1986, contra Belgiei. Legendă națională din acel moment.", "🇮🇶 Mesopotamia e leagănul primelor civilizații umane. Primii care au inventat scrisul, roata, agricultura. Nu și fotbalul, dar aproape.", "🇮🇶 Irak a jucat fotbal internațional acasă chiar și în perioade de conflict. Fotbalul nu s-a oprit niciodată."],
  "Iran":["🇮🇷 Iran a câștigat Cupa Asiei de 3 ori consecutiv: 1968, 1972, 1976. Dominanță regională solidă.", "🇮🇷 Mehdi Taremi a marcat o foarfecă spectaculoasă contra Angliei la CM 2022 — ales printre golurile turneului.", "🇮🇷 Persepolis e cel mai mare club din Iran — meciuri cu 100.000 de spectatori. Atmosfera e o armă tactică.", "🇮🇷 Iran are una din cele mai vechi civilizații neîntrerupte — peste 3.000 de ani. Fotbalul e tânăr față de asta.", "🇮🇷 Poetul Rumi s-a născut în Persia (Iran modern). Versurile lui sunt citate de milioane. Golurile iraniene, de mai puțini."],
  "Japonia":["🇯🇵 Japonia a eliminat Germania și Spania la CM 2022. Ambele conduceau la pauză. Japonia nu a primit memo-ul.", "🇯🇵 Japonia are milioane de automate de vânzare și poți cumpăra aproape orice dintr-una.", "🇯🇵 Kazuyoshi Miura a jucat fotbal profesionist la 56 de ani — record mondial de longevitate. King Kazu e legendă vie.", "🇯🇵 Bullet Train merge cu 320 km/h și are o medie de întârziere de 0.9 minute pe an. Precizie aplicată la tot.", "🇯🇵 Manga și anime japonez e consumat în 70 de țări. Captainul Tsubasa a inspirat generații de fotbaliști europeni.", "🇯🇵 Japonia are mai mult de 6.800 de insule. Pe una singură — Honshu — trăiesc 100 de milioane de oameni."],
  "Maroc":["🇲🇦 Maroc a fost prima echipă africană ajunsă în semifinalele unui Mondial. CM 2022. Milioane au plâns de bucurie acasă.", "🇲🇦 Maroc găzduiește una din cele mai vechi universități active din lume: Al-Qarawiyyin, fondată în 859 d.Hr.", "🇲🇦 Achraf Hakimi a marcat penaltiul decisiv contra Spaniei cu Panenka — la cel mai important meci din istoria Marocului.", "🇲🇦 Marocul consumă milioane de pahare de ceai de mentă pe zi. Un ritual social mai important decât masa.", "🇲🇦 Marrakech și Fes sunt orașe medievale cu piețe tradiționale funcționale și azi. Fotbalul e la fel de tradițional.", "🇲🇦 Maroc e singura țară africană cu coastă la Atlantic și la Mediterană simultan."],
  "Mexic":["🇲🇽 Mexic nu a trecut niciodată de sferturi la un Mondial — blestemul sferturilor e fenomen cultural. Cântece, meme-uri, documentare.", "🇲🇽 Stadionul Azteca e singurul care a găzduit 2 finale mondiale: 1970 și 1986. Și acum găzduiește meciuri la CM 2026.", "🇲🇽 Chicharito (Javier Hernández) e golgheterul all-time al Mexicului cu 52 de goluri. A jucat la Man United, Real Madrid, Leverkusen.", "🇲🇽 Mexico City are 22 de milioane de oameni. Traficul e atât de dens că elicopterele private sunt transport curent.", "🇲🇽 Mexic e biodiversitate la maxim: 5% din speciile lumii pe 1% din suprafața Pământului."],
  "Norvegia":["🇳🇴 Norvegia vine cu Haaland. Planul tactic începe simplu: găsiți-l pe băiatul mare. Restul urmează.", "🇳🇴 Erling Haaland a marcat 36 de goluri în sezonul 2022-23 în Premier League — record absolut al competiției.", "🇳🇴 Norvegia s-a calificat la CM 2026 — prima participare din 1998. 28 de ani de absență cu Haaland la final.", "🇳🇴 Martin Odegaard a devenit căpitanul Arsenalului la 23 de ani — cel mai tânăr din istoria clubului.", "🇳🇴 Norvegia are mai multă linie de coastă decât SUA, deși e de 30 de ori mai mică."],
  "Noua Zeelanda":["🇳🇿 Noua Zeelandă a participat la CM 2010 și nu a pierdut niciun meci — 3 egaluri. A ieșit totuși din grupe.", "🇳🇿 All Blacks au 77% rată de victorie — cea mai înaltă din orice sport echipă din istoria sportului.", "🇳🇿 Noua Zeelandă a acordat dreptul de vot femeilor în 1893 — prima țară din lume. Un secol de avans.", "🇳🇿 Noua Zeelandă are ~6 oi per persoană. Pe teren de fotbal, oile nu ajută.", "🇳🇿 Peter Jackson a filmat Stăpânul Inelelor acolo. Peisajele sunt atât de spectaculoase că Hollywood a venit la el."],
  "Olanda":["🇳🇱 Johan Cruyff a inventat fotbalul total în anii 1970. Un sistem care a schimbat tot. Olanda nu l-a câștigat niciodată pe Mondial.", "🇳🇱 Olanda a terminat pe locul 2 la CM 2010, 1974 și 1978. Cea mai bună echipă care nu a câștigat niciodată titlul suprem.", "🇳🇱 Marco van Basten a marcat gol din unghi imposibil în finala Euro 1988. Comentatorii au rămas muți 3 secunde.", "🇳🇱 Olanda are 25% din teritoriu sub nivelul mării — controlat de diguri și pompe. Rezistența e în ADN.", "🇳🇱 Olanda are mai mulți bicicliști decât oameni. Singura țară unde treci strada cu frică de biciclete, nu mașini."],
  "Panama":["🇵🇦 Panama s-a calificat la CM 2018 și toată țara a oprit activitatea pentru meciul inaugural. Muncitorii și-au lăsat sculele.", "🇵🇦 Canalul Panama scurtează drumul maritim cu 15.000 km între Atlantic și Pacific. Cel mai important shortcut din lume.", "🇵🇦 Panama a câștigat prima victorie la un Mondial în 2018 contra Tunisia. Inscripționat în istoria națională.", "🇵🇦 Roman Torres a marcat golul calificant al Panamei la CM 2018. E monument național. Literalmente."],
  "Paraguay":["🇵🇾 Chilavert, portarul paraguayan, a marcat 62 de goluri din penaltii și lovituri libere — record mondial pentru portari.", "🇵🇾 Paraguay e una din cele două țări fără ieșire la mare din America de Sud. Tot au ajuns la Mondiale.", "🇵🇾 Paraguay are două limbi oficiale: spaniola și guaraní — singura limbă indigenă americană cu statut oficial.", "🇵🇾 Paraguay a ajuns în sferturile CM 2010 cu fotbal defensiv solid. Cine zice că apărarea e plictisitoare?"],
  "Portugalia":["🇵🇹 Cristiano Ronaldo a marcat 128 de goluri pentru Portugalia — record mondial absolut la goluri înscrise pentru o națională.", "🇵🇹 Eusébio a marcat 9 goluri la CM 1966. Portugalia a terminat pe locul 3. Un singur om a dus o națiune pe podium.", "🇵🇹 Portugalia a câștigat Euro 2016 cu un gol al lui Éder în prelungiri. Éder juca la Lille. Nu la Real Madrid. La Lille.", "🇵🇹 Portugalia a navigat toate coastele Africii, Asiei și Americii în sec. XV-XVI. Fotbaliști exploratori.", "🇵🇹 Fado-ul — muzica melancolică portugheză — e UNESCO. Saudade e un cuvânt intraductibil care înseamnă dor profund."],
  "Qatar":["🇶🇦 Qatar a organizat CM 2022 — primul Mondial de iarnă, primul în Orientul Mijlociu. Și primul gazdă care a ieșit din grupe fără victorie.", "🇶🇦 Lusail Iconic Stadium are 88.966 de locuri. Mai mare decât oricare stadion din Europa.", "🇶🇦 Doha a crescut din sat de pescari de 30.000 în 1950 la 2,5 milioane în 2020. 70 de ani, oraș ultramodern.", "🇶🇦 Qatar are cel mai mare PIB per capita din lume datorat gazului natural. Bani sunt. Fotbal la Mondiale — în formare."],
  "RD Congo":["🇨🇩 RD Congo revine la Mondial după 52 de ani — cel mai lung interval de revenire din istoria turneului.", "🇨🇩 Kinshasa e cel mai mare oraș francofon din lume cu 17 milioane de oameni. Paris e al doilea.", "🇨🇩 Muzica Rumba Congoleză e UNESCO — un gen care a influențat muzica africană pe 3 continente.", "🇨🇩 Fluviul Congo e al doilea ca debit din lume după Amazon. Forță naturală. Ca fotbalul lor azi."],
  "SUA":["🇺🇸 SUA a înregistrat în 1994 cea mai mare medie de spectatori per meci din istoria CM — 68.626. Americanii au descoperit fotbalul târziu, dar cu entuziasm.", "🇺🇸 Christian Pulisic a marcat golul calificant al SUA la CM 2022 și a ieșit accidentat din teren. Sacrificiu de centru.", "🇺🇸 SUA are 4 Cupe Mondiale feminine — recordul mondial absolut. La feminin, SUA e Brazilia fotbalului.", "🇺🇸 Tim Howard a apărat 16 șuturi contra Belgiei la CM 2014 — record mondial la un meci eliminator.", "🇺🇸 Super Bowl-ul atrage mai mulți telespectatori decât orice alt eveniment sportiv. CM 2026 vrea să bată recordul."],
  "Scotia":["🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scoția și Anglia au jucat primul meci internațional din istoria fotbalului, în 1872 — 0-0. Chiar și prima dată, un 0-0.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Denis Law a marcat golul care a retrogradat Anglia în 1975 — cu spatele la poartă, cu călcâiul. A celebrat cu tristețe.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Celtic și Rangers — The Old Firm — e unul din cele mai urmărite derby-uri locale din lume.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scoția s-a calificat la CM 2026 — prima participare din 1998. 28 de ani de așteptare.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Whisky-ul scotch e exportat în 180 de țări. O industrie de 6 miliarde de lire. Mândrie națională numărul 2 după fotbal."],
  "Senegal":["🇸🇳 Senegal a eliminat Franta la CM 2002 — campioana mondială în exercițiu. La primul meci al grupei.", "🇸🇳 Sadio Mané a câștigat Premier League, Champions League și CAN în carieră. Definește generația de aur.", "🇸🇳 Senegal a câștigat CAN 2021 și CAN 2022 — două titluri consecutive. Performanță rară în Africa.", "🇸🇳 Kalidou Koulibaly a jucat la Napoli, Chelsea și Al-Hilal. Fundaș central african de generație."],
  "Spania":["🇪🇸 Spania a câștigat Euro 2024 cu cei mai tineri jucători de start din istoria turneului final. Generația nouă funcționează.", "🇪🇸 Iniesta a marcat golul finalei CM 2010 în prelungiri. A băut vin de la vie proprie după. Celebrare perfectă.", "🇪🇸 Real Madrid și Barcelona au câștigat împreună 22 de titluri Champions League din 69 de ediții. Monopol iberic.", "🇪🇸 Spania joacă posesie și te adoarme, apoi te bate 1-0. Eficient. Enervant. Câștigător.", "🇪🇸 Spania a câștigat CM 2010, Euro 2008, 2012, 2024. Cea mai dominantă perioadă din istoria fotbalului european."],
  "Suedia":["🇸🇪 Zlatan a marcat din foarfecă de la 30 de metri contra Angliei în 2013. Comentatorul a tăcut 4 secunde și a zis «incredible».", "🇸🇪 Zlatan Ibrahimović a marcat 62 de goluri pentru Suedia — record național absolut pe care nimeni nu pare să-l atingă.", "🇸🇪 Suedia a terminat pe locul 3 la CM 1994 și locul 2 în 1958. O națiune mică cu palmares mai mare decât așteptările.", "🇸🇪 Spotify a fost fondată la Stockholm. Suezia a inventat streamingul muzical și produce fotbaliști buni. Multitasking.", "🇸🇪 IKEA, H&M, Volvo, Ericsson — toate suedeze. Export de design, tehnologie și mijlocași talentați."],
  "Tunisia":["🇹🇳 Tunisia a bătut Franta la CM 2022 — campioana mondială. Franta rotise lotul, Tunisia a jucat serios. Victorie istorică.", "🇹🇳 Tunisia a fost prima echipă africană care a câștigat un meci la CM, în 1978 — Mexic 3-1. Africa a marcat în 1978.", "🇹🇳 Cartagina, una din marile puteri antice, se afla pe coasta tunisiană. Hannibal traversa Alpii cu elefanți de acolo.", "🇹🇳 Tunisia a terminat pe locul 1 în grupă la CM 2022, înaintea Frantei. A ieșit pe golaveraj totuși. Matematica e brutală.", "🇹🇳 Tunisia e poarta de intrare în Africa de Nord — climat mediteranean, cultură mixtă, fotbal solid."],
  "Turcia":["🇹🇷 Hakan Şükür a marcat în 11 secunde la CM 2002 — cel mai rapid gol din istoria Mondialelor.", "🇹🇷 Turcia a terminat pe locul 3 la CM 2002. Performanță nerepetată de atunci.", "🇹🇷 Istanbul e singurul oraș din lume aflat pe două continente simultan. Europa pe malul stâng, Asia pe malul drept.", "🇹🇷 Turcia produce 75% din alunele mondiale. Nutella are un furnizor garantat.", "🇹🇷 Hagia Sophia, construită în 537 d.Hr., a fost catedrală, moschee, muzeu și din nou moschee. Versatilitate de 1.500 de ani."],
  "Uruguay":["🇺🇾 Maracanazo 1950: Uruguay a bătut Brazilia pe Maracanã, în fața a 200.000 de suportători. Cel mai mare șoc din istoria fotbalului.", "🇺🇾 Uruguay a câștigat CM 1930 și CM 1950 — primele două turnee mondiale. Fundația fotbalului sud-american.", "🇺🇾 Darwin Núñez a costat Liverpool 85 milioane euro. Cel mai scump uruguayan din istoria fotbalului.", "🇺🇾 Uruguay a câștigat Copa América de 15 ori — record mondial la orice competiție continentală.", "🇺🇾 Luis Suárez a blocat cu mâna pe linia porții contra Ghanei în CM 2010. A fost eliminat. A plâns pe teren. Ghana a ratat penaltiul."],
  "Uzbekistan":["🇺🇿 Uzbekistan e singurul stat din lume înconjurat doar de țări terminate în «-stan».", "🇺🇿 În Uzbekistan, pâinea e considerată sacră și nu se pune niciodată cu fața în jos pe masă.", "🇺🇿 Samarkand a fost cel mai important nod al Drumului Mătăsii — calea comercială China-Europa.", "🇺🇿 Uzbekistan e la primul Mondial FIFA senior — o premieră absolută.", "🇺🇿 Uzbekistanul e una din doar 2 țări din lume complet înconjurate de alte state fără ieșire la mare.", "🇺🇿 Registan din Samarkand — piața cu 3 madrase medievale — e considerată una din cele mai frumoase piețe din lume."],
};

// ── BANTER POOLS ─────────────────────────────────────────────────────────────
// Tabloid voice. Sharp. Friendly. No generic AI phrases.
const T_EXACT=[
  (n,m)=>`🎯 ${n} a ghicit scorul la ${m}. FIFA a deschis o investigație informală.`,
  (n,m)=>`🔮 ${n} n-a prezis, a scurs scenariul de la ${m}. Grupul cere parolă de la contul lui.`,
  (n,m)=>`🧙 ${n} cu scor exact la ${m}. Se cere control antidoping la globul de cristal.`,
  (n,m)=>`📡 ${n} a recepționat semnalul de la ${m} când toți ceilalți aveau interferențe.`,
  (n,m)=>`🏹 ${n} direct în centrul dianaei la ${m}. Ceilalți vedeau cu totul alt meci.`,
  (n,m)=>`🃏 ${n} a jucat cartea perfectă la ${m}. Ceilalți au jucat cu o punte greșită.`,
  (n,m)=>`🦊 ${n} la ${m}: scor exact când nimeni nu se uita. Stilul vulpii.`,
  (n,m)=>`⚡ ${n} la ${m}: scor exact din prima. Nici măcar n-a transpirat.`,
  n=>`🎯 ${n} a ghicit scorul. FIFA investigatorii au fost notificați.`,
  n=>`🔮 ${n} n-a prezis, a scurs scenariul. Grupul cere parolă de la contul lui.`,
  n=>`🧙 ${n} cu scor exact. Se cere control antidoping la globul de cristal.`,
  n=>`📡 ${n} a recepționat semnalul corect când toți aveau interferențe.`,
  n=>`🏹 ${n} direct în centrul dianaei. Precizie fără explicație plauzibilă.`,
  n=>`🎯 ${n}: scor exact confirmat. Grupul investighează discret.`,
  n=>`⚡ ${n}: scor exact din prima. Nici măcar n-a transpirat.`,
  n=>`🦊 ${n}: scor exact când nimeni nu se uita. Stilul vulpii.`,
];
const T_ZERO=[
  (n,m)=>`🤦 ${n} la ${m}: a prezis cu televizorul stins și telecomanda în altă cameră.`,
  (n,m)=>`🪦 ${n} la ${m}: predicția a murit liniștit în primele minute.`,
  (n,m)=>`🍿 ${n} la ${m}: a venit pentru spectacol și a plecat fără puncte.`,
  (n,m)=>`😶 ${n} la ${m}: 0 puncte. Meciul nu a colaborat cu predicția sub nicio formă.`,
  (n,m)=>`🎭 ${n} la ${m}: tragedie completă. Toate câmpurile greșite simultan.`,
  (n,m)=>`🌵 ${n} la ${m}: 0 puncte. A supraviețuit secetei de predicție.`,
  (n,m)=>`🎲 ${n} la ${m}: a aruncat zarul și a ieșit față greșită de fiecare dată.`,
  (n,m)=>`😴 ${n} la ${m}: predicție somnoroasă cu rezultat la înălțimea somnului.`,
  n=>`🤦 ${n}: a prezis cu televizorul stins și telecomanda în altă cameră.`,
  n=>`🪦 ${n}: predicția a murit liniștit în primele minute.`,
  n=>`🍿 ${n}: a venit pentru spectacol și a plecat fără puncte.`,
  n=>`😶 ${n}: 0 puncte. Meciul nu a colaborat cu predicția sub nicio formă.`,
  n=>`🎭 ${n}: tragedie completă. Toate câmpurile greșite simultan.`,
  n=>`🌵 ${n}: 0 puncte. A supraviețuit secetei de predicție.`,
  n=>`🎲 ${n}: zarul a dat față greșită de fiecare dată.`,
  n=>`😴 ${n}: predicție somnoroasă cu rezultat la înălțimea somnului.`,
];
const T_UP=[
  (n,r)=>`🚀 ${n} a urcat în clasament ca liftul la mall. Fără semnalizare. Locul ${r}.`,
  (n,r)=>`⚡ ${n} accelerează. Nimeni n-a văzut de unde a apărut. Locul ${r}.`,
  (n,r)=>`🧨 ${n}: locul ${r}. Motor ascuns, confirmat.`,
  (n,r)=>`🔥 ${n}: locul ${r}. Temperatura în clasament a crescut cu un grad.`,
  (n,d,r)=>`🧨 ${n} sare ${d} locuri la ${r}. Cineva verifică dacă are motor ascuns.`,
  (n,d,r)=>`🚀 ${n}: +${d} locuri. Periculos pentru cine e deasupra. Locul ${r}.`,
  n=>`🚀 ${n} urcă. Meciul a spus tot ce trebuia.`,
  n=>`📈 ${n} în ascensiune. Clasamentul simte mișcarea.`,
  n=>`⚡ ${n} accelerează fără să anunțe pe nimeni.`,
  n=>`🔥 ${n} arde în clasament. Nu glumă.`,
  n=>`🏃 ${n} aleargă spre top fără bilet de întoarcere.`,
];
const T_DOWN=[
  (n,r)=>`📉 ${n}: locul ${r}. Clasamentul nu iartă, doar notează.`,
  (n,r)=>`😬 ${n}: locul ${r}. Clasamentul nu iartă. Niciodată.`,
  (n,r)=>`🪦 ${n}: locul ${r}. VAR-ul nu poate interveni în clasament.`,
  (n,d,r)=>`📉 ${n} coboară ${d} locuri — pe ${r}. Teren pierdut, urgență crescută.`,
  (n,d,r)=>`😬 ${n}: ${d} locuri în jos, pe ${r}. Recalculare necesară imediat.`,
  n=>`📉 ${n} coboară. Meciul următor e decisiv.`,
  n=>`😬 ${n} pierde teren. Clasamentul notează fără milă.`,
  n=>`🪦 ${n} mai coboară un loc. VAR-ul nu intervine în clasament.`,
  n=>`💀 ${n}: puncte urgente necesare.`,
  n=>`🎭 ${n} în drama clasamentului. Scriptul nu e bun.`,
];

// ── MATCH STORY VOICE ─────────────────────────────────────────────────────────
// Tabloid voice. Use real data. Make it worth reading.
const _matchStory=(name,sA,sB,hSc,aSc,cards,corners)=>{
  const t=sA+sB; const items=[];
  // Goal story — voice varies by count
  if(t>=5)items.push(_p8([
    (m,t)=>`${m}: ${t} goluri. Dacă ai pus scor mare, azi îți plătești concediul.`,
    (m,t)=>`${t} goluri la ${m}. Apărările au lipsit motivat — sau deloc.`,
    (m,t)=>`${m} a dat ${t} goluri în 90 de minute. Medie de un gol la ${Math.round(90/t)} minute.`,
    (m,t)=>`${t} la ${m}. Portarii au văzut mingea mai des decât și-ar fi dorit.`,
  ],name,t)(name,t));
  else if(t===4)items.push(_p8([
    (m)=>`${m}: 4 goluri. Meciul nu a dezamăgit față de predicțiile îndrăznețe.`,
    (m)=>`4 goluri la ${m}. Suficient pentru un top YouTube al zilei.`,
  ],name)(name));
  else if(t===3)items.push(_p8([
    (m)=>`${m}: 3 goluri. Meciu cu ritm — nu toate au rămas la 0-0 la pauză.`,
    (m)=>`3 goluri la ${m}. Câteva predicții au primit viață, altele au murit.`,
  ],name)(name));
  else if(t===0)items.push(_p8([
    m=>`${m}: 0-0. Goalkeepers worked. Strikers attended. 0 goluri.`,
    m=>`${m}: 0-0. Cine a pariat pe spectacol și-a cerut banii înapoi.`,
    m=>`${m} s-a blocat la 0-0. Portarii au câștigat. Publicul — mai puțin.`,
    m=>`${m}: 0-0. Undeva, un specialist în apărare e fericit. Restul, mai puțin.`,
  ],name)(name));
  else if(t===1)items.push(_p8([
    m=>`${m}: 1 gol, 89 de minute de chin. Cineva s-a trezit erou fără să planifice.`,
    m=>`${m}: un singur gol a hotărât tot. Scriptul a livrat minimul dramatic.`,
    m=>`${m}: 1-0. Cine l-a prezis exact e erou discret al zilei.`,
  ],name)(name));
  else if(sA===sB)items.push(_p8([
    (m,s)=>`${m}: ${s}-${s}. Egal matematic și moral. Clasamentul ia câte un punct de la fiecare.`,
    (m,s)=>`${m}: ${s}-${s}. Nici una, nici alta. Diplomație cu gheată.`,
    (m,s)=>`${m}: ${s} goluri fiecare. Punctele se împart, frustrările — nu.`,
  ],name,sA)(name,sA));
  else{const d=Math.abs(sA-sB);const w=sA>sB?'gazdele':'oaspeții';
    items.push(_p8([
      (m,d,w)=>`${m}: ${sA}-${sB}. ${d === 1 ? 'Un gol diferență, dar suficient.' : d + ' goluri diferență — fără discuții.'}`,
      (m,d,w)=>`${m}: ${sA}-${sB}. ${w.charAt(0).toUpperCase()+w.slice(1)} au vrut mai mult. S-a văzut pe tabelă.`,
      (m,d,w)=>`${m}: ${sA}-${sB}. ${w.charAt(0).toUpperCase()+w.slice(1)} au câștigat. Restul — nu.`,
    ],name,d,w)(name,d,w));}
  // Scorers — named, tabloid voice
  if(hSc||aSc){
    const parts=[];
    if(hSc)parts.push(hSc);
    if(aSc)parts.push(aSc);
    const joined=parts.join(' / ');
    items.push(_p8([
      (m,s)=>`⚽ ${m}: golurile poartă numele ${s}.`,
      (m,s)=>`${m} — marcatori: ${s}.`,
      (m,s)=>`${s} — ei au scris meciul la ${m}.`,
    ],name,hSc||'',aSc||'')(name,joined));
  }
  // Cards
  if(cards>=8)items.push(_p8([
    (m,c)=>`${c} cartonașe la ${m}. Dacă ai pariat pe galbene, astăzi e ziua ta.`,
    (m,c)=>`${m}: ${c} cartonașe. Arbitrul a lucrat ore suplimentare.`,
    (m,c)=>`${m} a produs ${c} cartonașe. Suficient pentru un episod de dramă sportivă.`,
  ],name,cards)(name,cards));
  else if(cards>=5)items.push(_p8([
    (m,c)=>`${c} cartonașe la ${m}. Fotbal fizic cu nervi scurți.`,
    (m,c)=>`${m}: ${c} cartonașe. Meciul s-a jucat și pe regulament.`,
  ],name,cards)(name,cards));
  // Corners
  if(corners>=14)items.push(_p8([
    (m,c)=>`${m} a avut ${c} cornere. Mingea a vizitat stegulețul atât de des că ar fi trebuit să plătească chirie.`,
    (m,c)=>`${c} cornere la ${m}. Constructorii stegulețelor de corner au avut ziua lor.`,
    (m,c)=>`${m}: ${c} cornere. Atacanții au preferat linia de fund ca rampă de lansare.`,
  ],name,corners)(name,corners));
  else if(corners>=10)items.push(_p8([
    (m,c)=>`${c} cornere la ${m}. Portarii au văzut mingea din unghiuri neplăcute.`,
    (m,c)=>`${m}: ${c} cornere. Mulți, eficienți — sau nu, depinde de scor.`,
  ],name,corners)(name,corners));
  return items;
};

export function generateActivityFeed({
  leaderboard=[],prevLeaderboard=[],finishedResults={},
  allPredictions={},allUsers={},matches=[],
}={}) {
  const events=[];let seq=0;
  const ev=(type,text,priority=5)=>
    events.push({id:`feed_${Date.now()}_${seq++}`,type,icon:'',text,ts:Date.now(),priority});
  const nickOf=uid=>allUsers[uid]?.nickname||uid;
  const n=leaderboard.length;

  const mpreds=(matchId,match)=>{
    const out=[];
    Object.entries(allPredictions).forEach(([uid,mp])=>{
      const p=mp[matchId]||mp[String(matchId)];if(!p)return;
      const pts=calcPoints(p,match)||0;
      const pA=Number(p.scoreA),pB=Number(p.scoreB);
      const rA=Number(match.realScoreA),rB=Number(match.realScoreB);
      out.push({uid,nick:nickOf(uid),pts,exact:pA===rA&&pB===rB,
        ok:(rA>rB?'1':rA<rB?'2':'X')===(pA>pB?'1':pA<pB?'2':'X'),
        pCards:p.possession!=null?Number(p.possession):null,pA,pB});
    });
    return out;
  };

  const todayStart=new Date();todayStart.setHours(0,0,0,0);
  const todayEnd=new Date(todayStart);todayEnd.setDate(todayEnd.getDate()+1);
  const isToday=t=>{const d=new Date(t);return d>=todayStart&&d<todayEnd;};

  // Context teams: live + last 2 finished + today upcoming + next match
  const ctxTeams=new Set();
  const finishedMatches=[...matches.filter(m=>m.isFinished)]
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  const liveMatches=matches.filter(m=>m.isLive);
  const todayMatches=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM8(m)&&isToday(m.time));
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM8(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];
  const latestFinished=finishedMatches.slice(0,2);

  [...liveMatches,...latestFinished,...todayMatches].forEach(m=>{
    if(_isWCM8(m)){ctxTeams.add(_n8(m.teamA));ctxTeams.add(_n8(m.teamB));}
  });
  if(nextMatch){ctxTeams.add(_n8(nextMatch.teamA));ctxTeams.add(_n8(nextMatch.teamB));}

  const ctxFact=(team,seed=0)=>{
    const canon=_n8(team);
    if(!_isOff8(team)||!ctxTeams.has(canon))return null;
    const facts=CUR8[canon];if(!facts||!facts.length)return null;
    return _p8(facts,canon,seed);
  };

  // ── BLOCK A: LIVE ────────────────────────────────────────────────────────────
  liveMatches.forEach(m=>{
    const sA=m.realScoreA??0,sB=m.realScoreB??0;
    const parts=[];
    if(m.liveMinute!=null)parts.push(`${m.liveMinute}'`);
    if(m.homeScorers)parts.push(`⚽ ${m.teamA}: ${m.homeScorers}`);
    if(m.awayScorers)parts.push(`⚽ ${m.teamB}: ${m.awayScorers}`);
    if(m.liveCards)parts.push(`🟨 ${m.liveCards}`);
    if(m.liveCorners)parts.push(`🚩 ${m.liveCorners}`);
    const det=parts.length?` (${parts.join(' · ')})`:'';
    ev('live',`🔴 LIVE: ${m.teamA} ${sA}–${sB} ${m.teamB}${det}`,11);
    if(sA>sB&&m.liveMinute)ev('live_hype',`🔥 ${m.teamA} conduce cu ${sA-sB}. ${m.teamB} mai are ${90-m.liveMinute} minute să întoarcă soarta.`,10);
    else if(sB>sA&&m.liveMinute)ev('live_hype',`⚠️ ${m.teamB} conduce cu ${sB-sA}. ${m.teamA} în recuperare — ${90-m.liveMinute} minute rămase.`,10);
    else if(m.liveMinute>70)ev('live_hype',`⏱️ Egal în ${m.liveMinute}'. Oricine marchează acum scrie istoria zilei.`,10);
    else ev('live_hype',`⚖️ ${m.teamA} ${sA}-${sB} ${m.teamB} — orice se poate întâmpla.`,10);
    const f=ctxFact(m.teamA,m.id)||ctxFact(m.teamB,m.id+99);
    if(f)ev('curiosity',f,5);
  });

  // ── BLOCK B: LAST 2 FINISHED (dominate the feed) ────────────────────────────
  let predCount=0; const PCAP=2; // max 2 banter per feed

  latestFinished.forEach((match,idx)=>{
    const BASE=idx===0?10:9;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const corners=rCornT??(rCornH!=null&&rCornA!=null?rCornH+rCornA:null);
    const isWC=_isWCM8(match);
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const top=[...mp].sort((a,b)=>b.pts-a.pts)[0];

    // Match stories — tabloid voice
    const storyItems=_matchStory(mName,sA,sB,match.homeScorers,match.awayScorers,rCards??0,corners??0);
    storyItems.forEach((text,i)=>ev('match_story',text,BASE+1-i*0.1));

    // Country curiosities — tabloid facts, contextual only
    if(isWC){
      [match.teamA,match.teamB].forEach((team,i)=>{
        const f=ctxFact(team,match.id+i*100);
        if(f)ev('curiosity',f,BASE-0.5);
      });
    }

    // Banter — max PCAP total, varied
    if(exact.length===1&&predCount<PCAP){
      ev('exact',_c8(T_EXACT,[exact[0].nick,match.id,'ex'],exact[0].nick,mName),BASE+2);predCount++;
    }else if(exact.length>=2&&predCount<PCAP){
      const names=exact.slice(0,3).map(e=>e.nick).join(', ');
      ev('exact',`🎯 ${names} — scor exact la ${mName}. FIFA investigatorii au fost notificați.`,BASE+2);predCount++;
    }
    const zeroes=mp.filter(p=>p.pts===0);
    if(zeroes.length===1&&predCount<PCAP){
      ev('miss',_c8(T_ZERO,[zeroes[0].uid,match.id,'z'],zeroes[0].nick,mName),BASE-2);predCount++;
    }
    // Upset
    if(mp.length>=3&&mp.filter(p=>p.ok).length===0)
      ev('upset',`😱 ${mName}: niciun jucător nu a prezis corect rezultatul. Fotbalul a câștigat.`,BASE);
    // Best scorer
    if(top&&top.pts>=80&&top.pts>0)
      ev('best',`🏅 ${top.nick}: ${top.pts} pts la ${mName}. Cel mai bun din grupul de azi.`,BASE-1);
  });

  // ── BLOCK C: TODAY UPCOMING / NEXT MATCH ────────────────────────────────────
  const T_PRE=[
    (a,b)=>`🔥 ${a} – ${b} azi. 90 de minute, o predicție, și poate un conflict diplomatic în grup.`,
    (a,b)=>`⚽ ${a} vs ${b}: tipul de meci unde un 1-1 banal rupe clasamentul de față.`,
    (a,b)=>`🎯 Scor exact la ${a} – ${b}: 100 puncte și o săptămână de lăudăroșenie.`,
    (a,b)=>`🧠 ${a} – ${b}: simplu de urmărit, complicat de prezis. Cartonașele — mai ales.`,
    (a,b)=>`🥶 ${a} – ${b}: un gol în minutul 88 poate strica o seară întreagă.`,
    (a,b)=>`🎲 La ${a} – ${b}, cine nimerează cartonașele merită un titlu onorific în grup.`,
    (a,b)=>`📺 ${a} – ${b}: dacă ai pus 0-0, ai nevoie fie de curaj, fie de noroc pur.`,
    (a,b)=>`🌪️ ${a} – ${b}: pronosticul e gata? Clasamentul nu mai are răbdare.`,
  ];
  const todayOff=matches.filter(m=>_isWCM8(m)&&!m.isFinished&&!m.isLive&&isToday(m.time));
  todayOff.slice(0,2).forEach(m=>{
    ev('preview',_c8(T_PRE,[m.id,'pre'],m.teamA,m.teamB),3);
    [m.teamA,m.teamB].forEach((t,i)=>{const f=ctxFact(t,m.id+i*200);if(f)ev('curiosity',f,3);});
  });
  if(nextMatch&&todayOff.length===0){
    ev('preview',_c8(T_PRE,[nextMatch.id,'nxt'],nextMatch.teamA,nextMatch.teamB),3);
    [nextMatch.teamA,nextMatch.teamB].forEach((t,i)=>{const f=ctxFact(t,nextMatch.id+i*300);if(f)ev('curiosity',f,3);});
  }

  // ── BLOCK D: LEADERBOARD (max 2, only if drama) ─────────────────────────────
  let rc=0;
  if(prevLeaderboard.length>0&&n>=2){
    leaderboard.forEach(entry=>{
      if(rc>=2)return;
      const prev=prevLeaderboard.find(p=>p.nickname===entry.nickname);if(!prev)return;
      const delta=prev.rank-entry.rank,nick=entry.nickname;
      if(entry.rank===1&&prev.rank>1){
        const d=prevLeaderboard.find(p=>p.rank===1)?.nickname||'?';
        ev('lead',_p8([(n,p)=>`👑 ${n} detronează pe ${p}. Tronul a schimbat proprietarul.`,(n,p)=>`🏆 ${n} preia coroana de la ${p}. Drama continuă.`,(n,p)=>`🍾 ${n} a pus șampania la rece. ${p} recalculează tot.`],nick,d)(nick,d),11);rc++;
      }
      if(prev.rank===1&&entry.rank>1&&rc<2){ev('fall',`😬 ${nick} pierde primul loc. Clasamentul nu iartă, niciodată.`,10);rc++;}
      if(entry.rank<=3&&prev.rank>3&&rc<2){ev('top3',`🚀 ${nick} intră în Top 3. Locul ${entry.rank}. Cineva să-i verifice ghetele.`,9);rc++;}
      if(entry.rank>3&&prev.rank<=3&&rc<2){ev('top3_exit',`🥉 ${nick} iese din Top 3 — locul ${entry.rank}. Clasamentul e brutal.`,9);rc++;}
      if(delta>=3&&entry.rank>1&&rc<2){ev('rank_up',_c8(T_UP,[nick,delta,entry.rank,'up'],nick,delta,entry.rank),8);rc++;}
      else if(delta===2&&entry.rank>1&&rc<2){ev('rank_up',_c8(T_UP,[nick,entry.rank,'up2'],nick,entry.rank),7);rc++;}
      if(delta<=-2&&rc<2){ev('rank_down',_c8(T_DOWN,[nick,Math.abs(delta),entry.rank,'dn'],nick,Math.abs(delta),entry.rank),7);rc++;}
    });
    const L=leaderboard[0],S=leaderboard[1],pL=prevLeaderboard[0],pS=prevLeaderboard[1];
    if(L&&S&&pL&&pS){
      const gap=L.points-S.points,pg=pL.points-pS.points;
      if(gap>pg&&gap>=20)ev('gap',`👑 ${L.nickname} extinde avantajul la ${gap} puncte. ${S.nickname} are de lucru serios.`,7);
      else if(gap<pg&&gap>0&&gap<=15)ev('chase',`⚔️ Doar ${gap} puncte despart locul 1 de locul 2. Nimeni nu doarme confortabil.`,8);
    }
  }
  if(n>=3){const l=leaderboard[0],t=leaderboard[2],sp=l.points-t.points;
    if(sp<=20&&sp>=0&&l.points>0)ev('drama',`⚔️ ${sp} puncte despart locul 1 de locul 3. Un singur meci schimbă tot.`,6);}

  // ── FINAL: dedup, priority sort, mix enforcement ────────────────────────────
  // Target per 12: 4 match_story, 3 curiosity, 2 exact/miss, 1-2 leaderboard
  const seen=new Set();
  const deduped=events
    .filter(e=>{if(seen.has(e.text))return false;seen.add(e.text);return true;})
    .sort((a,b)=>(b.priority-a.priority)||(b.ts-a.ts));

  const BANTER_T=new Set(['exact','miss','near']);
  const LB_T=new Set(['lead','fall','top3','top3_exit','rank_up','rank_down','gap','chase','drama']);
  const tc={};const pc={};const result=[];
  const cb=bucket=>[...bucket].reduce((s,t)=>s+(tc[t]||0),0);

  for(const e of deduped){
    if(result.length>=15)break;
    if(BANTER_T.has(e.type)&&cb(BANTER_T)>=2)continue;
    if(LB_T.has(e.type)&&cb(LB_T)>=2)continue;
    const r2=result.slice(-2).map(x=>x.type);
    if(r2.length===2&&r2[0]===e.type&&r2[1]===e.type)continue;
    let pm=null;leaderboard.forEach(p=>{if(e.text.includes(p.nickname))pm=p.nickname;});
    if(pm){const c=pc[pm]||0;if(c>=2&&e.type!=='exact')continue;pc[pm]=c+1;}
    result.push(e);tc[e.type]=(tc[e.type]||0)+1;
  }
  for(const e of deduped){if(result.length>=15)break;if(!result.find(x=>x.id===e.id))result.push(e);}
  return result.slice(0,12);
}



export const TYPE_COLOR = {
  exact:"#FFD700", rank:"#00E5A0", miss:"#FF6B6B", streak:"#FF9800",
  stat:"#4A9EFF",  pts:"#00E5A0",  social:"#7B5EA7", leader:"#FFD700",
};

// ─── ADMIN EMAILS (from env + hardcoded fallback) ─────────────────────────────
// Set VITE_ADMIN_EMAILS=email1,email2 in your .env file
export const ADMIN_EMAILS_RUNTIME = (() => {
  const fromEnv = (import.meta.env && import.meta.env.VITE_ADMIN_EMAILS) || '';
  const extra = fromEnv.split(',').map(e => e.trim()).filter(Boolean);
  return [...new Set(['admin@worldcup2026.app', ...extra])];
})();

// ─── GROUP STANDINGS + FIFA TIEBREAKERS ──────────────────────────────────────
// Official FIFA World Cup 2026 ranking criteria (Art. 32 Regulations):
//   1. Points
//   2. Head-to-head points among tied teams
//   3. Head-to-head goal difference among tied teams
//   4. Head-to-head goals scored among tied teams
//   5. Overall goal difference
//   6. Overall goals scored
//   7. Fair play score (not tracked — skipped)
//   8. FIFA ranking (not tracked — skipped)
//   9. Team name alphabetical (final fallback)
//
// Supports 2-, 3-, and 4-way ties via recursive mini-table resolution.
// Returns rows with a `tieBreaker` string describing what separated tied teams.
// ─────────────────────────────────────────────────────────────────────────────

// Build a mini-table for a subset of teams using only matches between them.
function buildMiniTable(teams, allMatches) {
  const set = new Set(teams);
  const map = {};
  teams.forEach(t => { map[t] = { team:t, pts:0, gd:0, gf:0 }; });
  allMatches.forEach(m => {
    if (!set.has(m.teamA) || !set.has(m.teamB) || !m.isFinished) return;
    const a = map[m.teamA], b = map[m.teamB];
    const ga = m.realScoreA, gb = m.realScoreB;
    a.gf += ga; a.gd += ga - gb;
    b.gf += gb; b.gd += gb - ga;
    if (ga > gb) { a.pts += 3; }
    else if (ga < gb) { b.pts += 3; }
    else { a.pts += 1; b.pts += 1; }
  });
  return map;
}

export function buildGroupStandings(groupLetter, finishedResults = FINISHED_RESULTS) {
  const allGroupMatches = MATCHES.filter(m => m.group === groupLetter);
  const finishedGroupMatches = buildMatches(finishedResults).filter(
    m => m.group === groupLetter && m.isFinished
  );

  // Build base stats for all 4 teams
  const teamMap = {};
  allGroupMatches.forEach(m => {
    if (!teamMap[m.teamA]) teamMap[m.teamA] = { team:m.teamA, flag:m.flagA, p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 };
    if (!teamMap[m.teamB]) teamMap[m.teamB] = { team:m.teamB, flag:m.flagB, p:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 };
  });
  finishedGroupMatches.forEach(m => {
    const a = teamMap[m.teamA], b = teamMap[m.teamB];
    if (!a || !b) return;
    const ga = m.realScoreA, gb = m.realScoreB;
    a.p++; b.p++;
    a.gf += ga; a.ga += gb; a.gd += ga - gb;
    b.gf += gb; b.ga += ga; b.gd += gb - ga;
    if (ga > gb) { a.w++; a.pts += 3; b.l++; }
    else if (ga < gb) { b.w++; b.pts += 3; a.l++; }
    else { a.d++; b.d++; a.pts++; b.pts++; }
  });

  const rows = Object.values(teamMap);

  // ── FIFA tiebreaker comparator ────────────────────────────────────────────
  // Compares two rows. `miniTable` is pre-computed for the tied group.
  function cmpWithMini(a, b, miniTable) {
    // 1. Overall points (already equal when entering h2h)
    if (a.pts !== b.pts) return b.pts - a.pts;

    if (miniTable) {
      const mA = miniTable[a.team], mB = miniTable[b.team];
      if (mA && mB) {
        // 2. H2H points
        if (mA.pts !== mB.pts) return mB.pts - mA.pts;
        // 3. H2H goal difference
        if (mA.gd !== mB.gd) return mB.gd - mA.gd;
        // 4. H2H goals scored
        if (mA.gf !== mB.gf) return mB.gf - mA.gf;
      }
    }
    // 5. Overall goal difference
    if (a.gd !== b.gd) return b.gd - a.gd;
    // 6. Overall goals scored
    if (a.gf !== b.gf) return b.gf - a.gf;
    // 7-8. Fair play / FIFA ranking — not available, skip
    // 9. Alphabetical fallback
    return a.team.localeCompare(b.team);
  }

  // ── Sort with tiebreaker explanation ──────────────────────────────────────
  // First pass: group by points
  const byPts = {};
  rows.forEach(r => {
    const k = r.pts;
    if (!byPts[k]) byPts[k] = [];
    byPts[k].push(r);
  });

  const sorted = [];
  Object.keys(byPts).map(Number).sort((a,b)=>b-a).forEach(pts => {
    const group = byPts[pts];
    if (group.length === 1) {
      sorted.push(...group);
    } else {
      // Build mini-table for this tied group
      const tiedTeams = group.map(r => r.team);
      const mini = buildMiniTable(tiedTeams, finishedGroupMatches);

      // Sort within tied group using FIFA criteria
      const tiedSorted = [...group].sort((a, b) => cmpWithMini(a, b, mini));

      // Attach tiebreaker explanation to each row
      tiedSorted.forEach((row, idx) => {
        if (idx === 0) { row.tieBreaker = null; return; }
        const above = tiedSorted[idx - 1];
        const mR  = mini[row.team],   mA = mini[above.team];
        let reason = '';
        if (mA && mR && mA.pts !== mR.pts)
          reason = 'h2h points (' + mA.pts + ' vs ' + mR.pts + ')';
        else if (mA && mR && mA.gd !== mR.gd)
          reason = 'h2h GD (' + (mA.gd>0?'+':'') + mA.gd + ' vs ' + (mR.gd>0?'+':'') + mR.gd + ')';
        else if (mA && mR && mA.gf !== mR.gf)
          reason = 'h2h GF (' + mA.gf + ' vs ' + mR.gf + ')';
        else if (above.gd !== row.gd)
          reason = 'GD general (' + (above.gd>0?'+':'') + above.gd + ' vs ' + (row.gd>0?'+':'') + row.gd + ')';
        else if (above.gf !== row.gf)
          reason = 'GM general (' + above.gf + ' vs ' + row.gf + ')';
        else
          reason = 'ordine alfabetica';
        row.tieBreaker = above.team + ' peste ' + row.team + ' prin ' + reason;
      });

      sorted.push(...tiedSorted);
    }
  });

  return sorted;
}

// ─── FIFA WC 2026 KNOCKOUT QUALIFICATION ENGINE ───────────────────────────────
//
// FORMAT:
//   12 groups (A–L), 4 teams each, 3 matches each.
//   Qualification:
//     • 12 × 1st place  → automatic (24 spots)
//     • 12 × 2nd place  → automatic (24 spots, total 24)
//     Wait — 12 groups × 2 = 24 auto-qualifiers.
//     • Best 8 of 12 third-place finishers → 8 spots
//     TOTAL: 24 + 8 = 32 teams in Round of 32.
//
// THIRD-PLACE RANKING criteria (FIFA standard):
//   1. Points
//   2. Goal difference
//   3. Goals scored
//   4. Wins
//   5. Disciplinary (not tracked here — use alphabetical as tiebreaker)
//
// ROUND OF 32 PAIRING MAP:
//   The exact FIFA 2026 pairing assignment for best-3rd slots depends on
//   which groups the qualifying third-place teams come from. FIFA has not
//   yet published the official 2026 conditional pairing table (it will be
//   released closer to the tournament, similar to EURO 2024 format).
//
//   The pairing map below is structured and configurable:
//   - Fixed pairings: all 1st vs 2nd matchups are fixed by FIFA bracket
//   - Third-place slots: 8 group-winner slots each have a "slot pool"
//     defining which groups' third-placers can fill that position
//   - Assignment: best thirds are placed into slots by pool priority
//
//   ⚠️  UPDATE THIS TABLE when FIFA publishes the official 2026 bracket.
//       The slot pools below follow FIFA 32-team bracket convention.
// ─────────────────────────────────────────────────────────────────────────────

// ─── R32 STRUCTURE ────────────────────────────────────────────────────────────
// 16 matches in Round of 32.
// Left bracket half: M33–M40 (matches 33-40 of the tournament)
// Right bracket half: M41–M48

// Fixed pairings — group winners vs runners-up (these are known and fixed):
const FIXED_PAIRINGS = [
  // LEFT HALF ─────────────────────────────────────────────────────────────────
  { id:'m37', homeGroup:'A', homeRank:2, awayGroup:'B', awayRank:2, side:'left'  }, // 2A vs 2B
  { id:'m38', homeGroup:'C', homeRank:2, awayGroup:'D', awayRank:2, side:'left'  }, // 2C vs 2D
  { id:'m39', homeGroup:'E', homeRank:2, awayGroup:'F', awayRank:2, side:'left'  }, // 2E vs 2F
  { id:'m40', homeGroup:'G', homeRank:2, awayGroup:'H', awayRank:2, side:'left'  }, // 2G vs 2H
  // RIGHT HALF ────────────────────────────────────────────────────────────────
  { id:'m45', homeGroup:'I', homeRank:2, awayGroup:'J', awayRank:2, side:'right' }, // 2I vs 2J
  { id:'m46', homeGroup:'K', homeRank:2, awayGroup:'L', awayRank:2, side:'right' }, // 2K vs 2L
  { id:'m47', homeGroup:'I', homeRank:1, awayGroup:'J', awayRank:1, side:'right' }, // 1I vs 1J
  { id:'m48', homeGroup:'K', homeRank:1, awayGroup:'L', awayRank:1, side:'right' }, // 1K vs 1L
];

// Third-place slot pairings — group winners vs best third-place teams.
// Each slot defines: which group winner hosts, and which "pool" of third-placers
// can fill that slot. Pool = set of groups whose 3rd-place team is eligible here.
//
// ⚠️  CONFIGURABLE: Update slot pools below when FIFA releases the official
//     conditional pairing table for WC 2026 best third-place assignments.
//
// Current assignment follows a structured provisional bracket convention:
const THIRD_PLACE_SLOTS = [
  // LEFT HALF
  { id:'m33', winnerGroup:'A', winnerRank:1, pool:'BCDEF',  side:'left'  }, // 1A vs 3(B/C/D/E/F)
  { id:'m34', winnerGroup:'C', winnerRank:1, pool:'DEF',    side:'left'  }, // 1C vs 3(D/E/F)
  { id:'m35', winnerGroup:'E', winnerRank:1, pool:'ABCD',   side:'left'  }, // 1E vs 3(A/B/C/D)
  { id:'m36', winnerGroup:'G', winnerRank:1, pool:'ABCH',   side:'left'  }, // 1G vs 3(A/B/C/H)
  // RIGHT HALF
  { id:'m41', winnerGroup:'B', winnerRank:1, pool:'GHIJKL', side:'right' }, // 1B vs 3(G-L)
  { id:'m42', winnerGroup:'D', winnerRank:1, pool:'IJKL',   side:'right' }, // 1D vs 3(I/J/K/L)
  { id:'m43', winnerGroup:'F', winnerRank:1, pool:'GHIJ',   side:'right' }, // 1F vs 3(G/H/I/J)
  { id:'m44', winnerGroup:'H', winnerRank:1, pool:'KL',     side:'right' }, // 1H vs 3(K/L)
];

// ─── BUILD THE QUALIFYING FIELD ───────────────────────────────────────────────
// Returns full qualification data: winners, runners-up, qualified thirds.
export function buildQualifiedTeams(finishedResults = FINISHED_RESULTS, groupOverrides = {}) {
  const ALL_G = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const fm = buildMatches(finishedResults);
  const groupDone = g => fm.filter(m => m.group === g).every(m => m.isFinished);

  const standings = {};
  ALL_G.forEach(g => {
    if (groupDone(g)) {
      const calculated = buildGroupStandings(g, finishedResults);
      // Apply admin override if present — reorder only, keep stats intact
      if (groupOverrides[g] && groupOverrides[g].length > 0) {
        const reordered = groupOverrides[g]
          .map(teamName => calculated.find(r => r.team === teamName))
          .filter(Boolean);
        // Append any teams not in override (safety)
        calculated.forEach(r => { if (!reordered.find(x => x.team === r.team)) reordered.push(r); });
        standings[g] = reordered;
      } else {
        standings[g] = calculated;
      }
    }
  });

  const groupsCompleted = ALL_G.filter(g => !!standings[g]);

  // Collect all third-place teams from completed groups, ranked correctly
  const allThirds = groupsCompleted
    .map(g => {
      const table = standings[g];
      if (!table || table.length < 3) return null;
      return { ...table[2], fromGroup: g };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.pts - a.pts ||
      b.gd  - a.gd  ||
      b.gf  - a.gf  ||
      b.w   - a.w   ||
      a.fromGroup.localeCompare(b.fromGroup)
    );

  // Best 8 third-place teams qualify
  const qualifiedThirds = allThirds.slice(0, 8);

  return { standings, groupsCompleted, allThirds, qualifiedThirds };
}

// ─── ASSIGN THIRDS TO SLOTS ───────────────────────────────────────────────────
// Distributes the 8 qualified thirds into their designated bracket slots.
// Pool matching: each slot accepts thirds from specific group pools.
// If all 12 groups are done, assign exactly — otherwise leave slot empty.
function assignThirdsToSlots(qualifiedThirds) {
  // qualifiedThirds is already sorted best-first.
  // For each slot, find the highest-ranked eligible third that hasn't been assigned yet.
  const assigned = {};     // slotId → third team
  const usedGroups = new Set();

  THIRD_PLACE_SLOTS.forEach(slot => {
    const eligible = qualifiedThirds.filter(
      t => slot.pool.includes(t.fromGroup) && !usedGroups.has(t.fromGroup)
    );
    if (eligible.length > 0) {
      const pick = eligible[0]; // best available
      assigned[slot.id] = { team: pick.team, flag: pick.flag, fromGroup: pick.fromGroup };
      usedGroups.add(pick.fromGroup);
    }
  });

  return assigned;
}

// ─── BUILD KNOCKOUT SLOTS ─────────────────────────────────────────────────────
// Returns array of 16 R32 match objects for the bracket to render.
// Each match: { id, home, away, homeLabel, awayLabel, side }
// home/away are null when the group isn't finished yet.
export function buildKnockoutSlots(finishedResults = FINISHED_RESULTS) {
  const { standings, qualifiedThirds } = buildQualifiedTeams(finishedResults);

  // Only assign thirds when all 12 groups are done (needed to know best 8)
  const ALL_G = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const allGroupsDone = ALL_G.every(g => !!standings[g]);
  const thirdAssignments = allGroupsDone ? assignThirdsToSlots(qualifiedThirds) : {};

  const getTeam = (group, rank) => {
    const table = standings[group];
    if (!table) return null;
    const e = table[rank - 1];
    return e ? { team: e.team, flag: e.flag } : null;
  };

  // Build fixed pairings (winners vs runners-up, or runner-up vs runner-up)
  const fixedSlots = FIXED_PAIRINGS.map(p => ({
    id:        p.id,
    label:     p.id.toUpperCase(),
    home:      getTeam(p.homeGroup, p.homeRank),
    away:      getTeam(p.awayGroup, p.awayRank),
    homeLabel: `${p.homeRank}° Gr.${p.homeGroup}`,
    awayLabel: `${p.awayRank}° Gr.${p.awayGroup}`,
    side:      p.side,
  }));

  // Build third-place slots
  const thirdSlots = THIRD_PLACE_SLOTS.map(p => ({
    id:        p.id,
    label:     p.id.toUpperCase(),
    home:      getTeam(p.winnerGroup, p.winnerRank),
    away:      thirdAssignments[p.id] || null,
    homeLabel: `${p.winnerRank}° Gr.${p.winnerGroup}`,
    awayLabel: `3° pool ${p.pool}`,
    side:      p.side,
  }));

  // Merge and sort by match ID (m33→m48) for correct bracket order
  const all = [...fixedSlots, ...thirdSlots];
  all.sort((a, b) => {
    const na = parseInt(a.id.replace('m',''));
    const nb = parseInt(b.id.replace('m',''));
    return na - nb;
  });

  return all; // 16 matches in order m33..m48
}
