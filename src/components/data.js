// ─── src/lib/data.js ──────────────────────────────────────────────────────────
// Pure JS — no React imports. All fixtures, scoring, helpers, demo data.
// To connect to Supabase: replace FINISHED_RESULTS and demo arrays
// with real database queries using the Supabase JS client.
// ─────────────────────────────────────────────────────────────────────────────

// ─── FIXTURES ─────────────────────────────────────────────────────────────────
// Real FIFA World Cup 2026 matches. Times in EEST (UTC+3, Romania time).
const ALL_MATCHES = [
  // ── GRUPA A ──
  { id: 1,  group:"A", teamA:"Mexic",         teamB:"Africa de Sud",  flagA:"🇲🇽", flagB:"🇿🇦", time:"2026-06-11T22:00:00", venue:"Mexico City"   },
  { id: 2,  group:"A", teamA:"Coreea de Sud", teamB:"Cehia",          flagA:"🇰🇷", flagB:"🇨🇿", time:"2026-06-12T01:00:00", venue:"Dallas"        },
  { id: 3,  group:"A", teamA:"Mexic",         teamB:"Coreea de Sud",  flagA:"🇲🇽", flagB:"🇰🇷", time:"2026-06-15T22:00:00", venue:"Dallas"        },
  { id: 4,  group:"A", teamA:"Cehia",         teamB:"Africa de Sud",  flagA:"🇨🇿", flagB:"🇿🇦", time:"2026-06-15T19:00:00", venue:"Atlanta"       },
  { id: 5,  group:"A", teamA:"Mexic",         teamB:"Cehia",          flagA:"🇲🇽", flagB:"🇨🇿", time:"2026-06-19T22:00:00", venue:"Los Angeles"   },
  { id: 6,  group:"A", teamA:"Africa de Sud", teamB:"Coreea de Sud",  flagA:"🇿🇦", flagB:"🇰🇷", time:"2026-06-19T22:00:00", venue:"Houston"       },
  // ── GRUPA C ──
  { id: 7,  group:"C", teamA:"Brazilia",      teamB:"Maroc",          flagA:"🇧🇷", flagB:"🇲🇦", time:"2026-06-13T23:00:00", venue:"New York"      },
  { id: 8,  group:"C", teamA:"Haiti",         teamB:"Scoția",         flagA:"🇭🇹", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-14T02:00:00", venue:"Houston"       },
  { id: 9,  group:"C", teamA:"Brazilia",      teamB:"Scoția",         flagA:"🇧🇷", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-18T02:30:00", venue:"Miami"         },
  { id: 10, group:"C", teamA:"Maroc",         teamB:"Haiti",          flagA:"🇲🇦", flagB:"🇭🇹", time:"2026-06-17T23:00:00", venue:"Atlanta"       },
  { id: 11, group:"C", teamA:"Brazilia",      teamB:"Haiti",          flagA:"🇧🇷", flagB:"🇭🇹", time:"2026-06-22T02:00:00", venue:"Miami"         },
  { id: 12, group:"C", teamA:"Scoția",        teamB:"Maroc",          flagA:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", flagB:"🇲🇦", time:"2026-06-22T02:00:00", venue:"Seattle"       },
  // ── GRUPA H ──
  { id: 13, group:"H", teamA:"Spania",        teamB:"Cap Verde",      flagA:"🇪🇸", flagB:"🇨🇻", time:"2026-06-15T18:00:00", venue:"Atlanta"       },
  { id: 14, group:"H", teamA:"Arabia Saudită",teamB:"Uruguay",        flagA:"🇸🇦", flagB:"🇺🇾", time:"2026-06-15T21:00:00", venue:"New York"      },
  { id: 15, group:"H", teamA:"Spania",        teamB:"Arabia Saudită", flagA:"🇪🇸", flagB:"🇸🇦", time:"2026-06-21T18:00:00", venue:"Atlanta"       },
  { id: 16, group:"H", teamA:"Uruguay",       teamB:"Cap Verde",      flagA:"🇺🇾", flagB:"🇨🇻", time:"2026-06-21T21:00:00", venue:"Dallas"        },
  { id: 17, group:"H", teamA:"Spania",        teamB:"Uruguay",        flagA:"🇪🇸", flagB:"🇺🇾", time:"2026-06-25T03:00:00", venue:"Guadalajara"   },
  { id: 18, group:"H", teamA:"Cap Verde",     teamB:"Arabia Saudită", flagA:"🇨🇻", flagB:"🇸🇦", time:"2026-06-25T03:00:00", venue:"Atlanta"       },
  // ── GRUPA I (Grupa Morții) ──
  { id: 19, group:"I", teamA:"Franța",        teamB:"Senegal",        flagA:"🇫🇷", flagB:"🇸🇳", time:"2026-06-16T00:00:00", venue:"New York"      },
  { id: 20, group:"I", teamA:"Norvegia",      teamB:"Irak",           flagA:"🇳🇴", flagB:"🇮🇶", time:"2026-06-16T03:00:00", venue:"Philadelphia"  },
  { id: 21, group:"I", teamA:"Franța",        teamB:"Irak",           flagA:"🇫🇷", flagB:"🇮🇶", time:"2026-06-20T02:00:00", venue:"Philadelphia"  },
  { id: 22, group:"I", teamA:"Senegal",       teamB:"Norvegia",       flagA:"🇸🇳", flagB:"🇳🇴", time:"2026-06-20T02:00:00", venue:"New York"      },
  { id: 23, group:"I", teamA:"Franța",        teamB:"Norvegia",       flagA:"🇫🇷", flagB:"🇳🇴", time:"2026-06-24T00:00:00", venue:"Boston"        },
  { id: 24, group:"I", teamA:"Irak",          teamB:"Senegal",        flagA:"🇮🇶", flagB:"🇸🇳", time:"2026-06-24T00:00:00", venue:"New York"      },
  // ── GRUPA J ──
  { id: 25, group:"J", teamA:"Argentina",     teamB:"Algeria",        flagA:"🇦🇷", flagB:"🇩🇿", time:"2026-06-17T03:00:00", venue:"Kansas City"   },
  { id: 26, group:"J", teamA:"Austria",       teamB:"Iordania",       flagA:"🇦🇹", flagB:"🇯🇴", time:"2026-06-17T00:00:00", venue:"Dallas"        },
  { id: 27, group:"J", teamA:"Argentina",     teamB:"Austria",        flagA:"🇦🇷", flagB:"🇦🇹", time:"2026-06-21T02:00:00", venue:"Dallas"        },
  { id: 28, group:"J", teamA:"Algeria",       teamB:"Iordania",       flagA:"🇩🇿", flagB:"🇯🇴", time:"2026-06-21T05:00:00", venue:"San Francisco" },
  { id: 29, group:"J", teamA:"Argentina",     teamB:"Iordania",       flagA:"🇦🇷", flagB:"🇯🇴", time:"2026-06-25T01:00:00", venue:"Dallas"        },
  { id: 30, group:"J", teamA:"Algeria",       teamB:"Austria",        flagA:"🇩🇿", flagB:"🇦🇹", time:"2026-06-25T01:00:00", venue:"Kansas City"   },
  // ── GRUPA K ──
  { id: 31, group:"K", teamA:"Portugalia",    teamB:"Uzbekistan",     flagA:"🇵🇹", flagB:"🇺🇿", time:"2026-06-17T18:00:00", venue:"Houston"       },
  { id: 32, group:"K", teamA:"Colombia",      teamB:"Congo RD",       flagA:"🇨🇴", flagB:"🇨🇩", time:"2026-06-17T04:00:00", venue:"Guadalajara"   },
  { id: 33, group:"K", teamA:"Portugalia",    teamB:"Congo RD",       flagA:"🇵🇹", flagB:"🇨🇩", time:"2026-06-21T18:00:00", venue:"Boston"        },
  { id: 34, group:"K", teamA:"Uzbekistan",    teamB:"Colombia",       flagA:"🇺🇿", flagB:"🇨🇴", time:"2026-06-21T21:00:00", venue:"Guadalajara"   },
  { id: 35, group:"K", teamA:"Portugalia",    teamB:"Colombia",       flagA:"🇵🇹", flagB:"🇨🇴", time:"2026-06-25T22:00:00", venue:"Los Angeles"   },
  { id: 36, group:"K", teamA:"Congo RD",      teamB:"Uzbekistan",     flagA:"🇨🇩", flagB:"🇺🇿", time:"2026-06-25T22:00:00", venue:"Guadalajara"   },
  // ── GRUPA L ──
  { id: 37, group:"L", teamA:"Anglia",        teamB:"Ghana",          flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇬🇭", time:"2026-06-17T21:00:00", venue:"Boston"        },
  { id: 38, group:"L", teamA:"Panama",        teamB:"Croația",        flagA:"🇵🇦", flagB:"🇭🇷", time:"2026-06-18T00:00:00", venue:"Toronto"       },
  { id: 39, group:"L", teamA:"Anglia",        teamB:"Panama",         flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇵🇦", time:"2026-06-22T00:00:00", venue:"Miami"         },
  { id: 40, group:"L", teamA:"Croația",       teamB:"Ghana",          flagA:"🇭🇷", flagB:"🇬🇭", time:"2026-06-22T03:00:00", venue:"Philadelphia"  },
  { id: 41, group:"L", teamA:"Anglia",        teamB:"Croația",        flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇭🇷", time:"2026-06-27T01:00:00", venue:"Seattle"       },
  { id: 42, group:"L", teamA:"Ghana",         teamB:"Panama",         flagA:"🇬🇭", flagB:"🇵🇦", time:"2026-06-27T01:00:00", venue:"New York"      },
];

// ─── MATCH STATUS ─────────────────────────────────────────────────────────────
// To mark a match finished after admin enters the result, add its ID here.
// In production: this object is replaced by a Supabase query.
export const FINISHED_RESULTS = {
  // Example (uncomment to test):
  // 7: { realScoreA: 2, realScoreB: 1, realPossession: 58, realCorners: 9 },
};

export const LOCK_BEFORE_MS = 30 * 60 * 1000; // predictions lock 30 min before kickoff

const _now = Date.now();

export const MATCHES = ALL_MATCHES.map((m) => {
  const kickoff    = new Date(m.time).getTime();
  const isLocked   = _now >= kickoff - LOCK_BEFORE_MS;
  const result     = FINISHED_RESULTS[m.id] ?? null;
  const isFinished = result !== null;
  return {
    ...m,
    isLocked,
    isFinished,
    realScoreA:     result?.realScoreA     ?? null,
    realScoreB:     result?.realScoreB     ?? null,
    realPossession: result?.realPossession ?? null,
    realCorners:    result?.realCorners    ?? null,
  };
});

export const GROUPS = ["A","C","H","I","J","K","L"];

// ─── DEMO / MOCK DATA ─────────────────────────────────────────────────────────
// Replace all of these with real Supabase queries in production.

// Demo predictions shown after a finished match
export const MOCK_PREDICTIONS_FINISHED = [
  { nickname:"RaduGoalz",  scoreA:2, scoreB:0, possession:60, corners:7 },
  { nickname:"AndreiFC",   scoreA:1, scoreB:1, possession:55, corners:9 },
  { nickname:"MihaiUltra", scoreA:2, scoreB:1, possession:58, corners:8 },
  { nickname:"AlexTactic", scoreA:0, scoreB:1, possession:45, corners:6 },
];

export const TAKEN_NICKNAMES = ["RaduGoalz","AndreiFC","MihaiUltra","AlexTactic","CostinPro"];

// Community pick % per match (replace with Supabase `match_picks_summary` view)
export const POPULAR_PICKS = {
  7:  { homeWin:68, draw:18, awayWin:14 },
  13: { homeWin:74, draw:16, awayWin:10 },
  19: { homeWin:72, draw:15, awayWin:13 },
  25: { homeWin:79, draw:12, awayWin:9  },
  31: { homeWin:76, draw:14, awayWin:10 },
  37: { homeWin:48, draw:28, awayWin:24 },
};

// Most predicted score per match (replace with Supabase aggregation)
export const MOST_PREDICTED = {
  7:  { scoreA:2, scoreB:0, pct:31 },
  13: { scoreA:2, scoreB:1, pct:28 },
  19: { scoreA:2, scoreB:0, pct:34 },
  25: { scoreA:3, scoreB:1, pct:26 },
  31: { scoreA:2, scoreB:0, pct:29 },
  37: { scoreA:1, scoreB:1, pct:22 },
};

// Live score hook — swap with real API fetch in production
// Fields: liveHomeScore, liveAwayScore, matchMinute, matchStatus
export const LIVE_STUB = {
  liveHomeScore: null,   // number | null — from livescore API
  liveAwayScore: null,   // number | null
  matchMinute:   null,   // number | null — 1-90+
  matchStatus:   "scheduled", // "scheduled"|"live"|"ht"|"finished"
};

// Live feed events (replace with Supabase realtime channel in production)
// Table: activity_feed(id, icon, text, type, pts, ago, group_id)
export const LIVE_FEED_EVENTS = [
  { icon:"🎯", text:"RaduGoalz a ghicit scorul exact",    pts:"+100", type:"exact",  ago:"2m"  },
  { icon:"🚀", text:"AlexTactic a urcat pe locul #2",     pts:null,   type:"rank",   ago:"4m"  },
  { icon:"💥", text:"MihaiUltra a ratat scorul exact",    pts:"+30",  type:"miss",   ago:"6m"  },
  { icon:"🔥", text:"RaduGoalz — 3 corecte la rând",     pts:null,   type:"streak", ago:"8m"  },
  { icon:"📊", text:"74% au prezis victorie Spania",      pts:null,   type:"stat",   ago:"11m" },
  { icon:"⬆",  text:"AndreiFC a câștigat 45 de puncte",  pts:"+45",  type:"pts",    ago:"14m" },
  { icon:"👀", text:"Numai 2 jucători au prezis egal",    pts:null,   type:"social", ago:"18m" },
  { icon:"🏆", text:"RaduGoalz conduce cu 85 de puncte", pts:null,   type:"leader", ago:"22m" },
];
export const TYPE_COLOR = {
  exact:"#FFD700", rank:"#00E5A0", miss:"#FF6B6B", streak:"#FF9800",
  stat:"#4A9EFF",  pts:"#00E5A0",  social:"#7B5EA7", leader:"#FFD700",
};

// Leaderboard competition config
export const QUALIFY_PCT   = 0.70; // top 70% qualify to next stage
export const CURRENT_STAGE = "Faza grupelor";

// Demo player form (replace with Supabase `player_form` view)
const DEMO_FORM_OVERRIDE = {
  "RaduGoalz":  { streak:4,  exactToday:1, rankDelta: 0 },
  "AndreiFC":   { streak:0,  exactToday:0, rankDelta:-1 },
  "MihaiUltra": { streak:2,  exactToday:0, rankDelta: 1 },
  "AlexTactic": { streak:-2, exactToday:0, rankDelta: 0 },
};

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
// Max per match = 200 pts (100+50+20+15+15)
// Exact score STACKS with correct result + correct total goals.
export function calcBreakdown(pred, match) {
  if (!match.isFinished) return null;
  const { realScoreA:rA, realScoreB:rB, realPossession:rP, realCorners:rC } = match;
  const { scoreA:pA, scoreB:pB, possession:pPoss, corners:pC } = pred;
  const realRes = rA > rB ? "1" : rA < rB ? "2" : "X";
  const predRes = pA > pB ? "1" : pA < pB ? "2" : "X";

  const exactScore = (pA === rA && pB === rB) ? 100 : 0;
  const correctRes = (predRes === realRes) ? 50 : 0;
  const totalGoals = (pA + pB === rA + rB) ? 20 : 0;
  const pd = Math.abs(pPoss - rP);
  const possession = pd === 0 ? 15 : pd <= 2 ? 10 : pd <= 5 ? 5 : 0;
  const cd = Math.abs(pC - rC);
  const corners = cd === 0 ? 15 : cd === 1 ? 10 : cd === 2 ? 5 : cd === 3 ? 2 : 0;

  return {
    exactScore, correctRes, totalGoals, possession, corners,
    total: exactScore + correctRes + totalGoals + possession + corners,
    isPerfect: exactScore === 100 && possession === 15 && corners === 15,
  };
}

export function calcPoints(pred, match) {
  const b = calcBreakdown(pred, match);
  return b ? b.total : null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

// Returns { state, label } for a match based on current time vs kickoff.
// state: "open" | "soon" | "locked" | "live" | "finished"
export function matchLockState(match) {
  if (match.isFinished) return { state:"finished", label:"✓ Terminat" };
  const kickoff  = new Date(match.time).getTime();
  const msNow    = Date.now();
  const msToLock = kickoff - LOCK_BEFORE_MS - msNow;

  if (msNow >= kickoff)                  return { state:"live",   label:"🔴 Live" };
  if (msNow >= kickoff - LOCK_BEFORE_MS) return { state:"locked", label:"🔒 Blocat" };
  if (msToLock <= LOCK_BEFORE_MS) {
    const h = Math.floor(msToLock / 3600000);
    const m = Math.floor((msToLock % 3600000) / 60000);
    return { state:"soon", label:`⚠ se blochează în ${h > 0 ? `${h}h ${m}m` : `${m}m`}` };
  }
  const h = Math.floor(msToLock / 3600000);
  const m = Math.floor((msToLock % 3600000) / 60000);
  const cd = h > 48 ? `${Math.floor(h/24)}z` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return { state:"open", label:`🔓 ${cd} rămas` };
}

// ─── LEADERBOARD ENGINE ───────────────────────────────────────────────────────
// allPlayerPreds: { [nickname]: { [matchId]: prediction } }
export function buildLeaderboard(allPlayerPreds, currentUser) {
  const finishedMatches = MATCHES.filter(m => m.isFinished);
  const nicknames = new Set([currentUser, ...Object.keys(allPlayerPreds)]);

  const players = Array.from(nicknames).map(nick => {
    const preds = allPlayerPreds[nick] || {};
    let totalPoints = 0, exactScores = 0, lastMatchPts = null, lastMatchId = null;
    finishedMatches.forEach(match => {
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

// ─── IDENTITY ENGINE ──────────────────────────────────────────────────────────
export function getBadge(exactScores, points) {
  if (exactScores >= 3) return "🔮 Nostradamus";
  if (exactScores >= 1) return "🎯 Ghicitor";
  if (points > 100)     return "📺 Expert Canapea";
  if (points > 0)       return "🍺 Patron de Bar";
  return "🆕 Nou venit";
}

// Auto-generated prediction style label from behavior stats.
// In production: feed real per-user stats from Supabase `player_stats` view.
export function getPredictionStyle(exactScores, points, corners) {
  if (exactScores >= 2)                 return { label:"Exact Score Hunter", color:"#FFD700", icon:"🎯" };
  if (exactScores === 0 && points > 60) return { label:"Safe Player",        color:"#00E5A0", icon:"🛡" };
  if (exactScores === 1 && points < 50) return { label:"Risk Taker",         color:"#FF6B6B", icon:"💣" };
  if (corners > 0)                      return { label:"Corner King",        color:"#4A9EFF", icon:"📐" };
  return                                       { label:"Late Clutcher",      color:"#7B5EA7", icon:"⚡" };
}

export function getAvatarRing(style) {
  const map = {
    "#FFD700":"linear-gradient(135deg,#FFD700,#FF9800)",
    "#00E5A0":"linear-gradient(135deg,#00E5A0,#00C27A)",
    "#FF6B6B":"linear-gradient(135deg,#FF6B6B,#FF4444)",
    "#4A9EFF":"linear-gradient(135deg,#4A9EFF,#7B5EA7)",
    "#7B5EA7":"linear-gradient(135deg,#7B5EA7,#4A9EFF)",
  };
  return map[style.color] || "linear-gradient(135deg,#4285F4,#34A853)";
}

// Rivalry pressure line shown in the "my position" card.
// In production: replace with real-time data from Supabase leaderboard subscription.
export function getRivalryMessage(myRank, myPts, sorted, currentUser) {
  if (!sorted || sorted.length < 2) return null;
  const above   = sorted.find(p => p.rank === myRank - 1 && p.nickname !== currentUser);
  const chasers = sorted.filter(p => p.rank > myRank && p.nickname !== currentUser);
  const rival   = sorted.find(p => p.nickname !== currentUser && p.rank <= 3);
  if (above && (above.points - myPts) <= 20)  return { text:`${above.points - myPts} pts îl despart de ${above.nickname}`, urgency:"high" };
  if (above && (above.points - myPts) <= 50)  return { text:`Un scor exact te poate urca peste ${above.nickname}`, urgency:"medium" };
  if (chasers.length >= 2)                     return { text:`${chasers.length} jucători te urmăresc îndeaproape`, urgency:"medium" };
  if (rival)                                   return { text:`${rival.nickname} a prezis rezultatul opus`, urgency:"low" };
  return null;
}

// Dynamic form tag shown below player nickname in leaderboard.
// In production: replace DEMO_FORM_OVERRIDE with Supabase `player_form` view query.
export function getPlayerForm(nick, exactScores, mov) {
  const demo       = DEMO_FORM_OVERRIDE[nick];
  const streak     = demo ? demo.streak     : 0;
  const exactToday = demo ? demo.exactToday : 0;
  const rankDelta  = demo ? demo.rankDelta  : mov;
  if (exactScores >= 3) return { icon:"🎯", text:`${exactScores} scoruri exacte`,  color:"#FFD700" };
  if (streak >= 3)      return { icon:"🔥", text:`${streak} corecte la rând`,      color:"#FF9800" };
  if (exactToday >= 1)  return { icon:"⚡", text:"Scor exact azi",                color:"#00E5A0" };
  if (rankDelta >= 2)   return { icon:"⬆",  text:`+${rankDelta} locuri azi`,       color:"#00E5A0" };
  if (streak <= -2)     return { icon:"🧊", text:"Formă slabă",                   color:"#4A9EFF" };
  return null;
}
