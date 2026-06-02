// ─── src/components/UI.jsx ───────────────────────────────────────────────────
// World Cup Arena 2026 — UI Component Library
// FootballAvatar: premium SVG renderer (nation / jersey / achievement)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { getAvatarById, getDefaultAvatarForNick } from '../data/avatars.js';

// ─── RARITY RING CONFIG ──────────────────────────────────────────────────────
const RARITY_RING = {
  common:    { w:2,   border:'rgba(160,160,160,0.35)', outer:'rgba(160,160,160,0.12)', glow:'none' },
  rare:      { w:2.5, border:'rgba(96,165,250,0.75)',  outer:'rgba(96,165,250,0.2)',   glow:'0 0 12px rgba(96,165,250,0.45)' },
  epic:      { w:2.5, border:'rgba(192,132,252,0.85)', outer:'rgba(192,132,252,0.22)', glow:'0 0 16px rgba(192,132,252,0.55)' },
  legendary: { w:3,   border:'rgba(251,191,36,0.95)',  outer:'rgba(251,191,36,0.28)',  glow:'0 0 22px rgba(251,191,36,0.65), 0 0 44px rgba(251,191,36,0.25)' },
};

// ─── SVG: NATION BADGE ───────────────────────────────────────────────────────
// Heraldic shield, flag colors as bands, large flag emoji, metallic chrome ring
function NationSVG({ av, s }) {
  const id = `n${av.id}`;
  const cx = s / 2, cy = s / 2;
  const W = s * 0.70, H = s * 0.76;
  const x0 = (s - W) / 2, y0 = (s - H) / 2 - s * 0.01;
  const r = W * 0.13;

  // Shield path: rounded top, pointed bottom
  const shield = `M${x0+r},${y0} L${x0+W-r},${y0} Q${x0+W},${y0} ${x0+W},${y0+r} L${x0+W},${y0+H*0.62} Q${x0+W},${y0+H*0.83} ${cx},${y0+H} Q${x0},${y0+H*0.83} ${x0},${y0+H*0.62} L${x0},${y0+r} Q${x0},${y0} ${x0+r},${y0} Z`;
  const p = s * 0.028;
  const inner = `M${x0+r+p},${y0+p} L${x0+W-r-p},${y0+p} Q${x0+W-p},${y0+p} ${x0+W-p},${y0+r+p} L${x0+W-p},${y0+H*0.62} Q${x0+W-p},${y0+H*0.83-p} ${cx},${y0+H-p} Q${x0+p},${y0+H*0.83-p} ${x0+p},${y0+H*0.62} L${x0+p},${y0+r+p} Q${x0+p},${y0+p} ${x0+r+p},${y0+p} Z`;
  const flagY = y0 + H * 0.51;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:'block',flexShrink:0,overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}m`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={av.c2}/>
          <stop offset="28%"  stopColor={av.c1}/>
          <stop offset="72%"  stopColor={av.c3}/>
          <stop offset="100%" stopColor={av.c2} stopOpacity="0.85"/>
        </linearGradient>
        <linearGradient id={`${id}ov`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.38)"/>
          <stop offset="35%"  stopColor="rgba(0,0,0,0.05)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.52)"/>
        </linearGradient>
        <linearGradient id={`${id}sh`} x1="0%" y1="0%" x2="58%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.26)"/>
          <stop offset="55%"  stopColor="rgba(255,255,255,0.05)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <filter id={`${id}bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={s*0.042}/>
        </filter>
        <clipPath id={`${id}c`}><path d={inner}/></clipPath>
      </defs>

      {/* Glow bloom */}
      {av.shine && <path d={shield} fill={av.c1} opacity="0.16" filter={`url(#${id}bl)`}/>}

      {/* Outer metallic body */}
      <path d={shield} fill={`url(#${id}m)`}/>

      {/* Inner dark field */}
      <path d={inner} fill={av.bg}/>

      {/* Color bands (flag-inspired) */}
      <g clipPath={`url(#${id}c)`}>
        <rect x={x0} y={y0}          width={W} height={H*0.34} fill={av.c1} opacity="0.80"/>
        <rect x={x0} y={y0+H*0.34}   width={W} height={H*0.33} fill={av.c2} opacity="0.75"/>
        <rect x={x0} y={y0+H*0.67}   width={W} height={H*0.33} fill={av.c3} opacity="0.80"/>
        {/* Depth */}
        <path d={inner} fill={`url(#${id}ov)`}/>
        {/* Flag emoji — large, perfectly centered */}
        <text x={cx} y={flagY} textAnchor="middle" dominantBaseline="middle"
          fontSize={s*0.40}
          fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        >{av.flag}</text>
        {/* Shine */}
        <path d={inner} fill={`url(#${id}sh)`}/>
      </g>

      {/* Inner border */}
      <path d={inner} fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth={s*0.012}/>

      {/* Chrome top tab */}
      <rect x={cx-W*0.22} y={y0-s*0.013} width={W*0.44} height={s*0.050}
        rx={s*0.016} fill={`url(#${id}m)`}/>
    </svg>
  );
}

// ─── SVG: JERSEY AVATAR ──────────────────────────────────────────────────────
// Full shirt silhouette: collar, sleeves, surname above huge number, flag badge
function JerseySVG({ av, s }) {
  const id = `j${av.id}`;
  const cx = s / 2;

  // Shirt geometry
  const bw = s * 0.64, bh = s * 0.60;
  const bx = (s - bw) / 2, by = s * 0.12;
  const slW = bw * 0.23, slH = bh * 0.38;

  // Full jersey path
  const jersey = `M${bx+bw*0.15},${by} L${bx+bw*0.85},${by} L${bx+bw},${by+bh*0.13} L${bx+bw-slW},${by+slH} L${bx+bw-slW*0.12},${by+bh} L${bx+slW*0.12},${by+bh} L${bx+slW},${by+slH} L${bx},${by+bh*0.13} Z`;

  // V-collar
  const collar = `M${bx+bw*0.34},${by+s*0.010} Q${cx},${by+s*0.068} ${bx+bw*0.66},${by+s*0.010}`;

  const isWhite = av.body === '#FFFFFF';
  const numColor = av.stripe;
  const numStroke = isWhite ? (av.collar || '#333') : 'rgba(0,0,0,0.60)';

  // Checker pattern squares
  const sqSize = s * 0.075;
  const checkerCells = [];
  if (av.stripes === 'checker') {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if ((row + col) % 2 === 0) {
          checkerCells.push({ x: bx + col * sqSize, y: by + row * sqSize });
        }
      }
    }
  }

  // How many chars in surname to size it
  const surnameLen = (av.surname || '').length;
  const surnameFontSize = surnameLen <= 5 ? s * 0.095
    : surnameLen <= 7 ? s * 0.080
    : surnameLen <= 9 ? s * 0.068
    : s * 0.056;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:'block',flexShrink:0,overflow:'visible'}}>
      <defs>
        <linearGradient id={`${id}bd`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%"   stopColor={av.body}/>
          <stop offset="100%" stopColor={av.bodyEnd || av.body}/>
        </linearGradient>
        <linearGradient id={`${id}sh`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)"/>
          <stop offset="55%"  stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <linearGradient id={`${id}dk`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)"/>
        </linearGradient>
        <filter id={`${id}dr`}>
          <feDropShadow dx="0" dy={s*0.03} stdDeviation={s*0.032}
            floodColor={av.body} floodOpacity="0.50"/>
        </filter>
        {/* Vertical stripe pattern (Argentina etc.) */}
        {av.stripes === 'vertical' && (
          <pattern id={`${id}vsp`} x="0" y="0" width={s*0.12} height={s} patternUnits="userSpaceOnUse">
            <rect width={s*0.06} height={s} fill={av.body}/>
            <rect x={s*0.06} width={s*0.06} height={s} fill={av.stripe}/>
          </pattern>
        )}
        {/* Georgia cross pattern */}
        {av.stripes === 'cross' && (
          <pattern id={`${id}crp`} x="0" y="0" width={s*0.18} height={s*0.18} patternUnits="userSpaceOnUse">
            <rect width={s*0.18} height={s*0.18} fill={av.body}/>
            <rect x={s*0.07} width={s*0.04} height={s*0.18} fill={av.stripe} opacity="0.6"/>
            <rect y={s*0.07} width={s*0.18} height={s*0.04} fill={av.stripe} opacity="0.6"/>
          </pattern>
        )}
        <clipPath id={`${id}c`}><path d={jersey}/></clipPath>
      </defs>

      {/* Drop shadow */}
      <path d={jersey} fill={av.body} filter={`url(#${id}dr)`} opacity="0.30"/>

      {/* Jersey body fill */}
      <path d={jersey}
        fill={
          av.stripes === 'vertical' ? `url(#${id}vsp)` :
          av.stripes === 'cross'    ? `url(#${id}crp)` :
          `url(#${id}bd)`
        }
      />

      <g clipPath={`url(#${id}c)`}>
        {/* Checker overlay */}
        {av.stripes === 'checker' && checkerCells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width={sqSize} height={sqSize}
            fill={av.stripe} opacity="0.55"/>
        ))}
        {/* Sleeve accent strips */}
        <rect x={bx}               y={by+bh*0.04} width={slW*0.68} height={slH}
          fill={av.sleeve} opacity="0.52"/>
        <rect x={bx+bw-slW*0.68}   y={by+bh*0.04} width={slW*0.68} height={slH}
          fill={av.sleeve} opacity="0.52"/>
        {/* Bottom gradient */}
        <path d={jersey} fill={`url(#${id}dk)`}/>
        {/* Shine */}
        <path d={jersey} fill={`url(#${id}sh)`}/>
      </g>

      {/* Outline */}
      <path d={jersey} fill="none"
        stroke={isWhite ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.20)'}
        strokeWidth={s*0.012}/>

      {/* Collar */}
      <path d={collar} fill="none"
        stroke={av.collar} strokeWidth={s*0.044} strokeLinecap="round" opacity="0.92"/>
      <path d={collar} fill="none"
        stroke="rgba(255,255,255,0.28)" strokeWidth={s*0.013} strokeLinecap="round"/>

      {/* Flag micro-badge (top chest) */}
      <text x={cx} y={by+bh*0.195}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={s*0.128}
        fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
      >{av.flag}</text>

      {/* SURNAME (above number, like a real shirt) */}
      <text x={cx} y={by+bh*0.505}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={surnameFontSize}
        fontWeight="900"
        fontFamily="'Bebas Neue','Impact','Arial Black',sans-serif"
        letterSpacing="0.06em"
        fill={numColor}
        stroke={numStroke}
        strokeWidth={s*0.007}
        paintOrder="stroke fill"
      >{av.surname}</text>

      {/* NUMBER — huge, dominant */}
      <text x={cx} y={by+bh*0.785}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={s*0.295}
        fontWeight="900"
        fontFamily="'Bebas Neue','Impact','Arial Black',sans-serif"
        letterSpacing="-0.02em"
        fill={numColor}
        stroke={numStroke}
        strokeWidth={s*0.016}
        paintOrder="stroke fill"
      >{av.num}</text>
    </svg>
  );
}

// ─── SVG: ACHIEVEMENT BADGE ──────────────────────────────────────────────────
// Octagonal (legendary) / hexagonal (epic) / pentagonal (rare/common)
// Large icon, multi-line label, metallic ring, glow
function AchievementSVG({ av, s }) {
  const id = `a${av.id}`;
  const cx = s / 2, cy = s / 2;
  const isLeg = av.rarity === 'legendary';
  const isEpic = av.rarity === 'epic';
  const sides = isLeg ? 8 : isEpic ? 6 : 5;
  const R = s * 0.42, Ri = R * 0.768;

  const polyPts = (r, off = 0) => {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i / sides) - Math.PI / 2 + off;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return pts.join(' ');
  };

  const lines = (av.label || av.name).split('\n');

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:'block',flexShrink:0,overflow:'visible'}}>
      <defs>
        <radialGradient id={`${id}og`} cx="38%" cy="28%" r="72%">
          <stop offset="0%"   stopColor={av.c2} stopOpacity="1"/>
          <stop offset="45%"  stopColor={av.c1} stopOpacity="1"/>
          <stop offset="100%" stopColor={av.c3||av.bg} stopOpacity="1"/>
        </radialGradient>
        <radialGradient id={`${id}ig`} cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={av.bg} stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.96"/>
        </radialGradient>
        <linearGradient id={`${id}sh`} x1="0%" y1="0%" x2="55%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.22)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
        <filter id={`${id}bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={s*0.052}/>
        </filter>
        <filter id={`${id}ig2`} x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation={s*0.022} result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <clipPath id={`${id}cp`}><polygon points={polyPts(Ri)}/></clipPath>
      </defs>

      {/* Ambient bloom */}
      {av.shine && <polygon points={polyPts(R)} fill={av.c1} opacity="0.20" filter={`url(#${id}bl)`}/>}

      {/* Outer metallic ring */}
      <polygon points={polyPts(R)} fill={`url(#${id}og)`}/>
      <polygon points={polyPts(R)} fill="none" stroke={av.c2} strokeWidth={s*0.020} strokeOpacity="0.88"/>
      <polygon points={polyPts(R)} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={s*0.008}/>

      {/* Inner dark field */}
      <polygon points={polyPts(Ri)} fill={`url(#${id}ig)`}/>
      <polygon points={polyPts(Ri)} fill="none" stroke={av.c1} strokeWidth={s*0.014} strokeOpacity="0.42"/>

      {/* Shine wedge */}
      <polygon points={polyPts(Ri)} fill={`url(#${id}sh)`} clipPath={`url(#${id}cp)`}/>

      {/* Icon */}
      <text x={cx} y={isLeg ? cy - s*0.065 : cy - s*0.045}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={s * 0.295}
        fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        filter={av.shine ? `url(#${id}ig2)` : undefined}
      >{av.icon}</text>

      {/* Label lines */}
      {lines.map((line, i) => (
        <text key={i}
          x={cx}
          y={cy + s * (isLeg ? 0.155 : 0.145) + (i - (lines.length - 1) / 2) * s * 0.088}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={s * 0.072}
          fontWeight="900"
          fontFamily="'Bebas Neue','Impact',sans-serif"
          letterSpacing="0.08em"
          fill={av.c1}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth={s * 0.008}
          paintOrder="stroke fill"
        >{line}</text>
      ))}

      {/* Legendary stars */}
      {isLeg && [-1, 0, 1].map(i => (
        <text key={i}
          x={cx + i * s * 0.148} y={cy + s * 0.348}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={s * 0.105}
          fill={av.c1}
          fontFamily="sans-serif"
          stroke="rgba(0,0,0,0.4)" strokeWidth={s*0.006} paintOrder="stroke fill"
        >★</text>
      ))}
    </svg>
  );
}

// ─── FOOTBALL AVATAR ─────────────────────────────────────────────────────────
// Master component: resolves avatar data, renders correct SVG, wraps in
// premium circular container with metallic ring and glow.
// Props identical to old API: { avatarId, nickname, size, style }
// ─────────────────────────────────────────────────────────────────────────────
export function FootballAvatar({ nickname, avatarId, size = 40, style: extraStyle = {} }) {
  const av = avatarId ? getAvatarById(avatarId) : getDefaultAvatarForNick(nickname || '?');
  const rr = RARITY_RING[av.rarity] || RARITY_RING.common;
  const isLeg = av.rarity === 'legendary';

  let inner;
  if (av.kind === 'nation')       inner = <NationSVG       av={av} s={size * 0.88}/>;
  else if (av.kind === 'jersey')  inner = <JerseySVG        av={av} s={size * 0.92}/>;
  else if (av.kind === 'achievement') inner = <AchievementSVG av={av} s={size * 0.90}/>;
  else {
    // Fallback for any legacy entries
    inner = (
      <div style={{
        width: size * 0.60, height: size * 0.60, borderRadius: '50%',
        background: `linear-gradient(145deg,${av.accent||'#444'},${av.accent2||'#222'})`,
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#fff', fontWeight:900, fontSize: Math.round(size*0.28),
        fontFamily:"'Bebas Neue',sans-serif",
      }}>
        {String(av.emoji || nickname?.[0] || '?').slice(0,2).toUpperCase()}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 34% 22%, ${av.glow || '#333'}22, ${av.bg || '#111'} 58%)`,
      border: `${rr.w}px solid ${rr.border}`,
      boxShadow: [
        rr.glow !== 'none' ? rr.glow : null,
        `inset 0 1px 0 rgba(255,255,255,0.09)`,
        `inset 0 -1px 0 rgba(0,0,0,0.25)`,
      ].filter(Boolean).join(', ') || undefined,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
      ...extraStyle,
    }}>
      {/* Radial glow behind graphic */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:`radial-gradient(circle at 36% 26%, ${av.glow||'rgba(255,255,255,0.05)'}28, transparent 60%)`,
        pointerEvents:'none',
      }}/>
      {/* Legendary shimmer sweep */}
      {isLeg && av.shine && (
        <div style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background:'linear-gradient(108deg,transparent 22%,rgba(255,255,255,0.11) 44%,transparent 66%)',
          animation:'shimmerPass 3s ease-in-out infinite',
          pointerEvents:'none',
        }}/>
      )}
      {inner}
      {/* Inner ring accent */}
      <div style={{
        position:'absolute', inset:1, borderRadius:'50%',
        border:`1px solid ${av.glow||'rgba(255,255,255,0.06)'}28`,
        pointerEvents:'none',
      }}/>
    </div>
  );
}

// ─── SCORE INPUT ─────────────────────────────────────────────────────────────
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

// ─── STEP INPUT ──────────────────────────────────────────────────────────────
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

// ─── POSSESSION INPUT ────────────────────────────────────────────────────────
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
      <div onClick={handleTrackClick} style={{ position:"relative", height:28, background:"rgba(255,255,255,0.05)", borderRadius:14, cursor:"pointer", overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
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

// ─── SPINNER ─────────────────────────────────────────────────────────────────
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
      {state === "live" && <div style={{ width:6, height:6, borderRadius:"50%", background:"#EF4444", animation:"livePulse 1.5s infinite" }}/>}
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

// ─── GOOGLE / APPLE LOGOS ────────────────────────────────────────────────────
export function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export function AppleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor">
      <path d="M12.27 0c.065.95-.274 1.9-.787 2.596-.514.698-1.355 1.247-2.196 1.178-.08-.912.302-1.855.793-2.49C10.57.636 11.465.111 12.27 0zM15.83 13.143c-.389.86-.854 1.654-1.514 2.318-.606.608-1.246.91-1.906.91-.607 0-1.024-.178-1.62-.458-.617-.288-1.15-.458-1.79-.458-.64 0-1.19.171-1.79.448-.58.266-1.01.442-1.638.464-.654.024-1.32-.312-1.953-.952C2.585 13.782 1.5 11.435 1.5 9.016c0-2.178.855-3.98 2.252-5.118A4.097 4.097 0 0 1 6.5 2.812c.72 0 1.35.225 1.998.458.527.19.955.35 1.37.35.38 0 .803-.152 1.338-.35.72-.257 1.47-.528 2.312-.45 1.28.104 2.23.62 2.846 1.52-1.108.67-1.67 1.73-1.657 3.063.012 1.14.434 2.082 1.124 2.74z"/>
    </svg>
  );
}
