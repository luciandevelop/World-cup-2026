import {
  isSpecialLocked, specialLockCountdown, WC_TEAMS,
  loadSpecialPrediction, saveSpecialPrediction, loadSpecialResults, calcSpecialPoints
} from '../services/specialEventsService.js';


// ─── EVENIMENTE SPECIALE ──────────────────────────────────────────────────────
function SpecialEventsPanel({ user, specialResultsExt = null, allSpecialPredsExt = {} }) {
  const [pred, setPred]       = React.useState(null);
  const [results, setResults] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving]   = React.useState(false);
  const [msg, setMsg]         = React.useState('');
  const [draft, setDraft]     = React.useState({ winner: '', semifinalists: [], topScorerCountry: '' });
  const locked = isSpecialLocked();
  const countdown = specialLockCountdown();

  React.useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    // Use external props if provided (from App.jsx state), else fetch
    const fetchPred = allSpecialPredsExt[user.uid]
      ? Promise.resolve(allSpecialPredsExt[user.uid])
      : loadSpecialPrediction(user.uid);
    const fetchRes = specialResultsExt !== null
      ? Promise.resolve(specialResultsExt)
      : loadSpecialResults();
    Promise.all([fetchPred, fetchRes]).then(([p, r]) => {
      if (p) { setPred(p); setDraft({ winner: p.winner||'', semifinalists: p.semifinalists||[], topScorerCountry: p.topScorerCountry||'' }); }
      if (r) setResults(r);
      setLoading(false);
    });
  }, [user?.uid, specialResultsExt, allSpecialPredsExt]);

  const toggleSemi = (name) => {
    if (locked) return;
    setDraft(d => {
      const arr = d.semifinalists || [];
      if (arr.includes(name)) return { ...d, semifinalists: arr.filter(x => x !== name) };
      if (arr.length >= 4) return d;
      return { ...d, semifinalists: [...arr, name] };
    });
  };

  const handleSave = async () => {
    if (locked) return;
    if (!draft.winner) { setMsg('Alege câștigătoarea!'); return; }
    if (draft.semifinalists.length !== 4) { setMsg('Alege exact 4 semifinaliste!'); return; }
    if (!draft.topScorerCountry) { setMsg('Alege țara golgheterului!'); return; }
    setSaving(true); setMsg('');
    const res = await saveSpecialPrediction(user.uid, draft);
    setSaving(false);
    if (res.success) { setPred(draft); setMsg('✅ Salvat!'); }
    else setMsg('Eroare: ' + res.error);
  };

  const myPts = results ? calcSpecialPoints(pred, results) : null;

  if (loading) return <div style={{ padding:16, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12 }}>Se încarcă...</div>;

  return (
    <div style={{ marginBottom:16, background:'rgba(255,215,0,0.04)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:14, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#FFD700', letterSpacing:'0.03em' }}>⭐ Evenimente Speciale</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Până la 13 iun, 23:00 RO</div>
        </div>
        <div style={{ textAlign:'right' }}>
          {locked
            ? <span style={{ fontSize:10, color:'rgba(255,68,68,0.8)', fontWeight:700 }}>🔒 BLOCAT</span>
            : <span style={{ fontSize:10, color:'rgba(245,158,11,0.8)', fontWeight:700 }}>🔓 {countdown} rămas</span>
          }
          {myPts !== null && <div style={{ fontSize:12, fontWeight:800, color:'#FFD700', marginTop:2 }}>{myPts} pts</div>}
        </div>
      </div>

      <div style={{ padding:'10px 14px 14px' }}>
        {/* A: Winner */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            🏆 Câștigătoarea Cupei Mondiale <span style={{ color:'#FFD700' }}>500 pts</span>
          </div>
          {locked && pred?.winner
            ? <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{WC_TEAMS.find(t=>t.name===pred.winner)?.flag} {pred.winner}</div>
            : !locked && (
              <select
                value={draft.winner}
                onChange={e => setDraft(d => ({ ...d, winner: e.target.value }))}
                style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:13, outline:'none' }}
              >
                <option value="">— Alege echipa —</option>
                {WC_TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            )
          }
          {results?.winner && <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ Răspuns: {results.winner} {pred?.winner === results.winner ? '· +500pts' : ''}</div>}
        </div>

        {/* B: Semifinalists */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            🥈 Semifinaliste (alege 4) <span style={{ color:'#FFD700' }}>200 pts / echipă</span>
          </div>
          {locked && pred?.semifinalists?.length
            ? <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {pred.semifinalists.map(t => <span key={t} style={{ padding:'3px 8px', background:'rgba(255,255,255,0.08)', borderRadius:6, fontSize:12, color:'rgba(255,255,255,0.8)' }}>{WC_TEAMS.find(x=>x.name===t)?.flag} {t}</span>)}
              </div>
            : !locked && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {WC_TEAMS.map(t => {
                  const sel = draft.semifinalists.includes(t.name);
                  const full = draft.semifinalists.length >= 4 && !sel;
                  return (
                    <button key={t.name} onClick={() => toggleSemi(t.name)} disabled={full}
                      style={{ padding:'3px 8px', background: sel ? 'rgba(0,229,160,0.2)' : 'rgba(255,255,255,0.05)', border:`1px solid ${sel ? 'rgba(0,229,160,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius:6, fontSize:11, color: full ? 'rgba(255,255,255,0.2)' : '#fff', cursor: full ? 'default' : 'pointer' }}>
                      {t.flag} {t.name}
                    </button>
                  );
                })}
              </div>
            )
          }
          {results?.semifinalists && (
            <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ Răspuns: {results.semifinalists.join(', ')}</div>
          )}
        </div>

        {/* C: Top scorer country */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            ⚽ Țara golgheterului <span style={{ color:'#FFD700' }}>300 pts</span>
          </div>
          {locked && pred?.topScorerCountry
            ? <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{WC_TEAMS.find(t=>t.name===pred.topScorerCountry)?.flag} {pred.topScorerCountry}</div>
            : !locked && (
              <select
                value={draft.topScorerCountry}
                onChange={e => setDraft(d => ({ ...d, topScorerCountry: e.target.value }))}
                style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:13, outline:'none' }}
              >
                <option value="">— Alege țara —</option>
                {WC_TEAMS.map(t => <option key={t.name} value={t.name}>{t.flag} {t.name}</option>)}
              </select>
            )
          }
          {results?.topScorerCountry && <div style={{ fontSize:11, color:'rgba(0,229,160,0.8)', marginTop:4 }}>✓ Răspuns: {results.topScorerCountry} {pred?.topScorerCountry === results.topScorerCountry ? '· +300pts' : ''}</div>}
        </div>

        {/* Save button */}
        {!locked && (
          <div>
            {msg && <div style={{ fontSize:11, color: msg.startsWith('✅') ? 'rgba(0,229,160,0.8)' : '#EF4444', marginBottom:6 }}>{msg}</div>}
            <button onClick={handleSave} disabled={saving}
              style={{ width:'100%', padding:'10px', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.3)', borderRadius:10, color:'#FFD700', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              {saving ? 'Se salvează...' : '💾 Salvează predicțiile speciale'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FRIEND PREDICTIONS PANEL ────────────────────────────────────────────────
// Shows after match locks. Before lock, predictions are hidden.
function FriendPredictionsPanel({ matches, allPredictions, allUsers, myPredictions }) {
  if (!matches.length) return null;

  const userList = Object.entries(allUsers).map(([uid, u]) => ({
    uid, nickname: u.nickname, avatarId: u.avatarId,
  })).filter(u => u.nickname);

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
      {matches.slice(0,10).map(match => {
        const lockInfo = matchLockState(match);
        const isVisible = lockInfo.state !== "open";
        if (!isVisible) return null;

        return (
          <div key={match.id} style={{ marginBottom:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"8px 12px 6px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>
                {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
              </span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{formatKickoffRO(match.time)}</span>
            </div>
            <div style={{ padding:"6px 8px 4px" }}>
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
                      <div style={{ fontSize:14, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
                        {pred.scoreA} – {pred.scoreB}
                      </div>
                      {(pred.possession != null || pred.corners != null) && (
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace", marginTop:1 }}>
                          {pred.possession != null ? `pos ${pred.possession}-${100-pred.possession}` : ""}
                          {pred.possession != null && pred.corners != null ? " · " : ""}
                          {pred.corners != null ? `col ${pred.corners}` : ""}
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
          </div>
        );
      }).filter(Boolean)}
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

import { useState, useMemo } from 'react';
import {
  MATCHES, GROUPS, TEST_MATCHES,
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
function LiveFeed({ events = [] }) {
  const feed = events.length ? events : LIVE_FEED_EVENTS;
  if (!feed || feed.length === 0) return null;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600, marginBottom:10, paddingLeft:2 }}>
        Activitate recentă
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {feed.slice(0,5).map((e, i) => (
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
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Posesie: {prediction.possession}%</span>
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

export default function MatchesScreen({ predictions, onPredict, finishedResults, groupOverrides, allPredictions = {}, allUsers = {}, activityFeed = [], user = null, specialResults = null, allSpecialPreds = {} }) {
  const [tab, setTab]              = useState("toate"); // "toate" | "mele" | "prieteni"
  const [detailMatch, setDetailMatch] = useState(null);

  // Load admin-saved official lineups from localStorage
  // This is re-evaluated on each render (lightweight localStorage read)
  const adminLineups = (() => {
    try { return JSON.parse(localStorage.getItem('wc2026_lineups') || '{}'); } catch { return {}; }
  })();
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

  // Build per-group match lists — uses finishedResults so isFinished/isLive/isLocked are live
  const liveGroupedMatches = useMemo(() => {
    const live = buildMatches(finishedResults, { includeTests: true });
    return [...ALL_GROUPS, 'AMICALE'].reduce((acc, g) => {
      acc[g] = live.filter(m => m.group === g);
      return acc;
    }, {});
  }, [finishedResults]);

  // Alias used by all rendering logic below
  const groupedMatches = liveGroupedMatches;

  // All live matches (flat array, for friendMatches/myPred filtering)
  const allLiveMatches = useMemo(() => buildMatches(finishedResults, { includeTests: true }), [finishedResults]);

  // BUG-2 fix: friendMatches includes locked matches (spec: visible after 30-min lock)
  const myPredMatches = allLiveMatches.filter(m => predictions[m.id]);
  const friendMatches = allLiveMatches.filter(m => m.isFinished || m.isLive || m.isLocked);

  const tabs = [
    { id:"toate",    label:"Toate",       count: MATCHES.length },
    { id:"mele",     label:"Ale mele",    count: myPredMatches.length },
    { id:"prieteni", label:"Prieteni",    count: friendMatches.length },
    { id:"test",     label:"🧪 Test",     count: TEST_MATCHES.length },
  ];

  // Test matches enriched with live result data (same as buildMatches but for test IDs)
  const testMatchesLive = useMemo(() =>
    buildMatches(finishedResults, { includeTests: true })
      .filter(m => m.isTest),
    [finishedResults]
  );

  const renderGroupSection = (g) => {
    const matches = tab === "mele"
      ? groupedMatches[g].filter(m => predictions[m.id])
      : tab === "prieteni"
      ? groupedMatches[g].filter(m => m.isFinished || m.isLive || m.isLocked)
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
            {tab === "toate" && <GroupStandings group={g} finishedResults={finishedResults} overrideOrder={groupOverrides?.[g] || null}/>}
            {matches.map(m => (
              <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>
            ))}
          </div>
        )}
      </div>
    );
  };

  const visibleGroups = groupFilter === "toate" ? [...ALL_GROUPS, "AMICALE"] : [groupFilter];

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

        {/* Evenimente Speciale — shown in tab "toate" only, before groups */}
        {tab === "toate" && groupFilter === "toate" && <SpecialEventsPanel user={user} specialResultsExt={specialResults} allSpecialPredsExt={allSpecialPreds}/>}

        {/* Live feed */}
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

        {/* Group sections — chronological when no group selected */}
        {(tab === "toate" || tab === "mele") && groupFilter === "toate" && (() => {
          // Flat list sorted by kickoff time
          const allM = visibleGroups.flatMap(g => groupedMatches[g] || []);
          const sorted = [...allM].sort((a, b) => new Date(a.time) - new Date(b.time));
          const filtered = tab === "mele" ? sorted.filter(m => predictions[m.id]) : sorted;
          if (filtered.length === 0) return null;
          return filtered.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={onPredict} onDetail={setDetailMatch}/>);
        })()}
        {(tab === "toate" || tab === "mele") && groupFilter !== "toate" && visibleGroups.map(g => renderGroupSection(g))}

        {/* Friends tab — shows predictions of all users for locked/finished matches */}
        {tab === "prieteni" && visibleGroups.map(g => renderGroupSection(g))}
        {tab === "prieteni" && friendMatches.length > 0 && (
          <FriendPredictionsPanel
            matches={friendMatches}
            allPredictions={allPredictions}
            allUsers={allUsers}
            myPredictions={predictions}
          />
        )}

        {/* Test matches tab */}
        {tab === "test" && (
          <TestMatchesPanel
            testMatches={testMatchesLive}
            predictions={predictions}
            onPredict={onPredict}
            finishedResults={finishedResults}
            allPredictions={allPredictions}
            allUsers={allUsers}
          />
        )}

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
