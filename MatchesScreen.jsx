import { useState, useEffect, useRef } from 'react';
import { ScoreInput, StepInput, PossessionInput } from './UI.jsx';
import {
  MATCHES, GROUPS, LOCK_BEFORE_MS, MOCK_PREDICTIONS_FINISHED,
  POPULAR_PICKS, MOST_PREDICTED, LIVE_FEED_EVENTS, TYPE_COLOR, LIVE_STUB,
  calcBreakdown, calcPoints, matchLockState, formatTime,
} from './data.js';

// ─── MATCHES SCREEN ───────────────────────────────────────────────────────────
// Score breakdown block shown after a finished match
function ScoreBreakdown({ pred, match }) {
  const b = calcBreakdown(pred, match);
  if (!b) return null;
  const rows = [
    { label:"Scor exact",      pts: b.exactScore },
    { label:"Rezultat corect", pts: b.correctRes },
    { label:"Total goluri",    pts: b.totalGoals },
    { label:"Posesie",         pts: b.possession },
    { label:"Cornere",         pts: b.corners },
  ];
  return (
    <div style={{ background:"rgba(0,229,160,0.03)",border:"1px solid rgba(0,229,160,0.09)",borderRadius:12,padding:"12px 14px",marginTop:7 }}>
      {b.isPerfect && (
        <div style={{ textAlign:"center",marginBottom:10,padding:"8px",background:"linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.04))",border:"1px solid rgba(255,215,0,0.2)",borderRadius:10 }}>
          <div style={{ fontSize:13,fontWeight:900,color:"#FFD700",letterSpacing:"0.06em",fontFamily:"'Bebas Neue',sans-serif" }}>✦ PERFECT PREDICTION ✦</div>
          <div style={{ fontSize:9,color:"rgba(255,215,0,0.4)",marginTop:2 }}>Scor + posesie + cornere — toate exacte</div>
        </div>
      )}
      <div style={{ fontSize:9,color:"rgba(0,229,160,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,fontWeight:700 }}>Detaliu punctaj</div>
      {rows.map((r,i)=>(
        <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.03)":"none" }}>
          <span style={{ fontSize:11,color:r.pts>0?"#aaa":"#333" }}>{r.label}</span>
          <span style={{ fontSize:11,fontWeight:800,color:r.pts>0?"#00E5A0":"#222",fontFamily:"'DM Mono',monospace" }}>{r.pts>0?`+${r.pts}`:"-"}</span>
        </div>
      ))}
      <div style={{ height:1,background:"rgba(255,255,255,0.05)",margin:"8px 0" }}/>
      <div style={{ display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:12,fontWeight:700,color:"#ddd" }}>TOTAL</span>
        <span style={{ fontSize:14,fontWeight:900,color:"#00E5A0",fontFamily:"'DM Mono',monospace" }}>+{b.total} pts</span>
      </div>
    </div>
  );
}

// Popular picks strip — shows community pick % for upcoming matches
function PopularPicks({ matchId, prediction }) {
  const picks = POPULAR_PICKS[matchId];
  if (!picks) return null;
  const userResult = prediction
    ? (prediction.scoreA > prediction.scoreB ? "1" : prediction.scoreA < prediction.scoreB ? "2" : "X")
    : null;
  const max = Math.max(picks.homeWin, picks.draw, picks.awayWin);
  return (
    <div style={{ marginTop:6,padding:"9px 11px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:10 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
        <span style={{ fontSize:9,color:"#3a3a3a",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700 }}>Alegeri prieteni</span>
        {picks.homeWin < 55 && <span style={{ fontSize:9,color:"#FFC107",background:"rgba(255,193,7,0.1)",padding:"2px 7px",borderRadius:10,fontWeight:700 }}>⚡ Meci incert</span>}
      </div>
      <div style={{ display:"flex",gap:5 }}>
        {[{label:"1",pct:picks.homeWin},{label:"X",pct:picks.draw},{label:"2",pct:picks.awayWin}].map(o => {
          const isUser = userResult === o.label;
          const isHigh = o.pct === max;
          return (
            <div key={o.label} style={{ flex:1,textAlign:"center",padding:"6px 4px",borderRadius:8,
              background: isUser ? "rgba(0,229,160,0.1)" : isHigh ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
              border: isUser ? "1px solid rgba(0,229,160,0.2)" : isHigh ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize:10,fontWeight:800,color: isUser?"#00E5A0":isHigh?"#ddd":"#444" }}>{o.label}</div>
              <div style={{ fontSize:13,fontWeight:900,color: isUser?"#00E5A0":isHigh?"#fff":"#333",fontFamily:"'DM Mono',monospace" }}>{o.pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMatchDramaTag(match, prediction) {
  if (match.isFinished || match.isLocked) return null;
  const picks = POPULAR_PICKS[match.id];
  const lockInfo = matchLockState(match);
  if (lockInfo.state === "soon") return null;
  if (!picks) return null;
  const drawPct = picks.draw;
  if (drawPct <= 10) return { icon:"⚠", text:`Doar ${drawPct}% mizează pe egal`, color:"#FFC107" };
  if (picks.awayWin <= 12) return { icon:"💣", text:"Surpriză posibilă", color:"#FF6B6B" };
  if (prediction) {
    const userResult = prediction.scoreA > prediction.scoreB ? "1"
      : prediction.scoreA < prediction.scoreB ? "2" : "X";
    const userPct = userResult === "1" ? picks.homeWin : userResult === "2" ? picks.awayWin : picks.draw;
    if (userPct <= 15) return { icon:"🧠", text:"Risc ridicat · ricompensă mare", color:"#7B5EA7" };
  }
  if (picks.homeWin >= 72) return { icon:"🔥", text:`${picks.homeWin}% mizează pe gazdă`, color:"#4A9EFF" };
  return null;
}

function MatchCard({ match, prediction, onPredict, showOtherPreds }) {
  const lockInfo = matchLockState(match);
  const isEditable = lockInfo.state === "open";
  const pts = prediction && match.isFinished ? calcPoints(prediction, match) : null;
  const [expanded, setExpanded] = useState(false);

  const badgeStyle = {
    open:     { bg:"rgba(74,158,255,0.15)",  color:"#4A9EFF" },
    soon:     { bg:"rgba(255,193,7,0.18)",   color:"#FFC107" },
    locked:   { bg:"rgba(255,107,107,0.15)", color:"#FF6B6B" },
    live:     { bg:"rgba(255,50,50,0.15)",   color:"#FF4444" },
    finished: { bg:"rgba(0,229,160,0.15)",   color:"#00E5A0" },
  }[lockInfo.state] || { bg:"rgba(255,107,107,0.15)", color:"#FF6B6B" };

  const barBg = match.isFinished
    ? "linear-gradient(90deg,#00E5A0,#00C27A)"
    : lockInfo.state === "soon"
      ? "linear-gradient(90deg,#FFC107,#FF9800)"
      : match.isLocked
        ? "linear-gradient(90deg,#FF6B6B,#FF4444)"
        : "linear-gradient(90deg,#4A9EFF,#7B5EA7)";

  return (
    <div style={{ marginBottom:10 }}>
      <div
        onClick={()=> isEditable ? onPredict(match) : match.isFinished && setExpanded(e=>!e)}
        style={{
          background: prediction ? "rgba(0,229,160,0.04)" : "rgba(255,255,255,0.04)",
          border: lockInfo.state === "soon"
            ? "1px solid rgba(255,193,7,0.28)"
            : `1px solid ${prediction ? "rgba(0,229,160,0.18)" : "rgba(255,255,255,0.06)"}`,
          borderRadius:16, padding:14,
          cursor: isEditable || match.isFinished ? "pointer" : "default",
          position:"relative", overflow:"hidden", transition:"transform 0.2s",
          boxShadow: lockInfo.state === "soon" ? "0 0 0 0 rgba(255,193,7,0.15), inset 0 0 20px rgba(255,193,7,0.03)" : "none",
          animation: lockInfo.state === "soon" ? "lockGlow 2.4s ease-in-out infinite" : "none",
        }}
        onMouseEnter={e=>{if(isEditable||match.isFinished)e.currentTarget.style.transform="translateY(-1px)"}}
        onMouseLeave={e=>{e.currentTarget.style.transform=""}}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:barBg }}/>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:60,
          background: match.isFinished
            ? "linear-gradient(180deg,rgba(0,229,160,0.03),transparent)"
            : lockInfo.state==="soon"
              ? "linear-gradient(180deg,rgba(255,193,7,0.04),transparent)"
              : "linear-gradient(180deg,rgba(74,158,255,0.03),transparent)",
          pointerEvents:"none" }}/>
        {lockInfo.state === "live" && <div style={{ position:"absolute",top:8,right:10,width:7,height:7,borderRadius:"50%",background:"#FF4444",animation:"livePulse 1.4s infinite" }}/>}
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ fontSize:10,color:"#444" }}>{formatTime(match.time)} · {match.venue}</div>
          <div style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:badgeStyle.bg,color:badgeStyle.color }}>
            {lockInfo.label}
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <div style={{ flex:1,textAlign:"center" }}>
            <div style={{ fontSize:28,marginBottom:2 }}>{match.flagA}</div>
            <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{match.teamA}</div>
          </div>
          <div style={{ textAlign:"center",padding:"0 12px" }}>
            {match.isFinished
              ?<div style={{ fontSize:24,fontWeight:900,color:"#fff",fontFamily:"'DM Mono',monospace" }}>{match.realScoreA}–{match.realScoreB}</div>
              :<div style={{ fontSize:16,color:"#333",fontWeight:700 }}>vs</div>}
            {prediction&&<div style={{ fontSize:10,color:match.isFinished?"#00E5A077":"#4A9EFF77",fontFamily:"'DM Mono',monospace",marginTop:2 }}>Pred: {prediction.scoreA}–{prediction.scoreB}</div>}
          </div>
          <div style={{ flex:1,textAlign:"center" }}>
            <div style={{ fontSize:28,marginBottom:2 }}>{match.flagB}</div>
            <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{match.teamB}</div>
          </div>
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ flex:1,minWidth:0 }}>
            {prediction
              ?<div style={{ display:"flex",gap:10,alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"#444" }}>📊 {prediction.possession}%–{100-prediction.possession}%</span>
                  <span style={{ fontSize:11,color:"#444" }}>📐 {prediction.corners}</span>
                </div>
              :isEditable
                ?<span style={{ fontSize:12,color:"#00E5A0",fontWeight:600 }}>+ Adaugă predicție →</span>
                :<span style={{ fontSize:11,color:"#444" }}>Predicție necompletată</span>}
            {(() => {
              const tag = getMatchDramaTag(match, prediction);
              return tag
                ? <div style={{ marginTop:5,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)" }}>
                    <span style={{ fontSize:10 }}>{tag.icon}</span>
                    <span style={{ fontSize:9,fontWeight:700,color:tag.color,letterSpacing:"0.02em" }}>{tag.text}</span>
                  </div>
                : null;
            })()}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0,marginLeft:8 }}>
            {pts!==null&&<div style={{ display:"inline-flex",alignItems:"center",gap:4,background:"rgba(0,229,160,0.12)",border:"1px solid #00E5A044",borderRadius:20,padding:"3px 10px",animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}><span style={{ fontSize:13,fontWeight:800,color:"#00E5A0",fontFamily:"'DM Mono',monospace" }}>+{pts}</span><span style={{ fontSize:10,color:"#00E5A066" }}>pts</span></div>}
            {match.isFinished&&<span style={{ fontSize:10,color:"#444" }}>{expanded?"▲":"▼"}</span>}
          </div>
        </div>
      </div>

      {match.isFinished && expanded && (
        <div style={{ padding:"0 4px" }}>
          {prediction && <ScoreBreakdown pred={prediction} match={match}/>}
          {showOtherPreds && showOtherPreds.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:10,color:"#444",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6 }}>👀 Predicțiile prietenilor</div>
              {showOtherPreds.map((p,i)=>{
                const isEx=p.scoreA===match.realScoreA&&p.scoreB===match.realScoreB;
                const ppts = calcPoints({scoreA:p.scoreA,scoreB:p.scoreB,possession:p.possession,corners:p.corners}, match);
                return <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderRadius:8,marginBottom:4,background:isEx?"rgba(0,229,160,0.07)":"rgba(255,255,255,0.02)",border:`1px solid ${isEx?"rgba(0,229,160,0.15)":"rgba(255,255,255,0.04)"}`,animation:`revealFlip 0.4s ${i*0.08}s cubic-bezier(0.34,1.2,0.64,1) both` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:24,height:24,borderRadius:"50%",background:`hsl(${i*60+150},55%,35%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff" }}>{p.nickname[0]}</div>
                    <span style={{ fontSize:12,color:"#ccc",fontWeight:600 }}>{p.nickname}</span>
                    {isEx&&<span style={{ fontSize:10,color:"#00E5A0" }}>🎯 Exact!</span>}
                  </div>
                  <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                    <span style={{ fontSize:13,fontWeight:800,color:isEx?"#00E5A0":"#fff",fontFamily:"'DM Mono',monospace" }}>{p.scoreA}–{p.scoreB}</span>
                    <span style={{ fontSize:11,color:"#FFD700",fontWeight:700,fontFamily:"'DM Mono',monospace" }}>{ppts}p</span>
                  </div>
                </div>;
              })}
            </div>
          )}
        </div>
      )}

      {match.isLocked && !match.isFinished && prediction && (
        <div style={{ padding:"6px 8px",marginTop:-4,background:"rgba(255,107,107,0.06)",border:"1px solid rgba(255,107,107,0.1)",borderTop:"none",borderRadius:"0 0 12px 12px",fontSize:11,color:"#FF6B6B55",textAlign:"center" }}>
          🔒 Predicțiile prietenilor vizibile după meci
        </div>
      )}
      {isEditable && <PopularPicks matchId={match.id} prediction={prediction}/>}
    </div>
  );
}

function LiveFeed() {
  const [expanded, setExpanded] = useState(false);
  const latest = LIVE_FEED_EVENTS[0];
  return (
    <div style={{ marginBottom:8,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden",position:"relative" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,#00E5A0,#4A9EFF,transparent)",animation:"scanline 3s linear infinite",opacity:0.5 }}/>
      <div style={{ display:"flex",alignItems:"center",gap:9,padding:"9px 12px" }}>
        <div style={{ width:6,height:6,borderRadius:"50%",background:"#00E5A0",flexShrink:0,animation:"livePulse 1.8s infinite" }}/>
        <span style={{ fontSize:9,fontWeight:800,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",flexShrink:0 }}>Feed</span>
        <span style={{ fontSize:11,color:"#666",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
          <span style={{ marginRight:6 }}>{latest.icon}</span>{latest.text}
        </span>
        {latest.pts && <span style={{ fontSize:10,fontWeight:800,color:TYPE_COLOR[latest.type]||"#444",fontFamily:"'DM Mono',monospace",flexShrink:0 }}>{latest.pts}</span>}
        <button onClick={()=>setExpanded(e=>!e)} style={{ background:"none",border:"none",color:"#2a2a2a",fontSize:11,cursor:"pointer",padding:"0 2px",flexShrink:0 }}>
          {expanded?"▲":"▼"}
        </button>
      </div>
      {expanded && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.04)",padding:"6px 12px 10px",display:"flex",flexDirection:"column",gap:5 }}>
          {LIVE_FEED_EVENTS.slice(1).map((ev, i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:8,animation:`slideIn 0.25s ${i*0.03}s both` }}>
              <span style={{ fontSize:12,flexShrink:0 }}>{ev.icon}</span>
              <span style={{ fontSize:10,color:"#555",flex:1,lineHeight:1.3 }}>{ev.text}</span>
              <span style={{ fontSize:8,color:"#2a2a2a",flexShrink:0 }}>{ev.ago}</span>
              {ev.pts && <span style={{ fontSize:9,fontWeight:800,color:TYPE_COLOR[ev.type]||"#444",fontFamily:"'DM Mono',monospace",flexShrink:0 }}>{ev.pts}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PerfectHitOverlay({ pts, onDone }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 3200);
    const t3 = setTimeout(() => onDone(), 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  const particles = [
    {x:20,y:30,c:"#FFD700",s:6},{x:75,y:20,c:"#00E5A0",s:4},{x:50,y:15,c:"#fff",s:3},
    {x:85,y:55,c:"#FFD700",s:5},{x:10,y:65,c:"#4A9EFF",s:4},{x:60,y:80,c:"#00E5A0",s:6},
    {x:35,y:85,c:"#FFD700",s:3},{x:90,y:35,c:"#fff",s:4},{x:25,y:50,c:"#FF9800",s:5},
  ];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,0.92)",
      opacity: phase===0?0:phase===2?0:1,
      transition: phase===2?"opacity 0.5s ease":"opacity 0.15s ease",
      pointerEvents:"auto" }} onClick={onDone}>
      {phase===1 && particles.map((p,i) => (
        <div key={i} style={{ position:"absolute",left:`${p.x}%`,top:`${p.y}%`,
          width:p.s,height:p.s,borderRadius:"50%",background:p.c,
          animation:`particlePop 1.2s ${i*0.08}s ease-out forwards`,
          pointerEvents:"none" }}/>
      ))}
      <div style={{ textAlign:"center",animation:phase===1?"celebrationPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both":"none",padding:"0 32px" }}>
        <div style={{ width:100,height:100,borderRadius:"50%",margin:"0 auto 20px",
          background:"linear-gradient(135deg,#FFD700,#FF9800)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 0 0 0 rgba(255,215,0,0.4)",
          animation:"goldRing 1.5s ease-out forwards" }}>
          <div style={{ fontSize:44,lineHeight:1 }}>🎯</div>
        </div>
        <div style={{ fontSize:11,color:"rgba(255,215,0,0.6)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8,fontWeight:700 }}>Perfect Hit</div>
        <div style={{ fontSize:52,fontWeight:900,color:"#FFD700",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.06em",lineHeight:1,textShadow:"0 0 32px rgba(255,215,0,0.5)",marginBottom:4 }}>+{pts} PTS</div>
        <div style={{ fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:24 }}>Scor, posesie și cornere — toate exacte</div>
        <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",
          background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.25)",
          borderRadius:24,animation:"breatheGold 1.8s ease-in-out infinite" }}>
          <span style={{ fontSize:11,color:"#FFD700",fontWeight:700,letterSpacing:"0.06em" }}>CLASAMENTUL SE ACTUALIZEAZĂ</span>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"#FFD700",animation:"livePulse 1.4s infinite" }}/>
        </div>
        <div style={{ marginTop:20,fontSize:11,color:"rgba(255,255,255,0.2)" }}>atinge pentru a închide</div>
      </div>
    </div>
  );
}

function MatchHype({ match, prediction }) {
  const picks = POPULAR_PICKS[match.id];
  const topScore = MOST_PREDICTED[match.id];
  if (!picks || match.isLocked || match.isFinished) return null;
  const max = Math.max(picks.homeWin, picks.draw, picks.awayWin);
  const labels = ["1","X","2"];
  const pcts   = [picks.homeWin, picks.draw, picks.awayWin];
  const userResult = prediction
    ? (prediction.scoreA > prediction.scoreB ? 0 : prediction.scoreA < prediction.scoreB ? 2 : 1)
    : null;
  return (
    <div style={{ marginBottom:6,padding:"11px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12 }}>
      <div style={{ display:"flex",gap:5,marginBottom:9 }}>
        {pcts.map((pct, i) => {
          const isUser = userResult === i;
          const isTop  = pct === max;
          return (
            <div key={i} style={{ flex:1,textAlign:"center" }}>
              <div style={{ fontSize:10,fontWeight:800,color:isUser?"#00E5A0":isTop?"#ddd":"#444",marginBottom:4 }}>{labels[i]}</div>
              <div style={{ height:3,borderRadius:2,background:isUser?"#00E5A0":isTop?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)",marginBottom:4 }}/>
              <div style={{ fontSize:13,fontWeight:900,color:isUser?"#00E5A0":isTop?"#fff":"#333",fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
            </div>
          );
        })}
      </div>
      {topScore && (
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:7,borderTop:"1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize:9,color:"#3a3a3a",letterSpacing:"0.08em",textTransform:"uppercase" }}>Scor cel mai prezis</span>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:14,fontWeight:900,color:"#4A9EFF",fontFamily:"'DM Mono',monospace" }}>
              {topScore.scoreA}–{topScore.scoreB}
            </span>
            <span style={{ fontSize:9,color:"#444" }}>({topScore.pct}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveMatchView({ match, predictions, peerPreds, onClose }) {
  const live = LIVE_STUB;
  const picks = POPULAR_PICKS[match.id];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)",display:"flex",flexDirection:"column",justifyContent:"flex-end",animation:"fadeIn 0.18s" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"linear-gradient(180deg,#0D1911,#080C09)",borderRadius:"22px 22px 0 0",padding:"20px 18px 36px",border:"1px solid rgba(255,255,255,0.07)",borderBottom:"none",maxHeight:"88dvh",overflowY:"auto",animation:"slideUp 0.28s cubic-bezier(0.32,1.2,0.64,1)" }}>
        <div style={{ width:36,height:3,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 16px" }}/>
        <div style={{ textAlign:"center",marginBottom:16 }}>
          <div style={{ fontSize:9,color:"#FF4444",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:800,marginBottom:6 }}>
            {live.matchStatus==="live"?"🔴 Live":"🔒 Blocat"} · {match.venue}
          </div>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:14 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:30 }}>{match.flagA}</div>
              <div style={{ fontSize:11,fontWeight:700,color:"#ddd",marginTop:3 }}>{match.teamA}</div>
            </div>
            <div style={{ textAlign:"center",padding:"8px 16px",background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)" }}>
              {live.liveHomeScore !== null
                ? <div style={{ fontSize:28,fontWeight:900,color:"#fff",fontFamily:"'DM Mono',monospace" }}>{live.liveHomeScore}–{live.liveAwayScore}</div>
                : <div style={{ fontSize:11,color:"#333",lineHeight:1.4 }}>Live score<br/><span style={{ fontSize:9 }}>coming soon</span></div>}
              {live.matchMinute && <div style={{ fontSize:9,color:"#FF4444",marginTop:2 }}>{live.matchMinute}'</div>}
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:30 }}>{match.flagB}</div>
              <div style={{ fontSize:11,fontWeight:700,color:"#ddd",marginTop:3 }}>{match.teamB}</div>
            </div>
          </div>
        </div>
        {picks && (
          <div style={{ display:"flex",gap:5,marginBottom:14 }}>
            {[{l:"1",p:picks.homeWin},{l:"X",p:picks.draw},{l:"2",p:picks.awayWin}].map((o,i)=>(
              <div key={i} style={{ flex:1,textAlign:"center",padding:"7px 4px",borderRadius:9,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:10,fontWeight:800,color:"#666",marginBottom:3 }}>{o.l}</div>
                <div style={{ fontSize:15,fontWeight:900,color:"#fff",fontFamily:"'DM Mono',monospace" }}>{o.p}%</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize:9,color:"#3a3a3a",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,fontWeight:700 }}>Predicțiile prietenilor</div>
        {peerPreds.map((p,i)=>(
          <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:10,marginBottom:5,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",animation:`revealFlip 0.35s ${i*0.07}s both` }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:26,height:26,borderRadius:"50%",background:`hsl(${i*60+150},50%,32%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff" }}>{p.nickname[0]}</div>
              <span style={{ fontSize:12,color:"#bbb",fontWeight:600 }}>{p.nickname}</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontSize:14,fontWeight:900,color:"#fff",fontFamily:"'DM Mono',monospace" }}>{p.scoreA}–{p.scoreB}</span>
              <span style={{ fontSize:10,color:"#4A9EFF77" }}>📊 {p.possession}%</span>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width:"100%",marginTop:14,padding:14,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#666",fontSize:13,fontWeight:700,cursor:"pointer" }}>
          Închide
        </button>
      </div>
    </div>
  );
}

function NextMatchHero({ match, prediction, onPredict }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!match) return null;
  const kickoff    = new Date(match.time).getTime();
  const msToKick   = kickoff - now;
  const msToLock   = kickoff - LOCK_BEFORE_MS - now;
  const isEditable = msToLock > 0;
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
    <div style={{ margin:"10px 0 8px",background:"linear-gradient(135deg,rgba(74,158,255,0.06),rgba(0,229,160,0.04))",border:`1px solid ${soonLocking?"rgba(255,193,7,0.28)":"rgba(255,255,255,0.08)"}`,borderRadius:18,padding:"14px 16px",position:"relative",overflow:"hidden",animation:soonLocking?"lockGlow 2.4s ease-in-out infinite":"none" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#4A9EFF,#00E5A0)" }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11 }}>
        <div style={{ fontSize:9,color:"#4A9EFF88",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:800 }}>
          Următor meci · Gr. {match.group}
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {kickdownLabel && (
            <div style={{ fontSize:9,fontWeight:800,color:"#4A9EFF",background:"rgba(74,158,255,0.1)",padding:"2px 7px",borderRadius:10 }}>
              ⏱ {kickdownLabel}
            </div>
          )}
          {lockdownLabel && soonLocking && (
            <div style={{ fontSize:9,fontWeight:800,color:"#FFC107",background:"rgba(255,193,7,0.1)",padding:"2px 7px",borderRadius:10,animation:"livePulse 1.8s infinite" }}>
              ⚠ lock {lockdownLabel}
            </div>
          )}
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:34,lineHeight:1,marginBottom:4 }}>{match.flagA}</div>
          <div style={{ fontSize:13,fontWeight:800,color:"#fff" }}>{match.teamA}</div>
        </div>
        <div style={{ textAlign:"center",padding:"0 10px" }}>
          <div style={{ fontSize:13,color:"#2a2a2a",fontWeight:700,letterSpacing:"0.08em" }}>vs</div>
          {prediction && (
            <div style={{ fontSize:10,color:"rgba(0,229,160,0.6)",fontFamily:"'DM Mono',monospace",marginTop:3,fontWeight:700 }}>
              {prediction.scoreA}–{prediction.scoreB}
            </div>
          )}
        </div>
        <div style={{ flex:1,textAlign:"center" }}>
          <div style={{ fontSize:34,lineHeight:1,marginBottom:4 }}>{match.flagB}</div>
          <div style={{ fontSize:13,fontWeight:800,color:"#fff" }}>{match.teamB}</div>
        </div>
      </div>
      <button
        onClick={() => isEditable && onPredict(match)}
        disabled={!isEditable}
        style={{ width:"100%",padding:"11px",borderRadius:12,border:"none",cursor:isEditable?"pointer":"default",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.06em",fontSize:14,fontWeight:900,transition:"all 0.2s",
          background: prediction
            ? isEditable ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.04)"
            : isEditable ? "linear-gradient(135deg,#00E5A0,#00C27A)" : "rgba(255,255,255,0.04)",
          color: prediction
            ? isEditable ? "#00E5A0" : "#444"
            : isEditable ? "#060C09" : "#444",
          boxShadow: prediction || !isEditable ? "none" : "0 4px 20px rgba(0,229,160,0.2)",
        }}>
        {!isEditable ? "🔒 Predicție blocată"
          : prediction ? `✏ Editează predicția · ${prediction.scoreA}–${prediction.scoreB}`
          : "+ Adaugă predicția acum"}
      </button>
    </div>
  );
}

function MatchesScreen({ predictions, onPredict }) {
  const [activeGroup, setActiveGroup] = useState("all");
  const [liveViewMatch, setLiveViewMatch] = useState(null);

  const finished = MATCHES.filter(m=>m.isFinished);
  const locked   = MATCHES.filter(m=>{ const s=matchLockState(m).state; return (s==="locked"||s==="soon"||s==="live")&&!m.isFinished; });
  const upcoming = MATCHES.filter(m=>matchLockState(m).state==="open"&&!m.isFinished);

  const nextMatch = [...upcoming].sort((a,b)=>new Date(a.time)-new Date(b.time))[0] || null;
  const filter = m => activeGroup==="all" || m.group===activeGroup;
  const upcomingRest = upcoming.filter(m => m.id !== nextMatch?.id);

  return (
    <div style={{ padding:"0 16px" }}>
      <NextMatchHero match={nextMatch} prediction={predictions[nextMatch?.id]} onPredict={onPredict}/>
      <LiveFeed/>

      {locked.filter(m=>matchLockState(m).state==="live").length > 0 && (
        <div style={{ marginBottom:8 }}>
          {locked.filter(m=>matchLockState(m).state==="live").map(m=>(
            <button key={m.id} onClick={()=>setLiveViewMatch(m)}
              style={{ width:"100%",padding:"10px 14px",background:"rgba(255,50,50,0.08)",border:"1px solid rgba(255,50,50,0.2)",borderRadius:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:7,height:7,borderRadius:"50%",background:"#FF4444",animation:"livePulse 1.4s infinite" }}/>
                <span style={{ fontSize:12,fontWeight:700,color:"#FF6B6B" }}>{m.flagA} {m.teamA} vs {m.teamB} {m.flagB}</span>
              </div>
              <span style={{ fontSize:11,color:"#FF6B6B77",fontWeight:600 }}>Vezi predicțiile →</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display:"flex",gap:6,overflowX:"auto",padding:"6px 0 8px",scrollbarWidth:"none" }}>
        {["all",...GROUPS].map(g=>(
          <button key={g} onClick={()=>setActiveGroup(g)} style={{ flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${activeGroup===g?"#00E5A0":"rgba(255,255,255,0.08)"}`,background:activeGroup===g?"rgba(0,229,160,0.12)":"rgba(255,255,255,0.03)",color:activeGroup===g?"#00E5A0":"#555",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.06em" }}>
            {g==="all"?"Toate":`Gr. ${g}`}
          </button>
        ))}
      </div>

      {finished.filter(filter).length>0&&<>
        <div style={{ fontSize:9,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",margin:"6px 0 6px",fontWeight:700 }}>✓ Terminate — atinge pentru detalii</div>
        {finished.filter(filter).map(m=>(
          <MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={()=>{}} showOtherPreds={MOCK_PREDICTIONS_FINISHED}/>
        ))}
      </>}
      {locked.filter(filter).length>0&&<>
        <div style={{ fontSize:9,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",margin:"10px 0 6px",fontWeight:700 }}>🔴 În desfășurare</div>
        {locked.filter(filter).map(m=><MatchCard key={m.id} match={m} prediction={predictions[m.id]} onPredict={()=>{}}/>)}
      </>}
      {upcomingRest.filter(filter).length>0&&<>
        <div style={{ fontSize:9,color:"#333",letterSpacing:"0.12em",textTransform:"uppercase",margin:"10px 0 6px",fontWeight:700 }}>⏱ Toate meciurile viitoare</div>
        {upcomingRest.filter(filter).map(m=>(
          <div key={m.id}>
            <MatchHype match={m} prediction={predictions[m.id]}/>
            <MatchCard match={m} prediction={predictions[m.id]} onPredict={onPredict}/>
          </div>
        ))}
      </>}

      {liveViewMatch && (
        <LiveMatchView
          match={liveViewMatch}
          predictions={predictions}
          peerPreds={MOCK_PREDICTIONS_FINISHED}
          onClose={()=>setLiveViewMatch(null)}
        />
      )}
    </div>
  );
}

export default MatchesScreen;
