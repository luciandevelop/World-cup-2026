// ─── src/data/matches.js ──────────────────────────────────────────────────────
// FIFA World Cup 2026 — Official Group Stage
//
// GROUPS SOURCE: Official FIFA Draw, December 5, 2025, Kennedy Center, Washington D.C.
// Cross-verified: NBC Sports (Apr 2026), multiple sources (May 2026).
//
// FIXTURES NOTE: Match dates, kickoff times and venues are based on the official
// FIFA schedule published at https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
// Times stored in UTC, displayed as Europe/Bucharest (EEST = UTC+3) in the app.
//
// Official groups A-L with all 48 confirmed qualified teams:
//   A: Mexico, South Africa, South Korea, Czechia
//   B: Canada, Bosnia & Herzegovina, Qatar, Switzerland
//   C: Brazil, Morocco, Haiti, Scotland
//   D: USA, Paraguay, Australia, Turkey
//   E: Germany, Curacao, Ivory Coast, Ecuador
//   F: Netherlands, Japan, Sweden, Tunisia
//   G: Belgium, Egypt, Iran, New Zealand
//   H: Spain, Cape Verde, Saudi Arabia, Uruguay
//   I: France, Senegal, Iraq, Norway
//   J: Argentina, Algeria, Austria, Jordan
//   K: Portugal, DR Congo, Uzbekistan, Colombia
//   L: England, Croatia, Ghana, Panama
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_MATCHES = [

  // ══ GRUPA A — Mexico, South Africa, South Korea, Czechia ══════════════════
  { id:1,  group:"A", teamA:"Mexic",         teamB:"Africa de Sud",  flagA:"🇲🇽", flagB:"🇿🇦", time:"2026-06-11T19:00:00Z", venue:"Mexico City"   },
  { id:2,  group:"A", teamA:"Coreea de Sud", teamB:"Cehia",          flagA:"🇰🇷", flagB:"🇨🇿", time:"2026-06-11T22:00:00Z", venue:"Kansas City"   },
  { id:3,  group:"A", teamA:"Mexic",         teamB:"Coreea de Sud",  flagA:"🇲🇽", flagB:"🇰🇷", time:"2026-06-15T19:00:00Z", venue:"Guadalajara"   },
  { id:4,  group:"A", teamA:"Cehia",         teamB:"Africa de Sud",  flagA:"🇨🇿", flagB:"🇿🇦", time:"2026-06-15T22:00:00Z", venue:"Houston"       },
  { id:5,  group:"A", teamA:"Mexic",         teamB:"Cehia",          flagA:"🇲🇽", flagB:"🇨🇿", time:"2026-06-19T19:00:00Z", venue:"Los Angeles"   },
  { id:6,  group:"A", teamA:"Africa de Sud", teamB:"Coreea de Sud",  flagA:"🇿🇦", flagB:"🇰🇷", time:"2026-06-19T22:00:00Z", venue:"Dallas"        },

  // ══ GRUPA B — Canada, Bosnia & Herzegovina, Qatar, Switzerland ═══════════
  { id:7,  group:"B", teamA:"Canada",        teamB:"Bosnia",         flagA:"🇨🇦", flagB:"🇧🇦", time:"2026-06-12T20:00:00Z", venue:"Toronto"       },
  { id:8,  group:"B", teamA:"Qatar",         teamB:"Elvetia",        flagA:"🇶🇦", flagB:"🇨🇭", time:"2026-06-12T23:00:00Z", venue:"Seattle"       },
  { id:9,  group:"B", teamA:"Canada",        teamB:"Qatar",          flagA:"🇨🇦", flagB:"🇶🇦", time:"2026-06-16T20:00:00Z", venue:"Vancouver"     },
  { id:10, group:"B", teamA:"Bosnia",        teamB:"Elvetia",        flagA:"🇧🇦", flagB:"🇨🇭", time:"2026-06-16T23:00:00Z", venue:"Boston"        },
  { id:11, group:"B", teamA:"Canada",        teamB:"Elvetia",        flagA:"🇨🇦", flagB:"🇨🇭", time:"2026-06-20T23:00:00Z", venue:"Toronto"       },
  { id:12, group:"B", teamA:"Bosnia",        teamB:"Qatar",          flagA:"🇧🇦", flagB:"🇶🇦", time:"2026-06-20T23:00:00Z", venue:"Seattle"       },

  // ══ GRUPA C — Brazil, Morocco, Haiti, Scotland ════════════════════════════
  { id:13, group:"C", teamA:"Brazilia",      teamB:"Maroc",          flagA:"🇧🇷", flagB:"🇲🇦", time:"2026-06-12T23:00:00Z", venue:"New York"      },
  { id:14, group:"C", teamA:"Haiti",         teamB:"Scotiana",       flagA:"🇭🇹", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-13T02:00:00Z", venue:"Philadelphia"  },
  { id:15, group:"C", teamA:"Brazilia",      teamB:"Scotiana",       flagA:"🇧🇷", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-17T00:00:00Z", venue:"Miami"         },
  { id:16, group:"C", teamA:"Maroc",         teamB:"Haiti",          flagA:"🇲🇦", flagB:"🇭🇹", time:"2026-06-17T03:00:00Z", venue:"Atlanta"       },
  { id:17, group:"C", teamA:"Brazilia",      teamB:"Haiti",          flagA:"🇧🇷", flagB:"🇭🇹", time:"2026-06-21T23:00:00Z", venue:"Miami"         },
  { id:18, group:"C", teamA:"Scotiana",      teamB:"Maroc",          flagA:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", flagB:"🇲🇦", time:"2026-06-21T23:00:00Z", venue:"New York"      },

  // ══ GRUPA D — USA, Paraguay, Australia, Turkey ════════════════════════════
  { id:19, group:"D", teamA:"SUA",           teamB:"Paraguay",       flagA:"🇺🇸", flagB:"🇵🇾", time:"2026-06-12T19:00:00Z", venue:"Los Angeles"   },
  { id:20, group:"D", teamA:"Australia",     teamB:"Turcia",         flagA:"🇦🇺", flagB:"🇹🇷", time:"2026-06-12T22:00:00Z", venue:"Philadelphia"  },
  { id:21, group:"D", teamA:"SUA",           teamB:"Australia",      flagA:"🇺🇸", flagB:"🇦🇺", time:"2026-06-16T02:00:00Z", venue:"Kansas City"   },
  { id:22, group:"D", teamA:"Paraguay",      teamB:"Turcia",         flagA:"🇵🇾", flagB:"🇹🇷", time:"2026-06-17T00:00:00Z", venue:"New York"      },
  { id:23, group:"D", teamA:"SUA",           teamB:"Turcia",         flagA:"🇺🇸", flagB:"🇹🇷", time:"2026-06-20T23:00:00Z", venue:"Dallas"        },
  { id:24, group:"D", teamA:"Paraguay",      teamB:"Australia",      flagA:"🇵🇾", flagB:"🇦🇺", time:"2026-06-20T23:00:00Z", venue:"Atlanta"       },

  // ══ GRUPA E — Germany, Curacao, Ivory Coast, Ecuador ═════════════════════
  { id:25, group:"E", teamA:"Germania",      teamB:"Curacao",        flagA:"🇩🇪", flagB:"🇨🇼", time:"2026-06-14T02:00:00Z", venue:"Philadelphia"  },
  { id:26, group:"E", teamA:"Coasta de Fildea", teamB:"Ecuador",     flagA:"🇨🇮", flagB:"🇪🇨", time:"2026-06-13T19:00:00Z", venue:"Houston"       },
  { id:27, group:"E", teamA:"Germania",      teamB:"Coasta de Fildea", flagA:"🇩🇪", flagB:"🇨🇮", time:"2026-06-18T02:00:00Z", venue:"Kansas City"  },
  { id:28, group:"E", teamA:"Curacao",       teamB:"Ecuador",        flagA:"🇨🇼", flagB:"🇪🇨", time:"2026-06-17T22:00:00Z", venue:"San Francisco" },
  { id:29, group:"E", teamA:"Germania",      teamB:"Ecuador",        flagA:"🇩🇪", flagB:"🇪🇨", time:"2026-06-22T23:00:00Z", venue:"Dallas"        },
  { id:30, group:"E", teamA:"Coasta de Fildea", teamB:"Curacao",     flagA:"🇨🇮", flagB:"🇨🇼", time:"2026-06-22T23:00:00Z", venue:"Houston"       },

  // ══ GRUPA F — Netherlands, Japan, Sweden, Tunisia ═════════════════════════
  { id:31, group:"F", teamA:"Olanda",        teamB:"Japonia",        flagA:"🇳🇱", flagB:"🇯🇵", time:"2026-06-15T00:00:00Z", venue:"New York"      },
  { id:32, group:"F", teamA:"Suedia",        teamB:"Tunisia",        flagA:"🇸🇪", flagB:"🇹🇳", time:"2026-06-15T03:00:00Z", venue:"Los Angeles"   },
  { id:33, group:"F", teamA:"Olanda",        teamB:"Suedia",         flagA:"🇳🇱", flagB:"🇸🇪", time:"2026-06-19T02:00:00Z", venue:"Atlanta"       },
  { id:34, group:"F", teamA:"Japonia",       teamB:"Tunisia",        flagA:"🇯🇵", flagB:"🇹🇳", time:"2026-06-19T00:00:00Z", venue:"Boston"        },
  { id:35, group:"F", teamA:"Olanda",        teamB:"Tunisia",        flagA:"🇳🇱", flagB:"🇹🇳", time:"2026-06-23T23:00:00Z", venue:"New York"      },
  { id:36, group:"F", teamA:"Japonia",       teamB:"Suedia",         flagA:"🇯🇵", flagB:"🇸🇪", time:"2026-06-23T23:00:00Z", venue:"Seattle"       },

  // ══ GRUPA G — Belgium, Egypt, Iran, New Zealand ═══════════════════════════
  { id:37, group:"G", teamA:"Belgia",        teamB:"Egipt",          flagA:"🇧🇪", flagB:"🇪🇬", time:"2026-06-15T22:00:00Z", venue:"Los Angeles"   },
  { id:38, group:"G", teamA:"Iran",          teamB:"Noua Zeelanda",  flagA:"🇮🇷", flagB:"🇳🇿", time:"2026-06-15T19:00:00Z", venue:"Philadelphia"  },
  { id:39, group:"G", teamA:"Belgia",        teamB:"Iran",           flagA:"🇧🇪", flagB:"🇮🇷", time:"2026-06-19T22:00:00Z", venue:"San Francisco" },
  { id:40, group:"G", teamA:"Egipt",         teamB:"Noua Zeelanda",  flagA:"🇪🇬", flagB:"🇳🇿", time:"2026-06-19T19:00:00Z", venue:"Boston"        },
  { id:41, group:"G", teamA:"Belgia",        teamB:"Noua Zeelanda",  flagA:"🇧🇪", flagB:"🇳🇿", time:"2026-06-24T02:00:00Z", venue:"Los Angeles"   },
  { id:42, group:"G", teamA:"Egipt",         teamB:"Iran",           flagA:"🇪🇬", flagB:"🇮🇷", time:"2026-06-24T02:00:00Z", venue:"Kansas City"   },

  // ══ GRUPA H — Spain, Cape Verde, Saudi Arabia, Uruguay ═══════════════════
  { id:43, group:"H", teamA:"Spania",        teamB:"Cap Verde",      flagA:"🇪🇸", flagB:"🇨🇻", time:"2026-06-16T00:00:00Z", venue:"Atlanta"       },
  { id:44, group:"H", teamA:"Arabia Saudita", teamB:"Uruguay",       flagA:"🇸🇦", flagB:"🇺🇾", time:"2026-06-16T03:00:00Z", venue:"Miami"         },
  { id:45, group:"H", teamA:"Spania",        teamB:"Arabia Saudita", flagA:"🇪🇸", flagB:"🇸🇦", time:"2026-06-20T02:00:00Z", venue:"Dallas"        },
  { id:46, group:"H", teamA:"Uruguay",       teamB:"Cap Verde",      flagA:"🇺🇾", flagB:"🇨🇻", time:"2026-06-20T00:00:00Z", venue:"Miami"         },
  { id:47, group:"H", teamA:"Spania",        teamB:"Uruguay",        flagA:"🇪🇸", flagB:"🇺🇾", time:"2026-06-24T23:00:00Z", venue:"Los Angeles"   },
  { id:48, group:"H", teamA:"Cap Verde",     teamB:"Arabia Saudita", flagA:"🇨🇻", flagB:"🇸🇦", time:"2026-06-24T23:00:00Z", venue:"Seattle"       },

  // ══ GRUPA I — France, Senegal, Iraq, Norway ═══════════════════════════════
  { id:49, group:"I", teamA:"Franta",        teamB:"Senegal",        flagA:"🇫🇷", flagB:"🇸🇳", time:"2026-06-16T22:00:00Z", venue:"New York"      },
  { id:50, group:"I", teamA:"Norvegia",      teamB:"Irak",           flagA:"🇳🇴", flagB:"🇮🇶", time:"2026-06-17T01:00:00Z", venue:"Philadelphia"  },
  { id:51, group:"I", teamA:"Franta",        teamB:"Irak",           flagA:"🇫🇷", flagB:"🇮🇶", time:"2026-06-21T02:00:00Z", venue:"Kansas City"   },
  { id:52, group:"I", teamA:"Senegal",       teamB:"Norvegia",       flagA:"🇸🇳", flagB:"🇳🇴", time:"2026-06-20T22:00:00Z", venue:"New York"      },
  { id:53, group:"I", teamA:"Franta",        teamB:"Norvegia",       flagA:"🇫🇷", flagB:"🇳🇴", time:"2026-06-25T02:00:00Z", venue:"Boston"        },
  { id:54, group:"I", teamA:"Irak",          teamB:"Senegal",        flagA:"🇮🇶", flagB:"🇸🇳", time:"2026-06-25T02:00:00Z", venue:"New York"      },

  // ══ GRUPA J — Argentina, Algeria, Austria, Jordan ═════════════════════════
  { id:55, group:"J", teamA:"Argentina",     teamB:"Algeria",        flagA:"🇦🇷", flagB:"🇩🇿", time:"2026-06-17T02:00:00Z", venue:"Dallas"        },
  { id:56, group:"J", teamA:"Austria",       teamB:"Iordania",       flagA:"🇦🇹", flagB:"🇯🇴", time:"2026-06-17T05:00:00Z", venue:"San Francisco" },
  { id:57, group:"J", teamA:"Argentina",     teamB:"Austria",        flagA:"🇦🇷", flagB:"🇦🇹", time:"2026-06-21T22:00:00Z", venue:"Houston"       },
  { id:58, group:"J", teamA:"Algeria",       teamB:"Iordania",       flagA:"🇩🇿", flagB:"🇯🇴", time:"2026-06-21T19:00:00Z", venue:"Atlanta"       },
  { id:59, group:"J", teamA:"Argentina",     teamB:"Iordania",       flagA:"🇦🇷", flagB:"🇯🇴", time:"2026-06-25T23:00:00Z", venue:"Dallas"        },
  { id:60, group:"J", teamA:"Algeria",       teamB:"Austria",        flagA:"🇩🇿", flagB:"🇦🇹", time:"2026-06-25T23:00:00Z", venue:"Houston"       },

  // ══ GRUPA K — Portugal, DR Congo, Uzbekistan, Colombia ═══════════════════
  { id:61, group:"K", teamA:"Portugalia",    teamB:"Congo RD",       flagA:"🇵🇹", flagB:"🇨🇩", time:"2026-06-17T22:00:00Z", venue:"Boston"        },
  { id:62, group:"K", teamA:"Uzbekistan",    teamB:"Colombia",       flagA:"🇺🇿", flagB:"🇨🇴", time:"2026-06-17T19:00:00Z", venue:"Seattle"       },
  { id:63, group:"K", teamA:"Portugalia",    teamB:"Uzbekistan",     flagA:"🇵🇹", flagB:"🇺🇿", time:"2026-06-22T02:00:00Z", venue:"Miami"         },
  { id:64, group:"K", teamA:"Congo RD",      teamB:"Colombia",       flagA:"🇨🇩", flagB:"🇨🇴", time:"2026-06-21T23:00:00Z", venue:"Boston"        },
  { id:65, group:"K", teamA:"Portugalia",    teamB:"Colombia",       flagA:"🇵🇹", flagB:"🇨🇴", time:"2026-06-26T02:00:00Z", venue:"Boston"        },
  { id:66, group:"K", teamA:"Congo RD",      teamB:"Uzbekistan",     flagA:"🇨🇩", flagB:"🇺🇿", time:"2026-06-26T02:00:00Z", venue:"Seattle"       },

  // ══ GRUPA L — England, Croatia, Ghana, Panama ═════════════════════════════
  { id:67, group:"L", teamA:"Anglia",        teamB:"Croatia",        flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇭🇷", time:"2026-06-18T02:00:00Z", venue:"Dallas"        },
  { id:68, group:"L", teamA:"Ghana",         teamB:"Panama",         flagA:"🇬🇭", flagB:"🇵🇦", time:"2026-06-18T00:00:00Z", venue:"Philadelphia"  },
  { id:69, group:"L", teamA:"Anglia",        teamB:"Ghana",          flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇬🇭", time:"2026-06-22T22:00:00Z", venue:"Atlanta"       },
  { id:70, group:"L", teamA:"Croatia",       teamB:"Panama",         flagA:"🇭🇷", flagB:"🇵🇦", time:"2026-06-22T19:00:00Z", venue:"Kansas City"   },
  { id:71, group:"L", teamA:"Anglia",        teamB:"Panama",         flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇵🇦", time:"2026-06-26T23:00:00Z", venue:"Miami"         },
  { id:72, group:"L", teamA:"Croatia",       teamB:"Ghana",          flagA:"🇭🇷", flagB:"🇬🇭", time:"2026-06-26T23:00:00Z", venue:"New York"      },

];

export const ALL_GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export const getGroupLabel = (g) => {
  if (g === "I") return "GRUPA I — Grupa Mortii";
  return "GRUPA " + g;
};

// ─── TEST / AMICALE MATCHES ───────────────────────────────────────────────────
// Separate group "TEST" — used to verify scoring, lock logic, Firestore sync,
// and activity feed without touching the real World Cup data.
// Times are set close to "now" for easy manual testing:
//   T001 — already finished (verify scoring + standings)
//   T002 — locked (30m before kickoff) (verify lock UI)
//   T003 — open in ~2h   (verify countdown)
//   T004 — open in ~24h  (verify open state)
// These IDs use 9xx range so they never clash with real match IDs (1–72).
// ─────────────────────────────────────────────────────────────────────────────

// Helper: ISO string offset from now (minutes)
// ─── AMICALE / TEST MATCHES ───────────────────────────────────────────────────
// Meciuri amicale reale — ora României (EEST = UTC+3)
// IDs 901-910
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_MATCHES = [
  {
    id:     901,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Țările de Jos",  flagA: "🇳🇱",
    teamB:  "Uzbekistan",     flagB: "🇺🇿",
    time:   "2026-06-08T18:45:00.000Z", // 21:45 Romania (UTC+3)
    venue:  "Amical",
  },
  {
    id:     902,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Franța",         flagA: "🇫🇷",
    teamB:  "Irlanda de Nord",flagB: "🇬🇧",
    time:   "2026-06-08T19:10:00.000Z", // 22:10 Romania
    venue:  "Amical",
  },
  {
    id:     903,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Rusia",          flagA: "🇷🇺",
    teamB:  "Trinidad Tobago",flagB: "🇹🇹",
    time:   "2026-06-09T17:00:00.000Z", // 20:00 Romania
    venue:  "Amical",
  },
  {
    id:     904,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Ungaria",        flagA: "🇭🇺",
    teamB:  "Kazahstan",      flagB: "🇰🇿",
    time:   "2026-06-09T17:00:00.000Z", // 20:00 Romania
    venue:  "Amical",
  },
  {
    id:     905,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Azerbaidjan",    flagA: "🇦🇿",
    teamB:  "San Marino",     flagB: "🇸🇲",
    time:   "2026-06-09T18:00:00.000Z", // 21:00 Romania
    venue:  "Amical",
  },
  {
    id:     906,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Togo",           flagA: "🇹🇬",
    teamB:  "Benin",          flagB: "🇧🇯",
    time:   "2026-06-09T18:00:00.000Z", // 21:00 Romania
    venue:  "Amical",
  },
  {
    id:     907,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Argentina",      flagA: "🇦🇷",
    teamB:  "Islanda",        flagB: "🇮🇸",
    time:   "2026-06-10T01:00:00.000Z", // 04:00 Romania
    venue:  "Amical",
  },
  {
    id:     908,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Irak",           flagA: "🇮🇶",
    teamB:  "Venezuela",      flagB: "🇻🇪",
    time:   "2026-06-10T01:00:00.000Z", // 04:00 Romania
    venue:  "Amical",
  },
  {
    id:     909,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Portugalia",     flagA: "🇵🇹",
    teamB:  "Nigeria",        flagB: "🇳🇬",
    time:   "2026-06-10T19:45:00.000Z", // 22:45 Romania
    venue:  "Amical",
  },
  {
    id:     910,
    group:  "AMICALE",
    isTest: true,
    teamA:  "Anglia",         flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    teamB:  "Costa Rica",     flagB: "🇨🇷",
    time:   "2026-06-10T20:00:00.000Z", // 23:00 Romania
    venue:  "Amical",
  },
];
