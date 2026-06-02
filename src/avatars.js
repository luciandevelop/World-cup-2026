// ─── src/data/avatars.js ──────────────────────────────────────────────────────
// Football-style preset avatars. All strings use double quotes to avoid
// apostrophe/Unicode parse errors. No special Unicode characters in JS strings.
// ─────────────────────────────────────────────────────────────────────────────

export const AVATARS = [

  // ══ A. NATIONAL FLAGS ══════════════════════════════════════════════════════
  { id:"flag_bra", emoji:"🇧🇷", name:"Brazilia",      desc:"5 titluri mondiale", bg:"#0a2d0a", accent:"#00E5A0", ring:"linear-gradient(135deg,#00E5A0,#FFD700)", rarity:"common" },
  { id:"flag_arg", emoji:"🇦🇷", name:"Argentina",     desc:"Campioana mondiala in exercitiu", bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#fff)", rarity:"common" },
  { id:"flag_fra", emoji:"🇫🇷", name:"Franta",        desc:"Les Bleus - forta pura", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#EF4444)", rarity:"common" },
  { id:"flag_eng", emoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", name:"Anglia",        desc:"It is coming home. Mereu.", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"common" },
  { id:"flag_esp", emoji:"🇪🇸", name:"Spania",        desc:"Tiki-taka si titluri", bg:"#2d0a0a", accent:"#FFD700", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"common" },
  { id:"flag_ger", emoji:"🇩🇪", name:"Germania",      desc:"Eficienta maxima, mereu", bg:"#1a1a1a", accent:"#FFD700", ring:"linear-gradient(135deg,#6B7280,#FFD700)", rarity:"common" },
  { id:"flag_por", emoji:"🇵🇹", name:"Portugalia",    desc:"Talentul lui Cristiano", bg:"#0a2d0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#00E5A0)", rarity:"common" },
  { id:"flag_ned", emoji:"🇳🇱", name:"Olanda",        desc:"Totaalvoetbal ADN", bg:"#2d1a0a", accent:"#FF9800", ring:"linear-gradient(135deg,#FF9800,#FFD700)", rarity:"common" },
  { id:"flag_bel", emoji:"🇧🇪", name:"Belgia",        desc:"Generatie de aur", bg:"#2d0a0a", accent:"#FFD700", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"common" },
  { id:"flag_ita", emoji:"🇮🇹", name:"Italia",        desc:"Catenaccio si stil", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#00E5A0)", rarity:"common" },
  { id:"flag_cro", emoji:"🇭🇷", name:"Croatia",       desc:"Finalisti CM 2018 si 2022", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"common" },
  { id:"flag_mor", emoji:"🇲🇦", name:"Maroc",         desc:"Revelatia CM 2022", bg:"#0a2d0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#00E5A0)", rarity:"common" },
  { id:"flag_usa", emoji:"🇺🇸", name:"SUA",           desc:"Gazdele turneului 2026", bg:"#0a0a2d", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#4A9EFF)", rarity:"common" },
  { id:"flag_mex", emoji:"🇲🇽", name:"Mexic",         desc:"Gazdele WC 2026, El Tri", bg:"#0a2d0a", accent:"#00E5A0", ring:"linear-gradient(135deg,#00E5A0,#EF4444)", rarity:"common" },
  { id:"flag_jpn", emoji:"🇯🇵", name:"Japonia",       desc:"Samuraii Albastri", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"common" },
  { id:"flag_sen", emoji:"🇸🇳", name:"Senegal",       desc:"Leii Terangei", bg:"#0a2d0a", accent:"#FFD700", ring:"linear-gradient(135deg,#00E5A0,#FFD700)", rarity:"common" },
  { id:"flag_uru", emoji:"🇺🇾", name:"Uruguay",       desc:"2 titluri mondiale", bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#fff)", rarity:"common" },
  { id:"flag_col", emoji:"🇨🇴", name:"Columbia",      desc:"Los Cafeteros", bg:"#2d1a0a", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#4A9EFF)", rarity:"common" },
  { id:"flag_can", emoji:"🇨🇦", name:"Canada",        desc:"Gazdele din nord WC 2026", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"common" },
  { id:"flag_aus", emoji:"🇦🇺", name:"Australia",     desc:"Socceroos din Pacific", bg:"#0a0a2d", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#00E5A0)", rarity:"common" },

  // ══ B. NATIONAL JERSEYS ════════════════════════════════════════════════════
  { id:"kit_bra",  emoji:"💛", name:"Brazil Home",    desc:"Galben-verde - cel mai iconic tricou", bg:"#1a2d0a", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#00E5A0)", rarity:"rare" },
  { id:"kit_arg",  emoji:"💙", name:"Argentina Home", desc:"Albiceleste - Campioni Mondiali", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#fff)", rarity:"rare" },
  { id:"kit_fra",  emoji:"🔷", name:"France Home",    desc:"Tricoul albastru Les Bleus", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#EF4444)", rarity:"rare" },
  { id:"kit_eng",  emoji:"⬜", name:"England Home",   desc:"Cele Trei Lei - tricoul alb clasic", bg:"#1a1a1a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"rare" },
  { id:"kit_esp",  emoji:"🔴", name:"Spain Home",     desc:"La Roja - campioni mondiali", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"rare" },
  { id:"kit_ger",  emoji:"⚪", name:"Germany Home",   desc:"Das Nationalteam - alb clasic", bg:"#1a1a1a", accent:"#6B7280", ring:"linear-gradient(135deg,#6B7280,#FFD700)", rarity:"rare" },
  { id:"kit_por",  emoji:"🟥", name:"Portugal Home",  desc:"Rosu si verde - CR7 Forever", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#00E5A0)", rarity:"rare" },
  { id:"kit_ned",  emoji:"🟠", name:"Netherlands Home", desc:"Portocaliu Total Football", bg:"#2d1a0a", accent:"#FF9800", ring:"linear-gradient(135deg,#FF9800,#FFD700)", rarity:"rare" },
  { id:"kit_cro",  emoji:"🔲", name:"Croatia Home",   desc:"Tabla de sah - nemuritor", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#4A9EFF)", rarity:"rare" },
  { id:"kit_ita",  emoji:"🔵", name:"Italy Home",     desc:"Azzurri - stil si tactica", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#00E5A0)", rarity:"rare" },

  // ══ C. FAMOUS PLAYER JERSEYS ═══════════════════════════════════════════════
  { id:"mbappe_10",  emoji:"👕", name:"MBAPPE #10",    desc:"France - PSG / Real Madrid - Viteza pura", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#EF4444)", rarity:"epic", shine:true },
  { id:"vinicius_7", emoji:"👕", name:"VINICIUS #7",   desc:"Brazil - Real Madrid - Balon de Aur 2024", bg:"#0a2d0a", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#00E5A0)", rarity:"epic", shine:true },
  { id:"neymar_10",  emoji:"👕", name:"NEYMAR #10",    desc:"Brazil - Santos / PSG - O Ney", bg:"#0a2d0a", accent:"#00E5A0", ring:"linear-gradient(135deg,#00E5A0,#FFD700)", rarity:"epic", shine:true },
  { id:"messi_10",   emoji:"🐐", name:"MESSI #10",     desc:"Argentina - Inter Miami - The GOAT", bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#FFD700)", rarity:"epic", shine:true },
  { id:"yamal_19",   emoji:"👕", name:"YAMAL #19",     desc:"Spain - Barcelona - Generatia noua", bg:"#2d0a0a", accent:"#FFD700", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"epic", shine:true },
  { id:"haaland_9",  emoji:"👕", name:"HAALAND #9",    desc:"Norway - Man City - Masina de goluri", bg:"#0a0a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#00E5A0)", rarity:"epic", shine:true },
  { id:"bellingham_5",emoji:"👕", name:"BELLINGHAM #5", desc:"England - Real Madrid - Generatie noua", bg:"#2d0a0a", accent:"#FF9800", ring:"linear-gradient(135deg,#EF4444,#FF9800)", rarity:"epic", shine:true },
  { id:"ronaldo_7",  emoji:"👕", name:"RONALDO #7",    desc:"Portugal - Al-Nassr - CR7 Forever", bg:"#0a2d0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#00E5A0)", rarity:"epic", shine:true },
  { id:"rodri_16",   emoji:"👕", name:"RODRI #16",     desc:"Spain - Man City - Balon de Aur 2023", bg:"#2d0a0a", accent:"#4A9EFF", ring:"linear-gradient(135deg,#EF4444,#4A9EFF)", rarity:"epic", shine:true },
  { id:"saka_7",     emoji:"👕", name:"SAKA #7",       desc:"England - Arsenal - Assist machine", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"epic", shine:true },
  { id:"kane_9",     emoji:"👕", name:"KANE #9",       desc:"England - Bayern - Record man", bg:"#2d0a0a", accent:"#fff", ring:"linear-gradient(135deg,#EF4444,#fff)", rarity:"epic", shine:true },
  { id:"salah_11",   emoji:"👕", name:"SALAH #11",     desc:"Egypt - Liverpool - King of Anfield", bg:"#2d0a0a", accent:"#EF4444", ring:"linear-gradient(135deg,#EF4444,#FFD700)", rarity:"epic", shine:true },

  // ══ D. TROPHY & FANTASY FOOTBALL ══════════════════════════════════════════
  { id:"trophy_gold",  emoji:"🏆", name:"Campion Mondial",  desc:"Numai pentru cei mai buni",        bg:"#2d2000", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#FFA500)", rarity:"legendary", shine:true },
  { id:"golden_ball",  emoji:"⚽", name:"Mingea de Aur",    desc:"Cel mai bun jucator al turneului", bg:"#2d1800", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#fff)",   rarity:"legendary", shine:true },
  { id:"golden_boot",  emoji:"👟", name:"Gheata de Aur",    desc:"Golgeterul turneului",             bg:"#1a0d00", accent:"#FF9800", ring:"linear-gradient(135deg,#FF9800,#FFD700)", rarity:"legendary", shine:true },
  { id:"wc_2026",      emoji:"🌎", name:"WC 2026 Exclusive", desc:"Editie limitata - primul sezon",  bg:"#0a1a2d", accent:"#00E5A0", ring:"linear-gradient(135deg,#00E5A0,#FFD700)", rarity:"legendary", shine:true },
  { id:"captain",      emoji:"🅰",  name:"Capitanul",        desc:"Lider pe teren si in vestiar",    bg:"#1a0a2d", accent:"#9B59B6", ring:"linear-gradient(135deg,#9B59B6,#FFD700)", rarity:"legendary", shine:true },
  { id:"mvp",          emoji:"🌟", name:"MVP",               desc:"Cel mai valoros jucator",          bg:"#2d2000", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#FF9800)", rarity:"legendary", shine:true },
  { id:"clean_sheet",  emoji:"🧱", name:"Clean Sheet",       desc:"Portarul perfect - niciun gol",   bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#00E5A0)", rarity:"rare" },
  { id:"var_hunter",   emoji:"📺", name:"VAR Hunter",        desc:"Vede totul. Chiar tot.",           bg:"#2d0a2d", accent:"#9B59B6", ring:"linear-gradient(135deg,#9B59B6,#4A9EFF)", rarity:"rare" },
  { id:"penalty_k",    emoji:"🥅", name:"Penalty Killer",    desc:"Penaltyul nu trece de el",        bg:"#0a2d0a", accent:"#00E5A0", ring:"linear-gradient(135deg,#00E5A0,#4A9EFF)", rarity:"rare" },
  { id:"assist_king",  emoji:"🎯", name:"Assist King",       desc:"Pasa decisiva mereu",             bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#FFD700)", rarity:"rare" },
  { id:"top_scorer",   emoji:"🔝", name:"Top Scorer",        desc:"Golgeterul competitiei",          bg:"#2d1a00", accent:"#FF9800", ring:"linear-gradient(135deg,#FF9800,#EF4444)", rarity:"rare" },
  { id:"tactician",    emoji:"📋", name:"Tacticianul",       desc:"4-3-3 sau moarte",                bg:"#0a1a0a", accent:"#84CC16", ring:"linear-gradient(135deg,#84CC16,#00E5A0)", rarity:"common" },
  { id:"goat",         emoji:"🐐", name:"The GOAT",          desc:"Niciun comentariu necesar",       bg:"#1a1a2e", accent:"#FFD700", ring:"linear-gradient(135deg,#FFD700,#FFA500)", rarity:"common" },
  { id:"wonderkid",    emoji:"🌟", name:"Wonderkid",         desc:"Talent de 100M euro",             bg:"#0a1a2d", accent:"#4A9EFF", ring:"linear-gradient(135deg,#4A9EFF,#7B5EA7)", rarity:"common" },
  { id:"nostradamus",  emoji:"🔮", name:"Nostradamus",       desc:"A prezis totul. Mereu.",          bg:"#2d0a2d", accent:"#9B59B6", ring:"linear-gradient(135deg,#9B59B6,#FFD700)", rarity:"common" },
  { id:"analyst",      emoji:"📊", name:"Analistul",         desc:"xG xA pressures per 90",         bg:"#0a0a2d", accent:"#06B6D4", ring:"linear-gradient(135deg,#06B6D4,#4A9EFF)", rarity:"common" },
  { id:"lucky",        emoji:"🍀", name:"Norocosul",         desc:"Ghiceste mereu. Habar n-are cum", bg:"#0a2d0a", accent:"#84CC16", ring:"linear-gradient(135deg,#84CC16,#00E5A0)", rarity:"common" },
];

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
}

export function getDefaultAvatarForNick(nickname) {
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) - hash) + nickname.charCodeAt(i);
    hash |= 0;
  }
  return AVATARS[Math.abs(hash) % AVATARS.length];
}
