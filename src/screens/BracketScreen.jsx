// ─── src/screens/BracketScreen.jsx ───────────────────────────────────────────
// FIFA World Cup 2026 — real knockout bracket.
// 32 teams → 16 → QF → SF → Final → Champion.
// Mobile-first: vertical list by round, each round scrollable.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { buildKnockoutSlots, MATCHES } from '../data/gameData.js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROUNDS = [
  { id:'r32', label:'Optimi de Finală',   short:'R32',    count:16 },
  { id:'r16', label:'16-imi de Finală',   short:'16-imi', count:8  },
  { id:'qf',  label:'Sferturi de Finală', short:'SF',     count:4  },
  { id:'sf',  label:'Semifinale',         short:'Semi',   count:2  },
  { id:'f',   label:'Finala Mare',        short:'Final',  count:1  },
];

// ─── TEAM CELL ────────────────────────────────────────────────────────────────
function TeamCell({ team, flag, label, isWinner, isTop, color }) {
  const filled = !!team;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 11px',
      borderBottom: isTop ? '1px solid rgba(255,255,255,0.06)' : 'none',
      background: isWinner ? 'rgba(0,229,160,0.06)' : 'transparent',
      transition:'background 0.2s',
      minHeight:36,
    }}>
      {filled ? (
        <>
          <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{flag}</span>
          <span style={{
            fontSize:12, fontWeight: isWinner ? 700 : 600,
            color: isWinner ? '#00E5A0' : '#fff',
            flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{team}</span>
          {isWinner && <span style={{ fontSize:10, color:'#00E5A0', fontWeight:800, flexShrink:0 }}>✓</span>}
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
  const borderColor = isFinal
    ? 'rgba(212,175,55,0.35)'
    : home || away
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(255,255,255,0.05)';
  const bg = isFinal
    ? 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))'
    : 'rgba(255,255,255,0.025)';
  const minW = isSmall ? 140 : isFinal ? 170 : 158;

  return (
    <div style={{
      background: bg, border:`1px solid ${borderColor}`,
      borderRadius:12, overflow:'hidden',
      minWidth: minW, width:'100%',
      boxShadow: isFinal ? '0 4px 24px rgba(212,175,55,0.08)' : 'none',
    }}>
      {label && (
        <div style={{ padding:'3px 10px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:'0.08em' }}>
          {label}
        </div>
      )}
      <TeamCell team={home?.team} flag={home?.flag} label={homeLabel} isWinner={winner==='home'} isTop/>
      <TeamCell team={away?.team} flag={away?.flag} label={awayLabel} isWinner={winner==='away'}/>
    </div>
  );
}

// ─── ROUND HEADER ─────────────────────────────────────────────────────────────
function RoundHeader({ round, isActive, isFinal }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'4px 0', marginBottom:10,
    }}>
      <div style={{
        height:1, flex:1,
        background: isFinal ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
      }}/>
      <div style={{
        fontSize:10, fontWeight:800,
        color: isFinal ? 'rgba(212,175,55,0.8)' : isActive ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)',
        letterSpacing:'0.14em', textTransform:'uppercase',
        padding:'3px 10px',
        background: isFinal ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.03)',
        border:`1px solid ${isFinal ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius:20, whiteSpace:'nowrap',
      }}>
        {isFinal ? '🏆 ' : ''}{round.label}
      </div>
      <div style={{
        height:1, flex:1,
        background: isFinal ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
      }}/>
    </div>
  );
}

// ─── CHAMPION CARD ────────────────────────────────────────────────────────────
function ChampionCard({ team, flag }) {
  if (!team) return null;
  return (
    <div style={{
      margin:'16px 0', padding:'20px 16px',
      background:'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))',
      border:'1px solid rgba(212,175,55,0.3)',
      borderRadius:18, textAlign:'center',
      animation:'goldPulse 2s ease-in-out infinite',
    }}>
      <div style={{ fontSize:12, color:'rgba(212,175,55,0.5)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>
        🏆 CAMPIOANA MONDIALĂ 2026 🏆
      </div>
      <span style={{ fontSize:48 }}>{flag}</span>
      <div style={{ fontSize:24, fontWeight:900, color:'#FFD700', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.06em', marginTop:6 }}>
        {team}
      </div>
    </div>
  );
}

// ─── QUALIFICATION BANNER ─────────────────────────────────────────────────────
function QualificationBanner() {
  const lines = [
    { text:'Dacă ai ajuns aici, ai supraviețuit grupelor.', icon:'⚔️', color:'rgba(0,229,160,0.8)' },
    { text:'Acum nu mai există meciuri de antrenament.', icon:'🔥', color:'rgba(255,152,0,0.8)' },
    { text:'Top 70% se califică. Restul dispar.', icon:'💀', color:'rgba(239,68,68,0.8)' },
  ];

  return (
    <div style={{
      margin:'0 0 16px',
      background:'linear-gradient(135deg,rgba(15,45,26,0.8),rgba(10,14,20,0.9))',
      border:'1px solid rgba(0,229,160,0.12)',
      borderRadius:14, overflow:'hidden',
      position:'relative',
    }}>
      {/* Subtle top stripe */}
      <div style={{ height:2, background:'linear-gradient(90deg,transparent,rgba(0,229,160,0.4),rgba(212,175,55,0.4),transparent)' }}/>

      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ fontSize:9, letterSpacing:'0.22em', color:'rgba(212,175,55,0.5)', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>
          FAZA ELIMINATORIE
        </div>

        {lines.map((l, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:10,
            padding:'8px 0',
            borderBottom: i < lines.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            animation:`staggerIn 0.3s ${i*0.1}s ease both`,
          }}>
            <span style={{ fontSize:16, flexShrink:0, lineHeight:1.4 }}>{l.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:l.color, lineHeight:1.5 }}>{l.text}</span>
          </div>
        ))}

        <div style={{
          marginTop:12, padding:'8px 11px',
          background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.12)',
          borderRadius:8, display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{ fontSize:14 }}>⚡</span>
          <span style={{ fontSize:11, color:'rgba(212,175,55,0.6)', lineHeight:1.4 }}>
            Predicțiile pentru meciurile eliminatorii se deschid<br/>
            <strong style={{ color:'rgba(212,175,55,0.85)' }}>cu 48h înainte de fiecare meci</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function GroupProgress({ finished, total }) {
  const pct = Math.round((finished / total) * 100);
  const done = finished === total;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {done ? '✅ Grupe complete' : 'Faza grupelor'}
        </span>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>
          {finished}/{total} meciuri
        </span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          height:'100%', width:`${pct}%`,
          background: done ? 'linear-gradient(90deg,#FFD700,#F59E0B)' : 'linear-gradient(90deg,#00E5A0,#00C27A)',
          borderRadius:2, transition:'width 0.6s ease',
        }}/>
      </div>
      {!done && (
        <div style={{ marginTop:8, fontSize:11, color:'rgba(255,215,0,0.5)', display:'flex', alignItems:'center', gap:6 }}>
          <span>🔒</span>
          <span>Tabloul se completează automat după grupe</span>
        </div>
      )}
    </div>
  );
}

// ─── BRACKET VIEW (horizontal scroll) ────────────────────────────────────────
function BracketView({ r32 }) {
  // Empty placeholder rounds
  const mkEmpty = (count, fromLabel, toLabel) =>
    Array.from({length:count}, (_,i) => ({
      id:`${fromLabel}_${i}`, home:null, away:null,
      homeLabel:`Câșt. ${toLabel}`, awayLabel:`Câșt. ${toLabel}`,
    }));

  const r16 = mkEmpty(8, 'r16', 'Optimi');
  const qf  = mkEmpty(4, 'qf',  '16-imi');
  const sf  = mkEmpty(2, 'sf',  'Sferturi');
  const fin = mkEmpty(1, 'f',   'Semifinală');

  // Split bracket: left 8, right 8
  const left  = r32.slice(0, 8);
  const right = r32.slice(8, 16);

  const Col = ({ rounds, isSmall, title }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'stretch', flex:'0 0 auto' }}>
      {title && (
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', textAlign:'center', padding:'3px 8px', background:'rgba(255,255,255,0.03)', borderRadius:20, whiteSpace:'nowrap' }}>
          {title}
        </div>
      )}
      {rounds.map((m, i) => <MatchCard key={m.id||i} match={m} isSmall={isSmall}/>)}
    </div>
  );

  return (
    <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch', paddingBottom:8 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', minWidth:'max-content', padding:'0 2px' }}>
        {/* Left R32 */}
        <Col rounds={left.slice(0,4)} isSmall title="Optimi A"/>
        <Col rounds={left.slice(4,8)} isSmall title="Optimi B"/>
        {/* Connector */}
        <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.06)', flexShrink:0, margin:'16px 0' }}/>
        {/* Left R16 */}
        <Col rounds={r16.slice(0,4)} isSmall={false} title="16-imi A"/>
        {/* QF left */}
        <Col rounds={qf.slice(0,2)} title="Sferturi A"/>
        {/* Connector */}
        <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.06)', flexShrink:0, margin:'16px 0' }}/>
        {/* SF + Final center */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, flex:'0 0 auto', alignItems:'center' }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(212,175,55,0.6)', textAlign:'center', padding:'3px 10px', background:'rgba(212,175,55,0.06)', borderRadius:20, border:'1px solid rgba(212,175,55,0.15)', whiteSpace:'nowrap' }}>
            ⚡ Centru
          </div>
          <MatchCard match={sf[0]} isSmall={false}/>
          <MatchCard match={{...fin[0], label:'🏆 FINALA'}} isFinal/>
          <MatchCard match={sf[1]} isSmall={false}/>
        </div>
        {/* Connector */}
        <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.06)', flexShrink:0, margin:'16px 0' }}/>
        {/* QF right */}
        <Col rounds={qf.slice(2,4)} title="Sferturi B"/>
        {/* Right R16 */}
        <Col rounds={r16.slice(4,8)} isSmall={false} title="16-imi B"/>
        {/* Connector */}
        <div style={{ width:1, alignSelf:'stretch', background:'rgba(255,255,255,0.06)', flexShrink:0, margin:'16px 0' }}/>
        {/* Right R32 */}
        <Col rounds={right.slice(0,4)} isSmall title="Optimi C"/>
        <Col rounds={right.slice(4,8)} isSmall title="Optimi D"/>
      </div>
    </div>
  );
}

// ─── ROUND LIST VIEW (mobile-friendly vertical) ───────────────────────────────
function RoundListView({ r32 }) {
  const [activeRound, setActiveRound] = useState('r32');

  const mkEmpty = (count, key, lbl) =>
    Array.from({length:count}, (_,i) => ({ id:`${key}_${i}`, home:null, away:null, homeLabel:`Câșt. ${lbl}`, awayLabel:`Câșt. ${lbl}` }));

  const rounds = {
    r32: { matches:r32,                   label:'Optimi de Finală'   },
    r16: { matches:mkEmpty(8,'r16','R32'), label:'16-imi de Finală'   },
    qf:  { matches:mkEmpty(4,'qf','R16'),  label:'Sferturi de Finală' },
    sf:  { matches:mkEmpty(2,'sf','SF'),   label:'Semifinale'         },
    f:   { matches:mkEmpty(1,'f','Semi'),  label:'Finala'             },
  };

  const tabs = [
    { id:'r32', short:'32' },
    { id:'r16', short:'16' },
    { id:'qf',  short:'SF' },
    { id:'sf',  short:'Semi'},
    { id:'f',   short:'🏆'  },
  ];

  const current = rounds[activeRound];
  const isFinalRound = activeRound === 'f';

  return (
    <div>
      {/* Round selector tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, overflowX:'auto' }}>
        {tabs.map((t, i) => {
          const active = activeRound === t.id;
          const hasData = t.id === 'r32' && r32.some(m => m.home || m.away);
          return (
            <button
              key={t.id}
              onClick={() => setActiveRound(t.id)}
              style={{
                flex:1, padding:'8px 4px', border:'none', cursor:'pointer',
                borderRadius:10, transition:'all 0.15s',
                background: active
                  ? (t.id === 'f' ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.1)')
                  : 'rgba(255,255,255,0.03)',
                borderBottom:`2px solid ${active ? (t.id==='f'?'#FFD700':'#00E5A0') : 'transparent'}`,
                color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize:11, fontWeight: active ? 800 : 500,
                position:'relative', whiteSpace:'nowrap',
              }}
            >
              {t.short}
              {i < tabs.length-1 && (
                <span style={{ position:'absolute', right:-2, top:'50%', transform:'translateY(-50%)', fontSize:9, color:'rgba(255,255,255,0.1)' }}>›</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Round label */}
      <div style={{ fontSize:13, fontWeight:700, color: isFinalRound ? '#FFD700' : 'rgba(255,255,255,0.6)', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
        {isFinalRound && <span>🏆</span>}
        {current.label}
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400 }}>({current.matches.length} meciuri)</span>
      </div>

      {/* Match grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {current.matches.map((m, i) => (
          <MatchCard
            key={m.id||i}
            match={m}
            isFinal={activeRound === 'f'}
          />
        ))}
      </div>

      {/* Navigation hint */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
        {tabs.findIndex(t=>t.id===activeRound) > 0 ? (
          <button onClick={()=>{const idx=tabs.findIndex(t=>t.id===activeRound);setActiveRound(tabs[idx-1].id);}} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.4)', fontSize:11, padding:'5px 10px', cursor:'pointer' }}>
            ← {tabs[tabs.findIndex(t=>t.id===activeRound)-1]?.short}
          </button>
        ) : <div/>}
        {tabs.findIndex(t=>t.id===activeRound) < tabs.length-1 ? (
          <button onClick={()=>{const idx=tabs.findIndex(t=>t.id===activeRound);setActiveRound(tabs[idx+1].id);}} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.4)', fontSize:11, padding:'5px 10px', cursor:'pointer' }}>
            {tabs[tabs.findIndex(t=>t.id===activeRound)+1]?.short} →
          </button>
        ) : <div/>}
      </div>
    </div>
  );
}

// ─── MAIN BRACKET SCREEN ──────────────────────────────────────────────────────
export default function BracketScreen() {
  const r32 = useMemo(() => buildKnockoutSlots(), []);
  const [view, setView] = useState('list'); // 'list' | 'bracket'

  const totalMatches    = MATCHES.length;
  const finishedMatches = MATCHES.filter(m => m.isFinished).length;
  const allGroupsDone   = finishedMatches === totalMatches;

  const champion = null; // TODO: wire when tournament progresses

  return (
    <div style={{ paddingBottom:20 }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:9, color:'rgba(212,175,55,0.55)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
          FIFA World Cup 2026™
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', fontFamily:"'Bebas Neue',sans-serif" }}>
              TABLOUL ELIMINATORIU
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>
              32 → 16 → 8 → 4 → 2 → 🏆
            </div>
          </div>
          {/* View toggle */}
          <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:3 }}>
            {[{id:'list',icon:'≡'},{id:'bracket',icon:'⊞'}].map(v => (
              <button key={v.id} onClick={()=>setView(v.id)} style={{ width:28,height:24,borderRadius:6,border:'none',cursor:'pointer',fontSize:13,background:view===v.id?'rgba(255,255,255,0.1)':'transparent',color:view===v.id?'#fff':'rgba(255,255,255,0.3)',transition:'all 0.15s' }}>{v.icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:'12px 14px 0' }}>
        <GroupProgress finished={finishedMatches} total={totalMatches}/>
        <QualificationBanner/>

        {/* Champion (shown when tournament ends) */}
        <ChampionCard team={champion?.team} flag={champion?.flag}/>

        {view === 'list'
          ? <RoundListView r32={r32}/>
          : (
            <div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:10 }}>
                ← Scroll orizontal pentru tabloul complet
              </div>
              <BracketView r32={r32}/>
            </div>
          )
        }

        {/* Format note */}
        <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', marginBottom:6 }}>FORMAT WC 2026</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.7 }}>
            32 echipe calificate: <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 1</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 2</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>8 × cele mai bune locuri 3</strong> din 12 grupe.
          </div>
        </div>
      </div>
    </div>
  );
}
