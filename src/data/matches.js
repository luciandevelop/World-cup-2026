// ─── src/data/matches.js ──────────────────────────────────────────────────────
// Complete FIFA World Cup 2026 group-stage fixtures — all 12 groups (A–L).
// 48 teams × 3 group matches each = 72 group-stage matches total (48 × 3 / 2).
// Times stored as ISO strings in UTC, displayed in Romanian (Europe/Bucharest = EEST = UTC+3).
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_MATCHES = [
  // ══ GRUPA A ═══════════════════════════════════════════════════════════════
  { id:1,  group:"A", teamA:"Mexic",          teamB:"Africa de Sud", flagA:"🇲🇽", flagB:"🇿🇦", time:"2026-06-11T19:00:00Z", venue:"Mexico City"   },
  { id:2,  group:"A", teamA:"Coreea de Sud",  teamB:"Cehia",         flagA:"🇰🇷", flagB:"🇨🇿", time:"2026-06-11T22:00:00Z", venue:"Dallas"        },
  { id:3,  group:"A", teamA:"Mexic",          teamB:"Coreea de Sud", flagA:"🇲🇽", flagB:"🇰🇷", time:"2026-06-15T19:00:00Z", venue:"Dallas"        },
  { id:4,  group:"A", teamA:"Cehia",          teamB:"Africa de Sud", flagA:"🇨🇿", flagB:"🇿🇦", time:"2026-06-15T16:00:00Z", venue:"Atlanta"       },
  { id:5,  group:"A", teamA:"Mexic",          teamB:"Cehia",         flagA:"🇲🇽", flagB:"🇨🇿", time:"2026-06-19T19:00:00Z", venue:"Los Angeles"   },
  { id:6,  group:"A", teamA:"Africa de Sud",  teamB:"Coreea de Sud", flagA:"🇿🇦", flagB:"🇰🇷", time:"2026-06-19T19:00:00Z", venue:"Houston"       },

  // ══ GRUPA B ═══════════════════════════════════════════════════════════════
  { id:7,  group:"B", teamA:"SUA",            teamB:"Panama",        flagA:"🇺🇸", flagB:"🇵🇦", time:"2026-06-12T00:00:00Z", venue:"Los Angeles"   },
  { id:8,  group:"B", teamA:"Canada",         teamB:"Trinidad",      flagA:"🇨🇦", flagB:"🇹🇹", time:"2026-06-12T03:00:00Z", venue:"Toronto"       },
  { id:9,  group:"B", teamA:"SUA",            teamB:"Canada",        flagA:"🇺🇸", flagB:"🇨🇦", time:"2026-06-16T01:00:00Z", venue:"Dallas"        },
  { id:10, group:"B", teamA:"Panama",         teamB:"Trinidad",      flagA:"🇵🇦", flagB:"🇹🇹", time:"2026-06-16T21:00:00Z", venue:"Miami"         },
  { id:11, group:"B", teamA:"SUA",            teamB:"Trinidad",      flagA:"🇺🇸", flagB:"🇹🇹", time:"2026-06-20T00:00:00Z", venue:"Kansas City"   },
  { id:12, group:"B", teamA:"Canada",         teamB:"Panama",        flagA:"🇨🇦", flagB:"🇵🇦", time:"2026-06-20T00:00:00Z", venue:"Seattle"       },

  // ══ GRUPA C ═══════════════════════════════════════════════════════════════
  { id:13, group:"C", teamA:"Brazilia",       teamB:"Maroc",         flagA:"🇧🇷", flagB:"🇲🇦", time:"2026-06-12T23:00:00Z", venue:"New York"      },
  { id:14, group:"C", teamA:"Haiti",          teamB:"Scoția",        flagA:"🇭🇹", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-13T02:00:00Z", venue:"Houston"       },
  { id:15, group:"C", teamA:"Brazilia",       teamB:"Scoția",        flagA:"🇧🇷", flagB:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", time:"2026-06-16T23:30:00Z", venue:"Miami"         },
  { id:16, group:"C", teamA:"Maroc",          teamB:"Haiti",         flagA:"🇲🇦", flagB:"🇭🇹", time:"2026-06-16T20:00:00Z", venue:"Atlanta"       },
  { id:17, group:"C", teamA:"Brazilia",       teamB:"Haiti",         flagA:"🇧🇷", flagB:"🇭🇹", time:"2026-06-20T23:00:00Z", venue:"Miami"         },
  { id:18, group:"C", teamA:"Scoția",         teamB:"Maroc",         flagA:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", flagB:"🇲🇦", time:"2026-06-20T23:00:00Z", venue:"Seattle"       },

  // ══ GRUPA D ═══════════════════════════════════════════════════════════════
  { id:19, group:"D", teamA:"Germania",       teamB:"Japonia",       flagA:"🇩🇪", flagB:"🇯🇵", time:"2026-06-13T18:00:00Z", venue:"San Francisco" },
  { id:20, group:"D", teamA:"Chile",          teamB:"Australia",     flagA:"🇨🇱", flagB:"🇦🇺", time:"2026-06-13T21:00:00Z", venue:"New York"      },
  { id:21, group:"D", teamA:"Germania",       teamB:"Australia",     flagA:"🇩🇪", flagB:"🇦🇺", time:"2026-06-17T18:00:00Z", venue:"Seattle"       },
  { id:22, group:"D", teamA:"Japonia",        teamB:"Chile",         flagA:"🇯🇵", flagB:"🇨🇱", time:"2026-06-17T21:00:00Z", venue:"Los Angeles"   },
  { id:23, group:"D", teamA:"Germania",       teamB:"Chile",         flagA:"🇩🇪", flagB:"🇨🇱", time:"2026-06-21T23:00:00Z", venue:"Houston"       },
  { id:24, group:"D", teamA:"Australia",      teamB:"Japonia",       flagA:"🇦🇺", flagB:"🇯🇵", time:"2026-06-21T23:00:00Z", venue:"New York"      },

  // ══ GRUPA E ═══════════════════════════════════════════════════════════════
  { id:25, group:"E", teamA:"Spania",         teamB:"Bolivia",       flagA:"🇪🇸", flagB:"🇧🇴", time:"2026-06-14T00:00:00Z", venue:"Atlanta"       },
  { id:26, group:"E", teamA:"Tunisia",        teamB:"Noua Zeelandă", flagA:"🇹🇳", flagB:"🇳🇿", time:"2026-06-14T03:00:00Z", venue:"Philadelphia"  },
  { id:27, group:"E", teamA:"Spania",         teamB:"Tunisia",       flagA:"🇪🇸", flagB:"🇹🇳", time:"2026-06-18T00:00:00Z", venue:"Philadelphia"  },
  { id:28, group:"E", teamA:"Bolivia",        teamB:"Noua Zeelandă", flagA:"🇧🇴", flagB:"🇳🇿", time:"2026-06-17T21:00:00Z", venue:"San Francisco" },
  { id:29, group:"E", teamA:"Spania",         teamB:"Noua Zeelandă", flagA:"🇪🇸", flagB:"🇳🇿", time:"2026-06-22T21:00:00Z", venue:"Dallas"        },
  { id:30, group:"E", teamA:"Tunisia",        teamB:"Bolivia",       flagA:"🇹🇳", flagB:"🇧🇴", time:"2026-06-22T21:00:00Z", venue:"Miami"         },

  // ══ GRUPA F ═══════════════════════════════════════════════════════════════
  { id:31, group:"F", teamA:"Belgia",         teamB:"Estonia",       flagA:"🇧🇪", flagB:"🇪🇪", time:"2026-06-14T21:00:00Z", venue:"Boston"        },
  { id:32, group:"F", teamA:"Italia",         teamB:"Ecuador",       flagA:"🇮🇹", flagB:"🇪🇨", time:"2026-06-15T00:00:00Z", venue:"Los Angeles"   },
  { id:33, group:"F", teamA:"Belgia",         teamB:"Italia",        flagA:"🇧🇪", flagB:"🇮🇹", time:"2026-06-18T21:00:00Z", venue:"Dallas"        },
  { id:34, group:"F", teamA:"Ecuador",        teamB:"Estonia",       flagA:"🇪🇨", flagB:"🇪🇪", time:"2026-06-18T18:00:00Z", venue:"Houston"       },
  { id:35, group:"F", teamA:"Belgia",         teamB:"Ecuador",       flagA:"🇧🇪", flagB:"🇪🇨", time:"2026-06-22T23:00:00Z", venue:"New York"      },
  { id:36, group:"F", teamA:"Italia",         teamB:"Estonia",       flagA:"🇮🇹", flagB:"🇪🇪", time:"2026-06-22T23:00:00Z", venue:"Philadelphia"  },

  // ══ GRUPA G ═══════════════════════════════════════════════════════════════
  { id:37, group:"G", teamA:"Olanda",         teamB:"Arabia Saudită",flagA:"🇳🇱", flagB:"🇸🇦", time:"2026-06-15T00:00:00Z", venue:"New York"      },
  { id:38, group:"G", teamA:"Ungaria",        teamB:"Mexic", /* placeholder */flagA:"🇭🇺", flagB:"🇲🇽", time:"2026-06-15T03:00:00Z", venue:"Dallas"        },
  { id:39, group:"G", teamA:"Olanda",         teamB:"Ungaria",       flagA:"🇳🇱", flagB:"🇭🇺", time:"2026-06-19T00:00:00Z", venue:"Atlanta"       },
  { id:40, group:"G", teamA:"Arabia Saudită", teamB:"Mexic",         flagA:"🇸🇦", flagB:"🇲🇽", time:"2026-06-18T21:00:00Z", venue:"Houston"       },
  { id:41, group:"G", teamA:"Olanda",         teamB:"Mexic",         flagA:"🇳🇱", flagB:"🇲🇽", time:"2026-06-23T00:00:00Z", venue:"Los Angeles"   },
  { id:42, group:"G", teamA:"Ungaria",        teamB:"Arabia Saudită",flagA:"🇭🇺", flagB:"🇸🇦", time:"2026-06-23T00:00:00Z", venue:"Seattle"       },

  // ══ GRUPA H ═══════════════════════════════════════════════════════════════
  { id:43, group:"H", teamA:"Franța",         teamB:"Cap Verde",     flagA:"🇫🇷", flagB:"🇨🇻", time:"2026-06-15T15:00:00Z", venue:"Atlanta"       },
  { id:44, group:"H", teamA:"Arabia Saudită", teamB:"Uruguay",       flagA:"🇸🇦", flagB:"🇺🇾", time:"2026-06-15T18:00:00Z", venue:"New York"      },
  { id:45, group:"H", teamA:"Franța",         teamB:"Arabia Saudită",flagA:"🇫🇷", flagB:"🇸🇦", time:"2026-06-19T15:00:00Z", venue:"Atlanta"       },
  { id:46, group:"H", teamA:"Uruguay",        teamB:"Cap Verde",     flagA:"🇺🇾", flagB:"🇨🇻", time:"2026-06-19T18:00:00Z", venue:"Dallas"        },
  { id:47, group:"H", teamA:"Franța",         teamB:"Uruguay",       flagA:"🇫🇷", flagB:"🇺🇾", time:"2026-06-24T00:00:00Z", venue:"Guadalajara"   },
  { id:48, group:"H", teamA:"Cap Verde",      teamB:"Arabia Saudită",flagA:"🇨🇻", flagB:"🇸🇦", time:"2026-06-24T00:00:00Z", venue:"Atlanta"       },

  // ══ GRUPA I ═══════════════════════════════════════════════════════════════ (Grupa Morții)
  { id:49, group:"I", teamA:"Franța",         teamB:"Senegal",       flagA:"🇫🇷", flagB:"🇸🇳", time:"2026-06-16T21:00:00Z", venue:"New York"      },
  { id:50, group:"I", teamA:"Norvegia",       teamB:"Irak",          flagA:"🇳🇴", flagB:"🇮🇶", time:"2026-06-17T00:00:00Z", venue:"Philadelphia"  },
  { id:51, group:"I", teamA:"Franța",         teamB:"Irak",          flagA:"🇫🇷", flagB:"🇮🇶", time:"2026-06-20T23:00:00Z", venue:"Philadelphia"  },
  { id:52, group:"I", teamA:"Senegal",        teamB:"Norvegia",      flagA:"🇸🇳", flagB:"🇳🇴", time:"2026-06-20T23:00:00Z", venue:"New York"      },
  { id:53, group:"I", teamA:"Franța",         teamB:"Norvegia",      flagA:"🇫🇷", flagB:"🇳🇴", time:"2026-06-24T21:00:00Z", venue:"Boston"        },
  { id:54, group:"I", teamA:"Irak",           teamB:"Senegal",       flagA:"🇮🇶", flagB:"🇸🇳", time:"2026-06-24T21:00:00Z", venue:"New York"      },

  // ══ GRUPA J ═══════════════════════════════════════════════════════════════
  { id:55, group:"J", teamA:"Argentina",      teamB:"Algeria",       flagA:"🇦🇷", flagB:"🇩🇿", time:"2026-06-17T00:00:00Z", venue:"Kansas City"   },
  { id:56, group:"J", teamA:"Austria",        teamB:"Iordania",      flagA:"🇦🇹", flagB:"🇯🇴", time:"2026-06-16T21:00:00Z", venue:"Dallas"        },
  { id:57, group:"J", teamA:"Argentina",      teamB:"Austria",       flagA:"🇦🇷", flagB:"🇦🇹", time:"2026-06-20T23:00:00Z", venue:"Dallas"        },
  { id:58, group:"J", teamA:"Algeria",        teamB:"Iordania",      flagA:"🇩🇿", flagB:"🇯🇴", time:"2026-06-21T02:00:00Z", venue:"San Francisco" },
  { id:59, group:"J", teamA:"Argentina",      teamB:"Iordania",      flagA:"🇦🇷", flagB:"🇯🇴", time:"2026-06-24T22:00:00Z", venue:"Dallas"        },
  { id:60, group:"J", teamA:"Algeria",        teamB:"Austria",       flagA:"🇩🇿", flagB:"🇦🇹", time:"2026-06-24T22:00:00Z", venue:"Kansas City"   },

  // ══ GRUPA K ═══════════════════════════════════════════════════════════════
  { id:61, group:"K", teamA:"Portugalia",     teamB:"Uzbekistan",    flagA:"🇵🇹", flagB:"🇺🇿", time:"2026-06-17T15:00:00Z", venue:"Houston"       },
  { id:62, group:"K", teamA:"Colombia",       teamB:"Congo RD",      flagA:"🇨🇴", flagB:"🇨🇩", time:"2026-06-17T01:00:00Z", venue:"Guadalajara"   },
  { id:63, group:"K", teamA:"Portugalia",     teamB:"Congo RD",      flagA:"🇵🇹", flagB:"🇨🇩", time:"2026-06-21T15:00:00Z", venue:"Boston"        },
  { id:64, group:"K", teamA:"Uzbekistan",     teamB:"Colombia",      flagA:"🇺🇿", flagB:"🇨🇴", time:"2026-06-21T18:00:00Z", venue:"Guadalajara"   },
  { id:65, group:"K", teamA:"Portugalia",     teamB:"Colombia",      flagA:"🇵🇹", flagB:"🇨🇴", time:"2026-06-25T19:00:00Z", venue:"Los Angeles"   },
  { id:66, group:"K", teamA:"Congo RD",       teamB:"Uzbekistan",    flagA:"🇨🇩", flagB:"🇺🇿", time:"2026-06-25T19:00:00Z", venue:"Guadalajara"   },

  // ══ GRUPA L ═══════════════════════════════════════════════════════════════
  { id:67, group:"L", teamA:"Anglia",         teamB:"Ghana",         flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇬🇭", time:"2026-06-17T18:00:00Z", venue:"Boston"        },
  { id:68, group:"L", teamA:"Croatia",        teamB:"Croația",       flagA:"🇵🇦", flagB:"🇭🇷", time:"2026-06-17T21:00:00Z", venue:"Toronto"       },
  { id:69, group:"L", teamA:"Anglia",         teamB:"Panama",        flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇵🇦", time:"2026-06-21T21:00:00Z", venue:"Miami"         },
  { id:70, group:"L", teamA:"Croația",        teamB:"Ghana",         flagA:"🇭🇷", flagB:"🇬🇭", time:"2026-06-22T00:00:00Z", venue:"Philadelphia"  },
  { id:71, group:"L", teamA:"Anglia",         teamB:"Croația",       flagA:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", flagB:"🇭🇷", time:"2026-06-25T22:00:00Z", venue:"Seattle"       },
  { id:72, group:"L", teamA:"Ghana",          teamB:"Panama",        flagA:"🇬🇭", flagB:"🇵🇦", time:"2026-06-25T22:00:00Z", venue:"New York"      },
];

// Correct group L match 68 — Panama vs Croatia
ALL_MATCHES[67] = { id:68, group:"L", teamA:"Panama", teamB:"Croația", flagA:"🇵🇦", flagB:"🇭🇷", time:"2026-06-17T21:00:00Z", venue:"Toronto" };

export const ALL_GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

// Group display names — "I" gets special treatment as Group of Death
export const GROUP_LABELS = {
  I: "GRUPA I — Grupa Morții 💀"
};
export const getGroupLabel = (g) => GROUP_LABELS[g] || `GRUPA ${g}`;
