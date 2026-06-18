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
  "Africa de Sud":["Vuvuzela e invenție sud-africană. În 2010 a scos din minți o planetă. Scuze, n-au dat.", "Pinguinii trăiesc pe plajă în Cape Town. Mă, nu pe gheață. Pe plajă.", "Bafana Bafana înseamnă băieții băieților. Numele e mai curajos decât rezultatele de obicei.", "Africa de Sud are 11 limbi oficiale. Pentru un cartonaș galben, ai 11 variante de protest."],
  "Algeria":["Algeria a eliminat Germania la CM 2014. Nimeni n-a văzut-o venind. Nici Algeria, probabil.", "Algeria e cea mai mare țară din Africa. 85% e Sahara. Restul e suficient pentru fotbal.", "Algeria a luat CAN 2019 fără să piardă vreun meci. Portarul a primit mai puține goluri decât ore de somn."],
  "Anglia":["Anglia a inventat fotbalul. A câștigat un singur Mondial. Inventator de geniu, executor modest.", "Football's coming home de prin '96. Tot n-a venit. Adresa s-a schimbat, probabil.", "Lineker n-a primit niciun cartonaș în carieră. Sfânt pe teren, obraznic la TV."],
  "Arabia Saudita":["Arabia Saudită a bătut Argentina la CM 2022. Messi a stat 5 minute pe bancă fără să clipească.", "Al-Nassr îi plătește lui Ronaldo cam 200 de milioane pe an. Bani sunt, trofee — în formare."],
  "Argentina":["Maradona a dat Mâna lui Dumnezeu și Golul Secolului în același meci. Două legende dintr-un foc.", "Messi a plâns pe teren după CM 2022. Au plâns și ăia care pierduseră cu Argentina.", "Buenos Aires are cea mai mare densitate de psihologi din lume. Fotbalul explică o treime din ședințe."],
  "Australia":["Australia a pierdut un război contra unor păsări. Da, chiar așa. Emu Wars, 1932.", "Australia a bătut Argentina la penaltii la CM 2022. Messi n-a ratat. Australia a câștigat tot.", "Sunt mai mulți canguri decât oameni în Australia. Pe teren, echipa e tot atât de imprevizibilă."],
  "Austria":["Salzburg nu pare club, pare pepinieră cu nocturnă. Haaland, Mané, Upamecano — toți au trecut pe acolo.", "Red Bull e austriac. Cafeina și ambiția au același portofel."],
  "Belgia":["Belgia a stat 3 ani pe locul 1 FIFA. Titlu major luat în acea perioadă: zero. Dosar de deschis.", "Belgia a stat 541 de zile fără guvern. Fotbalul a mers tot timpul. Țara — mai cu emoții.", "Belgia a bătut Brazilia în sferturi la CM 2018. Generația de aur s-a justificat o singură dată."],
  "Bosnia":["Bosnia a fost la primul Mondial în 2014. Džeko a marcat la primul meci. Fotbalul n-a stat la coadă.", "Bosnia are 3 președinți în rotație. Mai complicat decât orice apărare din zonă."],
  "Brazilia":["Brazilia are 5 Mondiale. Unele naționale încă încearcă să ajungă la primul.", "7-1 cu Germania în 2014, pe teren propriu. N-au înțeles ce se întâmplă la timp.", "Pelé a luat 3 Mondiale la 17, 21 și 29 de ani. Altcineva n-a mai zis asta."],
  "Canada":["Canada are mai multe lacuri decât restul lumii la un loc. Apa nu-i problema lor.", "Davies s-a născut în tabără de refugiați, a crescut în Canada, valorează 70 de milioane la Bayern."],
  "Capul Verde":["În Capul Verde sunt mai mulți capverdieni în afara țării decât în țară.", "Capul Verde nu are râuri permanente. Zero. Și totuși au pus echipă pe teren.", "Capul Verde a eliminat Maroc la CAN 2021. Favoritul clar. Surpriza turneului."],
  "Cehia":["Panenka a inventat lovitura cu chip la Euro '76. Faimă eternă dintr-o secundă de curaj.", "Cehia bea mai multă bere decât orice altă țară. Prioritățile, clare."],
  "Coasta de Fildes":["Drogba a negociat un armistițiu în războiul civil de acasă. Fotbalul a oprit un conflict. Mă, la propriu.", "Coasta de Fildes scoate 40% din cacaoul mondial. Ciocolata din toată lumea are rădăcini acolo."],
  "Columbia":["James Rodríguez a luat Gheata de Aur la CM 2014. A venit din neant și a plecat cu trofeul.", "Valderrama avea părul ăla afro la 3 Mondiale. Coafura mai faimoasă decât unele pase."],
  "Coreea de Sud":["Coreea de Sud a fost în semifinale la CM 2002. A eliminat Spania și Italia pe drum.", "Son a luat Gheata de Aur în Premier League fără să bată un penalti. Curat."],
  "Croatia":["Croatia a luat locul 2 la CM 2018. 4 milioane de oameni, rezultate de țară mare.", "Modrić a luat Balonul de Aur 2018. Primul altul decât Messi sau Ronaldo în 10 ani."],
  "Curacao":["Curaçao are 150.000 de locuitori. Mai puțin decât un cartier din Cluj. Și totuși, la Mondial.", "Curaçao a eliminat Costa Rica la baraj. Victorie istorică pentru 150.000 de oameni."],
  "Ecuador":["Ecuador a deschis CM 2022 cu 2-0 contra gazdei Qatar. Gazda n-a mai câștigat după aceea.", "Quito e la 2.850 m altitudine. Adversarii vin și nu mai respiră normal câteva zile."],
  "Egipt":["Egipt are 7 Cupe ale Africii. Restul continentului încă recuperează cu pixul în mână.", "Cleopatra este mai aproape de noi decât de construirea piramidelor.", "Salah a marcat 200+ goluri pentru Liverpool. Orașul i-a pus porecla Egyptian King. Pe merite."],
  "Elvetia":["Elveția a eliminat Franta la Euro 2020, de la 1-3, la penaltii. Franta nu știa că trebuia să fie îngrijorată.", "Ceasurile elvețiene sunt referință mondială la precizie. Portarul lor, nu mai puțin precis."],
  "Franta":["Mbappé a dat hat-trick în finala CM 2022, în ultimele 8 minute. Franta a pierdut la penaltii totuși.", "Zidane a dat cu capul în Materazzi la ultimul meci oficial. Cap de aur, cap de foc."],
  "Germania":["Germania are 4 titluri mondiale și obiceiul de a apărea exact când contează.", "7-1 cu Brazilia în semifinale, 2014. Cel mai mare șoc din istoria turneului."],
  "Ghana":["Ghana a ratat semifinala CM 2010 la penaltii cu Uruguay. Suárez a blocat cu mâna pe linie.", "Gyan e golgheterul african all-time la Mondiale. A și ratat penaltiul decisiv în 2010."],
  "Haiti":["Haiti a fost prima republică neagră din lume, în 1804.", "Haiti a jucat fotbal internațional și în perioade de criză. Nu s-a oprit niciodată complet."],
  "Iordania":["Iordania are Marea Moartă — cel mai jos punct de pe Pământ.", "Wadi Rum arată atât de extraterestru încât Hollywood-ul l-a folosit pe post de Marte."],
  "Irak":["Irak a luat Cupa Asiei 2007, în plină instabilitate politică. Fotbalul a unit când nimic altceva nu putea.", "Radhi a marcat singurul gol al Irakului la un Mondial, '86, contra Belgiei. Legendă din acel moment."],
  "Iran":["Iran a luat Cupa Asiei de 3 ori la rând. Dominanță regională, fără glumă.", "Taremi a marcat o foarfecă spectaculoasă contra Angliei la CM 2022."],
  "Japonia":["Japonia are automate pentru aproape orice. Dacă pierzi meciul, măcar găsești o cafea.", "Japonia a eliminat Germania și Spania la CM 2022. Ambele conduceau la pauză. Japonia n-a primit memo-ul."],
  "Maroc":["Maroc a fost prima echipă africană în semifinale de Mondial, 2022. Milioane au plâns de bucurie acasă.", "Hakimi a marcat penaltiul decisiv contra Spaniei cu Panenka. Curaj rar la cel mai important meci al carierei."],
  "Mexic":["Mexic n-a trecut niciodată de sferturi la un Mondial. Blestemul sferturilor e fenomen cultural acum.", "Azteca e singurul stadion cu 2 finale mondiale: 1970 și 1986."],
  "Norvegia":["Norvegia vine cu Haaland. Planul tactic încape pe un bilețel: găsiți-l pe băiatul mare.", "Haaland a marcat 36 de goluri într-un sezon de Premier League. Restul recalculează."],
  "Noua Zeelanda":["În Noua Zeelandă sunt atât de multe oi încât dacă toate mergeau la meci, oamenii rămâneau afară.", "All Blacks au 77% rată de victorie. La fotbal, mai lucrează."],
  "Olanda":["Cruyff a inventat fotbalul total. Olanda nu l-a câștigat niciodată pe Mondial.", "Van Basten a dat gol din unghi imposibil în finala Euro '88. Comentatorii au tăcut 3 secunde."],
  "Panama":["Panama s-a calificat la CM 2018 și toată țara a oprit treaba pentru meciul inaugural.", "Panama nu are armată permanentă din 1990. Are echipă de fotbal, totuși."],
  "Paraguay":["Chilavert, portarul paraguayan, a marcat 62 de goluri din penaltii și free-kick-uri. Record pentru portari.", "Paraguay e una din cele 2 țări sud-americane fără ieșire la mare. Tot au ajuns la Mondiale."],
  "Portugalia":["Ronaldo a marcat 128 de goluri pentru Portugalia. Record mondial pentru o națională.", "Eusébio a dat 9 goluri la CM '66. Portugalia a luat locul 3."],
  "Qatar":["Qatar a găzduit primul Mondial de iarnă, primul din Orientul Mijlociu.", "Qatar a ieșit din grupe fără victorie, ca gazdă. Primul caz din istoria turneului."],
  "RD Congo":["RD Congo revine la Mondial după 52 de ani. Cel mai lung interval de revenire din istoria turneului.", "Kinshasa e cel mai mare oraș francofon din lume, mai mare decât Paris."],
  "SUA":["SUA a înregistrat cea mai mare medie de spectatori per meci din istoria CM, în 1994.", "Pulisic a marcat golul calificant și a ieșit accidentat din teren. Sacrificiu de centru, literal."],
  "Scotia":["Scoția și Anglia au jucat primul meci internațional din istorie, 1872. Scor: 0-0.", "Denis Law a marcat golul care a retrogradat Anglia, '75. Cu călcâiul. A celebrat cu tristețe."],
  "Senegal":["Senegal a eliminat Franta campioana mondială la CM 2002. La primul meci.", "Mané a luat Premier League, Champions League și CAN. Definește generația de aur senegaleză."],
  "Spania":["Spania a luat Euro 2024 cu cei mai tineri jucători de start din istoria turneului final.", "Iniesta a dat golul finalei CM 2010 în prelungiri. A băut vin de la vie proprie după."],
  "Suedia":["Zlatan a dat o foarfecă absurdă de la 30 de metri contra Angliei. Comentatorul a rămas mut.", "Zlatan are 62 de goluri pentru Suedia. Nimeni nu se apropie să-l ia."],
  "Tunisia":["Tunisia a bătut Franta campioana mondială la CM 2022. Franta rotise lotul. Tunisia a jucat serios.", "Tunisia a fost prima echipă africană care a câștigat un meci la un Mondial, '78, contra Mexic."],
  "Turcia":["Hakan Şükür a marcat în 11 secunde la CM 2002. Cel mai rapid gol din istoria turneului.", "Istanbul e singurul oraș de pe Pământ pe două continente simultan."],
  "Uruguay":["Uruguay a bătut Brazilia pe Maracanã, 1950, în fața a 200.000 de oameni. Cel mai mare șoc din istoria fotbalului.", "Suárez a blocat cu mâna pe linie contra Ghanei la CM 2010. A plâns. Ghana a ratat penaltiul."],
  "Uzbekistan":["Uzbekistan e singura țară care locuiește într-un cartier unde toți vecinii se termină în «-stan».", "În Uzbekistan, pâinea e sacră. Nu se pune niciodată cu fața în jos."],
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
  (a,b,d,min)=>`🔴 ${a} conduce ${d}-0 la ${min}'. ${b} mai are timp — sau nu.`,
  (a,b,d,min)=>`🔴 ${a} ${d} sus la ${min}'. ${b} recalculează tactica din mers.`,
  (a,b,d,min)=>`🔴 ${d} gol${d>1?'uri':''} pentru ${a} la ${min}'. Portarul lui ${b} are o seară lungă.`,
  (a,b,d,min)=>`🔴 ${a} conduce cu ${d}. ${b} mai are ${90-min} minute să-și amintească de ce joacă fotbal.`,
];
const T_LIVE_FUNNY_AWAY=[
  (a,b,d,min)=>`🔴 ${b} conduce ${d}-0 la ${min}'. ${a} are nevoie de un miracol sau de un arbitru bun.`,
  (a,b,d,min)=>`🔴 ${b} ${d} sus la ${min}'. Cine a pus victoria gazdei — mai respiră?`,
  (a,b,d,min)=>`🔴 ${d} gol${d>1?'uri':''} pentru ${b} la ${min}'. ${a} nu a primit memo-ul.`,
  (a,b,d,min)=>`🔴 ${b} conduce cu ${d} la ${min}'. ${a} încă se uită după un colț de ieșire.`,
];
const T_LIVE_FUNNY_DRAW=[
  (a,b,min)=>`🔴 Egal la ${min}'. ${a} și ${b} se respectă prea mult sau nu se poate mai mult.`,
  (a,b,min)=>`🔴 0-0 la ${min}'. Cineva din grup a pus X cu inima. Stă și respiră rar.`,
  (a,b,min)=>`🔴 Egal la ${min}'. Portarii au muncit. Atacanții, mai puțin.`,
  (a,b,min)=>`🔴 ${a} – ${b}: 0-0 la ${min}'. Dacă rămâne egal, jumătate din grup o să zică că a știut.`,
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
    return (h%100)<22;
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
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  const liveMatches=matches.filter(m=>m.isLive);
  const latestFinished=finishedMatches.slice(0,3);
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM14(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];
  const todayOff=matches.filter(m=>_isWCM14(m)&&!m.isFinished&&!m.isLive&&isToday(m.time));

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

  // ── Collect curiosities (country facts) for pattern slots ────────────────────
  const curiosities=[];
  const usedCurTeams=new Set();
  const addCur=(team,seed)=>{
    const canon=_n14(team);
    if(usedCurTeams.has(canon))return;
    const f=ctxFact(team,seed);
    if(f){curiosities.push({type:'curiosity',text:`🌍 ${f}`});usedCurTeams.add(canon);}
  };
  liveMatches.forEach(m=>{addCur(m.teamA,m.id);addCur(m.teamB,m.id+50);});
  latestFinished.forEach(m=>{addCur(m.teamA,m.id+100);addCur(m.teamB,m.id+150);});
  if(nextMatch){addCur(nextMatch.teamA,nextMatch.id+200);addCur(nextMatch.teamB,nextMatch.id+250);}
  todayOff.slice(0,2).forEach(m=>{addCur(m.teamA,m.id+300);addCur(m.teamB,m.id+350);});

  // ── Collect standalone quotes for pattern slots ───────────────────────────────
  const standalonePool=T_CITE_STANDALONE.slice();
  const seenStandalone=new Set();
  const nextStandalone=(seed)=>{
    const idx=Math.abs(seed)%standalonePool.length;
    const shifted=standalonePool.slice(idx).concat(standalonePool.slice(0,idx));
    for(const s of shifted){if(!seenStandalone.has(s)){seenStandalone.add(s);return{type:'quote',text:s};}}
    return{type:'quote',text:shifted[0]};
  };

  // ── Build result array in fixed order ────────────────────────────────────────
  const result=[];
  const push=item=>{if(item&&result.length<20)result.push(item);};
  const pushCurQuotePair=(seed)=>{
    // pattern: country → quote → country → quote (intercalated, never 2 same type in a row)
    const c1=curiosities.shift();
    const q1=nextStandalone(seed);
    const c2=curiosities.shift();
    const q2=nextStandalone(seed+1);
    if(c1)push(c1);
    if(q1)push(q1);
    if(c2)push(c2);
    if(q2)push(q2);
  };

  // ── SLOT 1: LIVE (scor + mesaj funny în aceeași știre) ────────────────────────
  liveMatches.slice(0,1).forEach(m=>{
    const sA=m.realScoreA??0,sB=m.realScoreB??0;
    const min=m.liveMinute??45;
    const sc=m.homeScorers?m.homeScorers.split(',')[0].trim():'';
    let text;
    if(sA>sB){
      text=_call(T_LIVE_FUNNY_HOME,[m.id,'lh'],m.teamA,m.teamB,sA-sB,min);
    }else if(sB>sA){
      text=_call(T_LIVE_FUNNY_AWAY,[m.id,'la'],m.teamA,m.teamB,sB-sA,min);
    }else{
      text=_call(T_LIVE_FUNNY_DRAW,[m.id,'ld'],m.teamA,m.teamB,min);
    }
    if(sc)text+=` ⚽ ${sc}.`;
    push({type:'live',text});
  });

  // ── SLOTS 2-3: PREDICȚII din meciurile recente ────────────────────────────────
  let predSlots=0;
  for(const match of latestFinished){
    if(predSlots>=2)break;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const zeroes=mp.filter(p=>p.pts===0);
    const allSameOutcome=mp.length>=3&&new Set(mp.map(p=>p.pOutcome)).size===1;
    const soloX=mp.filter(p=>p.pOutcome==='X');
    const opposed=mp.filter(p=>p.pOutcome==='1');
    const opposedB=mp.filter(p=>p.pOutcome==='2');

    // Scor exact (1 jucător)
    if(exact.length===1&&predSlots<2){
      const nk=exact[0].nick;
      const text=_roll(nk,match.id,'mn-ex')
        ?_call(T_MAN_EXACT,[nk,match.id],nk)
        :_roll(nk,match.id,'ci-ex')
          ?_call(T_CITE_EXACT,[nk,match.id],nk)
          :_call(T_EXACT,[nk,match.id,'ex'],nk,mName);
      push({type:'exact',text});predSlots++;
    }
    // Scor exact (2+ jucători)
    else if(exact.length>=2&&predSlots<2){
      const names=exact.slice(0,3).map(e=>e.nick).join(' și ');
      push({type:'exact',text:_call(T_EXACT_MULTI,[names,match.id],names,mName)});predSlots++;
    }
    // Doi jucători cu predicții opuse
    else if(opposed.length>=1&&opposedB.length>=1&&predSlots<2){
      const nA=opposed[0].nick,nB=opposedB[0].nick;
      push({type:'banter',text:`🎯 ${nA} a pus ${match.teamA}, ${nB} a pus ${match.teamB}. Fotbalul a ales — și cineva a avut dreptate.`});
      predSlots++;
    }
    // Jucător solo cu X (egal)
    else if(soloX.length===1&&mp.length>=3&&predSlots<2){
      const nk=soloX[0].nick;
      push({type:'banter',text:_call(T_MAN_DRAW,[nk,match.id],nk)});predSlots++;
    }
    // Zero puncte (1 jucător)
    if(zeroes.length===1&&predSlots<2){
      const nk=zeroes[0].nick;
      const text=_roll(nk,match.id,'mn-z')
        ?_call(T_MAN_ZERO,[nk,match.id],nk)
        :_roll(nk,match.id,'ci-z')
          ?_call(T_CITE_ZERO,[nk,match.id],nk)
          :_call(T_ZERO,[zeroes[0].uid,match.id,'z'],nk,mName);
      push({type:'miss',text});predSlots++;
    }
    // Nimeni n-a nimerit rezultatul
    if(mp.length>=3&&mp.filter(p=>p.ok).length===0&&predSlots<2){
      push({type:'upset',text:`⚡ ${mName}: niciun jucător n-a prezis rezultatul. Fotbalul a câștigat runda singur.`});predSlots++;
    }
  }

  // ── SLOTS 4-7: 2 curiozități + 2 citate (intercalate) PRIMA rundă ────────────
  pushCurQuotePair(Date.now()%1000);

  // ── SLOTS 8-9: CLASAMENT ──────────────────────────────────────────────────────
  let lbAdded=0;
  if(n>=2){
    const L=leaderboard[0],S=leaderboard[1];
    const gap=L&&S?L.points-S.points:0;

    // Lider detașat fără schimbare de rang (permanent)
    if(lbAdded<2&&gap>=150){
      const text=_roll(L.nickname,'mn-lhx')
        ?_call(T_MAN_LEAD,[L.nickname,'lhx'],L.nickname)
        :_call(T_LEAD_HUGE,[L.nickname,gap,'lhx'],L.nickname,gap);
      push({type:'lead',text});lbAdded++;
    }
    // Cursă strânsă (permanent)
    else if(lbAdded<2&&gap>0&&gap<=20){
      const text=_roll(L.nickname,S.nickname,'ci-close')
        ?_call(T_CITE_CLOSE,[L.nickname,S.nickname,'cl'],L.nickname,S.nickname)
        :_call(T_GAPCHASE,[L.nickname,S.nickname,'gc'],L.nickname,S.nickname);
      push({type:'chase',text});lbAdded++;
    }

    if(prevLeaderboard.length>0){
      leaderboard.forEach(entry=>{
        if(lbAdded>=2)return;
        const prev=prevLeaderboard.find(p=>p.nickname===entry.nickname);if(!prev)return;
        const delta=prev.rank-entry.rank,nick=entry.nickname;
        // Lider nou
        if(entry.rank===1&&prev.rank>1){
          const gapNow=S?entry.points-S.points:0;
          let text;
          if(_roll(nick,'mn-lead'))text=_call(T_MAN_LEAD,[nick,'mnl'],nick);
          else if(gapNow>=100)text=_call(T_LEAD_HUGE,[nick,gapNow,'lh'],nick,gapNow);
          else if(gapNow>0&&gapNow<=30)text=_call(T_LEAD_CLOSE,[nick,gapNow,'lc'],nick,gapNow);
          else text=_call(T_LEAD,[nick,'lead'],nick);
          push({type:'lead',text});lbAdded++;
        }
        // Cădere de pe tron
        if(prev.rank===1&&entry.rank>1&&lbAdded<2){
          const text=_roll(nick,'mn-fall')
            ?_call(T_MAN_FALL,[nick,'mnf'],nick)
            :`📉 ${nick} a coborât de pe tron. "Ce a fost nu va mai fi."`;
          push({type:'fall',text});lbAdded++;
        }
        // Intrare top 3
        if(entry.rank<=3&&prev.rank>3&&lbAdded<2){
          push({type:'top3',text:`🏅 ${nick} a intrat în Top 3. Podiumul nu mai are loc liber.`});lbAdded++;
        }
        // Ieșire top 3
        if(entry.rank>3&&prev.rank<=3&&lbAdded<2){
          push({type:'top3_exit',text:`📉 ${nick} a ieșit din Top 3. Acum e pe locul ${entry.rank}.`});lbAdded++;
        }
        // Urcare mare
        if(delta>=3&&entry.rank>1&&lbAdded<2){
          const text=_roll(nick,'mn-rise')
            ?_call(T_MAN_RISE,[nick,delta,'mnr'],nick)
            :_roll(nick,'ci-rise')
              ?_call(T_CITE_RISE,[nick,'cir'],nick)
              :_call(T_UP_BIG,[nick,delta,entry.rank,'ub'],nick,delta,entry.rank);
          push({type:'rank_up',text});lbAdded++;
        }else if(delta>=2&&entry.rank>1&&lbAdded<2){
          push({type:'rank_up',text:_call(T_UP_SMALL,[nick,delta,entry.rank,'us'],nick,delta,entry.rank)});lbAdded++;
        }
        // Coborâre mare
        if(delta<=-3&&lbAdded<2){
          push({type:'rank_down',text:_call(T_DOWN_BIG,[nick,Math.abs(delta),entry.rank,'db'],nick,Math.abs(delta),entry.rank)});lbAdded++;
        }else if(delta<=-2&&lbAdded<2){
          push({type:'rank_down',text:_call(T_DOWN_SMALL,[nick,Math.abs(delta),entry.rank,'ds'],nick,Math.abs(delta),entry.rank)});lbAdded++;
        }
        // Depășire la limită (1 punct)
        if(delta===1&&entry.rank>1&&lbAdded<2){
          const beaten=prevLeaderboard.find(p=>p.rank===entry.rank);
          if(beaten){
            const text=_call(T_MAN_PASSED,[nick,beaten.nickname,'mp'],nick,beaten.nickname);
            push({type:'rank_up',text});lbAdded++;
          }
        }
        // Doi jucători la același punctaj
        const twin=leaderboard.find(e2=>e2.nickname!==entry.nickname&&e2.points===entry.points&&e2.rank===entry.rank);
        if(twin&&entry.nickname<twin.nickname&&lbAdded<2){
          push({type:'equal',text:_call(T_MAN_EQUAL,[nick,twin.nickname,'eq'],nick,twin.nickname)});lbAdded++;
        }
      });
    }
  }

  // ── SLOTS 10-13: 2 curiozități + 2 citate (intercalate) A DOUA rundă ─────────
  pushCurQuotePair((Date.now()%1000)+500);

  // ── SLOT pentru preview meci următor ─────────────────────────────────────────
  const T_PRE=[
    (a,b)=>`🔜 ${a} – ${b} urmează. Care e în fața porții, s-o înscrie.`,
    (a,b)=>`🔜 ${a} vs ${b}: simplu pe hârtie, complicat la cartonașe.`,
    (a,b)=>`🔜 ${a} – ${b}: un gol în minutul 88 strică o seară întreagă.`,
    (a,b)=>`🔜 ${a} – ${b}: dacă pui 0-0, ai nevoie de curaj sau de noroc cu acte.`,
  ];
  const previewTargets=todayOff.length>0?todayOff.slice(0,1):(nextMatch?[nextMatch]:[]);
  previewTargets.forEach(m=>{
    push({type:'preview',text:_call(T_PRE,[m.id,'pre'],m.teamA,m.teamB)});
  });

  // ── SLOTS finale: încă 2 curiozități + 2 citate (intercalate) ────────────────
  pushCurQuotePair((Date.now()%1000)+1000);

  // ── DRAMA de meci (dacă mai e loc) ───────────────────────────────────────────
  for(const match of latestFinished){
    if(result.length>=18)break;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const corners=rCornT??(rCornH!=null&&rCornA!=null?rCornH+rCornA:null);
    const items=_matchDrama(mName,sA,sB,match.homeScorers,match.awayScorers,rCards??0,corners??0,match.id);
    items.forEach(text=>push({type:'match_drama',text}));
  }

  // Deduplicate by text
  const seen=new Set();
  return result
    .filter(e=>{if(!e||!e.text)return false;if(seen.has(e.text))return false;seen.add(e.text);return true;})
    .slice(0,20)
    .map((e,i)=>({id:`feed_${Date.now()}_${i}`,type:e.type,icon:'',text:e.text,ts:Date.now(),priority:20-i}));
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
