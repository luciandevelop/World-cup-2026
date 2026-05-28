// ─── src/screens/AuthScreens.jsx ─────────────────────────────────────────────
// Real-structured auth screens.
// Wired to authService.js — swap mock for Firebase SDK when ready.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { GoogleLogo, AppleLogo, Spinner, FootballAvatar } from '../components/UI.jsx';
import { TAKEN_NICKNAMES } from '../data/gameData.js';
import { signInWithGoogle, signInWithApple, checkNicknameAvailable } from '../services/authService.js';

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
export function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(null); // "google" | "apple" | null

  const handleGoogle = async () => {
    setLoading("google");
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch(e) {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    setLoading("apple");
    try {
      const user = await signInWithApple();
      onLogin(user);
    } catch(e) {
      setLoading(null);
    }
  };

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)",
      padding:"24px 20px", position:"relative", overflow:"hidden",
    }}>
      {/* Ambient glow */}
      <div style={{ position:"absolute", top:-180, left:"50%", transform:"translateX(-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,160,0.06),transparent 65%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-100, left:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(212,175,55,0.04),transparent 65%)", pointerEvents:"none" }}/>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:360, textAlign:"center" }}>
        {/* Trophy + glow */}
        <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
          <div style={{ fontSize:80, animation:"float 3s ease-in-out infinite", filter:"drop-shadow(0 0 40px rgba(255,215,0,0.4))", lineHeight:1 }}>🏆</div>
        </div>

        <div style={{ fontSize:10, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(0,229,160,0.7)", fontWeight:700, marginBottom:10 }}>
          FIFA World Cup 2026™
        </div>

        <h1 style={{
          fontSize:44, fontWeight:900, color:"#fff", margin:"0 0 8px",
          fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.04em", lineHeight:1.05,
        }}>
          PREDICȚII<br/>
          <span style={{ color:"#00E5A0", textShadow:"0 0 30px rgba(0,229,160,0.3)" }}>& GLORIE</span>
        </h1>

        <p style={{ fontSize:14, color:"rgba(255,255,255,0.3)", marginBottom:44, lineHeight:1.7 }}>
          48 de echipe · 104 meciuri<br/>
          Tu și prietenii — cine ghicește mai bine?
        </p>

        {/* Stats strip */}
        <div style={{ display:"flex", gap:1, marginBottom:36, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
          {[{ v:"200", l:"Max pts/meci" }, { v:"12", l:"Grupe" }, { v:"104", l:"Meciuri" }].map((s, i) => (
            <div key={i} style={{ flex:1, padding:"12px 8px", background:"rgba(255,255,255,0.03)", textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <AuthButton
            icon={<GoogleLogo size={20}/>}
            label="Continuă cu Google"
            loading={loading === "google"}
            disabled={loading !== null}
            onClick={handleGoogle}
          />
          <AuthButton
            icon={<AppleLogo size={20}/>}
            label="Continuă cu Apple"
            loading={loading === "apple"}
            disabled={loading !== null}
            onClick={handleApple}
            variant="apple"
          />
        </div>

        <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)", marginTop:24, lineHeight:1.6 }}>
          🔒 Autentificare securizată · Nickname unic garantat<br/>
          Datele tale sunt protejate
        </p>
      </div>
    </div>
  );
}

function AuthButton({ icon, label, loading, disabled, onClick, variant }) {
  const isApple = variant === "apple";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:"100%", padding:"15px 20px",
        background: loading ? "rgba(255,255,255,0.04)" : isApple ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)",
        border:`1px solid ${loading ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`,
        borderRadius:14, color:loading ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize:15, fontWeight:600, cursor:loading || disabled ? "default" : "pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
        transition:"all 0.2s",
      }}
    >
      {loading ? <Spinner size={20} color="#00E5A0"/> : icon}
      <span>{loading ? "Se conectează..." : label}</span>
    </button>
  );
}

// ─── NICKNAME SCREEN ──────────────────────────────────────────────────────────
export function NicknameScreen({ googleUser, onComplete }) {
  const [nick, setNick]     = useState("");
  const [status, setStatus] = useState(null); // null | "checking" | "ok" | "taken" | "short"
  const [saving, setSaving] = useState(false);
  let debounce = null;

  const check = (val) => {
    const cleaned = val.replace(/\s/g, "").slice(0, 20);
    setNick(cleaned);
    clearTimeout(debounce);
    if (cleaned.length < 3) { setStatus(cleaned.length > 0 ? "short" : null); return; }
    setStatus("checking");
    debounce = setTimeout(async () => {
      const available = await checkNicknameAvailable(cleaned, TAKEN_NICKNAMES);
      setStatus(available ? "ok" : "taken");
    }, 600);
  };

  const save = () => {
    if (status !== "ok" || saving) return;
    setSaving(true);
    setTimeout(() => onComplete(nick), 800);
  };

  const base = googleUser?.name ? googleUser.name.split(" ")[0] : "Player";
  const suggestions = [base + "FC", base + "Goat", "Leu" + (base.length * 7 % 89 + 10)];
  const borderColor = status === "ok" ? "#00E5A0" : status === "taken" ? "#FF6B6B" : "rgba(255,255,255,0.1)";

  return (
    <div style={{
      minHeight:"100dvh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)",
      padding:"24px 20px",
    }}>
      <div style={{ width:"100%", maxWidth:360, animation:"fadeUp 0.4s ease both" }}>

        {/* User card */}
        <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 16px", marginBottom:32 }}>
          <FootballAvatar nickname={googleUser?.name || "?"} size={44}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{googleUser?.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{googleUser?.email}</div>
          </div>
          <div style={{ marginLeft:"auto", fontSize:10, color:"#00E5A0", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.2)", padding:"3px 9px", borderRadius:20 }}>
            ✓ {googleUser?.provider === "apple" ? "Apple" : "Google"}
          </div>
        </div>

        <div style={{ fontSize:10, color:"rgba(0,229,160,0.7)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>Pasul final</div>
        <h2 style={{ fontSize:32, fontWeight:900, color:"#fff", margin:"0 0 8px", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.02em" }}>
          Alege-ți NICKNAME-UL
        </h2>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:28, lineHeight:1.6 }}>
          Apare în clasament. Prietenii îl vor vedea. 😈<br/>
          <span style={{ color:"rgba(255,255,255,0.15)" }}>Poate fi schimbat mai târziu.</span>
        </p>

        {/* Input */}
        <div style={{ position:"relative", marginBottom:8 }}>
          <input
            value={nick}
            onChange={e => check(e.target.value)}
            placeholder="ex: RaduGoalMaster"
            onKeyDown={e => e.key === "Enter" && save()}
            autoFocus
            style={{
              width:"100%", padding:"16px 48px 16px 16px",
              background:"rgba(255,255,255,0.05)",
              border:`1px solid ${borderColor}`,
              borderRadius:14, color:"#fff", fontSize:17,
              fontFamily:"inherit", outline:"none",
              boxSizing:"border-box", transition:"border-color 0.2s",
            }}
          />
          <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>
            {status === "checking" && <Spinner size={16}/>}
            {status === "ok"       && <span style={{ color:"#00E5A0" }}>✓</span>}
            {status === "taken"    && <span style={{ color:"#FF6B6B" }}>✗</span>}
          </div>
        </div>

        {/* Status message */}
        <div style={{ minHeight:18, marginBottom:14, fontSize:12 }}>
          {status === "taken" && <span style={{ color:"#FF6B6B" }}>❌ Deja luat — mai încearcă o dată</span>}
          {status === "ok"    && <span style={{ color:"#00E5A0" }}>✅ Disponibil!</span>}
          {status === "short" && <span style={{ color:"rgba(255,255,255,0.3)" }}>Minim 3 caractere</span>}
        </div>

        {/* Suggestions */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginBottom:8 }}>Sugestii rapide:</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => check(s)}
                style={{ padding:"6px 13px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer" }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={save}
          disabled={status !== "ok" || saving}
          style={{
            width:"100%", padding:18,
            background: status === "ok" && !saving ? "linear-gradient(135deg,#00E5A0,#00C27A)" : "rgba(255,255,255,0.05)",
            border:"none", borderRadius:14,
            color: status === "ok" && !saving ? "#060C09" : "rgba(255,255,255,0.2)",
            fontSize:17, fontWeight:900,
            cursor: status === "ok" && !saving ? "pointer" : "default",
            fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.08em",
            boxShadow: status === "ok" ? "0 8px 32px rgba(0,229,160,0.3)" : "none",
            transition:"all 0.3s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          }}
        >
          {saving ? <><Spinner size={18} color="#060C09"/>Intru...</> : "INTRĂ ÎN JOC →"}
        </button>
      </div>
    </div>
  );
}
