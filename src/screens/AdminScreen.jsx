// ─── src/screens/AdminScreen.jsx ─────────────────────────────────────────────
// Real admin panel. Gated by ADMIN_EMAILS.
// Updates propagate to App state via onMatchUpdate callback.
// In production: replace localStorage writes with Firestore/Supabase calls.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { ScoreInput, StepInput, PossessionInput } from '../components/UI.jsx';
import { MATCHES, ADMIN_EMAILS, ADMIN_EMAILS_RUNTIME, formatKickoffRO, buildGroupStandings } from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';

const STATUS_OPTIONS = [
  { value:'scheduled', label:'Planificat', color:'#4A9EFF' },
  { value:'live',      label:'🔴 Live',    color:'#EF4444' },
  { value:'ht',        label:'⏸ Pauză',   color:'#F59E0B' },
  { value:'ft',        label:'✓ Final',    color:'#00E5A0' },
  { value:'locked',    label:'🔒 Blocat',  color:'#6B7280' },
];

export default function AdminScreen({ currentUser, finishedResults, onMatchUpdate }) {
  const [sel,      setSel]       = useState(null);
  const [sA,       setSA]        = useState(0);
  const [sB,       setSB]        = useState(0);
  const [poss,     setPoss]      = useState(50);
  const [corn,     setCorn]      = useState(8);
  const [minute,   setMinute]    = useState(0);
  const [status,   setStatus]    = useState('ft');
  const [saved,    setSaved]     = useState(false);
  const [groupF,   setGroupF]    = useState('all');
  const [statusF,  setStatusF]   = useState('all');
  const [search,   setSearch]    = useState('');

  // Check admin access
  const adminEmails = [...ADMIN_EMAILS, ...ADMIN_EMAILS_RUNTIME];
  const isAdmin = adminEmails.includes(currentUser?.email) || currentUser?.isAdmin === true;

  if (!isAdmin) {
    return (
      <div style={{ padding:'60px 20px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Acces restricționat</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>
          Email-ul tău nu e în lista adminilor.<br/>
          Adaugă-l în VITE_ADMIN_EMAILS sau în gameData.js.
        </div>
      </div>
    );
  }

  const selectMatch = (m) => {
    const fr = finishedResults?.[m.id];
    setSel(m);
    setSaved(false);
    setSA(fr?.realScoreA ?? m.realScoreA ?? 0);
    setSB(fr?.realScoreB ?? m.realScoreB ?? 0);
    setPoss(fr?.realPossession ?? m.realPossession ?? 50);
    setCorn(fr?.realCorners ?? m.realCorners ?? 8);
    setMinute(fr?.liveMinute ?? 0);
    setStatus(fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled'));
  };

  const saveResult = () => {
    if (!sel) return;
    const isFinished = status === 'ft';
    const update = {
      matchId:        sel.id,
      realScoreA:     isFinished ? sA : null,
      realScoreB:     isFinished ? sB : null,
      realPossession: isFinished ? poss : null,
      realCorners:    isFinished ? corn : null,
      liveScoreA:     sA,
      liveScoreB:     sB,
      liveMinute:     minute,
      liveStatus:     status,
    };
    onMatchUpdate?.(update);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Filter matches
  const filtered = useMemo(() => {
    return MATCHES
      .filter(m => groupF === 'all' || m.group === groupF)
      .filter(m => {
        if (statusF === 'all') return true;
        const fr = finishedResults?.[m.id];
        const s  = fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled');
        return s === statusF;
      })
      .filter(m => !search ||
        m.teamA.toLowerCase().includes(search.toLowerCase()) ||
        m.teamB.toLowerCase().includes(search.toLowerCase()) ||
        m.venue.toLowerCase().includes(search.toLowerCase())
      );
  }, [groupF, statusF, search, finishedResults]);

  const getMatchStatus = (m) => {
    const fr = finishedResults?.[m.id];
    return fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled');
  };
  const getStatusColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color || '#6B7280';

  return (
    <div style={{ padding:'0 12px 20px' }}>
      {/* Header */}
      <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:12, padding:'11px 14px', marginBottom:12, marginTop:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, color:'#EF4444', fontWeight:800 }}>⚙️ Panou Admin</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:1 }}>{currentUser?.email}</div>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', textAlign:'right' }}>
            <div style={{ fontFamily:"'DM Mono',monospace" }}>{MATCHES.filter(m=>finishedResults?.[m.id]).length}/{MATCHES.length}</div>
            <div>meciuri finalizate</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>
        {['all',...ALL_GROUPS].map(g => (
          <button key={g} onClick={()=>setGroupF(g)} style={{ flexShrink:0, padding:'4px 10px', borderRadius:20, background:groupF===g?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${groupF===g?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.07)'}`, color:groupF===g?'#EF4444':'rgba(255,255,255,0.4)', fontSize:10, fontWeight:700, cursor:'pointer' }}>
            {g==='all'?'Toate':`Gr.${g}`}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:8 }}>
        {[{v:'all',l:'Toate'},...STATUS_OPTIONS.map(o=>({v:o.value,l:o.label}))].map(o => (
          <button key={o.v} onClick={()=>setStatusF(o.v)} style={{ flexShrink:0, padding:'3px 9px', borderRadius:20, background:statusF===o.v?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${statusF===o.v?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.06)'}`, color:statusF===o.v?'#fff':'rgba(255,255,255,0.35)', fontSize:10, cursor:'pointer' }}>
            {o.l}
          </button>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Caută echipă / stadion..."
        style={{ width:'100%', padding:'9px 13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#fff', fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:10 }}
      />

      {/* Match list */}
      <div style={{ maxHeight:240, overflowY:'auto', marginBottom:12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px', color:'rgba(255,255,255,0.2)', fontSize:12 }}>Niciun meci</div>
        )}
        {filtered.map(m => {
          const ms = getMatchStatus(m);
          const fr = finishedResults?.[m.id];
          return (
            <div key={m.id} onClick={()=>selectMatch(m)} style={{
              padding:'9px 11px', borderRadius:10, marginBottom:5, cursor:'pointer',
              background:sel?.id===m.id?'rgba(239,68,68,0.07)':'rgba(255,255,255,0.025)',
              border:`1px solid ${sel?.id===m.id?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.05)'}`,
              transition:'all 0.15s',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#fff', fontWeight:600, fontSize:12 }}>
                  {m.flagA} {m.teamA} – {m.teamB} {m.flagB}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  {(fr || m.isFinished) && (
                    <span style={{ fontSize:11, fontWeight:700, color:'#fff', fontFamily:"'DM Mono',monospace" }}>
                      {fr?.realScoreA ?? m.realScoreA ?? '?'} – {fr?.realScoreB ?? m.realScoreB ?? '?'}
                    </span>
                  )}
                  <div style={{ width:6, height:6, borderRadius:'50%', background:getStatusColor(ms), flexShrink:0 }}/>
                </div>
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', marginTop:2 }}>
                Gr.{m.group} · {formatKickoffRO(m.time)} · {m.venue}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit panel */}
      {sel && (
        <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:14, padding:16, border:'1px solid rgba(255,255,255,0.07)', animation:'fadeUp 0.2s ease' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:14, fontWeight:700 }}>
            {sel.flagA} {sel.teamA} vs {sel.teamB} {sel.flagB}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginLeft:8, fontWeight:400 }}>Gr.{sel.group}</span>
          </div>

          {/* Status */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:7, fontWeight:600 }}>Status</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value} onClick={()=>setStatus(s.value)} style={{
                  padding:'5px 10px', borderRadius:8, fontSize:10, fontWeight:700, cursor:'pointer',
                  background: status===s.value ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${status===s.value ? s.color+'44' : 'rgba(255,255,255,0.07)'}`,
                  color: status===s.value ? s.color : 'rgba(255,255,255,0.35)',
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Minute (for live/ht) */}
          {(status === 'live' || status === 'ht') && (
            <div style={{ marginBottom:14, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600 }}>Minutul</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={()=>setMinute(m=>Math.max(0,m-1))} style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                <span style={{ fontSize:20, fontWeight:800, color:'#EF4444', fontFamily:"'DM Mono',monospace", minWidth:36, textAlign:'center' }}>{minute}'</span>
                <button onClick={()=>setMinute(m=>Math.min(120,m+1))} style={{ width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
              </div>
            </div>
          )}

          {/* Score */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:14 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:7 }}>{sel.teamA}</div>
              <ScoreInput value={sA} onChange={setSA}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', fontSize:18, color:'rgba(255,255,255,0.2)', fontWeight:300, paddingTop:22 }}>–</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:7 }}>{sel.teamB}</div>
              <ScoreInput value={sB} onChange={setSB}/>
            </div>
          </div>

          {/* Possession + Corners (only for finished) */}
          {status === 'ft' && (
            <>
              <div style={{ marginBottom:12 }}>
                <PossessionInput value={poss} onChange={setPoss} teamA={sel.teamA} teamB={sel.teamB} flagA={sel.flagA} flagB={sel.flagB}/>
              </div>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
              </div>
            </>
          )}

          {/* Save */}
          <button onClick={saveResult} style={{
            width:'100%', padding:13,
            background: saved ? 'rgba(0,229,160,0.1)' : 'rgba(239,68,68,0.1)',
            border:`1px solid ${saved?'rgba(0,229,160,0.3)':'rgba(239,68,68,0.25)'}`,
            borderRadius:11, color:saved?'#00E5A0':'#EF4444',
            fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s',
          }}>
            {saved ? '✓ Salvat! Clasamentul se actualizează.' : 'Salvează rezultat'}
          </button>

          {status === 'ft' && (
            <div style={{ marginTop:8, fontSize:10, color:'rgba(255,255,255,0.15)', textAlign:'center' }}>
              Scor final → calculează puncte + clasament grup automat
            </div>
          )}
        </div>
      )}

      {/* Group standings preview */}
      {sel && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>
            Clasament curent Gr.{sel.group}
          </div>
          <GroupStandingsMini group={sel.group} finishedResults={finishedResults}/>
        </div>
      )}
    </div>
  );
}

function GroupStandingsMini({ group, finishedResults }) {
  const rows = buildGroupStandings(group, finishedResults || {});
  if (!rows.length) return null;
  return (
    <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 24px 24px 24px 24px 32px', gap:0, padding:'5px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {['Echipă','P','W','D','L','Pts'].map((h,i) => (
          <div key={i} style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:700, textAlign:i===0?'left':'center', letterSpacing:'0.06em' }}>{h}</div>
        ))}
      </div>
      {rows.map((r,i) => (
        <div key={r.team} style={{ display:'grid', gridTemplateColumns:'1fr 24px 24px 24px 24px 32px', gap:0, padding:'6px 10px', borderBottom:i<rows.length-1?'1px solid rgba(255,255,255,0.04)':'none', background:i<2?'rgba(0,229,160,0.03)':'transparent' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, width:10 }}>{i+1}</span>
            <span style={{ fontSize:11 }}>{r.flag}</span>
            <span style={{ fontSize:11, color:'#fff', fontWeight:600 }}>{r.team}</span>
          </div>
          {[r.p,r.w,r.d,r.l].map((v,j) => (
            <div key={j} style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{v}</div>
          ))}
          <div style={{ fontSize:12, fontWeight:800, color:i<2?'#00E5A0':'rgba(255,255,255,0.6)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{r.pts}</div>
        </div>
      ))}
    </div>
  );
}
