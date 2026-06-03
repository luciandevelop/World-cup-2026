// ─── src/services/matchService.js ─────────────────────────────────────────────
// Match data service — currently uses mock data.
// FUTURE: Swap fetchLiveMatch() with real API call (e.g. API-Football, Sofascore API).
// FUTURE: Swap fetchMatches() with Supabase query.
// ─────────────────────────────────────────────────────────────────────────────

import { buildMatches, FINISHED_RESULTS } from '../data/gameData.js';

// ─── LIVE MATCH STUB ──────────────────────────────────────────────────────────
// Swap this function body with: GET https://api-football.com/v3/fixtures?id={matchId}
export async function fetchLiveMatch(matchId) {
  // Mock response — production: real API
  return {
    id:           matchId,
    liveHomeScore: null,
    liveAwayScore: null,
    matchMinute:  null,
    matchStatus:  "scheduled", // "scheduled" | "live" | "ht" | "finished"
    events:       [],           // [{ type:"goal"|"yellow"|"red"|"sub", team, minute, player }]
  };
}

// ─── MATCH LIST ───────────────────────────────────────────────────────────────
// Production: replace with Supabase client query
export async function fetchMatches(finishedResults = FINISHED_RESULTS) {
  return buildMatches(finishedResults);
}

// ─── PREDICTIONS ─────────────────────────────────────────────────────────────
// Production: replace with Supabase `predictions` table query
export async function fetchPredictions(userId) {
  // Returns: { [matchId]: { scoreA, scoreB, possession, corners } }
  const raw = localStorage.getItem(`preds_${userId}`);
  return raw ? JSON.parse(raw) : {};
}

export async function savePrediction(userId, matchId, pred) {
  const key  = `preds_${userId}`;
  const raw  = localStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : {};
  data[matchId] = pred;
  localStorage.setItem(key, JSON.stringify(data));
  return true;
}

// ─── COMMUNITY STATS ─────────────────────────────────────────────────────────
// Production: replace with Supabase `match_picks_summary` view
export async function fetchCommunityStats(matchId) {
  return null; // Populated from POPULAR_PICKS in gameData for now
}
