// ─── src/data/gameData.js ─────────────────────────────────────────────────────
// Scoring engine, lock logic, leaderboard engine, mock data.
// All pure JS — no React imports.
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_MATCHES, ALL_GROUPS, getGroupLabel, TEST_MATCHES } from './matches.js';
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
      liveStatus:     result?.liveStatus     ?? (isLive ? "live" : isFinished ? "ft" : now >= kickoff - LOCK_BEFORE_MS ? "locked" : "open"),
    };
  });
}

export const MATCHES = buildMatches(undefined, { includeTests: true });
export const GROUPS  = ALL_GROUPS;
export { TEST_MATCHES };

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

  // 5. Corners accuracy: max(0, 15 - abs(predictedTotal - realTotal))
  let corners = 0;
  if (pC != null && rC != null) {
    corners = Math.max(0, 15 - Math.abs(pC - rC));
  }

  const total = exactScore + correctRes + totalGoals + possession + corners;

  return {
    exactScore, correctRes, totalGoals, possession, corners, total,
    isPerfect: exactScore === 100 && possession === 15 && corners === 15,
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
  const fm = buildMatches(finishedResults, { includeTests: true }).filter(m => m.isFinished);
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
  const fm = finishedMatches || buildMatches({}, { includeTests: true }).filter(m => m.isFinished);
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

// ─── SMART ACTIVITY FEED ─────────────────────────────────────────────────────
// Drama-first feed: 70%+ player competition, ~20% Romanian-flavoured humour.
// Priority order: position changes > battles > streaks > exact > match stats.
// Never shows 3 consecutive items of type 'exact' or 'points'.
// event shape: { id, type, icon, text, ts, priority, uid?, nickname? }
// ─────────────────────────────────────────────────────────────────────────────

export function generateActivityFeed({
  leaderboard     = [],
  prevLeaderboard = [],
  finishedResults = {},
  allPredictions  = {},
  allUsers        = {},
  matches         = [],
} = {}) {
  const events = [];
  let seq = 0;
  const ev = (type, icon, text, priority = 5, extras = {}) =>
    events.push({ id:`feed_${Date.now()}_${seq++}`, type, icon, text, ts:Date.now(), priority, ...extras });

  const nickOf = (uid) => allUsers[uid]?.nickname || uid;
  const n      = leaderboard.length;

  // Stable pick: choose from arr deterministically using seed values
  const pick = (arr, ...seeds) => {
    const h = Math.abs(seeds.reduce((a, s) => ((a * 31) + (String(s).charCodeAt(0) | 0)) | 0, 7));
    return arr[h % arr.length];
  };

  // Build prediction stats for one finished match
  const matchPreds = (matchId, match) => {
    const out = [];
    Object.entries(allPredictions).forEach(([uid, preds]) => {
      const p = preds[matchId] || preds[String(matchId)];
      if (!p) return;
      const pts = calcPoints(p, match) || 0;
      const pA  = Number(p.scoreA), pB = Number(p.scoreB);
      const rA  = Number(match.realScoreA), rB = Number(match.realScoreB);
      const exact = pA === rA && pB === rB;
      const realRes = rA > rB ? '1' : rA < rB ? '2' : 'X';
      const predRes = pA > pB ? '1' : pA < pB ? '2' : 'X';
      out.push({ uid, nick:nickOf(uid), pts, exact, correctResult: realRes === predRes, pA, pB });
    });
    return out;
  };

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 1 — LEADERBOARD DRAMA (priority 9–12, the backbone)
  // 70%+ of feed comes from here.
  // ═══════════════════════════════════════════════════════════════
  const hasPrev = prevLeaderboard.length > 0;

  if (hasPrev) {
    leaderboard.forEach(entry => {
      const prev = prevLeaderboard.find(p => p.nickname === entry.nickname);
      if (!prev) return;
      const delta = prev.rank - entry.rank;   // positive = climbed
      const nick  = entry.nickname;

      // ── 1a. New leader — highest drama, multiple humorous variants
      if (entry.rank === 1 && prev.rank > 1) {
        const displaced = prevLeaderboard.find(p => p.rank === 1);
        const d = displaced?.nickname || '?';
        ev('lead', '🏆', pick([
          `${nick} l-a depășit pe ${d} și a urcat pe locul 1!`,
          `${nick} preia conducerea! ${d} pierde tronul.`,
          `🍾 ${nick} a pus șampania la rece. ${d} coboară.`,
          `Schimbare la vârf: ${nick} detronează pe ${d}.`,
          `${nick} joacă Football Manager în viața reală. Locul 1 e al lui!`,
        ], nick, d), 12, { nickname:nick });
      }

      // ── 1b. Lost the lead
      if (prev.rank === 1 && entry.rank > 1) {
        ev('fall', '😬', pick([
          `${nick} pierde primul loc — locul ${entry.rank} acum.`,
          `🚑 ${nick} cere verificarea VAR după ce a ieșit de pe locul 1.`,
          `${nick} coboară de pe tron. Locul ${entry.rank} nu era în plan.`,
          `👀 ${nick} se uită în oglindă și vede locul ${entry.rank}.`,
          `Schimbare la vârf! ${nick} nu mai e lider.`,
        ], nick, entry.rank), 11, { nickname:nick });
      }

      // ── 1c. Entered Top 3
      if (entry.rank <= 3 && prev.rank > 3) {
        ev('top3', '🚀', pick([
          `${nick} intră în Top 3 pentru prima dată!`,
          `🏃 ${nick} revine de nicăieri și forțează podiumul — locul ${entry.rank}!`,
          `${nick} urcă pe podium. Locul ${entry.rank}!`,
          `${nick} forțează intrarea în lupta pentru medalii.`,
        ], nick), 10, { nickname:nick });
      }

      // ── 1d. Fell out of Top 3
      if (entry.rank > 3 && prev.rank <= 3) {
        ev('top3_exit', '💀', pick([
          `${nick} iese din Top 3 — locul ${entry.rank} acum.`,
          `🚑 ${nick} cere verificarea VAR după ce a ieșit din Top 3.`,
          `${nick} a fost pe podium. Locul ${entry.rank} e o altă poveste.`,
          `👀 ${nick} se uită în oglindă și vede locul ${entry.rank}.`,
        ], nick, entry.rank), 10, { nickname:nick });
      }

      // ── 1e. Big climb (2+ positions)
      if (delta >= 2 && entry.rank > 1) {
        ev('rank_up', '📈', pick([
          `${nick} urcă ${delta} locuri — locul ${entry.rank} acum!`,
          `🏃 ${nick} revine în cursă și urcă ${delta} poziții!`,
          `${nick} avansează ${delta} locuri. Pericolul se apropie de top.`,
          `${nick} face saltul de ${delta} locuri — periculos pentru rivali!`,
        ], nick, delta), 9, { nickname:nick });
      }

      // ── 1f. Big drop (2+ positions)
      if (delta <= -2) {
        ev('rank_down', '📉', pick([
          `${nick} coboară ${Math.abs(delta)} locuri — locul ${entry.rank} acum.`,
          `😬 ${nick} pierde ${Math.abs(delta)} poziții după ultimul meci.`,
          `${nick} are nevoie urgentă de puncte. Locul ${entry.rank}.`,
        ], nick, delta), 8, { nickname:nick });
      }

      // ── 1g. Entered Top 5 (climbing into 4th or 5th place)
      if (entry.rank <= 5 && entry.rank > 3 && prev.rank > 5) {
        ev('top5', '📈', pick([
          `${nick} intră în Top 5 — locul ${entry.rank}!`,
          `${nick} urcă în Top 5. Locul ${entry.rank} acum.`,
        ], nick), 7, { nickname:nick });
      }

      // ── 1h. Left Top 5 (was 4th or 5th, now outside)
      if (entry.rank > 5 && prev.rank <= 5 && prev.rank > 3) {
        ev('top5_exit', '📉', pick([
          `${nick} iese din Top 5 — locul ${entry.rank} acum.`,
          `${nick} pierde Top 5. Locul ${entry.rank}.`,
        ], nick, entry.rank), 6, { nickname:nick });
      }
    });

    // ── 1i. Leader extends gap (domination or widening)
    const L = leaderboard[0], S = leaderboard[1];
    const pL = prevLeaderboard[0], pS = prevLeaderboard[1];
    if (L && S && pL && pS) {
      const gap = L.points - S.points, prevGap = pL.points - pS.points;
      if (gap > prevGap && gap >= 15) {
        ev('gap', '👑', pick([
          `${L.nickname} își mărește avantajul la ${gap} puncte față de ${S.nickname}.`,
          `👑 ${L.nickname} și-a mai luat distanță — ${gap} puncte față de ${S.nickname}.`,
          `${L.nickname} fuge de pluton. Avantaj: ${gap} pts.`,
        ], L.nickname, gap), 8);
      }
      // Leader is being chased hard — gap narrowed
      if (gap < prevGap && gap <= 15 && gap > 0) {
        ev('chase', '🔥', pick([
          `${S.nickname} se apropie periculos! Doar ${gap} puncte până la lider.`,
          `⚔️ ${L.nickname} și ${S.nickname} sunt despărțiți de ${gap} puncte — mai puțin decât costă o shaorma.`,
          `${S.nickname} reduce din avans. Diferența: ${gap} pts.`,
        ], S.nickname, gap), 9);
      }
    }

    // ── 1j. Tight battle(s) between adjacent players (≤8 pts apart)
    let battleAdded = 0;
    for (let i = 1; i < Math.min(leaderboard.length, 6) && battleAdded < 2; i++) {
      const a = leaderboard[i-1], b = leaderboard[i];
      const diff = a.points - b.points;
      if (diff <= 8 && diff >= 0) {
        ev('battle', '⚔️', pick([
          `Luptă strânsă: ${a.nickname} (loc ${a.rank}) vs ${b.nickname} (loc ${b.rank}) — doar ${diff} pts diferență!`,
          `⚔️ ${a.nickname} și ${b.nickname} sunt despărțiți de ${diff} puncte — orice e posibil!`,
          `${diff} puncte îi despart pe ${a.nickname} și ${b.nickname}. Un singur meci schimbă totul.`,
        ], a.nickname, b.nickname, diff), 8);
        battleAdded++;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 2 — LEADERBOARD STANDING STORIES (no prev needed)
  // ═══════════════════════════════════════════════════════════════
  if (n >= 2) {
    const leader = leaderboard[0];
    const last   = leaderboard[n - 1];

    // ── 2a. Exact score streaks — player performance narrative
    leaderboard.forEach(entry => {
      const es = entry.exactScores || 0;
      if (es >= 5) {
        ev('streak', '🔥', pick([
          `${entry.nickname} are ${es} scoruri exacte — joacă altceva față de restul!`,
          `🔥 ${entry.nickname} joacă Football Manager în viața reală. ${es} scoruri exacte!`,
          `${entry.nickname}: ${es} scoruri exacte. Cineva face analytics serios.`,
        ], entry.nickname, es), 9, { nickname:entry.nickname });
      } else if (es >= 3) {
        ev('streak', '🔥', pick([
          `${entry.nickname} are ${es} scoruri exacte — formă excelentă!`,
          `${es} scoruri exacte pentru ${entry.nickname}. Nu e noroc, e sistem.`,
        ], entry.nickname, es), 7, { nickname:entry.nickname });
      } else if (es >= 2) {
        ev('streak', '🔥', `${entry.nickname} a mai nimerit un scor exact — ${es} total.`, 5, { nickname:entry.nickname });
      }
    });

    // ── 2b. Leader near a milestone
    const milestones = [50, 100, 150, 200, 250, 300, 400, 500];
    milestones.forEach(m => {
      const diff = m - leader.points;
      if (diff > 0 && diff <= 15) {
        ev('milestone', '🔥', pick([
          `${leader.nickname} e la ${diff} puncte de borna ${m}!`,
          `${leader.nickname} se apropie de ${m} puncte — doar ${diff} rămase.`,
        ], leader.nickname, m), 7);
      }
    });

    // ── 2c. Top 4+ all compressed → tension headline
    const top = leaderboard.slice(0, Math.min(5, n));
    const spread = top[0].points - top[top.length - 1].points;
    if (spread <= 25 && top.length >= 4) {
      ev('tension', '📊', pick([
        `Lupta pentru Top ${top.length} se încinge — doar ${spread} puncte despart totul!`,
        `📊 ${spread} puncte între locurile 1 și ${top.length}. Un singur meci poate schimba tot.`,
        `Clasamentul e o bombă cu ceas. ${spread} puncte despart primii ${top.length}.`,
      ], spread, top.length), 7);
    }

    // ── 2d. Domination — leader has 2× the points of 2nd
    const second = leaderboard[1];
    if (second && second.points > 0 && leader.points >= second.points * 2 && leader.points >= 100) {
      ev('domination', '👑', pick([
        `${leader.nickname} domină clasamentul — ${leader.points} pts, dublul lui ${second.nickname}.`,
        `${leader.nickname} e pe altă planetă față de restul. ${leader.points} puncte totale.`,
      ], leader.nickname), 7, { nickname:leader.nickname });
    }

    // ── 2e. Last place humour (light, friendly)
    if (n >= 4 && last.points === 0) {
      ev('fun', '😅', pick([
        `${last.nickname} are 0 puncte. Turneul abia a început — sau nu?`,
        `🫣 ${last.nickname} caută telecomanda. 0 puncte deocamdată.`,
        `${last.nickname} mai are timp să se întoarcă. Teoretic.`,
      ], last.nickname), 3, { nickname:last.nickname });
    } else if (n >= 4 && last.points > 0 && last.points < leaderboard[0].points * 0.2) {
      ev('fun', '😬', pick([
        `${last.nickname} vede lumina de la capătul tunelului — sau e un tren?`,
        `${last.nickname} luptă singur la coada clasamentului.`,
      ], last.nickname), 3, { nickname:last.nickname });
    }

    // ── 2f. Close podium — all within 20 pts
    if (n >= 3) {
      const third = leaderboard[2];
      if (leader.points - third.points <= 20 && leader.points > 0) {
        ev('drama', '⚔️', pick([
          `Podiumul e la un meci distanță: ${leader.nickname}, ${second.nickname}, ${third.nickname} — orice e posibil!`,
          `Top 3 nedecis: ${leader.points - third.points} puncte despart locul 1 de locul 3.`,
        ], leader.nickname, third.nickname), 7);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 3 — MATCH EVENTS (lower priority — max 30% of feed)
  // Exact scores and top points capped to 1 each per render.
  // ═══════════════════════════════════════════════════════════════
  const justFinished = Object.values(finishedResults).filter(r =>
    r.liveStatus === 'ft' &&
    r.realScoreA !== null && r.realScoreA !== undefined &&
    r.realScoreB !== null && r.realScoreB !== undefined
  );

  // Track one best-round winner across all matches
  let globalTopUid = null, globalTopPts = 0, globalTopMatch = null;

  justFinished.forEach(result => {
    const match = matches.find(m => m.id === (result.matchId ?? result.id));
    if (!match) return;
    const mName    = `${match.teamA} vs ${match.teamB}`;
    const sA       = Number(result.realScoreA ?? result.homeScore ?? 0);
    const sB       = Number(result.realScoreB ?? result.awayScore ?? 0);
    const scoreStr = `${sA}–${sB}`;
    const preds    = matchPreds(match.id, { ...match, isFinished:true, realScoreA:sA, realScoreB:sB });
    const exact    = preds.filter(p => p.exact);
    const correct  = preds.filter(p => p.correctResult);
    const sorted   = [...preds].sort((a, b) => b.pts - a.pts);
    const topEntry = sorted[0];
    const total    = preds.length;

    // Track global best
    if (topEntry && topEntry.pts > globalTopPts) {
      globalTopPts = topEntry.pts; globalTopUid = topEntry.uid; globalTopMatch = match;
    }

    // ── 3a. Exact score — single event per match, lower priority than drama
    if (exact.length === 1) {
      ev('exact', '🎯', pick([
        `${exact[0].nick} a ghicit scorul exact: ${scoreStr} la ${mName}.`,
        `🤏 ${exact[0].nick} a nimerit-o perfect: ${scoreStr}!`,
        `Scor exact pentru ${exact[0].nick} la ${mName}!`,
      ], exact[0].nick, match.id), 6, { uid:exact[0].uid });
    } else if (exact.length === 2) {
      ev('exact', '🎯', `${exact[0].nick} și ${exact[1].nick} au prezis exact ${scoreStr} la ${mName}.`, 6);
    } else if (exact.length >= 3) {
      ev('exact', '🎯', `${exact.length} jucători au nimerit ${scoreStr} la ${mName} — incredibil!`, 6);
    }

    // ── 3b. Near-miss — one goal away (humorous)
    if (exact.length === 0) {
      const near = preds.find(p => Math.abs(p.pA - sA) + Math.abs(p.pB - sB) === 1);
      if (near) {
        ev('near', '🤏', pick([
          `${near.nick} a fost la un singur gol de glorie la ${mName}.`,
          `${near.nick} a ratat scorul exact cu un gol. Aproape!`,
        ], near.nick, match.id), 5, { uid:near.uid });
      }
    }

    // ── 3c. Upset — nobody got the result right (funny, lower priority)
    if (total >= 2 && correct.length === 0) {
      ev('upset', '😱', pick([
        `Surpriza serii: ${mName} ${scoreStr} — nimeni nu a anticipat-o!`,
        `🥶 ${match.teamB} a făcut victime. Nimeni nu a prezis ${scoreStr}.`,
        `${mName}: ${scoreStr} — zero predicții corecte. Toți au greșit.`,
      ], match.id, sA, sB), 5);
    }

    // ── 3d. Collective win — everyone got result right
    if (total >= 3 && correct.length === total) {
      ev('stat', '🎉', `Toți jucătorii au prezis corect rezultatul la ${mName}!`, 4);
    }
  });

  // ── 3e. One "best of round" summary (only when 2+ matches finished)
  if (justFinished.length >= 2 && globalTopUid && globalTopPts > 0) {
    ev('best_round', '🏅', pick([
      `Cel mai mare punctaj al etapei: ${globalTopPts} pts — ${nickOf(globalTopUid)} la ${globalTopMatch.teamA} vs ${globalTopMatch.teamB}.`,
      `${nickOf(globalTopUid)} câștigă etapa cu ${globalTopPts} pts la ${globalTopMatch.teamA} vs ${globalTopMatch.teamB}!`,
    ], globalTopUid, globalTopPts), 6);
  }

  // ═══════════════════════════════════════════════════════════════
  // FINAL — Deduplicate, enforce mix rules, return top 20
  // Rules:
  //   • Never 3 consecutive items of same type
  //   • Types 'exact' and 'points'/'best_round' each capped at 2 in feed
  //   • Drama types (lead/fall/rank_up/top3/top5/battle/chase/gap) get priority slots
  // ═══════════════════════════════════════════════════════════════
  const seen = new Set();
  const deduped = events
    .filter(e => { if (seen.has(e.text)) return false; seen.add(e.text); return true; })
    .sort((a, b) => (b.priority - a.priority) || (b.ts - a.ts));

  // Drama types that should dominate the feed
  const DRAMA_TYPES = new Set(['lead','fall','top3','top3_exit','top5','top5_exit','rank_up','rank_down',
                                'battle','chase','gap','streak',
                                'drama','tension','domination','milestone']);
  // Stat types that should be limited
  const STAT_TYPES  = new Set(['exact','near','points','best_round','stat','upset','upset2','fun']);

  const result = [];
  const typeCount = {};

  for (const e of deduped) {
    if (result.length >= 20) break;

    // Hard cap: no more than 2 exact-score events and 2 stat/points events total
    if (e.type === 'exact' && (typeCount['exact'] || 0) >= 2) continue;
    if (STAT_TYPES.has(e.type) && !DRAMA_TYPES.has(e.type)) {
      const statTotal = ['exact','near','points','best_round','stat','upset','upset2','fun']
        .reduce((s, t) => s + (typeCount[t] || 0), 0);
      if (statTotal >= 4) continue;  // cap stat events at 4 of 20 slots
    }

    // No 3 consecutive same type
    const recent2 = result.slice(-2).map(x => x.type);
    if (recent2.length === 2 && recent2[0] === e.type && recent2[1] === e.type) continue;

    result.push(e);
    typeCount[e.type] = (typeCount[e.type] || 0) + 1;
  }

  // Backfill remaining slots from deduped (relaxed rules) if we have room
  if (result.length < Math.min(20, deduped.length)) {
    for (const e of deduped) {
      if (result.length >= 20) break;
      if (!result.find(x => x.id === e.id)) result.push(e);
    }
  }

  return result.slice(0, 20);
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
