// Premium avatar pack for World Cup Arena.
// No external images: every avatar is rendered with CSS in FootballAvatar.

export const AVATARS = [
  // NATIONS - premium badges
  { id:'flag_bra', kind:'badge', emoji:'BR', name:'Samba Boss', desc:'Brazilia - galben, verde, tupeu', bg:'#061f12', accent:'#00E5A0', accent2:'#FFD700', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'legendary', shine:true },
  { id:'flag_arg', kind:'badge', emoji:'AR', name:'Albiceleste Ice', desc:'Argentina - rece la penalty-uri', bg:'#061727', accent:'#69B7FF', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#69B7FF,#FFFFFF)', rarity:'legendary', shine:true },
  { id:'flag_fra', kind:'badge', emoji:'FR', name:'Les Bleus Boss', desc:'Franta - viteza si aroganta fina', bg:'#07142e', accent:'#3B82F6', accent2:'#EF4444', ring:'linear-gradient(135deg,#3B82F6,#EF4444)', rarity:'epic', shine:true },
  { id:'flag_eng', kind:'badge', emoji:'EN', name:'It Is Coming Home', desc:'Anglia - promisiunea eterna', bg:'#211016', accent:'#FFFFFF', accent2:'#EF4444', ring:'linear-gradient(135deg,#FFFFFF,#EF4444)', rarity:'rare' },
  { id:'flag_esp', kind:'badge', emoji:'ES', name:'Tiki Taka Don', desc:'Spania - pase pana ametesti', bg:'#26080a', accent:'#EF4444', accent2:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic' },
  { id:'flag_ger', kind:'badge', emoji:'DE', name:'Excel Machine', desc:'Germania - eficienta fara emotii', bg:'#151515', accent:'#F8FAFC', accent2:'#FFD700', ring:'linear-gradient(135deg,#F8FAFC,#FFD700)', rarity:'rare' },
  { id:'flag_por', kind:'badge', emoji:'PT', name:'Siuu Department', desc:'Portugalia - drama si goluri', bg:'#071f12', accent:'#22C55E', accent2:'#EF4444', ring:'linear-gradient(135deg,#22C55E,#EF4444)', rarity:'epic' },
  { id:'flag_ned', kind:'badge', emoji:'NL', name:'Oranje Dealer', desc:'Olanda - fotbal total si nervi', bg:'#291305', accent:'#F97316', accent2:'#60A5FA', ring:'linear-gradient(135deg,#F97316,#60A5FA)', rarity:'rare' },
  { id:'flag_ita', kind:'badge', emoji:'IT', name:'Catenaccio Chic', desc:'Italia - stil, aparare, espresso', bg:'#07142e', accent:'#22C55E', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#22C55E,#FFFFFF)', rarity:'rare' },
  { id:'flag_mex', kind:'badge', emoji:'MX', name:'El Tri Loco', desc:'Mexic - stadion plin, haos frumos', bg:'#062016', accent:'#10B981', accent2:'#EF4444', ring:'linear-gradient(135deg,#10B981,#EF4444)', rarity:'rare' },
  { id:'flag_jpn', kind:'badge', emoji:'JP', name:'Samurai Calm', desc:'Japonia - disciplina si pressing', bg:'#1c0f16', accent:'#FFFFFF', accent2:'#EF4444', ring:'linear-gradient(135deg,#FFFFFF,#EF4444)', rarity:'rare' },
  { id:'flag_mar', kind:'badge', emoji:'MA', name:'Atlas Lion', desc:'Maroc - underdog cu tupeu', bg:'#061f12', accent:'#EF4444', accent2:'#22C55E', ring:'linear-gradient(135deg,#EF4444,#22C55E)', rarity:'epic' },
  { id:'flag_usa', kind:'badge', emoji:'US', name:'Hollywood Press', desc:'SUA - gazda cu marketing', bg:'#081529', accent:'#60A5FA', accent2:'#EF4444', ring:'linear-gradient(135deg,#60A5FA,#EF4444)', rarity:'rare' },
  { id:'flag_can', kind:'badge', emoji:'CA', name:'Maple Runner', desc:'Canada - frig afara, ritm mare', bg:'#250c0c', accent:'#EF4444', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#EF4444,#FFFFFF)', rarity:'rare' },
  { id:'flag_cro', kind:'badge', emoji:'HR', name:'Chessboard Menace', desc:'Croatia - sah pe tricou, nervi de otel', bg:'#190b12', accent:'#EF4444', accent2:'#60A5FA', ring:'linear-gradient(135deg,#EF4444,#60A5FA)', rarity:'epic' },

  // KITS - no emoji shirts, CSS shirts
  { id:'kit_bra_gold', kind:'kit', emoji:'10', name:'Samba No.10', desc:'Tricou galben premium', bg:'#08230f', accent:'#FFD700', accent2:'#00E5A0', ring:'linear-gradient(135deg,#FFD700,#00E5A0)', rarity:'legendary', shine:true },
  { id:'kit_arg_10', kind:'kit', emoji:'10', name:'Ice Blue No.10', desc:'Dungi alb-albastre, calm de campion', bg:'#071827', accent:'#7DD3FC', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#7DD3FC,#FFFFFF)', rarity:'legendary', shine:true },
  { id:'kit_fra_7', kind:'kit', emoji:'7', name:'Turbo Blue No.7', desc:'Viteza pe banda stanga', bg:'#07142e', accent:'#2563EB', accent2:'#EF4444', ring:'linear-gradient(135deg,#2563EB,#EF4444)', rarity:'epic', shine:true },
  { id:'kit_eng_9', kind:'kit', emoji:'9', name:'Box Striker No.9', desc:'Alb simplu, gol urat, 3 puncte', bg:'#16181f', accent:'#FFFFFF', accent2:'#EF4444', ring:'linear-gradient(135deg,#FFFFFF,#EF4444)', rarity:'rare' },
  { id:'kit_esp_8', kind:'kit', emoji:'8', name:'Pass Merchant No.8', desc:'Pase pana se blocheaza GPS-ul', bg:'#25080a', accent:'#EF4444', accent2:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic' },
  { id:'kit_ger_6', kind:'kit', emoji:'6', name:'Robot DM No.6', desc:'Intercepteaza si factura la curent', bg:'#151515', accent:'#F8FAFC', accent2:'#FFD700', ring:'linear-gradient(135deg,#F8FAFC,#FFD700)', rarity:'rare' },
  { id:'kit_por_7', kind:'kit', emoji:'7', name:'Siuu No.7', desc:'Pentru cine sarbatoreste inainte de VAR', bg:'#092012', accent:'#EF4444', accent2:'#22C55E', ring:'linear-gradient(135deg,#EF4444,#22C55E)', rarity:'epic', shine:true },
  { id:'kit_ned_14', kind:'kit', emoji:'14', name:'Total Orange No.14', desc:'Portocaliu aprins, tactica prea complicata', bg:'#291305', accent:'#F97316', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#F97316,#FFFFFF)', rarity:'rare' },
  { id:'kit_mex_11', kind:'kit', emoji:'11', name:'Azteca Wing No.11', desc:'Sprint, sombrero, centru periculos', bg:'#062016', accent:'#10B981', accent2:'#EF4444', ring:'linear-gradient(135deg,#10B981,#EF4444)', rarity:'rare' },
  { id:'kit_dark_99', kind:'kit', emoji:'99', name:'Dark Horse No.99', desc:'Nimeni nu te ia in serios pana marchezi', bg:'#0b0f18', accent:'#111827', accent2:'#00E5A0', ring:'linear-gradient(135deg,#111827,#00E5A0)', rarity:'epic', shine:true },

  // PLAYERS - fictional/funny roles
  { id:'player_goat', kind:'beast', emoji:'GO', name:'GOAT de Canapea', desc:'Nu alearga, dar stie scorul', bg:'#20160a', accent:'#FFD700', accent2:'#F97316', ring:'linear-gradient(135deg,#FFD700,#F97316)', rarity:'legendary', shine:true },
  { id:'player_var', kind:'badge', emoji:'VAR', name:'VAR-ul din Sufragerie', desc:'Pune pauza si da verdict', bg:'#130f24', accent:'#A855F7', accent2:'#60A5FA', ring:'linear-gradient(135deg,#A855F7,#60A5FA)', rarity:'epic' },
  { id:'player_capitan', kind:'crest', emoji:'C', name:'Capitanul Haosului', desc:'Calm in chat, panica in minutul 90', bg:'#101827', accent:'#00E5A0', accent2:'#FFD700', ring:'linear-gradient(135deg,#00E5A0,#FFD700)', rarity:'epic' },
  { id:'player_penalty', kind:'crest', emoji:'PK', name:'Penalty Goblin', desc:'Simte bara inaintea portarului', bg:'#260b0b', accent:'#EF4444', accent2:'#FFD700', ring:'linear-gradient(135deg,#EF4444,#FFD700)', rarity:'epic' },
  { id:'player_tactician', kind:'badge', emoji:'4-3', name:'Profesor 4-3-3', desc:'Schimba sistemul si cand doarme', bg:'#071f12', accent:'#22C55E', accent2:'#60A5FA', ring:'linear-gradient(135deg,#22C55E,#60A5FA)', rarity:'rare' },
  { id:'player_parkbus', kind:'crest', emoji:'BUS', name:'Autobaza Deluxe', desc:'1-0 si ne vedem la clasament', bg:'#1b1620', accent:'#94A3B8', accent2:'#FFD700', ring:'linear-gradient(135deg,#94A3B8,#FFD700)', rarity:'rare' },
  { id:'player_ultra', kind:'badge', emoji:'90', name:'Minutul 90+7', desc:'Castiga cand toti au inchis TV-ul', bg:'#240c13', accent:'#F43F5E', accent2:'#FFD700', ring:'linear-gradient(135deg,#F43F5E,#FFD700)', rarity:'epic' },
  { id:'player_xg', kind:'badge', emoji:'xG', name:'xG Preotul', desc:'Pierde pariul, castiga graficul', bg:'#071827', accent:'#06B6D4', accent2:'#00E5A0', ring:'linear-gradient(135deg,#06B6D4,#00E5A0)', rarity:'rare' },

  // TROPHIES
  { id:'trophy_wc', kind:'trophy', emoji:'WC', name:'Cupa Interzisa', desc:'O atingi doar daca ai 200p', bg:'#211805', accent:'#FFD700', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#FFD700,#FFFFFF)', rarity:'legendary', shine:true },
  { id:'trophy_boot', kind:'trophy', emoji:'GB', name:'Gheata de Aur', desc:'Pentru golgeterul predictiilor', bg:'#241404', accent:'#F97316', accent2:'#FFD700', ring:'linear-gradient(135deg,#F97316,#FFD700)', rarity:'legendary', shine:true },
  { id:'trophy_brain', kind:'trophy', emoji:'IQ', name:'Creierul Grupei', desc:'Nu tipa, calculeaza', bg:'#130f24', accent:'#A855F7', accent2:'#FFD700', ring:'linear-gradient(135deg,#A855F7,#FFD700)', rarity:'legendary', shine:true },
  { id:'trophy_clean', kind:'trophy', emoji:'0', name:'Clean Sheet Monk', desc:'Nu primeste gol nici in Excel', bg:'#071827', accent:'#60A5FA', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#60A5FA,#FFFFFF)', rarity:'epic' },
  { id:'trophy_late', kind:'trophy', emoji:'90', name:'Late Clutcher', desc:'Salveaza predictia in ultimul minut', bg:'#241404', accent:'#FFD700', accent2:'#EF4444', ring:'linear-gradient(135deg,#FFD700,#EF4444)', rarity:'epic' },
  { id:'trophy_safe', kind:'trophy', emoji:'DEF', name:'Safe Player', desc:'Nu risca, dar prinde podiumul', bg:'#071f12', accent:'#00E5A0', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#00E5A0,#FFFFFF)', rarity:'rare' },

  // FUNNY / BEASTS
  { id:'fun_lion', kind:'beast', emoji:'L', name:'Leul de Studio', desc:'Rage doar dupa ce vede reluarea', bg:'#241404', accent:'#F97316', accent2:'#FFD700', ring:'linear-gradient(135deg,#F97316,#FFD700)', rarity:'rare' },
  { id:'fun_shark', kind:'beast', emoji:'S', name:'Rechinul de Cote', desc:'Miroase egalul de la 3 kilometri', bg:'#071827', accent:'#38BDF8', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#38BDF8,#FFFFFF)', rarity:'rare' },
  { id:'fun_eagle', kind:'beast', emoji:'E', name:'Vulturul VAR', desc:'Vede ofsaidul din profil', bg:'#16181f', accent:'#FFFFFF', accent2:'#FFD700', ring:'linear-gradient(135deg,#FFFFFF,#FFD700)', rarity:'rare' },
  { id:'fun_wolf', kind:'beast', emoji:'W', name:'Lupul Contraatac', desc:'Sta jos 89 minute, musca o data', bg:'#111827', accent:'#94A3B8', accent2:'#00E5A0', ring:'linear-gradient(135deg,#94A3B8,#00E5A0)', rarity:'common' },
  { id:'fun_ninja', kind:'crest', emoji:'N', name:'Ninja de Corner', desc:'Fura 15 puncte pe statistica', bg:'#0b0f18', accent:'#111827', accent2:'#00E5A0', ring:'linear-gradient(135deg,#111827,#00E5A0)', rarity:'common' },
  { id:'fun_samurai', kind:'crest', emoji:'JP', name:'Samurai de Scor', desc:'Taie 2-1 din prima', bg:'#1c0f16', accent:'#EF4444', accent2:'#FFFFFF', ring:'linear-gradient(135deg,#EF4444,#FFFFFF)', rarity:'common' },
  { id:'fun_king', kind:'trophy', emoji:'K', name:'Regele Remizei', desc:'1-1 pana la moarte', bg:'#211805', accent:'#FFD700', accent2:'#A855F7', ring:'linear-gradient(135deg,#FFD700,#A855F7)', rarity:'rare' },
  { id:'fun_lucky', kind:'crest', emoji:'7', name:'Norocel 7', desc:'Nu stie fotbal, dar urca', bg:'#071f12', accent:'#22C55E', accent2:'#FFD700', ring:'linear-gradient(135deg,#22C55E,#FFD700)', rarity:'common' },
  { id:'fun_chaos', kind:'badge', emoji:'!!', name:'Agentul Haos', desc:'Pune 4-3 la Canada-Qatar', bg:'#260b0b', accent:'#EF4444', accent2:'#F97316', ring:'linear-gradient(135deg,#EF4444,#F97316)', rarity:'common' },
  { id:'fun_oracle', kind:'badge', emoji:'?', name:'Oracolul Beat', desc:'Zice scorul si uita meciul', bg:'#130f24', accent:'#A855F7', accent2:'#60A5FA', ring:'linear-gradient(135deg,#A855F7,#60A5FA)', rarity:'common' },
];

export const NICKNAME_SUGGESTIONS = [
  'VARzaCuCarnati', 'AutobazaFC', 'RegeleRemizei', 'NicuOffside', 'GolInMin90',
  'Sambalero', 'TikiTakaBoss', 'CornerDealer', 'XGPreotul', 'PenaltyGoblin',
  'DodelMondial', 'CapitanHaos', 'CotaDeAur', 'HagiDeCanapea', 'MaradonaDeMall'
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
