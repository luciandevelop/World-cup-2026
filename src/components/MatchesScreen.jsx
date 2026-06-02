import { useState, useEffect } from 'react';
import {
  MATCHES, GROUPS, LOCK_BEFORE_MS, MOCK_PREDICTIONS_FINISHED,
  POPULAR_PICKS, MOST_PREDICTED, LIVE_FEED_EVENTS, TYPE_COLOR, LIVE_STUB,
  calcBreakdown, calcPoints, matchLockState, formatTime,
} from './data.js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Group teams lookup — derived from match data, used for group headers
const GROUP_TEAMS = GROUPS.reduce((acc, g) => {
  const ms = MATCHES.filter(m => m.group === g);
  const teams = [...new Set(ms.flatMap(m => [
    { name: m.teamA, flag: m.flagA },
    { name: m.teamB, flag: m.flagB },
  ].map(t => JSON.stringify(t))))]
    .map(s => JSON.parse(s));
  acc[g] = teams;
  return acc;
}, {});

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
function getStatusConfig(state) {
  return {
    open:     { label: 'Deschis',   dot: '#4A9EFF', text: '#4A9EFF',  bg: 'rgba(74,158,255,0.08)',  border: 'rgba(74,158,255,0.18)'  },
    soon:     { label: 'Se închide',dot: '#F59E0B', text: '#F59E0B',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.24)'  },
    locked:   { label: 'Blocat',    dot: '#6B7280', text: '#6B7280',  bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.16)' },
    live:     { label: '⬤ Live',    dot: '#EF4444', text: '#EF4444',  bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'    },
    finished: { label: 'Final',     dot: '#9CA3AF', text: '#9CA3AF',  bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.12)' },
  }[state] || { label: 'Blocat', dot: '#6B7280', text: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.16)' };
}

// ─── SCORE BREAKDOWN ──────────────────────────────────────────────────────────
function ScoreBreakdown({ pred, match }) {
  const b = calcBreakdown(pred, match);
  if (!b) return null;
  const rows = [
    { label: 'Scor exact',      pts: b.exactScore },
    { label: 'Rezultat corect', pts: b.correctRes  },
    { label: 'Total goluri',    pts: b.totalGoals  },
    { label: 'Posesie',         pts: b.possession  },
    { label: 'Cornere',         pts: b.corners     },
  ];
  return (
    <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px',marginTop:8 }}>
      {b.isPerfect && (
        <div style={{ textAlign:'center',marginBottom:10,padding:'8px 12px',background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:8 }}>
          <div style={{ fontSize:12,fontWeight:700,color:'#D4AF37',letterSpacing:'0.08em',fontFamily:"'Bebas Neue',sans-serif" }}>✦ PREDICȚIE PERFECTĂ ✦</div>
          <div style={{ fontSize:10,color:'rgba(212,175,55,0.5)',marginTop:2 }}>Scor · posesie · cornere — toate exacte</div>
        </div>
      )}
      <div style={{ fontSize:9,color:'rgba(255,255,255,0.25)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8,fontWeight:600 }}>Detaliu punctaj</div>
      {rows.map((r,i) => (
        <div key={i} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <span style={{ fontSize:12,color:r.pts > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>{r.label}</span>
          <span style={{ fontSize:12,fontWeight:700,color:r.pts > 0 ? '#fff' : 'rgba(255,255,255,0.15)',fontFamily:"'DM Mono',monospace" }}>
            {r.pts > 0 ? `+${r.pts}` : '—'}
          </span>
        </div>
      ))}
      <div style={{ height:1,background:'rgba(255,255,255,0.06)',margin:'8px 0' }}/>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.5)' }}>Total</span>
        <span style={{ fontSize:15,fontWeight:800,color:'#fff',fontFamily:"'DM Mono',monospace" }}>+{b.total} pts</span>
      </div>
    </div>
  );
}

// ─── POPULAR PICKS ────────────────────────────────────────────────────────────
function PopularPicks({ matchId, prediction }) {
  const picks = POPULAR_PICKS[matchId];
  if (!picks) return null;
  const userResult = prediction
    ? (prediction.scoreA > prediction.scoreB ? '1' : prediction.scoreA < prediction.scoreB ? '2' : 'X')
    : null;
  const max = Math.max(picks.homeWin, picks.draw, picks.awayWin);
  return (
    <div style={{ marginTop:8,padding:'10px 12px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10 }}>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
        <span style={{ fontSize:10,color:'rgba(255,255,255,0.25)',letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600 }}>Prietenii aleg</span>
        {picks.homeWin < 55 && (
          <span style={{ fontSize:10,color:'#F59E0B',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',padding:'1px 7px',borderRadius:4,fontWeight:600 }}>Meci incert</span>
        )}
      </div>
      <div style={{ display:'flex',gap:6 }}>
        {[{label:'1',pct:picks.homeWin},{label:'X',pct:picks.draw},{label:'2',pct:picks.awayWin}].map(o => {
          const isUser = userResult === o.label;
          const isHigh = o.pct === max;
          return (
            <div key={o.label} style={{
              flex:1,textAlign:'center',padding:'7px 4px',borderRadius:6,
              background: isUser ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: isUser ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize:10,fontWeight:700,color:isUser ? '#fff' : isHigh ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',marginBottom:3 }}>{o.label}</div>
              <div style={{ fontSize:14,fontWeight:800,color:isUser ? '#fff' : isHigh ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',fontFamily:"'DM Mono',monospace" }}>{o.pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DRAMA TAG ────────────────────────────────────────────────────────────────
function getMatchDramaTag(match, prediction) {
  if (match.isFinished || match.isLocked) return null;
  const picks = POPULAR_PICKS[match.id];
  const lockInfo = matchLockState(match);
  if (lockInfo.state === 'soon' || !picks) return null;
  if (picks.draw <= 10) return { text: `${picks.draw}% pe egal`, color: '#F59E0B' };
  if (picks.awayWin <= 12) return { text: 'Surpriză posibilă', color: '#F59E0B' };
  if (prediction) {
    const ur = prediction.scoreA > prediction.scoreB ? '1' : prediction.scoreA < prediction.scoreB ? '2' : 'X';
    const pct = ur === '1' ? picks.homeWin : ur === '2' ? picks.awayWin : picks.draw;
    if (pct <= 15) return { text: 'Risc mare · recompensă mare', color: '#9CA3AF' };
  }
  if (picks.homeWin >= 72) return { text: `${picks.homeWin}% mizează pe gazdă`, color: '#9CA3AF' };
  return null;
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({ match, prediction, onPredict, showOtherPreds }) {
  const lockInfo   = matchLockState(match);
  const isEditable = lockInfo.state === 'open';
  const pts        = prediction && match.isFinished ? calcPoints(prediction, match) : null;
  const [expanded, setExpanded] = useState(false);
  const status = getStatusConfig(lockInfo.state);

  const hasPred = !!prediction;

  return (
    <div style={{ marginBottom:8 }}>
      {/* Main card */}
      <div
        onClick={() => isEditable ? onPredict(match) : match.isFinished && setExpanded(e => !e)}
        style={{
          background: hasPred
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.025)',
          border: lockInfo.state === 'soon'
            ? `1px solid rgba(245,158,11,0.3)`
            : hasPred
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.06)',
          borderRadius:12,
          padding:'13px 14px',
          cursor: isEditable || match.isFinished ? 'pointer' : 'default',
          position:'relative',
          overflow:'hidden',
          transition:'background 0.15s',
          animation: lockInfo.state === 'soon' ? 'lockGlow 2.4s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => { if (isEditable || match.isFinished) e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = hasPred ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)'; }}
      >
        {/* Live dot */}
        {lockInfo.state === 'live' && (
          <div style={{ position:'absolute',top:11,right:12,width:6,height:6,borderRadius:'50%',background:'#EF4444',animation:'livePulse 1.4s infinite' }}/>
        )}

        {/* Meta row: time · venue · status */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:11 }}>
          <span style={{ fontSize:11,color:'rgba(255,255,255,0.3)' }}>
            {formatTime(match.time)} · {match.venue}
          </span>
          <span style={{
            fontSize:10,fontWeight:600,
            color: status.text,
            background: status.bg,
            border: `1px solid ${status.border}`,
            borderRadius:4,
            padding:'2px 7px',
            letterSpacing:'0.02em',
          }}>
            {status.label}
          </span>
        </div>

        {/* Teams + score */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          {/* Home */}
          <div style={{ flex:1,textAlign:'center' }}>
            <div style={{ fontSize:30,lineHeight:1,marginBottom:4 }}>{match.flagA}</div>
            <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.85)' }}>{match.teamA}</div>
          </div>

          {/* Score / VS */}
          <div style={{ textAlign:'center',padding:'0 14px',flexShrink:0 }}>
            {match.isFinished ? (
              <div style={{ fontSize:26,fontWeight:800,color:'#fff',fontFamily:"'DM Mono',monospace",letterSpacing:'-0.02em' }}>
                {match.realScoreA}&thinsp;–&thinsp;{match.realScoreB}
              </div>
            ) : (
              <div style={{ fontSize:13,color:'rgba(255,255,255,0.15)',fontWeight:700,letterSpacing:'0.12em' }}>VS</div>
            )}
            {prediction && (
              <div style={{ fontSize:10,color: match.isFinished ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.45)',fontFamily:"'DM Mono',monospace",marginTop:3 }}>
                {prediction.scoreA}–{prediction.scoreB}
              </div>
            )}
          </div>

          {/* Away */}
          <div style={{ flex:1,textAlign:'center' }}>
            <div style={{ fontSize:30,lineHeight:1,marginBottom:4 }}>{match.flagB}</div>
            <div style={{ fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.85)' }}>{match.teamB}</div>
          </div>
        </div>

        {/* Bottom row: prediction meta + points */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',minHeight:22 }}>
          <div style={{ flex:1,minWidth:0 }}>
            {prediction ? (
              <div style={{ display:'flex',gap:12,alignItems:'center' }}>
                <span style={{ fontSize:11,color:'rgba(255,255,255,0.25)' }}>{prediction.possession}% poz.</span>
                <span style={{ fontSize:11,color:'rgba(255,255,255,0.25)' }}>{prediction.corners} cornere</span>
              </div>
            ) : isEditable ? (
              <span style={{ fontSize:12,color:'rgba(255,255,255,0.55)',fontWeight:600 }}>+ Adaugă predicție</span>
            ) : (
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.2)' }}>Nicio predicție</span>
            )}
            {(() => {
              const tag = getMatchDramaTag(match, prediction);
              return tag ? (
                <div style={{ marginTop:4,fontSize:10,color:tag.color }}>{tag.text}</div>
              ) : null;
            })()}
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0,marginLeft:8 }}>
            {pts !== null && (
              <div style={{ background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,padding:'3px 10px',animation:'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <span style={{ fontSize:13,fontWeight:800,color:'#fff',fontFamily:"'DM Mono',monospace" }}>+{pts}</span>
                <span style={{ fontSize:10,color:'rgba(255,255,255,0.35)',marginLeft:2 }}>pts</span>
              </div>
            )}
            {match.isFinished && (
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.2)' }}>{expanded ? '▲' : '▼'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: breakdown + friends */}
      {match.isFinished && expanded && (
        <div style={{ padding:'0 4px' }}>
          {prediction && <ScoreBreakdown pred={prediction} match={match}/>}
          {showOtherPreds && showOtherPreds.length > 0 && (
            <div style={{ marginTop:6 }}>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6,fontWeight:600 }}>Predicțiile prietenilor</div>
              {showOtherPreds.map((p, i) => {
                const isEx  = p.scoreA === match.realScoreA && p.scoreB === match.realScoreB;
                const ppts  = calcPoints({ scoreA:p.scoreA, scoreB:p.scoreB, possession:p.possession, corners:p.corners }, match);
                return (
                  <div key={i} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'8px 12px',borderRadius:8,marginBottom:4,
                    background: isEx ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: isEx ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.04)',
                    animation:`revealFlip 0.35s ${i*0.07}s cubic-bezier(0.34,1.2,0.64,1) both`,
                  }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div style={{ width:24,height:24,borderRadius:'50%',background:`hsl(${i*55+190},30%,32%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)' }}>
                        {p.nickname[0]}
                      </div>
                      <span style={{ fontSize:12,color:'rgba(255,255,255,0.6)',fontWeight:600 }}>{p.nickname}</span>
                      {isEx && <span style={{ fontSize:10,color:'rgba(255,255,255,0.5)',fontWeight:700 }}>✓ Exact</span>}
                    </div>
                    <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                      <span style={{ fontSize:13,fontWeight:700,color: isEx ? '#fff' : 'rgba(255,255,255,0.6)',fontFamily:"'DM Mono',monospace" }}>{p.scoreA}–{p.scoreB}</span>
                      <span style={{ fontSize:11,color:'rgba(212,175,55,0.7)',fontWeight:700,fontFamily:"'DM Mono',monospace" }}>{ppts}p</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Locked notice */}
      {match.isLocked && !match.isFinished && prediction && (
        <div style={{ padding:'6px 10px',marginTop:-2,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderTop:'none',borderRadius:'0 0 10px 10px',fontSize:11,color:'rgba(255,255,255,0.2)',textAlign:'center' }}>
          Predicțiile prietenilor vizibile după meci
        </div>
      )}

      {/* Popular picks (only on open matches) */}
      {isEditable && <PopularPicks matchId={match.id} prediction={prediction}/>}
    </div>
  );
}

// ─── LIVE FEED ────────────────────────────────────────────────────────────────
function LiveFeed() {
  const [expanded, setExpanded] = useState(false);
  const latest = LIVE_FEED_EVENTS[0];
  return (
    <div style={{ marginBottom:12,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,overflow:'hidden' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,padding:'9px 13px' }}>
        <div style={{ width:6,height:6,borderRadius:'50%',background:'#4A9EFF',flexShrink:0 }}/>
        <span style={{ fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:'0.14em',textTransform:'uppercase',flexShrink:0 }}>Feed</span>
        <span style={{ fontSize:11,color:'rgba(255,255,255,0.45)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
          {latest.icon} {latest.text}
        </span>
        {latest.pts && <span style={{ fontSize:10,fontWeight:700,color:TYPE_COLOR[latest.type]||'rgba(255,255,255,0.3)',fontFamily:"'DM Mono',monospace",flexShrink:0 }}>{latest.pts}</span>}
        <button onClick={() => setExpanded(e => !e)} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.2)',fontSize:10,cursor:'pointer',padding:'0 2px',flexShrink:0 }}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.04)',padding:'6px 13px 10px',display:'flex',flexDirection:'column',gap:5 }}>
          {LIVE_FEED_EVENTS.slice(1).map((ev, i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:8,animation:`slideIn 0.2s ${i*0.03}s both` }}>
              <span style={{ fontSize:12,flexShrink:0 }}>{ev.icon}</span>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.4)',flex:1,lineHeight:1.3 }}>{ev.text}</span>
              <span style={{ fontSize:9,color:'rgba(255,255,255,0.15)',flexShrink:0 }}>{ev.ago}</span>
              {ev.pts && <span style={{ fontSize:9,fontWeight:700,color:TYPE_COLOR[ev.type]||'rgba(255,255,255,0.3)',fontFamily:"'DM Mono',monospace",flexShrink:0 }}>{ev.pts}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MATCH HYPE (community odds for upcoming) ─────────────────────────────────
function MatchHype({ match, prediction }) {
  const picks    = POPULAR_PICKS[match.id];
  const topScore = MOST_PREDICTED[match.id];
  if (!picks || match.isLocked || match.isFinished) return null;
  const max    = Math.max(picks.homeWin, picks.draw, picks.awayWin);
  const labels = ['1','X','2'];
  const pcts   = [picks.homeWin, picks.draw, picks.awayWin];
  const userResult = prediction
    ? (prediction.scoreA > prediction.scoreB ? 0 : prediction.scoreA < prediction.scoreB ? 2 : 1)
    : null;
  return (
    <div style={{ marginBottom:5,padding:'10px 12px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10 }}>
      <div style={{ display:'flex',gap:6,marginBottom: topScore ? 8 : 0 }}>
        {pcts.map((pct, i) => {
          const isUser = userResult === i;
          const isTop  = pct === max;
          return (
            <div key={i} style={{ flex:1,textAlign:'center' }}>
              <div style={{ fontSize:10,fontWeight:700,color:isUser?'#fff':isTop?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.2)',marginBottom:4 }}>{labels[i]}</div>
              <div style={{ height:2,borderRadius:1,background:isUser?'rgba(255,255,255,0.5)':isTop?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.05)',marginBottom:4 }}/>
              <div style={{ fontSize:13,fontWeight:800,color:isUser?'#fff':isTop?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.2)',fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
            </div>
          );
        })}
      </div>
      {topScore && (
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:7,borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:'0.06em',textTransform:'uppercase' }}>Scor cel mai prezis</span>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            <span style={{ fontSize:13,fontWeight:800,color:'rgba(255,255,255,0.7)',fontFamily:"'DM Mono',monospace" }}>
              {topScore.scoreA}–{topScore.scoreB}
            </span>
            <span style={{ fontSize:10,color:'rgba(255,255,255,0.25)' }}>({topScore.pct}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE MATCH VIEW ──────────────────────────────────────────────────────────
function LiveMatchView({ match, predictions, peerPreds, onClose }) {
  const live  = LIVE_STUB;
  const picks = POPULAR_PICKS[match.id];
  return (
    <div
      style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(12px)',display:'flex',flexDirection:'column',justifyContent:'flex-end',animation:'fadeIn 0.18s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#0D1117',borderRadius:'20px 20px 0 0',padding:'20px 18px 36px',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none',maxHeight:'88dvh',overflowY:'auto',animation:'slideUp 0.26s cubic-bezier(0.32,1.2,0.64,1)' }}>
        <div style={{ width:36,height:3,background:'rgba(255,255,255,0.12)',borderRadius:2,margin:'0 auto 18px' }}/>
        <div style={{ textAlign:'center',marginBottom:16 }}>
          <div style={{ fontSize:9,color:'rgba(239,68,68,0.7)',letterSpacing:'0.16em',textTransform:'uppercase',fontWeight:700,marginBottom:8 }}>
            {live.matchStatus === 'live' ? '⬤ Live' : 'Blocat'} · {match.venue}
          </div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:14 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:30 }}>{match.flagA}</div>
              <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)',marginTop:4 }}>{match.teamA}</div>
            </div>
            <div style={{ textAlign:'center',padding:'8px 16px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)' }}>
              {live.liveHomeScore !== null
                ? <div style={{ fontSize:26,fontWeight:800,color:'#fff',fontFamily:"'DM Mono',monospace" }}>{live.liveHomeScore}–{live.liveAwayScore}</div>
                : <div style={{ fontSize:11,color:'rgba(255,255,255,0.3)',lineHeight:1.5 }}>Live score<br/><span style={{ fontSize:9 }}>coming soon</span></div>}
              {live.matchMinute && <div style={{ fontSize:9,color:'#EF4444',marginTop:3 }}>{live.matchMinute}'</div>}
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:30 }}>{match.flagB}</div>
              <div style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.7)',marginTop:4 }}>{match.teamB}</div>
            </div>
          </div>
        </div>
        {picks && (
          <div style={{ display:'flex',gap:5,marginBottom:14 }}>
            {[{l:'1',p:picks.homeWin},{l:'X',p:picks.draw},{l:'2',p:picks.awayWin}].map((o,i) => (
              <div key={i} style={{ flex:1,textAlign:'center',padding:'7px 4px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:3 }}>{o.l}</div>
                <div style={{ fontSize:14,fontWeight:800,color:'rgba(255,255,255,0.8)',fontFamily:"'DM Mono',monospace" }}>{o.p}%</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize:9,color:'rgba(255,255,255,0.2)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10,fontWeight:600 }}>Predicțiile prietenilor</div>
        {peerPreds.map((p, i) => (
          <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 12px',borderRadius:8,marginBottom:5,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',animation:`revealFlip 0.3s ${i*0.06}s both` }}>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <div style={{ width:26,height:26,borderRadius:'50%',background:`hsl(${i*55+190},30%,28%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.6)' }}>{p.nickname[0]}</div>
              <span style={{ fontSize:12,color:'rgba(255,255,255,0.6)',fontWeight:600 }}>{p.nickname}</span>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.85)',fontFamily:"'DM Mono',monospace" }}>{p.scoreA}–{p.scoreB}</span>
              <span style={{ fontSize:10,color:'rgba(255,255,255,0.25)' }}>{p.possession}% poz.</span>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width:'100%',marginTop:14,padding:14,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,color:'rgba(255,255,255,0.4)',fontSize:13,fontWeight:600,cursor:'pointer' }}>
          Închide
        </button>
      </div>
    </div>
  );
}

// ─── NEXT MATCH HERO ──────────────────────────────────────────────────────────
function NextMatchHero({ match, prediction, onPredict }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!match) return null;

  const kickoff      = new Date(match.time).getTime();
  const msToKick     = kickoff - now;
  const msToLock     = kickoff - LOCK_BEFORE_MS - now;
  const isEditable   = msToLock > 0;
  const fmtCountdown = ms => {
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 48) return `${Math.floor(h/24)}z`;
    if (h > 0)  return `${h}h ${m}m`;
    return `${m}m`;
  };
  const kickdownLabel = fmtCountdown(msToKick);
  const lockdownLabel = fmtCountdown(msToLock);
  const soonLocking   = msToLock > 0 && msToLock < LOCK_BEFORE_MS;

  return (
    <div style={{
      margin:'12px 0 14px',
      background:'rgba(255,255,255,0.035)',
      border: soonLocking ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.09)',
      borderRadius:14,
      padding:'15px 16px',
      position:'relative',
      overflow:'hidden',
      animation: soonLocking ? 'lockGlow 2.4s ease-in-out infinite' : 'none',
    }}>
      {/* Subtle top line */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:1,background:'rgba(255,255,255,0.08)' }}/>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13 }}>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',textTransform:'uppercase',fontWeight:600 }}>
          Următor meci · Gr. {match.group}
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {kickdownLabel && (
            <span style={{ fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',padding:'2px 8px',borderRadius:4,fontFamily:"'DM Mono',monospace" }}>
              {kickdownLabel}
            </span>
          )}
          {lockdownLabel && soonLocking && (
            <span style={{ fontSize:10,fontWeight:700,color:'#F59E0B',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',padding:'2px 8px',borderRadius:4 }}>
              închide în {lockdownLabel}
            </span>
          )}
        </div>
      </div>

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{ flex:1,textAlign:'center' }}>
          <div style={{ fontSize:36,lineHeight:1,marginBottom:5 }}>{match.flagA}</div>
          <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)' }}>{match.teamA}</div>
        </div>
        <div style={{ textAlign:'center',padding:'0 12px',flexShrink:0 }}>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.15)',fontWeight:700,letterSpacing:'0.1em' }}>VS</div>
          {prediction && (
            <div style={{ fontSize:11,color:'rgba(255,255,255,0.45)',fontFamily:"'DM Mono',monospace",marginTop:4,fontWeight:700 }}>
              {prediction.scoreA}–{prediction.scoreB}
            </div>
          )}
        </div>
        <div style={{ flex:1,textAlign:'center' }}>
          <div style={{ fontSize:36,lineHeight:1,marginBottom:5 }}>{match.flagB}</div>
          <div style={{ fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.9)' }}>{match.teamB}</div>
        </div>
      </div>

      <button
        onClick={() => isEditable && onPredict(match)}
        disabled={!isEditable}
        style={{
          width:'100%',padding:'12px',borderRadius:9,border:'none',
          cursor: isEditable ? 'pointer' : 'default',
          fontFamily:"'Bebas Neue',sans-serif",letterSpacing:'0.06em',fontSize:14,fontWeight:900,
          transition:'all 0.18s',
          background: prediction
            ? isEditable ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'
            : isEditable ? '#fff' : 'rgba(255,255,255,0.04)',
          color: prediction
            ? isEditable ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'
            : isEditable ? '#0D1117' : 'rgba(255,255,255,0.2)',
        }}
        onMouseEnter={e => { if (isEditable) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {!isEditable
          ? 'Predicție blocată'
          : prediction
            ? `Editează · ${prediction.scoreA}–${prediction.scoreB}`
            : 'Adaugă predicție'}
      </button>
    </div>
  );
}

// ─── GROUP HEADER ─────────────────────────────────────────────────────────────
function GroupHeader({ group }) {
  const teams = GROUP_TEAMS[group] || [];
  return (
    <div style={{ display:'flex',alignItems:'center',gap:0,margin:'22px 0 10px',position:'relative' }}>
      {/* Left rule */}
      <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.07)' }}/>

      {/* Label */}
      <div style={{
        padding:'5px 14px',
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.09)',
        borderRadius:6,
        display:'flex',
        alignItems:'center',
        gap:8,
        flexShrink:0,
        mx:'8px',
      }}>
        <span style={{ fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.6)',letterSpacing:'0.14em',textTransform:'uppercase' }}>
          Grupa {group}
        </span>
        <span style={{ fontSize:9,color:'rgba(255,255,255,0.2)',letterSpacing:'0.04em' }}>
          {teams.map(t => t.flag).join(' ')}
        </span>
      </div>

      {/* Right rule */}
      <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.07)' }}/>
    </div>
  );
}

// ─── STATUS SECTION DIVIDER ───────────────────────────────────────────────────
function StatusDivider({ label }) {
  return (
    <div style={{ fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:'0.12em',textTransform:'uppercase',margin:'14px 0 8px',fontWeight:600 }}>
      {label}
    </div>
  );
}

// ─── MATCHES SCREEN ───────────────────────────────────────────────────────────
function MatchesScreen({ predictions, onPredict }) {
  const [activeGroup, setActiveGroup]   = useState('all');
  const [liveViewMatch, setLiveViewMatch] = useState(null);

  // Categorise all matches
  const finished = MATCHES.filter(m => m.isFinished);
  const locked   = MATCHES.filter(m => { const s = matchLockState(m).state; return (s==='locked'||s==='soon'||s==='live') && !m.isFinished; });
  const upcoming = MATCHES.filter(m => matchLockState(m).state==='open' && !m.isFinished);
  const live     = locked.filter(m => matchLockState(m).state==='live');

  // Next upcoming match for the hero
  const nextMatch    = [...upcoming].sort((a,b) => new Date(a.time)-new Date(b.time))[0] || null;
  const upcomingRest = upcoming.filter(m => m.id !== nextMatch?.id);

  // Filter by selected group
  const byGroup = m => activeGroup === 'all' || m.group === activeGroup;

  // When "all" is selected, render each group as a section.
  // When a specific group is selected, render only that group.
  const groupsToShow = activeGroup === 'all' ? GROUPS : [activeGroup];

  return (
    <div style={{ padding:'0 16px' }}>

      {/* ── Next match hero ── */}
      <NextMatchHero match={nextMatch} prediction={predictions[nextMatch?.id]} onPredict={onPredict}/>

      {/* ── Live feed ── */}
      <LiveFeed/>

      {/* ── Live match buttons ── */}
      {live.length > 0 && (
        <div style={{ marginBottom:10 }}>
          {live.map(m => (
            <button key={m.id} onClick={() => setLiveViewMatch(m)} style={{
              width:'100%',padding:'10px 14px',marginBottom:5,
              background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.18)',
              borderRadius:10,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'space-between',
            }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:'#EF4444',animation:'livePulse 1.4s infinite' }}/>
                <span style={{ fontSize:12,fontWeight:600,color:'rgba(239,68,68,0.9)' }}>{m.flagA} {m.teamA} vs {m.teamB} {m.flagB}</span>
              </div>
              <span style={{ fontSize:11,color:'rgba(239,68,68,0.5)',fontWeight:600 }}>Ver predicțiile →</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Group filter pills ── */}
      <div style={{ display:'flex',gap:6,overflowX:'auto',padding:'2px 0 12px',scrollbarWidth:'none' }}>
        {['all', ...GROUPS].map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            style={{
              flexShrink:0,
              padding:'6px 14px',
              borderRadius:6,
              border:`1px solid ${activeGroup===g ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              background: activeGroup===g ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: activeGroup===g ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize:12,fontWeight:activeGroup===g ? 700 : 500,
              cursor:'pointer',
              letterSpacing:'0.04em',
              transition:'all 0.15s',
            }}
          >
            {g === 'all' ? 'Toate' : `Gr. ${g}`}
          </button>
        ))}
      </div>

      {/* ── FINISHED matches — grouped ── */}
      {(() => {
        const finishedVisible = finished.filter(byGroup);
        if (finishedVisible.length === 0) return null;
        return (
          <div>
            <StatusDivider label="Terminate"/>
            {groupsToShow.map(g => {
              const gMatches = finished.filter(m => m.group === g);
              if (gMatches.length === 0) return null;
              return (
                <div key={g}>
                  {activeGroup === 'all' && <GroupHeader group={g}/>}
                  {gMatches.map(m => (
                    <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={() => {}} showOtherPreds={MOCK_PREDICTIONS_FINISHED}/>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── LOCKED / IN PROGRESS — grouped ── */}
      {(() => {
        const lockedVisible = locked.filter(byGroup);
        if (lockedVisible.length === 0) return null;
        return (
          <div>
            <StatusDivider label="În desfășurare"/>
            {groupsToShow.map(g => {
              const gMatches = locked.filter(m => m.group === g);
              if (gMatches.length === 0) return null;
              return (
                <div key={g}>
                  {activeGroup === 'all' && <GroupHeader group={g}/>}
                  {gMatches.map(m => <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={() => {}}/>)}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── UPCOMING — grouped ── */}
      {(() => {
        const upcomingVisible = upcomingRest.filter(byGroup);
        if (upcomingVisible.length === 0) return null;
        return (
          <div>
            <StatusDivider label="Meciuri viitoare"/>
            {groupsToShow.map(g => {
              const gMatches = upcomingRest.filter(m => m.group === g);
              if (gMatches.length === 0) return null;
              return (
                <div key={g}>
                  {activeGroup === 'all' && <GroupHeader group={g}/>}
                  {gMatches.map(m => (
                    <div key={m.id}>
                      <MatchHype match={m} prediction={predictions[m.id]}/>
                      <MatchCard match={m} prediction={predictions[m.id]} onPredict={onPredict}/>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Live modal ── */}
      {liveViewMatch && (
        <LiveMatchView
          match={liveViewMatch}
          predictions={predictions}
          peerPreds={MOCK_PREDICTIONS_FINISHED}
          onClose={() => setLiveViewMatch(null)}
        />
      )}
    </div>
  );
}

export default MatchesScreen;
