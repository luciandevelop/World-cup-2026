// ─── src/screens/MatchesScreen.jsx ───────────────────────────────────────────
// Full FIFA WC 2026 group stage — all 12 groups, all 72 matches.
// Tabs: "Toate" | "Predicțiile Mele" | "Predicțiile Prietenilor"
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import {
  MATCHES, GROUPS, MOCK_PREDICTIONS_FINISHED,
  POPULAR_PICKS, MOST_PREDICTED, LIVE_FEED_EVENTS, TYPE_COLOR,
  calcBreakdown, calcPoints, matchLockState, formatKickoffRO, getGroupLabel,
} from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';
import { StatusPill, SectionDivider } from '../components/UI.jsx';
import GroupStandings from '../components/GroupStandings.jsx';

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
    { label:"Posesie",         pts:b.possession,  max:15  },
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
  if (!match.isFinished && !match.isLive) return null;
  const preds = MOCK_PREDICTIONS_FINISHED;
  return (
    <div style={{ marginTop:8, animation:"revealFlip 0.3s ease both" }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600, marginBottom:8 }}>
        Predicțiile prietenilor
      </div>
      {preds.map((p, i) => {
        const isExact = match.isFinished && p.scoreA === match.realScoreA && p.scoreB === match.realScoreB;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:i < preds.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>
                {p.nickname[0]}
              </div>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.55)", fontWeight:600 }}>{p.nickname}</span>
              {isExact && <span style={{ fontSize:9, color:"#FFD700", background:"rgba(255,215,0,0.1)", border:"1px solid rgba(255,215,0,0.2)", padding:"1px 6px", borderRadius:4, fontWeight:700 }}>🎯 EXACT</span>}
            </div>
            <span style={{ fontSize:13, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
              {p.scoreA} – {p.scoreB}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({ match, prediction, onPredict }) {
  const lockInfo   = matchLockState(match);
  const isEditable = lockInfo.state === "open";
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
        onClick={() => isEditable ? onPredict(match) : (match.isFinished || match.isLive) && setExpanded(e => !e)}
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

        {/* Top row: status + pts */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <StatusPill state={lockInfo.state}/>
          {pts !== null && (
            <div style={{ fontSize:12, fontWeight:700, color:pts >= 100?"#FFD700":pts >= 50?"#00E5A0":"rgba(255,255,255,0.4)", fontFamily:"'DM Mono',monospace", background:pts >= 100?"rgba(255,215,0,0.08)":"transparent", padding:"1px 8px", borderRadius:4 }}>
              +{pts} pts
            </div>
          )}
        </div>

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
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Predicția ta: {prediction.scoreA}–{prediction.scoreB} · {prediction.possession}% · {prediction.corners}🔄</span>
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
function LiveFeed() {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600, marginBottom:10, paddingLeft:2 }}>
        Activitate recentă
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {LIVE_FEED_EVENTS.slice(0,4).map((e, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:10, animation:`staggerIn 0.3s ${i*0.06}s ease both` }}>
            <span style={{ fontSize:16 }}>{e.icon}</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", flex:1 }}>{e.text}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
              {e.pts && <span style={{ fontSize:11, fontWeight:700, color:TYPE_COLOR[e.type] || "#fff", fontFamily:"'DM Mono',monospace" }}>{e.pts}</span>}
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>{e.ago}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MATCHES SCREEN ───────────────────────────────────────────────────────────
export default function MatchesScreen({ predictions, onPredict, finishedResults }) {
  const [tab, setTab]              = useState("toate"); // "toate" | "mele" | "prieteni"
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [groupFilter, setGroupFilter] = useState("toate");

  const toggleGroup = (g) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  // Build per-group match lists
  const groupedMatches = useMemo(() => {
    return ALL_GROUPS.reduce((acc, g) => {
      acc[g] = MATCHES.filter(m => m.group === g);
      return acc;
    }, {});
  }, []);

  const myPredMatches = MATCHES.filter(m => predictions[m.id]);
  const friendMatches = MATCHES.filter(m => m.isFinished || m.isLive);

  const tabs = [
    { id:"toate",    label:"Toate",       count: MATCHES.length },
    { id:"mele",     label:"Ale mele",    count: myPredMatches.length },
    { id:"prieteni", label:"Prieteni",    count: friendMatches.length },
  ];

  const renderGroupSection = (g) => {
    const matches = tab === "mele"
      ? groupedMatches[g].filter(m => predictions[m.id])
      : tab === "prieteni"
      ? groupedMatches[g].filter(m => m.isFinished || m.isLive)
      : groupedMatches[g];

    if (matches.length === 0) return null;
    const teams = GROUP_TEAMS[g] || [];
    const predCount = matches.filter(m => predictions[m.id]).length;
    const collapsed = collapsedGroups.has(g);

    return (
      <div key={g} style={{ marginBottom:12 }}>
        <GroupHeader
          group={g}
          teams={teams}
          collapsed={collapsed}
          onToggle={() => toggleGroup(g)}
          matchCount={matches.length}
          predCount={predCount}
        />
        {!collapsed && (
          <div style={{ background:"rgba(255,255,255,0.01)", border:"1px solid rgba(255,255,255,0.06)", borderTop:"none", borderRadius:"0 0 12px 12px", padding:"10px 10px 4px" }}>
            {tab === "toate" && <GroupStandings group={g} finishedResults={finishedResults}/>}
            {matches.map(m => (
              <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict}/>
            ))}
          </div>
        )}
      </div>
    );
  };

  const visibleGroups = groupFilter === "toate" ? ALL_GROUPS : [groupFilter];

  return (
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

        {/* Live feed */}
        {tab === "toate" && <LiveFeed/>}

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

        {/* Group sections */}
        {(tab === "toate" || tab === "mele") && visibleGroups.map(g => renderGroupSection(g))}

        {/* Friends tab */}
        {tab === "prieteni" && visibleGroups.map(g => renderGroupSection(g))}

      </div>
    </div>
  );
}
