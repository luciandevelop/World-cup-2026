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
  // RO times from official schedule image (EEST = UTC+3); stored as UTC
  { id:1,  group:"A", teamA:"Mexic",         teamB:"Africa de Sud",  flagA:"🇲🇽", flagB:"🇿🇦", time:"2026-06-11T19:00:00Z", venue:"Mexico City"   }, // RO 22:00
  { id:2,  group:"A", teamA:"Coreea de Sud", teamB:"Cehia",          flagA:"🇰🇷", flagB:"🇨🇿", time:"2026-06-12T02:00:00Z", venue:"Kansas City"   }, // RO 05:00
  { id:3,  group:"A", teamA:"Mexic",         teamB:"Coreea de Sud",  flagA:"🇲🇽", flagB:"🇰🇷", time:"2026-06-19T01:00:00Z", venue:"Guadalajara"   }, // RO 04:00
  { id:4,  group:"A", teamA:"Cehia",         teamB:"Africa de Sud",  flagA:"🇨🇿", flagB:"🇿🇦", time:"2026-06-18T16:00:00Z", venue:"Houston"       }, // RO 19:00
  { id:5,  group:"A", teamA:"Cehia",         teamB:"Mexic",          flagA:"🇨🇿", flagB:"🇲🇽", time:"2026-06-25T01:00:00Z", venue:"Los Angeles"   }, // RO 25 Jun 04:00
  { id:6,  group:"A", teamA:"Africa de Sud", teamB:"Coreea de Sud",  flagA:"🇿🇦", flagB:"🇰🇷", time:"2026-06-25T01:00:00Z", venue:"Dallas"        }, // RO 04:00

  // ══ GRUPA B — Canada, Bosnia & Herzegovina, Qatar, Switzerland ═══════════
  { id:7,  group:"B", teamA:"Canada",        teamB:"Bosnia",         flagA:"🇨🇦", flagB:"🇧🇦", time:"2026-06-12T19:00:00Z", venue:"Toronto"       }, // RO 22:00
  { id:8,  group:"B", teamA:"Qatar",         teamB:"Elvetia",        flagA:"🇶🇦", flagB:"🇨🇭", time:"2026-06-13T19:00:00Z", venue:"Seattle"       }, // RO 22:00
  { id:9,  group:"B", teamA:"Canada",        teamB:"Qatar",          flagA:"🇨🇦", flagB:"🇶🇦", time:"2026-06-18T22:00:00Z", venue:"Vancouver"     }, // RO 01:00 (19 Jun)
  { id:10, group:"B", teamA:"Elvetia",       teamB:"Bosnia",         flagA:"🇨🇭", flagB:"🇧🇦", time:"2026-06-18T19:00:00Z", venue:"Boston"        }, // RO 18 Jun 22:00
  { id:11, group:"B", teamA:"Elvetia",       teamB:"Canada",         flagA:"🇨🇭", flagB:"🇨🇦", time:"2026-06-24T19:00:00Z", venue:"Toronto"       }, // RO 24 Jun 22:00
  { id:12, group:"B", teamA:"Bosnia",        teamB:"Qatar",          flagA:"🇧🇦", flagB:"🇶🇦", time:"2026-06-24T19:00:00Z", venue:"Seattle"       }, // RO 22:00

  // ══ GRUPA C — Brazil, Morocco, Haiti, Scotland ════════════════════════════
  { id:13, group:"C", teamA:"Brazilia",      teamB:"Maroc",          flagA:"🇧🇷", flagB:"🇲🇦", time:"2026-06-13T22:00:00Z", venue:"New York"      }, // RO 14 Jun 01:00
  { id:14, group:"C", teamA:"Haiti",         teamB:"Scotia",         flagA:"🇭🇹", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-14T01:00:00Z", venue:"Philadelphia"  }, // RO 14 Jun 04:00
  { id:15, group:"C", teamA:"Scotia",        teamB:"Maroc",          flagA:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", flagB:"🇲🇦", time:"2026-06-19T22:00:00Z", venue:"Miami"         }, // RO 20 Jun 01:00
  { id:16, group:"C", teamA:"Brazilia",      teamB:"Haiti",          flagA:"🇧🇷", flagB:"🇭🇹", time:"2026-06-20T00:30:00Z", venue:"Atlanta"       }, // RO 20 Jun 03:30
  { id:17, group:"C", teamA:"Maroc",         teamB:"Haiti",          flagA:"🇲🇦", flagB:"🇭🇹", time:"2026-06-24T22:00:00Z", venue:"Miami"         }, // RO 25 Jun 01:00
  { id:18, group:"C", teamA:"Scotia",        teamB:"Brazilia",       flagA:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", flagB:"🇧🇷", time:"2026-06-24T22:00:00Z", venue:"New York"      }, // RO 25 Jun 01:00

  // ══ GRUPA D — USA, Paraguay, Australia, Turkey ════════════════════════════
  { id:19, group:"D", teamA:"SUA",           teamB:"Paraguay",       flagA:"🇺🇸", flagB:"🇵🇾", time:"2026-06-13T01:00:00Z", venue:"Los Angeles"   }, // RO 13 Jun 04:00
  { id:20, group:"D", teamA:"Australia",     teamB:"Turcia",         flagA:"🇦🇺", flagB:"🇹🇷", time:"2026-06-14T04:00:00Z", venue:"Philadelphia"  }, // RO 14 Jun 07:00
  { id:21, group:"D", teamA:"SUA",           teamB:"Australia",      flagA:"🇺🇸", flagB:"🇦🇺", time:"2026-06-19T19:00:00Z", venue:"Kansas City"   }, // RO 19 Jun 22:00
  { id:22, group:"D", teamA:"Turcia",        teamB:"Paraguay",       flagA:"🇹🇷", flagB:"🇵🇾", time:"2026-06-20T03:00:00Z", venue:"New York"      }, // RO 20 Jun 06:00
  { id:23, group:"D", teamA:"Turcia",        teamB:"SUA",            flagA:"🇹🇷", flagB:"🇺🇸", time:"2026-06-26T02:00:00Z", venue:"Dallas"        }, // RO 26 Jun 05:00
  { id:24, group:"D", teamA:"Paraguay",      teamB:"Australia",      flagA:"🇵🇾", flagB:"🇦🇺", time:"2026-06-26T02:00:00Z", venue:"Atlanta"       }, // RO 26 Jun 05:00

  // ══ GRUPA E — Germany, Curacao, Ivory Coast, Ecuador ═════════════════════
  { id:25, group:"E", teamA:"Germania",      teamB:"Curacao",        flagA:"🇩🇪", flagB:"🇨🇼", time:"2026-06-14T17:00:00Z", venue:"Philadelphia"  }, // RO 14 Jun 20:00
  { id:26, group:"E", teamA:"Coasta de Fildes", teamB:"Ecuador",     flagA:"🇨🇮", flagB:"🇪🇨", time:"2026-06-14T23:00:00Z", venue:"Houston"       }, // RO 15 Jun 02:00
  { id:27, group:"E", teamA:"Germania",      teamB:"Coasta de Fildes", flagA:"🇩🇪", flagB:"🇨🇮", time:"2026-06-20T20:00:00Z", venue:"Kansas City"  }, // RO 20 Jun 23:00
  { id:28, group:"E", teamA:"Ecuador",       teamB:"Curacao",        flagA:"🇪🇨", flagB:"🇨🇼", time:"2026-06-21T00:00:00Z", venue:"San Francisco" }, // RO 21 Jun 03:00
  { id:29, group:"E", teamA:"Ecuador",       teamB:"Germania",       flagA:"🇪🇨", flagB:"🇩🇪", time:"2026-06-25T20:00:00Z", venue:"Dallas"        }, // RO 25 Jun 23:00
  { id:30, group:"E", teamA:"Curacao",       teamB:"Coasta de Fildes", flagA:"🇨🇼", flagB:"🇨🇮", time:"2026-06-25T20:00:00Z", venue:"Houston"       }, // RO 25 Jun 23:00

  // ══ GRUPA F — Netherlands, Japan, Sweden, Tunisia ═════════════════════════
  { id:31, group:"F", teamA:"Olanda",        teamB:"Japonia",        flagA:"🇳🇱", flagB:"🇯🇵", time:"2026-06-14T20:00:00Z", venue:"New York"      }, // RO 14 Jun 23:00
  { id:32, group:"F", teamA:"Suedia",        teamB:"Tunisia",        flagA:"🇸🇪", flagB:"🇹🇳", time:"2026-06-15T02:00:00Z", venue:"Los Angeles"   }, // RO 15 Jun 05:00
  { id:33, group:"F", teamA:"Olanda",        teamB:"Suedia",         flagA:"🇳🇱", flagB:"🇸🇪", time:"2026-06-20T17:00:00Z", venue:"Atlanta"       }, // RO 20 Jun 20:00
  { id:34, group:"F", teamA:"Tunisia",       teamB:"Japonia",        flagA:"🇹🇳", flagB:"🇯🇵", time:"2026-06-21T04:00:00Z", venue:"Boston"        }, // RO 21 Jun 07:00
  { id:35, group:"F", teamA:"Japonia",       teamB:"Suedia",         flagA:"🇯🇵", flagB:"🇸🇪", time:"2026-06-25T23:00:00Z", venue:"New York"      }, // RO 26 Jun 02:00
  { id:36, group:"F", teamA:"Tunisia",       teamB:"Olanda",         flagA:"🇹🇳", flagB:"🇳🇱", time:"2026-06-25T23:00:00Z", venue:"Seattle"       }, // RO 26 Jun 02:00

  // ══ GRUPA G — Belgium, Egypt, Iran, New Zealand ═══════════════════════════
  { id:37, group:"G", teamA:"Belgia",        teamB:"Egipt",          flagA:"🇧🇪", flagB:"🇪🇬", time:"2026-06-15T19:00:00Z", venue:"Los Angeles"   }, // RO 15 Jun 22:00
  { id:38, group:"G", teamA:"Iran",          teamB:"Noua Zeelanda",  flagA:"🇮🇷", flagB:"🇳🇿", time:"2026-06-16T01:00:00Z", venue:"Philadelphia"  }, // RO 16 Jun 04:00
  { id:39, group:"G", teamA:"Belgia",        teamB:"Iran",           flagA:"🇧🇪", flagB:"🇮🇷", time:"2026-06-21T19:00:00Z", venue:"San Francisco" }, // RO 21 Jun 22:00
  { id:40, group:"G", teamA:"Noua Zeelanda", teamB:"Egipt",          flagA:"🇳🇿", flagB:"🇪🇬", time:"2026-06-22T01:00:00Z", venue:"Boston"        }, // RO 22 Jun 04:00
  { id:41, group:"G", teamA:"Noua Zeelanda", teamB:"Belgia",         flagA:"🇳🇿", flagB:"🇧🇪", time:"2026-06-27T03:00:00Z", venue:"Los Angeles"   }, // RO 27 Jun 06:00
  { id:42, group:"G", teamA:"Egipt",         teamB:"Iran",           flagA:"🇪🇬", flagB:"🇮🇷", time:"2026-06-27T03:00:00Z", venue:"Kansas City"   }, // RO 27 Jun 06:00

  // ══ GRUPA H — Spain, Cape Verde, Saudi Arabia, Uruguay ═══════════════════
  { id:43, group:"H", teamA:"Spania",        teamB:"Capul Verde",    flagA:"🇪🇸", flagB:"🇨🇻", time:"2026-06-15T16:00:00Z", venue:"Atlanta"       }, // RO 15 Jun 19:00
  { id:44, group:"H", teamA:"Arabia Saudita", teamB:"Uruguay",       flagA:"🇸🇦", flagB:"🇺🇾", time:"2026-06-15T22:00:00Z", venue:"Miami"         }, // RO 16 Jun 01:00
  { id:45, group:"H", teamA:"Spania",        teamB:"Arabia Saudita", flagA:"🇪🇸", flagB:"🇸🇦", time:"2026-06-21T16:00:00Z", venue:"Dallas"        }, // RO 21 Jun 19:00
  { id:46, group:"H", teamA:"Uruguay",       teamB:"Capul Verde",    flagA:"🇺🇾", flagB:"🇨🇻", time:"2026-06-21T22:00:00Z", venue:"Miami"         }, // RO 22 Jun 01:00
  { id:47, group:"H", teamA:"Uruguay",       teamB:"Spania",         flagA:"🇺🇾", flagB:"🇪🇸", time:"2026-06-27T00:00:00Z", venue:"Los Angeles"   }, // RO 27 Jun 03:00
  { id:48, group:"H", teamA:"Capul Verde",   teamB:"Arabia Saudita", flagA:"🇨🇻", flagB:"🇸🇦", time:"2026-06-27T00:00:00Z", venue:"Seattle"       }, // RO 27 Jun 03:00

  // ══ GRUPA I — France, Senegal, Iraq, Norway ═══════════════════════════════
  { id:49, group:"I", teamA:"Franta",        teamB:"Senegal",        flagA:"🇫🇷", flagB:"🇸🇳", time:"2026-06-16T19:00:00Z", venue:"New York"      }, // RO 16 Jun 22:00
  { id:50, group:"I", teamA:"Irak",          teamB:"Norvegia",       flagA:"🇮🇶", flagB:"🇳🇴", time:"2026-06-16T22:00:00Z", venue:"Philadelphia"  }, // RO 17 Jun 01:00
  { id:51, group:"I", teamA:"Franta",        teamB:"Irak",           flagA:"🇫🇷", flagB:"🇮🇶", time:"2026-06-22T21:00:00Z", venue:"Kansas City"   }, // RO 23 Jun 00:00
  { id:52, group:"I", teamA:"Norvegia",      teamB:"Senegal",        flagA:"🇳🇴", flagB:"🇸🇳", time:"2026-06-23T00:00:00Z", venue:"New York"      }, // RO 23 Jun 03:00
  { id:53, group:"I", teamA:"Norvegia",      teamB:"Franta",         flagA:"🇳🇴", flagB:"🇫🇷", time:"2026-06-26T19:00:00Z", venue:"Boston"        }, // RO 26 Jun 22:00
  { id:54, group:"I", teamA:"Senegal",       teamB:"Irak",           flagA:"🇸🇳", flagB:"🇮🇶", time:"2026-06-26T19:00:00Z", venue:"New York"      }, // RO 26 Jun 22:00

  // ══ GRUPA J — Argentina, Algeria, Austria, Jordan ═════════════════════════
  { id:55, group:"J", teamA:"Argentina",     teamB:"Algeria",        flagA:"🇦🇷", flagB:"🇩🇿", time:"2026-06-17T01:00:00Z", venue:"Dallas"        }, // RO 17 Jun 04:00
  { id:56, group:"J", teamA:"Austria",       teamB:"Iordania",       flagA:"🇦🇹", flagB:"🇯🇴", time:"2026-06-17T04:00:00Z", venue:"San Francisco" }, // RO 17 Jun 07:00
  { id:57, group:"J", teamA:"Argentina",     teamB:"Austria",        flagA:"🇦🇷", flagB:"🇦🇹", time:"2026-06-22T17:00:00Z", venue:"Houston"       }, // RO 22 Jun 20:00
  { id:58, group:"J", teamA:"Iordania",      teamB:"Algeria",        flagA:"🇯🇴", flagB:"🇩🇿", time:"2026-06-23T03:00:00Z", venue:"Atlanta"       }, // RO 23 Jun 06:00
  { id:59, group:"J", teamA:"Iordania",     teamB:"Argentina",      flagA:"🇯🇴", flagB:"🇦🇷", time:"2026-06-28T02:00:00Z", venue:"Dallas"        }, // RO 28 Jun 05:00
  { id:60, group:"J", teamA:"Algeria",       teamB:"Austria",        flagA:"🇩🇿", flagB:"🇦🇹", time:"2026-06-28T02:00:00Z", venue:"Houston"       }, // RO 28 Jun 05:00

  // ══ GRUPA K — Portugal, DR Congo, Uzbekistan, Colombia ═══════════════════
  { id:61, group:"K", teamA:"Portugalia",    teamB:"RD Congo",       flagA:"🇵🇹", flagB:"🇨🇩", time:"2026-06-17T17:00:00Z", venue:"Boston"        }, // RO 17 Jun 20:00
  { id:62, group:"K", teamA:"Uzbekistan",    teamB:"Columbia",       flagA:"🇺🇿", flagB:"🇨🇴", time:"2026-06-18T02:00:00Z", venue:"Seattle"       }, // RO 18 Jun 05:00
  { id:63, group:"K", teamA:"Portugalia",    teamB:"Uzbekistan",     flagA:"🇵🇹", flagB:"🇺🇿", time:"2026-06-23T17:00:00Z", venue:"Miami"         }, // RO 23 Jun 20:00
  { id:64, group:"K", teamA:"Columbia",      teamB:"RD Congo",       flagA:"🇨🇴", flagB:"🇨🇩", time:"2026-06-24T02:00:00Z", venue:"Boston"        }, // RO 24 Jun 05:00
  { id:65, group:"K", teamA:"Columbia",      teamB:"Portugalia",     flagA:"🇨🇴", flagB:"🇵🇹", time:"2026-06-27T23:30:00Z", venue:"Boston"        }, // RO 28 Jun 02:30
  { id:66, group:"K", teamA:"RD Congo",      teamB:"Uzbekistan",     flagA:"🇨🇩", flagB:"🇺🇿", time:"2026-06-27T23:30:00Z", venue:"Seattle"       }, // RO 28 Jun 02:30

  // ══ GRUPA L — England, Croatia, Ghana, Panama ═════════════════════════════
  { id:67, group:"L", teamA:"Anglia",        teamB:"Croatia",        flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇭🇷", time:"2026-06-17T20:00:00Z", venue:"Dallas"        }, // RO 17 Jun 23:00
  { id:68, group:"L", teamA:"Ghana",         teamB:"Panama",         flagA:"🇬🇭", flagB:"🇵🇦", time:"2026-06-17T23:00:00Z", venue:"Philadelphia"  }, // RO 18 Jun 02:00
  { id:69, group:"L", teamA:"Anglia",        teamB:"Ghana",          flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇬🇭", time:"2026-06-23T20:00:00Z", venue:"Atlanta"       }, // RO 23 Jun 23:00
  { id:70, group:"L", teamA:"Panama",        teamB:"Croatia",        flagA:"🇵🇦", flagB:"🇭🇷", time:"2026-06-23T23:00:00Z", venue:"Kansas City"   }, // RO 24 Jun 02:00
  { id:71, group:"L", teamA:"Panama",        teamB:"Anglia",         flagA:"🇵🇦", flagB:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", time:"2026-06-27T21:00:00Z", venue:"Miami"         }, // RO 28 Jun 00:00
  { id:72, group:"L", teamA:"Croatia",       teamB:"Ghana",          flagA:"🇭🇷", flagB:"🇬🇭", time:"2026-06-27T21:00:00Z", venue:"New York"      }, // RO 28 Jun 00:00

  // ══ FAZA ELIMINATORIE — Șaisprezecimi (Round of 32) ════════════════════════
  { id:73, group:"KO", stage:"R32", teamA:"Africa de Sud", teamB:"Canada", flagA:"🇿🇦", flagB:"🇨🇦", time:"2026-06-28T19:00:00Z", venue:"Los Angeles" }, // RO 28 Jun 22:00
  { id:74, group:"KO", stage:"R32", teamA:"Brazilia", teamB:"Japonia", flagA:"🇧🇷", flagB:"🇯🇵", time:"2026-06-29T17:00:00Z", venue:"Houston" }, // RO 29 Jun 20:00
  { id:75, group:"KO", stage:"R32", teamA:"Germania", teamB:"Paraguay", flagA:"🇩🇪", flagB:"🇵🇾", time:"2026-06-29T20:30:00Z", venue:"Boston" }, // RO 29 Jun 23:30
  { id:76, group:"KO", stage:"R32", teamA:"Olanda", teamB:"Maroc", flagA:"🇳🇱", flagB:"🇲🇦", time:"2026-06-30T01:00:00Z", venue:"Monterrey" }, // RO 30 Jun 04:00
  { id:77, group:"KO", stage:"R32", teamA:"Coasta de Fildes", teamB:"Norvegia", flagA:"🇨🇮", flagB:"🇳🇴", time:"2026-06-30T17:00:00Z", venue:"Dallas" }, // RO 30 Jun 20:00
  { id:78, group:"KO", stage:"R32", teamA:"Anglia", teamB:"RD Congo", flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇨🇩", time:"2026-07-01T16:00:00Z", venue:"Atlanta" }, // RO 01 Jul 19:00
  { id:79, group:"KO", stage:"R32", teamA:"Mexic", teamB:"Ecuador", flagA:"🇲🇽", flagB:"🇪🇨", time:"2026-07-01T01:00:00Z", venue:"Mexico City" }, // RO 01 Jul 04:00
  { id:80, group:"KO", stage:"R32", teamA:"Franta", teamB:"Suedia", flagA:"🇫🇷", flagB:"🇸🇪", time:"2026-06-30T21:00:00Z", venue:"New York" }, // RO 01 Jul 00:00
  { id:81, group:"KO", stage:"R32", teamA:"Belgia", teamB:"Senegal", flagA:"🇧🇪", flagB:"🇸🇳", time:"2026-07-01T20:00:00Z", venue:"Seattle" }, // RO 01 Jul 23:00
  { id:82, group:"KO", stage:"R32", teamA:"SUA", teamB:"Bosnia", flagA:"🇺🇸", flagB:"🇧🇦", time:"2026-07-02T00:00:00Z", venue:"Santa Clara" }, // RO 02 Jul 03:00
  { id:83, group:"KO", stage:"R32", teamA:"Spania", teamB:"Austria", flagA:"🇪🇸", flagB:"🇦🇹", time:"2026-07-02T19:00:00Z", venue:"Los Angeles" }, // RO 02 Jul 22:00
  { id:84, group:"KO", stage:"R32", teamA:"Portugalia", teamB:"Croatia", flagA:"🇵🇹", flagB:"🇭🇷", time:"2026-07-02T23:00:00Z", venue:"Toronto" }, // RO 03 Jul 02:00
  { id:85, group:"KO", stage:"R32", teamA:"Elvetia", teamB:"Algeria", flagA:"🇨🇭", flagB:"🇩🇿", time:"2026-07-03T03:00:00Z", venue:"Vancouver" }, // RO 03 Jul 06:00
  { id:86, group:"KO", stage:"R32", teamA:"Australia", teamB:"Egipt", flagA:"🇦🇺", flagB:"🇪🇬", time:"2026-07-03T18:00:00Z", venue:"Dallas" }, // RO 03 Jul 21:00
  { id:87, group:"KO", stage:"R32", teamA:"Argentina", teamB:"Capul Verde", flagA:"🇦🇷", flagB:"🇨🇻", time:"2026-07-03T22:00:00Z", venue:"Miami" }, // RO 04 Jul 01:00
  { id:88, group:"KO", stage:"R32", teamA:"Columbia", teamB:"Ghana", flagA:"🇨🇴", flagB:"🇬🇭", time:"2026-07-04T01:30:00Z", venue:"Kansas City" }, // RO 04 Jul 04:30

  // ══ FAZA ELIMINATORIE — Optimi (Round of 16) ════════════════════════════════
  // ID-uri 89-96, mapare exactă din BracketScreen.jsx R16_SLOTS
  { id:89, group:"KO", stage:"R16", teamA:"Canada", teamB:"Maroc", flagA:"🇨🇦", flagB:"🇲🇦", time:"2026-07-04T17:00:00Z", venue:"Houston" }, // RO 04 Jul 20:00 — din M73+M76
  { id:90, group:"KO", stage:"R16", teamA:"Brazilia", teamB:"Norvegia", flagA:"🇧🇷", flagB:"🇳🇴", time:"2026-07-05T20:00:00Z", venue:"New York" }, // RO 05 Jul 23:00 — din M74+M77
  { id:91, group:"KO", stage:"R16", teamA:"Paraguay", teamB:"Franta", flagA:"🇵🇾", flagB:"🇫🇷", time:"2026-07-04T21:00:00Z", venue:"Philadelphia" }, // RO 05 Jul 00:00 — din M75+M80

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
