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

// ─── ACTIVITY FEED v6 ────────────────────────────────────────────────────────
// Editorial engine. 70% match stories/facts, 30% max prediction banter.
// Priority: live > newest finished > today finished > upcoming > facts > ranking.
// Country facts: contextual only (teams playing today/next/just finished).
// Read-only. No Firestore writes. No scoring changes.
// ─────────────────────────────────────────────────────────────────────────────

const _AL6={
  "Țările de Jos":"Olanda","Netherlands":"Olanda","Franța":"Franta","France":"Franta",
  "Curaçao":"Curacao","Coasta de Fildeș":"Coasta de Fildes","DR Congo":"RD Congo",
  "Congo RD":"RD Congo","Cape Verde":"Capul Verde",
  "Bosnia & Herzegovina":"Bosnia","Bosnia & Herțegovina":"Bosnia",
};
const _n6=t=>_AL6[t]??t;
const _WC6=new Set([
  "Africa de Sud","Algeria","Anglia","Arabia Saudita","Argentina","Australia",
  "Austria","Belgia","Bosnia","Brazilia","Canada","Capul Verde","Cehia",
  "Coasta de Fildes","Columbia","Coreea de Sud","Croatia","Curacao","Ecuador",
  "Egipt","Elvetia","Franta","Germania","Ghana","Haiti","Iordania","Irak","Iran",
  "Japonia","Maroc","Mexic","Norvegia","Noua Zeelanda","Olanda","Panama",
  "Paraguay","Portugalia","Qatar","RD Congo","SUA","Scotia","Senegal","Spania",
  "Suedia","Tunisia","Turcia","Uruguay","Uzbekistan",
]);
const _isOff6=t=>_WC6.has(_n6(t));
const _isWCM6=m=>m&&m.id>=1&&m.id<=72;
const _p6=(arr,...seeds)=>{
  const h=Math.abs(seeds.reduce((a,s)=>((a*31)+(String(s).charCodeAt(0)|0))|0,7));
  return arr[h%arr.length];
};
const _c6=(arr,seeds,...args)=>{const fn=_p6(arr,...seeds);return typeof fn==='function'?fn(...args):String(fn);};

const CF6={
  "Africa de Sud":{football:["Africa de Sud a organizat primul Mondial de pe continentul african, în 2010. Vuvuzelele încă bântuie.","Africa de Sud a produs jucători ca Benni McCarthy, cel mai bun marcator african la Mondiale."],culture:["Africa de Sud are 11 limbi oficiale — mai mult decât orice altă țară.","Table Mountain e una din cele 7 Minuni Naturale ale Lumii."],funny:["Dacă nimerești scorul la Africa de Sud, ești mai faimos decât Bafana Bafana."]},
  "Algeria":{football:["Algeria a câștigat Cupa Africii în 2019 cu un parcurs fără înfrângere.","Algeria a eliminat Germania la Mondialul 2014."],culture:["Algeria e cea mai mare țară din Africa ca suprafață.","Sahara ocupă 90% din Algeria. Restul 10% e fotbal."],funny:["Algeria: pe hartă pare liniștită. Pe teren, deloc."]},
  "Anglia":{football:["Anglia a câștigat un singur Mondial, în 1966, pe teren propriu. De atunci, speranță eternă.","Anglia a inventat fotbalul modern în 1863 — prima federație din lume."],culture:["Londra are peste 300 de limbi vorbite zilnic.","Anglia bea 100 milioane de căni de ceai pe zi. Ceaiul nu ajută la penaltii."],funny:["Football's coming home — cântecul englezilor la fiecare turneu. Și tot nu vine."]},
  "Arabia Saudita":{football:["Arabia Saudită a bătut Argentina cu 2-1 la Mondialul 2022 — unul din cele mai mari șocuri din istorie.","Arabia Saudită a câștigat Cupa Asiei în 1984, 1988 și 1996."],culture:["Arabia Saudită e cel mai mare exportator de petrol din lume.","Riad are mai multe mall-uri per capita decât aproape orice alt oraș."],funny:["Arabia Saudită: vine cu surprize mari și fără avertisment."]},
  "Argentina":{football:["Argentina a câștigat Cupa Mondială în 1978, 1986 și 2022.","Maradona vs Anglia 1986: Mâna lui Dumnezeu + Golul Secolului — în același meci."],culture:["Tango-ul e patrimoniu UNESCO și s-a născut în Buenos Aires.","Argentina consumă mai multă carne de vită per capita decât aproape orice altă națiune."],funny:["Argentina fără presiunea titlului poate fi mai periculoasă. Sau mai imprevizibilă."]},
  "Australia":{football:["Australia a ajuns în sferturile Mondialului 2022, eliminând Danemarca.","Socceroos au bătut Argentina la penaltii în 2022."],culture:["Australia e singurul continent-țară din lume.","Există mai mulți canguri decât oameni în Australia."],funny:["Socceroos: genul de echipă pe care o subestimezi și după plângi."]},
  "Austria":{football:["Austria a terminat pe locul 3 la Mondialul 1954.","Viena a fost de 3 ori desemnată cel mai bun oraș în care să trăiești la nivel mondial."],culture:["Austria e patria lui Mozart, Haydn și Schubert.","Viena are una din cele mai bune rețele de transport public din lume."],funny:["Austria: bate o favorită, pierde cu o codașă. Dramatic fără excepție."]},
  "Belgia":{football:["Belgia a terminat pe locul 3 la Mondialul 2018 — generația de aur fără trofeu.","Belgia a ocupat locul 1 în clasamentul FIFA timp de 3 ani consecutivi."],culture:["Belgia produce peste 700 de tipuri de bere — tradiție UNESCO.","Bruxelles e capitala de facto a UE și sediul NATO."],funny:["Generație de aur, zero titluri. Belgia are tot, mai puțin finala câștigată."]},
  "Bosnia":{football:["Bosnia a participat pentru prima dată la Mondialul 2014 cu Džeko în formă maximă.","Bosnia a marcat 4 goluri în Brazilia 2014."],culture:["Sarajevo a găzduit Jocurile Olimpice de Iarnă în 1984.","Mostar are Stari Most, pod din sec. XVI și Patrimoniu UNESCO."],funny:["Bosnia: vin cu foame și cu mai puțin de pierdut. Combinație periculoasă."]},
  "Brazilia":{football:["Brazilia are 5 titluri mondiale — record absolut. Presiunea e parte din tricou.","Maracanazo 1950: Brazilia a pierdut finala acasă cu Uruguay în fața a 200.000 de oameni."],culture:["Brazilia e singura țară din America care vorbește portugheză.","Pădurea Amazoniană acoperă ~60% din teritoriul Braziliei."],funny:["Brazilia vine mereu ca favorită. Și mereu cu dezamăgiri. E parte din tradiție."]},
  "Canada":{football:["Canada co-organizează Mondialul 2026 și s-a calificat după 36 de ani de absență.","Canada are Davies și o generație tânără cu foame reală."],culture:["Canada are mai multe lacuri decât restul lumii la un loc.","Canada e a doua cea mai mare țară din lume ca suprafață."],funny:["Canada joacă acasă în 2026. Publicul e gata. Echipa, la fel."]},
  "Capul Verde":{football:["Capul Verde s-a calificat la Mondialul 2026 — premieră istorică.","Capul Verde a eliminat echipe mult mai mari în drum spre Mondial."],culture:["Capul Verde e un arhipelag de 10 insule în Atlanticul de Nord-Est.","Muzica Morna din Capul Verde e Patrimoniu UNESCO."],funny:["Capul Verde: mici ca insulă, mari ca surpriză."]},
  "Cehia":{football:["Cehia (ca Cehoslovacia) a terminat pe locul 2 la Mondialul 1962 și 1934.","Cehia a câștigat Euro 1976 — cu Panenka inventând lovitura cu chip."],culture:["Cehia produce și consumă cea mai mare cantitate de bere per capita din lume.","Praga e una din cele mai bine conservate capitale medievale din Europa."],funny:["Cehia inventează genul care nu se repetă — lovitura Panenka, de exemplu."]},
  "Coasta de Fildes":{football:["Coasta de Fildes a câștigat Cupa Africii în 1992, 2015 și 2024.","Coasta de Fildes a participat la 3 Cupe Mondiale consecutive: 2006, 2010, 2014."],culture:["Coasta de Fildes e cel mai mare producător mondial de cacao.","Abidjan e unul din centrele economice principale ale Africii de Vest."],funny:["Nu le dai head-to-head fără să te gândești de două ori."]},
  "Columbia":{football:["Columbia a ajuns în sferturile Mondialului 2014 cu James Rodríguez ca stea.","Columbia a câștigat Copa América 2024 fără să primească gol în grupe."],culture:["Columbia e a doua țară cu cea mai mare biodiversitate din lume.","Columbia produce ~10% din cafeaua mondială."],funny:["Columbia: talent, energie, imprevizibil. Predicțiile simple mor acolo."]},
  "Coreea de Sud":{football:["Coreea de Sud a ajuns în semifinalele Mondialului 2002 — cel mai bun rezultat asiatic.","Coreea de Sud a eliminat Germania și Mexicul la Mondialul 2018."],culture:["Seul are ~25 milioane de oameni în zona metropolitană.","Coreea de Sud e lider mondial în viteza internetului și acoperire 5G."],funny:["Coreea de Sud bate pe cine nu trebuie. Lăsat nesupravegheat, face ravagii."]},
  "Croatia":{football:["Croatia a terminat pe locul 2 la Mondialul 2018 și locul 3 în 2022.","Luka Modrić a câștigat Balonul de Aur în 2018."],culture:["Cravata e o invenție croată — soldații croați o purtau în sec. XVII.","Coasta dalmată a Croației are peste 1.000 de insule."],funny:["Croatia: mici ca țară, constant în semifinale. Explicații nu există."]},
  "Curacao":{football:["Curaçao s-a calificat la Mondialul 2026 prin calificările CONCACAF.","Curaçao are ~150.000 de locuitori — una din cele mai mici echipe la Mondial."],culture:["Willemstad e Patrimoniu UNESCO pentru arhitectura sa colorată.","Curaçao e o insulă de 444 km² în Caraibe."],funny:["Curaçao la Mondial: genul de echipă pe care o subestimezi și după plângi."]},
  "Ecuador":{football:["Ecuador a deschis Mondialul 2022 bătând gazda Qatar cu 2-0.","Ecuador a participat la 4 Cupe Mondiale și a ieșit din grupe de fiecare dată."],culture:["Ecuador e traversat de Ecuator.","Insulele Galapagos au inspirat teoria evoluției a lui Darwin."],funny:["Ecuador: dacă ajung în grupe, au voie să și câștige. Ținut minte."]},
  "Egipt":{football:["Egipt a câștigat Cupa Africii de 7 ori — record absolut.","Mohamed Salah a marcat 40+ goluri pentru națională."],culture:["Piramidele de la Giza sunt singura minune antică rămasă în picioare.","Egipt are una din cele mai vechi civilizații — peste 5.000 de ani."],funny:["Fără Salah în formă, Egipt joacă alt fotbal. Cu Salah, orice e posibil."]},
  "Elvetia":{football:["Elveția a eliminat Franta la Euro 2021 în optimi.","Elveția e mereu acolo la turnee. Niciodată favorită, niciodată ușor de eliminat."],culture:["Elveția are 4 limbi oficiale și produce ~10 kg de ciocolată per capita anual.","Trenurile elvețiene sunt atât de precise că sunt referință mondială."],funny:["Elveția: îi tratezi cu condescendență, ei te tratează cu penaltiul decisiv."]},
  "Franta":{football:["Franta a câștigat Cupa Mondială în 1998 și 2018.","Generația lui Zidane a câștigat Mondialul și Euro în același an — 1998 și 2000."],culture:["Franta e cel mai vizitat stat din lume — peste 80 milioane de turiști anual.","Turnul Eiffel a fost construit în 1889 ca structură temporară."],funny:["Franta vine la fiecare Mondial ca și cum l-a câștigat deja. Uneori chiar îl câștigă."]},
  "Germania":{football:["Germania are 4 titluri mondiale — 1954, 1974, 1990, 2014.","7-1 cu Brazilia în 2014 rămâne cel mai mare șoc din istoria semifinalelor mondiale."],culture:["Germania are legea purității berii din 1516. Disciplina e în ADN.","Germania e cea mai populată țară din UE — ~84 milioane de locuitori."],funny:["Germania face totul corect. Uneori corect înseamnă plictisitor. Rezultatele nu sunt."]},
  "Ghana":{football:["Ghana a ajuns în sferturile Mondialului 2010 — era la un penalti de semifinale.","Ghana a câștigat Cupa Africii în 1963, 1965, 1978 și 1982."],culture:["Ghana a fost prima țară din Africa Sub-Sahariană independentă față de britanici, în 1957.","Accra e unul din cele mai dinamice orașe din Africa de Vest."],funny:["Ghana: când e zi bună, bate pe oricine. Când nu e, tot face meci."]},
  "Haiti":{football:["Haiti a participat la Cupa Mondială 1974 în Germania.","Haiti e o forță în fotbalul din zona Caraibelor."],culture:["Haiti a fost prima republică neagră din lume, în 1804.","Creola haitiană e una din cele două limbi oficiale, alături de franceză."],funny:["Haiti la Mondial: orice gol e o poveste. Orice victorie e titlu internațional."]},
  "Iordania":{football:["Iordania a ajuns în finala Cupei Asiei 2023.","Iordania s-a calificat la Mondialul 2026 prin baraj intercontinental."],culture:["Petra, orașele antice săpate în stâncă, e una din cele 7 Minuni ale Lumii Moderne.","Marea Moartă e cel mai jos punct de pe suprafața Pământului."],funny:["Iordania: nu vin să fie decor. Vin să facă meciuri incomode."]},
  "Irak":{football:["Irak a câștigat Cupa Asiei pe Națiuni în 2007.","Irak a jucat fotbal internațional chiar și în cele mai dificile perioade."],culture:["Mesopotamia, leagănul primelor civilizații umane, se afla pe teritoriul actual al Irakului.","Bagdad a fost în sec. VIII-XIII unul din cele mai avansate orașe din lume."],funny:["Irak la Mondial: fiecare punct e câștigat cu dinții. Și contează dublu."]},
  "Iran":{football:["Iran a participat la Mondialul 2022 și are multiple titluri asiatice.","Iran are cea mai mare forță din Asia de Vest în fotbal."],culture:["Iran are una din cele mai vechi civilizații neîntrerupte — peste 3.000 de ani.","Persepolis, fosta capitală a Imperiului Persan, e Patrimoniu UNESCO."],funny:["Iran joacă apărare solidă și lovitură rapidă. Simplu pe hârtie, neplăcut de trăit."]},
  "Japonia":{football:["Japonia a eliminat Germania și Spania la grupele Mondialului 2022.","Japonia a ajuns în sferturi în 2022 — cel mai bun rezultat asiatic din 2002."],culture:["Japonia are trenuri cu medie de întârziere sub 1 minut.","Japonia are mai multe vending machines per capita decât orice altă țară."],funny:["Japonia nu știe că trebuie să piardă cu favoritele. Cineva să le spună."]},
  "Maroc":{football:["Maroc a eliminat Spania și Portugalia la Mondialul 2022 și a ajuns în semifinale — prima echipă africană.","Maroc a câștigat Cupa Africii în 1976."],culture:["Maroc e singura țară africană cu coastă la Atlantic și la Mediterană simultan.","Marrakech și Fes sunt orașe medievale cu piețe tradiționale funcționale și azi."],funny:["Maroc nu mai e surpriză. Dacă îi tratezi ca outsideri, plătești."]},
  "Mexic":{football:["Mexic a găzduit Mondialul în 1970 și 1986. Stadionul Azteca a văzut două finale mondiale.","Mexic nu a trecut niciodată de sferturi — blestemul sferturilor continuă."],culture:["Mexico City are ~22 milioane de oameni în zona metropolitană.","Mexic e una din primele 5 țări cu cea mai mare biodiversitate din lume."],funny:["Mexic acasă în 2026 cu public nebun. Poate de data asta se rupe blestemul sferturilor."]},
  "Norvegia":{football:["Norvegia s-a calificat la Mondialul 2026 — prima participare din 1998. Și au pe Haaland.","Erling Haaland a stabilit recorduri de goluri în Premier League și Champions League."],culture:["Fiordurile norvegiene sunt Patrimoniu UNESCO.","Norvegia are cel mai mare fond suveran de investiții din lume."],funny:["Cu Haaland pe teren, orice scor e posibil. Fără el — tot periculos."]},
  "Noua Zeelanda":{football:["Noua Zeelandă a participat la Mondialul 2010 și nu a pierdut niciun meci.","Noua Zeelandă a co-găzduit Cupa Mondială Feminină 2023."],culture:["Noua Zeelandă a fost primul stat care a acordat dreptul de vot femeilor, în 1893.","Noua Zeelandă are ~6 oi per persoană."],funny:["La rugby sunt temibili. La fotbal, tot încearcă. Chapeau."]},
  "Olanda":{football:["Olanda a inventat fotbalul total cu Johan Cruyff în anii 1970.","Olanda a terminat pe locul 2 la Mondialul 2010, 1974 și 1978."],culture:["Olanda are mai mulți bicicliști decât oameni.","25% din teritoriul Olandei e sub nivelul mării."],funny:["Olanda are fotbal total și niciun titlu mondial. Ironia supremă a sportului european."]},
  "Panama":{football:["Panama s-a calificat pentru a doua oară la Mondial în 2026.","Panama a câștigat prima victorie la Mondial în 2018 — contra Tunisia."],culture:["Canalul Panama leagă Atlanticul de Pacific.","Panama City e un hub financiar pentru America Centrală."],funny:["Panama: nu vin să fie decor. Vin să facă meciuri incomode."]},
  "Paraguay":{football:["Paraguay a terminat pe locul 4 la Mondialul 1962.","Paraguay a ajuns în sferturi în 2010 cu un fotbal defensiv solid."],culture:["Paraguay are două limbi oficiale: spaniola și guaraní.","Paraguay e una din cele două țări fără ieșire la mare din America de Sud."],funny:["Paraguay joacă dur și fără spectacol. Câștigă meciuri pe care nu ar trebui."]},
  "Portugalia":{football:["Portugalia a câștigat Euro 2016 și Nations League 2019.","Eusébio a marcat 9 goluri la Mondialul 1966 — Portugalia pe locul 3."],culture:["Portugalia e originea unui imperiu care a explorat cea mai mare parte din glob în sec. XV-XVI.","Lisabona are tramvai electric funcțional din 1901."],funny:["Portugalia are Ronaldo și mai mult decât Ronaldo. Tinerii au preluat ștafeta."]},
  "Qatar":{football:["Qatar a organizat Cupa Mondială 2022 — primul Mondial în Orientul Mijlociu.","Qatar a ieșit din grupe fără victorie — primul gazdă cu acest rezultat."],culture:["Qatar are cel mai mare PIB per capita din lume, datorat gazului natural.","Doha a crescut de la un sat de pescari la un oraș ultramodern în 50 de ani."],funny:["Qatar: cu bani mulți și fotbal în formare. Experiența la Mondiale se dobândește pe teren."]},
  "RD Congo":{football:["RD Congo (ca Zair) a participat la Mondialul 1974 — prima participare până în 2026.","RD Congo a câștigat Cupa Africii în 1968 și 1974."],culture:["Fluviul Congo e al doilea cel mai lung din Africa.","RD Congo are una din cele mai mari păduri tropicale din lume, după Amazon."],funny:["RD Congo revine după 52 de ani. Foamea de afirmare e reală."]},
  "SUA":{football:["SUA organizează Mondialul 2026 împreună cu Canada și Mexic.","SUA a înregistrat în 1994 cea mai mare medie de spectatori per meci."],culture:["SUA e a treia cea mai mare țară din lume ca suprafață.","Super Bowl-ul atrage mai mulți telespectatori decât orice alt eveniment sportiv."],funny:["Americanii la fotbal acasă sunt imprevizibili. Publicul poate fi al 12-lea om."]},
  "Scotia":{football:["Scoția și Anglia au jucat primul meci internațional din istorie, în 1872 — 0-0.","Scoția s-a calificat la Mondialul 2026 după o lungă absență."],culture:["Munții Highlands sunt unii din cei mai vechi munți din lume, geologic.","Whisky-ul scotch e una din cele mai exportate băuturi din lume."],funny:["Scoția are cei mai dedicați fani din lume. Echipa, mai puțin consistentă."]},
  "Senegal":{football:["Senegal a câștigat Cupa Africii în 2021 și 2022 — două la rând.","Senegal a ajuns în sferturile Mondialului 2002."],culture:["Dakar a fost punctul de plecare al celebrului Raliu Paris-Dakar.","Senegal e cunoscut pentru cultura teranga — ospitalitate autentică."],funny:["Senegal cu Mane e altă poveste. Cu el, definitiv de evitat."]},
  "Spania":{football:["Spania a câștigat Mondialul 2010 și Euro 2008, 2012, 2024.","Tiki-taka a redefinit fotbalul modern."],culture:["Spania e a patra cea mai vizitată țară din lume.","Spania are 2 fusuri orare, deși geografic ar trebui să fie pe același fus cu Londra."],funny:["Spania joacă posesie și te adoarme, apoi te bate 1-0. Eficient. Enervant."]},
  "Suedia":{football:["Suedia a terminat pe locul 3 la Mondialul 1994 și locul 2 în 1958.","Zlatan Ibrahimovic a marcat 62 de goluri pentru națională."],culture:["Spotify a fost fondată la Stockholm — Suedia a inventat streamingul muzical.","Suedia are soarele de miez de noapte vara."],funny:["Suedia fără Zlatan e altă echipă. Dar tot câștigă meciuri pe care nu ar trebui."]},
  "Tunisia":{football:["Tunisia a câștigat Cupa Africii în 2004.","Tunisia a fost prima echipă africană care a câștigat un meci la Mondialul 1978."],culture:["Cartagina, una din marile civilizații antice, se afla pe teritoriul actual al Tunisiei.","Tunisia e poarta de intrare în Africa de Nord."],funny:["Tunisia face meciuri strânse. Nu pierd cu 4-0, dar nici nu câștigă cu 4-0."]},
  "Turcia":{football:["Turcia a terminat pe locul 3 la Mondialul 2002. Acum e înapoi.","Istanbul e singurul oraș din lume aflat pe două continente."],culture:["Hagia Sophia, construită în 537 d.Hr., e una din cele mai impresionante construcții din istorie.","Turcia produce ~75% din alunele din lume."],funny:["Turcia: geniu și dezastru în același meci. Genul care te face să regreți predicția simplă."]},
  "Uruguay":{football:["Uruguay a câștigat primele două Cupe Mondiale — 1930 și 1950.","Uruguay a bătut Brazilia pe Maracanã în fața a 200.000 de spectatori."],culture:["Uruguay garantează constituțional accesul la internet.","Uruguay a legalizat marijuana în 2013 — primul stat din lume."],funny:["Uruguay: mici, istorici, greu de bătut. Clasicul adversar pe care nu îl vrei în grupă."]},
  "Uzbekistan":{football:["Uzbekistan e la primul Mondial FIFA senior — premieră istorică.","Uzbekistan a câștigat Campionatul Asian Under-23 în 2022."],culture:["Samarkand a fost unul din centrele principale ale Drumului Mătăsii.","În Uzbekistan, pâinea e respectată profund în cultură și nu se pune cu fața în jos."],funny:["Uzbekistan la Mondial: scor exact la ei = titlu de onoare în grup."]},
};

const ST6={
  "Franta":"Kylian Mbappé","Argentina":"Lionel Messi","Brazilia":"Vinicius Jr.",
  "Anglia":"Jude Bellingham","Maroc":"Achraf Hakimi","Portugalia":"Cristiano Ronaldo",
  "Norvegia":"Erling Haaland","Egipt":"Mohamed Salah","Senegal":"Sadio Mané",
  "SUA":"Christian Pulisic","Columbia":"James Rodríguez","Spania":"Pedri",
  "Germania":"Florian Wirtz","Olanda":"Cody Gakpo","Belgia":"Kevin De Bruyne",
};

const T_EXACT=[
  n=>`🎯 ${n} a nimerit scorul exact. Asta nu e predicție, e vrăjitorie.`,
  n=>`🔮 ${n} a văzut viitorul și nu ne-a spus. FIFA investighează.`,
  n=>`🧙 ${n} are acces la scenariul meciului. Cum?`,
  n=>`🏹 Direct în țintă: ${n} a prins scorul exact. Aplauze.`,
  n=>`🧠 ${n} n-a ghicit. A calculat. Diferența contează.`,
  n=>`✨ ${n} cu scor exact. Restul au venit la ghicit porumbei.`,
  n=>`🎯 ${n}: scor exact confirmat. Globul de cristal e real.`,
  n=>`🔭 ${n} a prezis meciul de parcă l-a regizat. Scor exact.`,
  n=>`📐 ${n} a măsurat totul milimetric. Scor exact.`,
  n=>`🃏 ${n} a tras cartea bună. Scor exact.`,
  n=>`🧬 ${n} are cod genetic de scor exact. Nu se explică altfel.`,
  n=>`🎪 ${n} a intrat în ring și a ieșit cu scor exact.`,
  n=>`🔑 ${n} a găsit cheia meciului. Scor exact.`,
  n=>`📡 ${n} a captat semnalul corect. Scor exact.`,
  n=>`🧲 ${n} a atras scorul exact ca un magnet.`,
  n=>`🎰 ${n} a câștigat jackpot-ul. Scor exact.`,
  n=>`🦅 ${n} a văzut meciul de sus. Scor exact.`,
  n=>`📌 ${n} a pus degetul exact pe scor. Precizie chirurgicală.`,
  n=>`🏆 ${n}: scor exact. Clasamentul simte imediat.`,
  n=>`🎯 ${n} a lovit bull's-eye. Concurenții se uită în jos.`,
  (n,m)=>`🔮 ${n} a ghicit la ${m}. Nu e talent, e canal cosmic.`,
  (n,m)=>`🧙 ${n} la ${m}: scor exact. Cineva să-l testeze.`,
  (n,m)=>`🎯 Scor exact pentru ${n} la ${m}. Singur pe insulă, cu calculatorul.`,
  (n,m)=>`🏹 ${n} la ${m} — direct în centru.`,
  (n,m)=>`📺 ${n} a prezis ${m} cu televizorul pe canalul potrivit.`,
  (n,m)=>`🔬 ${n} a analizat ${m} la microscop și a ieșit scor exact.`,
  (n,m)=>`✅ ${n} bifează scor exact la ${m}. Metodic și mortal.`,
  (n,m)=>`⚡ ${n} la ${m}: scor exact. Ca trăznetul — rapid, precis.`,
  (n,m)=>`🗺️ ${n} a navigat perfect la ${m}. Scor exact.`,
  (n,m)=>`🦁 ${n} la ${m}: scor exact. Regele junglei de predicții.`,
  (n,m)=>`🎸 ${n} la ${m}: a dat solosul perfect.`,
  (n,m)=>`🏋️ ${n} ridică greutatea maximă: scor exact la ${m}.`,
  (n,m)=>`🧩 ${n} a asamblat puzzle-ul corect la ${m}.`,
  (n,m)=>`🌊 ${n} a prins valul perfect la ${m}. Scor exact.`,
  (n,m)=>`🔒 ${n} a deschis încuietoarea lui ${m} cu cheia corectă.`,
  (n,m)=>`🧭 ${n} n-a rătăcit la ${m}. Scor exact.`,
  (n,m)=>`🪄 ${n} a scos iepurele din pălărie la ${m}: scor exact.`,
  (n,m)=>`🌡️ ${n} a luat temperatura meciului ${m} și a prescris scor exact.`,
  (n,m)=>`🎵 ${n} la ${m}: totul a cântat exact cum a scris partitura.`,
  (n,m)=>`🚀 ${n} la ${m}: scor exact. Decolaj confirmat.`,
  n=>`🌟 ${n} strălucește cu scor exact. Clasa se vede.`,
  n=>`⚽ ${n}: scor exact. Fotbalul are dreptate uneori.`,
  n=>`🏅 ${n} cu scor exact. Puncte oficiale.`,
  n=>`🧊 ${n} rece ca gheața: scor exact.`,
  n=>`🔥 ${n}: scor exact și clasamentul simte.`,
  n=>`🎭 ${n} a jucat scenariul perfect: scor exact.`,
  n=>`🦊 ${n} a fost viclean: scor exact când nimeni nu se aștepta.`,
  n=>`🏄 ${n} a prins valul perfect: scor exact.`,
  n=>`🧘 ${n} a meditat și a obținut scor exact.`,
  n=>`🔐 ${n} a spart codul meciului. Scor exact.`,
  n=>`⚡ ${n} fulger de scor exact. Rapid și devastator.`,
  n=>`🎲 ${n} a aruncat zarul perfect: scor exact.`,
  n=>`🧲 ${n} atrage scorurile exacte ca un magnet. Ciudat.`,
  n=>`📊 ${n}: scor exact. Datele confirmă ce bănuiam.`,
  n=>`🏆 ${n} câștigă runda cu scor exact. Nediscutabil.`,
  (n,m)=>`🎯 ${n} și ${m}: o combinație câștigătoare. Scor exact.`,
  (n,m)=>`🔮 ${n} știa de la ${m}. Scor exact confirmat.`,
  (n,m)=>`🧠 ${n} la ${m}: a studiat sau a ghicit? Oricum, scor exact.`,
  (n,m)=>`💡 ${n} a văzut lumina la ${m}: scor exact.`,
  (n,m)=>`🌟 ${n} strălucește la ${m}: scor exact.`,
  (n,m)=>`🦅 ${n} vede de sus la ${m}: scor exact.`,
  (n,m)=>`🎭 ${n} a regizat ${m}: scor exact.`,
  (n,m)=>`🔑 ${n} a deschis ${m} cu cheia potrivită. Scor exact.`,
  (n,m)=>`🌊 ${n} a prins valul la ${m}. Scor exact.`,
  (n,m)=>`⚡ ${n} la ${m}: fulger de scor exact.`,
  (n,m)=>`🧲 ${n} atrage scorul exact la ${m}.`,
  (n,m)=>`🏄 ${n} surfează pe ${m}: scor exact.`,
  (n,m)=>`🎪 ${n} la ${m}: show complet cu scor exact.`,
  (n,m)=>`🔬 ${n} a discat ${m} și a obținut scor exact.`,
  (n,m)=>`📡 ${n} la ${m}: semnalul a fost clar. Scor exact.`,
  (n,m)=>`🗺️ ${n} a navigat ${m} fără GPS. Scor exact.`,
  (n,m)=>`🎵 ${n} la ${m}: a ascultat ritmul meciului. Scor exact.`,
  (n,m)=>`🚀 ${n} a decolat la ${m} cu scor exact.`,
  (n,m)=>`🏆 ${n}: ${m} citit perfect. Scor exact.`,
  (n,m)=>`🧘 ${n} la ${m}: meditație și scor exact.`,
  (n,m)=>`🎲 ${n} la ${m}: zarul perfect. Scor exact.`,
  (n,m)=>`🌈 ${n} la ${m}: curcubeul de scor exact.`,
  (n,m)=>`🦊 ${n} viclean la ${m}. Scor exact neașteptat.`,
  (n,m)=>`🏅 ${n} la ${m}: medalie neoficială pentru scor exact.`,
  (n,m)=>`💪 ${n} la ${m}: forță și scor exact.`,
];

const T_ZERO=[
  n=>`🤦 ${n} a luat 0 puncte. Se verifică dacă a prezis cu televizorul stins.`,
  n=>`🪦 Predicția lui ${n} a murit în minutul 12. R.I.P.`,
  n=>`🍿 ${n} a venit pentru spectacol și a plecat cu 0 puncte.`,
  n=>`😶 ${n}: 0 puncte. Nici rezultatul. Seara de uitat.`,
  n=>`🙈 ${n} a prezis cu ochii închiși. Același rezultat cu ochii deschiși.`,
  n=>`📉 ${n} la 0 puncte. Clasamentul notează tot, nu iartă nimic.`,
  n=>`🧊 ${n}: 0 puncte, zero strategie.`,
  n=>`🎲 ${n} a dat cu zarul și a scos față goală. 0 puncte.`,
  n=>`🚑 ${n} solicită asistență medicală după 0 puncte.`,
  n=>`🌵 ${n} a supraviețuit meciului cu 0 puncte. Cumva.`,
  n=>`🔇 ${n}: 0 puncte. Aplicația nu știe cum să comenteze.`,
  n=>`🎭 ${n} a jucat tragedia perfectă: a prezis greșit tot.`,
  n=>`💣 Predicția lui ${n} a explodat cu tot cu cartonașe.`,
  n=>`🌧️ ${n}: 0 puncte și clasament neschimbat în rău.`,
  n=>`🗑️ ${n} trimite predicția la coș și o ia de la capăt.`,
  n=>`🐢 ${n} merge lent, dar fără puncte.`,
  n=>`😴 ${n} a prezis cu somnul nefăcut. Rezultat: 0 puncte.`,
  n=>`🤷 ${n}: 0 puncte. Se întâmplă. Nu ar trebui.`,
  n=>`📵 ${n} a prezis ca și cum nu a urmărit niciodată fotbal.`,
  n=>`🔦 ${n} a căutat punctele cu lanterna. 0 găsite.`,
  n=>`🎯 ${n} a ratat toate. Scor, rezultat, cartonașe, cornere.`,
  n=>`🌑 ${n} în bezna clasamentului: 0 puncte.`,
  n=>`🧸 ${n} a predat predicția unui ursuleț de pluș. 0 puncte.`,
  n=>`🚫 ${n}: 0 puncte. A greșit tot ce putea fi greșit.`,
  n=>`🏜️ ${n} în deșertul clasamentului: 0 puncte.`,
  (n,m)=>`🤦 ${n} la ${m}: 0 puncte. A făcut-o de oaie.`,
  (n,m)=>`🪦 Predicția lui ${n} la ${m} — înmormântare rapidă.`,
  (n,m)=>`🔮 ${n} a prezis ${m} cu globul spart. 0 puncte.`,
  (n,m)=>`😬 ${n} la ${m}: 0 puncte. Prietenia se suspendă temporar.`,
  (n,m)=>`🎲 ${n} la ${m} — a dat cu zarul și a ieșit fața greșită.`,
  (n,m)=>`🌪️ ${n} la ${m}: predicția nu a supraviețuit furtunii.`,
  (n,m)=>`📺 ${n} la ${m}: telecomanda stricată. 0 puncte.`,
  (n,m)=>`🧨 ${n} la ${m}: predicție distrusă complet. 0 puncte.`,
  (n,m)=>`🫠 ${n} la ${m}: s-a topit. 0 puncte.`,
  (n,m)=>`💀 ${n} la ${m}: predicție moartă clinic.`,
  (n,m)=>`🌊 ${n} la ${m} — valul greșit. Înecat.`,
  (n,m)=>`🎭 ${n} la ${m}: dramă în trei acte, toate greșite.`,
  (n,m)=>`🏚️ ${n} la ${m}: predicția s-a prăbușit.`,
  (n,m)=>`🚿 ${n} la ${m}: spălat complet de meci.`,
  (n,m)=>`🕳️ ${n} la ${m}: a căzut în gaura clasamentului.`,
  n=>`🤡 ${n}: 0 puncte. Meciul a râs de predicție.`,
  n=>`🌫️ ${n}: predicție pierdută în ceață. 0 puncte.`,
  n=>`🔩 ${n} are șuruburi lipsă în predicții. 0 puncte.`,
  n=>`🎠 ${n} a mers în cercuri cu predicția. 0 puncte.`,
  n=>`🦆 ${n}: predicție de rață. 0 puncte în realitate.`,
  n=>`🌋 ${n}: predicția a erupt și a distrus totul. 0 puncte.`,
  n=>`🎪 ${n} a intrat în circ cu predicția. 0 puncte.`,
  n=>`🌀 ${n}: vârtej de greșeli. 0 puncte.`,
  n=>`📦 ${n}: predicția livrată greșit. 0 puncte.`,
  n=>`🧶 ${n}: predicția s-a destrămat. 0 puncte.`,
  n=>`🔋 ${n}: bateria de predicții a murit. 0 puncte.`,
  n=>`🎻 ${n}: a cântat pe note false. 0 puncte.`,
  n=>`🕸️ ${n} prins în pânza greșelilor. 0 puncte.`,
  n=>`🎈 ${n}: predicția s-a umflat și a explodat. 0 puncte.`,
  n=>`🌊 ${n}: valul predicției a lovit stânca. 0 puncte.`,
  (n,m)=>`🤡 ${n} la ${m}: predicție de circ. 0 puncte.`,
  (n,m)=>`🌫️ ${n} la ${m}: totul în ceață. 0 puncte.`,
  (n,m)=>`🔩 ${n} la ${m}: mecanism blocat. 0 puncte.`,
  (n,m)=>`🦆 ${n} la ${m}: predicție de rață. 0 puncte.`,
  (n,m)=>`🌋 ${n} la ${m}: erupție de greșeli. 0 puncte.`,
  (n,m)=>`🌀 ${n} la ${m}: vârtej total. 0 puncte.`,
  (n,m)=>`📦 ${n} la ${m}: livrare eșuată. 0 puncte.`,
  (n,m)=>`🧶 ${n} la ${m}: totul s-a destrămat. 0 puncte.`,
  (n,m)=>`🔋 ${n} la ${m}: baterie moartă. 0 puncte.`,
  (n,m)=>`🎻 ${n} la ${m}: note false. 0 puncte.`,
  (n,m)=>`🕸️ ${n} la ${m}: prins în pânza greșelilor. 0 puncte.`,
  (n,m)=>`🎈 ${n} la ${m}: predicția a explodat. 0 puncte.`,
  (n,m)=>`🤦 ${n} la ${m}: dacă există o formulă pentru 0 puncte, ${n} a găsit-o.`,
  (n,m)=>`😮‍💨 ${n} la ${m}: un oftat lung și 0 puncte.`,
  (n,m)=>`🌑 ${n} la ${m}: bezna totală. 0 puncte.`,
  (n,m)=>`🎪 ${n} la ${m}: circ complet. 0 puncte acrobatice.`,
  (n,m)=>`🔮 ${n} la ${m}: globul era și el debusolat. 0 puncte.`,
  (n,m)=>`🧊 ${n} la ${m}: înghețat la 0 puncte.`,
  (n,m)=>`📵 ${n} la ${m}: semnal pierdut complet. 0 puncte.`,
  (n,m)=>`🎭 ${n} la ${m}: tragedie în un act. 0 puncte.`,
  (n,m)=>`🏜️ ${n} la ${m}: deșert de puncte.`,
  (n,m)=>`🪦 ${n} la ${m}: predicție în mormânt.`,
  (n,m)=>`🌪️ ${n} la ${m}: furtuna a măturat totul. 0 puncte.`,
  (n,m)=>`🧊 ${n} la ${m}: înghețat la 0. Fără șanse de dezgheț.`,
  (n,m)=>`🎭 ${n} la ${m}: finale de tragedie. 0 puncte, aplauze ironice.`,
];

const T_UP=[
  (n,r)=>`🚀 ${n} urcă pe locul ${r}. Cineva a prins liftul.`,
  (n,r)=>`📈 ${n} avansează — locul ${r}. Pericolul se apropie de top.`,
  (n,r)=>`🏃 ${n} la pas rapid: locul ${r}.`,
  (n,r)=>`⚡ ${n} accelerează. Locul ${r}.`,
  (n,r)=>`🧨 ${n} direct la locul ${r}. Motor ascuns.`,
  (n,r)=>`🌊 ${n} val după val. Locul ${r}.`,
  (n,r)=>`🔥 ${n} arde: locul ${r}. Rivalii simt.`,
  (n,r)=>`🛸 ${n} decolat. Locul ${r}.`,
  (n,r)=>`🦅 ${n} planează sus: locul ${r}.`,
  (n,r)=>`🧗 ${n} escaladează: locul ${r}.`,
  (n,r)=>`🎯 ${n} urcă metodic — locul ${r}.`,
  (n,r)=>`🪄 ${n} a scos magia: locul ${r}.`,
  (n,r)=>`🌟 ${n} strălucește: locul ${r}.`,
  (n,r)=>`🏋️ ${n} ridică greutăți: locul ${r}.`,
  (n,r)=>`🎪 ${n} în scenă: locul ${r}.`,
  (n,d,r)=>`🧨 ${n} sare ${d} locuri direct la ${r}.`,
  (n,d,r)=>`🚀 ${n} urcă ${d} poziții — locul ${r}. Periculos.`,
  (n,d,r)=>`⚡ ${n} salt de ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`📈 ${n}: +${d} locuri, pe ${r}.`,
  (n,d,r)=>`🏃 ${n} recuperează ${d} locuri. Pe ${r}.`,
  (n,d,r)=>`🌊 ${n} spală ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`🎯 ${n}: ${d} locuri dintr-un foc. Locul ${r}.`,
  (n,d,r)=>`🛸 ${n}: teleportare ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`🦁 ${n}: ${d} locuri urcat, pe ${r}.`,
  (n,d,r)=>`🔥 ${n}: ardere de ${d} locuri. Locul ${r}.`,
  n=>`🚀 ${n} urcă. Momentul lui.`,n=>`📈 ${n} în ascensiune.`,n=>`⚡ ${n} accelerează.`,
  n=>`🔥 ${n} arde în clasament.`,n=>`🏃 ${n} aleargă în sus.`,n=>`🌊 ${n} val după val.`,
  n=>`🧗 ${n} urcă mereu.`,n=>`🦅 ${n} planează sus.`,n=>`🌟 ${n} strălucește.`,
  n=>`🎯 ${n} lovește metodic.`,n=>`🎸 ${n} dă solosul clasamentului.`,
  n=>`🦊 ${n} e viclean: urcă pe nevăzute.`,n=>`🏄 ${n} surfează pe val.`,
  n=>`🧘 ${n} urcă calm.`,n=>`⚽ ${n} marchează în clasament.`,
  n=>`🏅 ${n} în ascensiune. Medalia se apropie.`,n=>`💪 ${n} ridică greutatea clasamentului.`,
  n=>`🌋 ${n}: erupție în clasament.`,n=>`🎪 ${n} face spectacol și urcă.`,
  n=>`🌀 ${n} în spirală ascendentă.`,n=>`🔮 ${n} vede viitorul: e sus.`,
  n=>`🧲 ${n} atrage locurile bune.`,n=>`🎈 ${n} se ridică ușor.`,
  n=>`🌤️ ${n} iese din umbră și urcă.`,n=>`🦁 ${n} în ascensiune.`,
  n=>`🔑 ${n} a găsit cheia clasamentului.`,n=>`🎯 ${n} în centrul clasamentului.`,
  n=>`⚡ ${n}: fulger în clasament.`,n=>`🧊 ${n} rece și calculat. Urcă.`,
  n=>`🌞 ${n} zilei: în ascensiune.`,n=>`🏆 ${n} simte podiumul.`,
  n=>`🚁 ${n} se ridică.`,n=>`🌱 ${n} crește în clasament.`,
  n=>`🎵 ${n}: melodia clasamentului e în sus.`,n=>`🧩 ${n} asamblează piesele.`,
  n=>`📡 ${n} captează semnalul bun.`,n=>`🎗️ ${n} legat de vârf.`,
  n=>`🏹 ${n} tras în sus.`,n=>`🦢 ${n} elegant în ascensiune.`,
  n=>`🌸 ${n} înflorește.`,n=>`🍀 ${n} are noroc și locuri bune.`,
  n=>`🌻 ${n} crește spre lumină.`,n=>`🏔️ ${n} urcă muntele clasamentului.`,
  n=>`🎡 ${n} la vârf cu roata norocului.`,n=>`🦋 ${n} transformare în clasament.`,
  n=>`🌈 ${n} la capătul curcubeului.`,n=>`🏄 ${n} surfează frumos.`,
  n=>`🎖️ ${n} merită locul obținut.`,n=>`🌍 ${n} pe harta clasamentului: sus.`,
  n=>`💎 ${n}: diamant în clasament. Urcă la suprafață.`,
  n=>`🏰 ${n} urcă spre top cu pași siguri.`,
  n=>`🎠 ${n} pe caruselul ascendent.`,
  n=>`🌴 ${n} crește înalt în clasament.`,
  n=>`🔭 ${n} vizionează locuri mai bune.`,
  n=>`⛰️ ${n} escaladează clasamentul.`,
];

const T_DOWN=[
  (n,r)=>`📉 ${n} coboară la locul ${r}. Clasamentul nu iartă.`,
  (n,r)=>`😬 ${n}: locul ${r}. Nu e criză, dar nici vacanță nu e.`,
  (n,r)=>`🪦 ${n} coboară. Locul ${r}.`,
  (n,r)=>`💀 ${n} la locul ${r}. Urgent: predicție bună.`,
  (n,r)=>`🌧️ ${n} primește ploaie: locul ${r}.`,
  (n,r)=>`😮‍💨 ${n} pierde teren. Locul ${r}.`,
  (n,r)=>`🐢 ${n} prea lent. Locul ${r}.`,
  (n,r)=>`🎭 ${n} în drama clasamentului: locul ${r}.`,
  (n,r)=>`🌪️ ${n} luat de vânt: locul ${r}.`,
  (n,r)=>`🔇 ${n}: locul ${r}. Tăcere în tabără.`,
  (n,d,r)=>`📉 ${n} coboară ${d} locuri — locul ${r}.`,
  (n,d,r)=>`😬 ${n} pierde ${d} poziții. Locul ${r}.`,
  (n,d,r)=>`🌧️ ${n}: ${d} locuri pierdute, pe ${r}.`,
  (n,d,r)=>`🪦 ${n} coboară ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`💀 ${n}: -${d} locuri, pe ${r}.`,
  (n,d,r)=>`🎭 ${n} pierde ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`🌪️ ${n}: furtuna clasamentului: ${d} locuri, pe ${r}.`,
  (n,d,r)=>`🔇 ${n}: ${d} locuri pierdute, locul ${r}.`,
  (n,d,r)=>`🐢 ${n} înapoi ${d} locuri. Locul ${r}.`,
  (n,d,r)=>`😮‍💨 ${n} pierde ${d} locuri. Locul ${r}.`,
  n=>`📉 ${n} coboară. Meciul următor e decisiv.`,n=>`😬 ${n} pierde teren.`,
  n=>`🌧️ ${n} primește ploaie în clasament.`,n=>`🪦 ${n} mai coboară.`,
  n=>`💀 ${n} are nevoie de puncte urgent.`,n=>`🌪️ ${n} luat de vânt.`,
  n=>`🎭 ${n} în drama clasamentului.`,n=>`🔇 ${n} pierde tăcut.`,
  n=>`🐢 ${n} prea lent față de restul.`,n=>`😮‍💨 ${n}: un oftat și un loc pierdut.`,
  n=>`🌑 ${n} coboară în umbră.`,n=>`🚫 ${n}: locul coboară.`,
  n=>`🎲 ${n} dă zarul greșit.`,n=>`🌊 ${n} înecat de val.`,
  n=>`🔩 ${n} are șuruburi lipsă.`,n=>`📵 ${n}: semnal slab.`,
  n=>`🌵 ${n} supraviețuiește dar coboară.`,n=>`🗑️ ${n} aruncă locul.`,
  n=>`🧊 ${n} îngheață în clasament.`,n=>`🎯 ${n} ratează și coboară.`,
  n=>`🌫️ ${n} în ceața clasamentului.`,n=>`🎪 ${n} în circul coborârii.`,
  n=>`🌀 ${n} în spirală descendentă.`,n=>`🔋 ${n}: baterie moartă.`,
  n=>`🎻 ${n}: note false, loc pierdut.`,n=>`🕸️ ${n} prins în pânza greșelilor.`,
  n=>`🎈 ${n}: balonul s-a dezumflat.`,n=>`📦 ${n}: livrare eșuată.`,
  n=>`🧶 ${n}: totul s-a destrămat.`,n=>`🌋 ${n}: erupție negativă.`,
  n=>`🏜️ ${n}: deșert de puncte.`,n=>`🌙 ${n}: noaptea clasamentului.`,
  n=>`🍂 ${n}: toamna clasamentului.`,n=>`🥀 ${n}: floare veștejită.`,
  n=>`🌬️ ${n}: vântul a suflat locul.`,n=>`🔮 ${n}: globul arată jos.`,
  n=>`🎵 ${n}: melodia clasamentului e în jos.`,n=>`🧩 ${n}: piesele nu se potrivesc.`,
  n=>`🌐 ${n}: orbită descendentă.`,n=>`🏔️ ${n} coboară muntele.`,
  n=>`🎠 ${n} pe caruselul descendent.`,n=>`🦢 ${n}: eleganta e jos.`,
  n=>`🌍 ${n} pe hartă: jos.`,n=>`🎡 ${n} la vale cu roata.`,
  n=>`🦋 ${n}: transformare nedorită.`,n=>`🌊 ${n} sub val.`,
  n=>`🧲 ${n} atrage locuri proaste.`,n=>`🌱 ${n}: plantă călcată.`,
  n=>`🎖️ ${n}: medaliile se duc.`,n=>`🏹 ${n}: săgeată în jos.`,
  n=>`💔 ${n}: inima clasamentului s-a frânt.`,
  n=>`🏚️ ${n}: casa clasamentului s-a dărâmat.`,
  n=>`🌑 ${n}: eclipse de clasament.`,
  n=>`🥀 ${n}: frumusețea clasamentului s-a ofilit.`,
  n=>`🔒 ${n}: blocat pe locuri din ce în ce mai jos.`,
  n=>`🎻 ${n}: solosul clasamentului e în minor.`,
  n=>`🌫️ ${n}: ceața înconjoară locul pierdut.`,
  n=>`📌 ${n}: prins în locul rău.`,
  n=>`🔩 ${n}: roata clasamentului s-a blocat jos.`,
  n=>`🌊 ${n}: sub valurile clasamentului.`,
];

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

  // Context teams — only these get country facts
  const ctxTeams=new Set();
  const finishedMatches=[...matches.filter(m=>m.isFinished)]
    .sort((a,b)=>new Date(b.time)-new Date(a.time));

  finishedMatches.forEach(m=>{if(_isWCM6(m)){ctxTeams.add(_n6(m.teamA));ctxTeams.add(_n6(m.teamB));}});
  matches.filter(m=>m.isLive&&_isWCM6(m)).forEach(m=>{ctxTeams.add(_n6(m.teamA));ctxTeams.add(_n6(m.teamB));});
  matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM6(m)&&isToday(m.time))
    .forEach(m=>{ctxTeams.add(_n6(m.teamA));ctxTeams.add(_n6(m.teamB));});
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM6(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];
  if(nextMatch){ctxTeams.add(_n6(nextMatch.teamA));ctxTeams.add(_n6(nextMatch.teamB));}

  const ctxFact=(team,seed=0)=>{
    const canon=_n6(team);
    if(!_isOff6(team)||!ctxTeams.has(canon))return null;
    const f=CF6[canon];if(!f)return null;
    const all=[...(f.football||[]),...(f.culture||[]),...(f.funny||[])];
    return all.length?_p6(all,canon,seed):null;
  };

  // BLOCK 1 — LIVE (priority 11)
  matches.filter(m=>m.isLive).forEach(m=>{
    const sA=m.realScoreA??0,sB=m.realScoreB??0;
    const parts=[];
    if(m.liveMinute!=null)parts.push(`min. ${m.liveMinute}'`);
    if(m.homeScorers)parts.push(`⚽ ${m.teamA}: ${m.homeScorers}`);
    if(m.awayScorers)parts.push(`⚽ ${m.teamB}: ${m.awayScorers}`);
    if(m.liveCards)parts.push(`🟨 ${m.liveCards}`);
    if(m.liveCorners)parts.push(`🚩 ${m.liveCorners}`);
    const detail=parts.length?` — ${parts.join(' · ')}`:'';
    ev('live',`🔴 LIVE: ${m.teamA} ${sA}–${sB} ${m.teamB}${detail}`,11);
    if(sA>sB) ev('live_hype',`🔥 ${m.teamA} apără avantajul de ${sA-sB}. ${m.teamB} aleargă.`,10);
    else if(sB>sA) ev('live_hype',`🔥 ${m.teamB} conduce cu ${sB-sA}. ${m.teamA} în recuperare.`,10);
    else ev('live_hype',`⚖️ Egal ${sA}-${sB}. ${m.teamA} vs ${m.teamB} — totul e posibil.`,10);
    const fact=ctxFact(m.teamA,m.id)||ctxFact(m.teamB,m.id+99);
    if(fact)ev('fact',fact,3);
  });

  // BLOCK 2 — FINISHED MATCHES (newest first)
  let roundTopUid=null,roundTopPts=0,roundTopMatch=null;

  finishedMatches.forEach((match,matchIdx)=>{
    const recency=matchIdx===0?2:matchIdx===1?1:0;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const totalGoals=sA+sB;
    const isWC=_isWCM6(match);
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const top=[...mp].sort((a,b)=>b.pts-a.pts)[0];
    if(top&&top.pts>roundTopPts){roundTopPts=top.pts;roundTopUid=top.uid;roundTopMatch=match;}

    const BASE=8+recency;

    // Exact scores
    if(exact.length===1){
      ev('exact',_c6(T_EXACT,[exact[0].nick,match.id,'ex'],exact[0].nick,mName),BASE+2);
    }else if(exact.length===2){
      ev('exact',`🎯 ${exact[0].nick} și ${exact[1].nick} au nimerit amândoi scorul exact la ${mName}. Conspirație sau talent?`,BASE+2);
    }else if(exact.length>=3){
      ev('exact',`🎯 ${exact.length} jucători au prins scorul exact la ${mName}. Haos total.`,BASE+2);
    }

    // Match stories
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const totalCorners=rCornT??(rCornH!=null&&rCornA!=null?rCornH+rCornA:null);

    if(totalGoals>=5)
      ev('match_story',_c6([
        m=>`🎆 ${m}: ${totalGoals} goluri. Apărătorii au stat acasă.`,
        m=>`💥 ${m} a explodat. Portarii au avut o seară grea.`,
        m=>`🌊 ${m}: val de ${totalGoals} goluri. Cine a prezis scor mare a câștigat.`,
        m=>`🔥 ${m}: infern de goluri. Clasamentul s-a răsturnat.`,
        m=>`🎪 ${m}: circ de goluri — ${totalGoals} la număr.`,
      ],[match.id,'hi'],mName),BASE+1);
    else if(totalGoals===0)
      ev('match_story',_c6([
        m=>`🧱 ${m}: 0-0. Portarii au câștigat runda. Atacanții, mai puțin.`,
        m=>`🔒 ${m}: lacăt pe lacăt. Niciun gol, multă tensiune.`,
        m=>`😴 ${m} s-a terminat 0-0. Cine a pus egal: erou tăcut.`,
      ],[match.id,'z'],mName),BASE);
    else if(totalGoals<=1)
      ev('match_story',_c6([
        m=>`🛡️ ${m}: meci de rezistență. Apărările au câștigat.`,
        m=>`💤 ${m}: un singur gol a decis totul.`,
        m=>`🐢 ${m}: lent și chinuitor. Cel cu 1-0 e erou discret.`,
      ],[match.id,'lo'],mName),BASE);

    if(rCards!=null&&rCards>=6)
      ev('match_story',_c6([
        (m,c)=>`🟥 ${m}: ${c} cartonașe. Arbitrul a lucrat ore suplimentare.`,
        (m,c)=>`🟨 ${m}: diplomație eșuată. ${c} cartonașe distribuite.`,
        (m,c)=>`🚨 ${m}: ${c} cartonașe. Era mai sigur să stai în tribună.`,
        (m,c)=>`😬 ${m}: ${c} cartonașe. Meciul s-a jucat pe nervi.`,
      ],[match.id,'cards'],mName,rCards),BASE);

    if(totalCorners!=null&&totalCorners>=12)
      ev('match_story',_c6([
        (m,c)=>`🚩 ${m}: ${c} cornere. Atacanții au iubit linia de fund.`,
        (m,c)=>`🏁 ${m}: ${c} cornere totale. Meciul a trăit la margine.`,
      ],[match.id,'corn'],mName,totalCorners),BASE-1);

    if(match.homeScorers||match.awayScorers){
      const parts=[];
      if(match.homeScorers)parts.push(`${match.teamA}: ${match.homeScorers}`);
      if(match.awayScorers)parts.push(`${match.teamB}: ${match.awayScorers}`);
      ev('scorers',`⚽ Marcatori la ${mName}: ${parts.join(' · ')}`,BASE);
    }

    if(mp.length>=3&&mp.filter(p=>p.ok).length===0)
      ev('upset',_c6([
        m=>`😱 ${m} — nimeni nu a prezis corect rezultatul. Fotbalul râde de statistici.`,
        m=>`🥶 ${m}: zero predicții corecte. Rezultat de nișă.`,
        m=>`🎲 ${m}: toată lumea a greșit. Fotbalul câștigă.`,
      ],[match.id,'up'],mName),BASE);

    // Near miss 1 goal
    if(exact.length===0){
      let nearNick=null;
      Object.entries(allPredictions).forEach(([uid,up])=>{
        const p=up[match.id]||up[String(match.id)];if(!p)return;
        if(Math.abs(Number(p.scoreA)-sA)+Math.abs(Number(p.scoreB)-sB)===1)nearNick=nickOf(uid);
      });
      if(nearNick)ev('near',`💔 ${nearNick} — la un gol de scor exact la ${mName}.`,BASE-1);
    }

    // Near miss 1 card
    if(exact.length>0&&rCards!=null){
      const nc=exact.find(p=>p.pCards!=null&&Math.abs(p.pCards-rCards)===1);
      if(nc)ev('near',`🟨 ${nc.nick} — scor exact la ${mName} dar un cartonaș a stricat perfectul.`,BASE-1);
    }

    // Absurd cards
    mp.forEach(p=>{
      if(p.pCards!=null&&p.pCards>=15)
        ev('fun',`🚨 ${p.nick} a pus ${p.pCards} cartonașe la ${mName}. Nu e meci, e apocalipsă cu fluier.`,4);
    });

    // Zero points
    const zeroes=mp.filter(p=>p.pts===0);
    if(zeroes.length===1)ev('miss',_c6(T_ZERO,[zeroes[0].uid,match.id,'z'],zeroes[0].nick,mName),BASE-2);

    // Country facts — WC + contextual + max 3 recent matches
    if(isWC&&matchIdx<3){
      [match.teamA,match.teamB].forEach((team,idx)=>{
        const fact=ctxFact(team,match.id+idx*100);
        if(fact)ev('fact',fact,3+(matchIdx===0?1:0));
      });
      [match.teamA,match.teamB].forEach((team,idx)=>{
        const star=ST6[_n6(team)];
        if(star&&idx===0)ev('star',`⭐ ${star} a jucat azi pentru ${_n6(team)}.`,3);
      });
    }
  });

  // Round best scorer
  if(finishedMatches.length>=2&&roundTopUid&&roundTopPts>0)
    ev('best_round',`🏅 ${nickOf(roundTopUid)} câștigă runda cu ${roundTopPts} pts la ${roundTopMatch.teamA} vs ${roundTopMatch.teamB}.`,7);

  // BLOCK 3 — PRE-MATCH
  const T_PRE=[
    (a,b)=>`🔥 Azi avem ${a} – ${b}. 90 de minute, orgolii și clasament.`,
    (a,b)=>`⚽ ${a} vs ${b} azi. Cine se aruncă la scor mare poate muri frumos.`,
    (a,b)=>`🏟️ ${a} – ${b}: genul de meci care face victime în clasament.`,
    (a,b)=>`📺 Dacă ai pus 0-0 la ${a} – ${b}, ai nevoie de curaj.`,
    (a,b)=>`🎯 ${a} – ${b}: scor exact azi = 100 puncte și o săptămână de lăudăroșenie.`,
    (a,b)=>`🧠 ${a} – ${b}: simplu până alegi cartonașele. Acolo începe depresia.`,
    (a,b)=>`🧨 ${a} – ${b} miroase a scor care păcălește jumătate de grup.`,
    (a,b)=>`🥶 ${a} – ${b}: un gol în minutul 90 îți strică somnul.`,
    (a,b)=>`🎲 La ${a} – ${b}, cine ghicește cartonașele merită respect.`,
    (a,b)=>`🌪️ ${a} – ${b}: un 1-0 plictisitor rupe clasamentul.`,
  ];

  const todayOfficial=matches.filter(m=>_isWCM6(m)&&!m.isFinished&&!m.isLive&&isToday(m.time));
  todayOfficial.slice(0,2).forEach(m=>{
    ev('preview',_c6(T_PRE,[m.id,'pre'],m.teamA,m.teamB),2);
    [m.teamA,m.teamB].forEach((team,idx)=>{
      const fact=ctxFact(team,m.id+idx*200);if(fact)ev('fact',fact,2);
      const star=ST6[_n6(team)];
      if(star&&idx===0)ev('star',`⭐ De urmărit: ${star} pentru ${_n6(team)}. Dacă prinde ziua bună, jumătate din predicții se duc.`,2);
    });
  });
  if(nextMatch&&todayOfficial.length===0){
    ev('preview',_c6(T_PRE,[nextMatch.id,'nxt'],nextMatch.teamA,nextMatch.teamB),2);
    [nextMatch.teamA,nextMatch.teamB].forEach((team,idx)=>{
      const fact=ctxFact(team,nextMatch.id+idx*300);if(fact)ev('fact',fact,2);
    });
  }

  // BLOCK 4 — LEADERBOARD DRAMA
  const hasPrev=prevLeaderboard.length>0;let rankCount=0;
  if(hasPrev&&n>=2){
    leaderboard.forEach(entry=>{
      if(rankCount>=4)return;
      const prev=prevLeaderboard.find(p=>p.nickname===entry.nickname);if(!prev)return;
      const delta=prev.rank-entry.rank,nick=entry.nickname;
      if(entry.rank===1&&prev.rank>1){
        const d=prevLeaderboard.find(p=>p.rank===1)?.nickname||'?';
        ev('lead',_c6([(n,p)=>`👑 ${n} l-a depășit pe ${p} și a urcat pe locul 1.`,(n,p)=>`🏆 Schimbare la vârf: ${n} detronează pe ${p}.`,(n,p)=>`🍾 ${n} a pus șampania la rece. ${p} recalculează.`],[nick,d,'ld'],nick,d),11);rankCount++;
      }
      if(prev.rank===1&&entry.rank>1&&rankCount<4){ev('fall',`😬 ${nick} pierde primul loc — locul ${entry.rank}.`,10);rankCount++;}
      if(entry.rank<=3&&prev.rank>3&&rankCount<4){ev('top3',`🚀 ${nick} intră în Top 3! Locul ${entry.rank}.`,9);rankCount++;}
      if(entry.rank>3&&prev.rank<=3&&rankCount<4){ev('top3_exit',`🥉 ${nick} iese din Top 3 — locul ${entry.rank}.`,9);rankCount++;}
      if(delta>=3&&entry.rank>1&&rankCount<4){ev('rank_up',_c6(T_UP,[nick,delta,entry.rank,'up'],nick,delta,entry.rank),8);rankCount++;}
      else if(delta===2&&entry.rank>1&&rankCount<4){ev('rank_up',_c6(T_UP,[nick,entry.rank,'up2'],nick,entry.rank),7);rankCount++;}
      if(delta<=-2&&rankCount<4){ev('rank_down',_c6(T_DOWN,[nick,Math.abs(delta),entry.rank,'dn'],nick,Math.abs(delta),entry.rank),7);rankCount++;}
    });
    const L=leaderboard[0],S=leaderboard[1],pL=prevLeaderboard[0],pS=prevLeaderboard[1];
    if(L&&S&&pL&&pS){
      const gap=L.points-S.points,prevGap=pL.points-pS.points;
      if(gap>prevGap&&gap>=20)ev('gap',`👑 ${L.nickname} extinde avantajul la ${gap} puncte față de ${S.nickname}.`,7);
      else if(gap<prevGap&&gap>0&&gap<=15)ev('chase',`⚔️ ${S.nickname} se apropie! Doar ${gap} puncte până la ${L.nickname}.`,8);
    }
  }

  // BLOCK 5 — STANDINGS
  if(n>=2){
    const leader=leaderboard[0],last=leaderboard[n-1];
    leaderboard.forEach(entry=>{
      const es=entry.exactScores||0;
      if(es>=5)ev('streak',`🔥 ${entry.nickname} are ${es} scoruri exacte. Joacă pe altă planșetă.`,8);
      else if(es>=3)ev('streak',`🎯 ${entry.nickname}: ${es} scoruri exacte. Nu e noroc, e sistem.`,5);
    });
    if(n>=3){const third=leaderboard[2],spread=leader.points-third.points;
      if(spread<=20&&spread>=0&&leader.points>0)ev('drama',`⚔️ ${spread} puncte despart locul 1 de locul 3. Orice e posibil.`,6);}
    [50,100,150,200,300,500].forEach(m=>{const diff=m-leader.points;
      if(diff>0&&diff<=15)ev('milestone',`🔥 ${leader.nickname} e la ${diff} puncte de borna ${m}!`,5);});
    if(n>=4&&last.points===0)ev('fun',`🫣 ${last.nickname} are 0 puncte. Turneul abia a început — sau nu?`,2);
  }

  // FINAL — Dedup, sort, anti-spam
  // Content mix: max 4 prediction-banter (30%), rest is match/facts/context (70%)
  const seen=new Set();
  const deduped=events
    .filter(e=>{if(seen.has(e.text))return false;seen.add(e.text);return true;})
    .sort((a,b)=>(b.priority-a.priority)||(b.ts-a.ts));

  const BANTER=new Set(['exact','zero','near','miss','fun']);
  const FILLER=new Set(['fact','star','preview','milestone','fun','best_round']);
  const playerCount={};const tc={};const result=[];

  for(const e of deduped){
    if(result.length>=12)break;
    if(BANTER.has(e.type)&&[...BANTER].reduce((s,t)=>s+(tc[t]||0),0)>=4)continue;
    if(FILLER.has(e.type)&&[...FILLER].reduce((s,t)=>s+(tc[t]||0),0)>=4)continue;
    if(e.type==='drama'&&(tc.drama||0)>=1)continue;
    const r2=result.slice(-2).map(x=>x.type);
    if(r2.length===2&&r2[0]===e.type&&r2[1]===e.type)continue;
    let pm=null;
    leaderboard.forEach(p=>{if(e.text.includes(p.nickname))pm=p.nickname;});
    if(pm){const pc=playerCount[pm]||0;if(pc>=2&&e.type!=='exact')continue;playerCount[pm]=pc+1;}
    result.push(e);tc[e.type]=(tc[e.type]||0)+1;
  }
  for(const e of deduped){if(result.length>=12)break;if(!result.find(x=>x.id===e.id))result.push(e);}
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
