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

  // ── 🌍 Qualified Nations — Flags ─────────────────────────────────────────
  // rarity: 'common'
  { id:'flag_bra', emoji:'🇧🇷', name:'Brazilia',       desc:'Cea mai titrată națională din lume', bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'common' },
  { id:'flag_arg', emoji:'🇦🇷', name:'Argentina',      desc:'Campioana mondială în exercițiu',    bg:'#0a1a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#fff)',   rarity:'common' },
  { id:'flag_fra', emoji:'🇫🇷', name:'Franța',         desc:'Les Bleus — forță brută',            bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#EF4444)', rarity:'common' },
  { id:'flag_eng', emoji:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', name:'Anglia',          desc:"It's coming home. Mereu.",           bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'common' },
  { id:'flag_esp', emoji:'🇪🇸', name:'Spania',         desc:'Tiki-taka și titluri europene',      bg:'#2d0a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'common' },
  { id:'flag_ger', emoji:'🇩🇪', name:'Germania',       desc:'Eficiență maximă, întotdeauna',      bg:'#1a1a1a', accent:'#FFD700', ring:'linear-gradient(135deg,#6B7280,#FFD700)', rarity:'common' },
  { id:'flag_por', emoji:'🇵🇹', name:'Portugalia',     desc:'Cristiano și compania',              bg:'#0a2d0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#00E5A0)', rarity:'common' },
  { id:'flag_ned', emoji:'🇳🇱', name:'Olanda',         desc:'Totaalvoetbal DNA',                  bg:'#2d1a0a', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#FFD700)', rarity:'common' },
  { id:'flag_bel', emoji:'🇧🇪', name:'Belgia',         desc:'Generație de aur',                  bg:'#2d0a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'common' },
  { id:'flag_ita', emoji:'🇮🇹', name:'Italia',         desc:'Catenaccio și stil',                bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#00E5A0)', rarity:'common' },
  { id:'flag_usa', emoji:'🇺🇸', name:'SUA',            desc:'Gazdele turneului 2026',             bg:'#0a0a2d', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#4A9EFF)', rarity:'common' },
  { id:'flag_mor', emoji:'🇲🇦', name:'Maroc',          desc:'Revelația CM 2022',                 bg:'#0a2d0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#00E5A0)', rarity:'common' },

  // ── 👕 National Jerseys — Rare ────────────────────────────────────────────
  // rarity: 'rare'
  { id:'kit_bra',  emoji:'🟡', name:'Tricoul Braziliei',   desc:'Galben și verde — cel mai iconic', bg:'#1a2d0a', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#00E5A0)', rarity:'rare' },
  { id:'kit_arg',  emoji:'🔵', name:'Tricoul Argentinei',  desc:'Albastru-alb și Campioni Mondiali',bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#FFD700)', rarity:'rare' },
  { id:'kit_fra',  emoji:'🔷', name:'Tricoul Franței',     desc:'Les Bleus — tricoul nr.10 iconic', bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#EF4444)', rarity:'rare' },
  { id:'kit_eng',  emoji:'⬜', name:'Tricoul Angliei',     desc:'Cele Trei Lei — tricoul alb clasic',bg:'#1a1a1a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'rare' },
  { id:'kit_ger',  emoji:'⬛', name:'Tricoul Germaniei',   desc:'Das Nationalteam — negru iconic', bg:'#1a1a1a', accent:'#FFD700', ring:'linear-gradient(135deg,#1a1a1a,#FFD700)', rarity:'rare' },
  { id:'kit_esp',  emoji:'🔴', name:'Tricoul Spaniei',     desc:'La Roja — campioni mondiali',      bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'rare' },
  { id:'kit_nor',  emoji:'🇳🇴', name:'Tricoul Norvegiei',  desc:'Nr.9 HAALAND scris pe spate',     bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'rare' },

  // ── ⭐ Superstar Jerseys — EPIC ────────────────────────────────────────────
  // rarity: 'epic'
  { id:'mbappe_10',  emoji:'⚡', name:'MBAPPÉ #10',     desc:'France · PSG / Real Madrid · Viteza pură', bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#EF4444)', rarity:'epic',   shine:true },
  { id:'vinicius_7', emoji:'🌪️', name:'VINICIUS #7',   desc:'Brazil · Real Madrid · Ballon d\'Or 2024',  bg:'#0a2d0a', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#00E5A0)', rarity:'epic',   shine:true },
  { id:'messi_10',   emoji:'🐐', name:'MESSI #10',      desc:'Argentina · Inter Miami · The GOAT',        bg:'#0a1a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#FFD700)', rarity:'epic',   shine:true },
  { id:'yamal_19',   emoji:'💫', name:'YAMAL #19',      desc:'Spain · Barcelona · Lamine la nouă generație',bg:'#2d0a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic',  shine:true },
  { id:'haaland_9',  emoji:'💣', name:'HAALAND #9',     desc:'Norway · Man City · Mașina de goluri',      bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#00E5A0)', rarity:'epic',   shine:true },
  { id:'ronaldo_7',  emoji:'🦁', name:'RONALDO #7',     desc:'Portugal · Al-Nassr · CR7 Forever',         bg:'#0a2d0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#00E5A0)', rarity:'epic',   shine:true },
  { id:'bellingham', emoji:'🎯', name:'BELLINGHAM #5',  desc:'England · Real Madrid · Generație nouă',    bg:'#2d0a0a', accent:'#FF9800', ring:'linear-gradient(135deg,#EF4444,#FF9800)', rarity:'epic',   shine:true },
  { id:'saka_7',     emoji:'🏹', name:'SAKA #7',        desc:'England · Arsenal · Assist machine',        bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic',   shine:true },

  // ── 🔮 Rare / Legendary ───────────────────────────────────────────────────
  // rarity: 'legendary'
  { id:'trophy_gold',emoji:'🏆', name:'Campion Mondial',  desc:'Numai pentru cei mai buni',          bg:'#2d2000', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#FFA500)', rarity:'legendary', shine:true },
  { id:'golden_ball', emoji:'⚽', name:'Mingea de Aur',   desc:'Cel mai bun jucător al turneului',   bg:'#2d1800', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#fff)',   rarity:'legendary', shine:true },
  { id:'golden_boot', emoji:'👟', name:'Gheata de Aur',   desc:'Golgheterul turneului',              bg:'#1a0d00', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#FFD700)', rarity:'legendary', shine:true },
  { id:'wc_2026',     emoji:'🌎', name:'WC 2026 Exclusive',desc:'Ediție limitată — primul sezon',    bg:'#0a1a2d', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'legendary', shine:true },

  // ── 🌍 More Nations ───────────────────────────────────────────────────────
  { id:'flag_mex', emoji:'🇲🇽', name:'Mexic',         desc:'Gazdele WC 2026, El Tri',           bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#EF4444)', rarity:'common' },
  { id:'flag_jpn', emoji:'🇯🇵', name:'Japonia',        desc:'Samuraii Albaștri — surpriza Asiei', bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'common' },
  { id:'flag_arg2',emoji:'🇦🇷', name:'Albiceleste',    desc:'Campionii se apără',                bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#fff)',   rarity:'common' },
  { id:'flag_sen', emoji:'🇸🇳', name:'Senegal',        desc:'Leii Terangei',                     bg:'#0a2d0a', accent:'#FFD700', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'common' },
  { id:'flag_cro', emoji:'🇭🇷', name:'Croația',        desc:'Finaliști CM 2018 & 2022',          bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'common' },
  { id:'flag_col', emoji:'🇨🇴', name:'Columbia',       desc:'Los Cafeteros în ascensiune',       bg:'#2d1a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#4A9EFF)', rarity:'common' },
  { id:'flag_aus', emoji:'🇦🇺', name:'Australia',      desc:'Socceroos — surpriza din Pacific',  bg:'#0a0a2d', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#00E5A0)', rarity:'common' },
  { id:'flag_can', emoji:'🇨🇦', name:'Canada',         desc:'Gazdele din nord — WC 2026',        bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#fff)',   rarity:'common' },

  // ── 👕 More Jerseys ────────────────────────────────────────────────────────
  { id:'kit_bra2', emoji:'💚', name:'Tricoul Away Brazilia', desc:'Verde iconic — al doilea tricou',  bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'rare' },
  { id:'kit_por',  emoji:'🟥', name:'Tricoul Portugalia',    desc:'Totul pe CR7',                     bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#00E5A0)', rarity:'rare' },
  { id:'kit_ned',  emoji:'🟠', name:'Tricoul Olandei',       desc:'Portocaliu Total Football',        bg:'#2d1a0a', accent:'#FF9800', ring:'linear-gradient(135deg,#FF9800,#FFD700)', rarity:'rare' },
  { id:'kit_ita',  emoji:'🔵', name:'Tricoul Italiei',       desc:'Azzurri — stil și tactică',        bg:'#0a0a2d', accent:'#4A9EFF', ring:'linear-gradient(135deg,#4A9EFF,#00E5A0)', rarity:'rare' },
  { id:'kit_cro',  emoji:'🔴', name:'Tricoul Croației',      desc:'Tablă de șah — nemuritor',         bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#4A9EFF)', rarity:'rare' },

  // ── ⭐ More Superstars — EPIC ──────────────────────────────────────────────
  { id:'pedri_8',    emoji:'🎪', name:'PEDRI #8',      desc:'Spain · Barcelona · El Maestro',         bg:'#2d0a0a', accent:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic', shine:true },
  { id:'rodri_16',   emoji:'🏔', name:'RODRI #16',     desc:'Spain · Man City · Ballon d\'Or 2023',    bg:'#2d0a0a', accent:'#4A9EFF', ring:'linear-gradient(135deg,#EF4444,#4A9EFF)', rarity:'epic', shine:true },
  { id:'salah_11',   emoji:'🌙', name:'SALAH #11',     desc:'Egypt · Liverpool · King of Anfield',    bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic', shine:true },
  { id:'neymar_10',  emoji:'🎯', name:'NEYMAR #10',    desc:'Brazil · Santos de Volta · O Ney',       bg:'#0a2d0a', accent:'#FFD700', ring:'linear-gradient(135deg,#FFD700,#00E5A0)', rarity:'epic', shine:true },
  { id:'osimhen_9',  emoji:'💥', name:'OSIMHEN #9',    desc:'Nigeria · Napoli/Galatasaray · Boom',    bg:'#0a2d0a', accent:'#00E5A0', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'epic', shine:true },
  { id:'de_bruyne',  emoji:'🎯', name:'DE BRUYNE #8',  desc:'Belgium · Man City · Creier pur',        bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#4A9EFF)', rarity:'epic', shine:true },
  { id:'kane_9',     emoji:'🏹', name:'KANE #9',       desc:'England · Bayern Munich · Record man',   bg:'#2d0a0a', accent:'#fff',    ring:'linear-gradient(135deg,#EF4444,#fff)',    rarity:'epic', shine:true },
  { id:'lewandowski',emoji:'🎯', name:'LEWANDOWSKI #9',desc:'Poland · Barcelona · Mașina perfectă',  bg:'#2d0a0a', accent:'#EF4444', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic', shine:true },
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
