// ─── src/data/avatars.js ──────────────────────────────────────────────────────
// 32 selectable football-personality avatars.
// Each has: id, emoji, name, description, bg, accent, ring
// ─────────────────────────────────────────────────────────────────────────────

export const AVATARS = [
  // ── Legends & Stars ──
  { id:'goat',         emoji:'🐐', name:'The GOAT',          desc:'Niciun comentariu necesar',     bg:'#1a1a2e', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#FFA500)' },
  { id:'brazilian',    emoji:'⭐', name:'Starul Brazilian',   desc:'Dribling, dans și goluri',      bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#FFD700)' },
  { id:'retro',        emoji:'🎽', name:'Fotbalistul Retro',  desc:'Din era clasică a fotbalului',  bg:'#2d1a0a', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#FFD700)' },
  { id:'wonderkid',    emoji:'🌟', name:'Wonderkid',         desc:'Talent de 100M €',              bg:'#0a1a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#7B5EA7)' },
  { id:'captain',      emoji:'🦁', name:'Căpitanul',         desc:'Lider în vestiar și pe teren',  bg:'#1a0a2d', accent:'#9B59B6', ring:'linear-gradient(135deg,#9B59B6,#4A9EFF)' },

  // ── Fan Culture ──
  { id:'ultra',        emoji:'📣', name:'Ultra Supporter',   desc:'Inimă de ultras, voce de tunet', bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FF9800)' },
  { id:'scarfman',     emoji:'🧣', name:'Omul cu Fular',     desc:'În frig sau caniculă — acolo e',bg:'#0a2d2d', accent:'#14B8A6', ring:'linear-gradient(135deg,#14B8A6,#4A9EFF)' },
  { id:'superfan',     emoji:'🎉', name:'Super Fan',         desc:'Zugrăvit pe față, orice meci',  bg:'#2d2d0a', accent:'#F59E0B', ring:'linear-gradient(135deg,#F59E0B,#FF9800)' },
  { id:'couch',        emoji:'🛋️', name:'Expert Canapea',   desc:'Vede TOTUL. Din canapea.',       bg:'#1a1a1a', accent:'#6B7280', ring:'linear-gradient(135deg,#6B7280,#4A9EFF)' },
  { id:'barman',       emoji:'🍺', name:'Patron de Bar',     desc:'Meciurile se văd mai bine la el',bg:'#1a1a0a', accent:'#F59E0B', ring:'linear-gradient(135deg,#F59E0B,#84CC16)' },

  // ── Coaching Staff ──
  { id:'tactician',    emoji:'📋', name:'Tacticianul',       desc:'4-3-3 sau moarte',               bg:'#0a1a0a', accent:'#84CC16', ring:'linear-gradient(135deg,#84CC16,#00E5A0)' },
  { id:'villain_coach',emoji:'😈', name:'Antrenorul Villain', desc:'Parking the bus din 2010',      bg:'#2d0a2d', accent:'#9B59B6', ring:'linear-gradient(135deg,#9B59B6,#EF4444)' },
  { id:'motivator',    emoji:'💪', name:'Motivatorul',       desc:'Discurs epic la pauză, mereu',  bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#84CC16)' },
  { id:'analyst',      emoji:'📊', name:'Analistul',         desc:'xG, xA, pressures per 90',       bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#06B6D4)' },

  // ── Positions ──
  { id:'keeper',       emoji:'🧤', name:'Portarul',          desc:'Ultimul zid. Eroul uitat.',      bg:'#1a0a0a', accent:'#FF6B6B', ring:'linear-gradient(135deg,#FF6B6B,#F59E0B)' },
  { id:'striker',      emoji:'⚡', name:'Vârful de Atac',    desc:'Penalty în minutul 90+3',        bg:'#2d1a0a', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#EF4444)' },
  { id:'midfielder',   emoji:'🎯', name:'Creatorul de Joc',  desc:'Asist după asist',               bg:'#0a1a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#00E5A0)' },
  { id:'defender',     emoji:'🛡️', name:'Fundașul Solid',   desc:'Clean sheet sau nimic',          bg:'#0a0a1a', accent:'#6B7280', ring:'linear-gradient(135deg,#6B7280,#4A9EFF)' },
  { id:'winger',       emoji:'🏃', name:'Extrema Rapidă',   desc:'1v1 câștigat 100% din timp',     bg:'#0a2d1a', accent:'#84CC16', ring:'linear-gradient(135deg,#84CC16,#F59E0B)' },

  // ── Character Types ──
  { id:'bald_angry',   emoji:'😤', name:'Chelul Furios',     desc:'VAR e o conspirație globală',    bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FF6B6B)' },
  { id:'nostradamus',  emoji:'🔮', name:'Nostradamus',       desc:'A prezis totul. Mereu.',         bg:'#2d0a2d', accent:'#9B59B6', ring:'linear-gradient(135deg,#9B59B6,#FFD700)' },
  { id:'stat_nerd',    emoji:'🤓', name:'Nerdul de Statistici',desc:'Expected goals în somn',       bg:'#0a0a2d', accent:'#06B6D4', ring:'linear-gradient(135deg,#06B6D4,#4A9EFF)' },
  { id:'lucky',        emoji:'🍀', name:'Norocosul',         desc:'Ghicește mereu. Habar n-are cum',bg:'#0a2d0a', accent:'#84CC16', ring:'linear-gradient(135deg,#84CC16,#00E5A0)' },
  { id:'dramatic',     emoji:'🎭', name:'Dramaticul',        desc:'Orice fault e un penalty clar',  bg:'#1a0a1a', accent:'#F43F5E', ring:'linear-gradient(135deg,#F43F5E,#9B59B6)' },

  // ── World Cup Vibes ──
  { id:'worldcup',     emoji:'🏆', name:'Trophy Hunter',     desc:'Vine doar pentru Cupă',          bg:'#1a1a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#F59E0B)' },
  { id:'ref',          emoji:'🟨', name:'Arbitrul',          desc:'Mereu văzut cel mai corect',     bg:'#2d2d0a', accent:'#F59E0B', ring:'linear-gradient(135deg,#F59E0B,#EF4444)' },
  { id:'commentator',  emoji:'🎙️', name:'Comentatorul',     desc:'GOOOLLLLL! Gol Ionescu!',        bg:'#0a1a1a', accent:'#06B6D4', ring:'linear-gradient(135deg,#06B6D4,#4A9EFF)' },
  { id:'volunteer',    emoji:'🦺', name:'Voluntarul',        desc:'Organizează tot, vede nimic',    bg:'#0a2d2d', accent:'#14B8A6', ring:'linear-gradient(135deg,#14B8A6,#84CC16)' },
  { id:'journalist',   emoji:'📸', name:'Jurnalistul',       desc:'Primul la conferință de presă',  bg:'#1a0a2d', accent:'#7C3AED', ring:'linear-gradient(135deg,#7C3AED,#4A9EFF)' },
  { id:'doctor',       emoji:'🏥', name:'Doctorul Echipei',  desc:'Stretcher în 90+5. Mereu.',      bg:'#0a0a1a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FF9800)' },
  { id:'manager',      emoji:'💼', name:'Directorul Sportiv',desc:'Transfer windows + Excel sheets', bg:'#1a1a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#FFD700)' },
  { id:'mascot',       emoji:'🦊', name:'Mascota',           desc:'Cel mai popular de pe stadion',   bg:'#2d1a1a', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#FFD700)' },
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

// Deterministic avatar from nickname (for users who haven't picked yet)
export function getDefaultAvatarForNick(nickname) {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) - hash) + nickname.charCodeAt(i);
    hash |= 0;
  }
  return AVATARS[Math.abs(hash) % AVATARS.length];
}
