import {
  isSpecialLocked, specialLockCountdown, WC_TEAMS,
  loadSpecialPrediction, saveSpecialPrediction, calcSpecialPoints,
  isQFLocked, qfLockCountdown, R16_MATCHES, saveQFPrediction, calcQFPoints,
  isSFPredLocked, sfPredLockCountdown, SF_MATCHES, saveSFPrediction, calcSFPoints,
} from '../services/specialEventsService.js';

// ─── FRIEND PREDICTIONS PANEL ────────────────────────────────────────────────
// Shows after match locks. First match expanded by default, others collapsed.
function FriendPredictionsPanel({ matches, allPredictions, allUsers, myPredictions }) {
  if (!matches.length) return null;

  const userList = Object.entries(allUsers).map(([uid, u]) => ({
    uid, nickname: u.nickname, avatarId: u.avatarId,
  })).filter(u => u.nickname);

  // Sort: live > soon > locked > finished-newest-first (same as friendMatches definition)
  const sorted = [...matches].sort((a, b) => {
    const order = (m) => {
      const s = matchLockState(m).state;
      if (s === 'live')   return 0;
      if (s === 'soon')   return 1;
      if (s === 'locked') return 2;
      if (m.isFinished)   return 3;
      return 4;
    };
    const oa = order(a), ob = order(b);
    if (oa !== ob) return oa - ob;
    return (a.isFinished ? -1 : 1) * (new Date(a.time) - new Date(b.time));
  }).filter(m => matchLockState(m).state !== "open").slice(0, 20);

  // First visible match ID — expanded by default
  const firstId = sorted[0]?.id ?? null;

  // expandedIds: Set of match IDs currently expanded
  // Initialised with firstId so only the top match is open on load
  const [expandedIds, setExpandedIds] = useState(() => new Set(firstId != null ? [firstId] : []));

  const toggle = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (userList.length === 0) {
    return (
      <div style={{ padding:"16px 4px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:12 }}>
        Niciun prieten înregistrat încă.
      </div>
    );
  }

  return (
    <div style={{ padding:"4px 0 16px" }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700, marginBottom:10, padding:"0 4px" }}>
        Predicțiile prietenilor — meciuri blocate
      </div>
      {sorted.map(match => {
        const lockInfo    = matchLockState(match);
        const isExpanded  = expandedIds.has(match.id);
        const predCount   = userList.filter(u => (allPredictions[u.uid] || {})[match.id]).length;
        const stateColor  = lockInfo.state === 'live' ? '#EF4444' : lockInfo.state === 'locked' ? 'rgba(255,255,255,0.25)' : '#F59E0B';

        return (
          <div key={match.id} style={{ marginBottom:8, border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden", background:"rgba(255,255,255,0.02)" }}>
            {/* ── Tappable header ── */}
            <div
              onClick={() => toggle(match.id)}
              style={{ padding:"10px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", userSelect:"none" }}
            >
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2, display:"flex", gap:8 }}>
                  <span>{formatKickoffRO(match.time)}</span>
                  {predCount > 0 && <span style={{ color:"rgba(255,255,255,0.2)" }}>· {predCount} predicții</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:8 }}>
                {match.isFinished && match.realScoreA != null && (
                  <span style={{ fontSize:13, fontWeight:900, color:"#FFD700", fontFamily:"'DM Mono',monospace" }}>
                    {match.realScoreA}–{match.realScoreB}
                  </span>
                )}
                {lockInfo.state === 'live' && (
                  <span style={{ fontSize:9, fontWeight:800, color:'#EF4444' }}>● LIVE</span>
                )}
                <span style={{ fontSize:12, color:stateColor }}>{isExpanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* ── Expanded predictions ── */}
            {isExpanded && (
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"6px 8px 8px" }}>
                {userList.map(u => {
                  const pred = (allPredictions[u.uid] || {})[match.id];
                  if (!pred) return null;
                  const isMe = myPredictions[match.id] &&
                    Number(myPredictions[match.id].scoreA) === Number(pred.scoreA) &&
                    Number(myPredictions[match.id].scoreB) === Number(pred.scoreB);
                  return (
                    <div key={u.uid} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 6px", borderRadius:8, background: isMe ? "rgba(0,229,160,0.06)" : "transparent" }}>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>
                        {isMe ? "⭐ " : ""}{u.nickname}
                      </span>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:6 }}>
                          {/* Joker badge — display-only. Shown only when usedJoker===true AND
                              match.stage is a knockout stage (never on group matches, where
                              stage is undefined and pred.usedJoker is never set anyway). */}
                          {pred.usedJoker === true && ['R32','R16','QF'].includes(match.stage) && (
                            <span style={{ fontSize:9, fontWeight:800, color:"#FF6B00", background:"rgba(255,107,0,0.12)", border:"1px solid rgba(255,107,0,0.3)", padding:"1px 6px", borderRadius:6, letterSpacing:"0.02em", whiteSpace:"nowrap" }}>
                              🔥 JOKER ×2
                            </span>
                          )}
                          <div style={{ fontSize:14, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
                            {pred.scoreA} – {pred.scoreB}
                          </div>
                        </div>
                        {(pred.possession != null || pred.corners != null) && (
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace" }}>
                            {pred.possession != null ? `🟨 ${pred.possession} cart` : ""}
                            {pred.possession != null && pred.corners != null ? " · " : ""}
                            {pred.corners != null ? `cor ${pred.corners}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
                {userList.every(u => !(allPredictions[u.uid] || {})[match.id]) && (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", padding:"4px 6px" }}>Nicio predicție pentru acest meci.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TEST MATCHES PANEL ───────────────────────────────────────────────────────
// Renders the 4 test matches for verifying all game mechanics.
function TestMatchesPanel({ testMatches, predictions, onPredict, finishedResults, allPredictions, allUsers }) {
  return (
    <div style={{ padding:"4px 0 16px" }}>
      <div style={{ padding:"10px 4px 8px", display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <span style={{ fontSize:18 }}>🧪</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>Meciuri de Test</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
            Verifică: scoring · lock · Firestore sync · feed activitate
          </div>
        </div>
      </div>

      <div style={{ marginBottom:12, padding:"8px 12px", background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10 }}>
        <div style={{ fontSize:10, color:"rgba(245,158,11,0.7)", lineHeight:1.6 }}>
          ℹ️ <strong>T901</strong>: finalizat (pune rezultat din Admin) ·
          <strong> T902</strong>: blocat (live) ·
          <strong> T903</strong>: deschis ~1h ·
          <strong> T904</strong>: deschis ~3h
        </div>
      </div>

      {testMatches.map(match => {
        const lockInfo = matchLockState(match);
        const pred     = predictions[match.id];
        const result   = finishedResults[match.id];

        return (
          <div key={match.id} style={{ marginBottom:10, background:"rgba(255,255,255,0.03)", border:`1px solid ${lockInfo.state === "open" ? "rgba(0,229,160,0.15)" : lockInfo.state === "live" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>
                  {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
                </span>
                <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                  background: lockInfo.state==="open" ? "rgba(0,229,160,0.1)" : lockInfo.state==="live" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                  color: lockInfo.state==="open" ? "#00E5A0" : lockInfo.state==="live" ? "#EF4444" : "rgba(255,255,255,0.4)",
                  fontWeight:700,
                }}>
                  {lockInfo.label}
                </span>
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{formatKickoffRO(match.time)} · ID: {match.id}</div>
            </div>

            <div style={{ padding:"8px 12px" }}>
              {/* Prediction state */}
              {pred ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Predicția ta:</span>
                  <span style={{ fontSize:16, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
                    {pred.scoreA} – {pred.scoreB}
                  </span>
                </div>
              ) : (
                lockInfo.state === "open" ? (
                  <button onClick={() => onPredict(match)} style={{ width:"100%", padding:"8px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:8, color:"#00E5A0", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    + Adaugă predicție
                  </button>
                ) : (
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>Fără predicție · blocat</div>
                )
              )}

              {/* Result (if admin entered) */}
              {result && result.homeScore !== null && (
                <div style={{ marginTop:6, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Rezultat oficial:</span>
                  <span style={{ fontSize:16, fontWeight:900, color:"#FFD700", fontFamily:"'DM Mono',monospace" }}>
                    {result.homeScore} – {result.awayScore}
                  </span>
                </div>
              )}

              {/* Friend predictions (visible after lock) */}
              {lockInfo.state !== "open" && Object.keys(allPredictions).length > 0 && (
                <div style={{ marginTop:6, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:6 }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginBottom:4 }}>Predicții prieteni:</div>
                  {Object.entries(allPredictions).map(([uid, preds]) => {
                    const p = preds[match.id];
                    if (!p) return null;
                    const nick = allUsers[uid]?.nickname || uid;
                    return (
                      <div key={uid} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0", fontSize:11 }}>
                        <span style={{ color:"rgba(255,255,255,0.45)" }}>{nick}</span>
                        <span style={{ color:"#fff", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>{p.scoreA}–{p.scoreB}</span>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── src/screens/MatchesScreen.jsx ───────────────────────────────────────────
// Full FIFA WC 2026 group stage — all 12 groups, all 72 matches.
// Tabs: "Toate" | "Predicțiile Mele" | "Predicțiile Prietenilor"
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo } from 'react';
import {
  MATCHES, GROUPS,
  POPULAR_PICKS, MOST_PREDICTED, LIVE_FEED_EVENTS, TYPE_COLOR,
  calcBreakdown, calcPoints, matchLockState, formatKickoffRO, getGroupLabel,
  buildMatches,
} from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';
import { StatusPill, SectionDivider } from '../components/UI.jsx';
import GroupStandings from '../components/GroupStandings.jsx';
import { getTeamLineup, resolveLineup, OFFICIAL_CUTOFF_MS } from '../data/lineups.js';

// ─── GROUP TEAMS (derived) ────────────────────────────────────────────────────
const GROUP_TEAMS = ALL_GROUPS.reduce((acc, g) => {
  const ms = MATCHES.filter(m => m.group === g);
  const seen = new Set();
  const teams = [];
  ms.forEach(m => {
    const ka = m.teamA + m.flagA;
    const kb = m.teamB + m.flagB;
    if (!seen.has(ka)) { seen.add(ka); teams.push({ name:m.teamA, flag:m.flagA }); }
    if (!seen.has(kb)) { seen.add(kb); teams.push({ name:m.teamB, flag:m.flagB }); }
  });
  acc[g] = teams;
  return acc;
}, {});

// ─── SCORE BREAKDOWN ─────────────────────────────────────────────────────────
function ScoreBreakdown({ pred, match }) {
  const b = calcBreakdown(pred, match);
  if (!b) return null;
  const rows = [
    { label:"Scor exact",      pts:b.exactScore, max:100 },
    { label:"Rezultat corect", pts:b.correctRes,  max:50  },
    { label:"Total goluri",    pts:b.totalGoals,  max:20  },
    { label:"Cartonașe",       pts:b.possession,  max:15  },
    { label:"Cornere",         pts:b.corners,     max:15  },
  ];
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", marginTop:8, animation:"revealFlip 0.25s ease both" }}>
      {b.isPerfect && (
        <div style={{ textAlign:"center", marginBottom:10, padding:"8px 12px", background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:8 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#D4AF37", letterSpacing:"0.1em", fontFamily:"'Bebas Neue',sans-serif" }}>✦ PREDICȚIE PERFECTĂ ✦</div>
        </div>
      )}
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Detaliu punctaj</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", borderBottom:i < 4?"1px solid rgba(255,255,255,0.04)":"none" }}>
          <span style={{ fontSize:12, color:r.pts > 0?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.2)" }}>{r.label}</span>
          <span style={{ fontSize:12, fontWeight:700, color:r.pts > 0?"#fff":"rgba(255,255,255,0.12)", fontFamily:"'DM Mono',monospace" }}>
            {r.pts > 0 ? `+${r.pts}` : "—"}
          </span>
        </div>
      ))}
      <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"8px 0" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>Total</span>
        <span style={{ fontSize:16, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>+{b.total} pts</span>
      </div>
    </div>
  );
}

// ─── COMMUNITY PICKS ─────────────────────────────────────────────────────────
function CommunityPicks({ matchId, prediction }) {
  const picks = POPULAR_PICKS[matchId];
  if (!picks) return null;
  const userResult = prediction ? (prediction.scoreA > prediction.scoreB ? "1" : prediction.scoreA < prediction.scoreB ? "2" : "X") : null;
  const max = Math.max(picks.homeWin, picks.draw, picks.awayWin);
  return (
    <div style={{ marginTop:8, padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.22)", letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:600 }}>Comunitate alege</span>
        {picks.homeWin < 55 && <span style={{ fontSize:10, color:"#F59E0B", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.18)", padding:"1px 7px", borderRadius:4, fontWeight:600 }}>Meci incert</span>}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[{label:"1",pct:picks.homeWin},{label:"X",pct:picks.draw},{label:"2",pct:picks.awayWin}].map(o => {
          const isUser = userResult === o.label;
          const isHigh = o.pct === max;
          return (
            <div key={o.label} style={{ flex:1, textAlign:"center", padding:"7px 4px", borderRadius:8, background:isUser?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.02)", border:`1px solid ${isUser?"rgba(255,255,255,0.14)":"rgba(255,255,255,0.04)"}` }}>
              <div style={{ fontSize:10, fontWeight:700, color:isUser?"#fff":isHigh?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.2)", marginBottom:2 }}>{o.label}</div>
              <div style={{ fontSize:15, fontWeight:800, color:isUser?"#fff":isHigh?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace" }}>{o.pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FRIEND PREDICTIONS ───────────────────────────────────────────────────────
function FriendPredictions({ match }) {
  // Disabled until real multiplayer data is connected. No fake friends shown.
  return null;
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({ match, prediction, onPredict, onDetail }) {
  const lockInfo   = matchLockState(match);
  const isEditable = lockInfo.state === "open" || lockInfo.state === "soon";
  const pts        = prediction && match.isFinished ? calcPoints(prediction, match) : null;
  const [expanded, setExpanded] = useState(false);
  const hasPred = !!prediction;

  const cardBorder = lockInfo.state === "soon"
    ? "1px solid rgba(245,158,11,0.28)"
    : lockInfo.state === "live"
    ? "1px solid rgba(239,68,68,0.22)"
    : hasPred
    ? "1px solid rgba(255,255,255,0.1)"
    : "1px solid rgba(255,255,255,0.05)";

  return (
    <div style={{ marginBottom:8 }}>
      <div
        onClick={() => {
          if (isEditable) onPredict(match);
          else if (onDetail) onDetail(match);
          else if (match.isFinished || match.isLive) setExpanded(e => !e);
        }}
        style={{
          background: hasPred ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          border: cardBorder,
          borderRadius:14, padding:"13px 14px",
          cursor: isEditable || match.isFinished || match.isLive ? "pointer" : "default",
          position:"relative", overflow:"hidden",
          transition:"border-color 0.2s, background 0.2s",
        }}
      >
        {/* Live glow stripe */}
        {lockInfo.state === "live" && (
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)" }}/>
        )}

        {/* Top row: status + stage label (KO only) + pts */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <StatusPill state={lockInfo.state}/>
            {match.group === "KO" && (
              <span style={{ fontSize:10, fontWeight:800, color:"#4A9EFF", background:"rgba(74,158,255,0.12)", border:"1px solid rgba(74,158,255,0.25)", padding:"2px 7px", borderRadius:6, letterSpacing:"0.03em" }}>
                {match.stage === "R32" ? "ȘAISPREZECIMI" : match.stage === "R16" ? "OPTIMI" : match.stage === "QF" ? "SFERTURI" : match.stage === "SF" ? "SEMIFINALĂ" : match.stage === "THIRD_PLACE" ? "FINALA MICĂ" : match.stage === "FINAL" ? "FINALĂ" : match.stage}
              </span>
            )}
          </div>
          {pts !== null && (
            <div style={{ fontSize:12, fontWeight:700, color:pts >= 100?"#FFD700":pts >= 50?"#00E5A0":"rgba(255,255,255,0.4)", fontFamily:"'DM Mono',monospace", background:pts >= 100?"rgba(255,215,0,0.08)":"transparent", padding:"1px 8px", borderRadius:4 }}>
              +{pts} pts
            </div>
          )}
        </div>

        {/* Venue/date subline — shown for KO matches for extra clarity, since they're unfamiliar */}
        {match.group === "KO" && (
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginBottom:8, fontFamily:"'DM Mono',monospace" }}>
            {new Date(match.time).toLocaleDateString("ro-RO",{timeZone:"Europe/Bucharest",weekday:"short",day:"2-digit",month:"short"})}
            {" · "}
            {new Date(match.time).toLocaleTimeString("ro-RO",{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit"})} RO
            {match.venue ? ` · ${match.venue}` : ""}
          </div>
        )}

        {/* Teams row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Team A */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2 }}>
            <span style={{ fontSize:24, lineHeight:1 }}>{match.flagA}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{match.teamA}</span>
          </div>

          {/* Score / Time */}
          <div style={{ textAlign:"center", padding:"0 10px", flex:"0 0 auto" }}>
            {match.isFinished ? (
              <div style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}>
                {match.realScoreA} – {match.realScoreB}
              </div>
            ) : match.isLive ? (
              <div style={{ fontSize:20, fontWeight:800, color:"#EF4444", fontFamily:"'DM Mono',monospace" }}>
                {match.realScoreA ?? 0} – {match.realScoreB ?? 0}
              </div>
            ) : (
              <>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:700, letterSpacing:"0.05em" }}>VS</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:3, fontFamily:"'DM Mono',monospace" }}>
                  {new Date(match.time).toLocaleTimeString("ro-RO",{timeZone:"Europe/Bucharest",hour:"2-digit",minute:"2-digit"})}
                </div>
              </>
            )}
            {prediction && !match.isFinished && (
              <div style={{ fontSize:11, color:"rgba(0,229,160,0.6)", fontWeight:700, fontFamily:"'DM Mono',monospace", marginTop:3 }}>
                {prediction.scoreA}–{prediction.scoreB}
              </div>
            )}
          </div>

          {/* Team B */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
            <span style={{ fontSize:24, lineHeight:1 }}>{match.flagB}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{match.teamB}</span>
          </div>
        </div>

        {/* Live details: minute, scorers, cards, corners */}
        {match.isLive && (match.liveMinute !== null && match.liveMinute !== undefined || match.homeScorers || match.awayScorers || match.goalScorers || match.liveCards || match.liveCorners) && (
          <div style={{ marginTop:8, padding:'7px 10px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, display:'flex', flexDirection:'column', gap:4 }}>
            {match.liveMinute !== null && match.liveMinute !== undefined && match.liveMinute !== '' && (
              <div style={{ fontSize:12, fontWeight:800, color:'#EF4444', fontFamily:"'DM Mono',monospace" }}>
                🔴 LIVE {match.liveMinute}'
              </div>
            )}
            {/* Per-team scorers (new), fallback to legacy goalScorers */}
            {(match.homeScorers || match.awayScorers) ? (
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:1 }}>⚽ Marcatori</div>
                {match.homeScorers && (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>
                    {match.flagA} {match.teamA}: {match.homeScorers}
                  </div>
                )}
                {match.awayScorers && (
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>
                    {match.flagB} {match.teamB}: {match.awayScorers}
                  </div>
                )}
              </div>
            ) : match.goalScorers ? (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>
                ⚽ {match.goalScorers}
              </div>
            ) : null}
            {match.liveCards && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
                🟨 Cartonașe: {match.liveCards}
              </div>
            )}
            {match.liveCorners && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>
                🚩 Cornere: {match.liveCorners}
              </div>
            )}
          </div>
        )}

        {/* Venue / date */}
        <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{formatKickoffRO(match.time)}</span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>📍 {match.venue}</span>
        </div>

        {/* Predict CTA */}
        {isEditable && !hasPred && (
          <div style={{ marginTop:10, padding:"7px 12px", background:"rgba(0,229,160,0.07)", border:"1px solid rgba(0,229,160,0.15)", borderRadius:8, textAlign:"center" }}>
            <span style={{ fontSize:11, color:"rgba(0,229,160,0.8)", fontWeight:700 }}>+ Adaugă predicție</span>
          </div>
        )}
        {isEditable && hasPred && (
          <div style={{ marginTop:10, padding:"7px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Predicția ta: {prediction.scoreA}–{prediction.scoreB} · {prediction.possession} cart · {prediction.corners}🔄</span>
            <span style={{ fontSize:10, color:"rgba(0,229,160,0.5)", fontWeight:700 }}>Editează</span>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding:"10px 14px", background:"rgba(255,255,255,0.015)", border:"1px solid rgba(255,255,255,0.05)", borderTop:"none", borderRadius:"0 0 14px 14px", animation:"revealFlip 0.2s ease" }}>
          {prediction && <ScoreBreakdown pred={prediction} match={match}/>}
          {(match.isFinished || match.isLive) && <FriendPredictions match={match}/>}
          <CommunityPicks matchId={match.id} prediction={prediction}/>
        </div>
      )}
    </div>
  );
}

// ─── GROUP HEADER ─────────────────────────────────────────────────────────────
function GroupHeader({ group, teams, collapsed, onToggle, matchCount, predCount }) {
  const label = getGroupLabel(group);
  const isDeathGroup = group === "I";

  return (
    <div
      onClick={onToggle}
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 14px", marginBottom: collapsed ? 8 : 0,
        background: isDeathGroup ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isDeathGroup ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: collapsed ? 12 : "12px 12px 0 0",
        cursor:"pointer", userSelect:"none",
        transition:"border-radius 0.2s",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ fontSize:9, fontWeight:800, color: isDeathGroup ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.4)", letterSpacing:"0.2em", textTransform:"uppercase" }}>
          {label}
        </div>
        <div style={{ display:"flex", gap:3 }}>
          {teams.slice(0,4).map((t, i) => (
            <span key={i} style={{ fontSize:14 }}>{t.flag}</span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {predCount > 0 && (
          <div style={{ fontSize:10, color:"rgba(0,229,160,0.6)", background:"rgba(0,229,160,0.08)", border:"1px solid rgba(0,229,160,0.15)", padding:"2px 7px", borderRadius:10, fontWeight:700 }}>
            {predCount}/{matchCount}
          </div>
        )}
        <span style={{ fontSize:14, color:"rgba(255,255,255,0.3)", transition:"transform 0.2s", display:"inline-block", transform:collapsed?"rotate(0)":"rotate(180deg)" }}>
          ▾
        </span>
      </div>
    </div>
  );
}

// ─── LIVE FEED ────────────────────────────────────────────────────────────────
function LiveFeed({ events = [] }) {
  const feed = events.length ? events : LIVE_FEED_EVENTS;
  if (!feed || feed.length === 0) return null;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600, marginBottom:10, paddingLeft:2 }}>
        Activitate recentă
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {feed.slice(0,10).map((e, i) => (
          <div key={e.id || i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:10, animation:`staggerIn 0.3s ${i*0.06}s ease both` }}>
            <span style={{ fontSize:16 }}>{e.icon}</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", flex:1 }}>{e.text}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              {e.pts && <span style={{ fontSize:11, fontWeight:700, color:TYPE_COLOR[e.type] || "#fff", fontFamily:"'DM Mono',monospace" }}>{e.pts}</span>}
              {e.ts && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{_relTime(e.ts)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function _relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "acum";
  if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
  return `${Math.floor(diff/86400000)}z`;
}

// ─── MATCHES SCREEN ───────────────────────────────────────────────────────────
// ─── PITCH FORMATION GRAPHIC ──────────────────────────────────────────────────
// Renders players positioned on a football pitch by role.
// positions: GK at bottom, then DEF row, MID row, FWD row (home = bottom half).
// ─── FORMATION PARSER ────────────────────────────────────────────────────────
// Splits a formation string like "4-2-3-1" into row counts [4,2,3,1]
// and maps each player to a row based on their index in the XI (GK always row 0).
function parseFormationRows(formationStr, players) {
  if (!players || players.length === 0) return [];
  // Parse e.g. "4-3-3" => [4,3,3], "4-2-3-1" => [4,2,3,1]
  const parts = (formationStr || '4-3-3').split('-').map(Number).filter(n => n > 0);
  // rows[0] = GK (always 1), rows[1..] = outfield rows
  const rowCounts = [1, ...parts];
  const rows = [];
  let idx = 0;
  for (const count of rowCounts) {
    rows.push(players.slice(idx, idx + count));
    idx += count;
  }
  // Any overflow goes to last row
  if (idx < players.length) {
    rows[rows.length - 1] = [...(rows[rows.length - 1] || []), ...players.slice(idx)];
  }
  return rows; // first row = GK, last row = attackers
}

function PitchFormation({ players, formation, teamName, flag, flipped }) {
  const allPlayers = players || [];
  const rows = parseFormationRows(formation, allPlayers);
  // flipped = away team; render attacker row first so both teams face each other
  const displayRows = flipped ? [...rows].reverse() : rows;

  const PlayerDot = ({ p }) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:'0 0 auto' }}>
      <div style={{
        width:26, height:26, borderRadius:'50%',
        background:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.28)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:9, fontWeight:800, color:'#fff',
      }}>
        {p.number}
      </div>
      <div style={{
        fontSize:8, color:'rgba(255,255,255,0.7)', textAlign:'center',
        maxWidth:42, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        lineHeight:1.2,
      }}>
        {(p.name || '').split(' ').pop()}
      </div>
    </div>
  );

  return (
    <div style={{ flex:1 }}>
      <div style={{ textAlign:'center', marginBottom:5 }}>
        <span style={{ fontSize:13 }}>{flag}</span>
        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', marginLeft:5 }}>{teamName}</span>
        <span style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginLeft:5 }}>{formation}</span>
      </div>
      {displayRows.length === 0 ? (
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'12px 0', fontStyle:'italic' }}>
          Echipa probabila nu este disponibila inca pentru aceasta nationala.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {displayRows.map((row, ri) => (
            row.length > 0 && (
              <div key={ri} style={{ display:'flex', justifyContent:'space-evenly', alignItems:'flex-start', minHeight:44 }}>
                {row.map((p, pi) => <PlayerDot key={pi} p={p}/>)}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MATCH DETAIL MODAL ──────────────────────────────────────────────────────
function MatchDetailModal({ match, prediction, onClose, onPredict }) {
  const lockInfo  = matchLockState(match);
  const kickoffRO = formatKickoffRO(match.time);
  const [tab, setTabDetail] = useState('info');

  // Resolve lineups (predicted vs official, timing-aware)
  const officialOverride = match.officialLineup || null;
  const lineupA = resolveLineup(match.teamA, match.time, officialOverride?.home);
  const lineupB = resolveLineup(match.teamB, match.time, officialOverride?.away);
  const hasLineup = !!(lineupA || lineupB);

  // Source badge
  const isOfficial  = lineupA?.isOfficial || lineupB?.isOfficial;
  const officialMissing = lineupA?.officialMissing || lineupB?.officialMissing;
  const sourceName  = isOfficial ? "FIFA Match Centre" : (lineupA?.sourceName || "Bulinews");
  const sourceUrl   = lineupA?.sourceUrl || null;

  const DETAIL_TABS = [
    { id:'info',    label:'Info' },
    { id:'lineups', label:'Echipe' },
    { id:'pred',    label:'Predictie' },
  ];

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', justifyContent:'flex-end', animation:'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'linear-gradient(180deg,#111820,#0A0E14)', borderRadius:'22px 22px 0 0', padding:'18px 18px 40px', border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none', animation:'slideUp 0.28s cubic-bezier(0.34,1.1,0.64,1)', maxHeight:'90dvh', overflowY:'auto' }}>
        <div style={{ width:36, height:3, background:'rgba(255,255,255,0.15)', borderRadius:2, margin:'0 auto 14px' }}/>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:9, color:'rgba(0,229,160,0.65)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>
              Grupa {match.group}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>
              {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:3 }}>{kickoffRO}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:22, cursor:'pointer', padding:4, lineHeight:1 }}>x</button>
        </div>

        {/* Inner tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:14, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:3 }}>
          {DETAIL_TABS.map(t => (
            <button key={t.id} onClick={() => setTabDetail(t.id)} style={{
              flex:1, padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer',
              background:tab===t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color:tab===t.id ? '#fff' : 'rgba(255,255,255,0.38)',
              fontSize:12, fontWeight:tab===t.id ? 700 : 500, transition:'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── TAB: INFO ── */}
        {tab === 'info' && (
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label:'Ora (Romania)', value:kickoffRO },
              { label:'Stadion',       value:match.venue },
              { label:'Grupa',         value:'Grupa ' + match.group },
              { label:'Status',        value:lockInfo.label },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{row.label}</span>
                <span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: LINEUPS ── */}
        {tab === 'lineups' && (
          <div>
            {/* Source badge */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {isOfficial ? (
                  <span style={{ fontSize:9, fontWeight:800, color:'#00E5A0', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.25)', padding:'2px 8px', borderRadius:4, letterSpacing:'0.06em' }}>
                    OFICIAL
                  </span>
                ) : (
                  <span style={{ fontSize:9, fontWeight:600, color:'rgba(255,215,0,0.55)', background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.15)', padding:'2px 8px', borderRadius:4 }}>
                    PROGNOZAT
                  </span>
                )}
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>Sursa: {sourceName}</span>
              </div>
              {!isOfficial && sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize:9, color:'rgba(255,215,0,0.4)', textDecoration:'none' }}>
                  bulinews.com
                </a>
              )}
            </div>

            {/* Official missing warning */}
            {officialMissing && (
              <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, fontSize:11, color:'rgba(245,158,11,0.7)' }}>
                Echipa oficiala nu a fost publicata inca. Se afiseaza echipa prognozata.
              </div>
            )}

            {hasLineup ? (
              <div>
                {/* Pitch container */}
                <div style={{
                  background:'linear-gradient(180deg,#1a3a1a 0%,#1e4a1e 45%,#1a3a1a 45%,#1e4a1e 100%)',
                  borderRadius:12, padding:'14px 10px', border:'1px solid rgba(255,255,255,0.07)',
                  position:'relative', overflow:'hidden',
                }}>
                  {/* Pitch lines */}
                  <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
                    {/* Center line */}
                    <div style={{ position:'absolute', top:'50%', left:'5%', right:'5%', height:1, background:'rgba(255,255,255,0.12)' }}/>
                    {/* Center circle */}
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:60, height:60, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)' }}/>
                    {/* Penalty areas */}
                    <div style={{ position:'absolute', top:'4%', left:'20%', right:'20%', height:'14%', border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none' }}/>
                    <div style={{ position:'absolute', bottom:'4%', left:'20%', right:'20%', height:'14%', border:'1px solid rgba(255,255,255,0.08)', borderTop:'none' }}/>
                  </div>

                  {/* Two teams side by side on pitch */}
                  <div style={{ display:'flex', gap:8, position:'relative', zIndex:1 }}>
                    <PitchFormation
                      players={lineupA?.startingXI}
                      formation={lineupA?.formation || '?'}
                      teamName={match.teamA}
                      flag={match.flagA}
                      flipped={false}
                    />
                    <div style={{ width:1, background:'rgba(255,255,255,0.1)', alignSelf:'stretch' }}/>
                    <PitchFormation
                      players={lineupB?.startingXI}
                      formation={lineupB?.formation || '?'}
                      teamName={match.teamB}
                      flag={match.flagB}
                      flipped={true}
                    />
                  </div>
                </div>

                {/* Substitutes */}
                {(lineupA?.substitutes?.length > 0 || lineupB?.substitutes?.length > 0) && (
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { side:match.teamA, flag:match.flagA, subs:lineupA?.substitutes },
                      { side:match.teamB, flag:match.flagB, subs:lineupB?.substitutes },
                    ].map((t, ti) => t.subs?.length > 0 && (
                      <div key={ti} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:9, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          {t.flag} Rezerve
                        </div>
                        {t.subs.slice(0,5).map((s, si) => (
                          <div key={si} style={{ fontSize:10, color:'rgba(255,255,255,0.4)', padding:'2px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                            {typeof s === 'string' ? s : (s.name || s)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding:'20px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontStyle:'italic', lineHeight:1.7 }}>
                  Echipele probabile vor aparea cand exista surse credibile.<br/>
                  <span style={{ fontSize:9 }}>Surse: Bulinews / FotMob / stiri oficiale echipa</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: PREDICTIE ── */}
        {tab === 'pred' && (
          <div>
            {prediction ? (
              <div style={{ background:'rgba(0,229,160,0.04)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(0,229,160,0.12)' }}>
                <div style={{ fontSize:9, color:'rgba(0,229,160,0.5)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>Predictia ta</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff', textAlign:'center', marginBottom:8 }}>
                  {match.flagA} {prediction.scoreA} - {prediction.scoreB} {match.flagB}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:16 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Cartonașe: {prediction.possession}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Cornere: {prediction.corners}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'20px' }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', marginBottom:12 }}>Nu ai facut inca o predictie pentru acest meci.</div>
              </div>
            )}

            {lockInfo.state === 'open' && (
              <button onClick={() => { onClose(); onPredict(match); }} style={{ width:'100%', marginTop:12, padding:14, background: prediction ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00E5A0,#00C27A)', border: prediction ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius:12, color: prediction ? 'rgba(255,255,255,0.6)' : '#060C09', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                {prediction ? 'Editeaza predictia' : '+ Adauga predictie'}
              </button>
            )}
            {lockInfo.state !== 'open' && lockInfo.state !== 'finished' && (
              <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(107,114,128,0.08)', border:'1px solid rgba(107,114,128,0.15)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
                Predictiile s-au inchis cu 30 de minute inainte de start.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── EVENIMENTE SPECIALE ──────────────────────────────────────────────────────
function SpecialEventsPanel({ user, specialResults, allSpecialPreds }) {
  const [pred, setPred]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft]           = useState({ winner:'', semifinalists:[], topScorerCountry:'' });
  const locked    = isSpecialLocked();
  const countdown = specialLockCountdown();

  // QF state — { matchId: teamName }
  const [draftQF, setDraftQF]   = useState({});
  const [savingQF, setSavingQF] = useState(false);
  const [msgQF, setMsgQF]       = useState('');
  const qfLocked    = isQFLocked();
  const qfCountdown = qfLockCountdown();

  useEffect(() => {
    if (!user?.uid) return;
    const ext = allSpecialPreds?.[user.uid];
    if (ext) {
      setPred(ext);
      setDraft({ winner:ext.winner||'', semifinalists:ext.semifinalists||[], topScorerCountry:ext.topScorerCountry||'' });
      setDraftQF(ext.quarterFinalists || {});
    } else {
      loadSpecialPrediction(user.uid).then(p => {
        if (p) {
          setPred(p);
          setDraft({ winner:p.winner||'', semifinalists:p.semifinalists||[], topScorerCountry:p.topScorerCountry||'' });
          setDraftQF(p.quarterFinalists || {});
        }
      });
    }
  }, [user?.uid, allSpecialPreds]);

  const toggleSemi = (name) => {
    if (locked) return;
    setDraft(d => {
      const arr = d.semifinalists || [];
      if (arr.includes(name)) return { ...d, semifinalists:arr.filter(x=>x!==name) };
      if (arr.length >= 4) return d;
      return { ...d, semifinalists:[...arr, name] };
    });
  };

  const pickQF = (matchId, team) => {
    if (qfLocked) return;
    setDraftQF(prev => ({ ...prev, [matchId]: prev[matchId] === team ? undefined : team }));
  };

  const handleSave = async () => {
    if (locked || !user?.uid) return;
    if (!draft.winner) { setMsg('Alege câștigătoarea!'); return; }
    if (draft.semifinalists.length !== 4) { setMsg('Alege exact 4 semifinaliste!'); return; }
    if (!draft.topScorerCountry) { setMsg('Alege țara golgheterului!'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await saveSpecialPrediction(user.uid, draft);
      if (res.success) { setPred(draft); setMsg('✅ Salvat!'); }
      else setMsg('Eroare: ' + (res.error || 'necunoscută'));
    } catch(e) { setMsg('Eroare: ' + (e.message || 'necunoscută')); }
    finally { setSaving(false); }
  };

  const handleSaveQF = async () => {
    if (qfLocked || !user?.uid) return;
    const filled = Object.values(draftQF).filter(Boolean).length;
    if (filled !== 8) { setMsgQF(`Alege câștigătorul pentru toate 8 meciurile (${filled}/8)`); return; }
    setSavingQF(true); setMsgQF('');
    try {
      const clean = Object.fromEntries(Object.entries(draftQF).filter(([,v])=>v));
      const res = await saveQFPrediction(user.uid, clean);
      if (res.success) { setPred(p => ({ ...p, quarterFinalists: clean })); setMsgQF('✅ Salvat!'); }
      else setMsgQF('Eroare: ' + (res.error || 'necunoscută'));
    } catch(e) { setMsgQF('Eroare: ' + (e.message || 'necunoscută')); }
    finally { setSavingQF(false); }
  };

  const myPts  = calcSpecialPoints(pred, specialResults);
  const qfPts  = calcQFPoints(pred, specialResults);
  const qfFilled = Object.values(draftQF).filter(Boolean).length;

  // SF state — { matchId: teamName } for "Calificate în Semifinale"
  const [draftSF, setDraftSF]   = useState({});
  const [savingSF, setSavingSF] = useState(false);
  const [msgSF, setMsgSF]       = useState('');
  const sfLocked    = isSFPredLocked();
  const sfCountdown = sfPredLockCountdown();
  const sfPts       = calcSFPoints(pred, specialResults);
  const sfFilled    = Object.values(draftSF).filter(Boolean).length;

  useEffect(() => {
    if (!pred) return;
    setDraftSF(pred.qualifiedToSemis || {});
  }, [pred]);

  const pickSF = (matchId, team) => {
    if (sfLocked) return;
    setDraftSF(prev => ({ ...prev, [matchId]: prev[matchId] === team ? undefined : team }));
  };

  const handleSaveSF = async () => {
    if (sfLocked || !user?.uid) return;
    if (sfFilled !== 4) { setMsgSF(`Alege câștigătorul pentru toate 4 meciurile (${sfFilled}/4)`); return; }
    setSavingSF(true); setMsgSF('');
    try {
      const clean = Object.fromEntries(Object.entries(draftSF).filter(([,v])=>v));
      const res = await saveSFPrediction(user.uid, clean);
      if (res.success) { setPred(p => ({ ...p, qualifiedToSemis: clean })); setMsgSF('✅ Salvat!'); }
      else setMsgSF('Eroare: ' + (res.error || 'necunoscută'));
    } catch(e) { setMsgSF('Eroare: ' + (e.message || 'necunoscută')); }
    finally { setSavingSF(false); }
  };

  return (
    <div style={{ marginBottom:16, border:'1px solid rgba(255,215,0,0.18)', borderRadius:14, overflow:'hidden', background:'rgba(255,215,0,0.03)' }}>

      {/* Collapsed header */}
      <div onClick={() => setIsExpanded(e => !e)}
        style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>⭐</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#FFD700' }}>Evenimente Speciale</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1 }}>
              {locked ? '🔒 Blocat' : countdown ? `🔓 Blochează în ${countdown}` : '🔓 Deschis'}
              {' · '}Bonus total: {myPts + qfPts.total} pts
            </div>
          </div>
        </div>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid rgba(255,215,0,0.08)' }}>

          {/* ── Campioană + Semifinaliste + Golgheter ── */}
          <div style={{ paddingTop:12 }}>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>🏆 Câștigătoarea <span style={{ color:'#FFD700' }}>500 pts</span></div>
              {locked
                ? <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{pred?.winner ? WC_TEAMS.find(t=>t.name===pred.winner)?.flag+' '+pred.winner : '—'}</div>
                : <select value={draft.winner} onChange={e=>setDraft(d=>({...d,winner:e.target.value}))} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:13, outline:'none' }}><option value="">— Alege echipa —</option>{WC_TEAMS.map(t=><option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}</select>}
              {specialResults?.winner && <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ {specialResults.winner}{pred?.winner===specialResults.winner?' · +500pts':''}</div>}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>🥈 Semifinaliste (4) <span style={{ color:'#FFD700' }}>200 pts / echipă</span></div>
              {locked
                ? <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{(pred?.semifinalists||[]).map(t=><span key={t} style={{ padding:'3px 8px', background:'rgba(255,255,255,0.08)', borderRadius:6, fontSize:11 }}>{WC_TEAMS.find(x=>x.name===t)?.flag} {t}</span>)}{!pred?.semifinalists?.length && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>—</span>}</div>
                : <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>{WC_TEAMS.map(t=>{ const sel=draft.semifinalists.includes(t.name); const full=draft.semifinalists.length>=4&&!sel; return <button key={t.name} onClick={()=>toggleSemi(t.name)} disabled={full} style={{ padding:'3px 7px', background:sel?'rgba(0,229,160,0.2)':'rgba(255,255,255,0.05)', border:`1px solid ${sel?'rgba(0,229,160,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:6, fontSize:10, color:full?'rgba(255,255,255,0.2)':'#fff', cursor:full?'default':'pointer' }}>{t.flag} {t.name}</button>; })}</div>}
              {specialResults?.semifinalists && <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ {specialResults.semifinalists.join(', ')}</div>}
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>⚽ Țara golgheterului <span style={{ color:'#FFD700' }}>300 pts</span></div>
              {locked
                ? <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{pred?.topScorerCountry ? WC_TEAMS.find(t=>t.name===pred.topScorerCountry)?.flag+' '+pred.topScorerCountry : '—'}</div>
                : <select value={draft.topScorerCountry} onChange={e=>setDraft(d=>({...d,topScorerCountry:e.target.value}))} style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:13, outline:'none' }}><option value="">— Alege țara —</option>{WC_TEAMS.map(t=><option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}</select>}
              {specialResults?.topScorerCountry && <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ {specialResults.topScorerCountry}{pred?.topScorerCountry===specialResults.topScorerCountry?' · +300pts':''}</div>}
            </div>
            {!locked && (
              <div>
                {msg && <div style={{ fontSize:11, color:msg.startsWith('✅')?'rgba(0,229,160,0.8)':'#EF4444', marginBottom:6 }}>{msg}</div>}
                <button onClick={handleSave} disabled={saving} style={{ width:'100%', padding:'10px', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.3)', borderRadius:10, color:'#FFD700', fontSize:13, fontWeight:800, cursor:'pointer' }}>{saving?'Se salvează...':'💾 Salvează predicțiile speciale'}</button>
              </div>
            )}
            {locked && msg && <div style={{ fontSize:11, color:msg.startsWith('✅')?'rgba(0,229,160,0.8)':'#EF4444', marginTop:6 }}>{msg}</div>}
          </div>

          {/* ── CALIFICATE ÎN SFERTURI ── */}
          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                🏆 Calificate în Sferturi
              </div>
              {qfPts.total > 0 && <span style={{ fontSize:12, fontWeight:800, color:'#FFD700' }}>+{qfPts.total} pts</span>}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:14 }}>
              {qfLocked
                ? '🔒 Blocat · +50 pts / echipă corectă · 7/8 = +100 · 8/8 = +200 bonus'
                : qfCountdown ? `⏳ Blochează în ${qfCountdown}` : '🔓 Alege câștigătorul din fiecare meci'}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {R16_MATCHES.map(m => {
                const savedQF = pred?.quarterFinalists || {};
                const picked  = qfLocked ? savedQF[m.id] : draftQF[m.id];
                const realWin = specialResults?.quarterFinalists?.[m.id];
                const homesel = picked === m.home;
                const awaysel = picked === m.away;
                const homecor = qfLocked && realWin && homesel && realWin === m.home;
                const homewrg = qfLocked && realWin && homesel && realWin !== m.home;
                const awaycor = qfLocked && realWin && awaysel && realWin === m.away;
                const awaywrg = qfLocked && realWin && awaysel && realWin !== m.away;
                const realH   = qfLocked && realWin === m.home;
                const realA   = qfLocked && realWin === m.away;

                const teamBtn = (side) => {
                  const sel = side==='home' ? homesel : awaysel;
                  const cor = side==='home' ? homecor : awaycor;
                  const wrg = side==='home' ? homewrg : awaywrg;
                  const isReal = side==='home' ? realH : realA;
                  let bg='rgba(255,255,255,0.03)', bc='rgba(255,255,255,0.07)', tc='rgba(255,255,255,0.75)';
                  if (!qfLocked && sel) { bg='rgba(0,229,160,0.14)'; bc='rgba(0,229,160,0.5)'; tc='#00E5A0'; }
                  if (cor)  { bg='rgba(0,229,160,0.14)'; bc='rgba(0,229,160,0.5)'; tc='#00E5A0'; }
                  if (wrg)  { bg='rgba(239,68,68,0.12)'; bc='rgba(239,68,68,0.4)'; tc='#EF4444'; }
                  if (qfLocked && isReal && !sel) bc='rgba(0,229,160,0.2)';
                  const flag = side==='home' ? m.homeFlag : m.awayFlag;
                  const team = side==='home' ? m.home : m.away;
                  const badge = !qfLocked && sel ? <div style={{fontSize:9,color:'rgba(0,229,160,0.8)',marginTop:2}}>✓ seleție</div>
                    : cor ? <div style={{fontSize:9,color:'#00E5A0',marginTop:2}}>✓ +50 pts</div>
                    : wrg ? <div style={{fontSize:9,color:'#EF4444',marginTop:2}}>✗</div>
                    : qfLocked && isReal && !sel ? <div style={{fontSize:9,color:'rgba(0,229,160,0.5)',marginTop:2}}>câștigător real</div>
                    : null;
                  return (
                    <button
                      key={side}
                      disabled={qfLocked}
                      onClick={() => side==='home' ? pickQF(m.id, m.home) : pickQF(m.id, m.away)}
                      style={{ flex:1, padding:'12px 6px', border:`1px solid ${bc}`, borderRadius:10,
                        background:bg, cursor:qfLocked?'default':'pointer',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        transition:'background 0.12s, border-color 0.12s' }}>
                      <span style={{ fontSize:24, lineHeight:1 }}>{flag}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:tc, textAlign:'center', lineHeight:1.2 }}>{team}</span>
                      {badge}
                    </button>
                  );
                };

                return (
                  <div key={m.id} style={{ display:'flex', gap:6, alignItems:'stretch' }}>
                    {teamBtn('home')}
                    <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.18)' }}>VS</span>
                    </div>
                    {teamBtn('away')}
                    {qfLocked && realWin && picked && (
                      <div style={{ position:'absolute' }}/>
                    )}
                  </div>
                );
              })}
            </div>

            {!qfLocked && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:10, marginBottom:7, color:qfFilled===8?'rgba(0,229,160,0.8)':'rgba(255,255,255,0.3)' }}>
                  {qfFilled}/8 meciuri selectate
                </div>
                {msgQF && <div style={{ fontSize:11, marginBottom:6, color:msgQF.startsWith('✅')?'rgba(0,229,160,0.8)':'#EF4444' }}>{msgQF}</div>}
                <button onClick={handleSaveQF} disabled={savingQF||qfFilled!==8} style={{
                  width:'100%', padding:'10px', fontSize:13, fontWeight:800, borderRadius:10,
                  cursor:qfFilled===8?'pointer':'default',
                  background:qfFilled===8?'rgba(0,229,160,0.12)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${qfFilled===8?'rgba(0,229,160,0.35)':'rgba(255,255,255,0.07)'}`,
                  color:qfFilled===8?'#00E5A0':'rgba(255,255,255,0.2)',
                }}>
                  {savingQF?'Se salvează...':'💾 Salvează calificatele în sferturi'}
                </button>
              </div>
            )}
            {qfLocked && specialResults?.quarterFinalists && (
              <div style={{ fontSize:10, color:'rgba(0,229,160,0.6)', marginTop:10, textAlign:'center' }}>
                {qfPts.correct}/8 corecte · {qfPts.base} pts{qfPts.bonus>0?` + ${qfPts.bonus} bonus`:''}{qfPts.total>0?` = ${qfPts.total} pts`:''}
              </div>
            )}
          </div>

          {/* ── CALIFICATE ÎN SEMIFINALE ─────────────────────────────────────── */}
          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                🏅 Calificate în Semifinale
              </div>
              {sfPts.total > 0 && <span style={{ fontSize:12, fontWeight:800, color:'#FFD700' }}>+{sfPts.total} pts</span>}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:14 }}>
              {sfLocked
                ? '🔒 Blocat · +100 pts / echipă corectă · bonus +250 la 4/4'
                : sfCountdown ? `⏳ Blochează în ${sfCountdown}` : '🔓 Alege câștigătorul din fiecare sfert de finală'}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {SF_MATCHES.map(m => {
                const savedSF = pred?.qualifiedToSemis || {};
                const picked  = sfLocked ? savedSF[m.id] : draftSF[m.id];
                const realWin = specialResults?.qualifiedToSemis?.[m.id];
                const homesel = picked === m.home;
                const awaysel = picked === m.away;
                const homecor = sfLocked && realWin && homesel && realWin === m.home;
                const homewrg = sfLocked && realWin && homesel && realWin !== m.home;
                const awaycor = sfLocked && realWin && awaysel && realWin === m.away;
                const awaywrg = sfLocked && realWin && awaysel && realWin !== m.away;
                const realH   = sfLocked && realWin === m.home;
                const realA   = sfLocked && realWin === m.away;

                const teamBtn = (side) => {
                  const sel = side==='home' ? homesel : awaysel;
                  const cor = side==='home' ? homecor : awaycor;
                  const wrg = side==='home' ? homewrg : awaywrg;
                  const isReal = side==='home' ? realH : realA;
                  const flag = side==='home' ? m.homeFlag : m.awayFlag;
                  const team = side==='home' ? m.home : m.away;
                  let bg='rgba(255,255,255,0.03)', bc='rgba(255,255,255,0.07)', tc='rgba(255,255,255,0.75)';
                  if (!sfLocked && sel) { bg='rgba(0,229,160,0.14)'; bc='rgba(0,229,160,0.5)'; tc='#00E5A0'; }
                  if (cor)  { bg='rgba(0,229,160,0.14)'; bc='rgba(0,229,160,0.5)'; tc='#00E5A0'; }
                  if (wrg)  { bg='rgba(239,68,68,0.12)'; bc='rgba(239,68,68,0.4)'; tc='#EF4444'; }
                  if (sfLocked && isReal && !sel) bc='rgba(0,229,160,0.2)';
                  const badge = !sfLocked && sel ? <div style={{fontSize:9,color:'rgba(0,229,160,0.8)',marginTop:2}}>✓ seleție</div>
                    : cor ? <div style={{fontSize:9,color:'#00E5A0',marginTop:2}}>✓ +100 pts</div>
                    : wrg ? <div style={{fontSize:9,color:'#EF4444',marginTop:2}}>✗</div>
                    : sfLocked && isReal && !sel ? <div style={{fontSize:9,color:'rgba(0,229,160,0.5)',marginTop:2}}>câștigător real</div>
                    : null;
                  return (
                    <button key={side} disabled={sfLocked}
                      onClick={() => pickSF(m.id, team)}
                      style={{ flex:1, padding:'12px 6px', border:`1px solid ${bc}`, borderRadius:10,
                        background:bg, cursor:sfLocked?'default':'pointer',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        transition:'background 0.12s, border-color 0.12s' }}>
                      <span style={{ fontSize:24, lineHeight:1 }}>{flag}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:tc, textAlign:'center', lineHeight:1.2 }}>{team}</span>
                      {badge}
                    </button>
                  );
                };

                return (
                  <div key={m.id} style={{ display:'flex', gap:6, alignItems:'stretch' }}>
                    {teamBtn('home')}
                    <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.18)' }}>VS</span>
                    </div>
                    {teamBtn('away')}
                  </div>
                );
              })}
            </div>

            {!sfLocked && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:10, marginBottom:7, color:sfFilled===4?'rgba(0,229,160,0.8)':'rgba(255,255,255,0.3)' }}>
                  {sfFilled}/4 meciuri selectate
                </div>
                {msgSF && <div style={{ fontSize:11, marginBottom:6, color:msgSF.startsWith('✅')?'rgba(0,229,160,0.8)':'#EF4444' }}>{msgSF}</div>}
                <button onClick={handleSaveSF} disabled={savingSF||sfFilled!==4} style={{
                  width:'100%', padding:'10px', fontSize:13, fontWeight:800, borderRadius:10,
                  cursor:sfFilled===4?'pointer':'default',
                  background:sfFilled===4?'rgba(0,229,160,0.12)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${sfFilled===4?'rgba(0,229,160,0.35)':'rgba(255,255,255,0.07)'}`,
                  color:sfFilled===4?'#00E5A0':'rgba(255,255,255,0.2)',
                }}>
                  {savingSF?'Se salvează...':'💾 Salvează calificatele în semifinale'}
                </button>
              </div>
            )}
            {sfLocked && specialResults?.qualifiedToSemis && (
              <div style={{ fontSize:10, color:'rgba(0,229,160,0.6)', marginTop:10, textAlign:'center' }}>
                {sfPts.correct}/{sfPts.entered} corecte · {sfPts.base} pts{sfPts.bonus>0?` + ${sfPts.bonus} bonus`:sfPts.allDone?'':' · bonus după toate 4'}{sfPts.total>0?` = ${sfPts.total} pts`:''}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── URMĂTORUL MECI CARD ──────────────────────────────────────────────────────
// Shows the next actionable match at the top of the screen.
// Priority: open > soon > live. Excluded from the list below.
function NextMatchCard({ matches, predictions, onPredict }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Find next match: live > soon > locked > open (finished never shown here)
  const next = React.useMemo(() => {
    const byState = (state) => matches
      .filter(m => !m.isFinished && matchLockState(m).state === state)
      .sort((a,b) => new Date(a.time)-new Date(b.time))[0];
    return byState('live') || byState('soon') || byState('locked') || byState('open') || null;
  }, [matches, now]);

  if (!next) return null;

  const lockInfo   = matchLockState(next);
  const pred       = predictions[next.id];
  const isEditable = lockInfo.state === 'open' || lockInfo.state === 'soon';
  const isLive     = lockInfo.state === 'live';

  // Countdown until lock (ms)
  const lockAt    = new Date(next.time).getTime() - (30 * 60 * 1000);
  const msToLock  = lockAt - now;
  const countdown = msToLock > 0 ? (() => {
    const totalSec = Math.floor(msToLock / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m`;
    if (m > 0) return `${m}m ${s.toString().padStart(2,'0')}s`;
    return `${s}s`;
  })() : null;

  const kickoffStr = new Date(next.time).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  const accentColor = isLive ? '#EF4444' : lockInfo.state === 'soon' ? '#F59E0B' : '#00E5A0';
  const borderColor = isLive ? 'rgba(239,68,68,0.35)' : lockInfo.state === 'soon' ? 'rgba(245,158,11,0.35)' : 'rgba(0,229,160,0.25)';
  const bgGlow      = isLive ? 'rgba(239,68,68,0.06)' : lockInfo.state === 'soon' ? 'rgba(245,158,11,0.06)' : 'rgba(0,229,160,0.04)';

  return (
    <div style={{ marginBottom:16, borderRadius:18, overflow:'hidden', border:`1px solid ${borderColor}`, background:`linear-gradient(160deg, ${bgGlow}, rgba(255,255,255,0.01))`, position:'relative' }}>

      {/* Top glow stripe */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent,${accentColor},transparent)` }}/>

      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px 8px' }}>
        <div style={{ fontSize:10, fontWeight:800, color:accentColor, letterSpacing:'0.12em', textTransform:'uppercase' }}>
          {isLive ? '⬤ Live acum' : '🔥 Următorul meci'}
        </div>
        <StatusPill state={lockInfo.state}/>
      </div>

      {/* Teams */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 20px 12px' }}>
        {/* Team A */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:40, lineHeight:1 }}>{next.flagA}</span>
          <span style={{ fontSize:14, fontWeight:800, color:'#fff', textAlign:'center' }}>{next.teamA}</span>
        </div>

        {/* Center */}
        <div style={{ flex:'0 0 auto', textAlign:'center', padding:'0 8px' }}>
          {isLive ? (
            <div style={{ fontSize:28, fontWeight:900, color:'#EF4444', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em' }}>
              {next.realScoreA ?? 0} – {next.realScoreB ?? 0}
            </div>
          ) : (
            <>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:700, letterSpacing:'0.08em' }}>VS</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:700, marginTop:4, fontFamily:"'DM Mono',monospace" }}>
                {new Date(next.time).toLocaleTimeString('ro-RO',{timeZone:'Europe/Bucharest',hour:'2-digit',minute:'2-digit'})}
              </div>
            </>
          )}
        </div>

        {/* Team B */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:40, lineHeight:1 }}>{next.flagB}</span>
          <span style={{ fontSize:14, fontWeight:800, color:'#fff', textAlign:'center' }}>{next.teamB}</span>
        </div>
      </div>

      {/* Date + venue */}
      <div style={{ display:'flex', justifyContent:'center', gap:12, padding:'0 16px 10px', flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>🗓 {kickoffStr} RO</span>
        {next.venue && <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>📍 {next.venue}</span>}
      </div>

      {/* Live details — minute, scorers, cards, corners — shown only when live */}
      {isLive && (next.liveMinute !== null && next.liveMinute !== undefined || next.homeScorers || next.awayScorers || next.goalScorers || next.liveCards || next.liveCorners) && (
        <div style={{ margin:'0 16px 10px', padding:'8px 12px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, display:'flex', flexDirection:'column', gap:5 }}>
          {next.liveMinute !== null && next.liveMinute !== undefined && next.liveMinute !== '' && (
            <div style={{ fontSize:13, fontWeight:800, color:'#EF4444', fontFamily:"'DM Mono',monospace" }}>
              🔴 {next.liveMinute}'
            </div>
          )}
          {(next.homeScorers || next.awayScorers) ? (
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>⚽ Marcatori</div>
              {next.homeScorers && (
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{next.flagA} {next.teamA}: {next.homeScorers}</div>
              )}
              {next.awayScorers && (
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{next.flagB} {next.teamB}: {next.awayScorers}</div>
              )}
            </div>
          ) : next.goalScorers ? (
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>⚽ {next.goalScorers}</div>
          ) : null}
          {next.liveCards && (
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>🟨 Cartonașe: {next.liveCards}</div>
          )}
          {next.liveCorners && (
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>🚩 Cornere: {next.liveCorners}</div>
          )}
        </div>
      )}

      {/* Countdown strip */}
      {countdown && !isLive && (
        <div style={{ margin:'0 16px 10px', padding:'6px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Se blochează în</span>
          <span style={{ fontSize:13, fontWeight:800, color:accentColor, fontFamily:"'DM Mono',monospace" }}>{countdown}</span>
        </div>
      )}

      {/* Existing prediction */}
      {pred && !next.isFinished && (
        <div style={{ margin:'0 16px 10px', padding:'6px 12px', background:'rgba(0,229,160,0.05)', borderRadius:8, border:'1px solid rgba(0,229,160,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'rgba(0,229,160,0.7)' }}>✓ Predicția ta: {pred.scoreA}–{pred.scoreB}</span>
          {isEditable && <span style={{ fontSize:10, color:'rgba(0,229,160,0.5)', fontWeight:700 }}>Editează</span>}
        </div>
      )}

      {/* CTA button */}
      {isEditable && (
        <div style={{ padding:'0 16px 16px' }}>
          <button
            onClick={() => onPredict(next)}
            style={{
              width:'100%', padding:'14px 20px',
              background: pred
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg,#00E5A0,#00C27A)',
              border: pred ? '1px solid rgba(255,255,255,0.1)' : 'none',
              borderRadius:12,
              color: pred ? 'rgba(255,255,255,0.7)' : '#060C09',
              fontSize:15, fontWeight:900, cursor:'pointer',
              fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.1em',
              boxShadow: pred ? 'none' : '0 6px 24px rgba(0,229,160,0.25)',
              transition:'all 0.18s',
            }}
          >
            {pred ? '✏️ EDITEAZĂ PREDICȚIA' : '🎯 FĂ PREDICȚIA'}
          </button>
        </div>
      )}
      {isLive && !isEditable && (
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ padding:'10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:12, textAlign:'center' }}>
            <span style={{ fontSize:12, color:'rgba(239,68,68,0.8)', fontWeight:700 }}>🔒 Predicțiile sunt blocate</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchesScreen({ predictions, onPredict, finishedResults, groupOverrides, allPredictions = {}, allUsers = {}, activityFeed = [], user = null, specialResults = null, allSpecialPreds = {} }) {
  const [tab, setTab]              = useState("toate"); // "toate" | "mele" | "prieteni"
  const [detailMatch, setDetailMatch] = useState(null);

  // Load admin-saved official lineups from localStorage
  // This is re-evaluated on each render (lightweight localStorage read)
  const adminLineups = (() => {
    try { return JSON.parse(localStorage.getItem('wc2026_lineups') || '{}'); } catch { return {}; }
  })();
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [finishedOpen, setFinishedOpen] = useState(false); // collapsed finished section
  const [groupFilter, setGroupFilter] = useState("toate");

  const toggleGroup = (g) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  // Build per-group match lists — uses finishedResults so isFinished/isLive/isLocked are live
  const liveGroupedMatches = useMemo(() => {
    const live = buildMatches(finishedResults); // official WC only
    return [...ALL_GROUPS].reduce((acc, g) => {
      acc[g] = live.filter(m => m.group === g);
      return acc;
    }, {});
  }, [finishedResults]);

  // Alias used by all rendering logic below
  const groupedMatches = liveGroupedMatches;

  // ── Knockout matches (group:"KO") — kept fully separate from A-L group logic
  // on purpose: adding "KO" to ALL_GROUPS would create an unwanted "GRUPA KO"
  // filter button and break GROUP_TEAMS computation. Instead, KO matches are
  // simply appended to the "toate"/"mele" match list directly.
  const koMatches = useMemo(() => {
    const live = buildMatches(finishedResults);
    return live.filter(m => m.group === "KO");
  }, [finishedResults]);

  // All live matches (flat array, for friendMatches/myPred filtering)
  const allLiveMatches = useMemo(() => buildMatches(finishedResults), [finishedResults]); // official WC only

  // Next match for the hero card: live > soon > locked > open
  // FINISHED matches never appear here — only non-finished ones
  const nextMatch = useMemo(() => {
    const byState = (state) => allLiveMatches
      .filter(m => !m.isFinished && matchLockState(m).state === state)
      .sort((a,b) => new Date(a.time)-new Date(b.time))[0];
    return byState('live') || byState('soon') || byState('locked') || byState('open') || null;
  }, [allLiveMatches]);
  const nextMatchId = nextMatch?.id ?? null;

  // BUG-2 fix: friendMatches includes locked matches (spec: visible after 30-min lock)
  const myPredMatches = allLiveMatches.filter(m => predictions[m.id]);
  const friendMatches = useMemo(() => {
    const sortOrder = (m) => {
      const s = matchLockState(m).state;
      if (s === 'live')   return 0;
      if (s === 'soon')   return 1;
      if (s === 'locked') return 2;
      if (m.isFinished)   return 3;
      return 4;
    };
    return allLiveMatches
      .filter(m => m.isFinished || m.isLive || m.isLocked)
      .sort((a, b) => {
        const oa = sortOrder(a), ob = sortOrder(b);
        if (oa !== ob) return oa - ob;
        // finished: newest first; others: soonest first
        return (a.isFinished ? -1 : 1) * (new Date(a.time) - new Date(b.time));
      });
  }, [allLiveMatches]);

  const tabs = [
    { id:"toate",    label:"Toate",       count: MATCHES.length },
    { id:"mele",     label:"Ale mele",    count: myPredMatches.length },
    { id:"prieteni", label:"Prieteni",    count: friendMatches.length },
    // Test tab removed for production
  ];

  // Test matches enriched with live result data (same as buildMatches but for test IDs)
  // testMatchesLive removed for production

  const renderGroupSection = (g, fOpen, setFOpen) => {
    const allMatches = tab === "mele"
      ? groupedMatches[g].filter(m => predictions[m.id])
      : tab === "prieteni"
      ? groupedMatches[g].filter(m => m.isFinished || m.isLive || m.isLocked)
      : groupedMatches[g];

    if (allMatches.length === 0) return null;
    const teams = GROUP_TEAMS[g] || [];
    const predCount = allMatches.filter(m => predictions[m.id]).length;
    const collapsed = collapsedGroups.has(g);

    // Split upcoming vs finished
    // prieteni: sort by status (live>locked>finished newest first), no split accordion
    const sortFriend = (arr) => [...arr].sort((a, b) => {
      const order = (m) => {
        const s = matchLockState(m).state;
        if (s === 'live')   return 0;
        if (s === 'soon')   return 1;
        if (s === 'locked') return 2;
        if (m.isFinished)   return 3;
        return 4;
      };
      const oa = order(a), ob = order(b);
      if (oa !== ob) return oa - ob;
      return (a.isFinished ? -1 : 1) * (new Date(a.time) - new Date(b.time));
    });
    const upcoming = (tab === "prieteni") ? sortFriend(allMatches) : allMatches.filter(m => !m.isFinished);
    const finished = (tab === "prieteni") ? [] : allMatches.filter(m => m.isFinished)
                       .sort((a, b) => new Date(b.time) - new Date(a.time));
    const useSplit = fOpen !== undefined && finished.length > 0;

    return (
      <div key={g} style={{ marginBottom:12 }}>
        <GroupHeader
          group={g}
          teams={teams}
          collapsed={collapsed}
          onToggle={() => toggleGroup(g)}
          matchCount={allMatches.length}
          predCount={predCount}
        />
        {!collapsed && (
          <div style={{ background:"rgba(255,255,255,0.01)", border:"1px solid rgba(255,255,255,0.06)", borderTop:"none", borderRadius:"0 0 12px 12px", padding:"10px 10px 4px" }}>
            {tab === "toate" && <GroupStandings group={g} finishedResults={finishedResults} overrideOrder={groupOverrides?.[g] || null}/>}
            {useSplit ? (
              <>
                {/* Finished accordion at the top of the group body */}
                {finished.length > 0 && (
                  <div style={{ marginBottom:6 }}>
                    <button
                      onClick={() => setFOpen(o => !o)}
                      style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, cursor:'pointer', color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700 }}
                    >
                      <span>⏱ Finalizate ({finished.length})</span>
                      <span>{fOpen ? '▲' : '▼'}</span>
                    </button>
                    {fOpen && finished.map(m => (
                      <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
                    ))}
                  </div>
                )}
                {upcoming.map(m => (
                  <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
                ))}
              </>
            ) : (
              allMatches.map(m => (
                <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const visibleGroups = groupFilter === "toate" ? [...ALL_GROUPS] : [groupFilter]; // AMICALE removed

  return (
    <>
    <div>
      {/* Sticky group filter tabs */}
      <div style={{ position:"sticky", top:0, zIndex:30, background:"rgba(10,14,20,0.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        {/* Main tabs */}
        <div style={{ display:"flex", padding:"10px 16px 0", gap:0, borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
          {tabs.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex:1, padding:"9px 6px", background:"none", border:"none",
                  color: active ? "#fff" : "rgba(255,255,255,0.35)",
                  fontSize:12, fontWeight: active ? 700 : 500,
                  cursor:"pointer", position:"relative",
                  borderBottom: active ? "2px solid #00E5A0" : "2px solid transparent",
                  transition:"all 0.15s",
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{ marginLeft:5, fontSize:10, color: active ? "rgba(0,229,160,0.7)" : "rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace" }}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Group quick-filter (A–L scroll row) */}
        <div style={{ display:"flex", gap:4, padding:"8px 16px", overflowX:"auto" }}>
          <button
            onClick={() => setGroupFilter("toate")}
            style={{ flexShrink:0, padding:"4px 12px", borderRadius:20, background:groupFilter==="toate"?"rgba(0,229,160,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${groupFilter==="toate"?"rgba(0,229,160,0.3)":"rgba(255,255,255,0.07)"}`, color:groupFilter==="toate"?"#00E5A0":"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, cursor:"pointer" }}
          >
            Toate
          </button>
          {ALL_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              style={{ flexShrink:0, padding:"4px 12px", borderRadius:20, background:groupFilter===g?"rgba(0,229,160,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${groupFilter===g?"rgba(0,229,160,0.3)":"rgba(255,255,255,0.07)"}`, color:groupFilter===g?"#00E5A0":"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, cursor:"pointer" }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"12px 12px 0" }}>

        {/* ── Următorul meci hero card — Toate tab + no group filter only ── */}
        {tab === "toate" && groupFilter === "toate" && nextMatch && (
          <NextMatchCard
            matches={allLiveMatches}
            predictions={predictions}
            onPredict={onPredict}
          />
        )}

        {/* ── Finished matches accordion — right under hero card ── */}
        {tab === "toate" && groupFilter === "toate" && (() => {
          const allM = visibleGroups.flatMap(g => groupedMatches[g] || []);
          const finished = allM
            .filter(m => m.isFinished && m.id !== nextMatchId)
            .sort((a, b) => new Date(b.time) - new Date(a.time));
          if (finished.length === 0) return null;
          return (
            <div style={{ marginBottom:12 }}>
              <button
                onClick={() => setFinishedOpen(o => !o)}
                style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, cursor:'pointer', color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:700 }}
              >
                <span>⏱ Meciuri finalizate ({finished.length})</span>
                <span style={{ fontSize:11 }}>{finishedOpen ? '▲' : '▼'}</span>
              </button>
              {finishedOpen && (
                <div style={{ marginTop:4 }}>
                  {finished.map(m => (
                    <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Live feed */}
        {tab === "toate" && groupFilter === "toate" && <SpecialEventsPanel user={user} specialResults={specialResults} allSpecialPreds={allSpecialPreds}/>}
        {tab === "toate" && <LiveFeed events={activityFeed || []}/>}

        {/* Empty states */}
        {tab === "mele" && myPredMatches.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔮</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>Nicio predicție încă</div>
            <div style={{ fontSize:13 }}>Selectează un meci deschis din tab-ul "Toate"</div>
          </div>
        )}

        {tab === "prieteni" && friendMatches.length === 0 && (
          <div style={{ padding:"0 4px" }}>
            <div style={{ padding:"14px 14px 10px", display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:16 }}>🔒</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>Predicțiile prietenilor</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>Se deblochează la startul meciului</div>
              </div>
            </div>
            {[0,1,2].map(i => (
              <div key={i} style={{ marginBottom:8, borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ padding:"12px 14px", background:"rgba(255,255,255,0.02)", filter:"blur(2px)", opacity:0.5 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ width:60, height:10, borderRadius:4, background:"rgba(255,255,255,0.08)" }}/>
                    <div style={{ width:40, height:10, borderRadius:4, background:"rgba(255,255,255,0.06)" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
                      <div style={{ width:80, height:10, borderRadius:4, background:"rgba(255,255,255,0.06)" }}/>
                    </div>
                    <div style={{ width:36, height:14, borderRadius:4, background:"rgba(255,255,255,0.1)" }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group sections — upcoming only (finished shown in accordion above) */}
        {(tab === "toate" || tab === "mele") && groupFilter === "toate" && (() => {
          const allM = [...visibleGroups.flatMap(g => groupedMatches[g] || []), ...koMatches];
          const sorted = [...allM].sort((a, b) => new Date(a.time) - new Date(b.time));
          const filtered = tab === "mele" ? sorted.filter(m => predictions[m.id]) : sorted;
          if (filtered.length === 0) return null;
          const withoutHero = (tab === "toate" && nextMatchId)
            ? filtered.filter(m => m.id !== nextMatchId)
            : filtered;
          // Upcoming = not finished (live/soon/locked/open all stay in the list)
          // Finished matches are shown in the accordion above the feed
          const upcoming = tab === "mele"
            ? withoutHero  // "Ale mele" shows all predictions incl. finished
            : withoutHero.filter(m => !m.isFinished);
          if (upcoming.length === 0) return null;
          return upcoming.map(m => (
            <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
          ));
        })()}
        {(tab === "toate" || tab === "mele") && groupFilter !== "toate" && visibleGroups.map(g => renderGroupSection(g, finishedOpen, setFinishedOpen))}

        {/* Friends tab — shows predictions of all users for locked/finished matches */}
        {tab === "prieteni" && friendMatches.length > 0 && (
          <FriendPredictionsPanel
            matches={friendMatches}
            allPredictions={allPredictions}
            allUsers={allUsers}
            myPredictions={predictions}
          />
        )}

        {/* Test matches tab removed for production */}

      </div>
    </div>

    {/* Match detail modal */}
    {detailMatch && (
      <MatchDetailModal
        match={{ ...detailMatch, officialLineup: adminLineups[detailMatch.id] || null }}
        prediction={predictions[detailMatch.id]}
        onClose={() => setDetailMatch(null)}
        onPredict={onPredict}
      />
    )}
    </>
  );
}
