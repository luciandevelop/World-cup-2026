// ─── src/screens/AdminScreen.jsx ─────────────────────────────────────────────
// Real admin panel — gated by ADMIN_EMAILS.
// Results persist in localStorage so the test flow works across page reloads.
// PRODUCTION: replace localStorage.setItem calls with Firestore/Supabase writes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { ScoreInput, StepInput, PossessionInput } from '../components/UI.jsx';
import {
  MATCHES, ADMIN_EMAILS, ADMIN_EMAILS_RUNTIME,
  formatKickoffRO, buildGroupStandings,
} from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';
import { saveMatchResult, REALTIME_MODE } from '../services/firestoreService.js';

// localStorage key for admin-set results (shared across all users on same device)
const RESULTS_KEY = 'wc2026_admin_results';

export function loadAdminResults() {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY)) || {}; } catch { return {}; }
}
function saveAdminResults(results) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

const STATUS_OPTIONS = [
  { value:'scheduled', label:'Planificat', color:'#4A9EFF' },
  { value:'live',      label:'🔴 Live',    color:'#EF4444' },
  { value:'ht',        label:'⏸ Pauză',   color:'#F59E0B' },
  { value:'ft',        label:'✓ Final',    color:'#00E5A0' },
  { value:'locked',    label:'🔒 Blocat',  color:'#6B7280' },
];

export default function AdminScreen({ currentUser, finishedResults, onMatchUpdate }) {
  const [sel,     setSel]    = useState(null);
  const [sA,      setSA]     = useState(0);
  const [sB,      setSB]     = useState(0);
  const [poss,    setPoss]   = useState(50);
  const [corn,    setCorn]   = useState(8);
  const [minute,  setMinute] = useState(0);
  const [status,  setStatus] = useState('ft');
  const [saved,   setSaved]  = useState(false);
  const [groupF,  setGroupF] = useState('all');
  const [statusF, setStatusF]= useState('all');
  const [search,  setSearch] = useState('');
  const [history, setHistory]= useState([]); // last 5 saves

  const adminEmails = [...ADMIN_EMAILS, ...ADMIN_EMAILS_RUNTIME];
  const isAdmin = adminEmails.includes(currentUser?.email) || currentUser?.isAdmin === true;

  if (!isAdmin) {
    return (
      <div style={{ padding:'60px 20px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Acces restricționat</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', lineHeight:1.6 }}>
          Email-ul tău nu e în lista adminilor.<br/>
          <span style={{ color:'rgba(255,255,255,0.12)' }}>Adaugă-l în VITE_ADMIN_EMAILS sau în gameData.js</span>
        </div>
      </div>
    );
  }

  const selectMatch = (m) => {
    const fr = finishedResults?.[m.id];
    setSel(m); setSaved(false);
    setSA(fr?.realScoreA ?? m.realScoreA ?? 0);
    setSB(fr?.realScoreB ?? m.realScoreB ?? 0);
    setPoss(fr?.realPossession ?? m.realPossession ?? 50);
    setCorn(fr?.realCorners ?? m.realCorners ?? 8);
    setMinute(fr?.liveMinute ?? 0);
    setStatus(fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled'));
  };

  const saveResult = async () => {
    if (!sel) return;
    const isFinished = status === 'ft';
    const update = {
      matchId:        sel.id,
      realScoreA:     isFinished ? sA    : null,
      realScoreB:     isFinished ? sB    : null,
      realPossession: isFinished ? poss  : null,
      realCorners:    isFinished ? corn  : null,
      liveScoreA:     sA,
      liveScoreB:     sB,
      liveMinute:     minute,
      liveStatus:     status,
    };

    // Save to Firestore (or localStorage fallback) — shared across all users
    await saveMatchResult(currentUser?.uid, update);

    // Also update local admin cache so we can reload it immediately
    const current = loadAdminResults();
    current[sel.id] = update;
    saveAdminResults(current);

    // Propagate to App state (triggers leaderboard/standings/bracket recalc)
    onMatchUpdate?.(update);

    // Log to history
    const label = `${sel.flagA}${sel.teamA} ${sA}–${sB} ${sel.teamB}${sel.flagB}`;
    setHistory(h => [{ label, status, id:sel.id, ts:Date.now() }, ...h].slice(0,5));

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Derived match status
  const getStatus = (m) => {
    const fr = finishedResults?.[m.id];
    return fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled');
  };
  const getColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color || '#6B7280';

  const filtered = useMemo(() => MATCHES
    .filter(m => groupF === 'all' || m.group === groupF)
    .filter(m => {
      if (statusF === 'all') return true;
      return getStatus(m) === statusF;
    })
    .filter(m => !search ||
      m.teamA.toLowerCase().includes(search.toLowerCase()) ||
      m.teamB.toLowerCase().includes(search.toLowerCase()) ||
      m.venue.toLowerCase().includes(search.toLowerCase())
    ),
  [groupF, statusF, search, finishedResults]);

  const statsRow = ['scheduled','live','ht','ft'].map(s => ({
    label: s, color: getColor(s),
    count: MATCHES.filter(m => getStatus(m) === s).length,
  }));

  return (
    <div style={{ padding:'0 12px 24px' }}>

      {/* Mode banner */}
      <div style={{ margin:'10px 0 10px', padding:'8px 12px', background:REALTIME_MODE?'rgba(0,229,160,0.06)':'rgba(245,158,11,0.07)', border:`1px solid ${REALTIME_MODE?'rgba(0,229,160,0.18)':'rgba(245,158,11,0.18)'}`, borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:14 }}>{REALTIME_MODE ? '🔥' : '🧪'}</span>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:REALTIME_MODE?'rgba(0,229,160,0.9)':'rgba(245,158,11,0.8)' }}>
            {REALTIME_MODE ? 'Firestore activ — sync în timp real' : 'Demo Mode — rezultatele se salvează local'}
          </div>
          <div style={{ fontSize:10, color:REALTIME_MODE?'rgba(0,229,160,0.45)':'rgba(245,158,11,0.45)' }}>
            {REALTIME_MODE ? 'Toți utilizatorii văd rezultatele instant' : 'Configurează VITE_FIREBASE_* pentru multiplayer real'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5, marginBottom:10 }}>
        {statsRow.map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'7px 6px', textAlign:'center' }}>
            <div style={{ fontSize:16, fontWeight:800, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.count}</div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.22)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Group filter */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:6 }}>
        {['all', ...ALL_GROUPS].map(g => (
          <button key={g} onClick={() => setGroupF(g)} style={{ flexShrink:0, padding:'4px 9px', borderRadius:20, background:groupF===g?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.03)', border:`1px solid ${groupF===g?'rgba(239,68,68,0.28)':'rgba(255,255,255,0.07)'}`, color:groupF===g?'#EF4444':'rgba(255,255,255,0.38)', fontSize:10, fontWeight:700, cursor:'pointer' }}>
            {g === 'all' ? 'Toate' : `Gr.${g}`}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:8 }}>
        {[{v:'all',l:'Toate'}, ...STATUS_OPTIONS.map(o=>({v:o.value,l:o.label}))].map(o => (
          <button key={o.v} onClick={() => setStatusF(o.v)} style={{ flexShrink:0, padding:'3px 9px', borderRadius:20, background:statusF===o.v?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${statusF===o.v?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.06)'}`, color:statusF===o.v?'#fff':'rgba(255,255,255,0.35)', fontSize:10, cursor:'pointer' }}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Caută echipă, stadion..."
        style={{ width:'100%', padding:'9px 13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#fff', fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:8 }}
      />

      {/* Match list */}
      <div style={{ maxHeight:230, overflowY:'auto', marginBottom:10 }}>
        {filtered.length === 0 && <div style={{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,0.2)', fontSize:12 }}>Niciun meci</div>}
        {filtered.map(m => {
          const ms = getStatus(m);
          const fr = finishedResults?.[m.id];
          return (
            <div key={m.id} onClick={() => selectMatch(m)} style={{
              padding:'9px 11px', borderRadius:10, marginBottom:4, cursor:'pointer',
              background:sel?.id===m.id?'rgba(239,68,68,0.07)':'rgba(255,255,255,0.025)',
              border:`1px solid ${sel?.id===m.id?'rgba(239,68,68,0.22)':'rgba(255,255,255,0.05)'}`,
              transition:'all 0.12s',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fff', fontWeight:600, fontSize:12 }}>{m.flagA} {m.teamA} – {m.teamB} {m.flagB}</span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {(fr || m.isFinished) && <span style={{ fontSize:11, fontWeight:700, color:'#fff', fontFamily:"'DM Mono',monospace" }}>{fr?.realScoreA??m.realScoreA??'?'}–{fr?.realScoreB??m.realScoreB??'?'}</span>}
                  <div style={{ width:6, height:6, borderRadius:'50%', background:getColor(ms) }}/>
                </div>
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:2 }}>Gr.{m.group} · {formatKickoffRO(m.time)} · {m.venue}</div>
            </div>
          );
        })}
      </div>

      {/* Edit panel */}
      {sel && (
        <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:13, padding:'14px 14px', border:'1px solid rgba(255,255,255,0.07)', animation:'fadeUp 0.18s ease' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:12, fontWeight:700 }}>
            {sel.flagA} {sel.teamA} vs {sel.teamB} {sel.flagB}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginLeft:6, fontWeight:400 }}>Gr.{sel.group}</span>
          </div>

          {/* Status */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6, fontWeight:600 }}>Status</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setStatus(s.value)} style={{
                  padding:'5px 10px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer',
                  background:status===s.value?`${s.color}18`:'rgba(255,255,255,0.03)',
                  border:`1px solid ${status===s.value?s.color+'44':'rgba(255,255,255,0.07)'}`,
                  color:status===s.value?s.color:'rgba(255,255,255,0.35)',
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Live minute */}
          {(status === 'live' || status === 'ht') && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Minutul</div>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <button onClick={() => setMinute(m => Math.max(0,m-1))} style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                <span style={{ fontSize:20, fontWeight:800, color:'#EF4444', fontFamily:"'DM Mono',monospace", minWidth:38, textAlign:'center' }}>{minute}'</span>
                <button onClick={() => setMinute(m => Math.min(120,m+1))} style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
              </div>
            </div>
          )}

          {/* Score */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:12 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginBottom:6 }}>{sel.teamA}</div>
              <ScoreInput value={sA} onChange={setSA}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', fontSize:18, color:'rgba(255,255,255,0.18)', fontWeight:300, paddingTop:22 }}>–</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginBottom:6 }}>{sel.teamB}</div>
              <ScoreInput value={sB} onChange={setSB}/>
            </div>
          </div>

          {/* Possession + Corners (FT only) */}
          {status === 'ft' && (
            <>
              <div style={{ marginBottom:10 }}>
                <PossessionInput value={poss} onChange={setPoss} teamA={sel.teamA} teamB={sel.teamB} flagA={sel.flagA} flagB={sel.flagB}/>
              </div>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
                <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
              </div>
            </>
          )}

          {/* Save */}
          <button onClick={saveResult} style={{
            width:'100%', padding:13,
            background: saved ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
            border:`1px solid ${saved?'rgba(0,229,160,0.28)':'rgba(239,68,68,0.22)'}`,
            borderRadius:11, color:saved?'#00E5A0':'#EF4444',
            fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.18s',
          }}>
            {saved ? '✓ Salvat! Clasamentul + grupele s-au actualizat.' : 'Salvează rezultat'}
          </button>

          {/* Group standings preview */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:7 }}>Clasament curent Gr.{sel.group}</div>
            <StandingsMini group={sel.group} finishedResults={finishedResults}/>
          </div>
        </div>
      )}

      {/* Save history */}
      {history.length > 0 && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:7 }}>Ultimele salvate</div>
          {history.map((h,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,255,255,0.02)', borderRadius:8, marginBottom:4 }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{h.label}</span>
              <span style={{ fontSize:10, color:getColor(h.status), fontWeight:700 }}>{h.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StandingsMini({ group, finishedResults }) {
  const rows = buildGroupStandings(group, finishedResults || {});
  if (!rows.length) return null;
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:9, overflow:'hidden', border:'1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 20px 20px 20px 28px', padding:'4px 9px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {['Echipă','J','V','Î','Pct'].map((h,i) => <div key={i} style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, textAlign:i===0?'left':'center' }}>{h}</div>)}
      </div>
      {rows.map((r,i) => (
        <div key={r.team} style={{ display:'grid', gridTemplateColumns:'1fr 20px 20px 20px 28px', padding:'6px 9px', borderBottom:i<rows.length-1?'1px solid rgba(255,255,255,0.04)':'none', background:i<2?'rgba(0,229,160,0.03)':'transparent' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:9, color:i<2?'rgba(0,229,160,0.5)':'rgba(255,255,255,0.2)', width:8 }}>{i+1}</span>
            <span style={{ fontSize:11 }}>{r.flag}</span>
            <span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>{r.team}</span>
          </div>
          {[r.p, r.w, r.l].map((v,j) => <div key={j} style={{ fontSize:11, color:'rgba(255,255,255,0.38)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{v}</div>)}
          <div style={{ fontSize:12, fontWeight:800, color:i<2?'#00E5A0':'rgba(255,255,255,0.55)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{r.pts}</div>
        </div>
      ))}
    </div>
  );
}
