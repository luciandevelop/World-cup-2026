// ─── src/services/liveMatchService.js ────────────────────────────────────────
// Live match data service.
// Currently returns mock/null data.
// FUTURE: swap fetch calls with real API (API-Football, RapidAPI, Sofascore, etc.)
//
// API candidates:
//   https://www.api-football.com/  (v3 endpoints)
//   https://rapidapi.com/api-sports/api/api-football
// ─────────────────────────────────────────────────────────────────────────────

// ─── LIVE MATCH SHAPE ─────────────────────────────────────────────────────────
// This is the canonical shape every component expects.
export function emptyLiveMatch(matchId) {
  return {
    matchId,
    status:        'scheduled', // 'scheduled'|'live'|'ht'|'ft'|'postponed'
    minute:        null,        // number | null
    homeScore:     null,
    awayScore:     null,
    possession:    null,        // { home: 55, away: 45 }
    corners:       null,        // { home: 3, away: 5 }
    shots:         null,        // { home: { on:4,off:3 }, away: { on:2,off:5 } }
    cards:         null,        // { home: { y:1,r:0 }, away: { y:2,r:0 } }
    lineups:       null,        // { home: [...players], away: [...players] }
    events:        [],          // [{ type:'goal'|'yellow'|'red'|'sub', team:'home'|'away', minute, player }]
    venue:         null,
    referee:       null,
    updatedAt:     null,
  };
}

// ─── FETCH LIVE DATA ─────────────────────────────────────────────────────────
// PRODUCTION: replace body with real fetch call
// Example (API-Football v3):
//   const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${externalId}`, {
//     headers: { 'x-apisports-key': import.meta.env.VITE_API_FOOTBALL_KEY }
//   });
//   const json = await res.json();
//   return transformApiFootball(json.response[0]);

export async function fetchLiveMatch(matchId) {
  // Mock: return empty shape
  return emptyLiveMatch(matchId);
}

// ─── POLL INTERVAL ───────────────────────────────────────────────────────────
// Returns cleanup function. Calls `onUpdate(liveData)` every `intervalMs`.
export function pollLiveMatch(matchId, onUpdate, intervalMs = 30000) {
  const tick = async () => {
    const data = await fetchLiveMatch(matchId);
    onUpdate(data);
  };
  tick(); // immediate first call
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}

// ─── TRANSFORM HELPERS (for future API integration) ──────────────────────────
// export function transformApiFootball(raw) {
//   return {
//     matchId:    raw.fixture.id,
//     status:     raw.fixture.status.short.toLowerCase(),
//     minute:     raw.fixture.status.elapsed,
//     homeScore:  raw.goals.home,
//     awayScore:  raw.goals.away,
//     possession: raw.statistics?.[0]?.statistics?.find(s => s.type === 'Ball Possession')?.value,
//     ...
//   };
// }
