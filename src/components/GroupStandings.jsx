// ─── src/components/GroupStandings.jsx ───────────────────────────────────────
// FIFA-style group standings: J V E Î GM GP GD Pct
// Shows head-to-head tiebreaker explanations when teams are level on points.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { buildGroupStandings } from '../data/gameData.js';

const HEADERS = ['Echipă','J','V','E','Î','GM','GP','GD','Pct'];
const COLS    = '1fr 20px 20px 20px 20px 24px 24px 28px 32px';

export default function GroupStandings({ group, finishedResults, overrideOrder }) {
  const [open, setOpen] = useState(false);
  const calculated = buildGroupStandings(group, finishedResults || {});

  // Apply admin override if present — preserves all stats, changes only display order
  const rows = overrideOrder
    ? overrideOrder.map(teamName => calculated.find(r => r.team === teamName)).filter(Boolean)
    : calculated;

  const hasData = rows.some(r => r.p > 0);

  return (
    <div style={{ marginBottom:6 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'8px 12px', cursor:'pointer', userSelect:'none',
          background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
          borderRadius: open ? '8px 8px 0 0' : 8, transition:'border-radius 0.2s',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10 }}>📊</span>
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Clasament grupă
          </span>
          {overrideOrder && (
            <span style={{ fontSize:8, color:'#F59E0B', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>
              OVERRIDE
            </span>
          )}
          {!hasData && <span style={{ fontSize:9, color:'rgba(255,255,255,0.15)', fontStyle:'italic' }}>— după meciuri</span>}
        </div>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)', transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </div>

      {open && (
        <div style={{ background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.05)', borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden', animation:'revealFlip 0.18s ease' }}>
          {/* Headers */}
          <div style={{ display:'grid', gridTemplateColumns:COLS, padding:'5px 10px', gap:0, borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
            {HEADERS.map((h, i) => (
              <div key={i} style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:700, textAlign:i===0?'left':'center', letterSpacing:'0.05em' }}>
                {h}
              </div>
            ))}
          </div>

          {rows.map((r, i) => {
            const isQ    = i < 2;
            const isMaybe = i === 2;
            return (
              <div key={r.team}>
                <div
                  style={{
                    display:'grid', gridTemplateColumns:COLS,
                    padding:'7px 10px', gap:0,
                    borderBottom:'1px solid rgba(255,255,255,0.04)',
                    background: isQ ? 'rgba(0,229,160,0.03)' : isMaybe ? 'rgba(74,158,255,0.02)' : 'transparent',
                  }}
                >
                  {/* Team */}
                  <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:0 }}>
                    <div style={{ width:3, height:16, borderRadius:2, flexShrink:0, background: isQ?'#00E5A0':isMaybe?'#4A9EFF':'rgba(255,255,255,0.08)' }}/>
                    <span style={{ fontSize:14 }}>{r.flag}</span>
                    <span style={{ fontSize:11, color:'#fff', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.team}</span>
                  </div>
                  {/* J V E Î */}
                  {[r.p, r.w, r.d, r.l].map((v, j) => (
                    <div key={j} style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{v}</div>
                  ))}
                  {/* GM GP */}
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{r.gf}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>{r.ga}</div>
                  {/* GD */}
                  <div style={{ fontSize:11, textAlign:'center', fontFamily:"'DM Mono',monospace", color: r.gd>0?'#00E5A0':r.gd<0?'rgba(239,68,68,0.7)':'rgba(255,255,255,0.35)' }}>
                    {r.gd > 0 ? '+' : ''}{r.gd}
                  </div>
                  {/* Pct */}
                  <div style={{ fontSize:13, fontWeight:800, color: isQ?'#00E5A0':isMaybe?'#4A9EFF':'rgba(255,255,255,0.5)', textAlign:'center', fontFamily:"'DM Mono',monospace" }}>
                    {r.pts}
                  </div>
                </div>
                {/* Tiebreaker explanation */}
                {r.tieBreaker && (
                  <div style={{ padding:'2px 12px 4px', background:'rgba(245,158,11,0.04)', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize:9, color:'rgba(245,158,11,0.45)', fontStyle:'italic' }}>
                      {r.tieBreaker}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ display:'flex', gap:12, padding:'6px 10px', background:'rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:3, height:10, borderRadius:2, background:'#00E5A0' }}/>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>Calificat direct</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:3, height:10, borderRadius:2, background:'#4A9EFF' }}/>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>Posibil calificat (3°)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
