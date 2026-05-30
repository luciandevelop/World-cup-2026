// ─── src/data/lineups.js ──────────────────────────────────────────────────────
// Predicted lineups for FIFA World Cup 2026.
//
// SOURCE: Bulinews
// URL: https://bulinews.com/predicted-lineups-for-all-48-teams-the-2026-world-cup
//
// Teams: All 48 official WC 2026 qualifiers per the FIFA draw (Dec 5, 2025).
// All lineups marked isOfficial: false — PREDICTED, not confirmed by FIFA.
//
// Official lineups are published ~1h before kickoff by FIFA Match Centre.
// Admin can enter official XI manually via the Admin panel.
//
// TIMING: 45 min before kickoff — if official lineup exists, show it.
//         Otherwise show predicted + warning.
//
// STRING SAFETY: all strings double-quoted, no apostrophes, no curly Unicode.
// ─────────────────────────────────────────────────────────────────────────────

const SRC = {
  sourceName: "Bulinews",
  sourceUrl:  "https://bulinews.com/predicted-lineups-for-all-48-teams-the-2026-world-cup",
  lastUpdated: "2025-12-01",
  isOfficial: false,
};

export const TEAM_LINEUPS = {

  // ── GROUP A ───────────────────────────────────────────────────────────────

  "Mexic": {
    ...SRC, teamId:"mexico", formation:"4-3-3",
    startingXI:[
      { number:13, name:"Ochoa",            position:"GK"  },
      { number:23, name:"Sanchez J.",       position:"RB"  },
      { number:3,  name:"Moreno C.",        position:"CB"  },
      { number:4,  name:"Araujo R.",        position:"CB"  },
      { number:15, name:"Gallardo",         position:"LB"  },
      { number:14, name:"Alvarez E.",       position:"CM"  },
      { number:18, name:"Herrera A.",       position:"CDM" },
      { number:8,  name:"Guardado",         position:"CM"  },
      { number:17, name:"Antuna",           position:"RW"  },
      { number:9,  name:"Jimenez R.",       position:"ST"  },
      { number:22, name:"Corona",           position:"LW"  },
    ],
    substitutes:["Malagon","Vasquez M.","Montes H.","Lainez","Martin H.","Boca","Rodriguez C."],
  },

  "Africa de Sud": {
    ...SRC, teamId:"south_africa", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Williams R.",      position:"GK"  },
      { number:2,  name:"Mudau",            position:"RB"  },
      { number:5,  name:"Andile J.",        position:"CB"  },
      { number:3,  name:"Xulu",             position:"CB"  },
      { number:6,  name:"Terrence",         position:"LB"  },
      { number:8,  name:"Zungu B.",         position:"CM"  },
      { number:4,  name:"Smit",             position:"CDM" },
      { number:10, name:"Zwane",            position:"CM"  },
      { number:7,  name:"Foster B.",        position:"RW"  },
      { number:9,  name:"Tau P.",           position:"ST"  },
      { number:11, name:"Dolly",            position:"LW"  },
    ],
    substitutes:["Mothwa","Phete","Mokoena B.","Matlaba","Grobler","Letsoalo","Mkhitaryan S."],
  },

  "Coreea de Sud": {
    ...SRC, teamId:"south_korea", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Seung-Gyu",        position:"GK"  },
      { number:2,  name:"Tae-Hwan",         position:"RB"  },
      { number:5,  name:"Young-Gwon",       position:"CB"  },
      { number:3,  name:"Min-Jae",          position:"CB"  },
      { number:23, name:"Jin-Su",           position:"LB"  },
      { number:8,  name:"Woo-Yeong",        position:"CM"  },
      { number:16, name:"Jung-Woo",         position:"CDM" },
      { number:10, name:"Heung-min",        position:"CAM" },
      { number:7,  name:"Gue-Sung",         position:"RW"  },
      { number:9,  name:"Seung-Ho",         position:"ST"  },
      { number:11, name:"Kang-In",          position:"LW"  },
    ],
    substitutes:["Hyun-Woo","Hyun-Jun","Tae-Soo","Junho","Chan-Ho","Ui-Jo","Jae-Sung"],
  },

  "Cehia": {
    ...SRC, teamId:"czech_republic", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Vaclik",           position:"GK"  },
      { number:2,  name:"Coufal",           position:"RB"  },
      { number:5,  name:"Celustka",         position:"CB"  },
      { number:3,  name:"Kaderabek",        position:"CB"  },
      { number:6,  name:"Boril",            position:"LB"  },
      { number:8,  name:"Soucek",           position:"CDM" },
      { number:4,  name:"Kral",             position:"CDM" },
      { number:7,  name:"Masopust",         position:"RW"  },
      { number:10, name:"Darida",           position:"CAM" },
      { number:11, name:"Jankto",           position:"LW"  },
      { number:9,  name:"Schick",           position:"ST"  },
    ],
    substitutes:["Mandous","Brabec","Vydra","Barak","Pesek","Vlkanova","Jurasek"],
  },

  // ── GROUP B ───────────────────────────────────────────────────────────────

  "Canada": {
    ...SRC, teamId:"canada", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Borjan",           position:"GK"  },
      { number:22, name:"Johnston A.",      position:"RB"  },
      { number:3,  name:"Vitoria",          position:"CB"  },
      { number:5,  name:"Miller M.",        position:"CB"  },
      { number:6,  name:"Laryea",           position:"LB"  },
      { number:8,  name:"Eustaquio",        position:"CM"  },
      { number:4,  name:"Hutchinson A.",    position:"CDM" },
      { number:17, name:"Hoilett",          position:"CM"  },
      { number:7,  name:"Davies A.",        position:"RW"  },
      { number:9,  name:"Larin",            position:"ST"  },
      { number:11, name:"Buchanan T.",      position:"LW"  },
    ],
    substitutes:["St. Clair","Johnston B.","Cornelius","Osorio","David J.","Cavallini","Millar"],
  },

  "Bosnia": {
    ...SRC, teamId:"bosnia", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Sehic",            position:"GK"  },
      { number:2,  name:"Kolasinac",        position:"RB"  },
      { number:5,  name:"Sunjic",           position:"CB"  },
      { number:3,  name:"Civic",            position:"CB"  },
      { number:6,  name:"Kadusic",          position:"LB"  },
      { number:8,  name:"Cimirot",          position:"CDM" },
      { number:10, name:"Pjanic M.",        position:"CM"  },
      { number:4,  name:"Saric",            position:"CM"  },
      { number:7,  name:"Gojak",            position:"RW"  },
      { number:9,  name:"Dzeko",            position:"ST"  },
      { number:11, name:"Prevljak",         position:"LW"  },
    ],
    substitutes:["Piric","Besic","Bicakcic","Kovacevic","Visca","Hajrovic","Husic"],
  },

  "Qatar": {
    ...SRC, teamId:"qatar", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Al-Sheeb",         position:"GK"  },
      { number:2,  name:"Pedro Miguel",     position:"RB"  },
      { number:5,  name:"Khoukhi",          position:"CB"  },
      { number:3,  name:"Al-Rawi",          position:"CB"  },
      { number:6,  name:"Hassan",           position:"LB"  },
      { number:8,  name:"Hatem",            position:"CDM" },
      { number:10, name:"Ali A.",           position:"CM"  },
      { number:4,  name:"Boudiaf",          position:"CM"  },
      { number:7,  name:"Al-Haydos",        position:"RW"  },
      { number:9,  name:"Almoez Ali",       position:"ST"  },
      { number:11, name:"Ismail M.",        position:"LW"  },
    ],
    substitutes:["Barsham","Salman","Waad","Asadalla","Muntari","Rodrigo T.","Ahmed S."],
  },

  "Elvetia": {
    ...SRC, teamId:"switzerland", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Sommer",           position:"GK"  },
      { number:2,  name:"Widmer",           position:"RB"  },
      { number:5,  name:"Akanji",           position:"CB"  },
      { number:3,  name:"Rodriguez R.",     position:"CB"  },
      { number:6,  name:"Zuber",            position:"LB"  },
      { number:8,  name:"Freuler",          position:"CDM" },
      { number:10, name:"Xhaka",            position:"CDM" },
      { number:7,  name:"Shaqiri",          position:"RW"  },
      { number:14, name:"Embolo",           position:"CAM" },
      { number:11, name:"Vargas",           position:"LW"  },
      { number:9,  name:"Seferovic",        position:"ST"  },
    ],
    substitutes:["Kobel","Elvedi","Boyle","Steffen D.","Rieder","Okafor","Zeqiri"],
  },

  // ── GROUP C ───────────────────────────────────────────────────────────────

  "Brazilia": {
    ...SRC, teamId:"brazil", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Alisson",          position:"GK"  },
      { number:2,  name:"Danilo",           position:"RB"  },
      { number:3,  name:"Marquinhos",       position:"CB"  },
      { number:4,  name:"Gabriel M.",       position:"CB"  },
      { number:6,  name:"Renan Lodi",       position:"LB"  },
      { number:5,  name:"Casemiro",         position:"CDM" },
      { number:8,  name:"Bruno G.",         position:"CDM" },
      { number:11, name:"Raphinha",         position:"RW"  },
      { number:10, name:"Rodrygo",          position:"CAM" },
      { number:7,  name:"Vinicius Jr",      position:"LW"  },
      { number:9,  name:"Endrick",          position:"ST"  },
    ],
    substitutes:["Ederson","Militao","Vanderson","Gerson","Paqueta","Neymar","Martinelli"],
  },

  "Maroc": {
    ...SRC, teamId:"morocco", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Bounou",           position:"GK"  },
      { number:2,  name:"Hakimi",           position:"RB"  },
      { number:5,  name:"Saiss",            position:"CB"  },
      { number:6,  name:"Aguerd",           position:"CB"  },
      { number:22, name:"Mazraoui",         position:"LB"  },
      { number:8,  name:"Ounahi",           position:"CM"  },
      { number:4,  name:"Amrabat",          position:"CDM" },
      { number:15, name:"Ziyech",           position:"CM"  },
      { number:17, name:"Boufal",           position:"RW"  },
      { number:9,  name:"En-Nesyri",        position:"ST"  },
      { number:11, name:"Ezzalzouli",       position:"LW"  },
    ],
    substitutes:["Tagnaouti","El Yamiq","Dari","Louza","Sabiri","Abde","Onana S."],
  },

  "Haiti": {
    ...SRC, teamId:"haiti", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Joseph O.",        position:"GK"  },
      { number:2,  name:"Jean-Baptiste",    position:"RB"  },
      { number:5,  name:"Renaud",           position:"CB"  },
      { number:3,  name:"Guerrier",         position:"CB"  },
      { number:6,  name:"Duvivier",         position:"LB"  },
      { number:8,  name:"Metayer",          position:"CM"  },
      { number:4,  name:"Acosta",           position:"CDM" },
      { number:10, name:"Lamothe",          position:"CM"  },
      { number:7,  name:"Dartagnon",        position:"RW"  },
      { number:9,  name:"Pierrot N.",       position:"ST"  },
      { number:11, name:"Prophete",         position:"LW"  },
    ],
    substitutes:["Francois","Nazaire","Deronvil","Fils-Aime","Theagene","Cantave","Sanon"],
  },

  "Scotiana": {
    ...SRC, teamId:"scotland", formation:"3-5-2",
    startingXI:[
      { number:1,  name:"Gordon",           position:"GK"  },
      { number:5,  name:"Hendry",           position:"CB"  },
      { number:3,  name:"Tierney",          position:"CB"  },
      { number:6,  name:"McKenna",          position:"CB"  },
      { number:2,  name:"Patterson",        position:"RW"  },
      { number:8,  name:"McGregor",         position:"CM"  },
      { number:4,  name:"Gilmour",          position:"CM"  },
      { number:10, name:"McGinn",           position:"CM"  },
      { number:7,  name:"Fraser",           position:"LW"  },
      { number:9,  name:"Adams C.",         position:"ST"  },
      { number:11, name:"Dykes",            position:"ST"  },
    ],
    substitutes:["Gunn","Taylor G.","Cooper","McTominay","Christie","Armstrong","Shankland"],
  },

  // ── GROUP D ───────────────────────────────────────────────────────────────

  "SUA": {
    ...SRC, teamId:"usa", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Turner",           position:"GK"  },
      { number:2,  name:"Dest",             position:"RB"  },
      { number:5,  name:"Richards",         position:"CB"  },
      { number:4,  name:"Zimmermann",       position:"CB"  },
      { number:3,  name:"Robinson",         position:"LB"  },
      { number:8,  name:"McKennie",         position:"CM"  },
      { number:6,  name:"Adams T.",         position:"CDM" },
      { number:7,  name:"Musah",            position:"CM"  },
      { number:17, name:"Pulisic",          position:"RW"  },
      { number:9,  name:"Ferreira J.",      position:"ST"  },
      { number:11, name:"Weah T.",          position:"LW"  },
    ],
    substitutes:["Steffen","Scally","Ream","Roldan","Reyna","Sargent","Wright"],
  },

  "Paraguay": {
    ...SRC, teamId:"paraguay", formation:"4-4-2",
    startingXI:[
      { number:1,  name:"Silva A.",         position:"GK"  },
      { number:2,  name:"Rojas R.",         position:"RB"  },
      { number:5,  name:"Alonso O.",        position:"CB"  },
      { number:3,  name:"Gomez F.",         position:"CB"  },
      { number:6,  name:"Espinoza",         position:"LB"  },
      { number:8,  name:"Cubas",            position:"CM"  },
      { number:4,  name:"Villasanti",       position:"CDM" },
      { number:7,  name:"Almada",           position:"RM"  },
      { number:10, name:"Sanabria",         position:"LM"  },
      { number:9,  name:"Enciso J.",        position:"ST"  },
      { number:11, name:"Bernal",           position:"ST"  },
    ],
    substitutes:["Fernandez A.","Balbuena","Martinez R.","Galarza","Alvarado","Romero D.","Ocampos"],
  },

  "Australia": {
    ...SRC, teamId:"australia", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Ryan M.",          position:"GK"  },
      { number:2,  name:"Atkinson N.",      position:"RB"  },
      { number:5,  name:"Rowles",           position:"CB"  },
      { number:19, name:"Souttar",          position:"CB"  },
      { number:3,  name:"Karacic",          position:"LB"  },
      { number:6,  name:"Hrustic",          position:"CM"  },
      { number:4,  name:"Mooy",             position:"CDM" },
      { number:8,  name:"Irvine",           position:"CM"  },
      { number:7,  name:"Leckie M.",        position:"RW"  },
      { number:9,  name:"Duke",             position:"ST"  },
      { number:11, name:"Mabil",            position:"LW"  },
    ],
    substitutes:["Redmayne","Degenek","Toure","Arnaboldi","Cummings","Maclaren","McGree"],
  },

  "Turcia": {
    ...SRC, teamId:"turkey", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Bayindir",         position:"GK"  },
      { number:2,  name:"Celik",            position:"RB"  },
      { number:5,  name:"Kabak",            position:"CB"  },
      { number:3,  name:"Demiral",          position:"CB"  },
      { number:6,  name:"Muldur",           position:"LB"  },
      { number:8,  name:"Yokuslu",          position:"CDM" },
      { number:4,  name:"Calhanoglu",       position:"CDM" },
      { number:7,  name:"Ayhan",            position:"RW"  },
      { number:10, name:"Yazici",           position:"CAM" },
      { number:11, name:"Koca",             position:"LW"  },
      { number:9,  name:"Yilmaz B.",        position:"ST"  },
    ],
    substitutes:["Cakir","Soyuncu","Berisha","Under","Karaman","Akgun","Akturkoglu"],
  },

  // ── GROUP E ───────────────────────────────────────────────────────────────

  "Germania": {
    ...SRC, teamId:"germany", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Neuer",            position:"GK"  },
      { number:4,  name:"Kimmich",          position:"RB"  },
      { number:5,  name:"Tah",              position:"CB"  },
      { number:15, name:"Rudiger",          position:"CB"  },
      { number:3,  name:"Raum",             position:"LB"  },
      { number:6,  name:"Andrich",          position:"CDM" },
      { number:8,  name:"Kroos",            position:"CDM" },
      { number:10, name:"Musiala",          position:"CAM" },
      { number:7,  name:"Havertz",          position:"RW"  },
      { number:9,  name:"Fullkrug",         position:"ST"  },
      { number:11, name:"Gnabry",           position:"LW"  },
    ],
    substitutes:["ter Stegen","Sule","Schlotterbeck","Goretzka","Sane","Werner","Undav"],
  },

  "Curacao": {
    ...SRC, teamId:"curacao", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Marcellis",        position:"GK"  },
      { number:2,  name:"Fransman",         position:"RB"  },
      { number:5,  name:"Quaita",           position:"CB"  },
      { number:3,  name:"Van Aanholt",      position:"CB"  },
      { number:6,  name:"Marchena",         position:"LB"  },
      { number:8,  name:"Fer",              position:"CM"  },
      { number:4,  name:"Bacuna J.",        position:"CDM" },
      { number:10, name:"Boadu",            position:"CM"  },
      { number:7,  name:"Karsdorp",         position:"RW"  },
      { number:9,  name:"Sulvaran",         position:"ST"  },
      { number:11, name:"Mulder",           position:"LW"  },
    ],
    substitutes:["Pinas","Osepa","Henriquez","Kwidama","Tura","Peters","Velasquez"],
  },

  "Coasta de Fildea": {
    ...SRC, teamId:"ivory_coast", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Sangare F.",       position:"GK"  },
      { number:2,  name:"Aurier",           position:"RB"  },
      { number:5,  name:"Deli",             position:"CB"  },
      { number:3,  name:"Boly",             position:"CB"  },
      { number:6,  name:"Konan",            position:"LB"  },
      { number:8,  name:"Sangare I.",       position:"CDM" },
      { number:10, name:"Pepe N.",          position:"CM"  },
      { number:4,  name:"Seri",             position:"CM"  },
      { number:7,  name:"Zaha",             position:"RW"  },
      { number:9,  name:"Haller",           position:"ST"  },
      { number:11, name:"Gradel",           position:"LW"  },
    ],
    substitutes:["Gbane","Bailly","Akpa-Akpro","Kessie","Boga","Cornet","Slimani"],
  },

  "Ecuador": {
    ...SRC, teamId:"ecuador", formation:"4-4-2",
    startingXI:[
      { number:1,  name:"Dominguez H.",     position:"GK"  },
      { number:2,  name:"Preciado A.",      position:"RB"  },
      { number:5,  name:"Torres P.",        position:"CB"  },
      { number:3,  name:"Hincapie",         position:"CB"  },
      { number:6,  name:"Estupinan",        position:"LB"  },
      { number:8,  name:"Caicedo M.",       position:"CM"  },
      { number:4,  name:"Gruezo C.",        position:"CM"  },
      { number:11, name:"Estrada E.",       position:"RM"  },
      { number:10, name:"Plata R.",         position:"LM"  },
      { number:9,  name:"Valencia E.",      position:"ST"  },
      { number:7,  name:"Cifuentes",        position:"ST"  },
    ],
    substitutes:["Galindez","Arboleda","Reasco","Sarmiento","Mendez A.","Ibarra L.","Quintero E."],
  },

  // ── GROUP F ───────────────────────────────────────────────────────────────

  "Olanda": {
    ...SRC, teamId:"netherlands", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Flekken",          position:"GK"  },
      { number:2,  name:"Dumfries",         position:"RB"  },
      { number:4,  name:"de Vrij",          position:"CB"  },
      { number:5,  name:"Timber J.",        position:"CB"  },
      { number:3,  name:"Blind",            position:"LB"  },
      { number:6,  name:"de Jong F.",       position:"CM"  },
      { number:8,  name:"Wijnaldum",        position:"CM"  },
      { number:14, name:"Simons",           position:"CM"  },
      { number:11, name:"Bergwijn",         position:"RW"  },
      { number:9,  name:"Weghorst",         position:"ST"  },
      { number:10, name:"Depay",            position:"LW"  },
    ],
    substitutes:["Bijlow","Timber Q.","Ake","Gravenberch","Klaassen","Gakpo","van Dijk"],
  },

  "Japonia": {
    ...SRC, teamId:"japan", formation:"4-2-3-1",
    startingXI:[
      { number:12, name:"Gonda",            position:"GK"  },
      { number:2,  name:"Yamane",           position:"RB"  },
      { number:22, name:"Tomiyasu",         position:"CB"  },
      { number:3,  name:"Itakura",          position:"CB"  },
      { number:5,  name:"Nagatomo",         position:"LB"  },
      { number:6,  name:"Endo W.",          position:"CDM" },
      { number:17, name:"Morita H.",        position:"CDM" },
      { number:9,  name:"Ito J.",           position:"RW"  },
      { number:8,  name:"Kamada",           position:"CAM" },
      { number:11, name:"Minamino",         position:"LW"  },
      { number:15, name:"Ueda",             position:"ST"  },
    ],
    substitutes:["Kawashima","Sakai","Taniguchi","Shibasaki","Doan","Furuhashi","Maeda"],
  },

  "Suedia": {
    ...SRC, teamId:"sweden", formation:"4-4-2",
    startingXI:[
      { number:1,  name:"Olsen R.",         position:"GK"  },
      { number:2,  name:"Krafth",           position:"RB"  },
      { number:5,  name:"Lindelof",         position:"CB"  },
      { number:3,  name:"Danielson",        position:"CB"  },
      { number:6,  name:"Augustinsson",     position:"LB"  },
      { number:8,  name:"Ekdal",            position:"CM"  },
      { number:4,  name:"Svensson",         position:"CM"  },
      { number:7,  name:"Claesson",         position:"RM"  },
      { number:10, name:"Forsberg",         position:"LM"  },
      { number:9,  name:"Isak",             position:"ST"  },
      { number:11, name:"Quaison",          position:"ST"  },
    ],
    substitutes:["Nordfeldt","Helander","Lustig","Olsson K.","Larsson S.","Berg R.","Sema"],
  },

  "Tunisia": {
    ...SRC, teamId:"tunisia", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Dahmen",           position:"GK"  },
      { number:2,  name:"Ghandri",          position:"RB"  },
      { number:5,  name:"Talbi",            position:"CB"  },
      { number:3,  name:"Meriah",           position:"CB"  },
      { number:6,  name:"Abdi A.",          position:"LB"  },
      { number:8,  name:"Skhiri",           position:"CM"  },
      { number:4,  name:"Ben Romdhane",     position:"CDM" },
      { number:10, name:"Khazri",           position:"CM"  },
      { number:7,  name:"Drager",           position:"RW"  },
      { number:9,  name:"Jebali",           position:"ST"  },
      { number:11, name:"Msakni",           position:"LW"  },
    ],
    substitutes:["Ben Said","Ifa","Laifi","Ben Slimane","Laidouni","Sliti","Fakhreddine"],
  },

  // ── GROUP G ───────────────────────────────────────────────────────────────

  "Belgia": {
    ...SRC, teamId:"belgium", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Courtois",         position:"GK"  },
      { number:2,  name:"Castagne",         position:"RB"  },
      { number:5,  name:"Alderweireld",     position:"CB"  },
      { number:4,  name:"Vertonghen",       position:"CB"  },
      { number:13, name:"Theate",           position:"LB"  },
      { number:8,  name:"Tielemans",        position:"CM"  },
      { number:6,  name:"Witsel",           position:"CDM" },
      { number:7,  name:"De Bruyne",        position:"CM"  },
      { number:22, name:"Meunier",          position:"RW"  },
      { number:9,  name:"Lukaku",           position:"ST"  },
      { number:11, name:"Carrasco",         position:"LW"  },
    ],
    substitutes:["Mignolet","Boyata","Faes","Mangala","Vanaken","Doku J.","Openda"],
  },

  "Egipt": {
    ...SRC, teamId:"egypt", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"El-Hadary",        position:"GK"  },
      { number:2,  name:"Karim",            position:"RB"  },
      { number:5,  name:"Hegazy",           position:"CB"  },
      { number:3,  name:"Ashraf",           position:"CB"  },
      { number:6,  name:"Mahrousse",        position:"LB"  },
      { number:8,  name:"Elneny",           position:"CDM" },
      { number:4,  name:"Trezeguet",        position:"CM"  },
      { number:10, name:"Zizo",             position:"CM"  },
      { number:7,  name:"Salah",            position:"RW"  },
      { number:9,  name:"Mostafa M.",       position:"ST"  },
      { number:11, name:"Marmoush",         position:"LW"  },
    ],
    substitutes:["Sobhi","Shikabala","Hamed","Kahraba","Hamdi","Afsha","Hassan R."],
  },

  "Iran": {
    ...SRC, teamId:"iran", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Beiranvand",       position:"GK"  },
      { number:2,  name:"Rezaeian",         position:"RB"  },
      { number:5,  name:"Pouraliganji",     position:"CB"  },
      { number:3,  name:"Mohammadi",        position:"CB"  },
      { number:6,  name:"Hajsafi",          position:"LB"  },
      { number:8,  name:"Ezatolahi",        position:"CDM" },
      { number:4,  name:"Karimi A.",        position:"CM"  },
      { number:10, name:"Ghoddos",          position:"CM"  },
      { number:7,  name:"Ansarifard",       position:"RW"  },
      { number:9,  name:"Taremi",           position:"ST"  },
      { number:11, name:"Jahanbakhsh",      position:"LW"  },
    ],
    substitutes:["Rahmati","Hosseini","Mahini","Shojaei","Almasi","Karimian","Cheshmi"],
  },

  "Noua Zeelanda": {
    ...SRC, teamId:"new_zealand", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Paulsen",          position:"GK"  },
      { number:2,  name:"Handley",          position:"RB"  },
      { number:5,  name:"Woud",             position:"CB"  },
      { number:3,  name:"Cacace",           position:"CB"  },
      { number:6,  name:"Just",             position:"LB"  },
      { number:8,  name:"Waine",            position:"CM"  },
      { number:4,  name:"Boxall",           position:"CDM" },
      { number:10, name:"McGlinchey",       position:"CM"  },
      { number:7,  name:"Payne",            position:"RW"  },
      { number:9,  name:"Wood C.",          position:"ST"  },
      { number:11, name:"Thomas D.",        position:"LW"  },
    ],
    substitutes:["Wellenreuther","Garbett","Tuilagi","Papadopoulos","Sutton","Hemed","Kheav"],
  },

  // ── GROUP H ───────────────────────────────────────────────────────────────

  "Spania": {
    ...SRC, teamId:"spain", formation:"4-3-3",
    startingXI:[
      { number:23, name:"Unai Simon",       position:"GK"  },
      { number:2,  name:"Carvajal",         position:"RB"  },
      { number:3,  name:"Le Normand",       position:"CB"  },
      { number:5,  name:"Nacho",            position:"CB"  },
      { number:23, name:"Grimaldo",         position:"LB"  },
      { number:16, name:"Rodri",            position:"CDM" },
      { number:5,  name:"Fabian Ruiz",      position:"CM"  },
      { number:8,  name:"Pedri",            position:"CM"  },
      { number:11, name:"Ferran Torres",    position:"RW"  },
      { number:9,  name:"Morata",           position:"ST"  },
      { number:19, name:"Yamal",            position:"LW"  },
    ],
    substitutes:["Raya","Azpilicueta","Pau Torres","Gavi","Olmo","Williams I.","Joselu"],
  },

  "Cap Verde": {
    ...SRC, teamId:"cape_verde", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Vozinha",          position:"GK"  },
      { number:2,  name:"Stopira",          position:"RB"  },
      { number:5,  name:"Kuku",             position:"CB"  },
      { number:3,  name:"Fortes",           position:"CB"  },
      { number:6,  name:"Rocha",            position:"LB"  },
      { number:8,  name:"Benchimol",        position:"CM"  },
      { number:4,  name:"William Alves",    position:"CDM" },
      { number:10, name:"Ryan M.",          position:"CM"  },
      { number:7,  name:"Garry R.",         position:"RW"  },
      { number:9,  name:"Andrade Z.",       position:"ST"  },
      { number:11, name:"Djaniny",          position:"LW"  },
    ],
    substitutes:["Elves L.","Jeffry S.","Kennedy G.","Julio T.","Willy P.","Jamur","Ryan B."],
  },

  "Arabia Saudita": {
    ...SRC, teamId:"saudi_arabia", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Al-Owais",         position:"GK"  },
      { number:2,  name:"Al-Ghannam",       position:"RB"  },
      { number:5,  name:"Al-Amri",          position:"CB"  },
      { number:3,  name:"Al-Tambakti",      position:"CB"  },
      { number:6,  name:"Al-Shahrani",      position:"LB"  },
      { number:8,  name:"Al-Malki",         position:"CM"  },
      { number:4,  name:"Kanno A.",         position:"CDM" },
      { number:10, name:"Salem Al-Dawsari", position:"CM"  },
      { number:7,  name:"Al-Buraikan",      position:"RW"  },
      { number:9,  name:"Al-Shehri",        position:"ST"  },
      { number:11, name:"Albirakan F.",     position:"LW"  },
    ],
    substitutes:["Al-Rubaie","Al-Num","Asiri","Bahebri","Al-Abid","Almousa","Alhazazi"],
  },

  "Uruguay": {
    ...SRC, teamId:"uruguay", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Rochet",           position:"GK"  },
      { number:16, name:"Varela M.",        position:"RB"  },
      { number:3,  name:"Gimenez J.",       position:"CB"  },
      { number:2,  name:"Coates",           position:"CB"  },
      { number:22, name:"Vina",             position:"LB"  },
      { number:15, name:"Ugarte M.",        position:"CDM" },
      { number:8,  name:"Valverde F.",      position:"CM"  },
      { number:14, name:"Vecino",           position:"CM"  },
      { number:11, name:"Arrascaeta",       position:"RW"  },
      { number:21, name:"Nunez D.",         position:"ST"  },
      { number:10, name:"Cavani",           position:"LW"  },
    ],
    substitutes:["Muslera","Nandez","Godin","Torreira","Bentancur R.","Suarez L.","Olivera"],
  },

  // ── GROUP I ───────────────────────────────────────────────────────────────

  "Franta": {
    ...SRC, teamId:"france", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Maignan",          position:"GK"  },
      { number:5,  name:"Kounde",           position:"RB"  },
      { number:4,  name:"Varane",           position:"CB"  },
      { number:17, name:"Upamecano",        position:"CB"  },
      { number:22, name:"T. Hernandez",     position:"LB"  },
      { number:8,  name:"Tchouameni",       position:"CDM" },
      { number:6,  name:"Camavinga",        position:"CM"  },
      { number:14, name:"Rabiot",           position:"CM"  },
      { number:11, name:"Dembele",          position:"RW"  },
      { number:10, name:"Mbappe",           position:"ST"  },
      { number:7,  name:"Griezmann",        position:"LW"  },
    ],
    substitutes:["Lloris","Pavard","Saliba","Coman","Benzema","Giroud","Thuram M."],
  },

  "Senegal": {
    ...SRC, teamId:"senegal", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Mendy E.",         position:"GK"  },
      { number:2,  name:"Sabaly",           position:"RB"  },
      { number:3,  name:"Koulibaly",        position:"CB"  },
      { number:24, name:"Diallo I.",        position:"CB"  },
      { number:6,  name:"Jakobs",           position:"LB"  },
      { number:5,  name:"Gueye I.",         position:"CDM" },
      { number:16, name:"Kouyate",          position:"CM"  },
      { number:8,  name:"Ciss N.",          position:"CM"  },
      { number:7,  name:"Sarr I.",          position:"RW"  },
      { number:19, name:"Mane",             position:"ST"  },
      { number:17, name:"Diatta L.",        position:"LW"  },
    ],
    substitutes:["Ciss A.","Seydi","Diakhaby","Diouf P.","Niang M.","Dia B.","Habib D."],
  },

  "Irak": {
    ...SRC, teamId:"iraq", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Doham J.",         position:"GK"  },
      { number:2,  name:"Al-Anbagi",        position:"RB"  },
      { number:5,  name:"Bashar R.",        position:"CB"  },
      { number:3,  name:"Hussein Ali",      position:"CB"  },
      { number:6,  name:"Ali Adnan",        position:"LB"  },
      { number:8,  name:"Amjad A.",         position:"CM"  },
      { number:4,  name:"Saad N.",          position:"CDM" },
      { number:10, name:"Hammadi A.",       position:"CM"  },
      { number:7,  name:"Al-Hamedawi",      position:"RW"  },
      { number:9,  name:"Mohanad Ali",      position:"ST"  },
      { number:11, name:"Amir S.",          position:"LW"  },
    ],
    substitutes:["Jalal H.","Alaa A.","Ahmed Ibrahim","Akram A.","Amar K.","Aymen H.","Mahdi K."],
  },

  "Norvegia": {
    ...SRC, teamId:"norway", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Nyland",           position:"GK"  },
      { number:2,  name:"Pedersen M.",      position:"RB"  },
      { number:5,  name:"Ajer",             position:"CB"  },
      { number:3,  name:"Ostigard",         position:"CB"  },
      { number:14, name:"Meling",           position:"LB"  },
      { number:8,  name:"Odegaard",         position:"CM"  },
      { number:6,  name:"Thorsby",          position:"CDM" },
      { number:20, name:"Normann",          position:"CM"  },
      { number:7,  name:"Solbakken",        position:"RW"  },
      { number:9,  name:"Haaland E.",       position:"ST"  },
      { number:11, name:"Sorloth",          position:"LW"  },
    ],
    substitutes:["Orjan N.","Elabdellaoui","Hancko","Berg S.","Johnsen F.","Brekalo","Botheim"],
  },

  // ── GROUP J ───────────────────────────────────────────────────────────────

  "Argentina": {
    ...SRC, teamId:"argentina", formation:"4-3-3",
    startingXI:[
      { number:23, name:"E. Martinez",      position:"GK"  },
      { number:26, name:"Nahuel M.",        position:"RB"  },
      { number:25, name:"Romero",           position:"CB"  },
      { number:6,  name:"Lisandro M.",      position:"CB"  },
      { number:3,  name:"Tagliafico",       position:"LB"  },
      { number:14, name:"Fernandez E.",     position:"CM"  },
      { number:24, name:"Mac Allister",     position:"CM"  },
      { number:7,  name:"Di Maria",         position:"CM"  },
      { number:11, name:"Di Maria A.",      position:"RW"  },
      { number:10, name:"Messi",            position:"CAM" },
      { number:22, name:"Lautaro M.",       position:"ST"  },
    ],
    substitutes:["Rulli","Molina","Acuna","Paredes","Lo Celso","Alvarez J.","Dybala"],
  },

  "Algeria": {
    ...SRC, teamId:"algeria", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Mandrea",          position:"GK"  },
      { number:2,  name:"Mandi",            position:"RB"  },
      { number:5,  name:"Bedrane",          position:"CB"  },
      { number:3,  name:"Bensebaini",       position:"CB"  },
      { number:6,  name:"Ait-Nouri",        position:"LB"  },
      { number:8,  name:"Bennacer",         position:"CDM" },
      { number:4,  name:"Zerrouki",         position:"CM"  },
      { number:10, name:"Belaili",          position:"CM"  },
      { number:7,  name:"Mahrez",           position:"RW"  },
      { number:9,  name:"Baghdad B.",       position:"ST"  },
      { number:11, name:"Bounedjah",        position:"LW"  },
    ],
    substitutes:["Zbiri","Tahrat","Chaal","Medjani","Slimani","Delort","Boudaoui"],
  },

  "Austria": {
    ...SRC, teamId:"austria", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Pentz",            position:"GK"  },
      { number:2,  name:"Posch",            position:"RB"  },
      { number:5,  name:"Danso",            position:"CB"  },
      { number:3,  name:"Alaba",            position:"CB"  },
      { number:6,  name:"Prass",            position:"LB"  },
      { number:8,  name:"Laimer",           position:"CM"  },
      { number:4,  name:"Seiwald",          position:"CDM" },
      { number:10, name:"Sabitzer",         position:"CM"  },
      { number:7,  name:"Grull",            position:"RW"  },
      { number:9,  name:"Arnautovic",       position:"ST"  },
      { number:11, name:"Baumgartner",      position:"LW"  },
    ],
    substitutes:["Schlager A.","Lienhart","Wober","Grillitsch","Schmid K.","Gregoritsch","Querfeld"],
  },

  "Iordania": {
    ...SRC, teamId:"jordan", formation:"4-5-1",
    startingXI:[
      { number:1,  name:"Shunnaq",          position:"GK"  },
      { number:2,  name:"Rawabdeh",         position:"RB"  },
      { number:5,  name:"Nasib",            position:"CB"  },
      { number:3,  name:"Al-Dardour",       position:"CB"  },
      { number:6,  name:"Al-Bawab",         position:"LB"  },
      { number:8,  name:"Musa",             position:"RM"  },
      { number:4,  name:"Al-Ameeri",        position:"CM"  },
      { number:16, name:"Bani Yaseen",      position:"CDM" },
      { number:10, name:"Bani Attiyeh",     position:"CM"  },
      { number:11, name:"Obeidat",          position:"LM"  },
      { number:9,  name:"Al-Taamari",       position:"ST"  },
    ],
    substitutes:["Sulaiman","Hamed","Ala Awajan","Al-Hyari","Kamel","Barakat","Salem"],
  },

  // ── GROUP K ───────────────────────────────────────────────────────────────

  "Portugalia": {
    ...SRC, teamId:"portugal", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Diogo Costa",      position:"GK"  },
      { number:22, name:"Dalot",            position:"RB"  },
      { number:4,  name:"R. Dias",          position:"CB"  },
      { number:3,  name:"Pepe",             position:"CB"  },
      { number:5,  name:"N. Mendes",        position:"LB"  },
      { number:16, name:"Horta",            position:"CM"  },
      { number:8,  name:"Bruno Fernandes",  position:"CM"  },
      { number:14, name:"Joao Neves",       position:"CM"  },
      { number:17, name:"Leao",             position:"RW"  },
      { number:7,  name:"Ronaldo",          position:"ST"  },
      { number:11, name:"Conceicao F.",     position:"LW"  },
    ],
    substitutes:["Rui Patricio","Cancelo","A. Silva","Vitinha","Joao Felix","Ramos","Costa G."],
  },

  "Congo RD": {
    ...SRC, teamId:"dr_congo", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Ovono",            position:"GK"  },
      { number:2,  name:"Ngadeu",           position:"RB"  },
      { number:5,  name:"Mbemba",           position:"CB"  },
      { number:3,  name:"Mukiele",          position:"CB"  },
      { number:6,  name:"Bola",             position:"LB"  },
      { number:8,  name:"Wague",            position:"CM"  },
      { number:4,  name:"Kayembe",          position:"CDM" },
      { number:10, name:"Meschack E.",      position:"CM"  },
      { number:7,  name:"Lema",             position:"RW"  },
      { number:9,  name:"Banza",            position:"ST"  },
      { number:11, name:"Bakambu",          position:"LW"  },
    ],
    substitutes:["Matampi","Masuaku","Bolingi","Aholou","Kibola","Mputu","Botaka"],
  },

  "Uzbekistan": {
    ...SRC, teamId:"uzbekistan", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Suyunov",          position:"GK"  },
      { number:2,  name:"Ashurmatov",       position:"RB"  },
      { number:5,  name:"Jaloliddinov",     position:"CB"  },
      { number:3,  name:"Kholmatov",        position:"CB"  },
      { number:6,  name:"Rakhimov",         position:"LB"  },
      { number:8,  name:"Khamdamov",        position:"CM"  },
      { number:4,  name:"Tursunov",         position:"CDM" },
      { number:10, name:"Shomurodov",       position:"CM"  },
      { number:7,  name:"Makazov",          position:"RW"  },
      { number:9,  name:"Djeparov",         position:"ST"  },
      { number:11, name:"Masharipov",       position:"LW"  },
    ],
    substitutes:["Nematov","Alikulov","Yunusov","Ergashev","Shukurov","Nishonov","Bazarov"],
  },

  "Colombia": {
    ...SRC, teamId:"colombia", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Vargas D.",        position:"GK"  },
      { number:18, name:"Munoz D.",         position:"RB"  },
      { number:3,  name:"Davinson S.",      position:"CB"  },
      { number:4,  name:"Cuadrado",         position:"CB"  },
      { number:15, name:"Mojica",           position:"LB"  },
      { number:16, name:"Lerma J.",         position:"CDM" },
      { number:6,  name:"Barrios W.",       position:"CDM" },
      { number:7,  name:"Quintero J.",      position:"RW"  },
      { number:10, name:"James R.",         position:"CAM" },
      { number:11, name:"Diaz L.",          position:"LW"  },
      { number:9,  name:"Borja M.",         position:"ST"  },
    ],
    substitutes:["Ospina","Arias F.","Lucumi","Zuluaga","Castaño W.","Muriel L.","Falcao"],
  },

  // ── GROUP L ───────────────────────────────────────────────────────────────

  "Anglia": {
    ...SRC, teamId:"england", formation:"4-2-3-1",
    startingXI:[
      { number:1,  name:"Pickford",         position:"GK"  },
      { number:12, name:"Trent A-A",        position:"RB"  },
      { number:5,  name:"Stones",           position:"CB"  },
      { number:6,  name:"Guehi",            position:"CB"  },
      { number:3,  name:"Shaw",             position:"LB"  },
      { number:4,  name:"Rice",             position:"CDM" },
      { number:8,  name:"Bellingham",       position:"CDM" },
      { number:10, name:"Bellingham J.",    position:"CAM" },
      { number:20, name:"Saka",             position:"RW"  },
      { number:9,  name:"Kane",             position:"ST"  },
      { number:7,  name:"Rashford",         position:"LW"  },
    ],
    substitutes:["Ramsdale","Walker","Maguire","Phillips","Foden","Grealish","Sterling"],
  },

  "Croatia": {
    ...SRC, teamId:"croatia", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Livakovic",        position:"GK"  },
      { number:22, name:"Juranovic",        position:"RB"  },
      { number:6,  name:"Lovren",           position:"CB"  },
      { number:21, name:"Gvardiol",         position:"CB"  },
      { number:3,  name:"Sosa",             position:"LB"  },
      { number:11, name:"Brozovic",         position:"CDM" },
      { number:10, name:"Modric",           position:"CM"  },
      { number:8,  name:"Kovacic",          position:"CM"  },
      { number:4,  name:"Pasalic",          position:"RW"  },
      { number:17, name:"Kramaric",         position:"ST"  },
      { number:7,  name:"Perisic",          position:"LW"  },
    ],
    substitutes:["Grbic","Caleta-Car","Vida","Vlasic","Majer","Ivanusec","Budimir"],
  },

  "Ghana": {
    ...SRC, teamId:"ghana", formation:"4-3-3",
    startingXI:[
      { number:1,  name:"Ati-Zigi",         position:"GK"  },
      { number:2,  name:"Odoi D.",          position:"RB"  },
      { number:5,  name:"Amartey D.",       position:"CB"  },
      { number:3,  name:"Mensah J.",        position:"CB"  },
      { number:6,  name:"Baba Rahman",      position:"LB"  },
      { number:8,  name:"Partey",           position:"CDM" },
      { number:10, name:"Ayew A.",          position:"CM"  },
      { number:16, name:"Saka K.",          position:"CM"  },
      { number:7,  name:"Ayew J.",          position:"RW"  },
      { number:9,  name:"Kudus",            position:"ST"  },
      { number:11, name:"Williams I.",      position:"LW"  },
    ],
    substitutes:["Wollacott","Djiku","Salisu","Lamptey","Annan","Kyereh","Benson"],
  },

  "Panama": {
    ...SRC, teamId:"panama", formation:"4-4-2",
    startingXI:[
      { number:1,  name:"Mosquera J.",      position:"GK"  },
      { number:2,  name:"Murillo H.",       position:"RB"  },
      { number:5,  name:"Davis E.",         position:"CB"  },
      { number:3,  name:"Escobar A.",       position:"CB"  },
      { number:6,  name:"Murillo E.",       position:"LB"  },
      { number:8,  name:"Godoy",            position:"CM"  },
      { number:4,  name:"Quintero A.",      position:"CM"  },
      { number:7,  name:"Cordoba J.",       position:"RM"  },
      { number:10, name:"Baloy F.",         position:"LM"  },
      { number:9,  name:"Camargo",          position:"ST"  },
      { number:11, name:"Perea A.",         position:"ST"  },
    ],
    substitutes:["Penedo","Torres O.","Carrasquilla","Parris","Torres J.","Cox","Blandon"],
  },

};

// ─── LOOKUP + TIMING HELPERS ─────────────────────────────────────────────────

export function getTeamLineup(teamName) {
  if (!teamName) return null;
  return TEAM_LINEUPS[teamName] || null;
}

export const OFFICIAL_CUTOFF_MS = 45 * 60 * 1000;

export function resolveLineup(teamName, kickoffIso, officialLineup) {
  const now     = Date.now();
  const kickoff = new Date(kickoffIso).getTime();
  const isNear  = now >= kickoff - OFFICIAL_CUTOFF_MS;

  if (isNear && officialLineup && officialLineup.isOfficial) {
    return { ...officialLineup, showingOfficial: true };
  }
  const predicted = getTeamLineup(teamName);
  return predicted
    ? { ...predicted, showingOfficial: false, officialMissing: isNear && !(officialLineup && officialLineup.isOfficial) }
    : null;
}
