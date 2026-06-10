import { useState } from 'react';

// ─── HOW TO PLAY SCREEN ───────────────────────────────────────────────────────
function HowToPlayScreen() {
  const Divider = ({ label }) => (
    <div style={{ display:"flex",alignItems:"center",gap:8,margin:"22px 0 12px" }}>
      <div style={{ flex:1,height:1,background:"linear-gradient(90deg,rgba(255,255,255,0.07),transparent)" }}/>
      <span style={{ fontSize:9,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"#383838" }}>{label}</span>
      <div style={{ flex:1,height:1,background:"linear-gradient(270deg,rgba(255,255,255,0.07),transparent)" }}/>
    </div>
  );

  return (
    <div style={{ padding:"0 16px 48px",overflowX:"hidden" }}>

      {/* ── HERO ── */}
      <div style={{ position:"relative",margin:"12px -16px 0",padding:"22px 20px 18px",overflow:"hidden",textAlign:"center" }}>
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse 100% 180% at 50% -20%,rgba(0,229,160,0.07),transparent)",pointerEvents:"none" }}/>
        <div style={{ fontSize:9,color:"#00E5A044",letterSpacing:"0.22em",textTransform:"uppercase",marginBottom:8 }}>FIFA World Cup 2026</div>
        <div style={{ fontSize:36,fontWeight:900,color:"#fff",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.07em",lineHeight:1,marginBottom:6 }}>
          PREDICT.<br/><span style={{ color:"#00E5A0",filter:"drop-shadow(0 0 12px rgba(0,229,160,0.4))" }}>CLIMB.</span> WIN.
        </div>
        <div style={{ fontSize:12,color:"#444",marginBottom:14 }}>Football IQ vs. your friends. One champion.</div>
        {/* live stat strip */}
        <div style={{ display:"flex",justifyContent:"center",gap:0,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,overflow:"hidden",maxWidth:320,margin:"0 auto" }}>
          {[
            { icon:"🔥", text:"128 predicții azi" },
            { icon:"⚡", text:"14 jucători activi" },
            { icon:"🏆", text:"World Cup 2026" },
          ].map((s,i)=>(
            <div key={i} style={{ flex:1,padding:"7px 4px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ fontSize:13 }}>{s.icon}</div>
              <div style={{ fontSize:9,color:"#444",marginTop:1,lineHeight:1.2 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SOCIAL HIGHLIGHT ── */}
      <div style={{ marginTop:16,padding:"12px 16px",background:"linear-gradient(135deg,rgba(74,158,255,0.08),rgba(123,94,167,0.08))",border:"1px solid rgba(74,158,255,0.18)",borderRadius:13,display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ fontSize:22,flexShrink:0 }}>👀</div>
        <div>
          <div style={{ fontSize:13,fontWeight:700,color:"#fff",marginBottom:2 }}>Predicțiile devin vizibile după start</div>
          <div style={{ fontSize:11,color:"#4A9EFF77" }}>Descoperă cine ce a ghicit — după fluierul de start.</div>
        </div>
      </div>

      {/* ── HOW TO PLAY ── */}
      <Divider label="Cum joci" />
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
        {[
          { icon:"⚽", label:"Scor exact",  desc:"Ghicești 2–1?" },
          { icon:"🟨", label:"Cartonașe",   desc:"0 – 20" },
          { icon:"🚩", label:"Cornere",     desc:"Total meci" },
        ].map((c,i)=>(
          <div key={i} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 10px",textAlign:"center" }}>
            <div style={{ fontSize:22,marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:11,fontWeight:800,color:"#ddd",marginBottom:3 }}>{c.label}</div>
            <div style={{ fontSize:10,color:"#444" }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:8,padding:"9px 13px",background:"rgba(74,158,255,0.05)",border:"1px solid rgba(74,158,255,0.1)",borderRadius:10,display:"flex",alignItems:"center",gap:8 }}>
        <span style={{ fontSize:13 }}>⏱</span>
        <span style={{ fontSize:11,color:"#4A9EFF88" }}>Predicțiile se blochează cu <strong style={{ color:"#4A9EFF" }}>30 min</strong> înainte de start.</span>
      </div>

      {/* ── MATCH STATES ── */}
      <Divider label="Stările meciului" />
      <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none" }}>
        {[
          { icon:"🔓", label:"Deschis",      color:"#4A9EFF",  bg:"rgba(74,158,255,0.1)",  border:"rgba(74,158,255,0.2)"  },
          { icon:"⚠",  label:"Se blochează", color:"#FFC107",  bg:"rgba(255,193,7,0.1)",   border:"rgba(255,193,7,0.2)"   },
          { icon:"🔒", label:"Blocat",        color:"#FF6B6B",  bg:"rgba(255,107,107,0.1)", border:"rgba(255,107,107,0.2)" },
          { icon:"🔴", label:"Live",          color:"#FF6B6B",  bg:"rgba(255,107,107,0.1)", border:"rgba(255,107,107,0.2)" },
          { icon:"✅", label:"Terminat",      color:"#00E5A0",  bg:"rgba(0,229,160,0.1)",   border:"rgba(0,229,160,0.2)"   },
        ].map((s,i)=>(
          <div key={i} style={{ flexShrink:0,background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"10px 12px",textAlign:"center",minWidth:70 }}>
            <div style={{ fontSize:18,marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:10,fontWeight:700,color:s.color,whiteSpace:"nowrap" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SCORING ── */}
      <Divider label="Punctaj" />

      {/* Main scoring rows */}
      <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,overflow:"hidden",marginBottom:8 }}>
        {[
          { label:"Scor exact",           pts:100, color:"#FFD700", accent:"rgba(255,215,0,0.06)"  },
          { label:"Rezultat corect 1/X/2",pts:50,  color:"#00E5A0", accent:null },
          { label:"Total goluri corect",  pts:20,  color:"#00E5A0", accent:null },
        ].map((r,i)=>(
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",background:r.accent||"transparent",borderBottom:i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
            <span style={{ fontSize:13,fontWeight:600,color:"#ccc" }}>{r.label}</span>
            <span style={{ fontSize:16,fontWeight:900,color:r.color,fontFamily:"'DM Mono',monospace" }}>+{r.pts}</span>
          </div>
        ))}
      </div>

      {/* Possession + Corners side by side */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
        {[
          { label:"Cartonașe", rows:[{l:"Exact",pts:"+15",c:"#00E5A0"},{l:"±1",pts:"+14",c:"#4A9EFF"},{l:"±2",pts:"+13",c:"#4A9EFF"},{l:">5 dif.",pts:"0",c:"#2a2a2a"}] },
          { label:"Cornere", rows:[{l:"Exact",pts:"+15",c:"#00E5A0"},{l:"±1",pts:"+10",c:"#4A9EFF"},{l:"±2",pts:"+5",c:"#4A9EFF"},{l:"±3",pts:"+2",c:"#555"},{l:">3",pts:"0",c:"#2a2a2a"}] },
        ].map((col,ci)=>(
          <div key={ci} style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 12px" }}>
            <div style={{ fontSize:9,color:"#444",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,fontWeight:800 }}>{col.label}</div>
            {col.rows.map((r,ri)=>(
              <div key={ri} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:ri<col.rows.length-1?"1px solid rgba(255,255,255,0.03)":"none" }}>
                <span style={{ fontSize:11,color:"#666" }}>{r.l}</span>
                <span style={{ fontSize:11,fontWeight:800,color:r.c,fontFamily:"'DM Mono',monospace" }}>{r.pts}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Perfect prediction card */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",background:"linear-gradient(135deg,rgba(255,215,0,0.09),rgba(255,215,0,0.04))",border:"1px solid rgba(255,215,0,0.2)",borderRadius:13,boxShadow:"0 0 20px rgba(255,215,0,0.04)" }}>
        <div>
          <div style={{ fontSize:12,color:"#FFD700",fontWeight:800,marginBottom:1 }}>Perfect Prediction</div>
          <div style={{ fontSize:10,color:"#FFD70055" }}>scor + cartonașe + cornere — toate exacte</div>
        </div>
        <div style={{ fontSize:22,fontWeight:900,color:"#FFD700",fontFamily:"'DM Mono',monospace",filter:"drop-shadow(0 0 8px rgba(255,215,0,0.4))" }}>200</div>
      </div>

      {/* ── COMPETITION FORMAT ── */}
      <Divider label="Formatul competiției" />
      <div style={{ display:"flex",flexDirection:"column",gap:0,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,overflow:"hidden" }}>
        {[
          { icon:"1️⃣", label:"Faza grupelor",     desc:"Toți jucătorii. Fiecare meci contează.",                          accent:"#00E5A0" },
          { icon:"⚡", label:"Faza eliminatorie", desc:"Continuați să preziceți din optimi până în semifinale.",            accent:"#4A9EFF" },
          { icon:"🏆", label:"Finala",            desc:"Toți jucătorii rămân activi. Câștigă cel cu cele mai multe puncte.", accent:"#FFD700" },
        ].map((s,i,arr)=>(
          <div key={i} style={{ display:"flex",gap:14,alignItems:"flex-start",padding:"13px 16px",borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.04)":"none",background:i===3?"rgba(255,215,0,0.03)":"transparent" }}>
            <div style={{ fontSize:17,flexShrink:0,marginTop:1 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:13,fontWeight:700,color:s.accent,marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:11,color:"#444",lineHeight:1.45 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── LIVE LEADERBOARD ── */}
      <Divider label="Clasament live" />
      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
        {[
          { icon:"⚡", text:"Clasamentul se actualizează după fiecare meci terminat." },
          { icon:"↕",  text:"Nicio poziție nu e garantată — totul se schimbă constant." },
        ].map((r,i)=>(
          <div key={i} style={{ display:"flex",gap:10,alignItems:"center",padding:"10px 13px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:11 }}>
            <span style={{ fontSize:14,flexShrink:0 }}>{r.icon}</span>
            <span style={{ fontSize:12,color:"#666",lineHeight:1.45 }}>{r.text}</span>
          </div>
        ))}
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ margin:"22px -16px 0",padding:"22px 20px 28px",background:"radial-gradient(ellipse 90% 120% at 50% 100%,rgba(255,215,0,0.05),transparent)",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize:40,marginBottom:8,filter:"drop-shadow(0 0 16px rgba(255,215,0,0.5))" }}>🏆</div>
        <div style={{ fontSize:24,fontWeight:900,color:"#FFD700",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.1em" }}>SEE YOU AT THE TOP.</div>
        <div style={{ fontSize:12,color:"#444",marginTop:6 }}>World Cup Challenge 2026 · #1 câștigă totul</div>
      </div>

    </div>
  );
}

export default HowToPlayScreen;
