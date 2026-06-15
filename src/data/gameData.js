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

// ─── ACTIVITY FEED v7 ────────────────────────────────────────────────────────
// Entertainment feed: sports radio + pub banter + Eurosport curiosities.
// Every item must make the reader laugh, learn, be surprised, or check the match.
// 50%+ non-prediction content. Newest match always dominates.
// Read-only. No Firestore writes. No scoring changes.
// ─────────────────────────────────────────────────────────────────────────────

// ── Alias normalisation ───────────────────────────────────────────────────────
const _A7={"Țările de Jos":"Olanda","Netherlands":"Olanda","Franța":"Franta","France":"Franta","Curaçao":"Curacao","Coasta de Fildeș":"Coasta de Fildes","DR Congo":"RD Congo","Congo RD":"RD Congo","Cape Verde":"Capul Verde","Bosnia & Herzegovina":"Bosnia","Bosnia & Herțegovina":"Bosnia"};
const _n7=t=>_A7[t]??t;
const _WC7=new Set(["Africa de Sud","Algeria","Anglia","Arabia Saudita","Argentina","Australia","Austria","Belgia","Bosnia","Brazilia","Canada","Capul Verde","Cehia","Coasta de Fildes","Columbia","Coreea de Sud","Croatia","Curacao","Ecuador","Egipt","Elvetia","Franta","Germania","Ghana","Haiti","Iordania","Irak","Iran","Japonia","Maroc","Mexic","Norvegia","Noua Zeelanda","Olanda","Panama","Paraguay","Portugalia","Qatar","RD Congo","SUA","Scotia","Senegal","Spania","Suedia","Tunisia","Turcia","Uruguay","Uzbekistan"]);
const _isOff7=t=>_WC7.has(_n7(t));
const _isWCM7=m=>m&&m.id>=1&&m.id<=72;

// ── Seeded deterministic pick ─────────────────────────────────────────────────
const _p7=(arr,...seeds)=>{
  let h=7;
  for(const s of seeds){for(const ch of String(s)){h=((h*31)+ch.charCodeAt(0))&0x7fffffff;}}
  return arr[h%arr.length];
};
const _c7=(arr,seeds,...args)=>{const fn=_p7(arr,...seeds);return typeof fn==='function'?fn(...args):String(fn);};

// ── COUNTRY CURIOSITIES: entertaining facts only ──────────────────────────────
// Only shown for contextual teams. Each fact designed to make someone go "really?!"
const CF7={
  "Africa de Sud":["Africa de Sud are 11 limbi oficiale. De fiecare dată când arbitrul fluieră, în tribune se comentează în 11 limbi simultan.","Vuvuzelele din 2010 au depășit nivelul de zgomot al unui motor de avion. UEFA a plâns. Suporterii au continuat.","Africa de Sud e singura țară care a demolat voluntar programul nuclear propriu. Fotbalul era mai important.","Bafana Bafana înseamnă «băieții băieților». Porecla e mai mare decât rezultatele — dar nu imposibil de depășit."],
  "Algeria":["Algeria e cea mai mare țară din Africa ca suprafață, dar 85% e Sahara. Fotbalul se joacă în restul de 15%, intens.","Riyad Mahrez a câștigat Premier League cu Leicester în 2016 — un titlu la fel de improbabil ca pronosticul tău de azi.","Algeria a eliminat Germania la Mondialul 2014. Surprizele vin din deșert.","Algeria a câștigat CAN 2019 fără să primească gol în grupe. Portarul lor era practic invizibil pentru adversari."],
  "Anglia":["Anglia a inventat fotbalul în 1863 și a câștigat un singur Mondial. Cel mai prolific inventator cu cel mai slab palmares din propria invenție.","Football's coming home — refrenul oficioal al dezamăgirii engleze la fiecare turneu, din 1990 încoace.","Gary Lineker nu a primit niciodată un cartonaș în întreaga carieră. Sfântul fotbalului englez.","Premier League e transmisă în 212 teritorii — mai mult decât ONU are membri. Fotbalul englezesc e mai global decât politica mondială."],
  "Arabia Saudita":["Arabia Saudită a bătut Argentina 2-1 la CM 2022. Messi a stat cu capul în mâini 5 minute pe bancă. Și toată lumea cu el.","Arabia Saudită l-a cumpărat pe Ronaldo, Benzema, Kanté și Mahrez în același an. E ca și cum ai recruta 4 Baloane de Aur într-un sezon.","Arabia Saudită a câștigat Cupa Asiei de 3 ori. Investițiile în fotbal sunt reale."],
  "Argentina":["Argentina a câștigat 3 Mondiale. La cel din 2022, Messi a plâns pe teren. Publicul mondial a plâns cu el.","Golul lui Maradona contra Angliei în 1986: mai întâi cu mâna, apoi cu dribbling pe 60 de metri. Același meci, 4 minute diferență.","Buenos Aires are cea mai mare densitate de psihologi din lume. Fotbalul explică cel puțin 30% din cerere.","Lotul Argentinei la CM 2022 valora oficial peste 1 miliard de euro. La propriu. Și ei tot au tremurat în finală."],
  "Australia":["Australia a bătut Argentina la penaltii la CM 2022. Nimeni din grup nu îl prezisese. Nimeni.","Există mai mulți canguri decât oameni în Australia. Pe teren de fotbal, echipa e la fel de imprevizibilă ca fauna locală.","Australia e singurul continent care e și o singură țară. Distanță de continent, lot de 23 de jucători.","Socceroos — poreclă care sună a animal exotic și joacă la fel."],
  "Austria":["RB Salzburg a produs pe Haaland, Mané și Upamecano în 10 ani. Poate cel mai productiv club de export din lume — din Austria, surprinzător.","Viena a fost de 3 ori consecutiv ales cel mai bun oraș în care să trăiești. Fotbalul național nu a intrat în topul motivelor.","Austria e patria lui Mozart. Muzica și fotbalul lor sunt ambele frumoase dar nu câștigă mereu titluri mari."],
  "Belgia":["Belgia a stat 3 ani pe locul 1 FIFA fără să câștige niciun titlu major. Cel mai performant trofeu: clasamentul FIFA.","Kevin De Bruyne a fost cotat cel mai bun pasator din lume 4 ani consecutivi. Belgia n-a câștigat nimic major în acei 4 ani.","Belgia a funcționat fără guvern 541 de zile — record mondial. Fotbalul lor a mers tot timpul, netulburat.","Belgia produce 750 de tipuri de bere. La titluri mondiale: zero. La bere: recorduri."],
  "Bosnia":["Zlatan Ibrahimović are origini bosniace pe linie paternă. Baza genetică explică o parte din temperament.","Sarajevo a găzduit JO de iarnă în 1984. Același oraș, 40 de ani mai târziu — fotbal la un Mondial.","Bosnia a participat prima dată la CM în 2014. Džeko a marcat la primul meci. Fotbalul nu a așteptat decenii.","Podul Stari Most din Mostar: construit în 1566, distrus în 1993, reconstruit în 2004. Rezistența e în ADN."],
  "Brazilia":["Brazilia are 5 titluri mondiale. Trofeul Jules Rimet le-a fost dat definitiv după al treilea — și tot nu s-au oprit.","Maracanazo 1950: Brazilia a pierdut finala acasă cu Uruguay în fața a 200.000 de suportători. Trauma națională a durat o generație.","7-1 cu Germania în 2014, pe teren propriu, în semifinale. 5 goluri în 18 minute. Brazilia conducea 0-5 la pauza primei reprize.","Pelé a câștigat 3 Mondiale — la 17, 21 și 29 de ani. Matematica e imposibilă dar s-a întâmplat.","Neymar a costat 222 milioane euro la PSG. Brazilia nu a câștigat un Mondial de la transferul ăsta."],
  "Canada":["Canada are mai multe lacuri decât restul lumii la un loc. Fotbalul e al doilea sport iubit, după hochei — dar cu gap care se micșorează.","Alphonso Davies s-a născut în tabără de refugiați, a crescut în Canada și valorează 70 de milioane euro la Bayern München.","Canada nu a marcat niciun gol la CM 1986. A venit în 2022 cu o generație care a șters rușinea.","Toronto vorbește 200 de limbi zilnic. Echipa națională e la fel de diversă."],
  "Capul Verde":["Capul Verde are o diasporă de 3 ori mai mare decât populația insulelor. Echipa națională vine din Olanda, Portugalia și Franta.","Capul Verde nu are râuri permanente. Apa vine din ploaie și din desalinizare. Tenacitatea e un stil de viață.","Muzica Morna din Capul Verde e UNESCO — creată de oameni care trăiesc departe de casă. Exact ca jucătorii lor.","Capul Verde a eliminat Maroc la CAN 2021. Favorit clar, eliminat de insulari cu 150.000 de locuitori."],
  "Cehia":["Panenka a inventat lovitura cu chip la Euro 1976 contra portarului german Sepp Maier. Lovitura îi poartă numele 50 de ani mai târziu.","Cehia produce și consumă mai multă bere per capita decât orice altă țară din lume. Cultura berii e UNESCO.","Petr Čech a purtat cască de hochei pe gheață la fotbal pentru tot restul carierei după un accident în 2006. Cel mai recognoscibil portar din lume timp de 10 ani.","Praga e atât de bine conservată medieval că Game of Thrones ar putea filma acolo fără decoruri."],
  "Coasta de Fildes":["Drogba a negociat personal un armistițiu în războiul civil din Coasta de Fildes în 2006. Un fotbalist a oprit un conflict armat.","Coasta de Fildes produce 40% din cacaoul mondial. Ciocolata din toată lumea are rădăcini acolo.","Generația lui Drogba era considerată cea mai bună din Africa în 2006, 2010, 2014 — și n-a câștigat niciodată un titlu major.","Coasta de Fildes a câștigat CAN în 1992, 2015 și 2024. Răbdarea este recompensată în Africa."],
  "Columbia":["James Rodríguez a câștigat Gheata de Aur la CM 2014 cu 6 goluri. A venit practic din neant și a plecat legendă.","René Higuita, portarul columbian, a inventat «Scorpion Kick» în 1995 — o apărare cu călcâiele în aer. La un meci demonstrativ în Anglia.","Columbia a câștigat Copa América 2024 fără să primească gol în fazele eliminatorii. Nu e noroc — e sistem.","Columbia produce 10% din cafeaua mondială. Energia de pe teren vine de acolo."],
  "Coreea de Sud":["Coreea de Sud a ajuns în semifinalele CM 2002 eliminând Spania și Italia. Arbitrajul a rămas controversat. Fotbalul — spectaculos.","Son Heung-min a marcat 127 de goluri pentru Tottenham. Cel mai bun marcator asiatic din istoria Premier League.","Coreea de Sud e lider mondial în viteza internetului. K-pop e mai popular decât K-football, dar gap-ul se micșorează.","Park Ji-sung juca pe 3 posturi la Manchester United. Sir Alex Ferguson spunea că e echivalentul a 3 jucători."],
  "Croatia":["Croatia a terminat pe locul 2 la CM 2018 și locul 3 în 2022. Dintr-o țară de 4 milioane de oameni.","Luka Modrić a câștigat Balonul de Aur 2018 — primul altul decât Messi sau Ronaldo în 10 ani. Zidanul l-a chemat în biroul lui ca să-l felicite personal.","Cravata a fost inventată în Croatia în sec. XVII. Un export cultural care valorează miliarde anual.","Croatia a eliminat Brazilia la CM 2022 la penaltii. Livaković a apărat 3 lovituri. Nimeni nu l-a prezis golgheter."],
  "Curacao":["Curaçao are 150.000 de locuitori — mai puțin decât un cartier din Cluj. E una din cele mai mici echipe de la un Mondial.","Willemstad, capitala Curaçao, e UNESCO pentru arhitectura olandezo-caribbeană colorată din sec. XVII.","Jucătorii lui Curaçao cresc majoritar în Olanda, joacă în Europa și reprezintă insula. Diaspora ca strategie sportivă.","Curaçao a eliminat Costa Rica la barajul CONCACAF pentru CM 2026. 150.000 de locuitori au oprit o națiune de 5 milioane."],
  "Ecuador":["Ecuador a deschis CM 2022 cu un 2-0 contra gazdei Qatar. Prima dată în istorie când gazda pierdea meciul inaugural.","Enner Valencia a marcat 3 din 5 goluri ale Ecuadorului la CM 2022. Un singur om, mare responsabilitate.","Quito, capitala Ecuadorului, e la 2.850 m altitudine. Adversarii vin și nu pot respira. Ecuador — avantaj de altitudine.","Insulele Galapagos, parte din Ecuador, au dat naștere teoriei evoluției. Echipa națională evoluează și ea."],
  "Egipt":["Egipt a câștigat CAN de 7 ori — record absolut mondial la o competiție continentală de fotbal.","Mohamed Salah a marcat 200+ goluri pentru Liverpool. E în top 10 all-time marcatori ai clubului.","Egipt a câștigat CAN 2006, 2008, 2010 — 3 titluri consecutive. Singurul stat cu acest record.","Ahmed Hassan a jucat 184 de meciuri pentru Egipt. Record african. A jucat mai mult decât unii jucători au trăit la club."],
  "Elvetia":["Elveția a eliminat Franta la Euro 2020, de la 1-3, la penaltii. Franta era favorită clară. Elveția nu citise statisticile.","Elveția are 4 limbi oficiale. Echipa națională e multilingvă în cabine — ceartele tactice sunt bilingve minimum.","CERN, cel mai mare accelerator de particule din lume, e la Geneva. Elveția produce știință și fotbal surprinzător în egală măsură.","Yann Sommer a apărat 2 penaltii din 5 la Euro 2020 contra Franței. Portarul care a dat insomnii unui lot de 1,2 miliarde de euro."],
  "Franta":["Franta a câștigat CM 1998 și 2018. Mbappé a marcat hat-trick în finala din 2022 și tot a pierdut la penaltii.","Lotul Franței la CM 2022 valora oficial peste 1,2 miliarde de euro. Au pierdut la penaltii cu un lot de 10 ori mai ieftin.","Thierry Henry a marcat cu mâna la barajul cu Irlanda și s-a calificat. S-a calificat. A câștigat CM doi ani mai târziu cu altă echipă.","Zidane a marcat de 2 ori cu capul în finala CM 1998. Și tot nu și-a dat seama că era mai bun cu capul decât a demonstrat în 2006."],
  "Germania":["Germania are 4 titluri mondiale și obiceiul enervant de a fi acolo când contează, indiferent de generație.","7-1 cu Brazilia în semifinalele CM 2014 — pe teren propriu. 5 goluri în 18 minute la pauza primei reprize. Comentatorul brazilian a tăcut complet.","Miroslav Klose are 16 goluri la Mondiale — record mondial absolut. Nimeni nu s-a apropiat de 15 ani.","Bundesliga are cea mai mare medie de spectatori per meci din Europa — 42.000. Fanii germani tratează fotbalul ca pe o datorie civică."],
  "Ghana":["Ghana a ratat semifinalele CM 2010 pentru că Suárez a blocat un gol cu mâna în ultimul minut. Penalty ratat. Meci pierdut. Suárez a râs pe bancă.","Asamoah Gyan a ratat penaltiul care ar fi trimis Ghana în semifinalele CM 2010. E cel mai traumatizant moment din istoria fotbalului african.","Ghana a câștigat CAN de 4 ori. Prima țară africană independentă față de britanici, în 1957 — cu 66 de ani de fotbal african acumulat."],
  "Haiti":["Haiti a fost prima republică neagră din lume, în 1804 — cu 200 de ani înainte de independența multor state africane.","Emmanuel Sanon a marcat pentru Haiti contra Italiei la CM 1974. A oprit seria de meciuri imbatabile ale Italiei care dura 3 ani.","Haiti a câștigat Copa Caribe de mai multe ori. E o forță tradițională în Caraibe — la fel de neașteptată ca insula însăși.","Creola haitiană e singura limbă creolă cu statut oficial de limbă națională în întreaga lume."],
  "Iordania":["Iordania a ajuns în finala Cupei Asiei 2023 — nimeni nu credea că se poate.","Petra, cel mai faimos sit din Iordania, e un oraș antic săpat în stâncă roz. Vizibil din satelit. La fel de impresionant ca o finală asiatică.","Marea Moartă — granița Iordaniei — e cel mai jos punct de pe suprafața Pământului. 430 m sub nivelul mării. Undeva, un geograf a remarcat ironia cu fotbalul lor ascendent."],
  "Irak":["Irak a câștigat Cupa Asiei pe Națiuni în 2007 — în timp ce țara era în plină instabilitate politică. Fotbalul a unit atunci când nimic altceva nu putea.","Ahmed Radhi a marcat singurul gol al Irakului la un Mondial, în 1986, contra Belgiei. E legendă națională. Statuie. Monument viu.","Mesopotamia — teritoriul Irakului modern — e leagănul primelor civilizații umane. Primele reguli scrise ale omenirii au venit din acolo. Fotbalul, cu întârziere."],
  "Iran":["Iran are 3 titluri asiatice consecutive: 1968, 1972, 1976. Cea mai lungă dominanță asiatică din fotbalul masculin.","Mehdi Taremi a marcat o foarfecă spectaculoasă contra Angliei la CM 2022. A fost ales unul din golurile turneului. Iran a pierdut meciul totuși.","Persepolis e cel mai mare club din Iran — meciuri cu 100.000 de spectatori. Atmosfera e o armă tactică."],
  "Japonia":["Japonia a eliminat Germania și Spania la CM 2022. Ambele conduceau la pauză. Japonia a revenit de fiecare dată. Fotbalul a văzut lucruri.","Japonia are milioane de automate de vânzare per milion de locuitori. Practic, și apa are program non-stop.","Kazuyoshi Miura a jucat fotbal profesionist la 56 de ani — record mondial de longevitate. Fiecare zi e un dar, fiecare meci o sărbătoare.","Japonia are mai mult de 6.800 de insule. Pe una singură — Honshu — trăiesc 100 de milioane de oameni. Și mai mulți fotbaliști talentați."],
  "Maroc":["Maroc a eliminat Spania și Portugalia la CM 2022 și a ajuns în semifinale — prima echipă africană din istorie.","Maroc găzduiește cea mai veche universitate încă activă din lume: Al-Qarawiyyin, fondată în 859 d.Hr. în Fes.","Achraf Hakimi a marcat penaltiul decisiv contra Spaniei cu Panenka. Curaj care se studiază la cursuri de leadership.","În Maroc se consumă milioane de pahare de ceai de mentă zilnic. Înainte de fiecare meci important — la fel."],
  "Mexic":["Mexic nu a trecut niciodată de sferturi la un Mondial — «blestemul sferturilor» e fenomen cultural documentat.","Stadionul Azteca e singurul care a găzduit 2 finale mondiale: 1970 și 1986. Și va găzdui meciuri la ediția 2026.","Hugo Sánchez a marcat 29 de goluri pentru Mexic și a câștigat 5 titluri consecutive cu Real Madrid în aceeași perioadă.","Mexic produce cea mai mare parte din avocado mondial. Guacamole la meciuri e obligatoriu cultural."],
  "Norvegia":["Erling Haaland a marcat 36 de goluri în Premier League într-un singur sezon — record absolut al competiției.","Norvegia vine cu Haaland. Asta înseamnă că planul tactic adversar începe simplu: găsiți-l și nu îl lăsați să joace.","Martin Odegaard a devenit căpitanul Arsenalului la 23 de ani — cel mai tânăr căpitan din istoria clubului.","Norvegia are cel mai mare fond suveran de investiții din lume — 1,4 trilioane de dolari. Fotbalul nu e inclus în fond, dar Haaland valorează și el ceva."],
  "Noua Zeelanda":["All Blacks au 77% rată de victorie — cea mai înaltă din orice sport de echipă din lume. Fotbalul, mult mai puțin.","Noua Zeelandă a acordat dreptul de vot femeilor în 1893 — prima țară din lume. La fotbal masculin, au așteptat ceva mai mult.","Noua Zeelandă a participat la CM 2010 și nu a pierdut niciun meci — 3 egaluri. A ieșit din grupe cu 3 puncte totuși.","Există 6 oi per persoană în Noua Zeelandă. Pe teren de fotbal, asta nu contează. Sau poate da."],
  "Olanda":["Johan Cruyff a inventat fotbalul total în anii 1970. Un sistem revoluționar care a schimbat teoria fotbalului mondial.","Olanda a terminat pe locul 2 la CM 2010, 1974 și 1978 — mereu finalist, niciodată câștigătoare. «Cea mai bună echipă care n-a câștigat niciodată».","Marco van Basten a marcat gol din unghi imposibil în finala Euro 1988. Nicio replică disponibilă. Nimeni nu l-a mai repetat.","Ajax Amsterdam a câștigat 4 Champions League — mai mult decât orice club din afara Spaniei, Angliei și Italiei."],
  "Panama":["Panama s-a calificat la CM 2018 și toată țara s-a oprit din activitate pentru meciul inaugural. Bancă de rezerve incluse.","Canalul Panama scurtează drumul maritim cu 15.000 km. O ingeniozitate similară cu fotbalul lor: eficiență maximă cu resurse mici.","Panama a câștigat prima victorie la Mondial în 2018 — contra Tunisia. E inscripționat în istoria națională."],
  "Paraguay":["José Luis Chilavert, portarul paraguayan, a marcat 62 de goluri din penaltii și lovituri libere — record mondial absolut pentru portari.","Paraguay a ajuns în sferturile CM 2010. A pierdut contra Spaniei. A fost aproape.","Paraguay are două limbi oficiale: spaniola și guaraní. Singura limbă indigenă americană cu statut oficial."],
  "Portugalia":["Cristiano Ronaldo a marcat 128 de goluri pentru Portugalia — record mondial absolut la goluri marcate pentru o națională.","Eusébio a marcat 9 goluri la CM 1966 câștigând Gheata de Aur. Portugalia a terminat pe locul 3. Și Eusébio e pe o statuie la Lisabona.","Portugalia a câștigat Euro 2016 cu un gol al lui Éder în prelungiri. Éder juca la Lille. Nu la Real Madrid."],
  "Qatar":["Qatar a ieșit din grupe fără victorie la CM 2022 — primul gazdă cu acest result în istoria turneului.","Doha a crescut din sat de pescari de 30.000 de oameni în 1950 la 2,5 milioane în 2020. 70 de ani de expansiune.","Qatar a cumpărat PSG în 2011. Tot nu a câștigat Champions League. Banii cumpără jucători, nu trofeele."],
  "RD Congo":["RD Congo revine la Mondial după 52 de ani — cel mai lung interval de absență din istoria participanților.","RD Congo a câștigat CAN în 1968 și 1974. Generația care a calificat naționala în 2026 nu s-a născut atunci.","Kinshasa e cel mai mare oraș francofon din lume — 17 milioane de oameni. Suport de categorie mondială."],
  "SUA":["SUA a înregistrat în 1994 cea mai mare medie de spectatori per meci din istoria CM — 68.626. Americanii nu știau fotbal dar umpleau stadionul.","Christian Pulisic a marcat golul calificant al SUA la CM 2022 și a ieșit accidentat. Și-a revenit în vestiar și și-a urmărit echipa de acolo.","SUA are 4 Cupe Mondiale feminine — record absolut mondial. La masculin, aspiră."],
  "Scotia":["Scoția și Anglia au jucat primul meci internațional din istoria fotbalului, în 1872 — 0-0. Prima dată când fotbalul a dezamăgit pe cineva.","Denis Law a marcat golul care a retrogradat Anglia în 1975. A plecat imediat de pe teren, fără să serbeze. Era deprimat de ce făcuse.","Celtic și Rangers — The Old Firm — e cel mai urmărit derby local din lume ca audiență globală, per capita de suporteri."],
  "Senegal":["Senegal a eliminat Franta la CM 2002 — campioana mondială în exercițiu. La primul meci al turneului.","Sadio Mané a câștigat Premier League, Champions League și CAN în carieră. A plecat de la Liverpool cu ultimul trofeu posibil.","Dakar a fost punctul de start al celebrului Raliu Paris-Dakar. Viteza e un lucru senegaez."],
  "Spania":["Spania a câștigat CM 2010 și Euro 2008, 2012, 2024 — dominanță fără precedent în fotbalul european.","Spania a câștigat Euro 2024 cu cei mai tineri jucători de start din istoria turneului final. Pedri, Yamal — generație care a intrat direct în legendă.","Iniesta a marcat golul finalei CM 2010 în prelungiri. A băut vin de la propria vie după. Via lui, în Albacete.","Real Madrid și Barcelona au câștigat împreună 22 din 69 de Champions League. O treime din titluri, din două orașe."],
  "Suedia":["Zlatan Ibrahimović a marcat 62 de goluri pentru Suedia și a marcat din foarfecă de la 30 de metri contra Angliei în 2013. Nicio replică disponibilă din 2013 încoace.","Suedia a terminat pe locul 3 la CM 1994 și locul 2 în 1958. O națiune de 10 milioane cu palmares real.","Spotify a fost fondată la Stockholm. Suedia a digitalizat muzica lumii și are și jucători buni."],
  "Tunisia":["Tunisia a bătut Franta la CM 2022 — campioana mondială. Franta rotise lotul, Tunisia a jucat serios.","Tunisia a câștigat CAN în 2004 — singurul titlu continental.","Tunisia a fost prima echipă africană care a câștigat un meci la CM, în 1978 — Mexic 3-1. Record african care a stat câțiva ani."],
  "Turcia":["Hakan Şükür a marcat în 11 secunde la meciul pentru locul 3 al CM 2002 contra Coreei de Sud — cel mai rapid gol din istoria Mondialelor.","Istanbul e singurul oraș din lume pe două continente simultan — Europa și Asia. Bosforul îl împarte în fiecare zi.","Arda Turan a câștigat La Liga cu Atletico Madrid și titlul cu Barcelona. Cel mai titrat jucător turc din istoria fotbalului.","Turcia produce 75% din alunele mondiale. Nutella are un furnizor garantat și fotbal bun la export."],
  "Uruguay":["Uruguay a câștigat CM 1930 și CM 1950 — primele două ediții ale turneului.","Maracanazo 1950: Uruguay a bătut Brazilia pe Maracanã în fața a 200.000 de suportători. Trauma brasileiră a durat o generație.","Darwin Núñez a costat Liverpool 85 milioane euro — cel mai scump uruguayan din istoria fotbalului.","Uruguay a câștigat Copa América de 15 ori — record mondial la orice competiție continentală de fotbal."],
  "Uzbekistan":["În Uzbekistan, pâinea e considerată sacră și nu se așază niciodată cu fața în jos pe masă. Tradițiile alimentare sunt legi nescrise.","Uzbekistan e la primul Mondial FIFA senior. O premieră absolută pentru 36 de milioane de oameni.","Samarkand a fost cel mai important nod al Drumului Mătăsii — calea comercială China-Europa timp de 1.000 de ani.","Uzbekistan a câștigat Campionatul Asian Under-23 în 2022. Generația care a calificat naționala pentru prima oară în istoria fotbalului."],
};

// ── Match drama generators ────────────────────────────────────────────────────
const _goalDrama=(name,sA,sB)=>{
  const t=sA+sB;
  if(t>=7)return _p7([
    (m,t)=>`${m} a produs ${t} goluri. La unele Cupe Mondiale există finale cu mai puțin.`,
    (m,t)=>`${t} goluri la ${m}. Mingea a vizitat plasa mai des decât centrul terenului.`,
    (m,t)=>`${m}: ${t} goluri. Portarii au avut seara pe care ar prefera-o din CV.`,
  ],name,t)(name,t);
  if(t===6)return _p7([
    m=>`${m}: 6 goluri. Dacă pariai pe spectacol, ți-ai plătit concediul.`,
    m=>`${m} a dat 6 goluri. Apărările au fost prezente doar pe foaia oficială.`,
    m=>`6 goluri la ${m}. Constructorii porților au muncit mai mult decât portarii.`,
  ],name)(name);
  if(t===5)return _p7([
    m=>`${m}: 5 goluri în 90 de minute. Media: un gol la 18 minute. Portarii au cerut ore suplimentare.`,
    m=>`5 goluri la ${m}. Suficient pentru un top YouTube al zilei — și poate al săptămânii.`,
  ],name)(name);
  if(t===0)return _p7([
    m=>`${m}: 0-0. Mingea a văzut mai mult iarbă decât plasă. Portarii au ieșit neatinsi.`,
    m=>`${m} s-a blocat la 0-0. Cine a pariat pe spectacol și-a cerut banii înapoi.`,
    m=>`${m}: 0-0. Undeva, un analist tactic e extrem de fericit. Restul — mai puțin.`,
  ],name)(name);
  if(t===1)return _p7([
    m=>`${m}: un singur gol a decis totul. Cine l-a prezis exact e erou discret.`,
    m=>`${m}: 1 gol în 90 de minute. Scriptul a livrat minimal dar suficient.`,
    m=>`${m} s-a decis la un singur gol. Portarii au câștigat duelul general.`,
  ],name)(name);
  if(sA===sB)return _p7([
    (m,s)=>`${m}: ${s}-${s}. Egal diplomatic. Sau furt de puncte, depinde cine întrebi.`,
    (m,s)=>`${m}: ${s}-${s}. Clasamentul ia câte un punct de la fiecare.`,
  ],name,sA)(name,sA);
  const d=Math.abs(sA-sB);
  return _p7([
    (m,a,b)=>`${m}: ${a}-${b}. Câștigătoarea a câștigat cu ${d} goluri diferență. Destul de clar.`,
    (m,a,b)=>`${m}: ${a}-${b}. Cei cu scor corect azi au câștigat mai mult decât cred.`,
  ],name,sA,sB)(name,sA,sB);
};

const _cardDrama=(name,cards)=>{
  if(cards>=10)return _p7([
    (m,c)=>`${m}: ${c} cartonașe. Arbitrul a distribuit mai mult decât un șef la o ședință.`,
    (m,c)=>`${c} cartonașe la ${m}. Dacă pariai pe nervi, probabil îți plăteai facturile.`,
    (m,c)=>`${m}: ${c} cartonașe. Meciul s-a jucat pe tăișul regulamentului.`,
  ],name,cards)(name,cards);
  if(cards>=6)return _p7([
    (m,c)=>`${m}: ${c} cartonașe scoase. Fotbal fizic, nervi scurți, arbitru ocupat.`,
    (m,c)=>`${c} cartonașe la ${m}. Meciul a scos cartonașe cât pentru un dosar cu șină.`,
    (m,c)=>`${m} a produs ${c} cartonașe. Mai multă adrenalină decât fotbal organizat.`,
  ],name,cards)(name,cards);
  return null;
};

const _cornerDrama=(name,corners)=>{
  if(corners===null||corners===undefined)return null;
  if(corners>=15)return _p7([
    (m,c)=>`${m} a avut ${c} cornere. Mingea a petrecut mai mult timp lângă steguleț decât la centru.`,
    (m,c)=>`${c} cornere la ${m}. Au fost mai mulți la fanion decât la centrul terenului.`,
  ],name,corners)(name,corners);
  if(corners>=10)return _p7([
    (m,c)=>`${m}: ${c} cornere. Mulți și cu eficiență selectivă — sau totală, dacă scorul a spus-o.`,
    (m,c)=>`${c} cornere la ${m}. Atacanții au preferat linia de fund ca rampă de lansare.`,
  ],name,corners)(name,corners);
  return null;
};

const _scorerDrama=(name,hTeam,aTeam,hSc,aSc,sA,sB)=>{
  if(!hSc&&!aSc)return null;
  const parts=[];
  if(hSc)parts.push(`${hTeam}: ${hSc}`);
  if(aSc)parts.push(`${aTeam}: ${aSc}`);
  const joined=parts.join(' / ');
  const goalCount=sA+sB;
  return _p7([
    (m,s,g)=>`⚽ ${m}: ${s}. ${g} ${g===1?'gol, un':'goluri,'} ${g===1?'singur erou.':'eroi diferiți.'}`,
    (m,s)=>`La ${m}, golurile au venit de la: ${s}.`,
    (m,s,g)=>`${m} — cine a înscris: ${s}. ${g>3?'A fost multă lume pe tabelă.':''}`,
  ],name,hSc||'',aSc||'')(name,joined,goalCount);
};

// ── Template pools ────────────────────────────────────────────────────────────
const T_EXACT=[
  n=>`🎯 ${n} a prins scorul exact. Se cere control antidoping la globul de cristal.`,
  n=>`🔮 ${n} n-a prezis. A scurs scenariul. Grupul cere parola de la contul lui.`,
  n=>`🧙 ${n}: scor exact confirmat. FIFA a deschis o investigație informală.`,
  n=>`🏹 ${n}: direct în centrul dianaei. Fără explicație plauzibilă.`,
  n=>`🧠 ${n} n-a ghicit. A calculat. Diferența e importantă la clasament și la ego.`,
  n=>`✨ ${n} cu scor exact. Restul au venit la participare.`,
  n=>`🔭 ${n} a văzut meciul de la distanța corectă. Scor exact.`,
  n=>`📐 ${n} a măsurat unghiurile înainte de fluier. Scor exact confirmat.`,
  n=>`🃏 ${n} a jucat cartea perfectă când restul jucau altele.`,
  n=>`🧬 ${n} are codul genetic pentru scoruri exacte. Nu se explică altfel.`,
  n=>`🔑 ${n} a găsit cheia meciului înainte ca meciul să știe că are o cheie.`,
  n=>`📡 ${n} a recepționat semnalul corect când alții aveau interferențe.`,
  n=>`🎰 ${n}: jackpot. Casa a pierdut azi față de el.`,
  n=>`🦅 ${n} a văzut meciul de la înălțimea corectă. Panorama ajută.`,
  n=>`📌 ${n}: scor exact fixat pe hârtie. Hârtia nu minte.`,
  n=>`🏆 ${n}: scor exact confirmat. Clasamentul a simțit imediat.`,
  n=>`🎯 ${n} a lovit bull's-eye. Concurenții privesc în jos.`,
  n=>`🌟 ${n} strălucește cu scor exact. Clasa se vede când contează.`,
  n=>`🧊 ${n} rece ca gheața: a fixat scorul corect fără emoții vizibile.`,
  n=>`🔥 ${n}: scor exact. Clasamentul a simțit șocul imediat.`,
  n=>`🎭 ${n}: scenariul perfect — scor exact în toate câmpurile.`,
  n=>`🦊 ${n} a fost viclean: scor exact când nimeni nu se uita.`,
  n=>`🏄 ${n} a prins valul potrivit la momentul potrivit.`,
  n=>`🔐 ${n} a spart codul meciului înainte de start.`,
  n=>`⚡ ${n} fulger de scor exact. Rapid și definitiv.`,
  n=>`📊 ${n}: scor exact. Datele confirmă ceea ce bănuiam toți.`,
  n=>`💡 ${n} a văzut lumina meciului de la distanță. Scor exact.`,
  n=>`🦁 ${n}: forță și precizie combinate. Scor exact.`,
  n=>`🏋️ ${n}: greutate ridicată cu scor exact. Fără efort aparent.`,
  n=>`🧩 ${n} a asamblat puzzle-ul corect. Ceilalți aveau piese lipsă.`,
  (n,m)=>`🔮 ${n} la ${m}: canal cosmic activ. Scor exact.`,
  (n,m)=>`🧙 ${n} la ${m}: scor exact. E îngrijorător sau impresionant?`,
  (n,m)=>`🎯 ${n} la ${m}: singur pe insulă cu calculatorul. Scor exact.`,
  (n,m)=>`🏹 ${n} la ${m}: direct în centru. Ceilalți vedeau alt meci.`,
  (n,m)=>`✅ ${n} bifează scor exact la ${m}. Metodic și letal.`,
  (n,m)=>`⚡ ${n} la ${m}: scor exact ca trăznetul — nimeni nu l-a văzut venind.`,
  (n,m)=>`🦁 ${n} la ${m}: scor exact. Junglei de predicții i s-a dat un rege.`,
  (n,m)=>`🎵 ${n} la ${m}: partitura scrisă corect dinainte. Scor exact.`,
  (n,m)=>`🚀 ${n} la ${m}: decolaj confirmat de la primul fluier.`,
  (n,m)=>`🔑 ${n} a deschis ${m} cu cheia corectă din prima.`,
  (n,m)=>`🧭 ${n} la ${m}: busola calibrată perfect. Scor exact.`,
  (n,m)=>`🪄 ${n} la ${m}: iepurele scos din pălărie — scor exact.`,
  (n,m)=>`🎲 ${n} la ${m}: zarul perfect. Probabilitate mică, execuție perfectă.`,
  (n,m)=>`🦊 ${n} viclean la ${m}: scor exact neașteptat de toată lumea.`,
  (n,m)=>`🏅 ${n} la ${m}: medalie neoficială pentru scor exact.`,
  (n,m)=>`💪 ${n} la ${m}: forță de caracter convertită în scor exact.`,
  (n,m)=>`🔭 ${n} a văzut ${m} de la înălțimea corectă. Scor exact.`,
  (n,m)=>`📐 ${n} la ${m}: unghi de calcul perfect. Scor exact.`,
  (n,m)=>`🎪 ${n} la ${m}: show complet. Scor exact în final.`,
  (n,m)=>`📡 ${n} la ${m}: frecvența corectă când alții aveau zgomot.`,
];

const T_ZERO=[
  n=>`🤦 ${n} a luat 0 puncte. Predicția a fost trimisă la obiecte pierdute.`,
  n=>`🪦 ${n} a prezis cu televizorul stins și telecomanda în altă cameră.`,
  n=>`🍿 ${n} n-a greșit mult. Doar meciul întreg.`,
  n=>`😶 ${n}: 0 puncte. Meciul nu a citit predicția.`,
  n=>`🙈 ${n}: ochii închiși sau deschiși — același result. 0 puncte.`,
  n=>`📉 ${n}: clasamentul notează fără milă. 0 puncte confirmate.`,
  n=>`🧊 ${n}: predicție înghețată la 0. Fără dezgheț programat.`,
  n=>`🎲 ${n} a dat cu zarul și a ieșit față greșită. 0 puncte.`,
  n=>`🌵 ${n}: 0 puncte. A supraviețuit secetei de predicție.`,
  n=>`🎭 ${n}: tragedie completă. Toate câmpurile greșite.`,
  n=>`💣 Predicția lui ${n} s-a întâlnit cu realitatea și a ieșit înfrântă.`,
  n=>`🌧️ ${n}: ploaie de zero puncte, fără umbrelă disponibilă.`,
  n=>`🐢 ${n}: viteza predicției — zero puncte pe minut.`,
  n=>`😴 ${n}: predicție somnoroasă. 0 puncte la trezire.`,
  n=>`🤷 ${n}: 0 puncte. Fotbalul a ales să fie imprevizibil azi.`,
  n=>`🔦 ${n}: lanternă pornită, puncte — niciunul găsit.`,
  n=>`🌑 ${n}: eclipsă completă de puncte. 0 la tabelă.`,
  n=>`🧸 ${n} a lăsat predicția în grija unui ursuleț. Rezultat: 0.`,
  n=>`🏜️ ${n}: deșert de puncte. Nici o oază la orizont.`,
  n=>`🤡 ${n}: 0 puncte. Meciul a râs cu poftă de predicție.`,
  n=>`🔩 ${n}: șuruburi lipsă în mecanismul de predicție. 0 puncte.`,
  n=>`🦆 ${n}: predicție de rată. Arăta bine pe hârtie, a dat 0.`,
  n=>`🌀 ${n}: vârtej de erori. 0 puncte la centrul spiralei.`,
  n=>`🔋 ${n}: bateria de predicție moartă. 0 puncte reîncărcate.`,
  n=>`💔 ${n}: inima prezisă greșit. 0 puncte sentimentale.`,
  n=>`😬 ${n}: 0 puncte. Clasamentul nu iartă, doar notează.`,
  (n,m)=>`🤦 ${n} la ${m}: 0 puncte. A făcut-o de oaie impresionant.`,
  (n,m)=>`🪦 Predicția lui ${n} la ${m} — înmormântare rapidă, fără discurs.`,
  (n,m)=>`🔮 ${n} la ${m}: globul de cristal era în service. 0 puncte.`,
  (n,m)=>`😬 ${n} la ${m}: 0 puncte. Prietenia se suspendă temporar.`,
  (n,m)=>`🎲 ${n} la ${m}: zarul a dat față greșită. 0 puncte confirmate.`,
  (n,m)=>`📺 ${n} la ${m}: telecomanda stricată. 0 puncte pe ecran.`,
  (n,m)=>`🧨 ${n} la ${m}: predicție distrusă la contact. 0 puncte.`,
  (n,m)=>`🫠 ${n} la ${m}: s-a topit de rușine. 0 puncte.`,
  (n,m)=>`💀 ${n} la ${m}: predicție moartă clinic. 0 puncte documentate.`,
  (n,m)=>`🌊 ${n} la ${m}: a ales valul greșit. Înecat la 0 puncte.`,
  (n,m)=>`🎭 ${n} la ${m}: dramă în 3 acte, toate greșite. 0 puncte.`,
  (n,m)=>`🏚️ ${n} la ${m}: predicția s-a prăbușit la primul gol.`,
  (n,m)=>`🤡 ${n} la ${m}: predicție de circ. 0 puncte de intrare.`,
  (n,m)=>`🦆 ${n} la ${m}: quack. 0 puncte.`,
  (n,m)=>`🌀 ${n} la ${m}: vârtej total. 0 puncte la mijloc.`,
  (n,m)=>`🔋 ${n} la ${m}: baterie moartă. 0 puncte rămase.`,
  (n,m)=>`🤦 ${n} la ${m}: formula pentru 0 puncte — găsită și aplicată.`,
  (n,m)=>`😮‍💨 ${n} la ${m}: un oftat lung și 0 puncte de numărat.`,
  (n,m)=>`💔 ${n} la ${m}: inimă frântă la fluierul final. 0 puncte.`,
  (n,m)=>`🪦 ${n} la ${m}: predicție în mormânt. Flori depuse.`,
  (n,m)=>`🧊 ${n} la ${m}: înghețat la 0 puncte.`,
  (n,m)=>`📵 ${n} la ${m}: semnal pierdut complet. 0 puncte recuperate.`,
  (n,m)=>`🏜️ ${n} la ${m}: deșert de puncte. Fata Morgana nu conta.`,
  (n,m)=>`😴 ${n} la ${m}: predicție somnoroasă de 0 puncte.`,
  (n,m)=>`🙈 ${n} la ${m}: orbire voluntară sau involuntară. 0 puncte.`,
];

const T_UP=[
  (n,r)=>`🚀 ${n} a urcat în clasament ca liftul la mall. Locul ${r}.`,
  (n,r)=>`📈 ${n} la locul ${r}. Cineva a prins viteză fără semnalizare.`,
  (n,r)=>`🏃 ${n} s-a băgat în față fără semnalizare. Locul ${r}.`,
  (n,r)=>`⚡ ${n} accelerează. Locul ${r} — pericolul crește.`,
  (n,r)=>`🧨 ${n}: locul ${r}. Cineva să-i verifice ghetele.`,
  (n,r)=>`🔥 ${n}: locul ${r}. Temperatura în clasament a crescut.`,
  (n,r)=>`🛸 ${n} a decolat la locul ${r}. Nimeni n-a calculat traiectoria.`,
  (n,r)=>`🦅 ${n} pe locul ${r}. Panoramă favorabilă de sus.`,
  (n,r)=>`🧗 ${n} escaladează la locul ${r}. Fiecare meci — un vârf.`,
  (n,r)=>`🌟 ${n} strălucește la locul ${r} azi.`,
  (n,d,r)=>`🧨 ${n} sare ${d} locuri direct la ${r}. Cineva verifică dacă are motor ascuns.`,
  (n,d,r)=>`🚀 ${n}: +${d} locuri, pe ${r}. Periculos pentru cine e mai sus.`,
  (n,d,r)=>`⚡ ${n}: salt de ${d} locuri. Locul ${r} acum.`,
  (n,d,r)=>`📈 ${n}: ${d} locuri dintr-un meci. Locul ${r}.`,
  (n,d,r)=>`🌊 ${n} spală ${d} locuri cu un singur meci. Locul ${r}.`,
  (n,d,r)=>`🛸 ${n}: teleportare de ${d} locuri. Locul ${r}. Cum?`,
  (n,d,r)=>`🦁 ${n}: rughet de ${d} locuri. Pe ${r} acum.`,
  n=>`🚀 ${n} urcă. Meciul a spus tot.`,n=>`📈 ${n} în ascensiune clară.`,
  n=>`⚡ ${n} accelerează în clasament.`,n=>`🔥 ${n} arde în clasament.`,
  n=>`🏃 ${n} aleargă spre top.`,n=>`🌊 ${n}: val constant de locuri.`,
  n=>`🧗 ${n} urcă cu fiecare meci.`,n=>`🦅 ${n} planează sus.`,
  n=>`🌟 ${n} strălucește azi.`,n=>`🎯 ${n} lovește metodic.`,
  n=>`🎸 ${n} dă solosul clasamentului.`,n=>`🦊 ${n} urcă viclean.`,
  n=>`🏄 ${n} surfează pe val.`,n=>`🧘 ${n} urcă calm.`,
  n=>`⚽ ${n} marchează și în clasament.`,n=>`🏅 ${n} se apropie de podium.`,
  n=>`💪 ${n} ridică greutatea clasamentului.`,n=>`🌋 ${n}: erupție de clasament.`,
  n=>`🌀 ${n} în spirală ascendentă.`,n=>`🔮 ${n} vede viitorul: sus.`,
  n=>`🧲 ${n} atrage locurile bune.`,n=>`🌤️ ${n} iese din umbra clasamentului.`,
  n=>`🔑 ${n} a găsit cheia clasamentului.`,n=>`⚡ ${n}: fulger în clasament.`,
  n=>`🧊 ${n} rece și calculat. Urcă.`,n=>`🌞 ${n} zilei: în ascensiune.`,
  n=>`🏆 ${n} simte podiumul aproape.`,n=>`🌱 ${n} crește în clasament.`,
  n=>`📡 ${n} captează semnalul bun.`,n=>`🏹 ${n} tras direct în sus.`,
  n=>`🦢 ${n} elegant în ascensiune.`,n=>`🌸 ${n} înflorește în clasament.`,
  n=>`🍀 ${n}: noroc convertit în locuri.`,n=>`🏔️ ${n} urcă muntele.`,
  n=>`🎡 ${n} la vârf cu roata norocului.`,n=>`🦋 ${n} transformare în clasament.`,
  n=>`💎 ${n}: diamant în clasament.`,n=>`🗺️ ${n} a citit harta corect.`,
  n=>`🌴 ${n} crește înalt.`,n=>`🎠 ${n} pe caruselul ascendent.`,
];

const T_DOWN=[
  (n,r)=>`📉 ${n} a coborât. A făcut-o de oaie, capră și tot efectivul. Locul ${r}.`,
  (n,r)=>`😬 ${n}: locul ${r}. Clasamentul nu iartă, doar notează.`,
  (n,r)=>`🪦 ${n} a alunecat frumos. Locul ${r}. VAR-ul nu poate interveni.`,
  (n,r)=>`💀 ${n}: locul ${r}. Urgența predicției crește.`,
  (n,r)=>`🌧️ ${n} primește ploaie de clasament: locul ${r}.`,
  (n,r)=>`😮‍💨 ${n} pierde teren. Locul ${r} — un oftat lung.`,
  (n,r)=>`🐢 ${n}: locul ${r}. Ritmul de urcat e mai mic decât cel de coborât.`,
  (n,r)=>`🎭 ${n} în drama clasamentului: locul ${r}.`,
  (n,r)=>`🌪️ ${n} luat de furtuna clasamentului: locul ${r}.`,
  (n,r)=>`🔇 ${n}: locul ${r}. Tăcere în tabăra de predicție.`,
  (n,d,r)=>`📉 ${n} coboară ${d} locuri — pe ${r} acum. Teren pierdut.`,
  (n,d,r)=>`😬 ${n}: ${d} locuri în jos, pe ${r}. Recalculare urgentă.`,
  (n,d,r)=>`🌧️ ${n}: ${d} locuri în ploaie, pe ${r}.`,
  (n,d,r)=>`🪦 ${n} coboară ${d} locuri. Pe ${r} — o noapte lungă.`,
  (n,d,r)=>`💀 ${n}: -${d} locuri, pe ${r}. Resuscitare de predicție necesară.`,
  (n,d,r)=>`🎭 ${n}: ${d} locuri pierdute, pe ${r}. Drama continuă.`,
  (n,d,r)=>`🌪️ ${n}: furtuna a luat ${d} locuri. Pe ${r}.`,
  (n,d,r)=>`🔇 ${n}: ${d} locuri pierdute, pe ${r}. Tăcere de înfrângere.`,
  (n,d,r)=>`🐢 ${n} merge înapoi ${d} locuri. Pe ${r}.`,
  n=>`📉 ${n} coboară. Meciul următor e decisiv.`,n=>`😬 ${n} pierde teren constant.`,
  n=>`🌧️ ${n} primește ploaie în clasament.`,n=>`🪦 ${n} mai coboară un loc.`,
  n=>`💀 ${n}: puncte urgente necesare.`,n=>`🌪️ ${n} luat de vânt.`,
  n=>`🎭 ${n} în drama clasamentului.`,n=>`🔇 ${n} pierde tăcut.`,
  n=>`🐢 ${n} prea lent față de restul.`,n=>`😮‍💨 ${n}: un oftat și un loc pierdut.`,
  n=>`🌑 ${n} coboară în umbra clasamentului.`,n=>`🎲 ${n} dă zarul greșit.`,
  n=>`🌊 ${n} înecat de val.`,n=>`📵 ${n}: semnal slab în clasament.`,
  n=>`🌵 ${n} supraviețuiește dar pierde loc.`,n=>`🧊 ${n} îngheață pe poziție mai joasă.`,
  n=>`🎯 ${n} ratează și coboară.`,n=>`🌫️ ${n} în ceața clasamentului.`,
  n=>`🎪 ${n} în circul coborârii.`,n=>`🌀 ${n} în spirală descendentă.`,
  n=>`🔋 ${n}: baterie de predicție moartă.`,n=>`🎻 ${n}: note false, loc pierdut.`,
  n=>`🕸️ ${n} prins în pânza erorilor.`,n=>`📦 ${n}: livrare greșită în clasament.`,
  n=>`🏜️ ${n}: deșert de puncte.`,n=>`🌙 ${n}: noaptea clasamentului.`,
  n=>`🍂 ${n}: toamna clasamentului.`,n=>`🌬️ ${n}: vântul a suflat locul.`,
  n=>`🔮 ${n}: globul arată jos.`,n=>`🏹 ${n}: săgeată în jos.`,
  n=>`💔 ${n}: inimă de clasament frântă.`,n=>`🏚️ ${n}: castelul s-a dărâmat.`,
  n=>`🌑 ${n}: eclipsă de clasament.`,n=>`🔒 ${n}: blocat pe poziție mai joasă.`,
  n=>`🌊 ${n}: sub valul clasamentului.`,n=>`🌱 ${n}: plantă călcată.`,
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

  // Prediction rows (calls existing calcPoints read-only — no scoring change)
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

  // Date helpers
  const todayStart=new Date();todayStart.setHours(0,0,0,0);
  const todayEnd=new Date(todayStart);todayEnd.setDate(todayEnd.getDate()+1);
  const isToday=t=>{const d=new Date(t);return d>=todayStart&&d<todayEnd;};

  // Context teams: live + last 2 finished + today upcoming + next
  // Country facts ONLY for these teams
  const ctxTeams=new Set();
  const finishedMatches=[...matches.filter(m=>m.isFinished)]
    .sort((a,b)=>new Date(b.time)-new Date(a.time));
  const latestFinished=finishedMatches.slice(0,2);
  const liveMatches=matches.filter(m=>m.isLive);
  const todayUpcoming=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM7(m)&&isToday(m.time));
  const nextMatch=matches.filter(m=>!m.isFinished&&!m.isLive&&_isWCM7(m))
    .sort((a,b)=>new Date(a.time)-new Date(b.time))[0];

  [...liveMatches,...latestFinished,...todayUpcoming].forEach(m=>{
    if(_isWCM7(m)){ctxTeams.add(_n7(m.teamA));ctxTeams.add(_n7(m.teamB));}
  });
  if(nextMatch){ctxTeams.add(_n7(nextMatch.teamA));ctxTeams.add(_n7(nextMatch.teamB));}

  const ctxFact=(team,seed=0)=>{
    const canon=_n7(team);
    if(!_isOff7(team)||!ctxTeams.has(canon))return null;
    const facts=CF7[canon];if(!facts||!facts.length)return null;
    return _p7(facts,canon,seed);
  };

  // ── BLOCK A: LIVE MATCHES (priority 11) ───────────────────────────────────
  liveMatches.forEach(m=>{
    const sA=m.realScoreA??0,sB=m.realScoreB??0;
    const parts=[];
    if(m.liveMinute!=null)parts.push(`${m.liveMinute}'`);
    if(m.homeScorers)parts.push(`⚽ ${m.teamA}: ${m.homeScorers}`);
    if(m.awayScorers)parts.push(`⚽ ${m.teamB}: ${m.awayScorers}`);
    if(m.liveCards)parts.push(`🟨 ${m.liveCards}`);
    if(m.liveCorners)parts.push(`🚩 ${m.liveCorners}`);
    const detail=parts.length?` (${parts.join(' · ')})`:'';
    ev('live',`🔴 LIVE: ${m.teamA} ${sA}–${sB} ${m.teamB}${detail}`,11);
    if(sA>sB&&m.liveMinute)ev('live_hype',`⏱️ ${m.teamA} conduce cu ${sA-sB}. ${m.teamB} mai are ${90-m.liveMinute} minute.`,10);
    else if(sB>sA&&m.liveMinute)ev('live_hype',`⚠️ ${m.teamB} conduce cu ${sB-sA}. ${m.teamA} în recuperare — ${90-m.liveMinute} minute rămase.`,10);
    else if(m.liveMinute>70)ev('live_hype',`⏱️ Egal în ${m.liveMinute}'. ${m.teamA}-${m.teamB} — fiecare minut costă acum.`,10);
    else ev('live_hype',`⚖️ ${m.teamA} ${sA}-${sB} ${m.teamB} — totul e de jucat.`,10);
    const fact=ctxFact(m.teamA,m.id)||ctxFact(m.teamB,m.id+99);
    if(fact)ev('fact',fact,5);
  });

  // ── BLOCK B: LAST 2 FINISHED (entertainment-first, priority 10-9) ─────────
  // These are the only matches that generate full drama. Older = lower priority.
  const BANTER_CAP=3; // max prediction banter items total
  let banterCount=0;
  let topUid=null,topPts=0,topMatch=null;

  latestFinished.forEach((match,idx)=>{
    const isNewest=idx===0;
    const BASE=isNewest?10:9;
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    const isWC=_isWCM7(match);
    const mp=mpreds(match.id,match);
    const exact=mp.filter(p=>p.exact);
    const top=[...mp].sort((a,b)=>b.pts-a.pts)[0];
    if(top&&top.pts>topPts){topPts=top.pts;topUid=top.uid;topMatch=match;}

    // Goal drama — always generated
    ev('match_story',_goalDrama(mName,sA,sB),BASE+1);

    // Scorer drama (concrete names)
    const sd=_scorerDrama(mName,match.teamA,match.teamB,match.homeScorers,match.awayScorers,sA,sB);
    if(sd)ev('scorers',sd,BASE+1);

    // Card drama
    const rCards=match.realPossession!=null?Number(match.realPossession):null;
    if(rCards!=null){const cd=_cardDrama(mName,rCards);if(cd)ev('match_story',cd,BASE);}

    // Corner drama
    const rCornH=match.realHomeCorners!=null?Number(match.realHomeCorners):null;
    const rCornA=match.realAwayCorners!=null?Number(match.realAwayCorners):null;
    const rCornT=match.realCorners!=null?Number(match.realCorners):null;
    const tc=(rCornT!=null?rCornT:(rCornH!=null&&rCornA!=null?rCornH+rCornA:null));
    if(tc!=null){const cornd=_cornerDrama(mName,tc);if(cornd)ev('match_story',cornd,BASE-1);}

    // Upset: nobody correct
    if(mp.length>=3&&mp.filter(p=>p.ok).length===0)
      ev('upset',`😱 ${mName}: niciun jucător nu a prezis corect rezultatul. Fotbalul are umor propriu.`,BASE);

    // Prediction banter (CAPPED — max BANTER_CAP total)
    if(exact.length===1&&banterCount<BANTER_CAP){
      ev('exact',_c7(T_EXACT,[exact[0].nick,match.id,'ex'],exact[0].nick,mName),BASE+2);banterCount++;
    }else if(exact.length===2&&banterCount<BANTER_CAP){
      ev('exact',`🎯 ${exact[0].nick} și ${exact[1].nick} au nimerit scorul exact la ${mName}. Grupul cere audit.`,BASE+2);banterCount++;
    }else if(exact.length>=3&&banterCount<BANTER_CAP){
      ev('exact',`🎯 ${exact.length} jucători cu scor exact la ${mName}: ${exact.map(e=>e.nick).join(', ')}.`,BASE+2);banterCount++;
    }

    const zeroes=mp.filter(p=>p.pts===0);
    if(zeroes.length===1&&banterCount<BANTER_CAP){
      ev('miss',_c7(T_ZERO,[zeroes[0].uid,match.id,'z'],zeroes[0].nick,mName),BASE-2);banterCount++;
    }

    // Near miss (1 goal off exact)
    if(exact.length===0&&banterCount<BANTER_CAP){
      let nearNick=null;
      Object.entries(allPredictions).forEach(([uid,up])=>{
        const p=up[match.id]||up[String(match.id)];if(!p)return;
        if(Math.abs(Number(p.scoreA)-sA)+Math.abs(Number(p.scoreB)-sB)===1)nearNick=nickOf(uid);
      });
      if(nearNick){ev('near',`💔 ${nearNick}: la un singur gol de scor exact la ${mName}.`,BASE-1);banterCount++;}
    }

    // Country curiosities — contextual, entertaining
    if(isWC){
      [match.teamA,match.teamB].forEach((team,i)=>{
        const fact=ctxFact(team,match.id+i*100);
        if(fact)ev('fact',fact,isNewest?5:4);
      });
    }
  });

  // Best round scorer (entertainment framing)
  if(finishedMatches.length>=2&&topUid&&topPts>0)
    ev('best_round',`🏅 ${nickOf(topUid)}: ${topPts} pts la ${topMatch.teamA} vs ${topMatch.teamB} — cel mai mare punctaj al rundei. Restul investighează dacă are rude la FIFA.`,7);

  // ── BLOCK C: OTHER FINISHED TODAY (max 2, priority 7) ─────────────────────
  const otherToday=finishedMatches.slice(2).filter(m=>isToday(m.time)&&_isWCM7(m));
  otherToday.slice(0,2).forEach(match=>{
    const mName=`${match.teamA} vs ${match.teamB}`;
    const sA=Number(match.realScoreA??0),sB=Number(match.realScoreB??0);
    ev('match_story',_goalDrama(mName,sA,sB),7);
    const sd2=_scorerDrama(mName,match.teamA,match.teamB,match.homeScorers,match.awayScorers,sA,sB);
    if(sd2)ev('scorers',sd2,7);
  });

  // ── BLOCK D: UPCOMING / NEXT MATCH (priority 3) ──────────────────────────
  const T_PRE=[
    (a,b)=>`🔥 ${a} – ${b}: azi se decide cine rămâne în cursă pentru clasament.`,
    (a,b)=>`⚽ ${a} vs ${b}: 90 de minute pentru a schimba clasamentul intern.`,
    (a,b)=>`🏟️ ${a} – ${b}: tipul de meci care face victime și câștigători simultan.`,
    (a,b)=>`📺 ${a} – ${b}: dacă ai pus 0-0, ai nevoie fie de curaj, fie de televizor stins.`,
    (a,b)=>`🎯 Scor exact la ${a} – ${b}: 100 puncte și o săptămână de lăudăroșenie.`,
    (a,b)=>`🧠 ${a} – ${b}: simplu de urmărit, complicat de prezis la cartonașe.`,
    (a,b)=>`🧨 ${a} – ${b}: un 1-1 banal poate rupe clasamentul.`,
    (a,b)=>`🥶 ${a} – ${b}: un gol în minutul 88 îți poate strica o seară întreagă.`,
    (a,b)=>`🎲 La ${a} – ${b}, cine nimerează cartonașele merită un titlu onorific.`,
    (a,b)=>`🌪️ ${a} – ${b}: pronosticul e gata? Clasamentul nu are răbdare.`,
    (a,b)=>`🔬 ${a} – ${b}: analizat și reanalizat — tot rămâne un risc.`,
    (a,b)=>`🏆 ${a} – ${b}: cine nimereste scorul exact azi — legendă în grup.`,
  ];

  todayUpcoming.slice(0,2).forEach(m=>{
    ev('preview',_c7(T_PRE,[m.id,'pre'],m.teamA,m.teamB),3);
    [m.teamA,m.teamB].forEach((team,i)=>{
      const fact=ctxFact(team,m.id+i*200);if(fact)ev('fact',fact,3);
    });
  });
  if(nextMatch&&todayUpcoming.length===0){
    ev('preview',_c7(T_PRE,[nextMatch.id,'nxt'],nextMatch.teamA,nextMatch.teamB),3);
    [nextMatch.teamA,nextMatch.teamB].forEach((team,i)=>{
      const fact=ctxFact(team,nextMatch.id+i*300);if(fact)ev('fact',fact,3);
    });
  }

  // ── BLOCK E: LEADERBOARD (max 3 items, entertainment framing) ────────────
  let rankCount=0;
  if(prevLeaderboard.length>0&&n>=2){
    leaderboard.forEach(entry=>{
      if(rankCount>=3)return;
      const prev=prevLeaderboard.find(p=>p.nickname===entry.nickname);if(!prev)return;
      const delta=prev.rank-entry.rank,nick=entry.nickname;
      if(entry.rank===1&&prev.rank>1){
        const d=prevLeaderboard.find(p=>p.rank===1)?.nickname||'?';
        ev('lead',_c7([(n,p)=>`👑 ${n} l-a depășit pe ${p} și a urcat pe locul 1. ${p} recalculează tot.`,(n,p)=>`🏆 Schimbare la vârf: ${n} detronează pe ${p}. Tensiune maximă.`,(n,p)=>`🍾 ${n} pe locul 1. ${p} a pus deoparte șampania.`],[nick,d,'ld'],nick,d),11);rankCount++;
      }
      if(prev.rank===1&&entry.rank>1&&rankCount<3){ev('fall',`😬 ${nick} pierde primul loc — pe ${entry.rank} acum. Clasamentul nu iartă.`,10);rankCount++;}
      if(entry.rank<=3&&prev.rank>3&&rankCount<3){ev('top3',`🚀 ${nick} intră în Top 3! Locul ${entry.rank}. Podiumul simte noua prezență.`,9);rankCount++;}
      if(entry.rank>3&&prev.rank<=3&&rankCount<3){ev('top3_exit',`🥉 ${nick} iese din Top 3 — pe ${entry.rank}. Un singur meci poate rezolva.`,9);rankCount++;}
      if(delta>=3&&entry.rank>1&&rankCount<3){ev('rank_up',_c7(T_UP,[nick,delta,entry.rank,'up'],nick,delta,entry.rank),8);rankCount++;}
      else if(delta===2&&entry.rank>1&&rankCount<3){ev('rank_up',_c7(T_UP,[nick,entry.rank,'up2'],nick,entry.rank),7);rankCount++;}
      if(delta<=-2&&rankCount<3){ev('rank_down',_c7(T_DOWN,[nick,Math.abs(delta),entry.rank,'dn'],nick,Math.abs(delta),entry.rank),7);rankCount++;}
    });
    const L=leaderboard[0],S=leaderboard[1],pL=prevLeaderboard[0],pS=prevLeaderboard[1];
    if(L&&S&&pL&&pS){
      const gap=L.points-S.points,prevGap=pL.points-pS.points;
      if(gap>prevGap&&gap>=20)ev('gap',`👑 ${L.nickname} extinde avantajul la ${gap} puncte. ${S.nickname} are de muncă.`,7);
      else if(gap<prevGap&&gap>0&&gap<=15)ev('chase',`⚔️ Top 3 e mai strâns decât un grup de WhatsApp înainte de concediu. ${S.nickname} la ${gap} puncte de ${L.nickname}.`,8);
    }
  }
  if(n>=2){
    const leader=leaderboard[0];
    leaderboard.forEach(e=>{const es=e.exactScores||0;
      if(es>=5)ev('streak',`🔥 ${e.nickname} are ${es} scoruri exacte. La acest ritm, FIFA îi oferă un contract.`,8);
      else if(es>=3)ev('streak',`🎯 ${e.nickname}: ${es} scoruri exacte. Metoda funcționează și nu o spune nimănui.`,5);
    });
    if(n>=3){const t=leaderboard[2],sp=leader.points-t.points;
      if(sp<=20&&sp>=0&&leader.points>0)ev('drama',`⚔️ Top 3 e mai strâns decât un grup de WhatsApp înainte de concediu. ${sp} puncte diferență.`,6);}
    const last=leaderboard[n-1];
    if(n>=4&&last.points===0)ev('fun',`🫣 ${last.nickname}: 0 puncte. Turneul e lung — sau nu, depinde cine întrebi.`,2);
  }

  // ── FINAL: dedup, sort, cap banter at 30%, cap leaderboard at 30% ────────
  const seen=new Set();
  const deduped=events
    .filter(e=>{if(seen.has(e.text))return false;seen.add(e.text);return true;})
    .sort((a,b)=>(b.priority-a.priority)||(b.ts-a.ts));

  const PRED_TYPES=new Set(['exact','miss','near']);
  const LB_TYPES=new Set(['lead','fall','top3','top3_exit','rank_up','rank_down','gap','chase','drama','streak','fun']);
  const tc={};const playerCount={};const result=[];
  const countBucket=bucket=>[...bucket].reduce((s,t)=>s+(tc[t]||0),0);

  for(const e of deduped){
    if(result.length>=15)break;
    if(PRED_TYPES.has(e.type)&&countBucket(PRED_TYPES)>=3)continue;
    if(LB_TYPES.has(e.type)&&countBucket(LB_TYPES)>=4)continue;
    const r2=result.slice(-2).map(x=>x.type);
    if(r2.length===2&&r2[0]===e.type&&r2[1]===e.type)continue;
    let pm=null;
    leaderboard.forEach(p=>{if(e.text.includes(p.nickname))pm=p.nickname;});
    if(pm){const pc=playerCount[pm]||0;if(pc>=2&&e.type!=='exact')continue;playerCount[pm]=pc+1;}
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
