// ─── src/screens/BracketScreen.jsx ───────────────────────────────────────────
// FIFA World Cup 2026 — real knockout bracket.
// R32 (16 matches) → R16 (8) → QF (4) → SF (2) → Final (1) → Champion.
// List view: mobile-first, one round at a time with round tabs.
// Bracket view: horizontal scroll, correct left→center→(no right repeat) layout.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { buildKnockoutSlots, buildQualifiedTeams, MATCHES } from '../data/gameData.js';

// ─── TEAM CELL ────────────────────────────────────────────────────────────────
function TeamCell({ team, flag, label, isWinner, isTop }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 11px', minHeight:36,
      borderBottom: isTop ? '1px solid rgba(255,255,255,0.06)' : 'none',
      background: isWinner ? 'rgba(0,229,160,0.06)' : 'transparent',
    }}>
      {team ? (
        <>
          <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{flag}</span>
          <span style={{
            fontSize:12, fontWeight: isWinner ? 700 : 600,
            color: isWinner ? '#00E5A0' : '#fff',
            flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{team}</span>
          {isWinner && <span style={{ fontSize:10, color:'#00E5A0', flexShrink:0 }}>✓</span>}
        </>
      ) : (
        <>
          <div style={{ width:20, height:20, borderRadius:4, background:'rgba(255,255,255,0.05)', flexShrink:0 }}/>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)', fontStyle:'italic', flex:1 }}>{label}</span>
        </>
      )}
    </div>
  );
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({ match, isFinal, isSmall }) {
  const { home, away, homeLabel, awayLabel, label, winner } = match;
  const bc = isFinal ? 'rgba(212,175,55,0.35)' : (home||away) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
  const bg = isFinal ? 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))' : 'rgba(255,255,255,0.025)';

  return (
    <div style={{
      background:bg, border:`1px solid ${bc}`, borderRadius:12, overflow:'hidden',
      minWidth: isSmall ? 138 : isFinal ? 172 : 156, width:'100%',
      boxShadow: isFinal ? '0 4px 24px rgba(212,175,55,0.08)' : 'none',
    }}>
      {label && (
        <div style={{ padding:'3px 10px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:9, color:isFinal?'rgba(212,175,55,0.6)':'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:'0.08em' }}>
          {label}
        </div>
      )}
      <TeamCell team={home?.team} flag={home?.flag} label={homeLabel} isWinner={winner==='home'} isTop/>
      <TeamCell team={away?.team} flag={away?.flag} label={awayLabel} isWinner={winner==='away'}/>
    </div>
  );
}

// ─── CHAMPION CARD ────────────────────────────────────────────────────────────
function ChampionCard({ team, flag }) {
  if (!team) return null;
  return (
    <div style={{
      margin:'16px 0', padding:'24px 16px',
      background:'linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.04))',
      border:'1px solid rgba(212,175,55,0.35)', borderRadius:18, textAlign:'center',
      animation:'goldPulse 2s ease-in-out infinite',
    }}>
      <div style={{ fontSize:11, color:'rgba(212,175,55,0.55)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>
        🏆 CAMPIOANA MONDIALĂ 2026 🏆
      </div>
      <span style={{ fontSize:52 }}>{flag}</span>
      <div style={{ fontSize:26, fontWeight:900, color:'#FFD700', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.06em', marginTop:8 }}>
        {team}
      </div>
    </div>
  );
}

// ─── THIRDS PANEL ─────────────────────────────────────────────────────────────
// Shows which 3rd-place teams have qualified and their ranking
function ThirdsPanel({ allThirds, qualifiedThirds }) {
  const [open, setOpen] = useState(false);
  if (!allThirds || allThirds.length === 0) return null;

  return (
    <div style={{ marginBottom:12 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,215,0,0.04)', border:'1px solid rgba(255,215,0,0.1)', borderRadius: open?'10px 10px 0 0':10, cursor:'pointer', userSelect:'none' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:13 }}>🥉</span>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,215,0,0.7)' }}>
            Locuri 3 calificate — {qualifiedThirds?.length||0}/8
          </span>
        </div>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </div>
      {open && (
        <div style={{ background:'rgba(255,215,0,0.02)', border:'1px solid rgba(255,215,0,0.08)', borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'hidden', animation:'revealFlip 0.18s ease' }}>
          {allThirds.slice(0, 12).map((t, i) => {
            const isQ = i < 8;
            return (
              <div key={t.fromGroup} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderBottom: i < allThirds.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isQ ? 'rgba(255,215,0,0.03)' : 'transparent', opacity: isQ ? 1 : 0.4 }}>
                <span style={{ fontSize:10, fontWeight:800, color: isQ?'#FFD700':'rgba(255,255,255,0.3)', width:16, textAlign:'center' }}>{i+1}</span>
                <span style={{ fontSize:16 }}>{t.flag}</span>
                <span style={{ fontSize:12, color:'#fff', fontWeight:600, flex:1 }}>{t.team}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>Gr.{t.fromGroup}</span>
                <div style={{ display:'flex', gap:4, fontFamily:"'DM Mono',monospace" }}>
                  <span style={{ fontSize:10, fontWeight:700, color: isQ?'#FFD700':'rgba(255,255,255,0.3)' }}>{t.pts}p</span>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>{t.gd>0?'+':''}{t.gd}</span>
                </div>
                {isQ && <span style={{ fontSize:8, color:'#FFD700', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>✓ Q</span>}
              </div>
            );
          })}
          <div style={{ padding:'6px 12px', fontSize:9, color:'rgba(255,255,255,0.15)', background:'rgba(0,0,0,0.15)' }}>
            Calificați: top 8 din 12 echipe de pe locul 3 · sortate pts → dif.goluri → goluri
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUALIFICATION BANNER ─────────────────────────────────────────────────────
function QualificationBanner() {
  const bullets = [
    { icon:'⚔️', text:'Faza eliminatorie — fiecare meci contează dublu.', accent:'rgba(0,229,160,0.9)'  },
    { icon:'🔥', text:'Toți jucătorii rămân activi până la finală.',       accent:'rgba(255,152,0,0.9)'  },
    { icon:'👑', text:'Clasamentul principal continuă fără întrerupere.',   accent:'rgba(212,175,55,0.9)' },
    { icon:'🏆', text:'Câștigă cel mai bun pronosticator al turneului.',    accent:'rgba(255,215,0,0.9)'  },
  ];

  return (
    <div style={{
      margin:'0 0 14px',
      background:'linear-gradient(135deg,rgba(12,28,18,0.95),rgba(8,12,14,0.98))',
      border:'1px solid rgba(0,229,160,0.12)',
      borderRadius:14, overflow:'hidden', position:'relative',
    }}>
      {/* Cinematic top bar */}
      <div style={{ height:2, background:'linear-gradient(90deg,transparent 0%,rgba(0,229,160,0.6) 30%,rgba(212,175,55,0.6) 70%,transparent 100%)' }}/>
      <div style={{ padding:'13px 15px 15px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:11 }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>🏆</div>
          <span style={{ fontSize:9, letterSpacing:'0.2em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', fontWeight:800 }}>FAZA ELIMINATORIE</span>
        </div>
        {bullets.map((b, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:9, padding:'7px 0',
            borderBottom: i < bullets.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            animation:`staggerIn 0.3s ${i*0.08}s ease both`,
          }}>
            <span style={{ fontSize:14, flexShrink:0, lineHeight:1.5 }}>{b.icon}</span>
            <span style={{ fontSize:12, fontWeight:600, color:b.accent, lineHeight:1.55 }}>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function GroupProgress({ finished, total, groupsCompleted, qualifiedThirds }) {
  const pct  = Math.round((finished / total) * 100);
  const done = finished === total;
  const thirdsCount = qualifiedThirds?.length || 0;
  const allDone = groupsCompleted?.length === 12;

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {allDone ? '✅ Grupe complete — tabloul e activ' : 'Faza grupelor în desfășurare'}
        </span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}>
          {groupsCompleted?.length||0}/12 grupe
        </span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', width:`${(groupsCompleted?.length||0)/12*100}%`, background: allDone ? 'linear-gradient(90deg,#FFD700,#F59E0B)' : 'linear-gradient(90deg,#00E5A0,#00C27A)', borderRadius:2, transition:'width 0.6s ease' }}/>
      </div>
      {/* Qualification counts */}
      <div style={{ display:'flex', gap:6 }}>
        {[
          { label:'Castigatoare grupe', value:groupsCompleted?.length||0, max:12, color:'#00E5A0' },
          { label:'Locuri secunde',      value:groupsCompleted?.length||0, max:12, color:'#4A9EFF' },
          { label:'Cele mai bune locuri 3', value:thirdsCount,             max:8,  color:'#FFD700' },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, padding:'6px 8px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:800, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.value}<span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>/{s.max}</span></div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:1, letterSpacing:'0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {!allDone && (
        <div style={{ marginTop:7, fontSize:10, color:'rgba(255,215,0,0.45)', display:'flex', alignItems:'center', gap:5 }}>
          <span>🔒</span><span>Tabloul se completează automat după finalizarea tuturor grupelor</span>
        </div>
      )}
    </div>
  );
}

// ─── EMPTY SLOTS HELPER ───────────────────────────────────────────────────────
const mkEmpty = (count, key, lbl) =>
  Array.from({length:count}, (_,i) => ({
    id:`${key}_${i}`, home:null, away:null,
    homeLabel:`Câșt. ${lbl}`, awayLabel:`Câșt. ${lbl}`,
  }));

// ─── ROUND LIST VIEW — mobile primary ────────────────────────────────────────
function RoundListView({ r32, champion }) {
  const [active, setActive] = useState('r32');

  const ROUND_DATA = {
    r32: { matches:r32,                    label:'Optimi de Finală',   isFinal:false },
    r16: { matches:mkEmpty(8,'r16','R32'), label:'16-imi de Finală',   isFinal:false },
    qf:  { matches:mkEmpty(4,'qf','R16'),  label:'Sferturi de Finală', isFinal:false },
    sf:  { matches:mkEmpty(2,'sf','SF'),   label:'Semifinale',         isFinal:false },
    f:   { matches:mkEmpty(1,'f','Semi'),  label:'🏆 Finala',          isFinal:true  },
  };

  const TABS = [
    { id:'r32', label:'Optimi'  },
    { id:'r16', label:'16-imi'  },
    { id:'qf',  label:'Sferturi'},
    { id:'sf',  label:'Semi'    },
    { id:'f',   label:'🏆 Final'},
  ];

  const cur     = ROUND_DATA[active];
  const curIdx  = TABS.findIndex(t => t.id === active);

  return (
    <div>
      {/* Round tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:14, overflowX:'auto' }}>
        {TABS.map((t, i) => {
          const isActive = active === t.id;
          const isLast   = t.id === 'f';
          return (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              flex:1, padding:'7px 3px', border:'none', cursor:'pointer',
              borderRadius:9, transition:'all 0.15s', whiteSpace:'nowrap',
              background: isActive ? (isLast?'rgba(212,175,55,0.18)':'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.03)',
              borderBottom:`2px solid ${isActive ? (isLast?'#FFD700':'#00E5A0') : 'transparent'}`,
              color: isActive ? (isLast?'#FFD700':'#fff') : 'rgba(255,255,255,0.3)',
              fontSize:10, fontWeight: isActive ? 800 : 500,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Final tab — special full-width layout */}
      {active === 'f' ? (
        <div>
          {champion ? (
            <ChampionCard team={champion.team} flag={champion.flag}/>
          ) : (
            <div>
              <div style={{ marginBottom:12, padding:'12px 14px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:12 }}>
                <div style={{ fontSize:11, color:'rgba(212,175,55,0.6)', marginBottom:4, fontWeight:700 }}>🏆 MAREA FINALĂ</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                  Cei doi finaliști se vor decide după semifinale.
                </div>
              </div>
              {/* Single full-width final card */}
              <MatchCard match={{...cur.matches[0], label:'🏆 FINALA — 19 Iulie 2026'}} isFinal/>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Round label */}
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            {cur.label}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400 }}>— {cur.matches.length} meciuri</span>
          </div>
          {/* 2-col grid for all non-final rounds */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {cur.matches.map((m, i) => (
              <MatchCard key={m.id||i} match={m} isFinal={false}/>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
        {curIdx > 0 ? (
          <button onClick={() => setActive(TABS[curIdx-1].id)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:11, padding:'6px 12px', cursor:'pointer' }}>
            ← {TABS[curIdx-1].label}
          </button>
        ) : <div/>}
        {curIdx < TABS.length-1 ? (
          <button onClick={() => setActive(TABS[curIdx+1].id)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:11, padding:'6px 12px', cursor:'pointer' }}>
            {TABS[curIdx+1].label} →
          </button>
        ) : (
          // Terminal state — no forward button, show a closing note
          <div style={{ fontSize:10, color:'rgba(212,175,55,0.4)', fontStyle:'italic' }}>
            {champion ? '🏆 Turneul s-a încheiat' : 'Turneul se termină aici'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BRACKET VIEW — horizontal, left-to-right, correct structure ──────────────
// Layout: R32-left → R16-left → QF-left → SF → FINAL → SF → QF-right → R16-right → R32-right
// The Final is the rightmost "peak" — there is no continuation after it.
function BracketView({ r32, champion }) {
  const r16 = mkEmpty(8,'r16','Optimi');
  const qf  = mkEmpty(4,'qf','16-imi');
  const sf  = mkEmpty(2,'sf','Sferturi');
  const fin = mkEmpty(1,'f','Semifinală');

  const left  = r32.slice(0,8);
  const right = r32.slice(8,16);

  // Vertical connector line between columns
  const Connector = () => (
    <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.07)', flexShrink:0, margin:'24px 0' }}/>
  );

  const Col = ({ rounds, title, small }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:7, alignItems:'stretch', flex:'0 0 auto' }}>
      {title && (
        <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', textAlign:'center', padding:'3px 7px', background:'rgba(255,255,255,0.03)', borderRadius:20, whiteSpace:'nowrap', marginBottom:2 }}>
          {title}
        </div>
      )}
      {rounds.map((m,i) => <MatchCard key={m.id||i} match={m} isSmall={small}/>)}
    </div>
  );

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:12 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:'max-content', padding:'4px 2px 4px' }}>

        {/* ── LEFT HALF ─────────────────────────────────── */}
        <Col rounds={left.slice(0,4)} small title="Optimi A"/>
        <Col rounds={left.slice(4,8)} small title="Optimi B"/>
        <Connector/>
        <Col rounds={r16.slice(0,4)} title="16-imi A"/>
        <Col rounds={qf.slice(0,2)}  title="Sferturi A"/>
        <Connector/>

        {/* ── CENTER: SF + FINAL + SF ────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:'0 0 auto', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(212,175,55,0.65)', textAlign:'center', padding:'3px 10px', background:'rgba(212,175,55,0.06)', borderRadius:20, border:'1px solid rgba(212,175,55,0.15)', whiteSpace:'nowrap', marginBottom:2 }}>
            Centru
          </div>
          <MatchCard match={sf[0]}/>
          {/* FINAL — the end point */}
          {champion ? (
            <div style={{ padding:'10px 14px', background:'linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.04))', border:'1px solid rgba(212,175,55,0.4)', borderRadius:14, textAlign:'center', minWidth:160 }}>
              <div style={{ fontSize:9, color:'rgba(212,175,55,0.6)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>🏆 Campioană</div>
              <span style={{ fontSize:32 }}>{champion.flag}</span>
              <div style={{ fontSize:14, fontWeight:900, color:'#FFD700', fontFamily:"'Bebas Neue',sans-serif", marginTop:4 }}>{champion.team}</div>
            </div>
          ) : (
            <MatchCard match={{...fin[0], label:'🏆 FINALA'}} isFinal/>
          )}
          <MatchCard match={sf[1]}/>
        </div>

        <Connector/>
        {/* ── RIGHT HALF ────────────────────────────────── */}
        <Col rounds={qf.slice(2,4)}  title="Sferturi B"/>
        <Col rounds={r16.slice(4,8)} title="16-imi B"/>
        <Connector/>
        <Col rounds={right.slice(0,4)} small title="Optimi C"/>
        <Col rounds={right.slice(4,8)} small title="Optimi D"/>
        {/* ── END — no columns after this ──────────────── */}

      </div>
    </div>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function BracketScreen() {
  const r32Raw = useMemo(() => buildKnockoutSlots(), []);
  // VISUAL-ONLY OVERRIDE: slot m37 is "2° Gr.A vs 2° Gr.B" — South Africa
  // (2nd, Group A) vs Canada (2nd, Group B) is now a confirmed fixture.
  // This only changes what's DISPLAYED in this bracket view; it does not
  // create or alter any prediction data. The real predictable match is
  // numeric id 73 in matches.js, completely separate from this slot.
  const r32 = useMemo(() => r32Raw.map(slot =>
    slot.id === 'm37'
      ? { ...slot, home: { team: 'Africa de Sud', flag: '🇿🇦' }, away: { team: 'Canada', flag: '🇨🇦' } }
      : slot
  ), [r32Raw]);
  const { groupsCompleted, qualifiedThirds, allThirds } = useMemo(() => buildQualifiedTeams(), []);
  const [view, setView] = useState('list');

  const totalMatches    = MATCHES.length;
  const finishedMatches = MATCHES.filter(m => m.isFinished).length;
  const champion        = null; // wire when tournament ends: { team, flag }

  return (
    <div style={{ paddingBottom:24 }}>

      {/* Header */}
      <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:9, color:'rgba(212,175,55,0.55)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
          FIFA World Cup 2026™
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', fontFamily:"'Bebas Neue',sans-serif" }}>
              TABLOUL ELIMINATORIU
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:2 }}>
              R32 → R16 → SF → Semi → 🏆
            </div>
          </div>
          {/* View toggle */}
          <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:3, flexShrink:0 }}>
            {[{id:'list',icon:'≡',label:'Listă'},{id:'bracket',icon:'⊞',label:'Tablou'}].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} title={v.label} style={{
                width:30, height:26, borderRadius:6, border:'none', cursor:'pointer',
                fontSize:14, background:view===v.id?'rgba(255,255,255,0.1)':'transparent',
                color:view===v.id?'#fff':'rgba(255,255,255,0.3)', transition:'all 0.15s',
              }}>{v.icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'12px 14px 0' }}>
        <GroupProgress finished={finishedMatches} total={totalMatches} groupsCompleted={groupsCompleted} qualifiedThirds={qualifiedThirds}/>
        <ThirdsPanel allThirds={allThirds} qualifiedThirds={qualifiedThirds}/>
        <QualificationBanner/>

        {/* ── Reguli speciale faza eliminatorie ── */}
        <div style={{ marginTop:12, marginBottom:4, padding:'12px 14px', background:'linear-gradient(135deg,rgba(74,158,255,0.07),rgba(74,158,255,0.02))', border:'1px solid rgba(74,158,255,0.18)', borderRadius:13 }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#4A9EFF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:9 }}>
            ⚡ Reguli speciale — Eliminatorii
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ fontSize:16, flexShrink:0 }}>🔥</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>All or Nothing</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.45 }}>
                  La semifinale, finala mică și finala mare, punctele tuturor se dublează automat.
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ fontSize:16, flexShrink:0 }}>🃏</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>Joker-e (×2)</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.45 }}>
                  2 joker-e per jucător, de folosit pe orice meci din optimi, 16imi sau sferturi — dublează punctele tale de la meciul ales. Nu sunt valabile la semifinale/finale (acolo e deja All or Nothing).
                </div>
              </div>
            </div>
          </div>
        </div>

        {view === 'list' ? (
          <RoundListView r32={r32} champion={champion}/>
        ) : (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:14 }}>←</span>
              Scroll stânga-dreapta pentru tabloul complet
            </div>
            <BracketView r32={r32} champion={champion}/>
          </div>
        )}

        {/* Format note */}
        <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.28)', marginBottom:5 }}>FORMAT WC 2026</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.7 }}>
            <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 1</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 2</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>8 × cele mai bune locuri 3</strong> = 32 echipe calificate.
            Meciuri directe eliminatorii până la finală.
          </div>
        </div>
      </div>
    </div>
  );
}
