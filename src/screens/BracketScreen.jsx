// ─── src/screens/BracketScreen.jsx ───────────────────────────────────────────
// Visual knockout bracket — Round of 32 → Final.
// Auto-populated from group standings when available.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { buildKnockoutSlots, MATCHES } from '../data/gameData.js';

// ─── MATCH SLOT ───────────────────────────────────────────────────────────────
function BracketSlot({ home, away, homeLabel, awayLabel, small }) {
  const fs  = small ? 11 : 12;
  const ffl = small ? 16 : 20;
  const pad = small ? '7px 10px' : '9px 12px';

  const TeamRow = ({ team, flag, label, isHome }) => (
    <div style={{
      display:'flex', alignItems:'center', gap:7, padding:pad,
      borderBottom: isHome ? '1px solid rgba(255,255,255,0.05)' : 'none',
    }}>
      {team ? (
        <>
          <span style={{ fontSize:ffl }}>{flag}</span>
          <span style={{ fontSize:fs, fontWeight:600, color:'#fff', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team}</span>
        </>
      ) : (
        <>
          <div style={{ width:ffl, height:ffl, borderRadius:4, background:'rgba(255,255,255,0.06)' }}/>
          <span style={{ fontSize:fs-1, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>{label}</span>
        </>
      )}
    </div>
  );

  return (
    <div style={{
      background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:10, overflow:'hidden', minWidth:small?130:155,
    }}>
      <TeamRow team={home?.team} flag={home?.flag} label={homeLabel} isHome/>
      <TeamRow team={away?.team} flag={away?.flag} label={awayLabel}/>
    </div>
  );
}

// ─── ROUND COLUMN ─────────────────────────────────────────────────────────────
function RoundColumn({ title, slots, small }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
      <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:2, whiteSpace:'nowrap', padding:'3px 8px', background:'rgba(255,255,255,0.04)', borderRadius:20 }}>
        {title}
      </div>
      {slots.map((s, i) => (
        <BracketSlot key={s?.id || i} {...(s || {})} small={small}/>
      ))}
    </div>
  );
}

// ─── BRACKET SCREEN ───────────────────────────────────────────────────────────
export default function BracketScreen() {
  const r32slots = useMemo(() => buildKnockoutSlots(), []);

  // Group stage progress
  const totalMatches    = MATCHES.length;
  const finishedMatches = MATCHES.filter(m => m.isFinished).length;
  const pct             = Math.round((finishedMatches / totalMatches) * 100);
  const allGroupsDone   = finishedMatches === totalMatches;

  // Split R32 into two sides of the bracket (8 + 8)
  const leftSide  = r32slots.slice(0, 8);
  const rightSide = r32slots.slice(8, 16);

  // Empty future rounds
  const r16  = Array(8).fill(null).map((_,i)=>({ id:`r16_${i}`,  home:null, away:null, homeLabel:'Câștigător R32', awayLabel:'Câștigător R32' }));
  const qf   = Array(4).fill(null).map((_,i)=>({ id:`qf_${i}`,   home:null, away:null, homeLabel:'Câștigător Opt.', awayLabel:'Câștigător Opt.' }));
  const sf   = Array(2).fill(null).map((_,i)=>({ id:`sf_${i}`,   home:null, away:null, homeLabel:'Câștigător Sfer.', awayLabel:'Câștigător Sfer.' }));
  const final = [{ id:'final', home:null, away:null, homeLabel:'Câștigător Semi', awayLabel:'Câștigător Semi' }];

  return (
    <div style={{ paddingBottom:16 }}>
      {/* Header */}
      <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:9, color:'rgba(212,175,55,0.6)', letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>FIFA World Cup 2026™</div>
        <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>Tabloul Eliminatoriu</div>

        {/* Progress bar */}
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Faza grupelor</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:"'DM Mono',monospace" }}>{finishedMatches}/{totalMatches}</span>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#00E5A0,#00C27A)', borderRadius:2, transition:'width 0.5s' }}/>
          </div>
        </div>

        {!allGroupsDone && (
          <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.12)', borderRadius:8, fontSize:11, color:'rgba(255,215,0,0.6)' }}>
            🔒 Tabloul se completează după terminarea grupelor
          </div>
        )}
      </div>

      {/* Horizontal scrollable bracket */}
      <div style={{ overflowX:'auto', padding:'16px 14px', WebkitOverflowScrolling:'touch' }}>
        <div style={{ display:'flex', gap:16, alignItems:'flex-start', minWidth:'max-content' }}>

          {/* Left side R32 */}
          <RoundColumn title="Optimi (1)" slots={leftSide.slice(0,4)} small/>
          <RoundColumn title="Optimi (2)" slots={leftSide.slice(4,8)} small/>

          {/* Left side R16 */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:'0 0 auto' }}>
            <RoundColumn title="16-imi" slots={r16.slice(0,4)} small/>
          </div>

          {/* QF left */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:'0 0 auto' }}>
            <RoundColumn title="Sferturi" slots={qf.slice(0,2)}/>
          </div>

          {/* Semis + Final */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:24, flex:'0 0 auto' }}>
            <RoundColumn title="Semifinale" slots={sf}/>
          </div>

          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:'0 0 auto' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(212,175,55,0.7)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:2, whiteSpace:'nowrap', padding:'3px 8px', background:'rgba(212,175,55,0.08)', borderRadius:20, border:'1px solid rgba(212,175,55,0.15)' }}>
                🏆 Finala
              </div>
              <BracketSlot {...final[0]}/>
            </div>
          </div>

          {/* QF right */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:'0 0 auto' }}>
            <RoundColumn title="Sferturi" slots={qf.slice(2,4)}/>
          </div>

          {/* Right side R16 */}
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', flex:'0 0 auto' }}>
            <RoundColumn title="16-imi" slots={r16.slice(4,8)} small/>
          </div>

          {/* Right side R32 */}
          <RoundColumn title="Optimi (3)" slots={rightSide.slice(0,4)} small/>
          <RoundColumn title="Optimi (4)" slots={rightSide.slice(4,8)} small/>
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding:'0 14px', marginTop:4 }}>
        <div style={{ padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, fontSize:11, color:'rgba(255,255,255,0.25)', lineHeight:1.7 }}>
          <strong style={{ color:'rgba(255,255,255,0.4)' }}>Format: </strong>
          32 de echipe calificate (12 × 1°, 12 × 2°, 8 × cele mai bune 3°).
          Scroll orizontal pentru tabloul complet.
        </div>
      </div>
    </div>
  );
}
