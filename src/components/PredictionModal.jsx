// ─── src/components/PredictionModal.jsx ──────────────────────────────────────
// Bottom-sheet prediction entry modal.
// Enforces lock: if match.isLocked is true, the modal shows a read-only view
// and the save button is disabled — so no prediction can be submitted after
// the automatic 30-minute lock kicks in.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { ScoreInput, StepInput, PossessionInput } from './UI.jsx';
import { formatKickoffRO, matchLockState, calcBreakdown } from '../data/gameData.js';

export default function PredictionModal({ match, existing, onSave, onClose }) {
  const [sA,   setSA]   = useState(existing?.scoreA   ?? 1);
  const [sB,   setSB]   = useState(existing?.scoreB   ?? 1);
  const [poss, setPoss] = useState(existing?.possession ?? 4);
  const [corn, setCorn] = useState(existing?.corners   ?? 9);
  const [saved, setSaved] = useState(false);

  if (!match) return null;

  const lockInfo   = matchLockState(match);
  const isEditable = lockInfo.state === 'open' || lockInfo.state === 'soon';
  const breakdown  = match.isFinished && existing
    ? calcBreakdown(existing, match)
    : null;

  const result = sA > sB ? match.teamA : sA < sB ? match.teamB : 'Egal';

  const handleSave = () => {
    if (!isEditable) return;
    onSave(match.id, { scoreA: sA, scoreB: sB, possession: poss, corners: corn });
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div
      style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',justifyContent:'flex-end',animation:'fadeIn 0.2s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'linear-gradient(180deg,#0E1A14,#080C09)',borderRadius:'24px 24px 0 0',padding:'20px 20px 40px',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none',animation:'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)',maxHeight:'92dvh',overflowY:'auto' }}>

        {/* Handle */}
        <div style={{ width:40,height:4,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0 auto 18px' }}/>

        {/* Header */}
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10,color:'#00E5A0',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3 }}>
              Grupă {match.group} · {match.venue || ''}
            </div>
            <div style={{ fontSize:16,fontWeight:800,color:'#fff' }}>
              {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
            </div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2 }}>
              {formatKickoffRO(match.time)}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:24,cursor:'pointer',alignSelf:'flex-start',padding:'0 0 0 12px' }}>×</button>
        </div>

        {/* Lock banner */}
        {!isEditable && (
          <div style={{ marginBottom:14,padding:'10px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:14 }}>🔒</span>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:'rgba(239,68,68,0.9)' }}>{lockInfo.label}</div>
              <div style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>Predicțiile sunt blocate pentru acest meci.</div>
            </div>
          </div>
        )}

        {/* Score result preview */}
        {isEditable && (
          <div style={{ textAlign:'center',marginBottom:14,padding:'8px',background:'rgba(0,229,160,0.04)',borderRadius:10,border:'1px solid rgba(0,229,160,0.1)' }}>
            <span style={{ fontSize:11,color:'rgba(0,229,160,0.6)',fontWeight:600 }}>
              {sA === sB ? '⚖️ Egal' : `🏆 ${result}`}
            </span>
          </div>
        )}

        {/* Score */}
        <div style={{ background:'rgba(255,255,255,0.03)',borderRadius:14,padding:'16px 14px',marginBottom:10,border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14,textAlign:'center' }}>Scor final</div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
            <div style={{ flex:1,textAlign:'center' }}>
              <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.55)',marginBottom:8 }}>
                {match.flagA} {match.teamA}
              </div>
              {isEditable
                ? <ScoreInput value={sA} onChange={setSA}/>
                : <div style={{ fontSize:32,fontWeight:900,color:'#fff',fontFamily:"'DM Mono',monospace" }}>{sA}</div>
              }
            </div>
            <div style={{ fontSize:18,fontWeight:700,color:'rgba(255,255,255,0.2)',flexShrink:0 }}>–</div>
            <div style={{ flex:1,textAlign:'center' }}>
              <div style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.55)',marginBottom:8 }}>
                {match.flagB} {match.teamB}
              </div>
              {isEditable
                ? <ScoreInput value={sB} onChange={setSB}/>
                : <div style={{ fontSize:32,fontWeight:900,color:'#fff',fontFamily:"'DM Mono',monospace" }}>{sB}</div>
              }
            </div>
          </div>
        </div>

        {/* Cartonașe + Cornere */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
          <div style={{ background:'rgba(255,255,255,0.03)',borderRadius:12,padding:'12px 10px',border:'1px solid rgba(255,255,255,0.05)' }}>
            <StepInput
              label="Cornere totale" value={corn} onChange={isEditable ? setCorn : () => {}}
              min={0} max={30} unit="corner" color="#F59E0B"
            />
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)',borderRadius:12,padding:'12px 10px',border:'1px solid rgba(255,255,255,0.05)' }}>
            <PossessionInput
              value={poss} onChange={isEditable ? setPoss : () => {}}
            />
          </div>
        </div>

        {/* Points breakdown if finished */}
        {breakdown && (
          <div style={{ marginBottom:14,padding:'10px 14px',background:'rgba(0,229,160,0.06)',border:'1px solid rgba(0,229,160,0.15)',borderRadius:10 }}>
            <div style={{ fontSize:10,color:'rgba(0,229,160,0.6)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6,fontWeight:700 }}>Puncte câștigate</div>
            {[
              { label:'Scor exact', pts: breakdown.exactScore   ? 100 : 0 },
              { label:'Câștigător', pts: breakdown.correctWinner ? 30  : 0 },
              { label:'Cartonașe', pts: breakdown.possessionPts || 0 },
              { label:'Cornere',    pts: breakdown.cornersPts    || 0 },
            ].map(r => r.pts > 0 && (
              <div key={r.label} style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                <span style={{ fontSize:11,color:'rgba(255,255,255,0.45)' }}>{r.label}</span>
                <span style={{ fontSize:11,fontWeight:700,color:'#00E5A0',fontFamily:"'DM Mono',monospace" }}>+{r.pts}</span>
              </div>
            ))}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',marginTop:6,paddingTop:6,display:'flex',justifyContent:'space-between' }}>
              <span style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.5)' }}>Total</span>
              <span style={{ fontSize:16,fontWeight:900,color:'#fff',fontFamily:"'DM Mono',monospace" }}>+{breakdown.total} pts</span>
            </div>
          </div>
        )}

        {/* Save button */}
        {isEditable && (
          <button
            onClick={handleSave}
            disabled={saved}
            style={{ width:'100%',padding:15,background:saved?'rgba(0,229,160,0.3)':'linear-gradient(135deg,#00E5A0,#00C27A)',border:'none',borderRadius:13,color:'#060C09',fontSize:16,fontWeight:900,cursor:saved?'default':'pointer',fontFamily:"'Bebas Neue',sans-serif",letterSpacing:'0.08em',transition:'all 0.2s',boxShadow:saved?'none':'0 6px 20px rgba(0,229,160,0.22)' }}
          >
            {saved ? '✓ Salvat!' : 'SALVEAZĂ PREDICȚIA →'}
          </button>
        )}
      </div>
    </div>
  );
}
