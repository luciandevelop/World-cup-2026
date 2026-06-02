// Global CSS keyframes and resets, injected via <style> in App.jsx.
const CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
  }
  body { margin: 0; background: #0D1117; }
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
  @keyframes livePulse  { 0%{ box-shadow:0 0 0 0 rgba(239,68,68,0.7) }  70%{ box-shadow:0 0 0 7px rgba(239,68,68,0) }   100%{ box-shadow:0 0 0 0 rgba(239,68,68,0) } }
  @keyframes lockGlow   { 0%,100%{ box-shadow:0 0 0 0 rgba(245,158,11,0.06) } 50%{ box-shadow:0 0 10px 2px rgba(245,158,11,0.10) } }
  @keyframes revealFlip { from{ opacity:0;transform:translateY(8px) scale(0.97) } to{ opacity:1;transform:translateY(0) scale(1) } }
  @keyframes scanline   { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
  @keyframes celebrationPop { 0%{ transform:scale(0.5);opacity:0 } 60%{ transform:scale(1.06) } 100%{ transform:scale(1);opacity:1 } }
  @keyframes goldRing   { 0%{ box-shadow:0 0 0 0 rgba(212,175,55,0.5) } 50%{ box-shadow:0 0 30px 8px rgba(212,175,55,0.15) } 100%{ box-shadow:0 0 0 0 rgba(212,175,55,0) } }
  @keyframes breatheGold  { 0%,100%{ box-shadow:0 0 0 0 rgba(212,175,55,0.08) }  50%{ box-shadow:0 0 10px 2px rgba(212,175,55,0.14) } }
  @keyframes breatheGreen { 0%,100%{ box-shadow:0 0 0 0 rgba(255,255,255,0.04) } 50%{ box-shadow:0 0 8px 2px rgba(255,255,255,0.08) } }
  @keyframes particlePop  { 0%{ transform:translate(0,0) scale(1);opacity:1 }   100%{ transform:translate(calc((var(--rx,0.5) - 0.5)*120px),calc((var(--ry,0.5) - 0.5)*120px)) scale(0);opacity:0 } }
`;

export default CSS;
