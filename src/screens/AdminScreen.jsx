// ─── src/screens/AdminScreen.jsx ─────────────────────────────────────────────
// Real admin panel — gated by ADMIN_EMAILS.
// Results persist in localStorage so the test flow works across page reloads.
// PRODUCTION: replace localStorage.setItem calls with Firestore/Supabase writes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { ScoreInput } from '../components/UI.jsx';
import {
  MATCHES, ADMIN_EMAILS, ADMIN_EMAILS_RUNTIME,
  formatKickoffRO, buildGroupStandings, buildQualifiedTeams, buildMatches,
} from '../data/gameData.js';
import { ALL_GROUPS } from '../data/matches.js';
import { saveMatchResult, REALTIME_MODE } from '../services/firestoreService.js';

// localStorage key for admin-set results (shared across all users on same device)
const RESULTS_KEY   = 'wc2026_admin_results';
const OVERRIDES_KEY = 'wc2026_group_overrides';

export function loadAdminResults() {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY)) || {}; } catch { return {}; }
}
function saveAdminResults(results) {
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}
export function loadGroupOverrides() {
  try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {}; } catch { return {}; }
}
function saveGroupOverrides(overrides) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

const STATUS_OPTIONS = [
  { value:'scheduled', label:'Planificat', color:'#4A9EFF' },
  { value:'live',      label:'🔴 Live',    color:'#EF4444' },
  { value:'ht',        label:'⏸ Pauză',   color:'#F59E0B' },
  { value:'ft',        label:'✓ Final',    color:'#00E5A0' },
  { value:'locked',    label:'🔒 Blocat',  color:'#6B7280' },
];


// ─── ADMIN HELP SECTION ──────────────────────────────────────────────────────
function AdminHelp({ open, onToggle }) {
  if (!open) return (
    <button onClick={onToggle} style={{ width:"100%", padding:"8px 12px", background:"rgba(74,158,255,0.06)", border:"1px solid rgba(74,158,255,0.15)", borderRadius:10, color:"rgba(74,158,255,0.7)", fontSize:11, fontWeight:700, cursor:"pointer", textAlign:"left", marginBottom:10 }}>
      ? Ghid testare admin
    </button>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
  const Step = ({ n, text }) => (
    <div style={{ display:"flex", gap:8, marginBottom:4 }}>
      <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(255,255,255,0.08)", fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{n}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>{text}</div>
    </div>
  );

  return (
    <div style={{ background:"rgba(74,158,255,0.04)", border:"1px solid rgba(74,158,255,0.15)", borderRadius:12, padding:"12px 14px", marginBottom:12, animation:"fadeUp 0.18s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"rgba(74,158,255,0.8)" }}>Ghid testare admin</div>
        <button onClick={onToggle} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:16, cursor:"pointer", padding:2 }}>x</button>
      </div>

      <Section title="A) Acces admin">
        <Step n="1" text="Adauga email-ul tau in src/data/gameData.js la ADMIN_EMAILS, sau seteaza VITE_ADMIN_EMAILS in Vercel." />
        <Step n="2" text="Logheaza-te cu acel email. Apasa avatarul (dreapta sus) -> Panou Admin." />
        <Step n="3" text="Butonul admin apare DOAR daca emailul este in lista." />
      </Section>

      <Section title="B) Testare clasamente">
        <Step n="1" text="Selecteaza un meci din lista. Ex: Gr.A -> Mexic vs Africa de Sud." />
        <Step n="2" text="Seteaza scorul (ex: 2-0) si Status: Final (FT)." />
        <Step n="3" text="Apasa Salveaza rezultat. Clasamentul Gr.A se actualizeaza imediat." />
        <Step n="4" text="Repeta pentru mai multe meciuri din acelasi grup." />
        <Step n="5" text="Apasa Recalculeaza clasamente pentru a vedea calificatii." />
        <Step n="6" text="Sectiunea Tabloul Calificarilor arata castigatorii, locurile 2 si cele mai bune locuri 3." />
      </Section>

      <Section title="C) Testare echipe oficiale">
        <Step n="1" text="Selecteaza un meci -> Adauga / actualizeaza echipe." />
        <Step n="2" text="Completeaza formatia si XI titular (un jucator pe rand: 1. Portar)." />
        <Step n="3" text="Bifeaza Echipa OFICIALA (FIFA Match Centre)." />
        <Step n="4" text="Salveaza. Deschide meciul din tab Meciuri -> tab Echipe." />
        <Step n="5" text="Echipa oficiala inlocuieste prognoza cu 45 min inainte de start." />
        <Step n="6" text="Inainte de 45 min se afiseaza echipa Bulinews (prognozata)." />
      </Section>

      <Section title="D) Reset date test">
        <Step n="1" text="Apasa Reset rezultate test pentru a sterge toate scorurile salvate." />
        <Step n="2" text="Pentru linii oficiale: DevTools -> localStorage.removeItem('wc2026_lineups')" />
        <Step n="3" text="Reset complet: DevTools -> Object.keys(localStorage).filter(k=>k.startsWith('wc2026_')).forEach(k=>localStorage.removeItem(k)); location.reload()" />
      </Section>
    </div>
  );
}

export default function AdminScreen({ currentUser, finishedResults, onMatchUpdate }) {
  const [sel,     setSel]    = useState(null);
  const [sA,      setSA]     = useState(0);
  const [sB,      setSB]     = useState(0);
  const [possA,   setPossA]  = useState('');
  const [possB,   setPossB]  = useState('');
  const [cornA,   setCornA]  = useState('');
  const [cornB,   setCornB]  = useState('');
  const [minute,  setMinute] = useState(0);
  const [status,  setStatus] = useState('ft');
  const [saved,   setSaved]  = useState(false);
  const [groupF,  setGroupF] = useState('all');
  const [statusF, setStatusF]= useState('all');
  const [search,  setSearch] = useState('');
  const [history, setHistory]= useState([]); // last 5 saves
  const [showLineupPanel, setShowLineupPanel] = useState(false);
  const [showHelp,         setShowHelp]          = useState(false);
  const [showOverridePanel,setShowOverridePanel] = useState(false);
  const [groupOverrides,   setGroupOverrides]    = useState(() => loadGroupOverrides());
  const [lineupFormation, setLineupFormation] = useState('4-3-3');
  const [lineupHome, setLineupHome] = useState('');
  const [lineupAway, setLineupAway] = useState('');
  const [lineupOfficial, setLineupOfficial] = useState(false);
  const [lineupSaved, setLineupSaved] = useState(false);

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
    setSA(fr?.homeScore ?? fr?.realScoreA ?? 0);
    setSB(fr?.awayScore ?? fr?.realScoreB ?? 0);
    setPossA(fr?.homePossession != null ? String(fr.homePossession) : '');
    setPossB(fr?.awayPossession != null ? String(fr.awayPossession) : '');
    setCornA(fr?.homeCorners    != null ? String(fr.homeCorners)    : '');
    setCornB(fr?.awayCorners    != null ? String(fr.awayCorners)    : '');
    setMinute(fr?.liveMinute ?? 0);
    setStatus(fr?.liveStatus ?? (m.isFinished ? 'ft' : m.isLive ? 'live' : 'scheduled'));
  };

  const saveResult = async () => {
    if (!sel) return;
    const isFT = status === 'ft';

    // Parse optional stats — store null if empty
    const hPoss = possA !== '' ? Number(possA) : null;
    const aPoss = possB !== '' ? Number(possB) : null;
    const hCorn = cornA !== '' ? Math.max(0, parseInt(cornA, 10)) : null;
    const aCorn = cornB !== '' ? Math.max(0, parseInt(cornB, 10)) : null;

    // Canonical result object — matchId is the unique key
    const update = {
      matchId:         sel.id,
      group:           sel.group,
      homeTeam:        sel.teamA,
      awayTeam:        sel.teamB,
      homeScore:       isFT ? Number(sA) : null,
      awayScore:       isFT ? Number(sB) : null,
      // legacy fields — kept for buildMatches compat
      realScoreA:      isFT ? Number(sA) : null,
      realScoreB:      isFT ? Number(sB) : null,
      liveScoreA:      Number(sA),
      liveScoreB:      Number(sB),
      liveMinute:      minute,
      liveStatus:      status,
      homePossession:  hPoss,
      awayPossession:  aPoss,
      homeCorners:     hCorn,
      awayCorners:     aCorn,
      updatedAt:       Date.now(),
      updatedBy:       currentUser?.uid ?? 'admin',
    };

    // Upsert to Firestore (or localStorage) — keyed by matchId, no duplicates
    await saveMatchResult(currentUser?.uid, update);

    // Upsert local cache — always overwrite by matchId
    const current = loadAdminResults();
    current[sel.id] = update;   // object key = matchId → automatic dedup
    saveAdminResults(current);

    // Propagate to App state
    onMatchUpdate?.(update);

    // History: upsert by matchId — replace existing entry for same match
    const statsLabel = (hPoss != null && aPoss != null) ? ` · Pos: ${hPoss}%-${aPoss}%` : '';
    const cornLabel  = (hCorn != null && aCorn != null) ? ` · Cornere: ${hCorn}-${aCorn}` : '';
    const label = `${sel.flagA}${sel.teamA} ${sA}–${sB} ${sel.teamB}${sel.flagB}${statsLabel}${cornLabel}`;
    setHistory(h => {
      const without = h.filter(x => x.id !== sel.id);   // remove old entry for same match
      return [{ label, status, id:sel.id, ts:Date.now() }, ...without].slice(0, 5);
    });

    setSaved(isFT ? 'ft' : 'noft');
    setTimeout(() => setSaved(false), 3500);
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

      <AdminHelp open={showHelp} onToggle={() => setShowHelp(p => !p)}/>

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

          {/* Per-team possession + corners (FT only, optional) */}
          {status === 'ft' && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>Stats opționale</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>{sel.flagA} Posesie %</div>
                  <input type="number" min="0" max="100" value={possA} onChange={e=>setPossA(e.target.value)} placeholder="ex: 55" style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none', boxSizing:'border-box' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>{sel.flagB} Posesie %</div>
                  <input type="number" min="0" max="100" value={possB} onChange={e=>setPossB(e.target.value)} placeholder="ex: 45" style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none', boxSizing:'border-box' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>{sel.flagA} Cornere</div>
                  <input type="number" min="0" max="30" value={cornA} onChange={e=>setCornA(e.target.value)} placeholder="ex: 6" style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none', boxSizing:'border-box' }}/>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:4 }}>{sel.flagB} Cornere</div>
                  <input type="number" min="0" max="30" value={cornB} onChange={e=>setCornB(e.target.value)} placeholder="ex: 3" style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:"'DM Mono',monospace", outline:'none', boxSizing:'border-box' }}/>
                </div>
              </div>
              {possA !== '' && possB !== '' && Math.abs(Number(possA)+Number(possB)-100) > 1 && (
                <div style={{ fontSize:10, color:'#F59E0B', marginBottom:4 }}>⚠️ Posesia trebuie să totalizeze 100% ({Number(possA)+Number(possB)}%)</div>
              )}
            </div>
          )}

          {/* Save */}
          <button onClick={saveResult} style={{
            width:'100%', padding:13,
            background: saved==='ft' ? 'rgba(0,229,160,0.1)' : saved==='noft' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
            border:`1px solid ${saved==='ft'?'rgba(0,229,160,0.28)':saved==='noft'?'rgba(245,158,11,0.28)':'rgba(239,68,68,0.22)'}`,
            borderRadius:11, color:saved==='ft'?'#00E5A0':saved==='noft'?'#F59E0B':'#EF4444',
            fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.18s',
          }}>
            {saved==='ft'   ? '✓ Salvat! Clasamentul + grupele s-au actualizat.' :
             saved==='noft' ? 'Salvat. Nu contează în clasament până la status Final.' :
             'Salvează rezultat'}
          </button>

          {/* Group standings preview */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:600, marginBottom:7 }}>Clasament curent Gr.{sel.group}</div>
            <StandingsMini group={sel.group} finishedResults={finishedResults}/>
          </div>
        </div>
      )}

      {/* Lineup panel */}
      {sel && (
        <div style={{ marginTop:10 }}>
          <button
            onClick={() => setShowLineupPanel(p => !p)}
            style={{ width:'100%', padding:'9px 12px', background:'rgba(74,158,255,0.07)', border:'1px solid rgba(74,158,255,0.18)', borderRadius:10, color:'#4A9EFF', fontSize:11, fontWeight:700, cursor:'pointer', textAlign:'left' }}
          >
            {showLineupPanel ? 'x Inchide' : '+ Adauga / actualizeaza echipe'}
          </button>
          {showLineupPanel && (
            <div style={{ marginTop:8, padding:'12px 14px', background:'rgba(74,158,255,0.04)', border:'1px solid rgba(74,158,255,0.12)', borderRadius:10, animation:'fadeUp 0.18s ease' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(74,158,255,0.7)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Echipe meci
              </div>

              {/* Formation */}
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>Formatia (ambele echipe)</div>
                <input
                  value={lineupFormation}
                  onChange={e => setLineupFormation(e.target.value.trim())}
                  placeholder="ex: 4-3-3"
                  style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                />
              </div>

              {/* Home XI */}
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>{sel.flagA} {sel.teamA} — XI titular (unul pe linie)</div>
                <textarea
                  value={lineupHome}
                  onChange={e => setLineupHome(e.target.value)}
                  placeholder={"1. Portarul\n2. Fundas dreapta\n3. Fundas central\n..."}
                  rows={6}
                  style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12, fontFamily:'monospace', outline:'none', boxSizing:'border-box', resize:'vertical' }}
                />
              </div>

              {/* Away XI */}
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:4 }}>{sel.flagB} {sel.teamB} — XI titular (unul pe linie)</div>
                <textarea
                  value={lineupAway}
                  onChange={e => setLineupAway(e.target.value)}
                  placeholder={"1. Portarul\n2. Fundas dreapta\n..."}
                  rows={6}
                  style={{ width:'100%', padding:'8px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:12, fontFamily:'monospace', outline:'none', boxSizing:'border-box', resize:'vertical' }}
                />
              </div>

              {/* Official flag */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <input
                  type="checkbox"
                  id="officialCheck"
                  checked={lineupOfficial}
                  onChange={e => setLineupOfficial(e.target.checked)}
                  style={{ width:16, height:16, cursor:'pointer' }}
                />
                <label htmlFor="officialCheck" style={{ fontSize:11, color:lineupOfficial ? '#00E5A0' : 'rgba(255,255,255,0.4)', cursor:'pointer', fontWeight:lineupOfficial ? 700 : 400 }}>
                  {lineupOfficial ? 'Echipa OFICIALA (FIFA Match Centre)' : 'Echipa prognozata / Bulinews'}
                </label>
              </div>

              <button
                onClick={() => {
                  const parseXI = (text) => text.split('\n').filter(l => l.trim()).slice(0,11).map((l, i) => {
                    const m = l.match(/^(\d+)[.\s]+(.+)$/);
                    return m ? { number:parseInt(m[1]), name:m[2].trim(), position:['GK','RB','CB','CB','LB','CDM','CM','CM','RW','ST','LW'][i] || 'CM' }
                             : { number:i+1, name:l.trim(), position:['GK','RB','CB','CB','LB','CDM','CM','CM','RW','ST','LW'][i] || 'CM' };
                  });
                  const lu = {
                    matchId:    sel.id,
                    formation:  lineupFormation,
                    home:       parseXI(lineupHome),
                    away:       parseXI(lineupAway),
                    isOfficial: lineupOfficial,
                    sourceName: lineupOfficial ? 'FIFA Match Centre' : 'Manual / Bulinews',
                    updatedAt:  Date.now(),
                  };
                  // Save lineup to localStorage under lineups key
                  const stored = JSON.parse(localStorage.getItem('wc2026_lineups') || '{}');
                  stored[sel.id] = lu;
                  localStorage.setItem('wc2026_lineups', JSON.stringify(stored));
                  onMatchUpdate?.({ _action:'lineup', matchId:sel.id, lineup:lu });
                  setLineupSaved(true);
                  setTimeout(() => setLineupSaved(false), 2500);
                }}
                style={{ width:'100%', padding:10, background:lineupSaved ? 'rgba(0,229,160,0.1)' : 'rgba(74,158,255,0.1)', border:`1px solid ${lineupSaved ? 'rgba(0,229,160,0.3)' : 'rgba(74,158,255,0.25)'}`, borderRadius:9, color:lineupSaved ? '#00E5A0' : '#4A9EFF', fontSize:12, fontWeight:700, cursor:'pointer' }}
              >
                {lineupSaved ? 'Salvat!' : 'Salveaza echipele'}
              </button>
              {lineupOfficial && (
                <div style={{ marginTop:6, fontSize:9, color:'rgba(0,229,160,0.4)' }}>
                  Echipa oficiala va inlocui prognoza cu 45 min inainte de start.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recalculate / Reset panel */}
      <div style={{ display:'flex', gap:8, marginTop:10 }}>
        <button
          onClick={() => { onMatchUpdate?.({ _action:'recalc' }); setSaved(false); }}
          style={{ flex:1, padding:'10px 8px', background:'rgba(0,229,160,0.08)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:10, color:'#00E5A0', fontSize:11, fontWeight:700, cursor:'pointer' }}
        >
          Recalculeaza clasamente
        </button>
        <button
          onClick={() => {
            if (!window.confirm('Resetezi toate rezultatele test?')) return;
            localStorage.removeItem('wc2026_admin_results');
            onMatchUpdate?.({ _action:'reset' });
            setSel(null); setHistory([]);
          }}
          style={{ flex:1, padding:'10px 8px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:10, color:'#EF4444', fontSize:11, fontWeight:700, cursor:'pointer' }}
        >
          Reset rezultate test
        </button>
      </div>

      {/* Qualification overview */}
      <QualificationPanel finishedResults={finishedResults}/>

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


// ─── QUALIFICATION PANEL ─────────────────────────────────────────────────────
// Shows which teams have qualified based on current finishedResults.
function QualificationPanel({ finishedResults }) {
  const { standings, qualifiedThirds, groupsCompleted } = buildQualifiedTeams(finishedResults || {});
  const ALL_G = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const winners    = ALL_G.map(g => ({ g, team:standings[g]?.[0] })).filter(x => x.team);
  const runnersUp  = ALL_G.map(g => ({ g, team:standings[g]?.[1] })).filter(x => x.team);

  const section = (title, teams, color) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>
        {title} ({teams.length})
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        {teams.map((x, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 7px', background:'rgba(255,255,255,0.04)', border:`1px solid ${color}22`, borderRadius:6 }}>
            <span style={{ fontSize:12 }}>{x.team?.flag || x.flag}</span>
            <span style={{ fontSize:10, color:'#fff', fontWeight:600 }}>{x.team?.team || x.team}</span>
            {x.g && <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>Gr.{x.g}</span>}
            {x.pts !== undefined && (
              <span style={{ fontSize:9, color:color, fontFamily:"'DM Mono',monospace", marginLeft:2 }}>
                {x.pts}p {x.gd > 0 ? '+' : ''}{x.gd}gd
              </span>
            )}
          </div>
        ))}
        {teams.length === 0 && (
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)', fontStyle:'italic' }}>
            Nu sunt date inca
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px', marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:10, letterSpacing:'0.08em', textTransform:'uppercase' }}>
        Tabloul Calificarilor
      </div>
      {section('Castigatori grupe (Locul 1)', winners, '#00E5A0')}
      {section('Locul 2', runnersUp, '#4A9EFF')}
      {section('Cele mai bune locuri 3 calificate', qualifiedThirds.map(t => ({ team:t.team, flag:t.flag, g:t.fromGroup, pts:t.pts, gd:t.gd })), '#FFD700')}
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
