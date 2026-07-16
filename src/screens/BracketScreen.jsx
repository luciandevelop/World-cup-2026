// ─── src/screens/BracketScreen.jsx ───────────────────────────────────────────
// FIFA World Cup 2026 — real knockout bracket.
// R32 (16 matches) → R16 (8) → QF (4) → SF (2) → Final (1) → Champion.
// List view: mobile-first, one round at a time with round tabs.
// Bracket view: horizontal scroll, correct left→center→(no right repeat) layout.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { buildKnockoutSlots, buildQualifiedTeams, MATCHES } from '../data/gameData.js';

// ─── TEAM CELL ────────────────────────────────────────────────────────────────
function TeamCell({ team, flag, label, isWinner, isTop }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 11px', minHeight:36,
      borderBottom: isTop ? '1px solid rgba(255,255,255,0.06)' : 'none',
      background: isWinner ? 'rgba(0,229,160,0.06)' : 'transparent',
    }}>
      {team ? (
        <>
          <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{flag}</span>
          <span style={{
            fontSize:12, fontWeight: isWinner ? 700 : 600,
            color: isWinner ? '#00E5A0' : '#fff',
            flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{team}</span>
          {isWinner && <span style={{ fontSize:10, color:'#00E5A0', flexShrink:0 }}>✓</span>}
        </>
      ) : (
        <>
          <div style={{ width:20, height:20, borderRadius:4, background:'rgba(255,255,255,0.05)', flexShrink:0 }}/>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)', fontStyle:'italic', flex:1 }}>{label}</span>
        </>
      )}
    </div>
  );
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({ match, isFinal, isSmall }) {
  const { home, away, homeLabel, awayLabel, label, winner } = match;
  const bc = isFinal ? 'rgba(212,175,55,0.35)' : (home||away) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
  const bg = isFinal ? 'linear-gradient(135deg,rgba(212,175,55,0.07),rgba(212,175,55,0.03))' : 'rgba(255,255,255,0.025)';

  return (
    <div style={{
      background:bg, border:`1px solid ${bc}`, borderRadius:12, overflow:'hidden',
      minWidth: isSmall ? 138 : isFinal ? 172 : 156, width:'100%',
      boxShadow: isFinal ? '0 4px 24px rgba(212,175,55,0.08)' : 'none',
    }}>
      {label && (
        <div style={{ padding:'3px 10px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:9, color:isFinal?'rgba(212,175,55,0.6)':'rgba(255,255,255,0.2)', fontWeight:700, letterSpacing:'0.08em' }}>
          {label}
        </div>
      )}
      <TeamCell team={home?.team} flag={home?.flag} label={homeLabel} isWinner={winner==='home'} isTop/>
      <TeamCell team={away?.team} flag={away?.flag} label={awayLabel} isWinner={winner==='away'}/>
    </div>
  );
}

// ─── CHAMPION CARD ────────────────────────────────────────────────────────────
function ChampionCard({ team, flag }) {
  if (!team) return null;
  return (
    <div style={{
      margin:'16px 0', padding:'24px 16px',
      background:'linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.04))',
      border:'1px solid rgba(212,175,55,0.35)', borderRadius:18, textAlign:'center',
      animation:'goldPulse 2s ease-in-out infinite',
    }}>
      <div style={{ fontSize:11, color:'rgba(212,175,55,0.55)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>
        🏆 CAMPIOANA MONDIALĂ 2026 🏆
      </div>
      <span style={{ fontSize:52 }}>{flag}</span>
      <div style={{ fontSize:26, fontWeight:900, color:'#FFD700', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.06em', marginTop:8 }}>
        {team}
      </div>
    </div>
  );
}

// ─── THIRDS PANEL ─────────────────────────────────────────────────────────────
// Shows which 3rd-place teams have qualified and their ranking
function ThirdsPanel({ allThirds, qualifiedThirds }) {
  const [open, setOpen] = useState(false);
  if (!allThirds || allThirds.length === 0) return null;

  return (
    <div style={{ marginBottom:12 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'rgba(255,215,0,0.04)', border:'1px solid rgba(255,215,0,0.1)', borderRadius: open?'10px 10px 0 0':10, cursor:'pointer', userSelect:'none' }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontSize:13 }}>🥉</span>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,215,0,0.7)' }}>
            Locuri 3 calificate — {qualifiedThirds?.length||0}/8
          </span>
        </div>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', transform:open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </div>
      {open && (
        <div style={{ background:'rgba(255,215,0,0.02)', border:'1px solid rgba(255,215,0,0.08)', borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'hidden', animation:'revealFlip 0.18s ease' }}>
          {allThirds.slice(0, 12).map((t, i) => {
            const isQ = i < 8;
            return (
              <div key={t.fromGroup} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderBottom: i < allThirds.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isQ ? 'rgba(255,215,0,0.03)' : 'transparent', opacity: isQ ? 1 : 0.4 }}>
                <span style={{ fontSize:10, fontWeight:800, color: isQ?'#FFD700':'rgba(255,255,255,0.3)', width:16, textAlign:'center' }}>{i+1}</span>
                <span style={{ fontSize:16 }}>{t.flag}</span>
                <span style={{ fontSize:12, color:'#fff', fontWeight:600, flex:1 }}>{t.team}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:"'DM Mono',monospace" }}>Gr.{t.fromGroup}</span>
                <div style={{ display:'flex', gap:4, fontFamily:"'DM Mono',monospace" }}>
                  <span style={{ fontSize:10, fontWeight:700, color: isQ?'#FFD700':'rgba(255,255,255,0.3)' }}>{t.pts}p</span>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>{t.gd>0?'+':''}{t.gd}</span>
                </div>
                {isQ && <span style={{ fontSize:8, color:'#FFD700', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', padding:'1px 5px', borderRadius:3, fontWeight:700 }}>✓ Q</span>}
              </div>
            );
          })}
          <div style={{ padding:'6px 12px', fontSize:9, color:'rgba(255,255,255,0.15)', background:'rgba(0,0,0,0.15)' }}>
            Calificați: top 8 din 12 echipe de pe locul 3 · sortate pts → dif.goluri → goluri
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QUALIFICATION BANNER ─────────────────────────────────────────────────────
function QualificationBanner() {
  const bullets = [
    { icon:'⚔️', text:'Faza eliminatorie — fiecare meci contează dublu.', accent:'rgba(0,229,160,0.9)'  },
    { icon:'🔥', text:'Toți jucătorii rămân activi până la finală.',       accent:'rgba(255,152,0,0.9)'  },
    { icon:'👑', text:'Clasamentul principal continuă fără întrerupere.',   accent:'rgba(212,175,55,0.9)' },
    { icon:'🏆', text:'Câștigă cel mai bun pronosticator al turneului.',    accent:'rgba(255,215,0,0.9)'  },
  ];

  return (
    <div style={{
      margin:'0 0 14px',
      background:'linear-gradient(135deg,rgba(12,28,18,0.95),rgba(8,12,14,0.98))',
      border:'1px solid rgba(0,229,160,0.12)',
      borderRadius:14, overflow:'hidden', position:'relative',
    }}>
      {/* Cinematic top bar */}
      <div style={{ height:2, background:'linear-gradient(90deg,transparent 0%,rgba(0,229,160,0.6) 30%,rgba(212,175,55,0.6) 70%,transparent 100%)' }}/>
      <div style={{ padding:'13px 15px 15px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:11 }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>🏆</div>
          <span style={{ fontSize:9, letterSpacing:'0.2em', color:'rgba(212,175,55,0.6)', textTransform:'uppercase', fontWeight:800 }}>FAZA ELIMINATORIE</span>
        </div>
        {bullets.map((b, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:9, padding:'7px 0',
            borderBottom: i < bullets.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            animation:`staggerIn 0.3s ${i*0.08}s ease both`,
          }}>
            <span style={{ fontSize:14, flexShrink:0, lineHeight:1.5 }}>{b.icon}</span>
            <span style={{ fontSize:12, fontWeight:600, color:b.accent, lineHeight:1.55 }}>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
// confirmedWinners/confirmedRunnersUp: VISUAL-ONLY override counts, matching
// the manually-confirmed teams already shown in the bracket slots above
// (Mexic, Brazilia, Germania, Elvetia, SUA, Argentina = 6 winners;
// Africa de Sud, Canada, Maroc = 3 runners-up). These do NOT come from
// buildQualifiedTeams() — that function still correctly requires full real
// group completion and is untouched. This is purely a display counter fix.
function GroupProgress({ finished, total, groupsCompleted, qualifiedThirds, confirmedWinners = 0, confirmedRunnersUp = 0 }) {
  const pct  = Math.round((finished / total) * 100);
  const done = finished === total;
  const thirdsCount = qualifiedThirds?.length || 0;
  const allDone = groupsCompleted?.length === 12;
  // Use the larger of (real completed groups) vs (manually confirmed) so the
  // counter never goes backward once buildQualifiedTeams catches up for real.
  const winnersCount = Math.max(groupsCompleted?.length || 0, confirmedWinners);
  const runnersUpCount = Math.max(groupsCompleted?.length || 0, confirmedRunnersUp);

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {allDone ? '✅ Grupe complete — tabloul e activ' : 'Faza grupelor în desfășurare'}
        </span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}>
          {groupsCompleted?.length||0}/12 grupe
        </span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', width:`${(groupsCompleted?.length||0)/12*100}%`, background: allDone ? 'linear-gradient(90deg,#FFD700,#F59E0B)' : 'linear-gradient(90deg,#00E5A0,#00C27A)', borderRadius:2, transition:'width 0.6s ease' }}/>
      </div>
      {/* Qualification counts */}
      <div style={{ display:'flex', gap:6 }}>
        {[
          { label:'Castigatoare grupe', value:winnersCount,    max:12, color:'#00E5A0' },
          { label:'Locuri secunde',      value:runnersUpCount, max:12, color:'#4A9EFF' },
          { label:'Cele mai bune locuri 3', value:thirdsCount, max:8,  color:'#FFD700' },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, padding:'6px 8px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, textAlign:'center' }}>
            <div style={{ fontSize:12, fontWeight:800, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.value}<span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>/{s.max}</span></div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.2)', marginTop:1, letterSpacing:'0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {!allDone && (
        <div style={{ marginTop:7, fontSize:10, color:'rgba(255,215,0,0.45)', display:'flex', alignItems:'center', gap:5 }}>
          <span>🔒</span><span>Tabloul se completează automat după finalizarea tuturor grupelor</span>
        </div>
      )}
    </div>
  );
}

// ─── EMPTY SLOTS HELPER ───────────────────────────────────────────────────────
const mkEmpty = (count, key, lbl) =>
  Array.from({length:count}, (_,i) => ({
    id:`${key}_${i}`, home:null, away:null,
    homeLabel:`Câșt. ${lbl}`, awayLabel:`Câșt. ${lbl}`,
  }));

// ─── KNOCKOUT ROADMAP — full numeric structure, R32 through Final ────────────
// This is the complete visual roadmap (ids 73-104) as specified. It does NOT
// create predictions or touch matches.js — purely a display structure mapping
// each visual slot to its source matches (by winner/loser reference) so users
// can follow the bracket path the way Flashscore shows it.
const R32_SLOT_INFO = {
  73: { home: 'Africa de Sud', away: 'Canada' },
  74: { home: 'Brazilia', away: 'Japonia' },
  75: { home: 'Germania', away: 'Paraguay' },
  76: { home: 'Olanda', away: 'Maroc' },
  77: { home: 'Coasta de Fildes', away: 'Norvegia' },
  78: { home: 'Anglia', away: 'RD Congo' },
  79: { home: 'Mexic', away: 'Ecuador' },
  80: { home: 'Franta', away: 'Suedia' },
  81: { home: 'Belgia', away: 'Senegal' },
  82: { home: 'SUA', away: 'Bosnia' },
  83: { home: 'Spania', away: 'Austria' },
  84: { home: 'Portugalia', away: 'Croatia' },
  85: { home: 'Elvetia', away: 'Algeria' },
  86: { home: 'Australia', away: 'Egipt' },
  87: { home: 'Argentina', away: 'Capul Verde' },
  88: { home: 'Columbia', away: 'Ghana' },
};
const R32_IDS = Object.keys(R32_SLOT_INFO).map(Number).sort((a,b)=>a-b); // 73..88

// Flags for every known team appearing in R32_SLOT_INFO (complete matches +
// single-side known teams). Used so partial slots (e.g. Germania waiting for
// an opponent) show a flag too, not just the 4 fully-confirmed matches.
const R32_TEAM_FLAGS = {
  'Africa de Sud': '🇿🇦', 'Canada': '🇨🇦',
  'Brazilia': '🇧🇷', 'Japonia': '🇯🇵',
  'Germania': '🇩🇪', 'Paraguay': '🇵🇾',
  'Olanda': '🇳🇱', 'Maroc': '🇲🇦',
  'Coasta de Fildes': '🇨🇮', 'Norvegia': '🇳🇴',
  'Anglia': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'RD Congo': '🇨🇩',
  'Mexic': '🇲🇽', 'Ecuador': '🇪🇨',
  'Franta': '🇫🇷', 'Suedia': '🇸🇪',
  'Belgia': '🇧🇪', 'Senegal': '🇸🇳',
  'SUA': '🇺🇸', 'Bosnia': '🇧🇦',
  'Spania': '🇪🇸', 'Austria': '🇦🇹',
  'Portugalia': '🇵🇹', 'Croatia': '🇭🇷',
  'Elvetia': '🇨🇭', 'Algeria': '🇩🇿',
  'Australia': '🇦🇺', 'Egipt': '🇪🇬',
  'Argentina': '🇦🇷', 'Capul Verde': '🇨🇻',
  'Columbia': '🇨🇴', 'Ghana': '🇬🇭',
};

// Visual pairing order for the 16-imi tab: each row shows the two R32 matches
// whose winners meet in the same Optimi (R16) slot, so users can find M73
// next to M75 when Optimi says "Câșt. M73 vs Câșt. M75". This is purely a
// display order — it does not change any winner mapping (R16_SLOTS below
// remains the single source of truth for who actually plays whom).
const R32_PAIR_ROWS = [
  { left:73, right:76, r16:89 },
  { left:74, right:77, r16:90 },
  { left:75, right:78, r16:91 },
  { left:79, right:80, r16:92 },
  { left:83, right:84, r16:93 },
  { left:81, right:82, r16:94 },
  { left:86, right:88, r16:95 },
  { left:85, right:87, r16:96 },
];

// R16: each slot references the two R32 match numbers that feed it.
// CORRECTED: M89 is Africa de Sud/Canada (73) vs Olanda/Maroc (76) — NOT 73+75
// as previously listed. M91 is Germania (75) vs 1°Gr.I (78) accordingly.
const R16_SLOTS = [
  { id:89, from:[73,76] },
  { id:90, from:[74,77] },
  { id:91, from:[75,78] },
  { id:92, from:[79,80] },
  { id:93, from:[83,84] },
  { id:94, from:[81,82] },
  { id:95, from:[86,88] },
  { id:96, from:[85,87] },
];
// QF: each slot references the two R16 match numbers that feed it.
const QF_SLOTS = [
  { id:97,  from:[89,91] },  // Maroc(M89) vs Franta(M91) — confirmed
  { id:98,  from:[93,94] },  // câșt.M93 vs câșt.M94 — placeholder
  { id:99,  from:[90,92] },  // Norvegia(M90) vs Anglia(M92) — confirmed
  { id:100, from:[95,96] },  // câșt.M95 vs câșt.M96 — placeholder
];
// SF: each slot references the two QF match numbers that feed it.
const SF_SLOTS = [
  { id:101, from:[97,98] },
  { id:102, from:[99,100] },
];

// Build a short preview string for a winner-reference slot, e.g.
// "Africa de Sud / Canada" when the source match has known teams, or just
// "M73" when nothing is known yet. Purely cosmetic — helps users follow the
// path without the app pretending to know an unconfirmed team.
const r32Preview = (matchNum) => {
  const info = R32_SLOT_INFO[matchNum];
  if (!info) return `M${matchNum}`;
  const h = info.home.startsWith('1°') || info.home.startsWith('2°') || info.home.startsWith('3°') ? null : info.home;
  const a = info.away.startsWith('1°') || info.away.startsWith('2°') || info.away.startsWith('3°') ? null : info.away;
  if (h && a) return `${h} / ${a}`;
  if (h) return `${h} / ?`;
  return `M${matchNum}`;
};

// ─── ROUND LIST VIEW — mobile primary ────────────────────────────────────────
function RoundListView({ confirmedR32, r32IdRange, champion }) {
  const [active, setActive] = useState('r32');

  // R32 — strictly chronological numeric order 73..88. Complete matches show
  // both teams; partial matches show the known team + a clear group placeholder;
  // fully unknown matches show placeholders on both sides. No team is invented.
  const r32 = R32_IDS.map(id => {
    const info = R32_SLOT_INFO[id];
    const homeKnown = !(/^[123]°/.test(info.home));
    const awayKnown = !(/^[123]°/.test(info.away));
    return {
      id,
      home: homeKnown ? { team: info.home, flag: R32_TEAM_FLAGS[info.home] || '' } : null,
      away: awayKnown ? { team: info.away, flag: R32_TEAM_FLAGS[info.away] || '' } : null,
      homeLabel: info.home,
      awayLabel: info.away,
    };
  });
  const r32ById = Object.fromEntries(r32.map(m => [m.id, m]));

  // Confirmed R16 teams — populated as Round of 16 fixtures are determined.
  // Only slots with both teams confirmed are filled; the rest stay as
  // "Câșt. M[X]" winner references until results are known.
  const CONFIRMED_R16 = {
    89: { home: { team: 'Canada',    flag: '🇨🇦' }, away: { team: 'Maroc',      flag: '🇲🇦' } },
    90: { home: { team: 'Brazilia',  flag: '🇧🇷' }, away: { team: 'Norvegia',   flag: '🇳🇴' } },
    91: { home: { team: 'Paraguay',  flag: '🇵🇾' }, away: { team: 'Franta',     flag: '🇫🇷' } },
    92: { home: { team: 'Mexic',     flag: '🇲🇽' }, away: { team: 'Anglia',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' } },
    93: { home: { team: 'Spania',    flag: '🇪🇸' }, away: { team: 'Portugalia', flag: '🇵🇹' } },
    94: { home: { team: 'Belgia',    flag: '🇧🇪' }, away: { team: 'SUA',        flag: '🇺🇸' } },
    95: { home: { team: 'Argentina', flag: '🇦🇷' }, away: { team: 'Egipt',      flag: '🇪🇬' } },
    96: { home: { team: 'Elvetia',   flag: '🇨🇭' }, away: { team: 'Columbia',   flag: '🇨🇴' } },
  };

  // R16 — winner-reference slots (89-96), with a small preview line.
  const r16 = R16_SLOTS.map(s => {
    const confirmed = CONFIRMED_R16[s.id];
    return {
      id: s.id,
      home: confirmed ? confirmed.home : null,
      away: confirmed ? confirmed.away : null,
      homeLabel: confirmed ? confirmed.home.team : `Câșt. M${s.from[0]}`,
      awayLabel: confirmed ? confirmed.away.team : `Câșt. M${s.from[1]}`,
      preview: `${r32Preview(s.from[0])}  vs  ${r32Preview(s.from[1])}`,
    };
  });

  // QF — winner-reference slots (97-100), fill confirmed matches.
  const CONFIRMED_QF = {
    97:  { home: { team: 'Franta',    flag: '🇫🇷' }, away: { team: 'Maroc',   flag: '🇲🇦' } },
    98:  { home: { team: 'Spania',    flag: '🇪🇸' }, away: { team: 'Belgia',  flag: '🇧🇪' } },
    99:  { home: { team: 'Norvegia',  flag: '🇳🇴' }, away: { team: 'Anglia',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' } },
    100: { home: { team: 'Argentina', flag: '🇦🇷' }, away: { team: 'Elvetia', flag: '🇨🇭' } },
  };
  const qf = QF_SLOTS.map(s => {
    const confirmed = CONFIRMED_QF[s.id];
    return {
      id: s.id,
      home: confirmed ? confirmed.home : null,
      away: confirmed ? confirmed.away : null,
      homeLabel: confirmed ? confirmed.home.team : `Câșt. M${s.from[0]}`,
      awayLabel: confirmed ? confirmed.away.team : `Câșt. M${s.from[1]}`,
    };
  });

  // SF — winner-reference slots (101-102).
  const CONFIRMED_SF = {
    101: { home: { team:'Franta',  flag:'🇫🇷' }, away: { team:'Spania',    flag:'🇪🇸' } },
    102: { home: { team:'Anglia',  flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, away: { team:'Argentina', flag:'🇦🇷' } },
  };
  const sf = SF_SLOTS.map(s => {
    const confirmed = CONFIRMED_SF[s.id];
    return {
      id: s.id,
      home: confirmed ? confirmed.home : null,
      away: confirmed ? confirmed.away : null,
      homeLabel: confirmed ? confirmed.home.team : `Câșt. M${s.from[0]}`,
      awayLabel: confirmed ? confirmed.away.team : `Câșt. M${s.from[1]}`,
    };
  });

  const ROUND_DATA = {
    r32: { matches:r32, label:'Șaisprezecimi',      isFinal:false },
    r16: { matches:r16, label:'Optimi de Finală',   isFinal:false },
    qf:  { matches:qf,  label:'Sferturi de Finală', isFinal:false },
    sf:  { matches:sf,  label:'Semifinale',         isFinal:false },
    f:   { matches:[{ id:104, home:{team:'Spania',flag:'🇪🇸'}, away:{team:'Argentina',flag:'🇦🇷'}, homeLabel:'Spania', awayLabel:'Argentina' }], label:'🏆 Finala', isFinal:true },
  };

  // M103 — finala mică (loser references from the 2 semifinals).
  const thirdPlaceMatch = {
    id: 103,
    home: null, away: null,
    homeLabel: 'Pierz. M101', awayLabel: 'Pierz. M102',
    label: '🥉 M103 — FINALA MICĂ',
  };

  const TABS = [
    { id:'r32', label:'16-imi'  },
    { id:'r16', label:'Optimi'  },
    { id:'qf',  label:'Sferturi'},
    { id:'sf',  label:'Semi'    },
    { id:'f',   label:'🏆 Final'},
  ];

  const cur     = ROUND_DATA[active];
  const curIdx  = TABS.findIndex(t => t.id === active);

  return (
    <div>
      {/* Round tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:14, overflowX:'auto' }}>
        {TABS.map((t, i) => {
          const isActive = active === t.id;
          const isLast   = t.id === 'f';
          return (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              flex:1, padding:'7px 3px', border:'none', cursor:'pointer',
              borderRadius:9, transition:'all 0.15s', whiteSpace:'nowrap',
              background: isActive ? (isLast?'rgba(212,175,55,0.18)':'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.03)',
              borderBottom:`2px solid ${isActive ? (isLast?'#FFD700':'#00E5A0') : 'transparent'}`,
              color: isActive ? (isLast?'#FFD700':'#fff') : 'rgba(255,255,255,0.3)',
              fontSize:10, fontWeight: isActive ? 800 : 500,
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Final tab — special full-width layout, shows M103 + M104 */}
      {active === 'f' ? (
        <div>
          {/* M103 — Finala mică, always shown above the main final */}
          <div style={{ marginBottom:14 }}>
            <MatchCard match={thirdPlaceMatch} isFinal={false}/>
          </div>

          {champion ? (
            <ChampionCard team={champion.team} flag={champion.flag}/>
          ) : (
            <div>
              <div style={{ marginBottom:12, padding:'12px 14px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:12 }}>
                <div style={{ fontSize:11, color:'rgba(212,175,55,0.6)', marginBottom:4, fontWeight:700 }}>🏆 M104 — MAREA FINALĂ</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                  Cei doi finaliști se vor decide după semifinale.
                </div>
              </div>
              <MatchCard match={{...cur.matches[0], label:'🏆 M104 — FINALA MARE'}} isFinal/>
            </div>
          )}
        </div>
      ) : active === 'r32' ? (
        <div>
          {/* Round label */}
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            {cur.label}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400 }}>— {cur.matches.length} meciuri</span>
          </div>
          {/* Paired rows: left/right match whose winners meet in the same Optimi
              (R16) slot, with a small label showing exactly which Optimi match
              that is — so users can trace M73/M75 → M89 visually. Match number
              badges (M73, M75, ...) appear on every card via the label prop. */}
          {R32_PAIR_ROWS.map((row) => (
            <div key={row.r16} style={{ marginBottom:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <MatchCard match={{...r32ById[row.left],  label:`M${row.left}`}}  isFinal={false}/>
                <MatchCard match={{...r32ById[row.right], label:`M${row.right}`}} isFinal={false}/>
              </div>
              <div style={{ fontSize:9.5, color:'rgba(0,229,160,0.45)', textAlign:'center', marginTop:5, fontWeight:600 }}>
                câștigătoarele joacă în M{row.r16}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Round label */}
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.55)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            {cur.label}
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400 }}>— {cur.matches.length} meciuri</span>
          </div>
          {/* 2-col grid for r16/qf/sf rounds — unchanged from before */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {cur.matches.map((m, i) => (
              <div key={m.id||i}>
                <MatchCard match={{...m, label:`M${m.id}`}} isFinal={false}/>
                {/* Small preview line for R16, showing the R32 source teams when known */}
                {active === 'r16' && m.preview && (
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:2, paddingLeft:4, lineHeight:1.4 }}>
                    {m.preview}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
        {curIdx > 0 ? (
          <button onClick={() => setActive(TABS[curIdx-1].id)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:11, padding:'6px 12px', cursor:'pointer' }}>
            ← {TABS[curIdx-1].label}
          </button>
        ) : <div/>}
        {curIdx < TABS.length-1 ? (
          <button onClick={() => setActive(TABS[curIdx+1].id)} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:11, padding:'6px 12px', cursor:'pointer' }}>
            {TABS[curIdx+1].label} →
          </button>
        ) : (
          // Terminal state — no forward button, show a closing note
          <div style={{ fontSize:10, color:'rgba(212,175,55,0.4)', fontStyle:'italic' }}>
            {champion ? '🏆 Turneul s-a încheiat' : 'Turneul se termină aici'}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function BracketScreen() {
  // SAFETY NOTE: buildKnockoutSlots()'s FIXED_PAIRINGS/THIRD_PLACE_SLOTS table
  // is a provisional convention, NOT the official FIFA draw — confirmed during
  // this session that slots like 'm38' don't actually match real fixtures
  // (e.g. it pairs 2C vs 2D, not 1F vs 2C as the real draw produced). Rather
  // than risk displaying a wrong pairing, the visual Round of 32 list below is
  // built directly and independently from confirmed numeric match IDs (73-88,
  // chronological reserved slots), with NO dependency on FIXED_PAIRINGS at all.
  // This does not touch buildKnockoutSlots, buildQualifiedTeams, or any
  // scoring/prediction logic — it is a separate, additive display list.
  const r32Raw = useMemo(() => buildKnockoutSlots(), []);
  const r32 = r32Raw; // unchanged — no slot-forcing override (removed, see note above)

  // VISUAL-ONLY: officially confirmed Round of 32 fixtures, keyed by their
  // reserved chronological numeric id (73-88). Unconfirmed ids are simply
  // absent here and rendered as empty/placeholder rows below — adding a new
  // confirmed match later only requires adding one entry to this object,
  // never reordering existing ones.
  const CONFIRMED_R32 = {
    73: { home: { team: 'Africa de Sud', flag: '🇿🇦' }, away: { team: 'Canada', flag: '🇨🇦' }, venue: 'Los Angeles', dateLabel: '28 Iun' },
    74: { home: { team: 'Brazilia',      flag: '🇧🇷' }, away: { team: 'Japonia', flag: '🇯🇵' }, venue: 'Houston',     dateLabel: '29 Iun' },
    76: { home: { team: 'Olanda',        flag: '🇳🇱' }, away: { team: 'Maroc',   flag: '🇲🇦' }, venue: 'Monterrey',   dateLabel: '30 Iun' },
    82: { home: { team: 'SUA',           flag: '🇺🇸' }, away: { team: 'Bosnia',  flag: '🇧🇦' }, venue: 'Santa Clara', dateLabel: '02 Iul' },
  };
  // Chronological reserved range — ids without a confirmed entry render as
  // empty placeholder rows, preserving their position for future additions.
  const R32_ID_RANGE = Array.from({ length: 16 }, (_, i) => 73 + i); // 73..88

  const { groupsCompleted, qualifiedThirds, allThirds } = useMemo(() => buildQualifiedTeams(), []);

  const totalMatches    = MATCHES.length;
  const finishedMatches = MATCHES.filter(m => m.isFinished).length;
  const champion        = null; // wire when tournament ends: { team, flag }

  return (
    <div style={{ paddingBottom:24 }}>

      {/* Header */}
      <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:9, color:'rgba(212,175,55,0.55)', letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
          FIFA World Cup 2026™
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', fontFamily:"'Bebas Neue',sans-serif" }}>
              TABLOUL ELIMINATORIU
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:2 }}>
              R32 → R16 → SF → Semi → 🏆
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'12px 14px 0' }}>
        {/* confirmedWinners/confirmedRunnersUp: VISUAL-ONLY manual counts.
            Winners (7): Mexic(1A), Elvetia(1B), Brazilia(1C), SUA(1D), Germania(1E),
                         Olanda(1F), Argentina(1J).
            Runners-up (4): Africa de Sud(2A), Canada(2B), Maroc(2C), Japonia(2F).
            Best-third-place counter intentionally stays at its real computed value
            (0 unless buildQualifiedTeams has fully confirmed official data) — per
            explicit instruction: Bosnia appearing in a confirmed exact match (id 82)
            does NOT inflate the global best-third-place qualification counter. */}
        <GroupProgress finished={finishedMatches} total={totalMatches} groupsCompleted={groupsCompleted} qualifiedThirds={qualifiedThirds} confirmedWinners={7} confirmedRunnersUp={4}/>
        <ThirdsPanel allThirds={allThirds} qualifiedThirds={qualifiedThirds}/>
        <QualificationBanner/>

        {/* ── Reguli speciale faza eliminatorie ── */}
        <div style={{ marginTop:12, marginBottom:4, padding:'12px 14px', background:'linear-gradient(135deg,rgba(74,158,255,0.07),rgba(74,158,255,0.02))', border:'1px solid rgba(74,158,255,0.18)', borderRadius:13 }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#4A9EFF', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:9 }}>
            ⚡ Reguli speciale — Eliminatorii
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ fontSize:16, flexShrink:0 }}>🔥</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>All or Nothing</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.45 }}>
                  La semifinale, finala mică și finala mare, punctele tuturor se dublează automat.
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ fontSize:16, flexShrink:0 }}>🃏</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2 }}>Joker-e (×2)</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.45 }}>
                  2 joker-e per jucător, de folosit pe orice meci din optimi, 16imi sau sferturi — dublează punctele tale de la meciul ales. Nu sunt valabile la semifinale/finale (acolo e deja All or Nothing).
                </div>
              </div>
            </div>
          </div>
        </div>

        <RoundListView confirmedR32={CONFIRMED_R32} r32IdRange={R32_ID_RANGE} champion={champion}/>

        {/* Format note */}
        <div style={{ marginTop:16, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.28)', marginBottom:5 }}>FORMAT WC 2026</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', lineHeight:1.7 }}>
            <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 1</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>12 × locul 2</strong> + <strong style={{ color:'rgba(255,255,255,0.35)' }}>8 × cele mai bune locuri 3</strong> = 32 echipe calificate.
            Meciuri directe eliminatorii până la finală.
          </div>
        </div>
      </div>
    </div>
  );
}
