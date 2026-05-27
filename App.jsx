import { useState } from 'react';
import CSS from './styles.js';
import { MATCHES, calcBreakdown, calcPoints } from './data.js';
import { LoginScreen, NicknameScreen } from './AuthScreens.jsx';
import MatchesScreen from './MatchesScreen.jsx';
import LeaderboardScreen from './LeaderboardScreen.jsx';
import AdminScreen from './AdminScreen.jsx';
import HowToPlayScreen from './HowToPlayScreen.jsx';
import PredictionModal from './PredictionModal.jsx';

// ─── VERSION ─────────────────────────────────────────────────────────────────
export const APP_VERSION = 'v0.2-alpha';

// ─── PERFECT HIT OVERLAY ─────────────────────────────────────────────────────
function PerfectHitOverlay({ pts, onDone }) {
  const particles = [
    {x:20,y:30,c:"#FFD700",s:6},{x:75,y:20,c:"#00E5A0",s:4},{x:50,y:15,c:"#fff",s:3},
    {x:85,y:55,c:"#FFD700",s:5},{x:10,y:65,c:"#4A9EFF",s:4},{x:60,y:80,c:"#00E5A0",s:6},
    {x:35,y:85,c:"#FFD700",s:3},{x:90,y:35,c:"#fff",s:4},{x:25,y:50,c:"#FF9800",s:5},
  ];
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.92)",animation:"fadeIn 0.15s ease" }} onClick={onDone}>
      {particles.map((p,i) => (
        <div key={i} style={{ position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,borderRadius:"50%",background:p.c,animation:`particlePop 1.2s ${i*0.08}s ease-out forwards`,pointerEvents:"none" }}/>
      ))}
      <div style={{ textAlign:"center",animation:"celebrationPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",padding:"0 32px" }}>
        <div style={{ width:100,height:100,borderRadius:"50%",margin:"0 auto 20px",background:"linear-gradient(135deg,#FFD700,#FF9800)",display:"flex",alignItems:"center",justifyContent:"center",animation:"goldRing 1.5s ease-out forwards" }}>
          <div style={{ fontSize:44,lineHeight:1 }}>🎯</div>
        </div>
        <div style={{ fontSize:11,color:"rgba(255,215,0,0.6)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8,fontWeight:700 }}>Perfect Hit</div>
        <div style={{ fontSize:52,fontWeight:900,color:"#FFD700",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.06em",lineHeight:1,textShadow:"0 0 32px rgba(255,215,0,0.5)",marginBottom:4 }}>+{pts} PTS</div>
        <div style={{ fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:24 }}>Scor, posesie și cornere — toate exacte</div>
        <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",background:"rgba(255,215,0,0.1)",border:"1px solid rgba(255,215,0,0.25)",borderRadius:24,animation:"breatheGold 1.8s ease-in-out infinite" }}>
          <span style={{ fontSize:11,color:"#FFD700",fontWeight:700,letterSpacing:"0.06em" }}>CLASAMENTUL SE ACTUALIZEAZĂ</span>
          <div style={{ width:8,height:8,borderRadius:"50%",background:"#FFD700",animation:"livePulse 1.4s infinite" }}/>
        </div>
        <div style={{ marginTop:20,fontSize:11,color:"rgba(255,255,255,0.2)" }}>atinge pentru a închide</div>
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
    { id: 'matches',     label: 'Meciuri',   icon: '⚽' },
    { id: 'leaderboard', label: 'Clasament',  icon: '🏆' },
    { id: 'rules',       label: 'Reguli',     icon: '📋' },
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
    <div style={{ fontFamily:"'Syne',sans-serif",background:"#080C09",minHeight:"100dvh",color:"#fff",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column" }}>

      {/* ── Header ── */}
      <div style={{ position:"sticky",top:0,zIndex:50,background:"rgba(8,12,9,0.94)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"12px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:9,color:"rgba(0,229,160,0.35)",letterSpacing:"0.15em",textTransform:"uppercase" }}>FIFA World Cup 2026</div>
          <div style={{ fontSize:17,fontWeight:900,color:"#fff",lineHeight:1.1 }}>
            Predicții ⚽{' '}
            <span style={{ fontSize:8,color:"#1e1e1e",fontWeight:400,fontFamily:"'DM Mono',monospace" }}>{APP_VERSION}</span>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {totalPts > 0 && (
            <div style={{ background:"rgba(0,229,160,0.1)",border:"1px solid rgba(0,229,160,0.2)",borderRadius:20,padding:"4px 11px",fontSize:13,fontWeight:800,color:"#00E5A0",fontFamily:"'DM Mono',monospace" }}>
              {totalPts} pts
            </div>
          )}
          <div
            onClick={() => { const t = adminTaps + 1; setAdminTaps(t); if (t >= 5) { setAdminMode(true); setAdminTaps(0); } }}
            style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#4285F4,#34A853)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,cursor:"pointer",border:adminMode?"2px solid #FF6B6B":"none" }}>
            {user.nickname[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Admin banner ── */}
      {adminMode && (
        <div style={{ background:"rgba(255,107,107,0.1)",borderBottom:"1px solid rgba(255,107,107,0.2)",padding:"8px 16px",display:"flex",justifyContent:"space-between",fontSize:12,color:"#FF6B6B" }}>
          <span>⚙️ Mod admin</span>
          <span style={{ cursor:"pointer" }} onClick={() => setAdminMode(false)}>Ieși ×</span>
        </div>
      )}

      {/* ── Screen content ── */}
      <div style={{ flex:1,overflowY:"auto",paddingBottom:90 }}>
        {adminMode ? <AdminScreen/> :
         tab === 'matches'     ? <MatchesScreen predictions={predictions} onPredict={setPredictingMatch}/> :
         tab === 'leaderboard' ? <LeaderboardScreen currentUser={user.nickname} predictions={predictions}/> :
         <HowToPlayScreen/>}
      </div>

      {/* ── Tab bar ── */}
      {!adminMode && (
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(8,12,9,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.05)",padding:"9px 16px 20px",display:"flex",justifyContent:"space-around" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:tab===t.id?"#00E5A0":"#333",transition:"color 0.18s",padding:"5px 0",position:"relative" }}>
              {tab === t.id && <div style={{ position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",width:18,height:2,borderRadius:1,background:"#00E5A0",boxShadow:"0 0 6px rgba(0,229,160,0.5)" }}/>}
              <span style={{ fontSize:21,lineHeight:1 }}>{t.icon}</span>
              <span style={{ fontSize:9,fontWeight:tab===t.id?800:400,letterSpacing:"0.05em" }}>{t.label}</span>
            </button>
          ))}
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
