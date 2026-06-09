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

  // 4. Possession accuracy: max(0, 15 - abs(predicted - real))
  let possession = 0;
  if (pPoss != null && rP != null) {
    possession = Math.max(0, 15 - Math.abs(pPoss - rP));
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
export const QUALIFY_PCT   = 0.70;
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
  const cutoff = Math.max(1, Math.ceil(players.length * QUALIFY_PCT));
  return players.map((p, i) => ({ ...p, rank:i+1, qualified:i < cutoff }));
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
// Generates rich, dramatic, varied feed events from real standings + results.
// Mixes informative / competitive / dramatic / funny headlines.
// event shape: { id, type, icon, text, ts, uid?, nickname? }
// ─────────────────────────────────────────────────────────────────────────────

export function generateActivityFeed({
  leaderboard     = [],   // current leaderboard array from buildLeaderboard()
  prevLeaderboard = [],   // leaderboard before latest result (for rank delta)
  finishedResults = {},   // { matchId: result }
  allPredictions  = {},   // { uid: { matchId: pred } }
  allUsers        = {},   // { uid: { nickname, avatarId } }
  matches         = [],   // buildMatches() output
} = {}) {
  const events = [];
  let seq = 0;
  // Each event carries a priority (higher = shown first) and a dedup key
  const ev = (type, icon, text, priority = 5, extras = {}) =>
    events.push({ id:`feed_${Date.now()}_${seq++}`, type, icon, text, ts:Date.now(), priority, ...extras });

  const nickOf = (uid) => allUsers[uid]?.nickname || uid;
  const n      = leaderboard.length;

  // ── helper: pick one string from array using a stable hash of inputs
  const pick = (arr, ...seeds) => {
    const h = Math.abs(seeds.reduce((a, s) => (a * 31 + String(s).charCodeAt(0)|0) | 0, 7));
    return arr[h % arr.length];
  };

  // ── helper: get all predictions + points for one match
  const matchPreds = (matchId, match) => {
    const out = [];
    Object.entries(allPredictions).forEach(([uid, preds]) => {
      const p = preds[matchId] || preds[String(matchId)];
      if (!p) return;
      const pts = calcPoints(p, match) || 0;
      const exact = Number(p.scoreA) === Number(match.realScoreA) &&
                    Number(p.scoreB) === Number(match.realScoreB);
      const correctResult = (() => {
        const rA = Number(match.realScoreA), rB = Number(match.realScoreB);
        const pA = Number(p.scoreA), pB = Number(p.scoreB);
        const realRes = rA > rB ? '1' : rA < rB ? '2' : 'X';
        const predRes = pA > pB ? '1' : pA < pB ? '2' : 'X';
        return realRes === predRes;
      })();
      out.push({ uid, nick:nickOf(uid), pts, exact, correctResult,
                 pA:Number(p.scoreA), pB:Number(p.scoreB) });
    });
    return out;
  };

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 1 — Per-match events (fired for every finished match)
  // ═══════════════════════════════════════════════════════════════
  const justFinished = Object.values(finishedResults).filter(r =>
    r.liveStatus === 'ft' &&
    r.realScoreA !== null && r.realScoreA !== undefined &&
    r.realScoreB !== null && r.realScoreB !== undefined
  );

  justFinished.forEach(result => {
    const match = matches.find(m => m.id === (result.matchId ?? result.id));
    if (!match) return;
    const mName  = `${match.teamA} vs ${match.teamB}`;
    const sA     = Number(result.realScoreA ?? result.homeScore ?? 0);
    const sB     = Number(result.realScoreB ?? result.awayScore ?? 0);
    const scoreStr = `${sA}–${sB}`;

    // Build pred stats for this match
    const preds    = matchPreds(match.id, { ...match, isFinished:true, realScoreA:sA, realScoreB:sB });
    const exact    = preds.filter(p => p.exact);
    const correct  = preds.filter(p => p.correctResult);
    const sorted   = [...preds].sort((a,b) => b.pts - a.pts);
    const topEntry = sorted[0];
    const totalPreds = preds.length;

    // ── 1a. Exact score hit(s)
    if (exact.length === 1) {
      const phrases = [
        `${exact[0].nick} a ghicit scorul exact: ${scoreStr} 🎯`,
        `${exact[0].nick} a nimerit-o perfect: ${scoreStr}!`,
        `Scor exact pentru ${exact[0].nick} la ${mName}!`,
      ];
      ev('exact', '🎯', pick(phrases, exact[0].nick, match.id), 10, { uid:exact[0].uid });
    } else if (exact.length === 2) {
      ev('exact', '🎯', `${exact[0].nick} și ${exact[1].nick} au prezis scorul exact: ${scoreStr}`, 10);
    } else if (exact.length >= 3) {
      const names = exact.slice(0,2).map(p=>p.nick).join(', ');
      ev('exact', '🎯', `${names} și alți ${exact.length-2} au nimerit ${scoreStr} — impresionant!`, 10);
    } else if (totalPreds > 0) {
      // Nobody got exact
      ev('miss', '😱', pick([
        `Nimeni nu a anticipat ${scoreStr} la ${mName}.`,
        `${mName}: ${scoreStr} — surpriză totală! Zero scoruri exacte.`,
        `Toată lumea a greșit scorul la ${mName}.`,
      ], match.id, sA, sB), 6);
    }

    // ── 1b. Top scorer of the match
    if (topEntry && topEntry.pts > 0) {
      const phrases = [
        `🏅 Cel mai mare punctaj al meciului: ${topEntry.pts} pts — ${topEntry.nick}`,
        `${topEntry.nick} câștigă ${topEntry.pts} pts la ${mName}`,
        `Etapa aceasta: ${topEntry.nick} livrează ${topEntry.pts} puncte`,
      ];
      ev('points', '🏅', pick(phrases, topEntry.uid, match.id), 8, { uid:topEntry.uid });
    }

    // ── 1c. How many got the result right
    if (totalPreds >= 3) {
      if (correct.length === 0) {
        ev('miss', '😬', `Nimeni nu a prezis corect rezultatul la ${mName}`, 5);
      } else if (correct.length >= 3 && correct.length === totalPreds) {
        ev('stat', '🔥', `Toți jucătorii au prezis corect rezultatul la ${mName}!`, 5);
      } else if (correct.length >= 3) {
        ev('stat', '🔥', `${correct.length} jucători au prezis corect rezultatul la ${mName}`, 5);
      }
    }

    // ── 1d. Near-miss: someone was one goal away from exact
    if (exact.length === 0) {
      const nearMiss = preds.find(p =>
        Math.abs(p.pA - sA) + Math.abs(p.pB - sB) === 1
      );
      if (nearMiss) {
        ev('near', '🎯', `${nearMiss.nick} a fost la un gol distanță de scorul perfect la ${mName}`, 6, { uid:nearMiss.uid });
      }
    }

    // ── 1e. Upset / surprise result (0 correct results at all)
    if (totalPreds >= 2 && correct.length === 0) {
      ev('upset', '😱', pick([
        `Surpriza serii: ${mName} ${scoreStr} — nimeni nu a anticipat-o!`,
        `${mName}: ${scoreStr} e rezultatul pe care nimeni nu l-a văzut venind.`,
      ], match.id), 7);
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 2 — Leaderboard rank-change events
  // ═══════════════════════════════════════════════════════════════
  const hasPrev = prevLeaderboard.length > 0;

  if (hasPrev) {
    leaderboard.forEach(entry => {
      const prev = prevLeaderboard.find(p => p.nickname === entry.nickname);
      if (!prev) return;
      const delta    = prev.rank - entry.rank;  // positive = climbed
      const prevPts  = prev.points || 0;
      const ptsDiff  = entry.points - prevPts;
      const nick     = entry.nickname;

      // ── 2a. Took the lead
      if (entry.rank === 1 && prev.rank > 1) {
        const displaced = prevLeaderboard.find(p => p.rank === 1);
        if (displaced) {
          ev('lead', '🏆', pick([
            `${nick} l-a depășit pe ${displaced.nickname} și a urcat pe locul 1!`,
            `${nick} preia conducerea clasamentului! ${displaced.nickname} coboară.`,
            `Schimbare la vârf: ${nick} detronează pe ${displaced.nickname}.`,
          ], nick, displaced.nickname), 10, { nickname:nick });
        } else {
          ev('lead', '🏆', `${nick} este noul lider al clasamentului!`, 10, { nickname:nick });
        }
      }

      // ── 2b. Lost the lead (was #1, no longer)
      if (prev.rank === 1 && entry.rank > 1) {
        // Find how long they were at #1 (count consecutive prev tops — approximate)
        ev('fall', '😬', pick([
          `${nick} pierde locul 1 după ce a condus clasamentul.`,
          `${nick} coboară de pe tron — locul ${entry.rank} acum.`,
          `Schimbare la vârf! ${nick} nu mai este lider.`,
        ], nick, entry.rank), 9, { nickname:nick });
      }

      // ── 2c. Big climb (3+ positions)
      if (delta >= 3) {
        const phrases = [
          `${nick} urcă ${delta} poziții după ultimul meci!`,
          `${nick} avansează ${delta} locuri și intră în Top ${entry.rank}!`,
          `${nick} face saltul de ${delta} locuri — periculos!`,
        ];
        ev('rank_up', '📈', pick(phrases, nick, delta), 8, { nickname:nick });
      }

      // ── 2d. Big drop (3+ positions)
      if (delta <= -3) {
        ev('rank_down', '📉', pick([
          `${nick} coboară ${Math.abs(delta)} locuri în clasament.`,
          `${nick} pierde ${Math.abs(delta)} poziții — loc ${entry.rank} acum.`,
        ], nick, delta), 7, { nickname:nick });
      }

      // ── 2e. Just entered Top 3
      if (entry.rank <= 3 && prev.rank > 3) {
        ev('top3', '🚀', pick([
          `${nick} intră în Top 3 pentru prima dată!`,
          `${nick} forțează intrarea în podium — locul ${entry.rank}!`,
        ], nick), 9, { nickname:nick });
      }

      // ── 2f. Just fell out of Top 3
      if (entry.rank > 3 && prev.rank <= 3) {
        ev('top3_exit', '💀', `${nick} iese din Top 3 — locul ${entry.rank} acum.`, 8, { nickname:nick });
      }

      // ── 2g. Crossed the qualification line (was below cutoff, now above)
      if (entry.qualified && !prev.qualified) {
        ev('qualify', '⚡', pick([
          `${nick} revine în cursa pentru calificare!`,
          `${nick} trece linia calificării — mai are de luptat!`,
        ], nick), 8, { nickname:nick });
      }

      // ── 2h. Fell below qualification line
      if (!entry.qualified && prev.qualified) {
        ev('disqualify', '💀', pick([
          `${nick} cade sub linia calificării!`,
          `${nick} pierde zona calificată — nevoie urgentă de puncte.`,
        ], nick), 8, { nickname:nick });
      }
    });

    // ── 2i. Gap at the top widened
    const leader     = leaderboard[0];
    const second     = leaderboard[1];
    const prevLeader = prevLeaderboard[0];
    const prevSecond = prevLeaderboard[1];
    if (leader && second && prevLeader && prevSecond) {
      const gap     = leader.points   - second.points;
      const prevGap = prevLeader.points - prevSecond.points;
      if (gap > prevGap && gap >= 20) {
        ev('gap', '👑', `${leader.nickname} își mărește avantajul la ${gap} puncte față de ${second.nickname}.`, 7);
      }
    }

    // ── 2j. Tight battle for a specific rank (≤5 pts between adjacent players)
    for (let i = 1; i < Math.min(leaderboard.length, 5); i++) {
      const a = leaderboard[i-1], b = leaderboard[i];
      const diff = a.points - b.points;
      if (diff <= 5 && diff >= 0) {
        ev('battle', '⚔️', pick([
          `Luptă strânsă: doar ${diff} puncte îi despart pe ${a.nickname} (loc ${a.rank}) și ${b.nickname} (loc ${b.rank})!`,
          `${a.nickname} vs ${b.nickname}: ${diff} puncte diferență — totul se poate schimba!`,
        ], a.nickname, b.nickname), 6);
        break; // one battle message is enough
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 3 — Leaderboard stats (from current state, no prev needed)
  // ═══════════════════════════════════════════════════════════════
  if (leaderboard.length >= 2) {
    const leader  = leaderboard[0];
    const last    = leaderboard[leaderboard.length - 1];

    // ── 3a. Exact score streaks
    leaderboard.forEach(entry => {
      const es = entry.exactScores || 0;
      if (es >= 5) {
        ev('streak', '🔥', `${entry.nickname} are ${es} scoruri exacte — e nebun!`, 9, { nickname:entry.nickname });
      } else if (es >= 3) {
        ev('streak', '🔥', `${entry.nickname} are ${es} scoruri exacte în total.`, 7, { nickname:entry.nickname });
      } else if (es >= 2) {
        ev('streak', '🔥', `${entry.nickname} a mai nimerit un scor exact — ${es} total.`, 6, { nickname:entry.nickname });
      }
    });

    // ── 3b. Leader near a "round number" points milestone
    const milestones = [50, 100, 150, 200, 250, 300, 400, 500];
    milestones.forEach(m => {
      const diff = m - leader.points;
      if (diff > 0 && diff <= 15) {
        ev('milestone', '🔥', `${leader.nickname} este la doar ${diff} puncte de ${m} — recordul se apropie!`, 6);
      }
    });

    // ── 3c. Top 5 tension blurb (points spread)
    const top5 = leaderboard.slice(0, Math.min(5, leaderboard.length));
    const spread = top5[0].points - top5[top5.length-1].points;
    if (spread <= 30 && top5.length >= 4) {
      ev('tension', '📊', `Lupta pentru Top ${top5.length} se încinge — doar ${spread} puncte îi despart pe toți!`, 5);
    }

    // ── 3d. Last place player comment (only if 4+ players)
    if (n >= 4 && last.points === 0 && events.length < 8) {
      ev('fun', '😂', `${last.nickname} are 0 puncte — turneul abia a început!`, 3, { nickname:last.nickname });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 4 — Per-match "best of round" summary (after all matches done)
  // ═══════════════════════════════════════════════════════════════
  if (justFinished.length >= 2) {
    // Find the overall highest single-match scorer
    let globalTopUid = null, globalTopPts = 0, globalTopMatch = null;
    justFinished.forEach(result => {
      const match = matches.find(m => m.id === (result.matchId ?? result.id));
      if (!match) return;
      const sA = Number(result.realScoreA ?? result.homeScore ?? 0);
      const sB = Number(result.realScoreB ?? result.awayScore ?? 0);
      const preds = matchPreds(match.id, { ...match, isFinished:true, realScoreA:sA, realScoreB:sB });
      preds.forEach(p => {
        if (p.pts > globalTopPts) { globalTopPts = p.pts; globalTopUid = p.uid; globalTopMatch = match; }
      });
    });
    if (globalTopUid && globalTopPts > 0) {
      ev('best_round', '🏅', `Cel mai mare punctaj al etapei: ${globalTopPts} pts — ${nickOf(globalTopUid)} la ${globalTopMatch.teamA} vs ${globalTopMatch.teamB}.`, 9);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCK 5 — Special narrative events (adds colour/drama)
  // ═══════════════════════════════════════════════════════════════
  if (leaderboard.length >= 3) {
    const leader = leaderboard[0];
    const second = leaderboard[1];
    const third  = leaderboard[2];

    // Podium is all within 20 pts — dramatic!
    if (leader.points - third.points <= 20 && leader.points > 0) {
      ev('drama', '⚔️', `Podiumul e la un meci distanță: ${leader.nickname}, ${second.nickname}, ${third.nickname} — orice e posibil!`, 6);
    }

    // Leader has twice the points of 2nd — domination
    if (second.points > 0 && leader.points >= second.points * 2 && leader.points >= 100) {
      ev('domination', '👑', `${leader.nickname} domină clasamentul cu ${leader.points} pts — dublul rivalilor!`, 6, { nickname:leader.nickname });
    }
  }

  // ── 5b. "Nobody predicted the winner" for any finished match
  justFinished.forEach(result => {
    const match = matches.find(m => m.id === (result.matchId ?? result.id));
    if (!match) return;
    const sA = Number(result.realScoreA ?? result.homeScore ?? 0);
    const sB = Number(result.realScoreB ?? result.awayScore ?? 0);
    const ps  = matchPreds(match.id, { ...match, isFinished:true, realScoreA:sA, realScoreB:sB });
    const allMissedResult = ps.length >= 2 && ps.every(p => !p.correctResult);
    if (allMissedResult) {
      ev('upset2', '😱', `Toată lumea a greșit rezultatul la ${match.teamA} vs ${match.teamB} — surpriza serii!`, 7);
    }
  });

  // ─── Deduplicate, sort by priority then ts, cap at 20 ──────────
  const seen    = new Set();
  const deduped = events.filter(e => {
    const key = e.text;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: higher priority first, then newer first; also avoid showing
  // two events of the exact same type back-to-back (interleave types)
  deduped.sort((a, b) => (b.priority - a.priority) || (b.ts - a.ts));

  // Interleave: don't show 3 consecutive items of the same type
  const result = [];
  const typeCounts = {};
  for (const e of deduped) {
    const recent = result.slice(-2).map(x => x.type);
    const consecSame = recent.length === 2 && recent[0] === e.type && recent[1] === e.type;
    if (!consecSame) {
      result.push(e);
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
      if (result.length >= 20) break;
    }
  }
  // Fill back up with remaining items if we dropped some
  if (result.length < Math.min(20, deduped.length)) {
    for (const e of deduped) {
      if (!result.find(x => x.id === e.id)) {
        result.push(e);
        if (result.length >= 20) break;
      }
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
