// ─── src/components/PredictionModal.jsx ───────────────────────────────────────
// Compact prediction modal with smooth possession drag.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import { ScoreInput, StepInput } from './UI.jsx';
import { formatKickoffRO } from '../data/gameData.js';

// ─── SMOOTH POSSESSION SLIDER ─────────────────────────────────────────────────
// Uses pointer events for smooth continuous drag on mobile (no lag/jumps).
function PossessionSlider({ value, onChange, teamA, teamB, flagA, flagB }) {
  const trackRef  = useRef(null);
  const dragging  = useRef(false);
  const [draft, setDraft] = useState(null); // live value while dragging

  const calcPct = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return value;
    const x   = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left;
    const pct = Math.round((x / rect.width) * 100);
    return Math.max(20, Math.min(80, pct));
  }, [value]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setDraft(calcPct(e));
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setDraft(calcPct(e));
  };
  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    const final = calcPct(e);
    setDraft(null);
    onChange(final);
  };

  const display = draft ?? value;
  const away    = 100 - display;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{flagA} {display}%</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Posesie</span>
        <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{away}% {flagB}</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position:'relative', height:32, borderRadius:16, cursor:'ew-resize',
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          overflow:'hidden', touchAction:'none', userSelect:'none',
        }}
      >
        {/* Home fill */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${display}%`, background:'linear-gradient(90deg,rgba(74,158,255,0.45),rgba(74,158,255,0.25))', transition:dragging.current?'none':'width 0.12s' }}/>
        {/* Away fill */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${away}%`, background:'linear-gradient(270deg,rgba(239,68,68,0.3),rgba(239,68,68,0.15))', transition:dragging.current?'none':'width 0.12s' }}/>
        {/* Center line */}
        <div style={{ position:'absolute', left:'50%', top:'20%', bottom:'20%', width:1, background:'rgba(255,255,255,0.1)' }}/>
        {/* Thumb */}
        <div style={{
          position:'absolute', top:'50%', left:`${display}%`,
          transform:'translate(-50%,-50%)',
          width:24, height:24, borderRadius:'50%',
          background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.5)',
          transition:dragging.current?'none':'left 0.12s',
        }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:10, color:'rgba(255,255,255,0.2)' }}>
        <span>{teamA}</span>
        <span>{teamB}</span>
      </div>
    </div>
  );
}

// ─── PREDICTION MODAL ─────────────────────────────────────────────────────────
export default function PredictionModal({ match, existing, onSave, onClose }) {
  const [sA,   setSA]   = useState(existing?.scoreA     ?? 1);
  const [sB,   setSB]   = useState(existing?.scoreB     ?? 1);
  const [poss, setPoss] = useState(existing?.possession ?? 50);
  const [corn, setCorn] = useState(existing?.corners    ?? 9);
  const [saved, setSaved] = useState(false);

  const result      = sA > sB ? match.teamA : sA < sB ? match.teamB : 'Egal';
  const resultColor = sA > sB ? '#00E5A0'   : sA < sB ? '#FF6B6B'   : '#FFD700';

  const save = () => {
    onSave(match.id, { scoreA:sA, scoreB:sB, possession:poss, corners:corn });
    setSaved(true);
    setTimeout(onClose, 600);
  };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', justifyContent:'flex-end', animation:'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:'linear-gradient(180deg,#111820,#0A0E14)',
        borderRadius:'22px 22px 0 0', padding:'18px 18px 32px',
        border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none',
        animation:'slideUp 0.28s cubic-bezier(0.34,1.1,0.64,1)',
        maxHeight:'88dvh', overflowY:'auto',
      }}>
        {/* Handle */}
        <div style={{ width:36, height:3, background:'rgba(255,255,255,0.18)', borderRadius:2, margin:'0 auto 16px' }}/>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:9, color:'rgba(0,229,160,0.65)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, marginBottom:3 }}>
              Grupă {match.group} · {match.venue}
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>
              {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{formatKickoffRO(match.time)}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:22, cursor:'pointer', padding:4, lineHeight:1 }}>×</button>
        </div>

        {/* Score */}
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'16px 14px', marginBottom:8, border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:28, marginBottom:3 }}>{match.flagA}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginBottom:10, fontWeight:600 }}>{match.teamA}</div>
              <ScoreInput value={sA} onChange={setSA}/>
            </div>
            <div style={{ textAlign:'center', padding:'0 6px' }}>
              <div style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:18, background:`${resultColor}15`, color:resultColor, border:`1px solid ${resultColor}25`, transition:'all 0.2s', whiteSpace:'nowrap', marginBottom:6 }}>
                {result}
              </div>
              <div style={{ fontSize:20, color:'rgba(255,255,255,0.18)', fontWeight:300 }}>–</div>
            </div>
            <div style={{ textAlign:'center', flex:1 }}>
              <div style={{ fontSize:28, marginBottom:3 }}>{match.flagB}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginBottom:10, fontWeight:600 }}>{match.teamB}</div>
              <ScoreInput value={sB} onChange={setSB}/>
            </div>
          </div>
        </div>

        {/* Possession — smooth slider */}
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'14px 14px', marginBottom:8, border:'1px solid rgba(255,255,255,0.06)' }}>
          <PossessionSlider value={poss} onChange={setPoss} teamA={match.teamA} teamB={match.teamB} flagA={match.flagA} flagB={match.flagB}/>
        </div>

        {/* Corners */}
        <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:14, padding:'12px 14px', marginBottom:14, border:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'center' }}>
          <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
        </div>

        {/* Max pts */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'rgba(0,229,160,0.04)', border:'1px solid rgba(0,229,160,0.1)', borderRadius:10, marginBottom:12 }}>
          <span style={{ fontSize:11, color:'rgba(0,229,160,0.45)' }}>Max puncte posibile</span>
          <span style={{ fontSize:17, fontWeight:900, color:'#00E5A0', fontFamily:"'DM Mono',monospace" }}>200 pts</span>
        </div>

        {/* Save */}
        <button onClick={save} style={{
          width:'100%', padding:16,
          background: saved ? 'linear-gradient(135deg,#00C27A,#009960)' : 'linear-gradient(135deg,#00E5A0,#00C27A)',
          border:'none', borderRadius:13, color:'#060C09',
          fontSize:16, fontWeight:900, cursor:'pointer',
          fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em',
          boxShadow: saved ? 'none' : '0 6px 20px rgba(0,229,160,0.22)',
          transition:'all 0.18s',
        }}>
          {saved ? '✓ SALVAT!' : '🔒 SALVEAZĂ PREDICȚIA'}
        </button>
      </div>
    </div>
  );
}
