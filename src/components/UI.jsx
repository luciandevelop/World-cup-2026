// ─── src/components/UI.jsx ────────────────────────────────────────────────────
// Shared primitive components used throughout the app.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { getDefaultAvatarForNick, getAvatarById } from '../data/avatars.js';

// ─── GOOGLE LOGO ──────────────────────────────────────────────────────────────
export function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// ─── APPLE LOGO ───────────────────────────────────────────────────────────────
export function AppleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ─── FOOTBALL AVATAR ──────────────────────────────────────────────────────────
// Premium CSS avatar. No external images: badge / kit / trophy / beast rendered in CSS.
export function FootballAvatar({ nickname, avatarId, size = 40, style: extraStyle = {} }) {
  const av = avatarId ? getAvatarById(avatarId) : getDefaultAvatarForNick(nickname || '?');
  const label = String(av.emoji || nickname?.[0] || '?').slice(0, 3).toUpperCase();
  const fontSize = Math.max(9, Math.round(size * (label.length > 2 ? 0.24 : 0.32)));
  const glow = av.shine ? `0 0 ${Math.round(size*0.32)}px ${av.accent}55, inset 0 0 ${Math.round(size*0.3)}px rgba(255,255,255,0.04)` : `inset 0 0 ${Math.round(size*0.25)}px rgba(255,255,255,0.03)`;

  const Jersey = () => (
    <div style={{ position:'relative', width:size*0.48, height:size*0.44, marginTop:size*0.03 }}>
      <div style={{ position:'absolute', left:size*0.03, top:0, width:size*0.14, height:size*0.18, background:av.accent2, transform:'skewY(-22deg)', borderRadius:size*0.025, opacity:0.9 }}/>
      <div style={{ position:'absolute', right:size*0.03, top:0, width:size*0.14, height:size*0.18, background:av.accent2, transform:'skewY(22deg)', borderRadius:size*0.025, opacity:0.9 }}/>
      <div style={{ position:'absolute', left:size*0.11, top:0, width:size*0.26, height:size*0.38, background:`linear-gradient(90deg, ${av.accent} 0 32%, ${av.accent2} 32% 38%, ${av.accent} 38% 100%)`, borderRadius:`${size*0.04}px ${size*0.04}px ${size*0.025}px ${size*0.025}px`, boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.22)' }}/>
      <div style={{ position:'absolute', left:size*0.18, top:size*0.11, width:size*0.13, textAlign:'center', color:av.bg, fontWeight:950, fontFamily:"'DM Mono',monospace", fontSize:Math.max(8,size*0.13), lineHeight:1 }}>{label}</div>
    </div>
  );

  const Trophy = () => (
    <div style={{ position:'relative', width:size*0.46, height:size*0.48 }}>
      <div style={{ position:'absolute', left:size*0.11, top:size*0.02, width:size*0.24, height:size*0.24, borderRadius:'0 0 45% 45%', background:`linear-gradient(135deg,${av.accent},${av.accent2})`, boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.25)' }}/>
      <div style={{ position:'absolute', left:size*0.03, top:size*0.06, width:size*0.1, height:size*0.12, border:`${Math.max(1,size*0.025)}px solid ${av.accent}`, borderRight:'none', borderRadius:'50% 0 0 50%' }}/>
      <div style={{ position:'absolute', right:size*0.03, top:size*0.06, width:size*0.1, height:size*0.12, border:`${Math.max(1,size*0.025)}px solid ${av.accent}`, borderLeft:'none', borderRadius:'0 50% 50% 0' }}/>
      <div style={{ position:'absolute', left:size*0.2, top:size*0.26, width:size*0.06, height:size*0.1, background:av.accent2 }}/>
      <div style={{ position:'absolute', left:size*0.14, bottom:size*0.04, width:size*0.18, height:size*0.05, borderRadius:size*0.02, background:av.accent }}/>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', paddingTop:size*0.02, color:'#07100d', fontWeight:950, fontFamily:"'DM Mono',monospace", fontSize:fontSize*0.92 }}>{label}</div>
    </div>
  );

  const Badge = () => (
    <div style={{ width:size*0.52, height:size*0.52, borderRadius:av.kind==='crest'?'28% 28% 42% 42%':'50%', background:`linear-gradient(145deg,${av.accent} 0%,${av.accent2} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.18)' }}>
      <div style={{ width:'72%', height:'72%', borderRadius:av.kind==='crest'?'25% 25% 38% 38%':'50%', background:`linear-gradient(145deg,${av.bg},rgba(0,0,0,0.72))`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:950, fontFamily:"'DM Mono',monospace", fontSize, letterSpacing:label.length>2?'-0.08em':'0' }}>
        {label}
      </div>
    </div>
  );

  const Beast = () => (
    <div style={{ width:size*0.52, height:size*0.52, borderRadius:'42% 58% 46% 54%', background:`radial-gradient(circle at 35% 30%,${av.accent2},${av.accent} 58%,${av.bg})`, display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(-8deg)', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.2)' }}>
      <span style={{ transform:'rotate(8deg)', color:'#07100d', fontWeight:950, fontFamily:"'DM Mono',monospace", fontSize:fontSize*1.25 }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`radial-gradient(circle at 30% 18%, rgba(255,255,255,0.12), transparent 28%), ${av.bg}`,
      border:`2px solid ${av.accent}88`,
      boxShadow: glow,
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0, position:'relative', overflow:'hidden',
      ...extraStyle,
    }}>
      <div style={{ position:'absolute', inset:2, borderRadius:'50%', border:`1px solid ${av.accent2 || av.accent}33` }}/>
      <div style={{ position:'absolute', left:'-35%', top:'15%', width:'90%', height:'28%', transform:'rotate(-28deg)', background:'rgba(255,255,255,0.08)' }}/>
      {av.kind === 'kit' ? <Jersey/> : av.kind === 'trophy' ? <Trophy/> : av.kind === 'beast' ? <Beast/> : <Badge/>}
    </div>
  );
}

// ─── SCORE INPUT ──────────────────────────────────────────────────────────────
export function ScoreInput({ value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, userSelect:"none" }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width:38, height:38, borderRadius:"10px 0 0 10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}
      >−</button>
      <div style={{ width:44, height:38, background:"rgba(255,255,255,0.08)", borderTop:"1px solid rgba(255,255,255,0.1)", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(20, value + 1))}
        style={{ width:38, height:38, borderRadius:"0 10px 10px 0", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}
      >+</button>
    </div>
  );
}

// ─── STEP INPUT ───────────────────────────────────────────────────────────────
export function StepInput({ value, onChange, min = 0, max = 25, label, unit = "", color = "#4A9EFF", wide = false }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, fontWeight:600 }}>{label}</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
        >−</button>
        <div style={{ minWidth:64, textAlign:"center" }}>
          <span style={{ fontSize:28, fontWeight:800, color, fontFamily:"'DM Mono',monospace" }}>{value}</span>
          {unit && <span style={{ fontSize:13, color:"rgba(255,255,255,0.25)", marginLeft:4 }}>{unit}</span>}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.5)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
        >+</button>
      </div>
    </div>
  );
}

// ─── POSSESSION INPUT ─────────────────────────────────────────────────────────
export function PossessionInput({ value, onChange, teamA, teamB, flagA, flagB }) {
  const [dragging, setDragging] = useState(false);

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    onChange(Math.max(20, Math.min(80, pct)));
  };

  return (
    <div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12, fontWeight:600, textAlign:"center" }}>Posesie</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>{flagA} {value}%</span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>vs</span>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", fontWeight:600 }}>{100 - value}% {flagB}</span>
      </div>
      <div
        onClick={handleTrackClick}
        style={{ position:"relative", height:28, background:"rgba(255,255,255,0.05)", borderRadius:14, cursor:"pointer", overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}
      >
        <div style={{ position:"absolute", left:0, top:0, width:`${value}%`, height:"100%", background:"linear-gradient(90deg,rgba(74,158,255,0.5),rgba(74,158,255,0.3))", borderRadius:"14px 0 0 14px", transition:dragging?"none":"width 0.15s" }}/>
        <div style={{ position:"absolute", left:`${value}%`, top:"50%", transform:"translate(-50%,-50%)", width:22, height:22, borderRadius:"50%", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.4)", transition:dragging?"none":"left 0.15s" }}/>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:1, height:"60%", background:"rgba(255,255,255,0.12)" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:10, color:"rgba(255,255,255,0.2)" }}>
        <span>{teamA}</span>
        <span>{teamB}</span>
      </div>
    </div>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = "#00E5A0" }) {
  return (
    <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,0.1)`, borderTopColor:color, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
  );
}

// ─── STATUS PILL ─────────────────────────────────────────────────────────────
export function StatusPill({ state }) {
  const config = {
    open:     { label:"Deschis",   color:"#4A9EFF", bg:"rgba(74,158,255,0.1)"   },
    soon:     { label:"Se închide",color:"#F59E0B", bg:"rgba(245,158,11,0.1)"  },
    locked:   { label:"Blocat",    color:"#6B7280", bg:"rgba(107,114,128,0.1)" },
    live:     { label:"⬤ Live",   color:"#EF4444", bg:"rgba(239,68,68,0.1)"   },
    finished: { label:"Final",     color:"#6B7280", bg:"rgba(107,114,128,0.08)"},
  }[state] || { label:"—", color:"#6B7280", bg:"transparent" };

  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20, background:config.bg, border:`1px solid ${config.color}28` }}>
      {state === "live" && (
        <div style={{ width:6, height:6, borderRadius:"50%", background:"#EF4444", animation:"livePulse 1.5s infinite" }}/>
      )}
      <span style={{ fontSize:10, fontWeight:700, color:config.color, letterSpacing:"0.05em" }}>{config.label}</span>
    </div>
  );
}

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
export function SectionDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 0", margin:"4px 0 6px" }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
      {label && <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700 }}>{label}</span>}
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }}/>
    </div>
  );
}
