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

// ─── ACTIVITY FEED v14 ───────────────────────────────────────────────────────
// FULL TONE REBUILD — football pearls, not AI jokes.
// Mechanism: contradiction, dry confidence, short punchline, terrace dressing-room voice.
// Banned forever: "investigation", "FIFA checks", "antidoping", "beri", "WhatsApp group",
//   "concediu medical", raw scorer dumps, "haos total", "clasamentul a resimțit".
// 150 zero-point + 86 exact-score + 75 leaderboard + 44 match-story templates + 106 curiosities.
// Latest 2 finished matches dominate. No Firestore writes. No scoring changes.
// ─────────────────────────────────────────────────────────────────────────────

const _A14={"Țările de Jos":"Olanda","Netherlands":"Olanda","Franța":"Franta","France":"Franta","Curaçao":"Curacao","Coasta de Fildeș":"Coasta de Fildes","DR Congo":"RD Congo","Congo RD":"RD Congo","Cape Verde":"Capul Verde","Bosnia & Herzegovina":"Bosnia","Bosnia & Herțegovina":"Bosnia"};
const _n14=t=>_A14[t]??t;
const _WC14=new Set(["Africa de Sud","Algeria","Anglia","Arabia Saudita","Argentina","Australia","Austria","Belgia","Bosnia","Brazilia","Canada","Capul Verde","Cehia","Coasta de Fildes","Columbia","Coreea de Sud","Croatia","Curacao","Ecuador","Egipt","Elvetia","Franta","Germania","Ghana","Haiti","Iordania","Irak","Iran","Japonia","Maroc","Mexic","Norvegia","Noua Zeelanda","Olanda","Panama","Paraguay","Portugalia","Qatar","RD Congo","SUA","Scotia","Senegal","Spania","Suedia","Tunisia","Turcia","Uruguay","Uzbekistan"]);
const _isOff14=t=>_WC14.has(_n14(t));
const _isWCM14=m=>m&&m.id>=1&&m.id<=72;
const _p14=(arr,...seeds)=>{const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,7));return arr[h%arr.length];};
const _c14=(arr,seeds,...args)=>{const fn=_p14(arr,...seeds);return typeof fn==='function'?fn(...args):String(fn);};

const CUR14={
  "Africa de Sud":["Vuvuzela e invenție sud-africană. În 2010 a scos din minți o planetă. Scuze, n-au dat.","Africa de Sud are 11 limbi oficiale. Pentru un cartonaș galben, ai 11 variante de protest.","Pinguinii trăiesc pe plajă în Cape Town. Nu pe gheață — pe plajă, lângă turiști.","Africa de Sud are 3 capitale: Pretoria, Cape Town și Bloemfontein. Nu s-au putut hotărî.","Bafana Bafana înseamnă băieții băieților. Numele e mai curajos decât rezultatele de obicei.","Africa de Sud a găzduit CM 2010. Unicul Mondial de pe continentul african.","Mandela spunea că fotbalul unește mai mult decât orice politician. A demonstrat-o în practică."],
  "Algeria":["Algeria e cea mai mare țară din Africa. 85% e Sahara. Restul e suficient pentru fotbal.","Algeria a eliminat Germania la CM 2014. Nimeni n-a văzut-o venind. Nici Algeria, probabil.","Algeria a luat CAN 2019 fără să piardă vreun meci. Portarul a primit mai puține goluri decât ore de somn.","Sahara acoperă 85% din Algeria. Temperaturile variază de la -10°C noaptea la 50°C ziua.","Timgad, oraș roman din Algeria, e îngropat în nisip de secole. Bine conservat, ca fotbalul algerian.","Riyad Mahrez a câștigat Premier League cu Leicester în 2016. Povestea imposibilă a unui sezon.","Algeria produce una din cele mai bune roșii din lume. Și fotbal competitiv."],
  "Anglia":["Anglia a inventat fotbalul. A câștigat un singur Mondial. Inventator de geniu, executor modest.","Football\'s coming home de prin \'96. Tot n-a venit. Adresa s-a schimbat, probabil.","Lineker n-a primit niciun cartonaș în carieră. Sfânt pe teren, obraznic la TV.","Premier League e urmărită în 212 țări. Mai globală decât ONU.","Londra are 8 milioane de locuitori și aproape tot atâția fani de fotbal declarați.","Big Ben nu bate exact — există o ușoară abatere de câteva secunde pe zi. Fotbalul englez, și el imprecis uneori.","Anglia are mai mult de 40.000 de cluburi de fotbal înregistrate. Mai multe decât orice altă țară.","Anglia a pierdut la penaltii cu Germania de atâtea ori că trauma are statistici, nu doar amintiri."],
  "Arabia Saudita":["Arabia Saudită a bătut Argentina la CM 2022. Messi a stat 5 minute pe bancă fără să clipească.","Al-Nassr îi plătește lui Ronaldo cam 200 de milioane pe an. Bani sunt, trofee — în formare.","Arabia Saudită găzduiește CM 2034. Lumea fotbalului se mută la propriu spre est.","Arabia Saudită are rezerve de petrol suficiente pentru încă 70 de ani. Bani pentru fotbal, garantat.","Riadul e unul din cele mai calde orașe din lume unde se joacă fotbal. Hidratarea e tactică.","Saudi Pro League a recrutat Benzema, Kanté, Neymar, Firmino în același an. Un transfer window de roman.","Femeia saudită a primit drept de a merge la stadion abia în 2018. Fotbalul s-a deschis."],
  "Argentina":["Maradona a dat Mâna lui Dumnezeu și Golul Secolului în același meci. Două legende dintr-un foc.","Messi a plâns pe teren după CM 2022. Au plâns și ăia care pierduseră cu Argentina.","Buenos Aires are cea mai mare densitate de psihologi din lume. Fotbalul explică o treime din ședințe.","Argentina a luat Copa América de 15 ori. Record mondial absolut la competiții continentale.","Tango s-a născut în mahalalele din Buenos Aires. Stilul de fotbal argentinian, la fel.","La Bombonera tremură literalmente când fanii bat în ritm. Studiile seismice o confirmă.","Argentina are unul din cele mai bune vinuri din lume — Malbec din Mendoza. Messi bea, probabil.","Buenos Aires are cel mai mare număr de librării per capita din lume. Cultură, nu doar fotbal."],
  "Australia":["Australia a pierdut un război contra unor păsări. Da, chiar așa. Emu Wars, 1932.","Australia a bătut Argentina la penaltii la CM 2022. Messi n-a ratat. Australia a câștigat tot.","Sunt mai mulți canguri decât oameni în Australia. Pe teren, echipa e tot atât de imprevizibilă.","Australia e singurul continent care e și țară. Ambițios ca concept geografic.","Australia are cele mai multe animale veninoase pe metru pătrat din lume. Jucătorii adverși, atenție.","Tim Cahill a marcat cu capul de la 30 de metri contra Germaniei. Înălțimea contează mai puțin decât momentul.","Great Barrier Reef e vizibil din spațiu. Echipa australiană, vizibilă pe hărțile fotbalului mondial."],
  "Austria":["Salzburg nu pare club, pare pepinieră cu nocturnă. Haaland, Mané, Upamecano — toți au trecut pe acolo.","Red Bull e austriac. Cafeina și ambiția au același portofel.","David Alaba a câștigat Champions League cu Bayern și Real Madrid. Cel mai titrat austriac din fotbal.","Viena a fost capitala unui imperiu care controla jumătate din Europa. Acum controlează cafenelele.","Mozart s-a născut în Salzburg. Acum orașul ăla scoate fotbaliști pentru Champions League.","Viena a fost de 3 ori cel mai bun oraș din lume în care să trăiești. Fotbalul n-a intrat în calcul.","Austria produce Manner — napolitane cu gust de nucă. Și fotbal mai puțin dulce."],
  "Belgia":["Belgia a stat 3 ani pe locul 1 FIFA. Titlu major luat în acea perioadă: zero. Dosar de deschis.","Belgia a stat 541 de zile fără guvern. Fotbalul a mers tot timpul. Țara — mai cu emoții.","Belgia a bătut Brazilia în sferturi la CM 2018. Generația de aur s-a justificat o singură dată.","De Bruyne a fost cel mai bun pasator din lume 4 ani la rând. Pase bune, finaluri rele.","Belgia scoate 750 de tipuri de bere. Bere câte beri, trofee — altă poveste.","Ciocolata belgiană e standard mondial. Și fotbalul belgian, din ce în ce mai aproape de standard.","Bruxelles e capitala UE. Și a birocrației. Și a generației de aur fără trofee.","Belgia e mai mică decât județul Timiș. Și totuși produce fotbaliști pentru toate marile cluburi."],
  "Bosnia":["Bosnia a fost la primul Mondial în 2014. Džeko a marcat la primul meci. Fotbalul n-a stat la coadă.","Bosnia are 3 președinți în rotație. Mai complicat decât orice apărare din zonă.","Zlatan Ibrahimović are origini bosniace pe linie paternă. Baza genetică explică parțial atitudinea.","Edin Džeko a marcat 66 de goluri pentru Bosnia. Cel mai prolific jucător din istoria țării.","Sarajevo a organizat JO de iarnă în \'84 și a supraviețuit unui asediu de 4 ani după. Rezistența e în ADN.","Bosnia are cafea pregătită în stil turcesc — džezva — și se bea lent, cu povești.","Podul Vechi din Mostar a rezistat 400 de ani, a fost distrus în \'93, reconstruit în 2004. Ca fotbalul bosniac."],
  "Brazilia":["Brazilia are 5 Mondiale. Unele naționale încă încearcă să ajungă la primul.","7-1 cu Germania în 2014, pe teren propriu. N-au înțeles ce se întâmplă la timp.","Pelé a luat 3 Mondiale la 17, 21 și 29 de ani. Altcineva n-a mai zis asta.","Brazilia e singura echipă care a jucat la fiecare ediție a Cupei Mondiale. 22 din 22.","Amazon produce 20% din oxigenul planetei. Brazilia produce fotbaliști pentru toată lumea.","Rio de Janeiro a găzduit CM 2014 și JO 2016. Carnavalul, toată viața.","Caipirinha e mai periculoasă decât pare. La fel ca echipa la CM.","Brazilia are mai multe specii de animale decât orice altă țară. Și mai mulți golghetereri."],
  "Canada":["Canada are mai multe lacuri decât restul lumii la un loc. Apa nu-i problema lor.","Davies, fundaș la naționala Canadei, s-a născut în tabără de refugiați și valorează 70 de milioane la Bayern.","Canada n-a marcat niciun gol la CM \'86. La CM 2022 a dat mai bine. Progres real.","Canada are a doua cea mai mare suprafață din lume. Și cel mai puțin zgomotoasă.","Poutine e mâncarea națională canadiană: cartofi prăjiți, brânză și sos. Și fotbal din ce în ce mai bun.","Toronto e unul din cele mai multiculturale orașe din lume — 200 de limbi vorbite zilnic.","Jonathan David e golgheterul din Ligue 1 de mai mulți ani. Francezii l-ar vrea, canadienii îl au."],
  "Capul Verde":["În Capul Verde sunt mai mulți capverdieni în afara țării decât în țară.","Capul Verde nu are râuri permanente. Zero. Și totuși au pus echipă pe teren.","Capul Verde a eliminat Maroc la CAN 2021. Favoritul clar. Surpriza turneului.","Muzica Morna din Capul Verde e UNESCO — melancolie de om departe de casă. La fel ca jucătorii lor.","Capul Verde e format din 10 insule vulcanice în Oceanul Atlantic. Mici, dar cu voință mare.","Vântul bate constant în Capul Verde. Mingea zboară altfel acolo — avantaj local.","Cea mai faimoasă capverdiană e Cesária Évora, cântăreața de Morna. Fotbalul e al doilea export cultural."],
  "Cehia":["Panenka a inventat lovitura cu chip la Euro \'76, contra lui Sepp Maier. Faimă eternă dintr-o secundă de curaj.","Cehia bea mai multă bere decât orice altă țară. Prioritățile, clare.","Petr Čech a purtat cască de hochei toată cariera după o fractură de craniu. Cel mai recognoscibil portar din epocă.","Praga e numită Orașul de Aur. 700 de ani de arhitectură medievală pe un singur mal de râu.","Kafka s-a născut la Praga. A scris despre absurd. Un meci de fotbal ceh conține uneori exact asta.","Cehia produce Pilsner Urquell — berea originală de tip pils. Exportul lor cel mai valoros.","Pavel Nedvěd a luat Balonul de Aur în 2003. Singurul ceh care a ajuns acolo.","Cehia are mai mult de 3.000 de castele. Mai multe decât orice altă țară din lume."],
  "Coasta de Fildes":["Drogba a negociat un armistițiu în războiul civil de acasă. Fotbalul a oprit un conflict. Mă, la propriu.","Coasta de Fildes scoate 40% din cacaoul mondial. Ciocolata din toată lumea are rădăcini acolo.","Didier Drogba a marcat 65 de goluri pentru Coasta de Fildeș. Legendă națională, nu doar fotbalistică.","Yaya Touré a luat Premier League, La Liga și CAN. Trei titluri, trei continente diferite.","Abidjan e cel mai mare oraș francofon din Africa de Vest. Cosmopolit, vivace, fotbalist.","Coasta de Fildeș are două capitale: Yamoussoukro (oficial) și Abidjan (real). Ca în fotbal — ce scrie pe hârtie și ce e pe teren.","Coasta de Fildeș are cea mai mare basilică din lume ca dimensiuni. Ambițioși la orice."],
  "Columbia":["James Rodríguez a luat Gheata de Aur la CM 2014. A venit din neant și a plecat cu trofeul.","Valderrama avea părul ăla afro la 3 Mondiale. Coafura mai faimoasă decât unele pase.","Columbia are cea mai mare biodiversitate de păsări din lume — 1.900 de specii. Și fotbaliști la fel de colorați.","Cafeaua colombiană e considerată cea mai bună din lume. Juan Valdez e mai celebru decât orice fotbalist local.","Cartagena e cel mai bine conservat oraș colonial din America Latină. Frumos și cu fotbal bun.","Bogotá e la 2.600 m altitudine. Oaspeții respiră greu — gazdele se antrenează la altitudine.","Falcao a marcat 36 de goluri în Ligue 1 într-un sezon. Înainte de accidentare, era cel mai bun din lume."],
  "Coreea de Sud":["Coreea de Sud a fost în semifinale la CM 2002. A eliminat Spania și Italia pe drum.","Son a luat Gheata de Aur în Premier League fără să bată un penalti. Curat.","Coreea de Sud are internetul cel mai rapid din lume. Și echipe de esports mai faimoase decât fotbalul.","K-pop e mai popular decât fotbalul în Coreea. BTS vinde mai mult decât orice echipament sportiv.","Samsung, Hyundai, LG — toate sunt coreene. Economia e mai mare decât pare pe hartă.","Kimchi se mănâncă la fiecare masă în Coreea. Și se exportă în toată lumea.","Coreea de Sud a eliminat Germania campioana en-titre la CM 2018. Surpriza decadei."],
  "Croatia":["Croatia a luat locul 2 la CM 2018. 4 milioane de oameni, rezultate de țară mare.","Modrić a luat Balonul de Aur 2018. Primul altul decât Messi sau Ronaldo în 10 ani.","Croatia a eliminat Brazilia la CM 2022, la penaltii. Livaković a apărat 3 lovituri consecutive.","Cravata a fost inventată în Croatia. Export cultural care valorează miliarde. Mai mult decât unii transferuri.","Dubrovnik e cel mai fotografiat oraș din Europa. Game of Thrones l-a ales ca decor.","Plitvice e cel mai frumos parc național din Europa. Cascade, lacuri — și fotbal frumos.","Zvonimir Boban a lovit un polițist în \'90 ca să apere un fan. A devenit erou național instantaneu."],
  "Curacao":["Curaçao are 150.000 de locuitori. Mai puțin decât un cartier din Cluj. Și totuși, la Mondial.","Curaçao a eliminat Costa Rica la baraj. Victorie istorică pentru 150.000 de oameni.","Insula Curaçao e vestită pentru Blue Curaçao — licoarea portocalie care colorează cocktail-uri în toată lumea.","Willemstad e UNESCO pentru arhitectura colorată olandezo-caraibiană. Frumos pe afară, fotbal serios pe interior.","Curaçao are plaje de clasă mondială. Turiști din toată lumea, fotbaliști din Olanda.","Clima din Curaçao e perfectă tot anul. 28°C medie anuală — mingea zboară diferit în căldură."],
  "Ecuador":["Ecuador a deschis CM 2022 cu 2-0 contra gazdei Qatar. Gazda n-a mai câștigat după aceea.","Quito e la 2.850 m altitudine. Adversarii vin și nu mai respiră normal câteva zile.","Enner Valencia a marcat 3 din primele 5 goluri ale Ecuadorului la CM 2022. Un om, un turneu.","Insulele Galapagos sunt în Ecuador. Darwin a venit, a văzut, a inventat evoluția.","Ecuador e traversat de Ecuator. Există o linie pictată pe un deal care marchează exact unde ești la jumătatea lumii.","Ecuador produce cea mai mare parte din bananele exportate în lume. Și jucători de fotbal de export.","Antonio Valencia a câștigat Premier League cu Manchester United. Căpitanul care a ajuns sus de tot."],
  "Egipt":["Egipt are 7 Cupe ale Africii. Restul continentului încă recuperează cu pixul în mână.","Salah a marcat 200+ goluri pentru Liverpool. Orașul i-a pus porecla Egyptian King. Pe merite.","Cleopatra e mai aproape de noi în timp decât de construirea piramidelor. Istoria e adâncă.","Piramidele de la Giza sunt singura minune antică rămasă în picioare. Au supraviețuit mai mult decât orice club.","Nilul e cel mai lung râu din lume. Egiptul se hrănește din el de 7.000 de ani.","Cairo are 20 de milioane de locuitori. Cel mai mare oraș din Africa și din lumea arabă.","Egipt a luat CAN de 3 ori consecutiv: 2006, 2008, 2010. Record mondial la competiții continentale."],
  "Elvetia":["Elveția a eliminat Franta la Euro 2020, de la 1-3, la penaltii. Franta nu știa că trebuia să fie îngrijorată.","Xherdan Shaqiri a marcat un gol cu foarfecă contra Poloniei. Mic de statură, mare de momente.","Elveția are 4 limbi oficiale. Echipa e multilingvă în vestiar. Comunicarea e provocare, nu accesoriu.","Elveția are 7.000 de lacuri. Plus munți, ciocolată și ceasuri. Și fotbal decent.","Roger Federer e elvețian. Nu joacă fotbal, dar a ridicat standardul elvețian la orice sport.","Geneva e sediul ONU, Crucii Roșii și al FIFA. Fotbalul e de acasă acolo.","Elveția n-a fost în război din 1815. Neutralitate, ciocolată, fotbal competitiv.","Granit Xhaka a fost huiduit la Arsenal și a câștigat Bundesliga cu Leverkusen. Revenirea e sport elvețian."],
  "Franta":["Mbappé a dat hat-trick în finala CM 2022, în ultimele 8 minute. Franta a pierdut la penaltii totuși.","Zidane a dat cu capul în Materazzi la ultimul meci oficial. Cap de aur, cap de foc.","Franta a câștigat CM \'98 și 2018. Generații diferite, același rezultat. Sistemul funcționează.","Turnul Eiffel era programat la demolare în 1909. Bine că au mai zis o predicție și au lăsat-o.","Franta produce cel mai mult vin din lume — 7 miliarde de sticle pe an. Și fotbaliști de export.","Just Fontaine a marcat 13 goluri la un singur Mondial, în 1958. Record absolut, imbatabil.","Parisul are 130 de muzee. Fotbalul e al 131-lea muzeu viu al francezilor.","Lotul Franței la CM 2022 valora peste 1,2 miliarde. Cei mai scumpi din turneu. Au pierdut finala."],
  "Germania":["Germania are 4 titluri mondiale și obiceiul de a apărea exact când contează.","7-1 cu Brazilia în semifinale, 2014. Cel mai mare șoc din istoria turneului.","Klose are 16 goluri la Mondiale. Record absolut, poate imbatabil.","Germania produce BMW, Mercedes, Volkswagen, Porsche. Și fotbal de calitate germană.","Bundesliga are cei mai mulți spectatori per meci din Europa. Fotbalul german e pentru fani, nu pentru investitori.","Germania are legea purității berii din 1516. Disciplina e în ADN, pe teren la fel.","Berlinul a căzut în \'89 și s-a ridicat în \'90 când Germania a câștigat CM. Coincidență fericită.","Oliver Kahn a câștigat Balonul de Aur ca portar în 2002. Singurul portar care a luat trofeul."],
  "Ghana":["Ghana a ratat semifinala CM 2010 la penaltii cu Uruguay. Suárez a blocat cu mâna pe linie.","Gyan e golgheterul african all-time la Mondiale. A și ratat penaltiul decisiv în 2010.","Ghana a câștigat independența în 1957. Primul stat african care s-a eliberat de colonialism.","Abedi Pele a câștigat Liga Campionilor cu Marseille în 1993. Cel mai mare fotbalist ghanez din istorie.","Ghana produce 20% din cacaoul mondial. Ciocolata ta are rădăcini acolo.","Accra e unul din cele mai tinere orașe din Africa ca medie de vârstă. Energie pură.","Black Stars se numesc după steaua neagră de pe drapelul Ghanei. Simbol al unității africane."],
  "Haiti":["Haiti a fost prima republică neagră din lume, în 1804. Revoluție înainte să existe termenul.","Haiti a participat la CM 1974. Singurul Mondial din istoria țării, pentru moment.","Emmanuel Sanon a marcat contra Italiei la CM \'74. Un moment de magie dintr-o țară mică.","Haiti are cele mai vii culori în artă — picturile naive haitiene sunt colecționate worldwide.","Creola haitiană e o limbă aparte — franceză amestecată cu africană și taino. Unicat absolut.","Haiti a jucat fotbal internațional și în perioade de criză. Nu s-a oprit niciodată complet."],
  "Iordania":["Iordania are Marea Moartă — cel mai jos punct de pe Pământ, la -430 m. Plutești fără să înoți.","Iordania s-a calificat la CM 2026 pentru prima dată. Moment istoric pentru fotbalul arab.","Wadi Rum arată atât de extraterestru încât Hollywood-ul l-a folosit pe post de Marte.","Petra e una din cele 7 minuni ale lumii moderne. Oraș sculptat direct în stâncă roșie.","Iordania are 10 milioane de locuitori — dintre care 3 milioane sunt refugiați. Ospitalitate reală.","Mâncarea iordaniană — mansaf, falafel, hummus — e parte din identitatea regiunii."],
  "Irak":["Irak a luat Cupa Asiei 2007, în plină instabilitate politică. Fotbalul a unit când nimic altceva nu putea.","Radhi a marcat singurul gol al Irakului la un Mondial, \'86, contra Belgiei. Legendă din acel moment.","Irakul e leagănul civilizației. Mesopotamia — prima scriere, primele orașe, primul cod de legi.","Tigrul și Eufratul curg prin Irak. Civilizația a pornit de acolo acum 6.000 de ani.","Bagdadul a fost cel mai mare oraș din lume în secolul al IX-lea. Centrul științei și culturii islamice.","Fotbalul irakian a supraviețuit războaie și sancțiuni. Pasiunea pentru joc nu s-a oprit niciodată."],
  "Iran":["Iran a luat Cupa Asiei de 3 ori la rând. Dominanță regională, fără glumă.","Taremi a marcat o foarfecă spectaculoasă contra Angliei la CM 2022.","Ali Daei a marcat 109 goluri pentru Iran. A deținut recordul mondial până când Ronaldo l-a depășit.","Iranul are 2.500 de ani de civilizație persană. Unul din cele mai vechi state din lume.","Iran produce cea mai bună caviară din lume — din Marea Caspică. Și fotbal competitiv.","Iran a șocat SUA la CM 1998. Meci cu încărcătură politică, câștigat de Iran 2-1.","Mehdi Taremi joacă la Inter Milano. Primul iranian la un club de top din Serie A."],
  "Japonia":["Japonia are automate pentru aproape orice. Dacă pierzi meciul, măcar găsești o cafea.","Japonia a eliminat Germania și Spania la CM 2022. Ambele conduceau la pauză. Japonia n-a primit memo-ul.","Japonia are 127 de milioane de locuitori pe o insulă. Densitate, disciplină, precizie.","Japonezii curăță tribuna după meciuri, câștigate sau pierdute. Respect rar în fotbalul mondial.","Japonia a câștigat CM de feminin în 2011. La 6 luni după tsunamiul devastator. Rezistență pură.","Sushi, sashimi și ramen — Japonia a cucerit lumea cu mâncarea înainte de fotbal.","Mt. Fuji e un vulcan activ. Japonezii îl urcă ca sport național. Fotbalul, al doilea sport național."],
  "Maroc":["Maroc a fost prima echipă africană în semifinale de Mondial, 2022. Milioane au plâns de bucurie acasă.","Hakimi a marcat penaltiul decisiv contra Spaniei cu Panenka. Curaj rar la cel mai important meci al carierei.","Maroc găzduiește CM 2030, alături de Spania și Portugalia. Primul Mondial pe 3 continente simultan.","Marrakech e unul din cele mai colorate orașe din lume. Piețele, mirosurile, zumzetul — unic.","Marocul produce cel mai mult fosfat din lume. Resursă invizibilă, economie solidă.","Tagine și couscous — Maroc a cucerit bucătăriile lumii. Fotbalul, acum și el.","Sahara și Atlantic la același loc. Maroc are cea mai variată geografie din Africa de Nord."],
  "Mexic":["Mexic n-a trecut niciodată de sferturi la un Mondial. Blestemul sferturilor e fenomen cultural acum.","Azteca e singurul stadion cu 2 finale mondiale: 1970 și 1986.","Mexic a inventat ciocolata, roșia și porumbul. Lumea le-a preluat fără să spună mulțumesc.","Mexic are 125 de milioane de locuitori. Al doilea cel mai populat stat din America Latină.","Hugo Sánchez a marcat 58 de goluri pentru Real Madrid. Unul din cei mai buni atacanți ai anilor \'80.","Tacos, guacamole, tequila — Mexic a exportat mâncare mai bine decât fotbal. Deocamdată.","Teotihuacan are piramide la fel de mari ca cele din Egipt. Și mai puțin celebre, nedrept."],
  "Norvegia":["Norvegia vine cu Haaland. Planul tactic încape pe un bilețel: găsiți-l pe băiatul mare.","Haaland a marcat 36 de goluri într-un sezon de Premier League. Restul recalculează standardele.","Norvegia e cel mai fericit país din lume, conform ONU, aproape în fiecare an.","Aurora boreală se vede din Norvegia. Spectacol gratis pentru oricine suportă frigul.","Norvegia produce 95% din energia sa din hidrocentrale. Cel mai verde stat din Europa.","Ole Gunnar Solskjær a marcat golul finalei Champions League \'99 pentru Manchester United. Minutul 90+3.","Norvegia are mai multă linie de coastă decât SUA. Și mai puțin zgomot."],
  "Noua Zeelanda":["În Noua Zeelandă sunt atât de multe oi încât dacă toate mergeau la meci, oamenii rămâneau afară.","All Blacks au 77% rată de victorie. La fotbal, mai lucrează.","Noua Zeelandă a participat la CM 1982 și 2010. La CM 2010 n-a pierdut niciun meci. N-a câștigat niciunul.","Noua Zeelandă a organizat CM feminin 2023. Primul Mondial pe pământul kiwi.","Hobbiton din Lord of the Rings e în Noua Zeelandă. Peisajele sunt cu adevărat de poveste.","Noua Zeelandă a dat drept de vot femeilor în 1893. Primul stat din lume. Progresivi de 130 de ani."],
  "Olanda":["Cruyff a inventat fotbalul total. Olanda nu l-a câștigat niciodată pe Mondial.","Van Basten a dat gol din unghi imposibil în finala Euro \'88. Comentatorii au tăcut 3 secunde.","Olanda a pierdut 3 finale de Mondial: 1974, 1978, 2010. Recordul de finaliste fără titlu.","Olanda e sub nivelul mării 26% din suprafață. Au construit dighuri în loc să se mute.","Rembrandt, Vermeer, Van Gogh — Olanda a produs mai mulți pictori de top per capita decât orice altă țară.","Amsterdam are mai multe biciclete decât oameni. Și mai multe canale decât Veneția.","Ajax a câștigat Cupa Campionilor de 4 ori. Pepiniera de talente cea mai faimoasă din lume."],
  "Panama":["Panama s-a calificat la CM 2018 și toată țara a oprit treaba pentru meciul inaugural.","Panama nu are armată permanentă din 1990. Are echipă de fotbal, totuși.","Roman Torres a marcat golul calificant pentru CM 2018. A plâns. Tot stadionul a plâns.","Canalul Panama leagă Atlanticul de Pacific. Cel mai important canal din lume.","Panama are 980 de specii de păsări. Mai mult decât SUA și Canada la un loc.","Panama e una din cele mai mici țări din lume cu un canal care leagă două oceane. Mic dar esențial."],
  "Paraguay":["Chilavert, portarul paraguayan, a marcat 62 de goluri din penaltii și free-kick-uri. Record pentru portari.","Paraguay e una din cele 2 țări sud-americane fără ieșire la mare. Tot au ajuns la Mondiale.","Paraguay a ajuns în sferturile CM 2010. Cel mai bun rezultat din istoria lor.","Paraguay are cele mai mari rezerve de apă dulce din lume. Acviferul Guaraní e sub picioarele lor.","Guaraní e limbă oficială alături de spaniolă. Una din puținele țări unde o limbă indigenă are statut oficial.","Salvador Cabañas a supraviețuit unui împușcat în cap în 2010. S-a întors să joace fotbal."],
  "Portugalia":["Ronaldo a marcat 128 de goluri pentru Portugalia. Record mondial pentru o națională.","Eusébio a dat 9 goluri la CM \'66. Portugalia a luat locul 3.","Portugalia a câștigat Euro 2016 fără să câștige niciun meci în timpul regulamentar în grupe. Filozofie pragmatică.","Portugalia e cel mai vechi stat cu granițe neschimbate din Europa. Din 1139.","Fado e muzica națională portugheză — melancolie frumoasă. Ca fotbalul lor uneori.","Portugalia a explorat și cartografiat 70% din coasta mondială în secolul XV. Navigatori, nu fotbaliști, atunci.","Lisabona e capitala cu cele mai faimoase tramvaie din lume. Pitoresc și lent, ca publicul la meciuri."],
  "Qatar":["Qatar a găzduit primul Mondial de iarnă, primul din Orientul Mijlociu.","Qatar a ieșit din grupe fără victorie, ca gazdă. Primul caz din istoria turneului.","Qatar e cel mai bogat stat per capita din lume. PIB per locuitor de 83.000 USD.","Qatar a construit 8 stadioane cu aer condiționat în 12 ani. Inginerie futuristă.","Perle naturale — Qatar le-a extras din Golful Persic înainte de petrol. Acum exportă fotbal.","Qatar a câștigat Cupa Asiei în 2019. Titlu pe care nimeni nu l-a anticipat."],
  "RD Congo":["RD Congo revine la Mondial după 52 de ani. Cel mai lung interval de revenire din istoria turneului.","Kinshasa e cel mai mare oraș francofon din lume, mai mare decât Paris.","Congo are cea mai mare pădure tropicală din lume după Amazon. Plămânul planetei nr. 2.","Zaire la CM 1974 — Mwepu Ilunga a dat cu piciorul într-un free-kick al Braziliei. A intrat în folclor.","TP Mazembe a câștigat Cupa Mondială a Cluburilor în 2010. Primul club african în finală.","Congo River e cel mai adânc râu din lume — 230 de metri în unele puncte."],
  "SUA":["SUA a înregistrat cea mai mare medie de spectatori per meci din istoria CM, în 1994.","Pulisic a marcat golul calificant și a ieșit accidentat din teren. Sacrificiu de centru, literal.","SUA, Canada și Mexic organizează CM 2026. Cel mai mare turneu din istorie, pe 3 țări.","Tim Howard a apărat 16 șuturi contra Belgiei la CM 2014. Record all-time pentru CM.","MLS există din 1996 și a crescut la 30 de cluburi. Fotbalul american e serios de ani buni.","SUA produce cel mai mult porumb din lume. Și cei mai mulți milionari din fotbal — prin investiții în cluburi europene.","New York, Los Angeles, Chicago — 3 din cele mai mari orașe din lume, toate cu echipe de fotbal acum."],
  "Scotia":["Scoția și Anglia au jucat primul meci internațional din istorie, 1872. Scor: 0-0.","Denis Law a marcat golul care a retrogradat Anglia, \'75. Cu călcâiul. A celebrat cu tristețe.","Scoția a participat la 8 Mondiale fără să treacă niciodată de grupe. Consecvență inversă.","Highlands scoțiene sunt printre cele mai frumoase peisaje din lume. Verzi, cetoase, epice.","Whisky-ul scoțian e băutura ce definește o națiune. Exportul lor nr. 1.","Edinburghul are un festival de artă cu cel mai mare număr de spectacole din lume — Fringe Festival.","Hampden Park a fost cel mai mare stadion din lume. 149.000 de spectatori la un meci din 1937."],
  "Senegal":["Senegal a eliminat Franta campioana mondială la CM 2002. La primul meci.","Mané a luat Premier League, Champions League și CAN. Definește generația de aur senegaleză.","Senegal a câștigat CAN 2022. Primul titlu continental din istoria țării.","Insula Gorée din Senegal e monument UNESCO — centrul comerțului cu sclavi din Africa de Vest.","Dakar e capitala cel mai vestică din Africa continentală. Bătută de vântul Alizeu.","Senegal n-a pierdut niciun meci la CM 2002. A ajuns în sferturi la primul Mondial. Debut de legendă."],
  "Spania":["Spania a luat Euro 2024 cu cei mai tineri jucători de start din istoria turneului final.","Iniesta a dat golul finalei CM 2010 în prelungiri. A băut vin de la vie proprie după.","Spania a câștigat Euro 2008, CM 2010, Euro 2012. Primul trifecta din istoria fotbalului.","Spania are cel mai mare număr de ore de soare din Europa. La fel și fotbalul lor — strălucitor.","La Sagrada Família e construită din 1882 și tot nu e terminată. Arhitectura spaniolă ia timp.","Xavi și Iniesta au jucat împreună 10 ani pentru Spania. Cel mai bun duet de mijlocași din istoria fotbalului.","Spania produce cel mai mult ulei de măsline din lume. Export, ca fotbaliștii lor.","Real Madrid și Barcelona sunt cele mai valoroase branduri sportive din lume. Fotbalul spaniol e și afacere."],
  "Suedia":["Zlatan a dat o foarfecă absurdă de la 30 de metri contra Angliei. Comentatorul a rămas mut.","Zlatan are 62 de goluri pentru Suedia. Nimeni nu se apropie să-l ia.","Suedia a luat locul 3 la CM 1994. Cu Brolin, Dahlin și Larsson, o generație de top.","IKEA și H&M sunt suedeze. Design simplu, funcțional — la fel ca fotbalul lor.","Suedia are 96.000 de lacuri. Și soarele de miezul nopții în vară.","Henrik Larsson a marcat 242 de goluri pentru Celtic. Legenda absolută a fotbalului scandinav.","Sueda a câștigat CM feminin în 2023. Una din cele mai puternice echipe feminine din lume.","Suedezii au inventat dinamita, pacemaker-ul și Bluetooth. Inventivitate care merge și la fotbal."],
  "Tunisia":["Tunisia a bătut Franta campioana mondială la CM 2022. Franta rotise lotul. Tunisia a jucat serios.","Tunisia a fost prima echipă africană care a câștigat un meci la un Mondial, \'78, contra Mexic.","Tunisia are Cartagina — rivala Romei din antichitate. Civilizație de mii de ani la Mediterana.","Tunisia are cele mai bune plaje de la Mediterana după Grecia. Turism și fotbal.","Tunisia a participat la 6 Mondiale. Cea mai prezentă echipă africană din nordul continentului.","Tunisia a câștigat CAN în 2004. Singurul titlu continental, pe teren propriu."],
  "Turcia":["Hakan Şükür a marcat în 11 secunde la CM 2002. Cel mai rapid gol din istoria turneului.","Istanbul e singurul oraș de pe Pământ pe două continente simultan.","Turcia a luat locul 3 la CM 2002. Cu Şükür, Ilhan Mansız și Rüştü Reçber, o generație de excepție.","Turcia produce 75% din alunele de pădure ale lumii. Nutella are o datorie față de Turcia.","Istanbul are 15 milioane de locuitori. Cel mai mare oraș din Europa, deși jumătate e în Asia.","Galatasaray a câștigat Cupa UEFA și Supercupa în 2000. Primul trofeu european al unui club turc.","Capadocia, cu stânci ca ciuperci și baloane cu aer cald, e cel mai fotografiat loc din Turcia."],
  "Uruguay":["Uruguay a bătut Brazilia pe Maracanã, 1950, în fața a 200.000 de oameni. Cel mai mare șoc din istoria fotbalului.","Suárez a blocat cu mâna pe linie contra Ghanei la CM 2010. A plâns. Ghana a ratat penaltiul.","Uruguay a câștigat primele 2 Mondiale: 1930 și 1950. Campioana originală.","Uruguay e cea mai mică țară din America de Sud cu o democrație stabilă de peste 150 de ani.","Uruguayenii consumă cel mai mult carne per cap de locuitor din lume. Asado e religie.","Diego Forlán a marcat 36 de goluri pentru Uruguay. Golgheterul cel mai elegant al generației.","Estadio Centenario din Montevideo a găzduit prima finală mondială. Monument al fotbalului."],
  "Uzbekistan":["Uzbekistan e singura țară care locuiește într-un cartier unde toți vecinii se termină în «-stan».","Samarkanda e unul din cele mai vechi orașe din lume — pe Drumul Mătăsii timp de milenii.","Uzbekistan s-a calificat la CM 2026 după ce a câștigat grupele de calificare din Asia.","Eldor Shomurodov joacă la AS Roma. Uzbekistanul are reprezentanți în Serie A.","În Uzbekistan, pâinea e sacră. Nu se pune niciodată cu fața în jos.","Uzbekistan produce 80% din aur din zona ex-sovietică. Bogăție ascunsă în stepe.","Registan din Samarkanda e una din cele mai frumoase piețe din lume. UNESCO, meritat."],
};


const T_ZERO=[
  n=>`🤦 ${n} A citit meciul perfect. Problema e că era alt meci.`,
  n=>`🤦 ${n} A avut dreptate până a început partida.`,
  n=>`🤦 ${n} Predicția lui era bună. Fotbalul n-a colaborat.`,
  n=>`🤦 ${n} A plecat după fentă și încă nu s-a întors.`,
  n=>`🤦 ${n} A văzut mingea. Scorul l-a evitat.`,
  n=>`🤦 ${n} A avut tactică. Mingea avea alte planuri.`,
  n=>`🤦 ${n} N-a greșit mult. Doar rezultatul.`,
  n=>`🤦 ${n} A fost aproape de adevăr. Adevărul n-a fost aproape de el.`,
  n=>`🤦 ${n} A intrat în etapă cu idei și a ieșit cu explicații.`,
  n=>`🤦 ${n} Scorul lui era bun. Pentru alt sport.`,
  n=>`🤦 ${n} Dacă tăcea, filosof rămânea.`,
  n=>`🤦 ${n} A jucat ofensiv. Punctele s-au apărat bine.`,
  n=>`🤦 ${n} Predicția lui a avut o copilărie grea.`,
  n=>`🤦 ${n} A pus scorul cu cap. Capul era în concediu.`,
  n=>`🤦 ${n} A avut fler. Dar pentru altă etapă.`,
  n=>`🤦 ${n} A nimerit ziua. N-a nimerit meciul.`,
  n=>`🤦 ${n} A văzut totul clar. Doar că invers.`,
  n=>`🤦 ${n} A avut o teorie. Meciul a avut alta.`,
  n=>`🤦 ${n} A mizat pe instinct. Instinctul a mizat pe altceva.`,
  n=>`🤦 ${n} S-a uitat la meci cu toată atenția. N-a fost de ajutor.`,
  n=>`🤦 ${n} A pus un scor onest. Onestitatea nu se punctează.`,
  n=>`🤦 ${n} A încercat. Asta-i tot ce se poate spune frumos.`,
  n=>`🤦 ${n} Predicția lui a fost curajoasă. Curajul singur nu dă puncte.`,
  n=>`🤦 ${n} A calculat totul. A omis fotbalul.`,
  n=>`🤦 ${n} A avut o presimțire. Presimțirea a întârziat.`,
  n=>`🤦 ${n} A pariat pe logică. Meciul n-a citit regulamentul.`,
  n=>`🤦 ${n} A fost convins. Convingerea nu se transformă în puncte.`,
  n=>`🤦 ${n} A pus scorul exact invers. Talent special.`,
  n=>`🤦 ${n} A jucat-o pe sigur. Siguranța l-a dezamăgit.`,
  n=>`🤦 ${n} A avut o zi bună. Din păcate, alta decât cea de azi.`,
  n=>`🤦 ${n} A pus mâna pe predicție și predicția i-a scăpat.`,
  n=>`🤦 ${n} A vrut să surprindă. A surprins doar pe el.`,
  n=>`🤦 ${n} A citit forma echipelor. Forma s-a schimbat fără să-l întrebe.`,
  n=>`🤦 ${n} A avut o strategie solidă. Solidă pentru altceva.`,
  n=>`🤦 ${n} S-a încrezut în statistici. Statisticile l-au lăsat singur.`,
  n=>`🤦 ${n} A pus pasiune în predicție. Fotbalul cere și altceva.`,
  n=>`🤦 ${n} A nimerit echipele. Restul, mai puțin.`,
  n=>`🤦 ${n} A avut o idee fixă. Ideea n-a fost și a meciului.`,
  n=>`🤦 ${n} A bifat totul greșit, dar cu eleganță.`,
  n=>`🤦 ${n} A încercat o lovitură de geniu. A nimerit doar lovitura.`,
  n=>`🤦 ${n} A pus mult suflet. Sufletul nu se calculează la puncte.`,
  n=>`🤦 ${n} Era convins că știe meciul. Meciul nu l-a recunoscut.`,
  n=>`🤦 ${n} A văzut un meci frumos. Doar că în mintea lui.`,
  n=>`🤦 ${n} A avut o presupunere bună. Bună pentru altă etapă.`,
  n=>`🤦 ${n} A jucat-o la cacealma. Cacealmaua s-a întors.`,
  n=>`🤦 ${n} A pus un rezultat de carte. Cartea era greșită.`,
  n=>`🤦 ${n} A fost sigur pe el. Siguranța nu a fost suficientă.`,
  n=>`🤦 ${n} A avut un plan bun. Fotbalul a avut altul, mai bun.`,
  n=>`🤦 ${n} A nimerit totul în afară de ce conta.`,
  n=>`🤦 ${n} A pariat cu cap limpede. Capul limpede a greșit clar.`,
  n=>`🤦 ${n} A pus o predicție de campion. Rezultatul a fost de amator.`,
  n=>`🤦 ${n} A avut emoție. Emoția nu compensează scorul.`,
  n=>`🤦 ${n} A studiat echipele. Echipele nu l-au studiat pe el.`,
  n=>`🤦 ${n} A avut o revelație. Revelația a venit prea târziu.`,
  n=>`🤦 ${n} A pus tot ce avea în predicție. N-a fost suficient.`,
  n=>`🤦 ${n} A jucat pe inimă. Inima n-are tabel de puncte.`,
  n=>`🤦 ${n} A nimerit forma zilei. Nu și pe a meciului.`,
  n=>`🤦 ${n} A avut curaj să prezică altceva. Curajul l-a costat.`,
  n=>`🤦 ${n} A vrut originalitate. A obținut zero originalitate utilă.`,
  n=>`🤦 ${n} A pus un scor sigur. Siguranța s-a dovedit relativă.`,
  n=>`🤦 ${n} A avut argumente solide. Meciul n-a vrut să discute.`,
  n=>`🤦 ${n} A citit printre rânduri. Meciul nu avea rânduri.`,
  n=>`🤦 ${n} A pus tot calculul în el. Calculul a rămas teoretic.`,
  n=>`🤦 ${n} A vrut să fie altfel. A fost doar greșit.`,
  n=>`🤦 ${n} A încercat varianta sigură. Siguranța s-a clătinat.`,
  n=>`🤦 ${n} A avut o presimțire tare. Tare greșită.`,
  n=>`🤦 ${n} A jucat predicția defensiv. Defensiv n-a apărat punctele.`,
  n=>`🤦 ${n} A nimerit numărul de goluri. Restul, deloc.`,
  n=>`🤦 ${n} A pus scorul perfect. Pentru meciul din mintea lui.`,
  n=>`🤦 ${n} A avut încredere oarbă. Oarba s-a confirmat.`,
  n=>`🤦 ${n} A văzut un meci tactic. Tactica n-a existat.`,
  n=>`🤦 ${n} A pus o cifră bună. La loterie, nu la fotbal.`,
  n=>`🤦 ${n} A jucat-o filosofic. Filosofia nu se punctează.`,
  n=>`🤦 ${n} A avut o presupunere onestă. Onestitatea n-a fost de ajuns.`,
  n=>`🤦 ${n} A pus rezultatul ca pe o certitudine. Certitudinea s-a clătinat.`,
  n=>`🤦 ${n} A nimerit ce nu trebuia să nimerească.`,
  n=>`🤦 ${n} A studiat totul cu seriozitate. Seriozitatea n-a marcat.`,
  n=>`🤦 ${n} A jucat-o cu calm. Calmul nu schimbă rezultatul.`,
  n=>`🤦 ${n} A pus o predicție de manual. Manualul era depășit.`,
  n=>`🤦 ${n} A avut o teorie elegantă. Elegantă și greșită.`,
  n=>`🤦 ${n} A vrut să demonstreze ceva. A demonstrat doar contrariul.`,
  n=>`🤦 ${n} A pus tot ce știa despre fotbal. N-a fost de ajuns azi.`,
  n=>`🤦 ${n} A nimerit echipa câștigătoare. Scorul, nu.`,
  n=>`🤦 ${n} A avut o intuiție. Intuiția a luat o pauză.`,
  n=>`🤦 ${n} A pus un calcul matematic. Fotbalul nu face matematică.`,
  n=>`🤦 ${n} A jucat predicția cu emoție. Emoția nu se transformă în puncte.`,
  n=>`🤦 ${n} A avut o presupunere logică. Logica n-a fost de partea lui.`,
  n=>`🤦 ${n} A nimerit absolut nimic relevant.`,
  n=>`🤦 ${n} A pus tot sufletul lui în acel scor. Scorul a refuzat sufletul.`,
  n=>`🤦 ${n} A avut o presimțire grea. Greșit de grea.`,
  n=>`🤦 ${n} A jucat-o pe ghicit. Ghicitul a ghicit greșit.`,
  n=>`🤦 ${n} A pus o predicție bine intenționată. Intenția nu se punctează.`,
  n=>`🤦 ${n} A văzut meciul în avans. Avansul a fost spre direcția greșită.`,
  n=>`🤦 ${n} A avut o strategie de campion. Rezultatul, de amator total.`,
  n=>`🤦 ${n} A pus tot calculul corect. Concluzia, total greșită.`,
  n=>`🤦 ${n} A nimerit doar starea de spirit a etapei.`,
  n=>`🤦 ${n} A avut încredere în experiență. Experiența l-a dezamăgit azi.`,
  n=>`🤦 ${n} A pus predicția cu zâmbet. Zâmbetul s-a stins rapid.`,
  n=>`🤦 ${n} A jucat-o riscant. Riscul n-a plătit deloc.`,
  (n,m)=>`🤦 ${n} a citit ${m} perfect. Problema e că era alt meci.`,
  (n,m)=>`🤦 ${n} a avut dreptate despre ${m} până a început partida.`,
  (n,m)=>`🤦 Predicția lui ${n} la ${m} era bună. Fotbalul n-a colaborat.`,
  (n,m)=>`🤦 ${n} a văzut mingea la ${m}. Scorul l-a evitat.`,
  (n,m)=>`🤦 ${n} a avut tactică pentru ${m}. Mingea avea alte planuri.`,
  (n,m)=>`🤦 ${n} n-a greșit mult la ${m}. Doar rezultatul.`,
  (n,m)=>`🤦 ${n} a fost aproape de adevăr la ${m}. Adevărul n-a fost aproape de el.`,
  (n,m)=>`🤦 ${n} a intrat în ${m} cu idei și a ieșit cu explicații.`,
  (n,m)=>`🤦 Scorul lui ${n} la ${m} era bun. Pentru alt sport.`,
  (n,m)=>`🤦 ${n} a jucat ofensiv predicția la ${m}. Punctele s-au apărat bine.`,
  (n,m)=>`🤦 ${n} a pus scorul la ${m} cu cap. Capul era în concediu.`,
  (n,m)=>`🤦 ${n} a nimerit ziua lui ${m}. N-a nimerit meciul.`,
  (n,m)=>`🤦 ${n} a avut o teorie despre ${m}. Meciul a avut alta.`,
  (n,m)=>`🤦 ${n} a mizat pe instinct la ${m}. Instinctul a mizat pe altceva.`,
  (n,m)=>`🤦 ${n} a pus un scor onest la ${m}. Onestitatea nu se punctează.`,
  (n,m)=>`🤦 ${n} a calculat totul la ${m}. A omis fotbalul.`,
  (n,m)=>`🤦 ${n} a pariat pe logică la ${m}. Meciul n-a citit regulamentul.`,
  (n,m)=>`🤦 ${n} a pus scorul exact invers la ${m}. Talent special.`,
  (n,m)=>`🤦 ${n} a jucat-o pe sigur la ${m}. Siguranța l-a dezamăgit.`,
  (n,m)=>`🤦 ${n} a vrut să surprindă la ${m}. A surprins doar pe el.`,
  (n,m)=>`🤦 ${n} a avut o strategie solidă pentru ${m}. Solidă pentru altceva.`,
  (n,m)=>`🤦 ${n} s-a încrezut în statistici la ${m}. Statisticile l-au lăsat singur.`,
  (n,m)=>`🤦 ${n} a nimerit echipele la ${m}. Restul, mai puțin.`,
  (n,m)=>`🤦 ${n} a avut o idee fixă despre ${m}. Ideea n-a fost și a meciului.`,
  (n,m)=>`🤦 ${n} a încercat o lovitură de geniu la ${m}. A nimerit doar lovitura.`,
  (n,m)=>`🤦 Era convins ${n} că știe ${m}. Meciul nu l-a recunoscut.`,
  (n,m)=>`🤦 ${n} a văzut un ${m} frumos. Doar că în mintea lui.`,
  (n,m)=>`🤦 ${n} a jucat-o la cacealma la ${m}. Cacealmaua s-a întors.`,
  (n,m)=>`🤦 ${n} a pus un rezultat de carte la ${m}. Cartea era greșită.`,
  (n,m)=>`🤦 ${n} a avut un plan bun pentru ${m}. Fotbalul a avut altul, mai bun.`,
  (n,m)=>`🤦 ${n} a nimerit totul la ${m} în afară de ce conta.`,
  (n,m)=>`🤦 ${n} a pus o predicție de campion la ${m}. Rezultatul a fost de amator.`,
  (n,m)=>`🤦 ${n} a studiat echipele de la ${m}. Echipele nu l-au studiat pe el.`,
  (n,m)=>`🤦 ${n} a pus tot ce avea în predicția de la ${m}. N-a fost suficient.`,
  (n,m)=>`🤦 ${n} a nimerit forma zilei la ${m}. Nu și pe a meciului.`,
  (n,m)=>`🤦 ${n} a vrut originalitate la ${m}. A obținut zero originalitate utilă.`,
  (n,m)=>`🤦 ${n} a avut argumente solide pentru ${m}. Meciul n-a vrut să discute.`,
  (n,m)=>`🤦 ${n} a pus tot calculul în ${m}. Calculul a rămas teoretic.`,
  (n,m)=>`🤦 ${n} a încercat varianta sigură la ${m}. Siguranța s-a clătinat.`,
  (n,m)=>`🤦 ${n} a jucat predicția de la ${m} defensiv. Defensiv n-a apărat punctele.`,
  (n,m)=>`🤦 ${n} a nimerit numărul de goluri la ${m}. Restul, deloc.`,
  (n,m)=>`🤦 ${n} a pus scorul perfect la ${m}. Pentru meciul din mintea lui.`,
  (n,m)=>`🤦 ${n} a văzut un ${m} tactic. Tactica n-a existat.`,
  (n,m)=>`🤦 ${n} a jucat-o filosofic la ${m}. Filosofia nu se punctează.`,
  (n,m)=>`🤦 ${n} a pus rezultatul de la ${m} ca pe o certitudine. Certitudinea s-a clătinat.`,
  (n,m)=>`🤦 ${n} a studiat ${m} cu seriozitate. Seriozitatea n-a marcat.`,
  (n,m)=>`🤦 ${n} a pus o predicție de manual la ${m}. Manualul era depășit.`,
  (n,m)=>`🤦 ${n} a avut o teorie elegantă despre ${m}. Elegantă și greșită.`,
  (n,m)=>`🤦 ${n} a pus tot ce știa despre fotbal în ${m}. N-a fost de ajuns azi.`,
  (n,m)=>`🤦 ${n} a nimerit echipa câștigătoare la ${m}. Scorul, nu.`,
  (n,m)=>`🤦 ${n} a pus un calcul matematic la ${m}. Fotbalul nu face matematică.`,
];

const T_EXACT=[
  n=>`🎯 ${n} A pus scorul și tabela s-a conformat.`,
  n=>`🎯 ${n} A văzut golurile înainte să le vadă portarul.`,
  n=>`🎯 ${n} A avut dreptate fără să exagereze. Rar.`,
  n=>`🎯 ${n} A zis 2-1 și 2-1 s-a făcut.`,
  n=>`🎯 ${n} Care era în fața porții, s-a înscris.`,
  n=>`🎯 ${n} A dat cu predicția în vinclu.`,
  n=>`🎯 ${n} A pus scorul și a plecat. Restul a rezolvat fotbalul.`,
  n=>`🎯 ${n} A citit meciul ca pe foaia de examen.`,
  n=>`🎯 ${n} A avut mai multă dreptate decât era nevoie.`,
  n=>`🎯 ${n} A nimerit. Restul au avut păreri.`,
  n=>`🎯 ${n} A pus rezultatul înainte să-l afle tabela.`,
  n=>`🎯 ${n} A văzut finalul înainte să înceapă filmul.`,
  n=>`🎯 ${n} La el mingea ascultă.`,
  n=>`🎯 ${n} A avut inspirație cât pentru două etape.`,
  n=>`🎯 ${n} A zis cât se termină și fotbalul n-a comentat.`,
  n=>`🎯 ${n} A pus scorul de parcă l-ar fi citit pe foaia de arbitraj.`,
  n=>`🎯 ${n} A nimerit exact, fără emoții vizibile.`,
  n=>`🎯 ${n} A scris rezultatul înainte ca mingea să se rotunjească bine.`,
  n=>`🎯 ${n} A avut o zi în care fotbalul l-a ascultat pe el.`,
  n=>`🎯 ${n} Predicția lui n-a fost noroc. A fost decizie.`,
  n=>`🎯 ${n} A pus scorul ca un om care a mai văzut filmul ăsta.`,
  n=>`🎯 ${n} A nimerit fără să clipească.`,
  n=>`🎯 ${n} A avut o privire care vede dincolo de fluierul de start.`,
  n=>`🎯 ${n} A scris rezultatul cu mâna sigură.`,
  n=>`🎯 ${n} A pus exact cifrele care urmau să apară.`,
  n=>`🎯 ${n} A nimerit ca un om care a calculat, nu care a ghicit.`,
  n=>`🎯 ${n} A avut o zi de glorie cât o etapă întreagă.`,
  n=>`🎯 ${n} A pus scorul. Fotbalul a confirmat fără replică.`,
  n=>`🎯 ${n} A nimerit cu o încredere care acum pare justificată.`,
  n=>`🎯 ${n} A zis scorul cu seriozitate. Seriozitatea a avut dreptate.`,
  n=>`🎯 ${n} A pus exact numărul de goluri care urma să cadă.`,
  n=>`🎯 ${n} A văzut meciul cu o claritate suspectă.`,
  n=>`🎯 ${n} A nimerit fără emoție, ca un profesionist.`,
  n=>`🎯 ${n} A pus rezultatul direct, fără variante de rezervă.`,
  n=>`🎯 ${n} A avut o zi în care a citit fotbalul ca pe carte.`,
  n=>`🎯 ${n} A nimerit scorul cu o precizie care pune întrebări.`,
  n=>`🎯 ${n} A pus cifrele exacte fără să tremure.`,
  n=>`🎯 ${n} A avut o intuiție care s-a transformat în certitudine.`,
  n=>`🎯 ${n} A zis scorul fără să se gândească de două ori. A avut dreptate din prima.`,
  n=>`🎯 ${n} A pus rezultatul ca pe ceva deja întâmplat.`,
  n=>`🎯 ${n} A nimerit cu o calmitate care arată experiență.`,
  n=>`🎯 ${n} A văzut tabela goală și a completat-o corect din cap.`,
  n=>`🎯 ${n} A pus scorul exact, fără variante alternative pregătite.`,
  n=>`🎯 ${n} A avut o zi în care orice predicție părea ușoară.`,
  n=>`🎯 ${n} A nimerit fără să caute scuze pentru asta.`,
  n=>`🎯 ${n} A pus rezultatul fără să se uite la cotele de pariu.`,
  n=>`🎯 ${n} A văzut meciul cu ochii unui om care știa deja finalul.`,
  n=>`🎯 ${n} A nimerit clar, fără ambiguități în predicție.`,
  n=>`🎯 ${n} A pus scorul corect dintr-o singură încercare.`,
  n=>`🎯 ${n} A avut o seară perfectă pentru predicții.`,
  n=>`🎯 ${n} A zis exact ce avea să se întâmple, fără ezitare.`,
  (n,m)=>`🎯 ${n} a pus scorul la ${m} și tabela s-a conformat.`,
  (n,m)=>`🎯 ${n} a văzut golurile de la ${m} înainte să le vadă portarul.`,
  (n,m)=>`🎯 ${n} a zis scorul exact la ${m}. Tabela n-a comentat.`,
  (n,m)=>`🎯 Care era în fața porții la ${m}, s-a înscris pentru ${n}.`,
  (n,m)=>`🎯 ${n} a dat cu predicția în vinclu la ${m}.`,
  (n,m)=>`🎯 ${n} a pus scorul de la ${m} și a plecat. Restul a rezolvat fotbalul.`,
  (n,m)=>`🎯 ${n} a citit ${m} ca pe foaia de examen.`,
  (n,m)=>`🎯 ${n} a nimerit ${m}. Restul au avut păreri.`,
  (n,m)=>`🎯 ${n} a pus rezultatul de la ${m} înainte să-l afle tabela.`,
  (n,m)=>`🎯 ${n} a văzut finalul lui ${m} înainte să înceapă filmul.`,
  (n,m)=>`🎯 La ${m}, mingea l-a ascultat pe ${n}.`,
  (n,m)=>`🎯 ${n} a avut inspirație cât pentru toată etapa la ${m}.`,
  (n,m)=>`🎯 ${n} a zis cât se termină ${m} și fotbalul n-a comentat.`,
  (n,m)=>`🎯 ${n} a nimerit ${m} fără să clipească.`,
  (n,m)=>`🎯 ${n} a scris rezultatul de la ${m} cu mâna sigură.`,
  (n,m)=>`🎯 ${n} a pus exact cifrele care au apărut la ${m}.`,
  (n,m)=>`🎯 ${n} a avut o zi de glorie la ${m}.`,
  (n,m)=>`🎯 ${n} a pus scorul la ${m}. Fotbalul a confirmat fără replică.`,
  (n,m)=>`🎯 ${n} a zis scorul de la ${m} cu seriozitate. Seriozitatea a avut dreptate.`,
  (n,m)=>`🎯 ${n} a văzut ${m} cu o claritate suspectă.`,
  (n,m)=>`🎯 ${n} a pus rezultatul de la ${m} direct, fără variante de rezervă.`,
  (n,m)=>`🎯 ${n} a citit ${m} ca pe carte.`,
  (n,m)=>`🎯 ${n} a pus cifrele exacte la ${m} fără să tremure.`,
  (n,m)=>`🎯 ${n} a zis scorul de la ${m} fără să se gândească de două ori. A avut dreptate din prima.`,
  (n,m)=>`🎯 ${n} a pus rezultatul de la ${m} ca pe ceva deja întâmplat.`,
  (n,m)=>`🎯 ${n} a văzut tabela goală la ${m} și a completat-o corect din cap.`,
  (n,m)=>`🎯 ${n} a pus scorul exact la ${m}, fără variante alternative pregătite.`,
  (n,m)=>`🎯 ${n} a nimerit ${m} fără să caute scuze pentru asta.`,
  (n,m)=>`🎯 ${n} a văzut ${m} cu ochii unui om care știa deja finalul.`,
  (n,m)=>`🎯 ${n} a pus scorul corect la ${m} dintr-o singură încercare.`,
  (n,m)=>`🎯 ${n} a zis exact ce avea să se întâmple la ${m}, fără ezitare.`,
  (n,m)=>`🎯 ${n} a nimerit ${m} ca un om care a calculat, nu care a ghicit.`,
  (n,m)=>`🎯 ${n} la ${m}: scorul exact, fără emoții vizibile.`,
  (n,m)=>`🎯 ${n} a citit ${m} înainte ca mingea să se rotunjească bine.`,
  (n,m)=>`🎯 ${n} a avut o zi în care fotbalul l-a ascultat la ${m}.`,
];

const T_UP_BIG=[
  (n,d,r)=>`📈 ${n} a sărit ${d} locuri într-o etapă. Pe locul ${r} acum - cineva să-i verifice motorul.`,
  (n,d,r)=>`📈 ${n} a urcat ${d} poziții dintr-un foc. Locul ${r}. Restul încă procesează ce s-a întâmplat.`,
  (n,d,r)=>`📈 ${d} locuri într-o etapă pentru ${n}. Pe ${r} acum. Ăsta nu e progres, e teleportare.`,
  (n,d,r)=>`📈 ${n} a recuperat ${d} poziții. Locul ${r}. Cine a pariat contra lui, regretă acum.`,
];
const T_UP_SMALL=[
  (n,d,r)=>`📈 ${n} a urcat ${d} ${d===1?'loc':'locuri'}. Pe ${r} acum, pas cu pas, fără explozii.`,
  (n,d,r)=>`📈 ${n}: +${d} ${d===1?'poziție':'poziții'}, pe ${r}. Mic, dar contează.`,
];
const T_DOWN_BIG=[
  (n,d,r)=>`📉 ${n} a căzut ${d} locuri într-o etapă. Pe ${r} acum. De la lift direct pe scări, fără opriri.`,
  (n,d,r)=>`📉 ${d} poziții pierdute pentru ${n}. Pe ${r}. Asta nu e cădere, e prăbușire controlată.`,
  (n,d,r)=>`📉 ${n} a coborât ${d} locuri dintr-o mișcare. Pe ${r}. Clasamentul nu glumește azi.`,
];
const T_DOWN_SMALL=[
  (n,d,r)=>`📉 ${n} a pierdut ${d} ${d===1?'loc':'locuri'}. Pe ${r} acum, fără dramă mare.`,
  (n,d,r)=>`📉 ${n}: -${d} ${d===1?'poziție':'poziții'}, pe ${r}. Se recuperează la următoarea etapă.`,
];
const T_UP=[
  n=>`📈 Clasamentul l-a găsit pe ${n} mai sus decât îl lăsase.`,
  n=>`📈 ${n} a urcat fără să ceară voie.`,
  n=>`📈 Podiumul începe să scârțâie sub ${n}.`,
  n=>`📈 ${n} a luat clasamentul pe persoană fizică.`,
  n=>`📈 ${n} a venit din spate ca fundașul la corner.`,
  n=>`📈 Clasamentul a clipit și l-a găsit pe ${n} mai sus.`,
  n=>`📈 ${n} a schimbat etajul fără să folosească liftul.`,
  n=>`📈 ${n} a urcat atât de repede încât punctele au rămas în urmă.`,
  n=>`📈 ${n} a trecut pe lângă restul fără să se uite înapoi.`,
  n=>`📈 ${n} a urcat ca un om care știa drumul.`,
  n=>`📈 Restul se uită la ${n} cum se uită la o factură mare.`,
  n=>`📈 ${n} a luat-o la pas constant. Pasul lui a depășit clasamentul.`,
  n=>`📈 ${n} a apărut mai sus și nimeni n-a auzit pașii.`,
  n=>`📈 ${n} a sărit etape fără permis de trecere.`,
  n=>`📈 Locul lui ${n} s-a schimbat înainte ca restul să observe.`,
  n=>`📈 ${n} a urcat ca un om care nu mai are nimic de pierdut.`,
  n=>`📈 ${n} a trecut peste clasament fără să încetinească.`,
  n=>`📈 Nimeni n-a văzut venind urcarea lui ${n}.`,
  n=>`📈 ${n} a luat-o pe scurtătură și a ajuns primul acolo.`,
  n=>`📈 ${n} a avansat. Restul recalculează din mers.`,
  n=>`📈 ${n} a urcat constant, fără explozii și fără scuze.`,
  n=>`📈 Clasamentul i-a dat dreptate lui ${n} mai sus decât se aștepta.`,
  n=>`📈 ${n} a împins clasamentul din spate ca un val mic dar sigur.`,
  n=>`📈 ${n} a urcat fără să anunțe presa.`,
  n=>`📈 ${n} a luat poziții fără să cheltuiască vorbe.`,
  n=>`📈 ${n} și-a făcut loc sus fără coate, doar cu puncte.`,
  n=>`📈 Locul lui ${n} s-a schimbat discret, dar definitiv.`,
  n=>`📈 ${n} a urcat treaptă cu treaptă, fără viteză, dar sigur.`,
  n=>`📈 ${n} a apărut mai sus de parcă fusese acolo tot timpul.`,
  n=>`📈 ${n} și-a câștigat etajul ăsta cinstit.`,
];

const T_DOWN=[
  n=>`📉 ${n} a coborât fără să-l întrebe nimeni.`,
  n=>`📉 Clasamentul l-a lăsat pe ${n} mai jos decât se aștepta.`,
  n=>`📉 ${n} a alunecat în liniște, fără explicații publice.`,
  n=>`📉 ${n} a pierdut etaje fără să folosească scările.`,
  n=>`📉 ${n} s-a dus în jos exact când nu era nevoie.`,
  n=>`📉 Podiumul a renunțat la ${n} fără ceremonie.`,
  n=>`📉 ${n} a coborât. Tabela nu a comentat, doar a notat.`,
  n=>`📉 ${n} a pierdut teren ca un om care nu se grăbește spre nicăieri.`,
  n=>`📉 ${n} s-a oprit din urcat exact unde era mai rău.`,
  n=>`📉 ${n} a căzut câteva trepte fără să se vadă cauza.`,
  n=>`📉 ${n} s-a dus mai jos. Liftul era ocupat de alții.`,
  n=>`📉 ${n} a alunecat pe propria predicție.`,
  n=>`📉 Clasamentul nu l-a iertat pe ${n}, doar l-a mutat.`,
  n=>`📉 ${n} s-a dus în spate fără să anunțe.`,
  n=>`📉 ${n} a pierdut poziții ca cineva care nu mai are spațiu de coborât.`,
  n=>`📉 ${n} a coborât fără tam-tam.`,
  n=>`📉 ${n} a pierdut un etaj important fără să observe imediat.`,
  n=>`📉 ${n} s-a oprit din avans exact când era nevoie de el.`,
  n=>`📉 Coborârea lui ${n} a fost lină, dar reală.`,
  n=>`📉 ${n} a căzut câteva poziții, fără explicații cerute.`,
  n=>`📉 ${n} a mers înapoi tăcut, ca un om care știe ce-a greșit.`,
  n=>`📉 ${n} s-a oprit la jumătatea drumului spre vârf.`,
  n=>`📉 ${n} a pierdut un loc bun fără luptă vizibilă.`,
  n=>`📉 ${n} și-a văzut etajul scăzând fără să ridice o vorbă.`,
  n=>`📉 ${n} a coborât pas cu pas, fără scuze publice.`,
];

const T_LEAD_HUGE=[
  (n,g)=>`👑 ${n} a luat tronul. La ${g} puncte avans, nu-l mai prinzi nici cu trenul din China.`,
  (n,g)=>`👑 ${n} conduce cu ${g} puncte. Restul aleargă, el deja s-a întors din vacanță.`,
  (n,g)=>`👑 ${n} e lider cu ${g} puncte diferență. Asta nu e cursă, e monolog.`,
  (n,g)=>`👑 ${n} a fugit cu ${g} puncte avans. Următorul concurs e cine ajunge al doilea.`,
  (n,g)=>`👑 ${n} pe primul loc, ${g} puncte distanță. Trimite-i o vedere, nu-l ajungi din alergat.`,
  (n,g)=>`👑 ${n} conduce cu ${g} puncte. La diferența asta, mai degrabă schimbă liga decât locul.`,
];
const T_LEAD_CLOSE=[
  (n,g)=>`👑 ${n} a luat tronul, dar la doar ${g} puncte. Coroana e fierbinte, nu calmă.`,
  (n,g)=>`👑 ${n} e lider cu ${g} puncte. Un meci prost și pierde și parola de la tron.`,
  (n,g)=>`👑 ${n} conduce cu ${g} puncte diferență. Asta nu e avans, e împrumut pe credit.`,
  (n,g)=>`👑 ${n} a urcat în vârf, dar ${g} puncte nu-i siguranță, e doar avans temporar.`,
  (n,g)=>`👑 ${n} pe primul loc cu ${g} puncte. La cât e de strâns, se poate schimba la fluierul ăsta.`,
];
const T_LEAD=[
  n=>`👑 Liderul respiră. ${n} suflă în ceafă.`,
  n=>`👑 Locul 1 nu mai e liber. Nici liniștit.`,
  n=>`👑 ${n} a luat tronul fără să bată la ușă.`,
  n=>`👑 ${n} stă sus și nu pare grăbit să plece.`,
  n=>`👑 ${n} conduce clasamentul ca pe propria gospodărie.`,
  n=>`👑 ${n} a ajuns sus și restul se uită întrebător.`,
  n=>`👑 ${n} a luat locul 1 fără ceremonie. Doar puncte.`,
  n=>`👑 ${n} a urcat pe tron fără să bată din palme.`,
  n=>`👑 ${n} stă în vârf și se uită calm la restul.`,
  n=>`👑 Tronul are alt nume azi: ${n}.`,
  n=>`👑 ${n} a ajuns lider fără anunț prealabil.`,
  n=>`👑 ${n} domină clasamentul de parcă l-ar fi construit el.`,
];


const T_GAPCHASE=[
  (a,b)=>`⚔️ Diferența dintre ${a} și ${b} e atât de mică încât și fluierul arbitrului ar putea-o schimba.`,
  (a,b)=>`⚔️ ${a} și ${b} stau atât de aproape încât se calcă pe ghete.`,
  (a,b)=>`⚔️ Între ${a} și ${b} e mai puțin loc decât pe banca de rezerve.`,
  (a,b)=>`⚔️ ${a} fuge, ${b} aleargă degeaba în urmă.`,
  (a,b)=>`⚔️ ${a} a extins distanța. ${b} încă măsoară.`,
  (a,b)=>`⚔️ Diferența dintre ${a} și ${b} e mai mică decât o eroare de calcul.`,
  (a,b)=>`⚔️ ${a} și ${b} sunt atât de apropiați încât pare nedrept pentru amândoi.`,
  (a,b)=>`⚔️ Distanța dintre ${a} și ${b} se poate șterge cu un singur meci bun.`,
];

const T_EXACT_MULTI=[
  (names,m)=>`🎯 ${names} au nimerit ${m} din prima. Talent dublu sau au vorbit — oricum, puncte.`,
  (names,m)=>`🎯 ${names}: scor exact la ${m} pentru fiecare. Etapa asta a avut profeți.`,
  (names,m)=>`🎯 ${names} au pus aceeași cifră exactă la ${m}. Cineva din grup știe fotbal.`,
  (names,m)=>`🎯 ${names} au văzut ${m} înainte să se joace. Restul grupului, doar după.`,
  (names,m)=>`🎯 La ${m}, ${names} au lovit exact. Felicitări, invidie sănătoasă din rest.`,
  (names,m)=>`🎯 ${names} — scor exact la ${m}. Fie au calculat, fie au ghicit divin.`,
];

// ── MANELE — aprobate, fără autor în text ─────────────────────────────────────
const T_MAN_EXACT=[
  n=>`🎤 ${n}: "Am norocul scris în frunte" — e norocul lui.`,
  n=>`🎤 ${n}: "Talent ca la 50 Cent" — a zis, și a nimerit exact.`,
  n=>`🎤 ${n}: "Am noroc în toate" — a zis, și chiar a nimerit tot.`,
  n=>`🎤 ${n}: "Sus paharul" — meritat, după scorul exact.`,
  n=>`🎤 ${n}: "A venit și ziua mea" — în sfârșit a nimerit.`,
];
const T_MAN_ZERO=[
  n=>`🎤 ${n}: "Supărat, supărat sunt, doamne, iarăși supărat."`,
  n=>`🎤 ${n}: "Of, viața mea" — după un meci ratat.`,
  n=>`🎤 ${n}: "Orice om greșește" — a zis, după 0 puncte la rând.`,
  n=>`🎤 ${n}: "Stau la geam plângând, poate astăzi ai să vii" — tot speră.`,
  n=>`🎤 ${n}: "De-aș avea cât am pierdut" — la puncte, nu la bani.`,
  n=>`🎤 ${n}: "Stau în noapte și-mi blestem amarul, plouă și mi-e dor."`,
];
const T_MAN_LEAD=[
  n=>`🎤 ${n}: "Lumea vorbește de mine" — a zis, când a ajuns lider.`,
  n=>`🎤 ${n}: "Sunt pe primul loc în top" — și chiar e.`,
  n=>`🎤 ${n}: "Cu banii îmi place să mă joc, eu sunt pe primul loc."`,
  n=>`🎤 ${n}: "Eee, aaa, văd mai bine lumea, de pe Burj Khalifa."`,
  n=>`🎤 ${n}: "Când vă văd m-apucă mila, că nu vă duce bila, nu sunteți buni de nimica."`,
  n=>`🎤 ${n}: "Fake-urile astea mă invidiază, Adidașii mei Gucci nu se demodează."`,
  n=>`🎤 ${n}: "Cât mă poți plăti să-ți dau mintea mea o zi, să poți să produci bani mulți zi de zi."`,
  n=>`🎤 ${n}: "Ce mor dușmanii mei, că n-au valoarea mea și nici puterea mea."`,
  n=>`🎤 ${n}: "Dușmanii mei n-au valoare nici cât e bocul de sare."`,
  n=>`🎤 ${n}: "Nu stați în fața la boss."`,
];
const T_MAN_RISE=[
  n=>`🎤 ${n}: "Uită-te la asta man, zici că e aeroplan, avion american" — +locuri într-o etapă.`,
  n=>`🎤 ${n}: "Am plecat de jos, am ajuns pe tron."`,
  n=>`🎤 ${n}: "Greu m-am ridicat" — dar a ajuns sus, în cele din urmă.`,
];
const T_MAN_FALL=[
  n=>`🎤 ${n}: "Ce a fost nu va mai fi" — tronul are alt nume acum.`,
  n=>`🎤 ${n}: "S-a rupt lanțul de iubire, și-a început a rugini" — depășit pe ultima sută.`,
  n=>`🎤 ${n}: "Aș face orice să te mai pot avea, chiar dacă ești acum cu altcineva."`,
];
const T_MAN_LAST=[
  n=>`🎤 ${n}: "Supărat, supărat sunt, doamne, iarăși supărat."`,
  n=>`🎤 ${n}: "Stau în noapte și-mi blestem amarul, plouă și mi-e dor."`,
  n=>`🎤 ${n}: "De-aș avea cât am pierdut."`,
];
const T_MAN_PASSED=[
  (a,b)=>`🎤 ${a}: "Fără tine nu pot sta" — i-a zis lui ${b}, care l-a depășit cu un singur punct.`,
];
const T_MAN_DRAW=[
  n=>`🎤 ${n} a pus egal: "Să iubești două femei, să nu știi pe care o vrei."`,
];
const T_MAN_EQUAL=[
  (a,b)=>`🎤 ${a} și ${b}: "Baby împarte totul cu mine, haide să ne pierdem în mulțime" — același punctaj după meci.`,
];
const T_MAN_SOLO=[
  n=>`🎤 ${n}: "Am în capul meu doar fantezii, baby" — singurul din grup cu altă predicție.`,
];

// ── CITATE FOTBAL RO — cu context de clasament/predicție ──────────────────────
const T_CITE_EXACT=[
  n=>`📢 ${n} a citit meciul ca un patron care a pus pariu pe el și a și câștigat.`,
  n=>`📢 ${n}: "La bulanu' meu o să dau și gol" — scor exact pe noroc pur.`,
  n=>`📢 Genul de predicție care merită conferință de presă, nu doar puncte. Bravo, ${n}.`,
];
const T_CITE_ZERO=[
  n=>`📢 ${n} a jucat-o stil "pase scurte și pe sus, ai n-ai mingea, tragi la poartă" — n-a intrat.`,
  n=>`📢 ${n}: genul de reacție de "du-te bă la șah, aici era fotbal."`,
  n=>`📢 ${n} a explicat ce-a vrut să facă, exact ca un patron supărat la conferință.`,
  n=>`📢 ${n}: "Putea fi și mai bine" — spus după o predicție ratată total.`,
];
const T_CITE_LEAD=[
  n=>`📢 ${n} joacă pe logica "dacă marcăm un gol la început, putem juca și la 0-0."`,
  n=>`📢 ${n}: "Meritul e 50% al meciului, 50% al formei, dar cel mai mare merit e al meu."`,
];
const T_CITE_RISE=[
  n=>`📢 ${n}: "Muncesc 24 de ore pe zi, iar uneori chiar și noaptea" — și a urcat în clasament.`,
];
const T_CITE_CLOSE=[
  (a,b)=>`📢 Diferența dintre ${a} și ${b}: "Calificarea este și posibilă, și imposibilă."`,
];

// ── CITATE STANDALONE — cu autor, fără context specific ───────────────────────
const T_CITE_STANDALONE=[
  `💬 "Omul este o persoană umană." — Hagi`,
  `💬 "Viața e frumoasă, dar merită trăită." — Hagi`,
  `💬 "Să fie bine, ca să nu fie rău." — Hagi`,
  `💬 "La anul vine un an nou și alt an." — Hagi`,
  `💬 "Eu m-am născut să fiu învingător, nu să exist." — Hagi`,
  `💬 "Copii, mergeți la școală, că și școala e bună la ceva!" — Hagi`,
  `💬 "Din când în când mai aud și ce se aude prin autocar, când vorbesc cu voce tare." — Hagi`,
  `💬 "Matematică, nu, nu zic că am descoperit-o eu. 55 de jucători în 5 ani, deci sunt 10 jucători pe an." — Hagi`,
  `💬 "Nimeni nu s-a născut cel mai bun. Hagi e cel mai bun de când s-a născut." — Hagi`,
  `💬 "Decarul nu poate să poarte decât numărul 10." — Hagi`,
  `💬 "Dacă marcăm un gol la început, pe urmă putem să jucăm și la 0-0." — Becali`,
  `💬 "Becali e un brand. Eu la Avicola Iași pot să fac pui Gigi Becali, dacă vreau." — Becali`,
  `💬 "Dumnezeu e cel mai tare serviciu de informații din lume — știe tot, chiar și-un fir de păr." — Becali`,
  `💬 "Mie nu-mi place să citesc, că-mi lăcrimează ochii, mă dor ochii." — Becali`,
  `💬 "Da cine e domle Nichita Stănescu ăsta? A adus mai mulți bani decât mine în România?" — Becali`,
  `💬 "Dacă îmi dai un deget, îți dau toată mâna. Dacă îmi iei un deget, îți tai mâna." — Becali`,
  `💬 "Dom'le, eu muncesc 24 de ore pe zi, iar uneori chiar și noaptea!" — Mitică Dragomir`,
  `💬 "Am ajuns la o vârstă la care mi-am dat seama că trebuie să fiu cinstit." — Mitică Dragomir`,
  `💬 "Familia e sfântă, pe când patria... cum să vă spun, patria e sacră." — Mitică Dragomir`,
  `💬 "La bulanu' meu o să dau și gol dacă o să mă convoacă!" — Claudiu Răducanu`,
  `💬 "Aș vrea să stau într-un bloc-notes." — Claudiu Răducanu`,
  `💬 "Filosofia este o transcendentală propedeutică pentru sufletul bântuit de moarte al românului." — Cornel Dinu`,
  `💬 "Este incontestabilă fortuirea ca românul să fie un ștrasnic luptător sârb." — Cornel Dinu`,
  `💬 "Muncitor Nicoliță, foarte muncitor, dar terenul de fotbal nu e șantier." — Cornel Dinu`,
  `💬 "Greu să faci vultur dintr-un jucător cu nume de vânat." — Cornel Dinu`,
  `💬 "Putea fi 3-3!" — Ioan Sdrobiș, după un 8-1`,
  `💬 "Suporterii noștri sunt 80% din București și 40% din provincie." — Ionel Dănciulescu`,
  `💬 "Nu mi-e frică, dar mă tem!" — Marin Condescu`,
  `💬 "Singura echipă care poate prinde CFR-ul din urmă este DNA!" — Adrian Porumboiu`,
  `💬 "N-avea cum să-mi rupă Fane capu', am gât flexibil, sunt ca inspectorul Gadget." — Mihai Stoica`,
  `💬 "Dacă ar fi să scoatem primele 30 de minute, cred că am fi putut fi câștigători." — Adi Ilie`,
  `💬 "Focusul trebuie să fie pentru ceea ce e aici. Ceea ce e aici te duce acolo." — Bogdan Lobonț`,
  `💬 "Sunt pesimist. Cred că putem învinge Olanda." — Nicolae Mitea`,
  `💬 "Pase scurte și pe sus, ai n-ai mingea, tragi la poartă!" — Gabi Stan`,
  `💬 "Du-te bă la șah! Du-te la șah!" — Petre Grigoraș`,
  `💬 "La examen mi-a căzut Comuna din Paris, dar le-am spus să-mi schimbe subiectul, că nu prea le am cu geografia." — Rica Răducanu`,
  `💬 "Cred că dacă înscriam mai multe goluri decât ei, câștigam." — Gabi Tamaș`,
];

// ── LIVE FUNNY — mesaje amuzante pentru scor live ─────────────────────────────
const T_LIVE_FUNNY_HOME=[
  (a,b,d,min)=>`🔴 ${a} ${d}–0 ${b} · ${min}' — ${b} mai are ${90-min} minute să-și amintească de ce joacă fotbal.`,
  (a,b,d,min)=>`🔴 ${a} conduce cu ${d} la ${min}'. ${b} recalculează tactica din mers.`,
  (a,b,d,min)=>`🔴 ${a} ${d}-0 la ${min}'. Portarul lui ${b} are o seară lungă.`,
  (a,b,d,min)=>`🔴 ${a} conduce ${d}-0 la ${min}'. ${b} caută un colț de ieșire.`,
];
const T_LIVE_FUNNY_AWAY=[
  (a,b,d,min)=>`🔴 ${b} conduce ${d}-0 la ${min}' pe terenul lui ${a}. Cine a pus victoria gazdei — mai respiră?`,
  (a,b,d,min)=>`🔴 ${a} 0–${d} ${b} · ${min}' — ${a} nu a primit memo-ul înainte de meci.`,
  (a,b,d,min)=>`🔴 ${b} conduce cu ${d} la ${min}'. ${a} încă se uită după un plan B.`,
  (a,b,d,min)=>`🔴 ${b} ${d}-0 ${a} la ${min}'. Oaspeții au venit cu treaba făcută.`,
];
const T_LIVE_FUNNY_DRAW=[
  (a,b,min)=>`🔴 ${a} – ${b}: 0-0 la ${min}'. Fotbalul există, golurile — mai puțin.`,
  (a,b,min)=>`🔴 ${a} 0-0 ${b} · ${min}' — Portarii muncesc. Atacanții, mai puțin.`,
  (a,b,min)=>`🔴 ${a} – ${b}: egal la ${min}'. Cel care a pus 0-0 stă calm și tace.`,
  (a,b,min)=>`🔴 ${a} 0-0 ${b} la ${min}'. Mingea a atins bara de 2 ori și a rămas afară.`,
];


const M_NOSCORE=[
  m=>`⚽ ${m}: N-au avut ocazii în afară de goluri.`,
  m=>`⚽ ${m}: Apărarea a fost impecabilă dacă ignorăm scorul.`,
  m=>`⚽ ${m}: Atacanții au muncit. Portarii au suferit.`,
  m=>`⚽ ${m}: Cartonașele au venit mai des decât ocaziile.`,
  m=>`⚽ ${m}: Fanionul de la corner a avut program prelungit.`,
  m=>`⚽ ${m}: Mingea a circulat. Ideile mai puțin.`,
  m=>`⚽ ${m}: Unii au jucat fotbal. Alții au participat.`,
  m=>`⚽ ${m}: Portarul a fost ocupat. Colegii mai puțin.`,
  m=>`⚽ ${m}: S-a jucat tactic, ceea ce înseamnă: puțin.`,
  m=>`⚽ ${m}: Au avut posesie. N-au avut idei despre ce să facă cu ea.`,
  m=>`⚽ ${m}: Defensiva a fost organizată. Pe hârtie.`,
  m=>`⚽ ${m}: Au alergat mult. Au ajuns puțin.`,
  m=>`⚽ ${m}: Meciul a avut ritm. Ritmul n-a avut sens.`,
  m=>`⚽ ${m}: S-a jucat curat. Prea curat pentru gol.`,
  m=>`⚽ ${m}: Au avut intensitate. Intensitatea n-a marcat.`,
  m=>`⚽ ${m}: Au combinat frumos. Combinația s-a oprit la 30 de metri.`,
  m=>`⚽ ${m}: Echipele au respectat regulamentul mai mult decât tactica.`,
  m=>`⚽ ${m}: Arbitrul a avut treabă. Atacanții, mai puțin.`,
  m=>`⚽ ${m}: S-au luptat pentru fiecare minge. Nu și pentru rezultat.`,
  m=>`⚽ ${m}: Au jucat ca și cum scorul era opțional.`,
];
const M_ZERO=[
  m=>`🥊 ${m}: 0-0. Portarii au muncit, atacanții au meditat.`,
  m=>`🥊 ${m}: 0-0. Cine a pus scor mic a avut cap. Cine a pus spectacol a avut speranță.`,
  m=>`🥊 ${m}: 0-0. S-a jucat fotbal, doar fără final fericit pentru niciunul.`,
  m=>`🥊 ${m}: 0-0. Mingea a fost prezentă. Golul, nu.`,
];
const M_ONE=[
  m=>`⚽ ${m}: 1 gol. Cine l-a prins exact are tot dreptul să nu zică nimic și să zâmbească.`,
  m=>`⚽ ${m}: 1-0 sec. Un gol, o victorie, fără discuții.`,
  m=>`⚽ ${m}: 1 gol și 89 de minute în care nimeni n-a mai vrut să riște nimic.`,
  m=>`⚽ ${m}: un singur moment a contat. Cine l-a văzut venind, a câștigat etapa.`,
  m=>`⚽ ${m}: 1-0. La câte ocazii au fost, scorul putea fi altul. N-a fost.`,
  m=>`⚽ ${m}: un gol a decis totul. Restul, 89 de minute de atmosferă.`,
  m=>`⚽ ${m}: 1 gol. Suficient pentru 3 puncte, suficient pentru o predicție bună.`,
  m=>`⚽ ${m}: 1-0. Mingea a intrat o singură dată. A fost de ajuns.`,
  m=>`⚽ ${m}: scor minimal, emoție maximă.`,
  m=>`⚽ ${m}: un gol a făcut diferența. Restul a fost muncă și transpirat.`,
  m=>`⚽ ${m}: 1-0. Cine a prezis asta a dormit bine în seara aia.`,
  m=>`⚽ ${m}: 1 gol, în minutul potrivit. Fotbalul e uneori simplu de tot.`,
];
const M_MANY=[
  (m,t)=>`⚽ ${m}: ${t} goluri. Apărările au luat o pauză de cafea simultan.`,
  (m,t)=>`⚽ ${m}: ${t} goluri. Cine a mizat pe scor mare a avut o seară bună.`,
  (m,t)=>`⚽ ${m}: ${t} goluri. Defensivele s-au întâlnit la bar, nu pe teren.`,
];
const M_WITHSCORE=[
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Calculul e simplu, predicția mai puțin.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Scorul a fost clar, restul nu prea.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Cine a citit forma a avut noroc azi.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Tabela nu minte, restul interpretează.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Simplu de scris, greu de prezis.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Diferența pe tabelă e mai mică decât diferența pe teren.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Unul a vrut meciul ăsta mai mult. S-a și văzut.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Predicțiile cu scor mic au plâns puțin pe interior.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Cifrele astea spun mai mult decât orice analiză de 90 de minute.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Un rezultat care nu lasă loc de discuții lungi la cafea.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Asta e genul de scor care confirmă ce ziceau toți și nimeni n-a crezut.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Cine a mizat exact pe asta, are dreptul la o seară bună.`,
  (m,sA,sB)=>`⚽ ${m}: ${sA}-${sB}. Diferența de pe teren s-a tradus corect pe hârtie, pentru variație.`,
];
const M_CARDS=[
  (m,c)=>`🟨 ${m}: ${c} cartonașe. Arbitrul a avut meci individual.`,
  (m,c)=>`🟨 ${m}: ${c} cartonașe. Cât pentru un dosar cu șină.`,
  (m,c)=>`🟨 ${m}: ${c} cartonașe. Fotbal pe nervi, regulament invocat des.`,
];
const M_CORNERS=[
  (m,c)=>`🚩 ${m}: ${c} cornere. La câte au fost, fanionul cere primă de joc.`,
  (m,c)=>`🚩 ${m}: ${c} cornere. Mingea a stat la corner de parcă plătea chirie.`,
  (m,c)=>`🚩 ${m}: ${c} cornere. Multe, dar fără folos pentru tabelă.`,
];
const M_SCORER=[
  (m,s)=>`⚽ ${m}: ${s} a deschis drumul. Restul au urmat sau n-au mai prins loc.`,
  (m,s)=>`⚽ ${m}: ${s} a pus prima cărămidă. Casa s-a construit din ea.`,
  (m,s)=>`⚽ ${m}: ${s} a decis ziua, restul au fost detalii.`,
];
// ── MATCH DRAMA — picks from pearl pools, real data, no raw scorer dumps ────
const _matchDrama=(name,sA,sB,hSc,aSc,cards,corners,matchId)=>{
  const t=sA+sB; const items=[];

  if(t>=5)items.push(_p14(M_MANY,name,t,matchId,'g')(name,t));
  else if(t===0)items.push(_p14(M_ZERO,name,matchId,'g')(name));
  else if(t===1)items.push(_p14(M_ONE,name,matchId,'g')(name));
  else if(sA!==sB)items.push(_p14(M_WITHSCORE,name,sA,sB,matchId,'g')(name,sA,sB));
  else items.push(_p14(M_NOSCORE,name,matchId,'g')(name));

  if(hSc||aSc){
    const first=(hSc||aSc||'').split(',')[0].trim();
    items.push(_p14(M_SCORER,name,first,matchId,'sc')(name,first));
  }

  if(cards>=6)items.push(_p14(M_CARDS,name,cards,matchId,'cd')(name,cards));
  if(corners>=10)items.push(_p14(M_CORNERS,name,corners,matchId,'cr')(name,corners));

  return items;
};

export function generateActivityFeed({
  leaderboard=[],prevLeaderboard=[],finishedResults={},
  allPredictions={},allUsers={},matches=[],
}={}) {
  const nickOf=uid=>allUsers[uid]?.nickname||uid;
  const n=leaderboard.length;

  const _pick=(arr,...seeds)=>{
    const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,7));
    return arr[h%arr.length];
  };
  const _call=(arr,seeds,...args)=>{
    const fn=_pick(arr,...seeds);
    return typeof fn==='function'?fn(...args):String(fn);
  };
  const _roll=(...seeds)=>{
    const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,11));
    return (h%100)<45;
  };

  const mpreds=(matchId,match)=>{
    const out=[];
    Object.entries(allPredictions).forEach(([uid,mp])=>{
      const p=mp[matchId]||mp[String(matchId)];if(!p)return;
      const pts=calcPoints(p,match)||0;
      const pA=Number(p.scoreA),pB=Number(p.scoreB);
      const rA=Number(match.realScoreA),rB=Number(match.realScoreB);
      const outcome=rA>rB?'1':rA<rB?'2':'X';
      const pOutcome=pA>pB?'1':pA<pB?'2':'X';
      out.push({uid,nick:nickOf(uid),pts,exact:pA===rA&&pB===rB,
        ok:outcome===pOutcome,outcome,pOutcome,pA,pB});
    });
    return out;
  };

  const todayStart=new Date();todayStart.setHours(0,0,0,0);
  const todayEnd=new Date(todayStart);todayEnd.setDate(todayEnd.getDate()+1);
  const isToday=t=>{const d=new Date(t);return d>=todayStart&&d<todayEnd;};

  const ctxTeams=new Set();
  const finishedMatches=[...matches.filter(m=>m.isFinished)]
    // Sort by finishedAt if available, else by kickoff time — most recently finished first
    .sort((a,b)=>{
      const tA=a.finishedAt?new Date(a.finishedAt):new Date(a.time);
      const tB=b.finishedAt?new Date(b.finishedAt):new Date(b.time);
      return tB-tA;
    });
  const liveMatches=matches.filter(m=>m.isLive);
  const latestFinished=finishedMatches.slice(0,3);
  // FIX 2: next match = soonest upcoming, includes matches starting within 3 hours
  const now3h=Date.now()+3*3600000;
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM14(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];
  const todayOff=matches.filter(m=>_isWCM14(m)&&!m.isFinished&&!m.isLive&&isToday(m.time))
    .sort((a,b)=>new Date(a.time)-new Date(b.time));

  [...liveMatches,...latestFinished,...todayOff].forEach(m=>{
    if(_isWCM14(m)){ctxTeams.add(_n14(m.teamA));ctxTeams.add(_n14(m.teamB));}
  });
  if(nextMatch){ctxTeams.add(_n14(nextMatch.teamA));ctxTeams.add(_n14(nextMatch.teamB));}

  const ctxFact=(team,seed=0)=>{
    const canon=_n14(team);
    if(!_isOff14(team)||!ctxTeams.has(canon))return null;
    const facts=CUR14[canon];if(!facts||!facts.length)return null;
    return _pick(facts,canon,seed);
  };
  // Pentru fallback (completare la 6 curiozități): nu mai verific ctxTeams, doar că echipa e validă
  const anyFact=(team,seed=0)=>{
    const canon=_n14(team);
    const facts=CUR14[canon];if(!facts||!facts.length)return null;
    return _pick(facts,canon,seed);
  };

  // ── Collect curiosities (country facts) for pattern slots ────────────────────
  // Seed includes current hour so facts rotate every hour, not stuck on same one
  const hourSeed=Math.floor(Date.now()/3600000);
  const curiosities=[];
  const usedCurTeams=new Set();
  const addCur=(team,seed)=>{
    const canon=_n14(team);
    if(usedCurTeams.has(canon))return;
    const f=ctxFact(team,seed+hourSeed);
    if(f){curiosities.push({type:'curiosity',text:`🌍 ${f}`});usedCurTeams.add(canon);}
  };
  liveMatches.forEach(m=>{addCur(m.teamA,m.id);addCur(m.teamB,m.id+50);});
  latestFinished.forEach(m=>{addCur(m.teamA,m.id+100);addCur(m.teamB,m.id+150);});
  if(nextMatch){addCur(nextMatch.teamA,nextMatch.id+200);addCur(nextMatch.teamB,nextMatch.id+250);}
  todayOff.slice(0,2).forEach(m=>{addCur(m.teamA,m.id+300);addCur(m.teamB,m.id+350);});
  // FIX: garantez minim 6 curiozități — completez din toate echipele calificate disponibile
  // în CUR14, rotind pe hourSeed, dacă meciurile curente nu oferă suficiente echipe unice
  if(curiosities.length<6){
    const allTeamNames=Object.keys(CUR14);
    const rotatedTeams=[...allTeamNames].sort((a,b)=>{
      const ha=Math.abs((hourSeed+a.length)*31%97);
      const hb=Math.abs((hourSeed+b.length)*31%97);
      return ha-hb;
    });
    for(const team of rotatedTeams){
      if(curiosities.length>=6)break;
      const canon=_n14(team);
      if(usedCurTeams.has(canon))continue;
      const f=anyFact(team,team.length*7+hourSeed);
      if(f){curiosities.push({type:'curiosity',text:`🌍 ${f}`});usedCurTeams.add(canon);}
    }
  }

  // ── Collect standalone quotes for pattern slots ───────────────────────────────
  const standalonePool=T_CITE_STANDALONE.slice();
  const seenStandalone=new Set();
  const nextStandalone=(seed)=>{
    // Rotate based on hourSeed + local seed so different quotes appear each hour
    const startIdx=(hourSeed*7+Math.abs(seed))%standalonePool.length;
    const shifted=standalonePool.slice(startIdx).concat(standalonePool.slice(0,startIdx));
    for(const s of shifted){if(!seenStandalone.has(s)){seenStandalone.add(s);return{type:'quote',text:s};}}
    return{type:'quote',text:shifted[0]};
  };

  // ── Build result array ────────────────────────────────────────────────────────
  const result=[];
  const push=item=>{if(item&&result.length<24)result.push(item);};// allow more, trim at end

  // ── SLOT 1: LIVE cu scor + legătură reală cu predicțiile jucătorilor ─────────
  liveMatches.slice(0,1).forEach(m=>{
    const sA=m.realScoreA??0,sB=m.realScoreB??0;
    const min=m.liveMinute??45;
    const scorersPart=[];
    if(m.homeScorers)scorersPart.push(`⚽ ${m.teamA}: ${m.homeScorers}`);
    if(m.awayScorers)scorersPart.push(`⚽ ${m.teamB}: ${m.awayScorers}`);
    const scorersText=scorersPart.length?` (${scorersPart.join(' · ')})`:'';
    const baseScore=`🔴 ${m.teamA} ${sA}-${sB} ${m.teamB} · ${min}'${scorersText}`;

    // Predicțiile reale făcute pe acest meci
    const preds=Object.entries(allPredictions)
      .filter(([,up])=>up[m.id]||up[String(m.id)])
      .map(([uid,up])=>{const p=up[m.id]||up[String(m.id)];return{nick:nickOf(uid),pA:Number(p.scoreA),pB:Number(p.scoreB)};});

    if(preds.length===0){
      push({type:'live',text:baseScore});return;
    }

    // Cine a nimerit exact scorul curent (live)
    const exactNow=preds.filter(p=>p.pA===sA&&p.pB===sB);
    if(exactNow.length>0){
      const names=exactNow.map(p=>p.nick).join(' și ');
      push({type:'live',text:`${baseScore} — ${names} ${exactNow.length>1?'au':'a'} pus exact scorul ăsta. Pe bune.`});
      return;
    }

    // Cine e cel mai apropiat de scorul curent (distanță minimă)
    const withDist=preds.map(p=>({...p,dist:Math.abs(p.pA-sA)+Math.abs(p.pB-sB)}));
    withDist.sort((a,b)=>a.dist-b.dist);
    const closest=withDist[0];
    if(closest&&closest.dist<=1){
      push({type:'live',text:`${baseScore} — ${closest.nick} a pus ${closest.pA}-${closest.pB}. Aproape, dacă rămâne așa.`});
      return;
    }

    // Câți au pus exact rezultatul curent (1/X/2) chiar dacă nu scorul exact
    const curOutcome=sA>sB?'1':sA<sB?'2':'X';
    const onTrack=preds.filter(p=>{const po=p.pA>p.pB?'1':p.pA<p.pB?'2':'X';return po===curOutcome;});
    if(onTrack.length>0&&onTrack.length<preds.length){
      push({type:'live',text:`${baseScore} — ${onTrack.length} din ${preds.length} sunt pe direcția corectă acum.`});
      return;
    }
    if(onTrack.length===0){
      push({type:'live',text:`${baseScore} — Niciunul din grup nu e pe direcția asta. Toți recalculează.`});
      return;
    }
    push({type:'live',text:baseScore});
  });

  // ── SLOT 2: post despre meciul următor — DOAR dacă e ceva interesant ─────────
  const upcomingForPreds=liveMatches.length>0?liveMatches.slice(0,1):
    (()=>{
      // DOAR meciuri cu predicțiile deja BLOCATE (sub 30 min până la start), nu înainte
      const locked=matches.filter(m=>{
        if(!_isWCM14(m)||m.isFinished||m.isLive)return false;
        const lockState=matchLockState(m);
        return lockState.state==='locked'&&(new Date(m.time)-Date.now())>-15*60000;
      }).sort((a,b)=>new Date(a.time)-new Date(b.time));
      return locked.slice(0,1);
    })();
  upcomingForPreds.forEach(m=>{
    const preds=Object.entries(allPredictions)
      .filter(([,up])=>up[m.id]||up[String(m.id)])
      .map(([uid,up])=>{const p=up[m.id]||up[String(m.id)];return{nick:nickOf(uid),pA:Number(p.scoreA),pB:Number(p.scoreB)};});
    if(preds.length===0)return; // nimic de zis dacă nu s-au pus predicții
    const home=preds.filter(p=>p.pA>p.pB),away=preds.filter(p=>p.pB>p.pA),draw=preds.filter(p=>p.pA===p.pB);
    const mName=`${m.teamA} vs ${m.teamB}`;
    // Conflict interesant: predicții opuse între jucători apropiați în clasament
    if(home.length>0&&away.length>0){
      // Caută conflict între jucători pe locuri apropiate în clasament
      const homeRanks=home.map(p=>{const e=leaderboard.find(l=>l.nickname===p.nick);return e?e.rank:99;});
      const awayRanks=away.map(p=>{const e=leaderboard.find(l=>l.nickname===p.nick);return e?e.rank:99;});
      const closePair=home.find(hp=>{const hr=leaderboard.find(l=>l.nickname===hp.nick);if(!hr)return false;return away.some(ap=>{const ar=leaderboard.find(l=>l.nickname===ap.nick);return ar&&Math.abs(hr.rank-ar.rank)<=2;});});
      if(closePair){
        const closeAway=away.find(ap=>{const ar=leaderboard.find(l=>l.nickname===ap.nick);const hr=leaderboard.find(l=>l.nickname===closePair.nick);return ar&&hr&&Math.abs(ar.rank-hr.rank)<=2;});
        if(closeAway)push({type:'preview_split',text:`⚔️ ${closePair.nick} a pus ${m.teamA}, ${closeAway.nick} a pus ${m.teamB} la ${mName}. Doi rivali de clasament, predicții opuse.`});
        else push({type:'preview_split',text:`⚔️ La ${mName}: ${home.length} pe ${m.teamA}, ${away.length} pe ${m.teamB}${draw.length>0?`, ${draw.length} egal`:''}.`});
      }else{
        push({type:'preview_split',text:`⚔️ La ${mName}: ${home.length} pe ${m.teamA}, ${away.length} pe ${m.teamB}${draw.length>0?`, ${draw.length} egal`:''}.`});
      }
    }else if(draw.length===1&&preds.length>=3){
      // Singurul care a pus egal
      push({type:'preview_solo',text:_call(T_MAN_DRAW,[draw[0].nick,m.id],draw[0].nick)});
    }
    // Dacă toți au pus aceeași echipă — nu postăm nimic, e plictisitor
  });

  // ── Colectez știrile de clasament ca pool, le intercalez mai jos ──────────────
  const lbItems=[];
  const pushLb=item=>{if(item)lbItems.push(item);};

  if(n>=2){
    const L=leaderboard[0],S=leaderboard[1];
    const gap=L&&S?L.points-S.points:0;
    const eLast=leaderboard[n-1];

    // ── SLOT FIX 1: Liderul — MEREU prezent, rotește la fiecare oră ────────────
    const leadText=_roll(L.nickname,hourSeed,'mn-lead-always')
      ?_call(T_MAN_LEAD,[L.nickname,hourSeed,'lead-a'],L.nickname)
      :gap>=100?_call(T_LEAD_HUGE,[L.nickname,gap,hourSeed,'lead-b'],L.nickname,gap)
      :gap>0&&gap<=30?_call(T_LEAD_CLOSE,[L.nickname,gap,hourSeed,'lead-c'],L.nickname,gap)
      :_call(T_LEAD,[L.nickname,hourSeed,'lead-d'],L.nickname);
    pushLb({type:'lead',text:leadText});

    // ── SLOT FIX 2+3: Comparații directe "cine a depășit pe cine" — mereu 2, mereu cu manea/citat ──
    // Construiesc o listă de perechi adiacente în clasament (locul k vs locul k+1), EXCLUZÂND
    // perechea cu liderul (locul 1 vs 2), ca să nu se repete conținutul cu slotul de lider de mai sus.
    const pairs=[];
    for(let i=1;i<n-1;i++){
      const a=leaderboard[i],b=leaderboard[i+1];
      pairs.push({a,b,diff:a.points-b.points,idx:i});
    }
    // Sortez perechile după hourSeed, ca rotația să schimbe care pereche e arătată
    const rotatedPairs=[...pairs].sort((p1,p2)=>{
      const h1=Math.abs((hourSeed+p1.idx)*31%97);
      const h2=Math.abs((hourSeed+p2.idx)*31%97);
      return h1-h2;
    });

    let lbExtraAdded=0;
    for(const pr of rotatedPairs){
      if(lbExtraAdded>=2)break;
      const {a,b,diff}=pr;
      // Verific dacă a existat o schimbare reală de rang față de prevLeaderboard pentru acest jucător
      const prevA=prevLeaderboard.find(p=>p.nickname===a.nickname);
      const realPassed=prevA&&prevA.rank>a.rank;
      let text;
      if(realPassed&&_roll(a.nickname,hourSeed,pr.idx,'mn-passed')){
        text=_call(T_MAN_RISE,[a.nickname,hourSeed,pr.idx,'pass-mn'],a.nickname);
      }else if(_roll(a.nickname,b.nickname,hourSeed,pr.idx,'ci-h2h')){
        text=`📢 ${a.nickname} e cu ${diff} puncte peste ${b.nickname}. ${_call(T_CITE_EXACT,[a.nickname,hourSeed,pr.idx,'h2h-ci'],a.nickname)}`;
      }else if(_roll(b.nickname,a.nickname,hourSeed,pr.idx,'mn-last-h2h')){
        text=`🎤 ${b.nickname} e cu ${diff} puncte sub ${a.nickname}. ${_call(T_MAN_LAST,[b.nickname,hourSeed,pr.idx,'h2h-last'],b.nickname)}`;
      }else{
        text=diff<=20
          ?`⚔️ ${a.nickname} (loc ${a.rank}) și ${b.nickname} (loc ${b.rank}) sunt la ${diff} puncte distanță. Orice etapă poate schimba ordinea.`
          :`📊 ${a.nickname} (loc ${a.rank}) conduce clar peste ${b.nickname} (loc ${b.rank}) — ${diff} puncte diferență.`;
      }
      pushLb({type:'h2h',text});
      lbExtraAdded++;
    }
  }

  // ── PREDICȚII din ultimele 3 meciuri terminate ───────────────────────────────
  const T_UPSET=[
    m=>`⚡ ${m}: nimeni n-a nimerit. Fotbalul a ignorat complet toate predicțiile.`,
    m=>`⚡ ${m}: scor neprezis de nimeni. Ăsta e fotbalul — îți spune că nu știi nimic.`,
    m=>`⚡ ${m}: toți au greșit. Uneori meciul face ce vrea, fără să întrebe pe nimeni.`,
    m=>`⚡ ${m}: zero predicții corecte. Se întâmplă — fotbalul nu citește foaia de pronosticuri.`,
    m=>`⚡ ${m}: nimeni n-a ghicit rezultatul. Grupul întreg a pierdut runda asta cu fotbalul.`,
  ];
  const predItems=[];
  for(const match of latestFinished.slice(0,3)){
    if(predItems.length>=4)break;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const zeroes=mp.filter(p=>p.pts===0);
    const soloX=mp.filter(p=>p.pOutcome==='X');
    const opposed=mp.filter(p=>p.pOutcome==='1');
    const opposedB=mp.filter(p=>p.pOutcome==='2');
    if(exact.length===1){
      const nk=exact[0].nick;
      // Verifică dacă jucătorul a și urcat în clasament odată cu asta
      const entry=leaderboard.find(e=>e.nickname===nk);
      const prevEntry=prevLeaderboard.find(p=>p.nickname===nk);
      const rankJump=entry&&prevEntry?prevEntry.rank-entry.rank:0;

      if(entry&&rankJump>=2){
        // Combo: scor exact + salt mare în clasament — mesaj special, mereu cu manea/citat
        const flavor=_roll(nk,match.id,'combo')
          ?_call(T_MAN_EXACT,[nk,match.id,'cb'],nk)
          :_call(T_CITE_EXACT,[nk,match.id,'cb'],nk);
        predItems.push({type:'exact',text:`🎯🔥 ${nk} a nimerit exact ${mName} ȘI a sărit ${rankJump} locuri — e pe ${entry.rank} acum! ${flavor}`});
      }else{
        const text=_roll(nk,match.id,'mn-ex',1)?_call(T_MAN_EXACT,[nk,match.id],nk):_roll(nk,match.id,'ci-ex',2)?_call(T_CITE_EXACT,[nk,match.id],nk):_call(T_EXACT,[nk,match.id,'ex'],nk,mName);
        predItems.push({type:'exact',text});
      }
    }else if(exact.length>=2){
      const names=exact.slice(0,3).map(e=>e.nick).join(' și ');
      predItems.push({type:'exact',text:_call(T_EXACT_MULTI,[names,match.id],names,mName)});
    }else if(opposed.length>=1&&opposedB.length>=1){
      predItems.push({type:'banter',text:`🎯 ${opposed[0].nick} a pus ${match.teamA}, ${opposedB[0].nick} a pus ${match.teamB} la ${mName}. Fotbalul a ales.`});
    }else if(soloX.length===1&&mp.length>=3){
      predItems.push({type:'banter',text:_call(T_MAN_DRAW,[soloX[0].nick,match.id],soloX[0].nick)});
    }
    if(zeroes.length===1&&predItems.length<4){
      const nk=zeroes[0].nick;
      const text=_roll(nk,match.id,'mn-z')?_call(T_MAN_ZERO,[nk,match.id],nk):_roll(nk,match.id,'ci-z')?_call(T_CITE_ZERO,[nk,match.id],nk):_call(T_ZERO,[zeroes[0].uid,match.id,'z'],nk,mName);
      predItems.push({type:'miss',text});
    }
    if(mp.length>=3&&mp.filter(p=>p.ok).length===0&&predItems.length<4){
      predItems.push({type:'upset',text:_call(T_UPSET,[match.id,'up'],mName)});
    }
  }

  // ── STRUCTURA FINALĂ: intercalat curiozitate→citat→lb/pred→curiozitate→citat→lb/pred ──
  // Helper: dacă predItems s-a epuizat, completez sloturile cu citat/curiozitate extra în loc să las gol
  const predOrFiller=(seedExtra)=>{
    if(predItems.length>0)return predItems.shift();
    const extraC=curiosities.shift();
    if(extraC)return extraC;
    return nextStandalone(hourSeed*7+seedExtra);
  };

  // Adaug prima știre de predicție/meci recent (sau filler dacă nu există)
  push(predOrFiller(100));

  // Runda 1: curiozitate → citat → clasament
  const c1=curiosities.shift();if(c1)push(c1);
  const q1=nextStandalone(hourSeed*3);if(q1)push(q1);
  if(lbItems.length>0)push(lbItems.shift());

  // A doua știre predicție dacă există (sau filler)
  push(predOrFiller(200));

  // Runda 2: curiozitate → citat → clasament
  const c2=curiosities.shift();if(c2)push(c2);
  const q2=nextStandalone(hourSeed*3+1);if(q2)push(q2);
  if(lbItems.length>0)push(lbItems.shift());

  // A treia știre predicție/upset (sau filler)
  push(predOrFiller(300));

  // Runda 3: curiozitate → citat → clasament
  const c3=curiosities.shift();if(c3)push(c3);
  const q3=nextStandalone(hourSeed*3+2);if(q3)push(q3);
  if(lbItems.length>0)push(lbItems.shift());

  // Completez cu drama de meci dacă mai e loc
  for(const match of latestFinished){
    if(result.length>=12)break;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const corners=rCornT??(rCornH!=null&&rCornA!=null?rCornH+rCornA:null);
    const items=_matchDrama(mName,sA,sB,match.homeScorers,match.awayScorers,rCards??0,corners??0,match.id);
    items.forEach(text=>{if(result.length<12)push({type:'match_drama',text});});
  }

  // FIX FINAL: dacă tot mai sunt sub 12 sloturi (meciuri/predicții insuficiente),
  // completez cu citate standalone suplimentare sau curiozități rotite, ca să nu rămână feedul scurt.
  let fillExtra=400;
  while(result.length<12&&fillExtra<450){
    const extra=curiosities.shift()||nextStandalone(hourSeed*11+fillExtra);
    if(extra){
      // Evit duplicate verificând dacă textul deja există în result
      const exists=result.some(r=>r.text===extra.text);
      if(!exists)push(extra);
    }
    fillExtra++;
    if(curiosities.length===0&&fillExtra>410){
      // Adaug citate suplimentare din alte poziții ale pool-ului standalone
      const fallbackQuote=T_CITE_STANDALONE[(hourSeed+fillExtra)%T_CITE_STANDALONE.length];
      const exists2=result.some(r=>r.text===fallbackQuote);
      if(!exists2)push({type:'quote',text:fallbackQuote});
    }
  }

  // Deduplicate by text and return 12 items
  const seen=new Set();
  return result
    .filter(e=>{if(!e||!e.text)return false;if(seen.has(e.text))return false;seen.add(e.text);return true;})
    .slice(0,12)
    .map((e,i)=>({id:`feed_${Date.now()}_${i}`,type:e.type,icon:'',text:e.text,ts:Date.now(),priority:12-i}));
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
