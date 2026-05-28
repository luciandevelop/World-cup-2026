// ─── src/styles/globalCSS.js ──────────────────────────────────────────────────
// All global CSS injected into <style> by App.jsx
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body { margin: 0; background: #0A0E14; }
  input[type=range]::-webkit-slider-thumb { width: 0; height: 0; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  button { font-family: inherit; }
  button:active { transform: scale(0.97); }
  input, textarea { font-family: inherit; }

  /* ── Keyframes ── */
  @keyframes float      { 0%,100%{ transform:translateY(0) }       50%{ transform:translateY(-8px) } }
  @keyframes spin       { to{ transform:rotate(360deg) } }
  @keyframes fadeIn     { from{ opacity:0 }                         to{ opacity:1 } }
  @keyframes fadeUp     { from{ opacity:0;transform:translateY(12px) } to{ opacity:1;transform:translateY(0) } }
  @keyframes slideUp    { from{ transform:translateY(100px);opacity:0 } to{ transform:translateY(0);opacity:1 } }
  @keyframes slideIn    { from{ transform:translateX(-16px);opacity:0 } to{ transform:translateX(0);opacity:1 } }
  @keyframes popIn      { from{ transform:scale(0.85);opacity:0 }    to{ transform:scale(1);opacity:1 } }
  @keyframes ptsFloat   { 0%{ transform:translateY(0);opacity:1 }    100%{ transform:translateY(-28px);opacity:0 } }
  @keyframes livePulse  { 0%{ box-shadow:0 0 0 0 rgba(239,68,68,0.6) } 70%{ box-shadow:0 0 0 8px rgba(239,68,68,0) } 100%{ box-shadow:0 0 0 0 rgba(239,68,68,0) } }
  @keyframes lockGlow   { 0%,100%{ opacity:0.6 } 50%{ opacity:1 } }
  @keyframes revealFlip { from{ opacity:0;transform:translateY(6px) scale(0.98) } to{ opacity:1;transform:translateY(0) scale(1) } }
  @keyframes celebPop   { 0%{ transform:scale(0.5);opacity:0 } 60%{ transform:scale(1.05) } 100%{ transform:scale(1);opacity:1 } }
  @keyframes goldPulse  { 0%,100%{ box-shadow:0 0 0 0 rgba(212,175,55,0.4) } 50%{ box-shadow:0 0 24px 6px rgba(212,175,55,0.12) } }
  @keyframes breatheGreen { 0%,100%{ box-shadow:0 4px 20px rgba(0,229,160,0.2) } 50%{ box-shadow:0 6px 32px rgba(0,229,160,0.35) } }
  @keyframes particlePop  { 0%{ opacity:1;transform:translate(0,0) scale(1) } 100%{ opacity:0;transform:translate(var(--tx,0),var(--ty,-40px)) scale(0) } }
  @keyframes staggerIn  { from{ opacity:0;transform:translateY(20px) } to{ opacity:1;transform:translateY(0) } }
  @keyframes shimmer    { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
  @keyframes scaleIn    { from{ transform:scale(0.92);opacity:0 } to{ transform:scale(1);opacity:1 } }
  @keyframes notifPop   { 0%{ transform:translateY(-100%) } 60%{ transform:translateY(4px) } 100%{ transform:translateY(0) } }
  @keyframes ripple     { 0%{ transform:scale(1);opacity:0.3 } 100%{ transform:scale(2.5);opacity:0 } }
`;

export default CSS;
