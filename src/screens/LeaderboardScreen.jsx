// ─── src/screens/LeaderboardScreen.jsx ───────────────────────────────────────
import { useState } from 'react';
import {
  MATCHES, QUALIFY_PCT, CURRENT_STAGE, MOCK_PREDICTIONS_FINISHED,
  buildLeaderboard, getBadge, getPredictionStyle, getAvatarRing,
  getRivalryMessage, getPlayerForm,
} from '../data/gameData.js';
import { FootballAvatar } from '../components/UI.jsx';

export default function LeaderboardScreen({ currentUser, predictions, allPredictions, allUsers, finishedResults }) {
  // When allPredictions is available (Firestore or multi-tab localStorage), use real data.
  // Otherwise fall back to demo friends so the screen never looks empty.
  const hasMPData = allPredictions && Object.keys(allPredictions).length > 1;

  const demoFallback = hasMPData ? {} : {
    "RaduGoalz":  { 13: MOCK_PREDICTIONS_FINISHED[0] },
    "AndreiFC":   { 13: MOCK_PREDICTIONS_FINISHED[1] },
    "MihaiUltra": { 13: MOCK_PREDICTIONS_FINISHED[2] },
    "AlexTactic": { 13: MOCK_PREDICTIONS_FINISHED[3] },
  };

  const myPreds = Object.fromEntries(
    Object.entries(predictions).map(([id, p]) => [Number(id), p])
  );

  // Safe guard — finishedResults may be undefined on first render
  const safeFinishedResults = finishedResults || {};

  // Build live matches FIRST — used by both sorted and finishedCount
  const liveMatches   = buildMatches(safeFinishedResults);
  const liveMatchesFT = liveMatches.filter(m => m.isFinished);
  const finishedCount = liveMatchesFT.length;

  // Merge: real multi-user data + current user always present
  const allPlayerPreds = {
    ...demoFallback,
    ...(allPredictions || {}),
    ...(currentUser ? { [currentUser]: myPreds } : {}),
  };
  const sorted = buildLeaderboard(allPlayerPreds, currentUser || '', liveMatchesFT);

  const total    = sorted.length;
  const cutoff   = Math.max(1, Math.ceil(total * QUALIFY_PCT));
  const eliminated = total - cutoff;

  const my = sorted.find(p => p.nickname === currentUser)
    || { rank:"?", points:0, exactScores:0, lastMatchPts:null, qualified:true };

  const medals = ["🥇","🥈","🥉"];

  const getPrevRanks = () => {
    try { return JSON.parse(sessionStorage.getItem("prevRanks") || "{}"); } catch { return {}; }
  };
  const prevRanks = getPrevRanks();
  const getMovement = (nick, rank) => {
    const prev = prevRanks[nick];
    return prev != null ? prev - rank : 0;
  };

  const movements = sorted.map(p => ({ nick:p.nickname, mov:getMovement(p.nickname, p.rank) }));
  const climber   = movements.reduce((best, x) => x.mov > best.mov ? x : best, { mov:-Infinity });
  const dropper   = movements.reduce((best, x) => x.mov < best.mov ? x : best, { mov:Infinity });

  return (
    <div style={{ padding:"0 14px" }}>

      {/* ── Stats bar ── */}
      <div style={{ display:"flex", gap:6, marginTop:12, marginBottom:14 }}>
        {[
          { label:"Jucători",  value:total },
          { label:"Eliminați", value:eliminated },
          { label:"Meciuri ✓", value:finishedCount },
          { label:"Etapă",     value:CURRENT_STAGE, wide:true },
        ].map((s, i) => (
          <div key={i} style={{ flex:s.wide?2:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"8px 8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:s.wide?10:15, fontWeight:800, color:"#fff", fontFamily:s.wide?"inherit":"'DM Mono',monospace", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:3, letterSpacing:"0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── My position card ── */}
      {(() => {
        const rivalry = getRivalryMessage(my.rank, my.points, sorted, currentUser);
        const myStyle = getPredictionStyle(my.exactScores, my.points, my.exactScores);
        return (
          <div style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.18)", borderRadius:18, padding:"16px 18px", marginBottom:14, animation:"fadeUp 0.3s ease both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <FootballAvatar nickname={currentUser} size={48}/>
                <div>
                  <div style={{ fontSize:9, color:"rgba(212,175,55,0.4)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:2 }}>Tu ești</div>
                  <div style={{ fontSize:32, fontWeight:900, color:"#FFD700", fontFamily:"'DM Mono',monospace", lineHeight:1 }}>#{my.rank}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{currentUser}</div>
                  <div style={{ marginTop:5, display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize:10 }}>{myStyle.icon}</span>
                    <span style={{ fontSize:9, fontWeight:700, color:myStyle.color, letterSpacing:"0.03em" }}>{myStyle.label}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:36, fontWeight:900, color:"#FFD700", fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{my.points}</div>
                <div style={{ fontSize:9, color:"rgba(212,175,55,0.3)", letterSpacing:"0.06em" }}>PUNCTE</div>
                {my.lastMatchPts !== null && (
                  <div style={{ fontSize:11, color:"#00E5A0", marginTop:3, fontWeight:700 }}>+{my.lastMatchPts} ultimul meci</div>
                )}
                <div style={{ fontSize:10, marginTop:4, color:my.qualified?"#00E5A0":"#FF6B6B", fontWeight:700 }}>
                  {my.qualified ? "✓ Calificat" : "✗ Eliminat"}
                </div>
              </div>
            </div>
            {rivalry && (
              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:7 }}>
                <span style={{ fontSize:14 }}>{rivalry.urgency==="high"?"🔥":rivalry.urgency==="medium"?"⚠":"👀"}</span>
                <span style={{ fontSize:11, color:rivalry.urgency==="high"?"#FF9800":rivalry.urgency==="medium"?"#FFC107":"rgba(255,255,255,0.35)", fontWeight:rivalry.urgency==="high"?700:400, lineHeight:1.4 }}>{rivalry.text}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Climber / dropper ── */}
      {climber.mov > 0 && dropper.mov < 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div style={{ flex:1, background:"rgba(0,229,160,0.05)", border:"1px solid rgba(0,229,160,0.12)", borderRadius:12, padding:"9px 12px" }}>
            <div style={{ fontSize:9, color:"rgba(0,229,160,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>↑ Urcuș</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#00E5A0" }}>{climber.nick}</div>
            <div style={{ fontSize:10, color:"rgba(0,229,160,0.5)" }}>+{climber.mov} locuri 🚀</div>
          </div>
          <div style={{ flex:1, background:"rgba(255,107,107,0.05)", border:"1px solid rgba(255,107,107,0.12)", borderRadius:12, padding:"9px 12px" }}>
            <div style={{ fontSize:9, color:"rgba(255,107,107,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>↓ Cădere</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#FF6B6B" }}>{dropper.nick}</div>
            <div style={{ fontSize:10, color:"rgba(255,107,107,0.5)" }}>{dropper.mov} locuri 💀</div>
          </div>
        </div>
      )}

      {/* ── Rows ── */}
      {sorted.map((e, i) => {
        const isMe   = e.nickname === currentUser;
        const mov    = getMovement(e.nickname, e.rank);
        const isQLine = i === cutoff - 1;
        const pStyle = getPredictionStyle(e.exactScores, e.points, e.exactScores);
        const ring   = getAvatarRing(pStyle);

        return (
          <div key={e.nickname}>
            <div style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"11px 12px", borderRadius:14, marginBottom:6,
              background: isMe ? "rgba(212,175,55,0.07)" : !e.qualified ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.035)",
              border:`1px solid ${isMe?"rgba(212,175,55,0.22)":!e.qualified?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.06)"}`,
              opacity: !e.qualified ? 0.6 : 1,
              animation:`staggerIn 0.35s ${Math.min(i,10)*0.04}s both`,
            }}>

              {/* Rank */}
              <div style={{ width:24, textAlign:"center", fontSize:i<3?18:11, color:i<3?"#fff":"rgba(255,255,255,0.25)", fontWeight:700, flexShrink:0 }}>
                {i < 3 ? medals[i] : e.rank}
              </div>

              {/* Football avatar with identity ring */}
              <div style={{ position:"relative", flexShrink:0 }}>
                <div style={{ padding:2, borderRadius:"50%", background:ring, display:"inline-flex" }}>
                  <FootballAvatar nickname={e.nickname} size={34}/>
                </div>
                {isMe && <div style={{ position:"absolute", bottom:-1, right:-1, width:10, height:10, borderRadius:"50%", background:"#FFD700", border:"2px solid #0A0E14" }}/>}
              </div>

              {/* Name + form */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:isMe?"#FFD700":!e.qualified?"rgba(255,255,255,0.3)":"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {e.nickname}
                  {!e.qualified && <span style={{ fontSize:9, color:"#FF6B6B", marginLeft:5 }}>ELIMINAT</span>}
                </div>
                {(() => {
                  const form = getPlayerForm(e.nickname, e.exactScores, mov);
                  return form
                    ? <div style={{ fontSize:9, color:form.color, marginTop:2, fontWeight:700 }}>{form.icon} {form.text}</div>
                    : <div style={{ fontSize:9, color:pStyle.color, marginTop:2, opacity:0.5, fontWeight:600 }}>{pStyle.icon} {pStyle.label}</div>;
                })()}
              </div>

              {/* Points + movement */}
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:16, fontWeight:900, fontFamily:"'DM Mono',monospace", color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.5)", lineHeight:1 }}>
                  {e.points}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:1 }}>🎯 {e.exactScores}</div>
                {mov !== 0 && (
                  <div style={{ fontSize:10, fontWeight:700, color:mov>0?"#00E5A0":"#FF6B6B", animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
                    {mov > 0 ? `↑${mov}` : `↓${Math.abs(mov)}`}
                  </div>
                )}
              </div>
            </div>

            {/* Qualification cut line */}
            {isQLine && i < sorted.length - 1 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0 10px", opacity:0.7 }}>
                <div style={{ flex:1, height:1, background:"rgba(239,68,68,0.25)" }}/>
                <div style={{ fontSize:9, color:"#FF6B6B", fontWeight:700, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                  ✂ TOP {Math.round(QUALIFY_PCT*100)}% SE CALIFICĂ
                </div>
                <div style={{ flex:1, height:1, background:"rgba(239,68,68,0.25)" }}/>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ fontSize:9, color:"rgba(255,255,255,0.1)", textAlign:"center", marginTop:10, paddingBottom:8 }}>
        Actualizat după fiecare meci · {finishedCount} meciuri finalizate ⚡
      </div>
    </div>
  );
}
