// ─── src/screens/AdminScreen.jsx ─────────────────────────────────────────────
// Admin panel — visible only to users whose email is in ADMIN_EMAILS.
// Allows editing match status, entering final scores, possession, corners.
// In production: writes to Supabase `matches` table instead of local state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ScoreInput, StepInput, PossessionInput } from '../components/UI.jsx';
import { MATCHES, ADMIN_EMAILS, formatKickoffRO } from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';

export default function AdminScreen({ currentUser, onMatchUpdate }) {
  const [sel,      setSel]      = useState(null);
  const [sA,       setSA]       = useState(0);
  const [sB,       setSB]       = useState(0);
  const [poss,     setPoss]     = useState(50);
  const [corn,     setCorn]     = useState(8);
  const [status,   setStatus]   = useState("finished"); // "scheduled"|"live"|"ht"|"finished"
  const [saved,    setSaved]    = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [search,   setSearch]   = useState("");

  // Guard: check admin access
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email) || currentUser?.isAdmin;
  if (!isAdmin) {
    return (
      <div style={{ padding:"60px 24px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:16, fontWeight:700, color:"rgba(255,255,255,0.4)" }}>Acces restricționat</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)", marginTop:6 }}>
          Doar administratorii pot accesa acest panou.
        </div>
      </div>
    );
  }

  const selectMatch = (m) => {
    setSel(m);
    setSaved(false);
    setSA(m.realScoreA ?? 0);
    setSB(m.realScoreB ?? 0);
    setPoss(m.realPossession ?? 50);
    setCorn(m.realCorners ?? 8);
    setStatus(m.isFinished ? "finished" : m.isLive ? "live" : "scheduled");
  };

  const saveResult = () => {
    if (!sel) return;
    const update = {
      matchId:    sel.id,
      realScoreA: sA,
      realScoreB: sB,
      realPossession: poss,
      realCorners:    corn,
      liveStatus: status,
    };
    onMatchUpdate?.(update);
    setSaved(true);
    // In production: await supabase.from('matches').update(update).eq('id', sel.id)
  };

  const filtered = MATCHES
    .filter(m => groupFilter === "all" || m.group === groupFilter)
    .filter(m => !search || m.teamA.toLowerCase().includes(search.toLowerCase()) || m.teamB.toLowerCase().includes(search.toLowerCase()));

  const statusColors = {
    scheduled: "#4A9EFF",
    live:       "#EF4444",
    ht:         "#F59E0B",
    finished:   "#00E5A0",
  };

  return (
    <div style={{ padding:"0 14px" }}>

      {/* Header */}
      <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:14, padding:"12px 16px", marginBottom:14, marginTop:12 }}>
        <div style={{ fontSize:13, color:"#EF4444", fontWeight:800, marginBottom:2 }}>⚙️ Panou Admin</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>
          Logat ca: <span style={{ color:"#EF4444" }}>{currentUser?.email}</span>
        </div>
      </div>

      {/* Group filter */}
      <div style={{ display:"flex", gap:4, marginBottom:10, overflowX:"auto" }}>
        <button onClick={() => setGroupFilter("all")} style={{ flexShrink:0, padding:"4px 10px", borderRadius:20, background:groupFilter==="all"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${groupFilter==="all"?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}`, color:groupFilter==="all"?"#EF4444":"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, cursor:"pointer" }}>Toate</button>
        {ALL_GROUPS.map(g => (
          <button key={g} onClick={() => setGroupFilter(g)} style={{ flexShrink:0, padding:"4px 10px", borderRadius:20, background:groupFilter===g?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${groupFilter===g?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}`, color:groupFilter===g?"#EF4444":"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, cursor:"pointer" }}>Gr. {g}</button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:10 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută echipă..."
          style={{ width:"100%", padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
        />
      </div>

      {/* Match list */}
      <div style={{ maxHeight:260, overflowY:"auto", marginBottom:14 }}>
        {filtered.map(m => (
          <div
            key={m.id}
            onClick={() => selectMatch(m)}
            style={{
              padding:"10px 12px", borderRadius:10, marginBottom:5, cursor:"pointer",
              background:sel?.id===m.id?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.025)",
              border:`1px solid ${sel?.id===m.id?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)"}`,
              transition:"all 0.15s",
            }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:"#fff", fontWeight:600, fontSize:12 }}>
                {m.flagA} {m.teamA} – {m.teamB} {m.flagB}
              </span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {m.isFinished && <span style={{ fontSize:11, fontWeight:700, color:"#00E5A0", fontFamily:"'DM Mono',monospace" }}>{m.realScoreA}–{m.realScoreB}</span>}
                {m.isLive    && <span style={{ fontSize:10, color:"#EF4444", fontWeight:700 }}>🔴 Live</span>}
              </div>
            </div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>
              Gr. {m.group} · {formatKickoffRO(m.time)} · {m.venue}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"30px 20px", color:"rgba(255,255,255,0.2)", fontSize:12 }}>
            Niciun meci găsit
          </div>
        )}
      </div>

      {/* Edit panel */}
      {sel && (
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:16, padding:18, border:"1px solid rgba(255,255,255,0.07)", animation:"fadeUp 0.2s ease" }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:16, fontWeight:700 }}>
            {sel.flagA} {sel.teamA} vs {sel.teamB} {sel.flagB}
          </div>

          {/* Status selector */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Status meci</div>
            <div style={{ display:"flex", gap:6 }}>
              {["scheduled","live","ht","finished"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{ flex:1, padding:"7px 4px", borderRadius:8, background:status===s?`${statusColors[s]}18`:"rgba(255,255,255,0.03)", border:`1px solid ${status===s?statusColors[s]+"44":"rgba(255,255,255,0.07)"}`, color:status===s?statusColors[s]:"rgba(255,255,255,0.35)", fontSize:10, fontWeight:700, cursor:"pointer" }}
                >
                  {s === "scheduled" ? "Planif." : s === "ht" ? "Pauză" : s === "finished" ? "Final" : "Live"}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginBottom:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{sel.teamA}</div>
              <ScoreInput value={sA} onChange={setSA}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", fontSize:18, color:"rgba(255,255,255,0.2)", fontWeight:300, paddingTop:24 }}>–</div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{sel.teamB}</div>
              <ScoreInput value={sB} onChange={setSB}/>
            </div>
          </div>

          {/* Possession */}
          <div style={{ marginBottom:16 }}>
            <PossessionInput value={poss} onChange={setPoss} teamA={sel.teamA} teamB={sel.teamB} flagA={sel.flagA} flagB={sel.flagB}/>
          </div>

          {/* Corners */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
            <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
          </div>

          {/* Save */}
          <button
            onClick={saveResult}
            style={{
              width:"100%", padding:14,
              background: saved ? "rgba(0,229,160,0.12)" : "rgba(239,68,68,0.12)",
              border:`1px solid ${saved?"rgba(0,229,160,0.3)":"rgba(239,68,68,0.3)"}`,
              borderRadius:12, color:saved?"#00E5A0":"#EF4444",
              fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
            }}
          >
            {saved ? "✓ Salvat! Clasamentul se actualizează." : "Salvează rezultat real"}
          </button>

          <div style={{ marginTop:8, fontSize:10, color:"rgba(255,255,255,0.15)", textAlign:"center" }}>
            Notă: în producție acest buton scrie în Supabase
          </div>
        </div>
      )}
    </div>
  );
}
