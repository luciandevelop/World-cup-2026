// ─── src/screens/LeaderboardScreen.jsx ───────────────────────────────────────
import { useMemo, useState } from 'react';
import {
  CURRENT_STAGE,
  buildLeaderboard,
  buildMatches,
  calcBreakdown,
  formatKickoffRO,
  getPredictionStyle,
  getAvatarRing,
  getRivalryMessage,
  getPlayerForm,
} from '../data/gameData.js';
import { FootballAvatar } from '../components/UI.jsx';
import { isSpecialLocked } from '../services/specialEventsService.js';

function normalizePredMap(preds = {}) {
  return Object.fromEntries(
    Object.entries(preds || {}).map(([id, p]) => [Number(id), p])
  );
}


// ─── PLAYER DETAIL MODAL ─────────────────────────────────────────────────────
// Full-screen slide-up modal showing one player's predictions + points breakdown.
// Only shows finished matches (isFinished=true) — predictions for open/upcoming
// matches are never revealed here, same rule as Friends tab.
function PlayerDetailModal({ nickname, avatarId, rank, points, exactScores,
                              allPredictions, finishedMatches, onClose, specialPred = null }) {
  // Build this player's prediction map (normalised to numeric keys)
  const preds = useMemo(() => {
    const raw = allPredictions[nickname] || {};
    return Object.fromEntries(Object.entries(raw).map(([id, p]) => [Number(id), p]));
  }, [nickname, allPredictions]);

  // Only finished matches where the player has a prediction, newest first
  const matchRows = useMemo(() =>
    finishedMatches
      .filter(m => preds[m.id])
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .map(m => {
        const pred = preds[m.id];
        const b    = calcBreakdown(pred, m);
        return { match:m, pred, b };
      }),
    [finishedMatches, preds]
  );

  const ptColor = (v) => v > 0 ? '#00E5A0' : 'rgba(255,255,255,0.2)';

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)',
               backdropFilter:'blur(6px)', display:'flex', flexDirection:'column',
               justifyContent:'flex-end', animation:'fadeIn 0.15s' }}
    >
      <div style={{ background:'#0D1318', borderRadius:'20px 20px 0 0',
                    border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none',
                    maxHeight:'92dvh', display:'flex', flexDirection:'column',
                    animation:'slideUp 0.28s ease' }}>

        {/* ── Header ── */}
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)',
                      display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <FootballAvatar nickname={nickname} avatarId={avatarId} size={46}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{nickname}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>
              Locul #{rank} · {points} puncte · {exactScores} scoruri exacte
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)',
                     borderRadius:10, padding:'7px 12px', color:'rgba(255,255,255,0.6)',
                     fontSize:13, cursor:'pointer', fontWeight:700 }}>
            ✕
          </button>
        </div>

        {/* ── Match list ── */}
        <div style={{ overflowY:'auto', padding:'10px 14px 28px', flex:1 }}>
          {matchRows.length === 0 && (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:13,
                          paddingTop:32 }}>
              Nicio predicție înregistrată pentru meciuri finalizate.
            </div>
          )}

          {matchRows.map(({ match:m, pred, b }) => {
            const rA = Number(m.realScoreA), rB = Number(m.realScoreB);
            const pA = Number(pred.scoreA), pB = Number(pred.scoreB);
            const isExact = b?.exactScore === 100;

            return (
              <div key={m.id} style={{ marginBottom:10, borderRadius:14,
                border:`1px solid ${isExact ? 'rgba(0,229,160,0.25)' : 'rgba(255,255,255,0.07)'}`,
                background: isExact ? 'rgba(0,229,160,0.03)' : 'rgba(255,255,255,0.02)',
                overflow:'hidden' }}>

                {/* Match header */}
                <div style={{ padding:'9px 12px 7px', borderBottom:'1px solid rgba(255,255,255,0.05)',
                              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                      {m.flagA} {m.teamA} vs {m.teamB} {m.flagB}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>
                      {formatKickoffRO(m.time)}
                      {m.group && m.group !== 'AMICALE' ? ` · Grupa ${m.group}` : ''}
                    </div>
                  </div>
                  {/* Total pts badge */}
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:18, fontWeight:900, fontFamily:"'DM Mono',monospace",
                                  color: b?.total > 0 ? '#FFD700' : 'rgba(255,255,255,0.25)' }}>
                      {b?.total ?? '—'}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>pts</div>
                  </div>
                </div>

                {/* Scores row */}
                <div style={{ padding:'8px 12px 6px', display:'flex', gap:8, alignItems:'center' }}>
                  {/* Prediction */}
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>
                      PREDICȚIE
                    </div>
                    <div style={{ fontSize:20, fontWeight:900, fontFamily:"'DM Mono',monospace",
                                  color: isExact ? '#00E5A0' : '#fff' }}>
                      {pA} – {pB}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>vs</div>
                  {/* Real result */}
                  <div style={{ flex:1, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>
                      REAL
                    </div>
                    <div style={{ fontSize:20, fontWeight:900, fontFamily:"'DM Mono',monospace",
                                  color:'rgba(255,255,255,0.7)' }}>
                      {rA} – {rB}
                    </div>
                  </div>
                </div>

                {/* Points breakdown */}
                {b && (
                  <div style={{ padding:'4px 12px 10px',
                                display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                                gap:'4px 8px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    {[
                      { label:'Scor exact',  val: b.exactScore },
                      { label:'Rezultat',    val: b.correctRes },
                      { label:'Total goluri',val: b.totalGoals },
                      {
                        label: `Cart (${pred.possession ?? '—'} vs ${m.realPossession ?? '—'})`,
                        val: b.possession,
                      },
                      {
                        label: `Cor (${pred.corners ?? '—'} vs ${m.realCorners ?? '—'})`,
                        val: b.corners,
                      },
                      b.isPerfect ? { label:'⭐ Perfect', val:'+bonus', special:true } : null,
                    ].filter(Boolean).map(({ label, val, special }) => (
                      <div key={label} style={{ padding:'4px 0' }}>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)',
                                      lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden',
                                      textOverflow:'ellipsis' }}>
                          {label}
                        </div>
                        <div style={{ fontSize:12, fontWeight:800,
                                      color: special ? '#FFD700' : ptColor(Number(val) || 0),
                                      fontFamily:"'DM Mono',monospace" }}>
                          {special ? val : `+${val}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.1)',
                        paddingTop:8 }}>
            {matchRows.length} meciuri finalizate cu predicții
          </div>

          {/* ── Special predictions — read-only, shown only when locked ── */}
          {isSpecialLocked() && (
            <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(255,215,0,0.04)',
                          border:'1px solid rgba(255,215,0,0.15)', borderRadius:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#FFD700',
                            letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>
                ⭐ Predicții speciale
              </div>
              {!specialPred ? (
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>
                  Nu a completat predicțiile speciale.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>
                      🏆 Campioană
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
                      {specialPred.winner || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>
                      🥈 Semifinaliste
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.5 }}>
                      {(specialPred.semifinalists || []).join(', ') || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>
                      ⚽ Țara golgheterului
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
                      {specialPred.topScorerCountry || '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardScreen({
  currentUser = '',
  predictions = {},
  allPredictions = {},
  finishedResults = {},
  allUsers = {},
  allSpecialPredsByNick = {},
}) {
  const currentNickname =
    typeof currentUser === 'string'
      ? currentUser
      : (currentUser?.nickname || currentUser?.displayName || currentUser?.email || '');

  const [selectedPlayer, setSelectedPlayer] = useState(null); // nickname of tapped player

  // Build nickname→avatarId map from allUsers for accurate avatar display
  const avatarByNick = useMemo(() => {
    const map = {};
    Object.values(allUsers).forEach(u => {
      if (u?.nickname && u?.avatarId) map[u.nickname] = u.avatarId;
    });
    return map;
  }, [allUsers]);

  const data = useMemo(() => {
    try {
      const safeFinishedResults = finishedResults || {};
      const liveMatches = buildMatches(safeFinishedResults); // official WC only
      const finishedMatches = liveMatches.filter(m => m && m.isFinished);
      const finishedCount = finishedMatches.length;

      const myPreds = normalizePredMap(predictions);
      const normalizedAllPreds = Object.fromEntries(
        Object.entries(allPredictions || {}).map(([nick, preds]) => [nick, normalizePredMap(preds)])
      );

      const allPlayerPreds = {
        ...normalizedAllPreds,
        ...(currentNickname ? { [currentNickname]: myPreds } : {}),
      };

      const sorted = buildLeaderboard(allPlayerPreds, currentNickname || 'Me', finishedMatches);
      return { sorted, finishedCount, error: null };
    } catch (err) {
      console.error('LEADERBOARD CRASH', err);
      return { sorted: [], finishedCount: 0, error: err?.message || String(err) };
    }
  }, [currentUser, currentNickname, predictions, allPredictions, finishedResults]);

  const { sorted, finishedCount, error } = data;
  const total = sorted.length;

  const my = sorted.find(p => p.nickname === currentNickname)
    || { rank: '?', points: 0, exactScores: 0, lastMatchPts: null, qualified: true };

  const medals = ['🥇', '🥈', '🥉'];

  const getPrevRanks = () => {
    try { return JSON.parse(sessionStorage.getItem('prevRanks') || '{}'); } catch { return {}; }
  };
  const prevRanks = getPrevRanks();
  const getMovement = (nick, rank) => {
    const prev = prevRanks[nick];
    return prev != null ? prev - rank : 0;
  };

  const movements = sorted.map(p => ({ nick: p.nickname, mov: getMovement(p.nickname, p.rank) }));
  const climber = movements.reduce((best, x) => x.mov > best.mov ? x : best, { mov: -Infinity });
  const dropper = movements.reduce((best, x) => x.mov < best.mov ? x : best, { mov: Infinity });

  if (error) {
    return (
      <div style={{ padding: '16px 14px' }}>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: 14, color: '#FF6B6B' }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Leaderboard temporarily unavailable</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ padding: '0 14px' }}>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 14 }}>
        {[
          { label: 'Jucători', value: total },
          { label: 'Top 3', value: Math.min(total, 3) },
          { label: 'Meciuri ✓', value: finishedCount },
          { label: 'Etapă', value: CURRENT_STAGE, wide: true },
        ].map((s, i) => (
          <div key={i} style={{ flex: s.wide ? 2 : 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: s.wide ? 10 : 15, fontWeight: 800, color: '#fff', fontFamily: s.wide ? 'inherit' : "'DM Mono',monospace", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3, letterSpacing: '0.04em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {(() => {
        const rivalry = getRivalryMessage(my.rank, my.points, sorted, currentNickname);
        const myStyle = getPredictionStyle(my.exactScores, my.points, my.exactScores);
        return (
          <div style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '16px 18px', marginBottom: 14, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FootballAvatar nickname={currentNickname} avatarId={avatarByNick[currentNickname]} size={48}/>
                <div>
                  <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Tu ești</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FFD700', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>#{my.rank}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{currentNickname}</div>
                  <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 10 }}>{myStyle.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: myStyle.color, letterSpacing: '0.03em' }}>{myStyle.label}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#FFD700', fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{my.points}</div>
                <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.3)', letterSpacing: '0.06em' }}>PUNCTE</div>
                {my.lastMatchPts !== null && <div style={{ fontSize: 11, color: '#00E5A0', marginTop: 3, fontWeight: 700 }}>+{my.lastMatchPts} ultimul meci</div>}

              </div>
            </div>
            {rivalry && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14 }}>{rivalry.urgency === 'high' ? '🔥' : rivalry.urgency === 'medium' ? '⚠' : '👀'}</span>
                <span style={{ fontSize: 11, color: rivalry.urgency === 'high' ? '#FF9800' : rivalry.urgency === 'medium' ? '#FFC107' : 'rgba(255,255,255,0.35)', fontWeight: rivalry.urgency === 'high' ? 700 : 400, lineHeight: 1.4 }}>{rivalry.text}</span>
              </div>
            )}
          </div>
        );
      })()}

      {climber.mov > 0 && dropper.mov < 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 12, padding: '9px 12px' }}>
            <div style={{ fontSize: 9, color: 'rgba(0,229,160,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>↑ Urcuș</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00E5A0' }}>{climber.nick}</div>
            <div style={{ fontSize: 10, color: 'rgba(0,229,160,0.5)' }}>+{climber.mov} locuri 🚀</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.12)', borderRadius: 12, padding: '9px 12px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,107,107,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>↓ Cădere</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B' }}>{dropper.nick}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,107,107,0.5)' }}>{dropper.mov} locuri 💀</div>
          </div>
        </div>
      )}

      {sorted.map((e, i) => {
        const isMe = e.nickname === currentNickname;
        const mov = getMovement(e.nickname, e.rank);
        const pStyle = getPredictionStyle(e.exactScores, e.points, e.exactScores);
        const ring = getAvatarRing(pStyle);

        return (
          <div key={e.nickname || i}>
            <div onClick={() => setSelectedPlayer(e.nickname)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, marginBottom: 6, background: isMe ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.035)', border: `1px solid ${isMe ? 'rgba(212,175,55,0.22)' : 'rgba(255,255,255,0.06)'}`, animation: `staggerIn 0.35s ${Math.min(i,10)*0.04}s both`, cursor:'pointer' }}>
              <div style={{ width: 24, textAlign: 'center', fontSize: i < 3 ? 18 : 11, color: i < 3 ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: 700, flexShrink: 0 }}>
                {i < 3 ? medals[i] : e.rank}
              </div>

              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ padding: 2, borderRadius: '50%', background: ring, display: 'inline-flex' }}>
                  <FootballAvatar nickname={e.nickname} avatarId={avatarByNick[e.nickname]} size={34}/>
                </div>
                {isMe && <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#FFD700', border: '2px solid #0A0E14' }}/>} 
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#FFD700' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.nickname}
                </div>
                {(() => {
                  const form = getPlayerForm(e.nickname, e.exactScores, mov);
                  return form
                    ? <div style={{ fontSize: 9, color: form.color, marginTop: 2, fontWeight: 700 }}>{form.icon} {form.text}</div>
                    : <div style={{ fontSize: 9, color: pStyle.color, marginTop: 2, opacity: 0.5, fontWeight: 600 }}>{pStyle.icon} {pStyle.label}</div>;
                })()}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "'DM Mono',monospace", color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                  {e.points}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>🎯 {e.exactScores}</div>
                {mov !== 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: mov > 0 ? '#00E5A0' : '#FF6B6B', animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                    {mov > 0 ? `↑${mov}` : `↓${Math.abs(mov)}`}
                  </div>
                )}
              </div>
            </div>


          </div>
        );
      })}

      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', textAlign: 'center', marginTop: 10, paddingBottom: 8 }}>
        Actualizat după fiecare meci · {finishedCount} meciuri finalizate ⚡
      </div>
    </div>

    {/* Player detail modal */}
    {selectedPlayer && (() => {
      const entry = sorted.find(p => p.nickname === selectedPlayer);
      return (
        <PlayerDetailModal
          nickname={selectedPlayer}
          avatarId={avatarByNick[selectedPlayer]}
          rank={entry?.rank ?? '?'}
          points={entry?.points ?? 0}
          exactScores={entry?.exactScores ?? 0}
          allPredictions={
            (() => {
              // Merge allPredictions (nick-keyed) with current user's own preds
              const normalised = Object.fromEntries(
                Object.entries(allPredictions || {}).map(([n, p]) =>
                  [n, Object.fromEntries(Object.entries(p || {}).map(([id, v]) => [Number(id), v]))]
                )
              );
              if (currentNickname) {
                normalised[currentNickname] = Object.fromEntries(
                  Object.entries(predictions || {}).map(([id, v]) => [Number(id), v])
                );
              }
              return normalised;
            })()
          }
          finishedMatches={buildMatches(finishedResults).filter(m => m.isFinished)}
          specialPred={allSpecialPredsByNick[selectedPlayer] || null}
          onClose={() => setSelectedPlayer(null)}
        />
      );
    })()}
    </>
  );
}
