// ─── src/data/avatars.js ─────────────────────────────────────────────────────
// World Cup Arena 2026 — Premium Avatar Collection
// 52 collectibles: National Badges · Superstar Jerseys · Achievement Medals
// Zero external images. All rendered via FootballAvatar SVG engine in UI.jsx.
// ─────────────────────────────────────────────────────────────────────────────

export const AVATARS = [

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 1 — NATIONAL BADGES (20)
  // Each entry encodes: flag emoji, 3 national colors, glow, rarity
  // ═══════════════════════════════════════════════════════════

  { id:'flag_bra', kind:'nation', name:'Brasil', desc:'Jogo bonito. Eternitate.',
    flag:'🇧🇷', bg:'#051a0d', c1:'#009C3B', c2:'#FEDF00', c3:'#002776',
    glow:'#FEDF00', glow2:'#009C3B', rarity:'legendary', shine:true },

  { id:'flag_arg', kind:'nation', name:'Argentina', desc:'Rece la penalty. Campion.',
    flag:'🇦🇷', bg:'#051525', c1:'#74ACDF', c2:'#FFFFFF', c3:'#74ACDF',
    glow:'#74ACDF', glow2:'#FFFFFF', rarity:'legendary', shine:true },

  { id:'flag_fra', kind:'nation', name:'France', desc:'Viteză, stil, victorie.',
    flag:'🇫🇷', bg:'#04091e', c1:'#002395', c2:'#FFFFFF', c3:'#ED2939',
    glow:'#002395', glow2:'#ED2939', rarity:'legendary', shine:true },

  { id:'flag_eng', kind:'nation', name:'England', desc:'It\'s coming home.',
    flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', bg:'#120608', c1:'#FFFFFF', c2:'#CF091C', c3:'#FFFFFF',
    glow:'#CF091C', glow2:'#FFFFFF', rarity:'epic', shine:true },

  { id:'flag_esp', kind:'nation', name:'España', desc:'Tiki-taka cu sânge regal.',
    flag:'🇪🇸', bg:'#1e0407', c1:'#AA151B', c2:'#F1BF00', c3:'#AA151B',
    glow:'#AA151B', glow2:'#F1BF00', rarity:'epic', shine:true },

  { id:'flag_ger', kind:'nation', name:'Germany', desc:'Eficiență fără emoții.',
    flag:'🇩🇪', bg:'#0e0e0e', c1:'#000000', c2:'#DD0000', c3:'#FFCE00',
    glow:'#FFCE00', glow2:'#DD0000', rarity:'epic', shine:false },

  { id:'flag_por', kind:'nation', name:'Portugal', desc:'Dramă, goluri, glorie.',
    flag:'🇵🇹', bg:'#03100a', c1:'#006600', c2:'#FF0000', c3:'#FFFFFF',
    glow:'#FF0000', glow2:'#006600', rarity:'epic', shine:true },

  { id:'flag_ita', kind:'nation', name:'Italia', desc:'Apărare, stil, espresso.',
    flag:'🇮🇹', bg:'#040c20', c1:'#009246', c2:'#FFFFFF', c3:'#CE2B37',
    glow:'#0055A4', glow2:'#FFFFFF', rarity:'rare', shine:false },

  { id:'flag_ned', kind:'nation', name:'Nederland', desc:'Fotbal total. Portocaliu total.',
    flag:'🇳🇱', bg:'#1a0700', c1:'#FF6600', c2:'#FFFFFF', c3:'#003A8C',
    glow:'#FF6600', glow2:'#003A8C', rarity:'rare', shine:false },

  { id:'flag_cro', kind:'nation', name:'Hrvatska', desc:'Șah pe tricou, nervi de oțel.',
    flag:'🇭🇷', bg:'#130610', c1:'#FF0000', c2:'#FFFFFF', c3:'#171796',
    glow:'#FF0000', glow2:'#171796', rarity:'epic', shine:true },

  { id:'flag_bel', kind:'nation', name:'Belgique', desc:'Generația de aur.',
    flag:'🇧🇪', bg:'#130305', c1:'#000000', c2:'#FFD700', c3:'#EF3340',
    glow:'#EF3340', glow2:'#FFD700', rarity:'rare', shine:false },

  { id:'flag_usa', kind:'nation', name:'USA', desc:'Gazdă cu marketing maxim.',
    flag:'🇺🇸', bg:'#050b1a', c1:'#3C3B6E', c2:'#FFFFFF', c3:'#B22234',
    glow:'#3C3B6E', glow2:'#B22234', rarity:'rare', shine:false },

  { id:'flag_mex', kind:'nation', name:'México', desc:'Stadion plin, haos frumos.',
    flag:'🇲🇽', bg:'#031508', c1:'#006847', c2:'#FFFFFF', c3:'#CE1126',
    glow:'#006847', glow2:'#CE1126', rarity:'rare', shine:false },

  { id:'flag_jpn', kind:'nation', name:'Japan', desc:'Disciplină. Pressing. Onoare.',
    flag:'🇯🇵', bg:'#100408', c1:'#FFFFFF', c2:'#BC002D', c3:'#FFFFFF',
    glow:'#BC002D', glow2:'#FFFFFF', rarity:'rare', shine:false },

  { id:'flag_mar', kind:'nation', name:'Maroc', desc:'Underdog cu suflet de leu.',
    flag:'🇲🇦', bg:'#0a0404', c1:'#C1272D', c2:'#006233', c3:'#C1272D',
    glow:'#C1272D', glow2:'#006233', rarity:'epic', shine:true },

  { id:'flag_uru', kind:'nation', name:'Uruguay', desc:'Mici, furioși, legendari.',
    flag:'🇺🇾', bg:'#050f20', c1:'#5AAAE7', c2:'#FFFFFF', c3:'#5AAAE7',
    glow:'#5AAAE7', glow2:'#FFFFFF', rarity:'common', shine:false },

  { id:'flag_col', kind:'nation', name:'Colombia', desc:'Coffee, dribbling, glorie.',
    flag:'🇨🇴', bg:'#1a1200', c1:'#FCD116', c2:'#003087', c3:'#CE1126',
    glow:'#FCD116', glow2:'#CE1126', rarity:'common', shine:false },

  { id:'flag_srb', kind:'nation', name:'Serbia', desc:'Balcanic, furios, periculos.',
    flag:'🇷🇸', bg:'#150308', c1:'#C6363C', c2:'#0C4076', c3:'#FFFFFF',
    glow:'#C6363C', glow2:'#0C4076', rarity:'common', shine:false },

  { id:'flag_kor', kind:'nation', name:'Korea', desc:'Cardio fără limite, inimă mare.',
    flag:'🇰🇷', bg:'#130308', c1:'#CD2E3A', c2:'#FFFFFF', c3:'#003478',
    glow:'#CD2E3A', glow2:'#003478', rarity:'common', shine:false },

  { id:'flag_can', kind:'nation', name:'Canada', desc:'Frig afară, ritm de foc.',
    flag:'🇨🇦', bg:'#150404', c1:'#FF0000', c2:'#FFFFFF', c3:'#FF0000',
    glow:'#FF0000', glow2:'#FFFFFF', rarity:'common', shine:false },


  // ═══════════════════════════════════════════════════════════
  // CATEGORY 2 — SUPERSTAR JERSEYS (20)
  // surname · number · flag · shirt colors all encoded
  // ═══════════════════════════════════════════════════════════

  { id:'kit_messi', kind:'jersey', name:'Messi #10', desc:'Ultimul dans. Titlul suprem.',
    surname:'MESSI', num:'10', flag:'🇦🇷',
    body:'#74ACDF', bodyEnd:'#5590c8', stripe:'#FFFFFF', collar:'#FFFFFF', sleeve:'#FFFFFF',
    bg:'#041525', glow:'#74ACDF', glow2:'#FFFFFF',
    rarity:'legendary', shine:true, stripes:'vertical' },

  { id:'kit_neymar', kind:'jersey', name:'Neymar #10', desc:'Dribling, samba, magie pură.',
    surname:'NEYMAR', num:'10', flag:'🇧🇷',
    body:'#009C3B', bodyEnd:'#007830', stripe:'#FEDF00', collar:'#002776', sleeve:'#FEDF00',
    bg:'#04180a', glow:'#FEDF00', glow2:'#009C3B',
    rarity:'legendary', shine:true, stripes:'none' },

  { id:'kit_mbappe', kind:'jersey', name:'Mbappé #10', desc:'100m în 10s, gol în 11.',
    surname:'MBAPPÉ', num:'10', flag:'🇫🇷',
    body:'#002395', bodyEnd:'#001570', stripe:'#FFFFFF', collar:'#ED2939', sleeve:'#ED2939',
    bg:'#03081a', glow:'#002395', glow2:'#ED2939',
    rarity:'legendary', shine:true, stripes:'none' },

  { id:'kit_ronaldo', kind:'jersey', name:'Ronaldo #7', desc:'SIUUU. Gol. Glorie.',
    surname:'RONALDO', num:'7', flag:'🇵🇹',
    body:'#006600', bodyEnd:'#004400', stripe:'#FFFFFF', collar:'#FF0000', sleeve:'#FF0000',
    bg:'#021008', glow:'#FF0000', glow2:'#006600',
    rarity:'legendary', shine:true, stripes:'none' },

  { id:'kit_yamal', kind:'jersey', name:'Yamal #19', desc:'17 ani. Campion mondial.',
    surname:'YAMAL', num:'19', flag:'🇪🇸',
    body:'#AA151B', bodyEnd:'#8a1015', stripe:'#F1BF00', collar:'#F1BF00', sleeve:'#F1BF00',
    bg:'#180304', glow:'#AA151B', glow2:'#F1BF00',
    rarity:'legendary', shine:true, stripes:'none' },

  { id:'kit_haaland', kind:'jersey', name:'Haaland #9', desc:'Robot norvegian. Gol garantat.',
    surname:'HAALAND', num:'9', flag:'🇳🇴',
    body:'#EF0000', bodyEnd:'#bb0000', stripe:'#FFFFFF', collar:'#003B6F', sleeve:'#003B6F',
    bg:'#150202', glow:'#EF0000', glow2:'#003B6F',
    rarity:'epic', shine:true, stripes:'none' },

  { id:'kit_bellingham', kind:'jersey', name:'Bellingham #10', desc:'Regele nou al fotbalului.',
    surname:'BELLINGHAM', num:'10', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#CF091C', collar:'#CF091C', sleeve:'#CF091C',
    bg:'#101010', glow:'#CF091C', glow2:'#FFFFFF',
    rarity:'epic', shine:true, stripes:'none' },

  { id:'kit_vinicius', kind:'jersey', name:'Vinicius #7', desc:'Dribling pur, presiune zero.',
    surname:'VINICIUS', num:'7', flag:'🇧🇷',
    body:'#009C3B', bodyEnd:'#007830', stripe:'#FEDF00', collar:'#002776', sleeve:'#FEDF00',
    bg:'#04180a', glow:'#FEDF00', glow2:'#009C3B',
    rarity:'epic', shine:true, stripes:'none' },

  { id:'kit_modric', kind:'jersey', name:'Modrić #10', desc:'Regele mijlocașilor.',
    surname:'MODRIĆ', num:'10', flag:'🇭🇷',
    body:'#FF0000', bodyEnd:'#cc0000', stripe:'#FFFFFF', collar:'#FFFFFF', sleeve:'#171796',
    bg:'#120308', glow:'#FF0000', glow2:'#171796',
    rarity:'epic', shine:true, stripes:'checker' },

  { id:'kit_musiala', kind:'jersey', name:'Musiala #10', desc:'Dribbling bavarez cu viteză.',
    surname:'MUSIALA', num:'10', flag:'🇩🇪',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#000000', collar:'#DD0000', sleeve:'#DD0000',
    bg:'#0d0d0d', glow:'#FFCE00', glow2:'#DD0000',
    rarity:'epic', shine:false, stripes:'none' },

  { id:'kit_rodri', kind:'jersey', name:'Rodri #16', desc:'Box-to-box la putere maximă.',
    surname:'RODRI', num:'16', flag:'🇪🇸',
    body:'#AA151B', bodyEnd:'#8a1015', stripe:'#F1BF00', collar:'#F1BF00', sleeve:'#F1BF00',
    bg:'#180304', glow:'#AA151B', glow2:'#F1BF00',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_kane', kind:'jersey', name:'Kane #9', desc:'Alb simplu, gol urat, 3 puncte.',
    surname:'KANE', num:'9', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#CF091C', collar:'#CF091C', sleeve:'#CF091C',
    bg:'#0e0e0e', glow:'#FFFFFF', glow2:'#CF091C',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_salah', kind:'jersey', name:'Salah #10', desc:'Viteza lui e altă dimensiune.',
    surname:'SALAH', num:'10', flag:'🇪🇬',
    body:'#CC0000', bodyEnd:'#990000', stripe:'#FFFFFF', collar:'#FFFFFF', sleeve:'#FFFFFF',
    bg:'#120202', glow:'#CC0000', glow2:'#FFFFFF',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_son', kind:'jersey', name:'Son #7', desc:'K-pop meets goluri mondiale.',
    surname:'SON', num:'7', flag:'🇰🇷',
    body:'#CD2E3A', bodyEnd:'#a02030', stripe:'#FFFFFF', collar:'#003478', sleeve:'#003478',
    bg:'#130408', glow:'#CD2E3A', glow2:'#003478',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_alvarez', kind:'jersey', name:'Álvarez #9', desc:'Mic, rapid, lethal.',
    surname:'ÁLVAREZ', num:'9', flag:'🇦🇷',
    body:'#74ACDF', bodyEnd:'#5590c8', stripe:'#FFFFFF', collar:'#FFFFFF', sleeve:'#FFFFFF',
    bg:'#041525', glow:'#74ACDF', glow2:'#FFFFFF',
    rarity:'rare', shine:false, stripes:'vertical' },

  { id:'kit_valverde', kind:'jersey', name:'Valverde #15', desc:'Box-to-box, energie infinită.',
    surname:'VALVERDE', num:'15', flag:'🇺🇾',
    body:'#5AAAE7', bodyEnd:'#3a8acc', stripe:'#FFFFFF', collar:'#FFFFFF', sleeve:'#FFFFFF',
    bg:'#060f1e', glow:'#5AAAE7', glow2:'#FFFFFF',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_leao', kind:'jersey', name:'Leão #10', desc:'Viteză, flamă, Lisabona.',
    surname:'LEÃO', num:'10', flag:'🇵🇹',
    body:'#006600', bodyEnd:'#004400', stripe:'#FFFFFF', collar:'#FF0000', sleeve:'#FF0000',
    bg:'#021008', glow:'#FF0000', glow2:'#006600',
    rarity:'rare', shine:false, stripes:'none' },

  { id:'kit_kvara', kind:'jersey', name:'Kvaratskhelia #7', desc:'Georgia pe podium.',
    surname:'KVARA', num:'7', flag:'🇬🇪',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#FF0000', collar:'#FF0000', sleeve:'#FF0000',
    bg:'#0e0e0e', glow:'#FF0000', glow2:'#FFFFFF',
    rarity:'rare', shine:false, stripes:'cross' },

  { id:'kit_saka', kind:'jersey', name:'Saka #7', desc:'Banda stângă e a lui.',
    surname:'SAKA', num:'7', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#CF091C', collar:'#CF091C', sleeve:'#CF091C',
    bg:'#0e0e0e', glow:'#CF091C', glow2:'#FFFFFF',
    rarity:'common', shine:false, stripes:'none' },

  { id:'kit_palmer', kind:'jersey', name:'Palmer #10', desc:'Next gen. Acum.',
    surname:'PALMER', num:'10', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    body:'#FFFFFF', bodyEnd:'#eeeeee', stripe:'#CF091C', collar:'#CF091C', sleeve:'#CF091C',
    bg:'#0e0e0e', glow:'#CF091C', glow2:'#FFFFFF',
    rarity:'common', shine:false, stripes:'none' },


  // ═══════════════════════════════════════════════════════════
  // CATEGORY 3 — ACHIEVEMENT MEDALS (12)
  // ═══════════════════════════════════════════════════════════

  { id:'ach_champion', kind:'achievement', name:'World Champion', desc:'Cel mai bun din toate grupele.',
    icon:'🏆', label:'WORLD\nCHAMPION',
    bg:'#100900', c1:'#FFD700', c2:'#FFF3A0', c3:'#B8860B',
    glow:'#FFD700', glow2:'#FFA500', rarity:'legendary', shine:true },

  { id:'ach_golden_boot', kind:'achievement', name:'Golden Boot', desc:'Golgeterul predicțiilor.',
    icon:'👟', label:'GOLDEN\nBOOT',
    bg:'#180800', c1:'#FF6B00', c2:'#FFD700', c3:'#8B3A00',
    glow:'#FF6B00', glow2:'#FFD700', rarity:'legendary', shine:true },

  { id:'ach_golden_glove', kind:'achievement', name:'Golden Glove', desc:'Portar de diamant.',
    icon:'🧤', label:'GOLDEN\nGLOVE',
    bg:'#070f1a', c1:'#FFD700', c2:'#60A5FA', c3:'#B8860B',
    glow:'#FFD700', glow2:'#60A5FA', rarity:'legendary', shine:true },

  { id:'ach_king', kind:'achievement', name:'Prediction King', desc:'Coroana îți aparține.',
    icon:'👑', label:'PREDICTION\nKING',
    bg:'#120a00', c1:'#FFD700', c2:'#FFA500', c3:'#8B6914',
    glow:'#FFD700', glow2:'#FFA500', rarity:'legendary', shine:true },

  { id:'ach_perfect', kind:'achievement', name:'Perfect Score', desc:'Toate predicțiile corecte.',
    icon:'💎', label:'PERFECT\nSCORE',
    bg:'#040e1c', c1:'#7DF9FF', c2:'#FFFFFF', c3:'#40A8CC',
    glow:'#7DF9FF', glow2:'#FFFFFF', rarity:'legendary', shine:true },

  { id:'ach_goat', kind:'achievement', name:'GOAT', desc:'Nimeni nu prezice mai bine.',
    icon:'🐐', label:'G.O.A.T.',
    bg:'#080810', c1:'#E2E8FF', c2:'#C0C0FF', c3:'#8080C0',
    glow:'#C0C0FF', glow2:'#E2E8FF', rarity:'legendary', shine:true },

  { id:'ach_streak', kind:'achievement', name:'Streak ×10', desc:'10 predicții corecte la rând.',
    icon:'🔥', label:'STREAK\n×10',
    bg:'#140400', c1:'#FF4500', c2:'#FFD700', c3:'#FF6B00',
    glow:'#FF4500', glow2:'#FFD700', rarity:'epic', shine:true },

  { id:'ach_elite', kind:'achievement', name:'Elite Predictor', desc:'Top 1% din toți jucătorii.',
    icon:'⚡', label:'ELITE\nPREDICTOR',
    bg:'#08081a', c1:'#9B59B6', c2:'#E056FD', c3:'#5b2b85',
    glow:'#9B59B6', glow2:'#E056FD', rarity:'epic', shine:true },

  { id:'ach_top3', kind:'achievement', name:'Top 3', desc:'Podium. Mereu.',
    icon:'🥉', label:'TOP 3',
    bg:'#0a0700', c1:'#CD7F32', c2:'#F4A460', c3:'#8B4513',
    glow:'#CD7F32', glow2:'#F4A460', rarity:'epic', shine:false },

  { id:'ach_top10', kind:'achievement', name:'Top 10', desc:'Printre cei mai buni.',
    icon:'🎯', label:'TOP 10',
    bg:'#040d1c', c1:'#60A5FA', c2:'#FFFFFF', c3:'#1a4a8a',
    glow:'#60A5FA', glow2:'#FFFFFF', rarity:'rare', shine:false },

  { id:'ach_legend', kind:'achievement', name:'Legend', desc:'Numele tău în istoria jocului.',
    icon:'⭐', label:'LEGEND',
    bg:'#080808', c1:'#FFD700', c2:'#FFFFFF', c3:'#888',
    glow:'#FFD700', glow2:'#FFFFFF', rarity:'rare', shine:false },

  { id:'ach_champion2', kind:'achievement', name:'Champion', desc:'Câștigătorul sezonului.',
    icon:'🏅', label:'CHAMPION',
    bg:'#0a0800', c1:'#FFD700', c2:'#FFF3A0', c3:'#B8860B',
    glow:'#FFD700', glow2:'#FFA500', rarity:'rare', shine:false },

];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
export const NICKNAME_SUGGESTIONS = [
  'VARzaCuCarnati', 'AutobazaFC', 'RegeleRemizei', 'NicuOffside', 'GolInMin90',
  'Sambalero', 'TikiTakaBoss', 'CornerDealer', 'XGPreotul', 'PenaltyGoblin',
  'DodelMondial', 'CapitanHaos', 'CotaDeAur', 'HagiDeCanapea', 'MaradonaDeMall',
  'MessiDinMoldova', 'CR7DinPloiesti', 'MbaGelu', 'OffsideOliver', 'GolazoGheorghe',
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

export function getDefaultAvatarForNick(nickname) {
  let hash = 0;
  const text = String(nickname || 'Player');
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return AVATARS[Math.abs(hash) % AVATARS.length];
}
