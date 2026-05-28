import { useState } from 'react';
import CSS from './styles.js';
import { MATCHES, calcBreakdown, calcPoints } from './data.js';
import { LoginScreen, NicknameScreen } from './AuthScreens.jsx';
import MatchesScreen from './MatchesScreen.jsx';
import LeaderboardScreen from './LeaderboardScreen.jsx';
import AdminScreen from './AdminScreen.jsx';
import HowToPlayScreen from './HowToPlayScreen.jsx';
import PredictionModal from './PredictionModal.jsx';

export const APP_VERSION = 'PREMIUM v1';

// ─── PERFECT HIT OVERLAY ─────────────────────────────────────────────────────
function PerfectHitOverlay({ pts, onDone }) {
  const particles = [
    {x:20,y:30,c:"#FFD700",s:6},{x:75,y:20,c:"#fff",s:4},{x:50,y:15,c:"#fff",s:3},
    {x:85,y:55,c:"#FFD700",s:5},{x:10,y:65,c:"#fff",s:4},{x:60,y:80,c:"#FFD700",s:6},
    {x:35,y:85,c:"#FFD700",s:3},{x:90,y:35,c:"#fff",s:4},{x:25,y:50,c:"#FFD700",s:5},
  ];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.94)",backdropFilter:"blur(8px)",animation:"fadeIn 0.15s ease" }} onClick={onDone}>
      {particles.map((p,i) => (
        <div key={i} style={{ position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,borderRadius:"50%",background:p.c,animation:`particlePop 1.2s ${i*0.08}s ease-out forwards`,pointerEvents:"none" }}/>
      ))}
      <div style={{ textAlign:"center",animation:"celebrationPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",padding:"0 32px" }}>
        <div style={{ width:88,height:88,borderRadius:"50%",margin:"0 auto 20px",background:"rgba(212,175,55,0.12)",border:"1px solid rgba(212,175,55,0.3)",display:"flex",alignItems:"center",justifyContent:"center",animation:"goldRing 1.5s ease-out forwards" }}>
          <div style={{ fontSize:38,lineHeight:1 }}>🎯</div>
        </div>
        <div style={{ fontSize:10,color:"rgba(212,175,55,0.5)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8,fontWeight:700 }}>Predicție Perfectă</div>
        <div style={{ fontSize:52,fontWeight:900,color:"#fff",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em",lineHeight:1,marginBottom:6 }}>+{pts} PTS</div>
        <div style={{ fontSize:13,color:"rgba(255,255,255,0.35)",marginBottom:24 }}>Scor, posesie și cornere — toate exacte</div>
        <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",background:"rgba(212,175,55,0.08)",border:"1px solid rgba(212,175,55,0.2)",borderRadius:8 }}>
          <span style={{ fontSize:10,color:"rgba(212,175,55,0.7)",fontWeight:700,letterSpacing:"0.08em" }}>CLASAMENTUL SE ACTUALIZEAZĂ</span>
        </div>
        <div style={{ marginTop:20,fontSize:10,color:"rgba(255,255,255,0.15)" }}>atinge pentru a închide</div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage]                     = useState('login');
  const [googleUser, setGoogleUser]           = useState(null);
  const [user, setUser]                       = useState(null);
  const [tab, setTab]                         = useState('matches');
  const [predictions, setPredictions]         = useState({});
  const [predictingMatch, setPredictingMatch] = useState(null);
  const [adminMode, setAdminMode]             = useState(false);
  const [adminTaps, setAdminTaps]             = useState(0);
  const [perfectHit, setPerfectHit]           = useState(null);

  const totalPts = Object.entries(predictions).reduce((sum, [id, p]) => {
    const m = MATCHES.find(x => x.id === Number(id));
    return sum + (m?.isFinished ? calcPoints(p, m) || 0 : 0);
  }, 0);

  const handleSavePrediction = (id, pred) => {
    setPredictions(prev => {
      const next = { ...prev, [id]: pred };
      const m = MATCHES.find(m => m.id === Number(id));
      if (m?.isFinished) {
        const b = calcBreakdown(pred, m);
        if (b?.isPerfect) setPerfectHit({ pts: b.total });
      }
      return next;
    });
  };

  const TABS = [
    { id: 'matches',     label: 'Meciuri',  icon: '⚽' },
    { id: 'leaderboard', label: 'Clasament', icon: '🏆' },
    { id: 'rules',       label: 'Reguli',    icon: '📋' },
  ];

  if (stage === 'login') return (
    <><style>{CSS}</style>
    <div style={{ fontFamily:"'Syne',sans-serif" }}>
      <LoginScreen onGoogleLogin={g => { setGoogleUser(g); setStage('pick-nick'); }}/>
    </div></>
  );

  if (stage === 'pick-nick') return (
    <><style>{CSS}</style>
    <div style={{ fontFamily:"'Syne',sans-serif" }}>
      <NicknameScreen
        googleUser={googleUser}
        onComplete={nick => { setUser({ nickname: nick, ...googleUser }); setStage('app'); }}
      />
    </div></>
  );

  return (
    <><style>{CSS}</style>
    <div style={{
      fontFamily:"'Space Grotesk','Syne',sans-serif",
      background:"#0D1117",
      minHeight:"100dvh",color:"#fff",maxWidth:430,margin:"0 auto",
      display:"flex",flexDirection:"column",position:"relative",
    }}>

      {/* ── Header ── */}
      <div style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(13,17,23,0.95)",
        backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        padding:"13px 18px 12px",
        display:"flex",justifyContent:"space-between",alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:9,color:"rgba(212,175,55,0.55)",letterSpacing:"0.2em",textTransform:"uppercase",fontWeight:700,marginBottom:1 }}>FIFA World Cup 2026</div>
          <div style={{ fontSize:18,fontWeight:800,color:"#fff",lineHeight:1.1,letterSpacing:"-0.02em" }}>
            World Cup Arena
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {totalPts > 0 && (
            <div style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"4px 11px",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.8)",fontFamily:"'DM Mono',monospace" }}>
              {totalPts} pts
            </div>
          )}
          <div
            onClick={() => { const t = adminTaps + 1; setAdminTaps(t); if (t >= 5) { setAdminMode(true); setAdminTaps(0); } }}
            style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.08)",border:adminMode?"2px solid rgba(239,68,68,0.6)":"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,cursor:"pointer",color:"rgba(255,255,255,0.7)" }}>
            {user.nickname[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Admin banner ── */}
      {adminMode && (
        <div style={{ background:"rgba(239,68,68,0.08)",borderBottom:"1px solid rgba(239,68,68,0.15)",padding:"8px 18px",display:"flex",justifyContent:"space-between",fontSize:12,color:"rgba(239,68,68,0.8)" }}>
          <span>Mod admin</span>
          <span style={{ cursor:"pointer",opacity:0.6 }} onClick={() => setAdminMode(false)}>Ieși ×</span>
        </div>
      )}

      {/* ── Screen content ── */}
      <div style={{ flex:1,overflowY:"auto",paddingBottom:88 }}>
        {adminMode ? <AdminScreen/> :
         tab === 'matches'     ? <MatchesScreen predictions={predictions} onPredict={setPredictingMatch}/> :
         tab === 'leaderboard' ? <LeaderboardScreen currentUser={user.nickname} predictions={predictions}/> :
         <HowToPlayScreen/>}
      </div>

      {/* ── Tab bar ── */}
      {!adminMode && (
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(13,17,23,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.07)",padding:"10px 12px 22px",display:"flex",justifyContent:"space-around",gap:4 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:active?"rgba(255,255,255,0.07)":"transparent",border:active?"1px solid rgba(255,255,255,0.1)":"1px solid transparent",borderRadius:10,cursor:"pointer",color:active?"#fff":"rgba(255,255,255,0.35)",transition:"all 0.15s",padding:"7px 0" }}>
                <span style={{ fontSize:19,lineHeight:1 }}>{t.icon}</span>
                <span style={{ fontSize:9,fontWeight:active?700:400,letterSpacing:"0.05em",textTransform:"uppercase" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Prediction modal ── */}
      {predictingMatch && (
        <PredictionModal
          match={predictingMatch}
          existing={predictions[predictingMatch.id]}
          onSave={handleSavePrediction}
          onClose={() => setPredictingMatch(null)}
        />
      )}

      {/* ── Perfect hit overlay ── */}
      {perfectHit && <PerfectHitOverlay pts={perfectHit.pts} onDone={() => setPerfectHit(null)}/>}

    </div></>
  );
}
