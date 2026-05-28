// ─── src/components/PredictionModal.jsx ───────────────────────────────────────
import { useState } from 'react';
import { ScoreInput, StepInput, PossessionInput } from './UI.jsx';
import { formatKickoffRO } from '../data/gameData.js';

export default function PredictionModal({ match, existing, onSave, onClose }) {
  const [sA,   setSA]   = useState(existing?.scoreA     ?? 1);
  const [sB,   setSB]   = useState(existing?.scoreB     ?? 1);
  const [poss, setPoss] = useState(existing?.possession ?? 50);
  const [corn, setCorn] = useState(existing?.corners    ?? 9);
  const [saved, setSaved] = useState(false);

  const result = sA > sB ? match.teamA : sA < sB ? match.teamB : "Egal";
  const resultColor = sA > sB ? "#00E5A0" : sA < sB ? "#FF6B6B" : "#FFD700";

  const save = () => {
    onSave(match.id, { scoreA:sA, scoreB:sB, possession:poss, corners:corn });
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", justifyContent:"flex-end", animation:"fadeIn 0.15s" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:"linear-gradient(180deg,#111820,#0A0E14)",
        borderRadius:"24px 24px 0 0",
        padding:"24px 20px 40px",
        border:"1px solid rgba(255,255,255,0.08)", borderBottom:"none",
        animation:"slideUp 0.3s cubic-bezier(0.34,1.1,0.64,1)",
        maxHeight:"93dvh", overflowY:"auto",
      }}>
        {/* Drag handle */}
        <div style={{ width:40, height:4, background:"rgba(255,255,255,0.15)", borderRadius:2, margin:"0 auto 22px" }}/>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:"rgba(0,229,160,0.7)", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>
              Grupă {match.group} · {match.venue}
            </div>
            <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>
              {match.flagA} {match.teamA} vs {match.teamB} {match.flagB}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{formatKickoffRO(match.time)}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:24, cursor:"pointer", padding:4 }}>×</button>
        </div>

        {/* Score section */}
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:18, padding:20, marginBottom:10, border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:18, textAlign:"center", fontWeight:600 }}>Scor final</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>{match.flagA}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:12, fontWeight:600 }}>{match.teamA}</div>
              <ScoreInput value={sA} onChange={setSA}/>
            </div>
            <div style={{ textAlign:"center", padding:"0 8px" }}>
              <div style={{ fontSize:11, fontWeight:700, padding:"5px 12px", borderRadius:20, background:`${resultColor}18`, color:resultColor, border:`1px solid ${resultColor}28`, transition:"all 0.25s", whiteSpace:"nowrap", marginBottom:8 }}>
                {result}
              </div>
              <div style={{ fontSize:22, color:"rgba(255,255,255,0.2)", fontWeight:300 }}>–</div>
            </div>
            <div style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:32, marginBottom:4 }}>{match.flagB}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:12, fontWeight:600 }}>{match.teamB}</div>
              <ScoreInput value={sB} onChange={setSB}/>
            </div>
          </div>
        </div>

        {/* Possession section */}
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:18, padding:"16px 18px", marginBottom:10, border:"1px solid rgba(255,255,255,0.06)" }}>
          <PossessionInput value={poss} onChange={setPoss} teamA={match.teamA} teamB={match.teamB} flagA={match.flagA} flagB={match.flagB}/>
        </div>

        {/* Corners section */}
        <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:18, padding:"16px 18px", marginBottom:18, border:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"center" }}>
          <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
        </div>

        {/* Max pts */}
        <div style={{ background:"rgba(0,229,160,0.05)", borderRadius:12, padding:"10px 16px", marginBottom:16, border:"1px solid rgba(0,229,160,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"rgba(0,229,160,0.5)" }}>Max puncte posibile</span>
          <span style={{ fontSize:18, fontWeight:900, color:"#00E5A0", fontFamily:"'DM Mono',monospace" }}>200 pts</span>
        </div>

        {/* Save button */}
        <button
          onClick={save}
          style={{
            width:"100%", padding:18,
            background: saved ? "linear-gradient(135deg,#00C27A,#009960)" : "linear-gradient(135deg,#00E5A0,#00C27A)",
            border:"none", borderRadius:14, color:"#060C09",
            fontSize:17, fontWeight:900, cursor:"pointer",
            fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.08em",
            boxShadow: saved ? "none" : "0 8px 24px rgba(0,229,160,0.25)",
            transition:"all 0.2s",
            animation: saved ? "none" : "breatheGreen 2s ease-in-out infinite",
          }}
        >
          {saved ? "✓ SALVAT!" : "🔒 SALVEAZĂ PREDICȚIA"}
        </button>
      </div>
    </div>
  );
}
