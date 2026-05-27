import { useState } from 'react';
import { ScoreInput, StepInput, PossessionInput } from '../components/UI.jsx';
import { MATCHES, formatTime } from '../lib/data.js';

function AdminScreen() {
  const [sel,setSel]=useState(null);
  const [sA,setSA]=useState(0);
  const [sB,setSB]=useState(0);
  const [poss,setPoss]=useState(50);
  const [corn,setCorn]=useState(8);
  const [saved,setSaved]=useState(false);
  return (
    <div style={{ padding:"0 16px" }}>
      <div style={{ background:"rgba(255,107,107,0.08)",border:"1px solid rgba(255,107,107,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,marginTop:12 }}>
        <div style={{ fontSize:12,color:"#FF6B6B",fontWeight:700,marginBottom:2 }}>⚙️ Panou Admin</div>
        <div style={{ fontSize:12,color:"#555" }}>Selectează meciul și introdu rezultatele reale.</div>
      </div>
      <div style={{ maxHeight:280,overflowY:"auto" }}>
        {MATCHES.map(m=>(
          <div key={m.id} onClick={()=>{setSel(m);setSaved(false);setSA(0);setSB(0);setPoss(50);setCorn(8);}} style={{ padding:"10px 12px",borderRadius:10,marginBottom:6,cursor:"pointer",background:sel?.id===m.id?"rgba(0,229,160,0.07)":"rgba(255,255,255,0.03)",border:`1px solid ${sel?.id===m.id?"rgba(0,229,160,0.25)":"rgba(255,255,255,0.06)"}`,transition:"all 0.2s" }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:"#fff",fontWeight:600,fontSize:12 }}>{m.flagA} {m.teamA} – {m.teamB} {m.flagB}</span>{m.isFinished&&<span style={{ fontSize:10,color:"#00E5A0" }}>✓</span>}</div>
            <div style={{ fontSize:10,color:"#444",marginTop:1 }}>{formatTime(m.time)} · Gr. {m.group}</div>
          </div>
        ))}
      </div>
      {sel&&<div style={{ marginTop:14,background:"rgba(255,255,255,0.03)",borderRadius:14,padding:18,border:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize:12,color:"#aaa",marginBottom:16,fontWeight:600 }}>{sel.flagA} {sel.teamA} vs {sel.teamB} {sel.flagB}</div>
        <div style={{ display:"flex",gap:16,justifyContent:"center",marginBottom:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11,color:"#555",marginBottom:6 }}>{sel.teamA}</div>
            <ScoreInput value={sA} onChange={setSA}/>
          </div>
          <div style={{ display:"flex",alignItems:"center",fontSize:18,color:"#333",fontWeight:700,paddingTop:20 }}>–</div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11,color:"#555",marginBottom:6 }}>{sel.teamB}</div>
            <ScoreInput value={sB} onChange={setSB}/>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <PossessionInput value={poss} onChange={setPoss} teamA={sel.teamA} teamB={sel.teamB} flagA={sel.flagA} flagB={sel.flagB}/>
        </div>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}>
          <StepInput value={corn} onChange={setCorn} min={0} max={25} label="Cornere totale" unit="" color="#FFD700" wide/>
        </div>
        <button onClick={()=>setSaved(true)} style={{ width:"100%",padding:14,background:saved?"rgba(0,229,160,0.15)":"rgba(255,107,107,0.15)",border:`1px solid ${saved?"#00E5A055":"#FF6B6B44"}`,borderRadius:12,color:saved?"#00E5A0":"#FF6B6B",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.2s" }}>
          {saved?"✓ Rezultat salvat! Clasamentul se actualizează.":"Salvează rezultat real"}
        </button>
      </div>}
    </div>
  );
}

export default AdminScreen;
