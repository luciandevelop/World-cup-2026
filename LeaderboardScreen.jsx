import { useState } from 'react';
import {
  MATCHES, QUALIFY_PCT, CURRENT_STAGE, MOCK_PREDICTIONS_FINISHED,
  buildLeaderboard, getBadge, getPredictionStyle, getAvatarRing,
  getRivalryMessage, getPlayerForm,
} from '../lib/data.js';

function LeaderboardScreen({ currentUser, predictions }) {
  // Build allPlayerPreds: merge current user's live predictions with demo peers
  // In production this comes from Supabase; here we simulate 4 friends
  const demoFriends = {
    "RaduGoalz":  { 7: MOCK_PREDICTIONS_FINISHED[0] },
    "AndreiFC":   { 7: MOCK_PREDICTIONS_FINISHED[1] },
    "MihaiUltra": { 7: MOCK_PREDICTIONS_FINISHED[2] },
    "AlexTactic": { 7: MOCK_PREDICTIONS_FINISHED[3] },
  };

  // Convert current user's predictions (keyed by matchId string) to numeric keys
  const myPreds = Object.fromEntries(
    Object.entries(predictions).map(([id, p]) => [Number(id), p])
  );

  const allPlayerPreds = { ...demoFriends, [currentUser]: myPreds };
  const sorted = buildLeaderboard(allPlayerPreds, currentUser);

  const total      = sorted.length;
  const cutoff     = Math.max(1, Math.ceil(total * QUALIFY_PCT));
  const eliminated = total - cutoff;
  const finishedCount = MATCHES.filter(m => m.isFinished).length;

  const my = sorted.find(p => p.nickname === currentUser)
    || { rank:"?", points:0, exactScores:0, lastMatchPts:null, qualified:true };

  const medals = ["🥇","🥈","🥉"];

  // Movement: compare rank to previous snapshot (stored in sessionStorage for demo)
  const getPrevRanks = () => {
    try { return JSON.parse(sessionStorage.getItem("prevRanks")||"{}"); } catch { return {}; }
  };
  const prevRanks = getPrevRanks();
  const getMovement = (nick, rank) => {
    const prev = prevRanks[nick];
    return prev != null ? prev - rank : 0;
  };

  // Biggest climber / dropper among players with movement
  const movements = sorted.map(p => ({ nick: p.nickname, mov: getMovement(p.nickname, p.rank) }));
  const climber = movements.reduce((best, x) => x.mov > best.mov ? x : best, { mov: -Infinity });
  const dropper = movements.reduce((best, x) => x.mov < best.mov ? x : best, { mov: Infinity });

  return (
    <div style={{ padding:"0 16px" }}>

      {/* ── Competition stats bar ── */}
      <div style={{ display:"flex",gap:6,marginTop:12,marginBottom:14 }}>
        {[
          { label:"Jucători",   value: total },
          { label:"Eliminați",  value: eliminated },
          { label:"Meciuri ✓",  value: finishedCount },
          { label:"Etapă",      value: CURRENT_STAGE, wide:true },
        ].map((s,i)=>(
          <div key={i} style={{ flex:s.wide?2:1,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"8px 8px 6px",textAlign:"center" }}>
            <div style={{ fontSize:s.wide?10:15,fontWeight:800,color:"#fff",fontFamily:s.wide?"'Syne',sans-serif":"'DM Mono',monospace",lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:9,color:"#444",marginTop:3,letterSpacing:"0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── My position card — with prediction style + rivalry pressure ── */}
      {(()=>{
        const rivalry = getRivalryMessage(my.rank, my.points, sorted, currentUser);
        const myStyle = getPredictionStyle(my.exactScores, my.points, my.exactScores);
        return (
          <div style={{ background:"linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.04))",border:"1px solid rgba(255,215,0,0.15)",borderRadius:16,padding:"14px 18px",marginBottom:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:9,color:"rgba(255,215,0,0.4)",letterSpacing:"0.1em",textTransform:"uppercase" }}>Tu ești</div>
                <div style={{ fontSize:30,fontWeight:900,color:"#FFD700",fontFamily:"'DM Mono',monospace",lineHeight:1 }}>#{my.rank}</div>
                <div style={{ fontSize:11,color:"#777",marginTop:2 }}>{currentUser}</div>
                <div style={{ marginTop:5,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:20,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize:10 }}>{myStyle.icon}</span>
                  <span style={{ fontSize:9,fontWeight:700,color:myStyle.color,letterSpacing:"0.03em" }}>{myStyle.label}</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:34,fontWeight:900,color:"#FFD700",fontFamily:"'DM Mono',monospace",lineHeight:1 }}>{my.points}</div>
                <div style={{ fontSize:9,color:"rgba(255,215,0,0.3)",letterSpacing:"0.06em" }}>PUNCTE TOTALE</div>
                {my.lastMatchPts !== null && (
                  <div style={{ fontSize:11,color:"#00E5A0",marginTop:3,fontWeight:700 }}>+{my.lastMatchPts} ultimul meci</div>
                )}
                <div style={{ fontSize:10,marginTop:4,color:my.qualified?"#00E5A0":"#FF6B6B",fontWeight:700 }}>
                  {my.qualified ? "✓ Calificat" : "✗ Eliminat"}
                </div>
              </div>
            </div>
            {rivalry && (
              <div style={{ marginTop:10,paddingTop:9,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:7 }}>
                <span style={{ fontSize:12 }}>{rivalry.urgency==="high"?"🔥":rivalry.urgency==="medium"?"⚠":"👀"}</span>
                <span style={{ fontSize:11,color:rivalry.urgency==="high"?"#FF9800":rivalry.urgency==="medium"?"#FFC107":"#666",fontWeight:rivalry.urgency==="high"?700:400,lineHeight:1.4 }}>{rivalry.text}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Biggest climb / drop ── */}
      {climber.mov > 0 && dropper.mov < 0 && (
        <div style={{ display:"flex",gap:8,marginBottom:14 }}>
          <div style={{ flex:1,background:"rgba(0,229,160,0.06)",border:"1px solid rgba(0,229,160,0.14)",borderRadius:12,padding:"9px 12px" }}>
            <div style={{ fontSize:9,color:"#00E5A055",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>↑ Cea mai mare urcare</div>
            <div style={{ fontSize:13,fontWeight:700,color:"#00E5A0" }}>{climber.nick}</div>
            <div style={{ fontSize:10,color:"#00E5A066" }}>+{climber.mov} locuri 🚀</div>
          </div>
          <div style={{ flex:1,background:"rgba(255,107,107,0.06)",border:"1px solid rgba(255,107,107,0.14)",borderRadius:12,padding:"9px 12px" }}>
            <div style={{ fontSize:9,color:"#FF6B6B55",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3 }}>↓ Cea mai mare cădere</div>
            <div style={{ fontSize:13,fontWeight:700,color:"#FF6B6B" }}>{dropper.nick}</div>
            <div style={{ fontSize:10,color:"#FF6B6B66" }}>{dropper.mov} locuri 💀</div>
          </div>
        </div>
      )}

      {/* ── Rows ── */}
      {sorted.map((e, i) => {
        const isMe  = e.nickname === currentUser;
        const mov   = getMovement(e.nickname, e.rank);
        const isQLine = i === cutoff - 1;
        const badge = getBadge(e.exactScores, e.points);
        const pStyle = getPredictionStyle(e.exactScores, e.points, e.exactScores);
        const ring   = getAvatarRing(pStyle);

        return (
          <div key={e.nickname}>
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:13,marginBottom:6,
              background: isMe ? "rgba(255,215,0,0.07)" : !e.qualified ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.035)",
              border:`1px solid ${isMe?"rgba(255,215,0,0.22)":!e.qualified?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.06)"}`,
              opacity: !e.qualified ? 0.6 : 1,
              animation:`slideIn 0.35s ${i*0.05}s both` }}>

              {/* Rank */}
              <div style={{ width:24,textAlign:"center",fontSize:i<3?17:11,color:i<3?"#fff":"#444",fontWeight:700,flexShrink:0 }}>
                {i<3 ? medals[i] : e.rank}
              </div>

              {/* Avatar with identity ring */}
              <div style={{ position:"relative",flexShrink:0 }}>
                <div style={{ width:34,height:34,borderRadius:"50%",padding:2,background:ring,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <div style={{ width:"100%",height:"100%",borderRadius:"50%",background:"#0e1210",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff" }}>
                    {e.nickname[0].toUpperCase()}
                  </div>
                </div>
                {isMe && <div style={{ position:"absolute",bottom:-1,right:-1,width:10,height:10,borderRadius:"50%",background:"#FFD700",border:"2px solid #080C09" }}/>}
              </div>

              {/* Name + form or prediction style */}
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:700,color:isMe?"#FFD700":!e.qualified?"#555":"#fff",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                  {e.nickname}
                  {!e.qualified && <span style={{ fontSize:9,color:"#FF6B6B",marginLeft:5 }}>ELIMINAT</span>}
                </div>
                {(() => {
                  const form = getPlayerForm(e.nickname, e.exactScores, mov);
                  return form
                    ? <div style={{ fontSize:9,color:form.color,marginTop:2,fontWeight:700,opacity:0.85 }}>{form.icon} {form.text}</div>
                    : <div style={{ fontSize:9,color:pStyle.color,marginTop:2,opacity:0.5,fontWeight:600 }}>{pStyle.icon} {pStyle.label}</div>;
                })()}
              </div>

              {/* Points + movement */}
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:16,fontWeight:900,fontFamily:"'DM Mono',monospace",
                  color:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"#777",lineHeight:1 }}>
                  {e.points}
                </div>
                <div style={{ fontSize:9,color:"#444",marginTop:1 }}>🎯 {e.exactScores} exact</div>
                {mov !== 0 && (
                  <div style={{ fontSize:10,fontWeight:700,color:mov>0?"#00E5A0":"#FF6B6B",animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                    {mov>0?`↑${mov}`:`↓${Math.abs(mov)}`}
                  </div>
                )}
              </div>
            </div>
            {/* Qualification cut line */}
            {isQLine && i < sorted.length - 1 && (
              <div style={{ display:"flex",alignItems:"center",gap:8,margin:"6px 0 10px",opacity:0.7 }}>
                <div style={{ flex:1,height:1,background:"rgba(255,107,107,0.25)" }}/>
                <div style={{ fontSize:9,color:"#FF6B6B",fontWeight:700,letterSpacing:"0.08em",whiteSpace:"nowrap" }}>
                  ✂ TOP {Math.round(QUALIFY_PCT*100)}% SE CALIFICĂ
                </div>
                <div style={{ flex:1,height:1,background:"rgba(255,107,107,0.25)" }}/>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ fontSize:9,color:"#222",textAlign:"center",marginTop:10,paddingBottom:8 }}>
        Actualizat după fiecare meci terminat ⚡
      </div>
    </div>
  );
}

export default LeaderboardScreen;
