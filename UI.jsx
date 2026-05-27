import { useRef } from 'react';

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange, disabled }) {
  return (
    <div style={{ display:"flex", alignItems:"center", background: disabled?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", overflow:"hidden" }}>
      <button onClick={() => !disabled && onChange(Math.max(0,value-1))} disabled={disabled} style={{ width:36,height:44,background:"transparent",border:"none",color:disabled?"#333":"#aaa",fontSize:18,cursor:disabled?"default":"pointer" }}>−</button>
      <span style={{ width:32,textAlign:"center",fontSize:22,fontWeight:700,color:disabled?"#444":"#fff",fontFamily:"'DM Mono',monospace" }}>{value}</span>
      <button onClick={() => !disabled && onChange(Math.min(20,value+1))} disabled={disabled} style={{ width:36,height:44,background:"transparent",border:"none",color:disabled?"#333":"#aaa",fontSize:18,cursor:disabled?"default":"pointer" }}>+</button>
    </div>
  );
}
// Step stepper: [-] value [+]
function StepInput({ value, onChange, min, max, label, unit, color="#00E5A0", wide=false }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:10,color:"#555",letterSpacing:"0.08em",textTransform:"uppercase" }}>{label}</span>
      <div style={{ display:"flex",alignItems:"center",background:"rgba(255,255,255,0.06)",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",overflow:"hidden" }}>
        <button onClick={()=>onChange(Math.max(min,value-1))} style={{ width:wide?44:38,height:44,background:"transparent",border:"none",color:"#aaa",fontSize:20,cursor:"pointer",transition:"color 0.15s" }}
          onMouseDown={e=>e.currentTarget.style.color=color} onMouseUp={e=>e.currentTarget.style.color="#aaa"}>−</button>
        <span style={{ minWidth:wide?52:36,textAlign:"center",fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'DM Mono',monospace" }}>{value}{unit}</span>
        <button onClick={()=>onChange(Math.min(max,value+1))} style={{ width:wide?44:38,height:44,background:"transparent",border:"none",color:"#aaa",fontSize:20,cursor:"pointer",transition:"color 0.15s" }}
          onMouseDown={e=>e.currentTarget.style.color=color} onMouseUp={e=>e.currentTarget.style.color="#aaa"}>+</button>
      </div>
    </div>
  );
}
// Possession: draggable split bar, 20-80%, step 1%
function PossessionInput({ value, onChange, teamA, teamB, flagA, flagB }) {
  const away = 100 - value;
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const posFromEvent = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const raw = (clientX - rect.left) / rect.width;
    return Math.round(Math.min(80, Math.max(20, raw * 100)));
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    trackRef.current.setPointerCapture(e.pointerId);
    onChange(posFromEvent(e.clientX));
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    onChange(posFromEvent(e.clientX));
  };
  const onPointerUp = () => { dragging.current = false; };

  const homePct   = value;
  const awayPct   = away;
  const handlePct = ((value - 20) / 60) * 100;

  return (
    <div>
      <div style={{ fontSize:10,color:"#555",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,textAlign:"center" }}>Posesie</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:11,color:"#aaa",fontWeight:600,marginBottom:2 }}>{flagA} {teamA}</div>
          <div style={{ fontSize:22,fontWeight:900,color:"#4A9EFF",fontFamily:"'DM Mono',monospace",lineHeight:1 }}>{homePct}%</div>
        </div>
        <div style={{ fontSize:12,color:"#333",fontWeight:700 }}>—</div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11,color:"#aaa",fontWeight:600,marginBottom:2 }}>{flagB} {teamB}</div>
          <div style={{ fontSize:22,fontWeight:900,color:"#7B5EA7",fontFamily:"'DM Mono',monospace",lineHeight:1 }}>{awayPct}%</div>
        </div>
      </div>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ position:"relative",height:36,borderRadius:18,overflow:"hidden",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",cursor:"ew-resize",userSelect:"none",touchAction:"none" }}
      >
        <div style={{ position:"absolute",inset:0,right:`${awayPct}%`,background:"linear-gradient(90deg,#4A9EFF33,#4A9EFF55)",borderRadius:"18px 0 0 18px",transition:"right 0.05s" }}/>
        <div style={{ position:"absolute",inset:0,left:`${homePct}%`,background:"linear-gradient(90deg,#7B5EA733,#7B5EA755)",borderRadius:"0 18px 18px 0",transition:"left 0.05s" }}/>
        <div style={{ position:"absolute",top:"50%",left:`${handlePct}%`,transform:"translate(-50%,-50%)",width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#4A9EFF,#7B5EA7)",boxShadow:"0 0 0 3px rgba(255,255,255,0.12),0 2px 8px rgba(0,0,0,0.5)",transition:"left 0.05s",pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ width:2,height:10,borderRadius:1,background:"rgba(255,255,255,0.6)" }}/>
        </div>
        <div style={{ position:"absolute",top:0,bottom:0,left:"50%",width:1,background:"rgba(255,255,255,0.08)",pointerEvents:"none" }}/>
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#333" }}>
        <span>20%</span><span>50%</span><span>80%</span>
      </div>
    </div>
  );
}
function GoogleLogo() {
  return <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}

export { ScoreInput, StepInput, PossessionInput, GoogleLogo };
