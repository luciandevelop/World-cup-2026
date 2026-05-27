import { useState } from 'react';
import { GoogleLogo } from './UI.jsx';
import { TAKEN_NICKNAMES } from '../lib/data.js';

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onGoogleLogin }) {
  const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setTimeout(() => onGoogleLogin({ email:"user@gmail.com", name:"Radu Popescu", avatar:"R" }), 1400); };
  return (
    <div style={{ minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse 80% 60% at 50% 0%,#0D2E1A,#080C09)",padding:24,position:"relative",overflow:"hidden" }}>
      <div style={{ position:"absolute",top:-120,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,#00E5A018,transparent 70%)",pointerEvents:"none" }}/>
      <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:360,textAlign:"center" }}>
        <div style={{ fontSize:72,marginBottom:16,animation:"float 3s ease-in-out infinite",filter:"drop-shadow(0 0 32px #FFD70055)" }}>🏆</div>
        <div style={{ fontSize:11,letterSpacing:"0.25em",textTransform:"uppercase",color:"#00E5A0",fontWeight:600,marginBottom:8 }}>FIFA World Cup 2026</div>
        <h1 style={{ fontSize:38,fontWeight:900,color:"#fff",margin:"0 0 10px",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em",lineHeight:1.1 }}>PREDICȚII<br/><span style={{ color:"#00E5A0" }}>& GLORIE</span></h1>
        <p style={{ fontSize:14,color:"#555",marginBottom:48,lineHeight:1.6 }}>48 de echipe. 104 meciuri.<br/>Tu și prietenii tăi — cine ghicește mai bine?</p>
        <button onClick={go} disabled={loading} style={{ width:"100%",padding:"16px 20px",background:loading?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,color:loading?"#555":"#fff",fontSize:15,fontWeight:700,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,transition:"all 0.2s" }}>
          {loading ? <><div style={{ width:20,height:20,border:"2px solid #333",borderTopColor:"#00E5A0",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/><span>Se conectează...</span></> : <><GoogleLogo/><span>Continuă cu Google</span></>}
        </button>
        <div style={{ marginTop:24,display:"flex",flexDirection:"column",gap:7 }}>
          {["🔒 Contul tău e protejat — nimeni nu-ți poate fura nickname-ul","⚡ Un singur click, fără parole","🌍 48 de echipe reale, meciuri reale"].map((t,i)=>(
            <div key={i} style={{ fontSize:12,color:"#444",textAlign:"left",padding:"8px 12px",background:"rgba(255,255,255,0.02)",borderRadius:8 }}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PICK NICKNAME ────────────────────────────────────────────────────────────
function NicknameScreen({ googleUser, onComplete }) {
  const [nick, setNick] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  let timer = null;
  const check = val => {
    setNick(val); setStatus(val.length >= 3 ? "checking" : null);
    clearTimeout(timer);
    if (val.length >= 3) timer = setTimeout(() => setStatus(TAKEN_NICKNAMES.map(n=>n.toLowerCase()).includes(val.toLowerCase()) ? "taken" : "ok"), 600);
  };
  const save = () => { if (status !== "ok") return; setSaving(true); setTimeout(() => onComplete(nick), 900); };
  const base = googleUser.name ? googleUser.name.split(" ")[0] : "Player";
  const sugg = [base + "FC", base + "Goat", base + (base.length * 7 % 89 + 10)];
  const border = status==="ok"?"#00E5A0":status==="taken"?"#FF6B6B":"rgba(255,255,255,0.1)";
  return (
    <div style={{ minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse 80% 60% at 50% 0%,#0D2E1A,#080C09)",padding:24 }}>
      <div style={{ width:"100%",maxWidth:360 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"12px 16px",marginBottom:32 }}>
          <div style={{ width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#4285F4,#34A853)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff" }}>{googleUser.avatar}</div>
          <div><div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>{googleUser.name}</div><div style={{ fontSize:11,color:"#555" }}>{googleUser.email}</div></div>
          <div style={{ marginLeft:"auto",fontSize:10,color:"#00E5A0",background:"rgba(0,229,160,0.1)",padding:"3px 8px",borderRadius:20 }}>✓ Google</div>
        </div>
        <div style={{ fontSize:11,color:"#00E5A0",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8 }}>Pasul final</div>
        <h2 style={{ fontSize:28,fontWeight:900,color:"#fff",margin:"0 0 8px",fontFamily:"'Bebas Neue',sans-serif" }}>Alege-ți NICKNAME-UL</h2>
        <p style={{ fontSize:13,color:"#555",marginBottom:28,lineHeight:1.5 }}>Ăsta apare în clasament. Prietenii tăi îl vor vedea. 😈</p>
        <div style={{ position:"relative",marginBottom:10 }}>
          <input value={nick} onChange={e=>check(e.target.value.replace(/\s/g,"").slice(0,20))} placeholder="ex: RaduGoalMaster" onKeyDown={e=>e.key==="Enter"&&save()} autoFocus style={{ width:"100%",padding:"16px 48px 16px 16px",background:"rgba(255,255,255,0.05)",border:`1px solid ${border}`,borderRadius:14,color:"#fff",fontSize:17,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color 0.25s" }}/>
          <div style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:18 }}>
            {status==="checking"&&<div style={{ width:16,height:16,border:"2px solid #333",borderTopColor:"#00E5A0",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>}
            {status==="ok"&&<span style={{ color:"#00E5A0" }}>✓</span>}
            {status==="taken"&&<span style={{ color:"#FF6B6B" }}>✗</span>}
          </div>
        </div>
        <div style={{ minHeight:20,marginBottom:16,fontSize:12 }}>
          {status==="taken"&&<span style={{ color:"#FF6B6B" }}>❌ Deja luat. Încearcă altul.</span>}
          {status==="ok"&&<span style={{ color:"#00E5A0" }}>✅ Disponibil!</span>}
          {!status&&nick.length>0&&nick.length<3&&<span style={{ color:"#555" }}>Minim 3 caractere</span>}
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11,color:"#444",marginBottom:8 }}>Sugestii:</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            {sugg.map((s,i)=><button key={i} onClick={()=>check(s)} style={{ padding:"6px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"#aaa",fontSize:12,cursor:"pointer" }}>{s}</button>)}
          </div>
        </div>
        <button onClick={save} disabled={status!=="ok"||saving} style={{ width:"100%",padding:18,background:status==="ok"&&!saving?"linear-gradient(135deg,#00E5A0,#00C27A)":"rgba(255,255,255,0.05)",border:"none",borderRadius:14,color:status==="ok"&&!saving?"#060C09":"#333",fontSize:17,fontWeight:900,cursor:status==="ok"&&!saving?"pointer":"default",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.06em",boxShadow:status==="ok"?"0 8px 32px #00E5A044":"none",transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          {saving?<><div style={{ width:18,height:18,border:"2px solid #060C09",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }}/>Intru...</>:"INTRĂ ÎN JOC →"}
        </button>
      </div>
    </div>
  );
}

export { LoginScreen, NicknameScreen };
