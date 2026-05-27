// All global CSS keyframes and resets, injected via <style> in App.jsx.
// The @import for Google Fonts is handled in index.html instead.
const CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
  }
  body { margin: 0; background: #080C09; }
  input[type=range]::-webkit-slider-thumb { width: 0; height: 0; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  button:active { transform: scale(0.97); }

  @keyframes float      { 0%,100%{ transform:translateY(0) }       50%{ transform:translateY(-10px) } }
  @keyframes spin       { to{ transform:rotate(360deg) } }
  @keyframes fadeIn     { from{ opacity:0 }                         to{ opacity:1 } }
  @keyframes slideUp    { from{ transform:translateY(80px);opacity:0 } to{ transform:translateY(0);opacity:1 } }
  @keyframes slideIn    { from{ transform:translateX(-20px);opacity:0 } to{ transform:translateX(0);opacity:1 } }
  @keyframes popIn      { from{ transform:scale(0.5);opacity:0 }    to{ transform:scale(1);opacity:1 } }
  @keyframes ptsFloat   { 0%{ transform:translateY(0);opacity:1 }   100%{ transform:translateY(-24px);opacity:0 } }
  @keyframes livePulse  { 0%{ box-shadow:0 0 0 0 rgba(255,68,68,0.7) }  70%{ box-shadow:0 0 0 7px rgba(255,68,68,0) }   100%{ box-shadow:0 0 0 0 rgba(255,68,68,0) } }
  @keyframes lockGlow   { 0%,100%{ box-shadow:0 0 0 0 rgba(255,193,7,0.08),inset 0 0 20px rgba(255,193,7,0.02) } 50%{ box-shadow:0 0 12px 2px rgba(255,193,7,0.12),inset 0 0 20px rgba(255,193,7,0.05) } }
  @keyframes revealFlip { from{ opacity:0;transform:translateY(8px) scale(0.97) } to{ opacity:1;transform:translateY(0) scale(1) } }
  @keyframes scanline   { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
  @keyframes celebrationPop { 0%{ transform:scale(0.5);opacity:0 } 60%{ transform:scale(1.06) } 100%{ transform:scale(1);opacity:1 } }
  @keyframes goldRing   { 0%{ box-shadow:0 0 0 0 rgba(255,215,0,0.7) } 50%{ box-shadow:0 0 40px 12px rgba(255,215,0,0.3) } 100%{ box-shadow:0 0 0 0 rgba(255,215,0,0) } }
  @keyframes breatheGold  { 0%,100%{ box-shadow:0 0 0 0 rgba(255,215,0,0.1) }  50%{ box-shadow:0 0 12px 2px rgba(255,215,0,0.2) } }
  @keyframes breatheGreen { 0%,100%{ box-shadow:0 0 0 0 rgba(0,229,160,0.08) } 50%{ box-shadow:0 0 10px 2px rgba(0,229,160,0.18) } }
  @keyframes particlePop  { 0%{ transform:translate(0,0) scale(1);opacity:1 }   100%{ transform:translate(calc((var(--rx,0.5) - 0.5)*120px),calc((var(--ry,0.5) - 0.5)*120px)) scale(0);opacity:0 } }
`;

export default CSS;
