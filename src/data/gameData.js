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

// ─── ACTIVITY FEED v12 ───────────────────────────────────────────────────────
// Romanian football folklore engine. Hagi logic, Grigoraș sarcasm, Liga 1 banter.
// Mix per 12: ~30% match/live, ~25% banter, ~20% leaderboard, ~25% curiosities/folklore.
// Latest 2 finished matches dominate. Old matches disappear.
// Contextual facts only. No Firestore writes. No scoring changes.
// BAN: haos total, orice e posibil, a venit ca un val, clasamentul a resimțit,
//      a protestat intern, a plâns intern, obiecte pierdute, schimbare la vârf,
//      a vrut să apară pe afiș.
// ─────────────────────────────────────────────────────────────────────────────

const _A12={"Țările de Jos":"Olanda","Netherlands":"Olanda","Franța":"Franta","France":"Franta","Curaçao":"Curacao","Coasta de Fildeș":"Coasta de Fildes","DR Congo":"RD Congo","Congo RD":"RD Congo","Cape Verde":"Capul Verde","Bosnia & Herzegovina":"Bosnia","Bosnia & Herțegovina":"Bosnia"};
const _n12=t=>_A12[t]??t;
const _WC12=new Set(["Africa de Sud","Algeria","Anglia","Arabia Saudita","Argentina","Australia","Austria","Belgia","Bosnia","Brazilia","Canada","Capul Verde","Cehia","Coasta de Fildes","Columbia","Coreea de Sud","Croatia","Curacao","Ecuador","Egipt","Elvetia","Franta","Germania","Ghana","Haiti","Iordania","Irak","Iran","Japonia","Maroc","Mexic","Norvegia","Noua Zeelanda","Olanda","Panama","Paraguay","Portugalia","Qatar","RD Congo","SUA","Scotia","Senegal","Spania","Suedia","Tunisia","Turcia","Uruguay","Uzbekistan"]);
const _isOff12=t=>_WC12.has(_n12(t));
const _isWCM12=m=>m&&m.id>=1&&m.id<=72;
const _p12=(arr,...seeds)=>{const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,7));return arr[h%arr.length];};
const _c12=(arr,seeds,...args)=>{const fn=_p12(arr,...seeds);return typeof fn==='function'?fn(...args):String(fn);};

const CUR12={
  "Africa de Sud":["🇿🇦 Africa de Sud are 11 limbi oficiale. Dacă vrei să înjuri arbitrul corect, ai de unde alege.", "🇿🇦 Vuvuzela e invenție sud-africană. În 2010 a scos din minți o planetă întreagă. Și nu s-au scuzat.", "🇿🇦 Africa de Sud scoate 80% din platina lumii. Argint la fotbal, mai rar.", "🇿🇦 Bafana Bafana înseamnă «băieții băieților». Numele e mai îndrăzneț decât rezultatele de obicei.", "🇿🇦 Pinguinii trăiesc pe plajă în Cape Town. Mă, nu pe gheață. Pe plajă.", "🇿🇦 Mandela a folosit fotbalul ca să unească țara. A funcționat mai bine decât multe legi.", "🇿🇦 Table Mountain apare pe globul ceresc. Fotbalul sud-african, mai puțin pe glob de aur."],
  "Algeria":["🇩🇿 Algeria e cea mai mare țară din Africa. 85% e Sahara. Restul de 15% e suficient pentru fotbal.", "🇩🇿 Algeria a eliminat Germania la CM 2014. Nimeni din Germania n-a văzut-o venind. Nici Algeria, probabil.", "🇩🇿 Mahrez a câștigat Premier League cu Leicester. Probabilitate mică, execuție perfectă — la fel ca o predicție bună.", "🇩🇿 Algeria a luat CAN 2019 fără să piardă vreun meci. Portarul a primit mai puține goluri decât ore de somn.", "🇩🇿 Timgad, oraș roman, e îngropat în nisip de secole. Fotbalul algerian e la fel de bine conservat — în tradiție."],
  "Anglia":["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia a inventat fotbalul în 1863. A câștigat un singur Mondial. Inventator de geniu, executor mai modest.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 «Football's coming home» de prin '96. Fotbalul tot n-a venit acasă. Adresa s-a schimbat, probabil.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Lineker n-a primit niciun cartonaș în carieră. Sfânt pe teren, comentator obraznic la TV.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League e în 212 țări. Mai global decât ONU. Englezii au priorități clare.", "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia a pierdut de 3 ori la penaltii cu Germania. Trauma are statistici, nu doar amintiri."],
  "Arabia Saudita":["🇸🇦 Arabia Saudită a bătut Argentina 2-1 la CM 2022. Messi a stat 5 minute pe bancă fără să clipească.", "🇸🇦 Arabia Saudită a luat fotbal la pachet: Ronaldo, Benzema, Kanté, în același an fiscal.", "🇸🇦 Riad e printre cele mai calde orașe în care joci fotbal. Hidratarea e tactică, nu opțiune.", "🇸🇦 Arabia Saudită găzduiește CM 2034. Lumea fotbalului se mută la propriu spre est.", "🇸🇦 Al-Nassr îi plătește lui Ronaldo cam 200 de milioane pe an. Bani sunt. Vârsta lui Ronaldo — la fel."],
  "Argentina":["🇦🇷 Maradona a dat Mâna lui Dumnezeu și Golul Secolului în același meci. La omul ăsta, două legende dintr-un foc.", "🇦🇷 Messi a plâns pe teren după CM 2022. Toată lumea a plâns cu el, inclusiv ăia care pierduseră cu Argentina.", "🇦🇷 Buenos Aires are cea mai mare densitate de psihologi din lume. Fotbalul explică 30% din nevoi.", "🇦🇷 Argentina a luat Copa América de 15 ori. Record mondial. Calmul, mai rar.", "🇦🇷 Tango s-a născut în mahalalele din Buenos Aires. Stilul de fotbal argentinian, la fel."],
  "Australia":["🇦🇺 Australia a bătut Argentina la penaltii la CM 2022. Messi n-a ratat. Australia a câștigat tot.", "🇦🇺 Sunt mai mulți canguri decât oameni în Australia. Pe teren, echipa e tot atât de imprevizibilă.", "🇦🇺 Australia e singurul continent care e și țară. Ambițios ca concept geografic.", "🇦🇺 Cahill a marcat cu capul de la 30 de metri contra Germaniei. Înălțimea contează mai puțin decât momentul.", "🇦🇺 Koala doarme 22 de ore pe zi. Portarul australian la CM 2022 a dormit mai puțin."],
  "Austria":["🇦🇹 Salzburg a produs Haaland, Mané și Upamecano. Cel mai productiv club din Europa. Din Austria, nu din Spania.", "🇦🇹 Viena a fost de 3 ori cel mai bun oraș să trăiești. Fotbalul n-a intrat în calcul.", "🇦🇹 Red Bull e austriac. Sponsorizează Salzburg, Leipzig, New York. Cafeina și ambiția au același portofel.", "🇦🇹 Mozart s-a născut în Salzburg. Acum orașul ăla scoate fotbaliști pentru Champions League.", "🇦🇹 Austria a luat locul 3 la CM 1954. De atunci, participă discret."],
  "Belgia":["🇧🇪 Belgia a stat 3 ani pe locul 1 FIFA. Titlu major câștigat în acea perioadă: zero. Paradoxul ăsta merită un dosar.", "🇧🇪 De Bruyne a fost cel mai bun pasator din lume 4 ani. Belgia n-a câștigat nimic în acei 4 ani. Pase bune, finaluri rele.", "🇧🇪 Belgia a stat 541 de zile fără guvern. Fotbalul a mers tot timpul. Țara, mai cu emoții.", "🇧🇪 Belgia scoate 750 de tipuri de bere. Bere câte beri, trofee — mai puține.", "🇧🇪 Belgia a bătut Brazilia în sferturi la CM 2018. Generația de aur și-a justificat porecla o singură dată."],
  "Bosnia":["🇧🇦 Bosnia a fost la primul Mondial în 2014. Džeko a marcat la primul meci. Fotbalul n-a stat la coadă.", "🇧🇦 Zlatan are origini bosniace pe linie paternă. Baza genetică explică parțial atitudinea.", "🇧🇦 Sarajevo a avut JO de iarnă în '84 și un război după. Rezistența e în ADN.", "🇧🇦 Bosniacii beau mai multă cafea decât aproape orice națiune europeană. Neagră, tare. Ca fotbalul lor.", "🇧🇦 Bosnia are 3 președinți în rotație. Mai complicat decât orice apărare în zonă."],
  "Brazilia":["🇧🇷 Brazilia are 5 Mondiale. Unele naționale încă încearcă să ajungă la primul.", "🇧🇷 7-1 cu Germania în 2014, pe teren propriu. Au primit 5 goluri în 18 minute. N-au înțeles ce se întâmplă la timp.", "🇧🇷 Pelé a câștigat 3 Mondiale la 17, 21 și 29 de ani. Nimeni altcineva nu poate spune asta.", "🇧🇷 Ronaldinho a luat Balonul de Aur și a jucat Beach Soccer la pensie. Traiectorie de scenariu, nu de carieră.", "🇧🇷 Neymar e cel mai scump transfer din istorie. Brazilia n-a mai câștigat Mondial de atunci. Coincidență, probabil."],
  "Canada":["🇨🇦 Canada are mai multe lacuri decât restul lumii la un loc. Apa nu-i problema lor.", "🇨🇦 Davies s-a născut în tabără de refugiați, a crescut în Canada, valorează 70 de milioane la Bayern. Poveste de film.", "🇨🇦 Canada n-a marcat niciun gol la CM '86. A revenit în 2022 cu scor mai bun. Progres, măcar.", "🇨🇦 Hockey-ul e religie în Canada. Fotbalul e fratele mai mic care vrea și el atenție.", "🇨🇦 Toronto vorbește 200 de limbi zilnic. Mai mult decât orice alt oraș din lume."],
  "Capul Verde":["🇨🇻 Capul Verde are mai mulți oameni în diaspora decât acasă. Practic joacă și cu galeria din străinătate.", "🇨🇻 Capul Verde nu are râuri permanente. Zero. Apa vine din ploi. Și totuși echipa a ieșit pe teren.", "🇨🇻 Capul Verde a eliminat Maroc la CAN 2021. Favoritul clar. Surpriza turneului, ca un meci la care nu te aștepți.", "🇨🇻 Capul Verde sunt 10 insule vulcanice. Mică țară, mare surpriză când vine vorba de fotbal.", "🇨🇻 Muzica Morna e UNESCO — gen melancolic făcut de oameni care trăiesc departe de casă. La fel ca jucătorii lor."],
  "Cehia":["🇨🇿 Panenka a inventat lovitura cu chip la Euro '76, contra lui Sepp Maier. Faimă eternă din o secundă de curaj.", "🇨🇿 Cehia bea mai multă bere decât orice altă țară. Prioritățile lor sunt foarte clare.", "🇨🇿 Čech a purtat cască de hochei la fotbal tot restul carierei. Cel mai recognoscibil portar al generației.", "🇨🇿 Cehia a fost finalistă de 2 ori, niciodată campioană. Club select, dar fără cupă acasă.", "🇨🇿 Kafka s-a născut la Praga. A scris despre absurd. Un meci de fotbal ceh conține uneori exact asta."],
  "Coasta de Fildes":["🇨🇮 Drogba a negociat un armistițiu în războiul civil de acasă. Fotbalul a oprit un conflict. Mă, la propriu.", "🇨🇮 Coasta de Fildes scoate 40% din cacaoul mondial. Ciocolata din toată lumea are rădăcini acolo.", "🇨🇮 Generația lui Drogba era cea mai bună din Africa în acei ani. N-a luat niciodată Mondialul. Talent fără trofeu.", "🇨🇮 Yaya Touré a luat Premier League, La Liga și CAN. Trei titluri, trei continente.", "🇨🇮 Coasta de Fildes a luat CAN de 3 ori. Africa de Vest are tradiție, nu doar speranțe."],
  "Columbia":["🇨🇴 James Rodríguez a luat Gheata de Aur la CM 2014. A venit din neant și a plecat cu trofeul individual.", "🇨🇴 Higuita a inventat Scorpion Kick. La un meci demonstrativ. Nu oficial. Dar a intrat în istorie tot.", "🇨🇴 Columbia scoate 10% din cafeaua mondială. Energia de la cafea se vede uneori pe teren.", "🇨🇴 Valderrama avea părul ăla afro la 3 Mondiale. Coafura mai faimoasă decât unele pase.", "🇨🇴 Columbia a luat Copa América 2024 fără gol primit în eliminatorii. Apărare sau magie, alegeți voi."],
  "Coreea de Sud":["🇰🇷 Coreea de Sud a fost în semifinale la CM 2002. A eliminat Spania și Italia pe drum. Arbitrajul, controversat. Performanța, nu.", "🇰🇷 Son a luat Gheata de Aur în Premier League fără să bată un penalti. 23 de goluri, zero penaltii. Curat.", "🇰🇷 Park Ji-sung juca pe 3 posturi simultan la Manchester United, după Ferguson. Un om, trei roluri.", "🇰🇷 Coreea de Sud are internetul cel mai rapid din lume. K-pop e mai popular decât fotbalul lor. Pentru acum.", "🇰🇷 Coreea de Sud a eliminat Germania campioana en-titre la CM 2018. Surpriza decadei."],
  "Croatia":["🇭🇷 Croatia a luat locul 2 la CM 2018 și locul 3 în 2022. 4 milioane de oameni, rezultate de țară mare.", "🇭🇷 Modrić a luat Balonul de Aur 2018. Primul altul decât Messi sau Ronaldo în 10 ani. A plâns la discurs.", "🇭🇷 Cravata a fost inventată în Croatia. Export cultural care valorează miliarde azi. Mai mult decât unele transferuri.", "🇭🇷 Croatia a eliminat Brazilia la CM 2022, la penaltii. Livaković a apărat 3 lovituri. Cine se aștepta la asta?", "🇭🇷 Croatia a pierdut finala 2018 cu Franta, 2-4. A condus 1-0 după un autogol. Apoi a pierdut tot."],
  "Curacao":["🇨🇼 Curaçao are 150.000 de locuitori. Mai puțin decât un cartier din Cluj. Și totuși, la Mondial.", "🇨🇼 Curaçao a eliminat Costa Rica la baraj. Victorie istorică pentru 150.000 de oameni.", "🇨🇼 Jucătorii lui Curaçao vin mai ales din Olanda, unde au crescut. Diaspora e strategia lor.", "🇨🇼 Insula e de 444 km². Pentru comparație, Ilfov e de 3 ori mai mare. Și nu e la Mondial.", "🇨🇼 Willemstad e UNESCO pentru arhitectura colorată olandezo-caraibiană. Frumos pe afară, fotbal serios pe interior."],
  "Ecuador":["🇪🇨 Ecuador a deschis CM 2022 cu 2-0 contra gazdei Qatar. Gazda n-a mai câștigat după aceea. Stricat de la prima.", "🇪🇨 Enner Valencia a marcat 3 din cele 5 goluri ale Ecuadorului la CM 2022. Un om, un turneu.", "🇪🇨 Quito e la 2.850 m altitudine. Adversarii vin și nu mai respiră normal câteva zile.", "🇪🇨 Insulele Galapagos sunt în Ecuador. Darwin a venit, a văzut, a inventat evoluția. Ecuador a evoluat și la fotbal.", "🇪🇨 Ecuador e traversat de Ecuator. Există o linie pictată pe un deal care marchează exact unde."],
  "Egipt":["🇪🇬 Egipt are 7 Cupe ale Africii. Restul continentului încă încearcă să recupereze.", "🇪🇬 Cleopatra a trăit mai aproape de lansarea iPhone-ului decât de construirea piramidelor. Egiptul vine cu istorie, nu cu glumă.", "🇪🇬 Salah a marcat 200+ goluri pentru Liverpool. Orașul i-a pus porecla «Egyptian King». Pe merite.", "🇪🇬 Egipt a luat CAN de 3 ori la rând: 2006, 2008, 2010. Record mondial la competiții continentale.", "🇪🇬 Piramidele de la Giza sunt singura minune antică rămasă în picioare. Au supraviețuit mai mult decât orice club."],
  "Elvetia":["🇨🇭 Elveția a eliminat Franta la Euro 2020, de la 1-3, la penaltii. Franta nu știa că trebuia să fie îngrijorată.", "🇨🇭 Elveția are 4 limbi oficiale. Echipa e multilingvă în cabine. Comunicarea e provocare, nu accesoriu.", "🇨🇭 CERN, cel mai mare accelerator de particule, e la Geneva. Elveția produce știință și fotbal surprinzător.", "🇨🇭 Ceasurile elvețiene sunt referință mondială la precizie. Portarul lor, nu mai puțin precis.", "🇨🇭 Xhaka a fost huiduit la Arsenal, a revenit, a câștigat Bundesliga cu Leverkusen. Revenirile sunt tradiție elvețiană."],
  "Franta":["🇫🇷 Mbappé a dat hat-trick în finala CM 2022, în ultimele 8 minute. Franta a pierdut la penaltii totuși. Dramă pură, nu happy end.", "🇫🇷 Franta a luat CM '98 și 2018. Generații diferite, același result. Sistemul funcționează.", "🇫🇷 Lotul Frantei la CM 2022 valora peste 1,2 miliarde. Cea mai scumpă echipă a turneului. Și au pierdut finala.", "🇫🇷 Zidane a dat cu capul de 2 ori în finala '98. La ultimul meci oficial, a dat cu capul în Materazzi. Cap de aur, cap de foc.", "🇫🇷 Turnul Eiffel era programat la demolare în 1909. Bine că au mai zis o predicție și au lăsat-o."],
  "Germania":["🇩🇪 Germania are 4 titluri mondiale și obiceiul enervant de a apărea exact când contează.", "🇩🇪 7-1 cu Brazilia în semifinale, 2014. 5 goluri în 18 minute. Cel mai mare șoc din istoria turneului.", "🇩🇪 Klose are 16 goluri la Mondiale. Record absolut. Nimeni n-a venit aproape.", "🇩🇪 Germania are legea purității berii din 1516. Disciplina e în ADN, pe teren la fel.", "🇩🇪 Müller a dat 10 goluri la 2 Mondiale combinate. «Raumdeuter» — interpretul spațiului. Sau, pe românește, cel care e mereu liber."],
  "Ghana":["🇬🇭 Ghana a ratat semifinala CM 2010 la penaltii cu Uruguay. Suárez a blocat cu mâna pe linie. Fotbalul poate fi crud.", "🇬🇭 Gyan e golgheterul african all-time la Mondiale. A și ratat penaltiul decisiv în 2010. Ironia supremă, completă.", "🇬🇭 Ghana a luat CAN de 4 ori. Prima țară din Africa Sub-Sahariană independentă, în 1957.", "🇬🇭 Ghana scoate 30% din cacaoul mondial. Ciocolata de pe toate rafturile are rădăcini acolo.", "🇬🇭 Ghana a eliminat SUA la CM 2010, pe teren american, cu suporterii americani în tribune. Fără respect pentru gazdă."],
  "Haiti":["🇭🇹 Haiti a fost prima republică neagră din lume, în 1804. Cu 200 de ani înainte de independența multor state africane.", "🇭🇹 Sanon a marcat primul gol al Haiti la un Mondial, '74, contra Italiei. Legendă din acel moment, pentru totdeauna.", "🇭🇹 Creola haitiană e singura limbă creolă oficială ca limbă națională în Americi.", "🇭🇹 Haiti a jucat fotbal internațional și în perioade de criză. Fotbalul nu s-a oprit niciodată complet.", "🇭🇹 Wyclef Jean s-a născut în Haiti și a candidat la președinție. Versatilitate de carieră, nu doar de stil muzical."],
  "Iordania":["🇯🇴 Iordania are Marea Moartă — cel mai jos punct de pe Pământ. 430 m sub nivelul mării.", "🇯🇴 Iordania a fost în finala Cupei Asiei 2023. Cel mai bun rezultat din istoria lor.", "🇯🇴 Petra, orașul săpat în stâncă, a apărut în Indiana Jones. În realitate e și mai impresionant.", "🇯🇴 Iordania s-a calificat la CM 2026 prin baraj intercontinental. Drum lung, merită respect.", "🇯🇴 Wadi Rum, deșertul de nisip roșu, a fost decor pentru Lawrence of Arabia și Marte. Scenografie de Mondial."],
  "Irak":["🇮🇶 Irakul are una dintre cele mai vechi civilizații din lume. La fotbal, însă, mingea nu respectă vechimea.", "🇮🇶 Irak a luat Cupa Asiei 2007, în plină instabilitate politică. Fotbalul a unit când nimic altceva nu putea.", "🇮🇶 Radhi a marcat singurul gol al Irakului la un Mondial, '86, contra Belgiei. Legendă din acel moment.", "🇮🇶 Mesopotamia, leagănul civilizațiilor. Primii care au inventat scrisul, roata. Fotbalul, abia mai recent.", "🇮🇶 Irak a jucat fotbal internațional acasă chiar și în conflict. Fotbalul nu s-a oprit niciodată."],
  "Iran":["🇮🇷 Iran a luat Cupa Asiei de 3 ori la rând: '68, '72, '76. Dominanță regională, fără glumă.", "🇮🇷 Taremi a marcat o foarfecă spectaculoasă contra Angliei la CM 2022. Gol ales printre cele mai frumoase ale turneului.", "🇮🇷 Persepolis joacă cu 100.000 de spectatori. Atmosfera e armă tactică, nu doar decor.", "🇮🇷 Iran are o civilizație neîntreruptă de peste 3.000 de ani. Fotbalul e tânăr pe lângă asta.", "🇮🇷 Poetul Rumi e citat de milioane. Golurile iraniene, de mai puțini. Dar contează la fel."],
  "Japonia":["🇯🇵 Japonia are automate pentru aproape orice. Dacă pierzi, măcar găsești cafea.", "🇯🇵 Japonia a eliminat Germania și Spania la CM 2022. Ambele conduceau la pauză. Japonia n-a primit memo-ul.", "🇯🇵 Miura a jucat profesionist la 56 de ani. Record mondial de longevitate. King Kazu e legendă vie.", "🇯🇵 Trenul japonez are întârziere medie de 0.9 minute pe an. Precizie aplicată la tot, inclusiv fotbal.", "🇯🇵 Captainul Tsubasa a inspirat generații de fotbaliști europeni. Manga japoneză, fani globali."],
  "Maroc":["🇲🇦 Maroc are una dintre cele mai vechi universități încă active din lume. Lecția de fotbal se predă fără catalog.", "🇲🇦 Maroc a fost prima echipă africană în semifinale de Mondial, 2022. Milioane au plâns de bucurie acasă.", "🇲🇦 Hakimi a marcat penaltiul decisiv contra Spaniei cu Panenka. Curaj rar la cel mai important meci al carierei.", "🇲🇦 Marocul bea milioane de pahare de ceai de mentă pe zi. Ritual mai serios decât multe ședințe tehnice.", "🇲🇦 En-Nesyri a marcat cu capul de la 2.78 m înălțime. Cap de fier, gol de aur."],
  "Mexic":["🇲🇽 Mexic n-a trecut niciodată de sferturi la un Mondial. «Blestemul sferturilor» e fenomen cultural acum, nu doar statistic.", "🇲🇽 Azteca e singurul stadion cu 2 finale mondiale: 1970 și 1986. Și acum, meciuri la CM 2026.", "🇲🇽 Chicharito e golgheterul all-time al Mexicului. A jucat la Man United, Real Madrid, Leverkusen.", "🇲🇽 Mexico City are 22 de milioane de oameni. Traficul e atât de dens că elicopterele private sunt transport curent.", "🇲🇽 Hugo Sánchez a luat 5 titluri consecutive cu Real Madrid. Mexican la Madrid, dominant la gol."],
  "Norvegia":["🇳🇴 Norvegia vine cu Haaland. Planul tactic poate încăpea pe un bilețel: găsiți-l pe băiatul mare.", "🇳🇴 Haaland a marcat 36 de goluri într-un sezon de Premier League. Record absolut. Restul recalculează.", "🇳🇴 Norvegia s-a calificat la CM 2026 — prima participare din 1998. 28 de ani cu Haaland la final.", "🇳🇴 Odegaard e căpitanul Arsenalului la 23 de ani. Cel mai tânăr din istoria clubului.", "🇳🇴 Norvegia are cel mai mare fond suveran de investiții din lume. Bani din petrol, fotbal din Haaland."],
  "Noua Zeelanda":["🇳🇿 În Noua Zeelandă sunt mult mai multe oi decât oameni. Presiune de pe margine există, doar nu de la public.", "🇳🇿 All Blacks au 77% rată de victorie. Cel mai înalt din orice sport, vreodată. La fotbal, mai lucrează.", "🇳🇿 Noua Zeelandă a fost prima țară care a dat vot femeilor, în 1893. Un secol de avans.", "🇳🇿 Peisajele din Stăpânul Inelelor sunt din Noua Zeelandă. Hollywood a venit la ei, nu invers.", "🇳🇿 Noua Zeelandă n-a pierdut niciun meci la CM 2010. 3 egaluri și a ieșit din grupe totuși."],
  "Olanda":["🇳🇱 Cruyff a inventat fotbalul total. Olanda nu l-a câștigat niciodată pe Mondial. Inventator de geniu, finalist etern.", "🇳🇱 Olanda a luat locul 2 de 3 ori: 2010, 1974, 1978. Cea mai bună echipă care nu a câștigat niciodată.", "🇳🇱 Van Basten a dat gol din unghi imposibil în finala Euro '88. Comentatorii au tăcut 3 secunde.", "🇳🇱 Olanda are mai mulți bicicliști decât oameni. Singura țară unde te ferești de biciclete, nu de mașini.", "🇳🇱 Ajax a luat 4 Champions League. Mai mult decât orice club din afara Spaniei, Angliei, Italiei."],
  "Panama":["🇵🇦 Panama s-a calificat la CM 2018 și toată țara a oprit treaba pentru meciul inaugural.", "🇵🇦 Canalul Panama scurtează drumul maritim cu 15.000 km. Cel mai important shortcut din lume.", "🇵🇦 Roman Torres a marcat golul calificant la CM 2018. E monument național. La propriu, nu metaforic.", "🇵🇦 Panama nu are armată permanentă din 1990. Are echipă de fotbal, totuși.", "🇵🇦 Panama City e singurul capitală latino-americană cu pădure tropicală la marginea orașului."],
  "Paraguay":["🇵🇾 Chilavert, portarul paraguayan, a marcat 62 de goluri din penaltii și free-kick-uri. Record mondial pentru portari.", "🇵🇾 Paraguay e una din cele 2 țări sud-americane fără ieșire la mare. Tot au ajuns la Mondiale, totuși.", "🇵🇾 Guaraní e vorbită de 90% din populație, indiferent de educație sau clasă socială.", "🇵🇾 Paraguay a ajuns în sferturile CM 2010 cu fotbal defensiv solid. Apărarea poate fi spectacol, dovedit.", "🇵🇾 Paraguay produce cea mai ieftină energie din America de Sud, prin barajul Itaipu."],
  "Portugalia":["🇵🇹 Ronaldo a marcat 128 de goluri pentru Portugalia. Record mondial absolut pentru o națională.", "🇵🇹 Eusébio a dat 9 goluri la CM '66. Portugalia a luat locul 3. Un singur om, o țară pe podium.", "🇵🇹 Portugalia a luat Euro 2016 cu un gol al lui Éder în prelungiri. Éder juca la Lille, nu la Real Madrid.", "🇵🇹 Portugalia a navigat coastele Africii, Asiei și Americii în secolul XV-XVI. Fotbaliști exploratori, la propriu istoric.", "🇵🇹 Fado-ul portughez e UNESCO. Saudade e un cuvânt intraductibil. Suporterii portughezi îl simt și la fotbal."],
  "Qatar":["🇶🇦 Qatar a găzduit primul Mondial de iarnă, primul din Orientul Mijlociu.", "🇶🇦 Qatar a ieșit din grupe fără victorie, ca gazdă. Primul caz din istoria turneului.", "🇶🇦 Lusail Stadium are 88.966 de locuri. Mai mare decât oricare stadion din Europa.", "🇶🇦 Doha a crescut din sat de pescari în oraș ultramodern, în 70 de ani.", "🇶🇦 Qatar are cel mai mare PIB per capita din lume. Bani sunt. Fotbal la Mondiale — în formare."],
  "RD Congo":["🇨🇩 RD Congo revine la Mondial după 52 de ani. Cel mai lung interval de revenire din istoria turneului.", "🇨🇩 Kinshasa e cel mai mare oraș francofon din lume, mai mare decât Paris.", "🇨🇩 Muzica Rumba Congoleză e UNESCO. A influențat muzica africană pe 3 continente.", "🇨🇩 RD Congo a luat CAN în '68 și '74. Glorie veche, foame de afirmare nouă.", "🇨🇩 RD Congo are 80% din rezervele mondiale de coltan. Mineral esențial pentru telefoanele tale."],
  "SUA":["🇺🇸 SUA a înregistrat cea mai mare medie de spectatori per meci din istoria CM, în 1994.", "🇺🇸 Pulisic a marcat golul calificant și a ieșit accidentat din teren. Sacrificiu de centru, literal.", "🇺🇸 SUA are 4 Mondiale feminine. Recordul absolut. La feminin, SUA e Brazilia fotbalului.", "🇺🇸 Tim Howard a apărat 16 șuturi contra Belgiei la CM 2014. Record mondial la un eliminator.", "🇺🇸 SUA, Canada și Mexic co-organizează CM 2026, cu 16 orașe gazdă."],
  "Scotia":["🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scoția și Anglia au jucat primul meci internațional din istorie, 1872. Scor: 0-0. Chiar și la prima dată.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Denis Law a marcat golul care a retrogradat Anglia, '75. Cu călcâiul. A celebrat cu tristețe.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Celtic vs Rangers e unul din cele mai urmărite derby-uri locale din lume.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scoția s-a calificat la CM 2026, prima participare din 1998. 28 de ani de așteptare.", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Whisky-ul scotch e exportat în 180 de țări. Mândrie națională, după fotbal."],
  "Senegal":["🇸🇳 Senegal a eliminat Franta campioana mondială la CM 2002. La primul meci. Fără respect pentru reputație.", "🇸🇳 Mané a luat Premier League, Champions League și CAN. Definește generația de aur senegaleză.", "🇸🇳 Senegal a luat CAN de 2 ori la rând: 2021, 2022. Performanță rară pe continent.", "🇸🇳 Koulibaly a jucat la Napoli, Chelsea, Al-Hilal. Fundaș central african de generație.", "🇸🇳 Senegal e singura echipă care a eliminat campioana mondială la primul lor meci din istoria Mondialelor."],
  "Spania":["🇪🇸 Spania a luat Euro 2024 cu cei mai tineri jucători de start din istoria turneului final.", "🇪🇸 Iniesta a dat golul finalei CM 2010 în prelungiri. A băut vin de la vie proprie după. Celebrare la nivelul golului.", "🇪🇸 Real Madrid și Barca au câștigat împreună 22 de Champions League din 69 de ediții. Monopol iberic.", "🇪🇸 Spania joacă posesie și te adoarme, apoi te bate 1-0. Enervant. Eficient. Câștigător.", "🇪🇸 Spania a câștigat CM 2010 plus Euro 2008, 2012, 2024. Perioada cea mai dominantă din fotbalul european."],
  "Suedia":["🇸🇪 Zlatan a dat o foarfecă absurdă de la 30 de metri contra Angliei. Comentatorul a rămas mut.", "🇸🇪 Zlatan are 62 de goluri pentru Suedia. Record național pe care nimeni nu se apropie să-l ia.", "🇸🇪 Suedia a luat locul 3 la CM '94 și locul 2 la '58. Națiune mică, palmares mare.", "🇸🇪 Spotify s-a fondat la Stockholm. Suezia a inventat streamingul muzical. Și fotbaliști buni, ocazional.", "🇸🇪 IKEA, H&M, Volvo, Ericsson — toate suedeze. Export de design, tehnologie, mijlocași talentați."],
  "Tunisia":["🇹🇳 Tunisia a bătut Franta campioana mondială la CM 2022. Franta rotise lotul. Tunisia a jucat serios.", "🇹🇳 Tunisia a fost prima echipă africană care a câștigat un meci la un Mondial, '78, contra Mexic.", "🇹🇳 Cartagina, putere antică, era pe coasta tunisiană. Hannibal traversa Alpii cu elefanți de acolo.", "🇹🇳 Tunisia a luat locul 1 în grupă la CM 2022, înaintea Frantei. Ieșire pe golaveraj totuși.", "🇹🇳 Tunisia a luat CAN în 2004. Singurul titlu continental, dar al lor."],
  "Turcia":["🇹🇷 Hakan Şükür a marcat în 11 secunde la CM 2002. Cel mai rapid gol din istoria turneului.", "🇹🇷 Turcia a luat locul 3 la CM 2002. Performanță nerepetată de atunci.", "🇹🇷 Istanbul e singurul oraș de pe Pământ pe două continente simultan.", "🇹🇷 Turcia produce 75% din alunele lumii. Nutella are un furnizor garantat.", "🇹🇷 Çalhanoğlu a marcat dintr-un free-kick fabulos contra Elveției la Euro 2020."],
  "Uruguay":["🇺🇾 Uruguay a bătut Brazilia pe Maracanã, 1950, în fața a 200.000 de oameni. Cel mai mare șoc din istoria fotbalului.", "🇺🇾 Uruguay a luat primele 2 Mondiale: 1930, 1950. Fundația fotbalului sud-american.", "🇺🇾 Suárez a blocat cu mâna pe linie contra Ghanei la CM 2010. A plâns. Ghana a ratat penaltiul.", "🇺🇾 Uruguay a luat Copa América de 15 ori. Record mondial pentru competiții continentale.", "🇺🇾 Uruguay are 3,5 milioane de oameni. Mai puțin decât Londra. Și 2 Mondiale acasă."],
  "Uzbekistan":["🇺🇿 Uzbekistan este singura țară care locuiește într-un cartier unde toți vecinii se termină în «-stan».", "🇺🇿 În Uzbekistan, pâinea e sacră. Nu se pune niciodată cu fața în jos. Respect total pentru un aliment.", "🇺🇿 Samarkand a fost cel mai important nod al Drumului Mătăsii. China și Europa treceau pe acolo.", "🇺🇿 Uzbekistan e la primul Mondial FIFA senior. Premieră absolută pentru fotbalul lor.", "🇺🇿 Uzbekistanul e una din doar 2 țări din lume complet înconjurate de state fără ieșire la mare."],
};
// ── BANTER POOLS — Liga 1 dressing room, Hagi logic, Grigoraș sarcasm ────────
const T_EXACT=[
  (n,m)=>`🎯 ${n} a prins scorul exact la ${m}. Care era în fața porții, s-a înscris.`,
  (n,m)=>`🎯 ${n} a pus scorul corect la ${m}. Pase scurte, pe sus, direct în tabel.`,
  (n,m)=>`🎯 ${n} a zis scorul la ${m} și scorul a executat ordinul.`,
  (n,m)=>`🎯 ${n} a nimerit la ${m}. Omul este o persoană predictivă.`,
  (n,m)=>`🎯 ${n} a prins scorul exact la ${m}. Să fie bine, ca să nu fie rău.`,
  (n,m)=>`🎯 ${n} a văzut ${m} cum trebuie. De data asta chiar meciul ăsta.`,
  (n,m)=>`🎯 ${n} a pus scorul la ${m}. Fotbalul a fost cooperant azi.`,
  (n,m)=>`🎯 ${n} a prins scorul la ${m}. Nu știm dacă e inspirație sau bulan cu acte.`,
  (n,m)=>`🎯 ${n} a pus rezultatul la ${m} înainte să-l afle tabela.`,
  (n,m)=>`🎯 ${n} a nimerit scorul exact la ${m}. Restul au venit la antrenament.`,
  (n,m)=>`🎯 ${n} a dat cu predicția în vinclu la ${m}.`,
  (n,m)=>`🎯 ${n} a văzut golurile de la ${m} înainte să le vadă portarul.`,
  (n,m)=>`🎯 ${n} a prins scorul la ${m}. La pomul lăudat, de data asta chiar a făcut mere.`,
  (n,m)=>`🎯 ${n} a pus scorul exact la ${m}. Dacă era pariu, casa trăgea obloanele.`,
  (n,m)=>`🎯 ${n} a fost omul potrivit la scorul potrivit, la ${m}.`,
  n=>`🎯 ${n} a nimerit. Situația e fără ieșire pentru ceilalți.`,
  n=>`🎯 ${n} a avut dreptate atât de clar încât devine enervant.`,
  n=>`🎯 ${n} a citit meciul ca pe foaia de examen.`,
  n=>`🎯 ${n} a prins scorul exact. Aici nu mai e fotbal, e contabilitate divină.`,
  n=>`🎯 ${n} a zis cât se termină și a plecat. Mingea a rezolvat restul.`,
  n=>`🎯 ${n} a prins scorul. Dacă mai continuă, îl punem să aleagă și vremea.`,
  n=>`🎯 ${n} a nimerit scorul. Ceilalți au avut ocazii, în afară de puncte.`,
  n=>`🎯 ${n} a pus scorul exact. La bulanu' lui, intră și mingea pătrată.`,
  n=>`🎯 ${n} a demonstrat că predicția e și posibilă, și imposibilă. La el e posibilă.`,
  n=>`🎯 ${n} a prins scorul. Restul să se ducă la șah.`,
];

const T_ZERO=[
  (n,m)=>`🤦 ${n} la ${m}: a luat 0 puncte. În afară de rezultat, n-a greșit nimic.`,
  (n,m)=>`🤦 ${n} n-a avut nicio predicție bună la ${m}, în afară de cele greșite.`,
  (n,m)=>`🤦 ${n} a văzut ${m} perfect. Doar că pe alt stadion.`,
  (n,m)=>`🤦 ${n} a fost aproape de adevăr la ${m}. Adevărul era în altă grupă.`,
  (n,m)=>`🤦 ${n} a pus scorul la ${m} cu sufletul. Fotbalul i-a cerut buletinul.`,
  (n,m)=>`🤦 ${n} a avut ochelari de cal la ${m} și televizorul pe alt post.`,
  (n,m)=>`🤦 ${n} a intrat la ${m} cu plan. A ieșit cu explicații.`,
  (n,m)=>`🤦 ${n} la ${m}: a făcut-o de oaie. Oaia cere drept la replică.`,
  (n,m)=>`🤦 ${n} a pus predicția la ${m} ca fundașul care degajează în propria bară.`,
  (n,m)=>`🤦 ${n} a avut idei la ${m}. Meciul n-a fost informat.`,
  (n,m)=>`🤦 ${n} a fost muncitor la ${m}, dar fotbalul nu e șantier.`,
  (n,m)=>`🤦 ${n} a muncit 24 de ore la predicția de la ${m}, uneori și noaptea. Tot 0 a ieșit.`,
  (n,m)=>`🤦 ${n} a pus scorul la ${m} de parcă mingea era opțională.`,
  (n,m)=>`🤦 ${n} a dat-o în bară la ${m} fără să tragă la poartă.`,
  (n,m)=>`🤦 ${n} a citit ${m} invers. Dacă tăcea, filosof rămânea.`,
  n=>`🤦 ${n} a avut dreptate, dacă ignorăm complet meciul.`,
  n=>`🤦 ${n} a fost aproape. Aproape de nimic.`,
  n=>`🤦 ${n} a vrut să fie bine, ca să nu fie rău. A fost rău.`,
  n=>`🤦 ${n} a pus scorul ca omul care știe fotbal. Din auzite.`,
  n=>`🤦 ${n} a greșit elegant. Punctele n-au apreciat eleganța.`,
  n=>`🤦 ${n} a jucat predicția pe instinct. Instinctul era la șah.`,
  n=>`🤦 ${n} a prezis cu încredere. Încrederea a cerut schimbare la pauză.`,
  n=>`🤦 ${n} a pus scorul cu cap. Capul era la alt meci.`,
  n=>`🤦 ${n} a nimerit tot, mai puțin echipele, scorul și rezultatul.`,
  n=>`🤦 ${n} a avut tactică. Mingea nu citise planul.`,
];

const T_UP=[
  (n,r)=>`📈 ${n} a urcat în clasament ca factura la curent. Când te uiți, e deja sus. Locul ${r}.`,
  (n,r)=>`🚀 ${n} a prins liftul. Restul încă urcă scările. Locul ${r}.`,
  (n,r)=>`⚡ ${n} s-a băgat în față fără semnalizare. Locul ${r}.`,
  (n,r)=>`📈 ${n} a venit din spate ca fundașul la corner. Locul ${r}.`,
  (n,d,r)=>`🚀 ${n} a luat clasamentul pe persoană fizică. ${d} locuri, pe ${r}.`,
  (n,d,r)=>`📈 ${n} a făcut saltul de ${d} locuri. Restul studiază gazonul. Pe ${r}.`,
  n=>`⚡ ${n} a prins viteză. Cineva să-i verifice ghetele.`,
  n=>`📈 ${n} a urcat de parcă avea pile la tabelă.`,
  n=>`🚀 ${n} a prins o etapă mare. Și calul aleargă, dar azi a dat și lapte.`,
  n=>`📈 ${n} a urcat. Fotbalul e frumos, dar merită prezis.`,
  n=>`🚀 ${n} a trecut peste clasament ca buldozerul peste teren.`,
  n=>`📈 ${n} a făcut ce trebuia când trebuia. Rar, dar frumos.`,
  n=>`🚀 ${n} a urcat. Care era în fața lui, a fost depășit.`,
  n=>`📈 ${n} a intrat în top ca atacantul la colțul scurt.`,
  n=>`⚡ ${n} a urcat. Nu știm dacă e formă, bulan sau ambele.`,
];

const T_DOWN=[
  (n,r)=>`📉 ${n} a coborât. A făcut-o de oaie, capră și tot efectivul. Locul ${r}.`,
  (n,r)=>`📉 ${n} a pierdut teren. Fotbalul nu e șantier, dar aici s-a surpat. Locul ${r}.`,
  (n,r)=>`📉 ${n} a alunecat ca fundașul pe ploaie. Locul ${r}.`,
  (n,r)=>`📉 ${n} pierde locuri. Clasamentul nu iartă, doar notează. Locul ${r}.`,
  (n,d,r)=>`📉 ${n} a fost prins pe contraatac de clasament. ${d} locuri, pe ${r}.`,
  (n,d,r)=>`📉 ${n} a coborât ${d} locuri cu eleganță. Păcat că eleganța nu dă puncte. Pe ${r}.`,
  n=>`📉 ${n} a coborât. Dacă era pârtie, lua medalie.`,
  n=>`📉 ${n} a făcut pasul înapoi. Tactic, probabil. Sau nu.`,
  n=>`📉 ${n} a pierdut ritmul. Probabil era iarnă în Brazilia.`,
  n=>`📉 ${n} a coborât. La anul vine un an nou și alt an.`,
  n=>`📉 ${n} a pierdut poziții. Dacă era meci, cerea schimbare.`,
  n=>`📉 ${n} a fost depășit. Poziție bună, marcaj slab.`,
  n=>`📉 ${n} s-a dus în jos. Nu e tragedie, dar nici nuntă nu e.`,
  n=>`📉 ${n} a căzut. Publicul cere explicații, dar nu foarte multe.`,
  n=>`📉 ${n} a ajuns mai jos. Calificarea e și posibilă, și imposibilă.`,
];

// ── MATCH DRAMA — Liga 1 dressing room voice, real data ──────────────────────
const _matchDrama=(name,sA,sB,hSc,aSc,cards,corners)=>{
  const t=sA+sB; const items=[];

  if(t>=5)items.push(_p12([
    (m,t)=>`⚽ ${m}: ${t} goluri. În afară de goluri, n-au avut prea multe ocazii. Dar golurile ajung.`,
    (m,t)=>`⚽ ${m}: ${t} goluri. Atacanții au alergat, fundașii au completat cereri.`,
    (m,t)=>`⚽ ${m}: ${t} goluri în 90 de minute. Cine a mizat pe logică a primit fotbal.`,
  ],name,t)(name,t));
  else if(t===4)items.push(_p12([
    m=>`⚽ ${m}: 4 goluri. Cine a pus scor mic a avut cap. Cine a pus spectacol a avut speranță.`,
    m=>`⚽ ${m}: 4 goluri. Marcatorii au intrat pe tabelă, predicțiile au intrat în gard.`,
  ],name)(name));
  else if(t===3)items.push(_p12([
    m=>`⚽ ${m}: 3 goluri. Apărarea a fost bună, dacă ignorăm momentele când s-a luat gol.`,
    m=>`⚽ ${m}: 3 goluri. Scorul a fost clar, predicțiile mai puțin.`,
  ],name)(name));
  else if(t===0)items.push(_p12([
    m=>`🥊 ${m}: 0-0. Portarii au muncit, atacanții au meditat.`,
    m=>`🥊 ${m}: 0-0. Cine a pariat pe spectacol cere bani înapoi.`,
    m=>`🥊 ${m}: 0-0. Golurile au venit greu, ca scuzele după o predicție proastă. N-au venit deloc.`,
  ],name)(name));
  else if(t===1)items.push(_p12([
    m=>`⚽ ${m}: 1 gol, 89 de minute de chin. Care era în fața porții, a marcat o singură dată — și a fost suficient.`,
    m=>`⚽ ${m}: un singur gol a hotărât tot. Golurile au venit greu azi.`,
  ],name)(name));
  else if(sA===sB)items.push(_p12([
    (m,s)=>`⚽ ${m}: ${s}-${s}. Să fie bine, ca să nu fie rău. A fost doar egal.`,
    (m,s)=>`⚽ ${m}: egal la ${s}. Punctele se împart, nervii nu.`,
  ],name,sA)(name,sA));
  else{
    const d=Math.abs(sA-sB);const w=sA>sB?'gazdele':'oaspeții';
    items.push(_p12([
      (m,d,w)=>`⚽ ${m}: ${sA}-${sB}. ${d === 1 ? 'Un gol diferență, dar suficient.' : d + ' goluri diferență — fără discuții.'}`,
      (m,d,w)=>`⚽ ${m}: ${sA}-${sB}. ${w.charAt(0).toUpperCase()+w.slice(1)} au avut idei. Restul, doar speranțe.`,
      (m,d,w)=>`⚽ ${m}: ${sA}-${sB}. ${w.charAt(0).toUpperCase()+w.slice(1)} au câștigat. Restul — nu.`,
    ],name,d,w)(name,d,w));
  }

  if(hSc||aSc){
    const parts=[];if(hSc)parts.push(hSc);if(aSc)parts.push(aSc);
    const joined=parts.join(' / ');
    items.push(_p12([
      (m,s)=>`⚽ ${m} — marcatori: ${s}.`,
      (m,s)=>`⚽ La ${m} au marcat: ${s}.`,
    ],name,hSc||'',aSc||'')(name,joined));
  }

  if(cards>=8)items.push(_p12([
    (m,c)=>`🟨 ${m}: ${c} cartonașe. Cât pentru un dosar cu șină.`,
    (m,c)=>`🟨 ${m}: arbitrul a muncit 24 de ore pe zi, uneori și noaptea. ${c} cartonașe scoase.`,
    (m,c)=>`🟨 ${c} cartonașe la ${m}. Dacă pariai pe galbene, nu mai întrebai de salariu.`,
  ],name,cards)(name,cards));
  else if(cards>=5)items.push(_p12([
    (m,c)=>`🟨 ${m}: ${c} cartonașe. Fotbal pe nervi, regulament invocat des.`,
  ],name,cards)(name,cards));

  if(corners>=14)items.push(_p12([
    (m,c)=>`🚩 ${m}: ${c} cornere. Mingea a stat la corner de parcă plătea chirie.`,
    (m,c)=>`🚩 ${c} cornere la ${m}. La câte au fost, fanionul merita notă în aplicație.`,
    (m,c)=>`🚩 ${m}: ${c} cornere. Fanionul cere primă de joc.`,
  ],name,corners)(name,corners));
  else if(corners>=10)items.push(_p12([
    (m,c)=>`🚩 ${c} cornere la ${m}. Cornere peste cornere.`,
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

  const ctxTeams=new Set();
  const finishedMatches=[...matches.filter(m=>m.isFinished)]
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  const liveMatches=matches.filter(m=>m.isLive);
  const todayMatches=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM12(m)&&isToday(m.time));
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM12(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];
  const latestFinished=finishedMatches.slice(0,2);

  [...liveMatches,...latestFinished,...todayMatches].forEach(m=>{
    if(_isWCM12(m)){ctxTeams.add(_n12(m.teamA));ctxTeams.add(_n12(m.teamB));}
  });
  if(nextMatch){ctxTeams.add(_n12(nextMatch.teamA));ctxTeams.add(_n12(nextMatch.teamB));}

  const ctxFact=(team,seed=0)=>{
    const canon=_n12(team);
    if(!_isOff12(team)||!ctxTeams.has(canon))return null;
    const facts=CUR12[canon];if(!facts||!facts.length)return null;
    return _p12(facts,canon,seed);
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
    if(sA>sB&&m.liveMinute)ev('live_hype',`🔥 ${m.teamA} conduce cu ${sA-sB}. ${m.teamB} mai are ${90-m.liveMinute} minute.`,10);
    else if(sB>sA&&m.liveMinute)ev('live_hype',`⚠️ ${m.teamB} conduce cu ${sB-sA}. ${m.teamA} în recuperare.`,10);
    else if(m.liveMinute>70)ev('live_hype',`⏱️ Egal în ${m.liveMinute}'. Care marchează acum, scrie istoria zilei.`,10);
    else ev('live_hype',`⚖️ ${m.teamA} ${sA}-${sB} ${m.teamB}. Totul e de jucat.`,10);
    const f=ctxFact(m.teamA,m.id)||ctxFact(m.teamB,m.id+99);
    if(f)ev('curiosity',f,5);
  });

  // ── BLOCK B: LAST 2 FINISHED — dominate the feed ────────────────────────────
  let predCount=0; const PCAP=2;

  latestFinished.forEach((match,idx)=>{
    const BASE=idx===0?10:9;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const corners=rCornT??(rCornH!=null&&rCornA!=null?rCornH+rCornA:null);
    const isWC=_isWCM12(match);
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const top=[...mp].sort((a,b)=>b.pts-a.pts)[0];

    const items=_matchDrama(mName,sA,sB,match.homeScorers,match.awayScorers,rCards??0,corners??0);
    items.forEach((text,i)=>ev('match_drama',text,BASE+1-i*0.1));

    if(isWC){
      [match.teamA,match.teamB].forEach((team,i)=>{
        const f=ctxFact(team,match.id+i*100);
        if(f)ev('curiosity',f,BASE-0.5);
      });
    }

    if(exact.length===1&&predCount<PCAP){
      ev('exact',_c12(T_EXACT,[exact[0].nick,match.id,'ex'],exact[0].nick,mName),BASE+2);predCount++;
    }else if(exact.length>=2&&predCount<PCAP){
      const names=exact.slice(0,3).map(e=>e.nick).join(' și ');
      ev('exact',`🎯 ${names} au prins scorul exact la ${mName}. Coincidența cere concediu medical.`,BASE+2);predCount++;
    }
    const zeroes=mp.filter(p=>p.pts===0);
    if(zeroes.length===1&&predCount<PCAP){
      ev('miss',_c12(T_ZERO,[zeroes[0].uid,match.id,'z'],zeroes[0].nick,mName),BASE-2);predCount++;
    }
    if(mp.length>=3&&mp.filter(p=>p.ok).length===0)
      ev('upset',`😱 ${mName}: niciun jucător n-a prezis rezultatul. Fotbalul a câștigat etapa.`,BASE);
    if(top&&top.pts>=80)
      ev('best',`🏅 ${top.nick}: ${top.pts} pts la ${mName}. Liderul etapei.`,BASE-1);
  });

  // ── BLOCK C: TODAY / NEXT ────────────────────────────────────────────────────
  const T_PRE=[
    (a,b)=>`🔥 ${a} – ${b} azi. Care e în fața porții, s-o înscrie.`,
    (a,b)=>`⚽ ${a} vs ${b}: simplu pe hârtie, complicat la cartonașe. Acolo e drama.`,
    (a,b)=>`🎯 Scor exact la ${a} – ${b}: 100 puncte și o săptămână de lăudăroșenie în grup.`,
    (a,b)=>`🥶 ${a} – ${b}: un gol în minutul 88 strică o seară întreagă.`,
    (a,b)=>`🎲 La ${a} – ${b}, cine nimerește cartonașele merită titlu onorific.`,
    (a,b)=>`📺 ${a} – ${b}: dacă pui 0-0, ai nevoie de curaj sau de noroc cu acte.`,
    (a,b)=>`🌪️ ${a} – ${b}: pronosticul e gata? Clasamentul nu mai are răbdare.`,
  ];
  const todayOff=matches.filter(m=>_isWCM12(m)&&!m.isFinished&&!m.isLive&&isToday(m.time));
  todayOff.slice(0,2).forEach(m=>{
    ev('preview',_c12(T_PRE,[m.id,'pre'],m.teamA,m.teamB),3);
    [m.teamA,m.teamB].forEach((t,i)=>{const f=ctxFact(t,m.id+i*200);if(f)ev('curiosity',f,3);});
  });
  if(nextMatch&&todayOff.length===0){
    ev('preview',_c12(T_PRE,[nextMatch.id,'nxt'],nextMatch.teamA,nextMatch.teamB),3);
    [nextMatch.teamA,nextMatch.teamB].forEach((t,i)=>{const f=ctxFact(t,nextMatch.id+i*300);if(f)ev('curiosity',f,3);});
  }

  // ── BLOCK D: LEADERBOARD — Liga 1 banter, max 2 ──────────────────────────────
  let rc=0;
  if(prevLeaderboard.length>0&&n>=2){
    leaderboard.forEach(entry=>{
      if(rc>=2)return;
      const prev=prevLeaderboard.find(p=>p.nickname===entry.nickname);if(!prev)return;
      const delta=prev.rank-entry.rank,nick=entry.nickname;
      if(entry.rank===1&&prev.rank>1){
        ev('lead',_p12([
          n=>`👑 Tronul are proprietar nou: ${n}.`,
          n=>`👑 ${n} e lider. Restul vin cu furca și calculatorul.`,
          n=>`👑 ${n} conduce clasamentul ca pe propria gospodărie.`,
        ],nick)(nick),11);rc++;
      }
      if(prev.rank===1&&entry.rank>1&&rc<2){
        ev('fall',`📉 ${nick} a pierdut tronul. Liderul respiră greu, ceilalți vin cu bocancii.`,10);rc++;
      }
      if(entry.rank<=3&&prev.rank>3&&rc<2){
        ev('top3',`🚀 ${nick} a intrat în Top 3. Podiumul s-a strâns, aici nu mai e prietenie, e ședință de bloc.`,9);rc++;
      }
      if(entry.rank>3&&prev.rank<=3&&rc<2){
        ev('top3_exit',`📉 ${nick} a ieșit din Top 3. Locul ${entry.rank}.`,9);rc++;
      }
      if(delta>=3&&entry.rank>1&&rc<2){ev('rank_up',_c12(T_UP,[nick,delta,entry.rank,'up'],nick,delta,entry.rank),8);rc++;}
      else if(delta===2&&entry.rank>1&&rc<2){ev('rank_up',_c12(T_UP,[nick,entry.rank,'up2'],nick,entry.rank),7);rc++;}
      if(delta<=-2&&rc<2){ev('rank_down',_c12(T_DOWN,[nick,Math.abs(delta),entry.rank,'dn'],nick,Math.abs(delta),entry.rank),7);rc++;}
    });
    const L=leaderboard[0],S=leaderboard[1],pL=prevLeaderboard[0],pS=prevLeaderboard[1];
    if(L&&S&&pL&&pS){
      const gap=L.points-S.points,pg=pL.points-pS.points;
      if(gap>pg&&gap>=20)ev('gap',`👑 ${L.nickname} stă sus. ${S.nickname} se uită ca la tabela după 0-3.`,7);
      else if(gap<pg&&gap>0&&gap<=15)ev('chase',`⚔️ Între ${L.nickname} și ${S.nickname} e atât de puțin încât și VAR-ul cere reluare. ${gap} puncte.`,8);
    }
  }
  if(n>=3){
    const l=leaderboard[0],t=leaderboard[2],sp=l.points-t.points;
    if(sp<=20&&sp>=0&&l.points>0)
      ev('drama',`⚔️ Top 3 e mai aglomerat decât grătarul de 1 Mai. ${sp} puncte despart locul 1 de locul 3.`,6);
  }

  // ── FINAL — dedup, sort, enforce mix ────────────────────────────────────────
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
  return result.slice(0,15);
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
