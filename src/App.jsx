// ─── src/App.jsx ──────────────────────────────────────────────────────────────
// Main application shell.
// Auth flow: login → pick nickname → app
// Admin: accessible via email whitelist (ADMIN_EMAILS) + 5-tap secret tap
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import CSS from './styles/globalCSS.js';
import { MATCHES, calcBreakdown, calcPoints, ADMIN_EMAILS } from './data/gameData.js';
import { LoginScreen, NicknameScreen } from './screens/AuthScreens.jsx';
import MatchesScreen    from './screens/MatchesScreen.jsx';
import LeaderboardScreen from './screens/LeaderboardScreen.jsx';
import AdminScreen      from './screens/AdminScreen.jsx';
import HowToPlayScreen  from './screens/HowToPlayScreen.jsx';
import PredictionModal  from './components/PredictionModal.jsx';
import { FootballAvatar } from './components/UI.jsx';
import { getPersistedSession, persistSession, saveUserProfile, getUserProfile, signOut } from './services/authService.js';

export const APP_VERSION = 'v2.0';

// ─── PERFECT HIT OVERLAY ──────────────────────────────────────────────────────
function PerfectHitOverlay({ pts, onDone }) {
  const particles = Array.from({length:12}, (_, i) => ({
    x: Math.random()*90+5, y: Math.random()*80+5,
    c: i%3===0?"#FFD700":i%3===1?"#fff":"#00E5A0",
    s: 4 + Math.random()*6,
    tx: (Math.random()-0.5)*160,
    ty: -40 - Math.random()*80,
  }));

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.92)", backdropFilter:"blur(10px)", animation:"fadeIn 0.15s ease" }}
      onClick={onDone}
    >
      {particles.map((p, i) => (
        <div key={i} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:p.s, height:p.s, borderRadius:"50%", background:p.c, animation:`particlePop 1.4s ${i*0.06}s ease-out forwards`, "--tx":`${p.tx}px`, "--ty":`${p.ty}px`, pointerEvents:"none" }}/>
      ))}
      <div style={{ textAlign:"center", animation:"celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both", padding:"0 32px" }}>
        <div style={{ width:88, height:88, borderRadius:"50%", margin:"0 auto 20px", background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", animation:"goldPulse 1.8s ease-out forwards" }}>
          <div style={{ fontSize:38, lineHeight:1 }}>🎯</div>
        </div>
        <div style={{ fontSize:10, color:"rgba(212,175,55,0.5)", letterSpacing:"0.22em", textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>Predicție Perfectă</div>
        <div style={{ fontSize:54, fontWeight:900, color:"#fff", fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"0.04em", lineHeight:1, marginBottom:8 }}>+{pts} PTS</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:24 }}>Scor · posesie · cornere — toate exacte</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.15)" }}>atinge pentru a închide</div>
      </div>
    </div>
  );
}

// ─── PROFILE DRAWER ───────────────────────────────────────────────────────────
function ProfileDrawer({ user, onClose, onLogout, onAdmin }) {
  const isAdmin = ADMIN_EMAILS.includes(user?.email);
  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:80, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)", animation:"fadeIn 0.15s" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ position:"absolute", top:0, right:0, width:260, height:"100%", background:"#0E1520", borderLeft:"1px solid rgba(255,255,255,0.06)", padding:"60px 20px 40px", display:"flex", flexDirection:"column", animation:"slideIn 0.2s ease" }}>
        {/* Avatar */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <FootballAvatar nickname={user?.nickname || "?"} size={64}/>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginTop:12 }}>{user?.nickname}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{user?.email}</div>
        </div>

        <div style={{ flex:1 }}/>

        {/* Admin access */}
        {isAdmin && (
          <button
            onClick={onAdmin}
            style={{ width:"100%", padding:"12px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, color:"#EF4444", fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:8, textAlign:"left" }}
          >
            ⚙️ Panou Admin
          </button>
        )}

        <button
          onClick={onLogout}
          style={{ width:"100%", padding:"12px 16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"rgba(255,255,255,0.5)", fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left" }}
        >
          Deconectează-te
        </button>

        <div style={{ fontSize:9, color:"rgba(255,255,255,0.1)", textAlign:"center", marginTop:16 }}>
          World Cup Arena {APP_VERSION}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [stage, setStage]         = useState('init');   // init | login | pick-nick | app
  const [googleUser, setGoogleUser] = useState(null);
  const [user, setUser]           = useState(null);

  // Navigation
  const [tab, setTab]             = useState('matches');
  const [adminMode, setAdminMode] = useState(false);
  const [adminTaps, setAdminTaps] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Predictions
  const [predictions, setPredictions]       = useState({});
  const [predictingMatch, setPredictingMatch] = useState(null);

  // Overlays
  const [perfectHit, setPerfectHit]         = useState(null);

  // ── Restore session ──
  useEffect(() => {
    const session = getPersistedSession();
    if (session?.uid && session?.nickname) {
      setUser(session);
      // Load saved predictions
      const raw = localStorage.getItem(`preds_${session.uid}`);
      if (raw) try { setPredictions(JSON.parse(raw)); } catch {}
      setStage('app');
    } else {
      setStage('login');
    }
  }, []);

  const totalPts = Object.entries(predictions).reduce((sum, [id, p]) => {
    const m = MATCHES.find(x => x.id === Number(id));
    return sum + (m?.isFinished ? calcPoints(p, m) || 0 : 0);
  }, 0);

  // ── Save prediction ──
  const handleSavePrediction = (id, pred) => {
    const next = { ...predictions, [id]: pred };
    setPredictions(next);
    if (user?.uid) localStorage.setItem(`preds_${user.uid}`, JSON.stringify(next));
    const m = MATCHES.find(m => m.id === Number(id));
    if (m?.isFinished) {
      const b = calcBreakdown(pred, m);
      if (b?.isPerfect) setPerfectHit({ pts:b.total });
    }
  };

  // ── Admin match update (mock — in production: update FINISHED_RESULTS + rebuild) ──
  const handleMatchUpdate = (update) => {
    // In production: mutate Supabase and re-fetch matches
    console.log("[ADMIN] Match update:", update);
  };

  // ── Auth handlers ──
  const handleLogin = (googleData) => {
    setGoogleUser(googleData);
    // Check if user already has a profile (returning user)
    getUserProfile(googleData.uid).then(profile => {
      if (profile?.nickname) {
        const fullUser = { ...googleData, ...profile };
        setUser(fullUser);
        persistSession(fullUser);
        const raw = localStorage.getItem(`preds_${googleData.uid}`);
        if (raw) try { setPredictions(JSON.parse(raw)); } catch {}
        setStage('app');
      } else {
        setStage('pick-nick');
      }
    });
  };

  const handleNickname = async (nick) => {
    const profile = { nickname:nick };
    await saveUserProfile(googleUser.uid, profile);
    const fullUser = { ...googleUser, ...profile };
    setUser(fullUser);
    persistSession(fullUser);
    setStage('app');
  };

  const handleLogout = () => {
    signOut();
    setUser(null);
    setGoogleUser(null);
    setPredictions({});
    setAdminMode(false);
    setShowProfile(false);
    setStage('login');
  };

  // ── Tabs ──
  const TABS = [
    { id:'matches',     label:'Meciuri',   icon:'⚽' },
    { id:'leaderboard', label:'Clasament',  icon:'🏆' },
    { id:'rules',       label:'Cum joci',   icon:'📋' },
  ];

  // ── Render ──
  if (stage === 'init') return (
    <><style>{CSS}</style>
    <div style={{ minHeight:"100dvh", background:"#0A0E14", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:"3px solid rgba(255,255,255,0.08)", borderTopColor:"#00E5A0", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    </div></>
  );

  if (stage === 'login') return (
    <><style>{CSS}</style>
    <div style={{ fontFamily:"'Space Grotesk','Syne',sans-serif" }}>
      <LoginScreen onLogin={handleLogin}/>
    </div></>
  );

  if (stage === 'pick-nick') return (
    <><style>{CSS}</style>
    <div style={{ fontFamily:"'Space Grotesk','Syne',sans-serif" }}>
      <NicknameScreen googleUser={googleUser} onComplete={handleNickname}/>
    </div></>
  );

  return (
    <><style>{CSS}</style>
    <div style={{
      fontFamily:"'Space Grotesk','Syne',sans-serif",
      background:"#0A0E14",
      minHeight:"100dvh", color:"#fff",
      maxWidth:430, margin:"0 auto",
      display:"flex", flexDirection:"column",
      position:"relative",
    }}>

      {/* ── Sticky Header ── */}
      <div style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(10,14,20,0.97)",
        backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        padding:"12px 16px 11px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:8, color:"rgba(212,175,55,0.5)", letterSpacing:"0.22em", textTransform:"uppercase", fontWeight:700, marginBottom:1 }}>FIFA World Cup 2026™</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#fff", lineHeight:1.1, letterSpacing:"-0.02em" }}>
            World Cup Arena
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {totalPts > 0 && (
            <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)", fontFamily:"'DM Mono',monospace" }}>
              {totalPts} pts
            </div>
          )}
          {/* Avatar + tap-for-admin */}
          <div
            onClick={() => {
              const t = adminTaps + 1;
              setAdminTaps(t);
              if (t >= 5) { setAdminMode(true); setAdminTaps(0); }
              else setShowProfile(true);
            }}
            style={{ cursor:"pointer", display:"flex", alignItems:"center" }}
          >
            <div style={{ border:adminMode?"2px solid rgba(239,68,68,0.6)":"2px solid rgba(255,255,255,0.08)", borderRadius:"50%" }}>
              <FootballAvatar nickname={user?.nickname || "?"} size={32}/>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin banner ── */}
      {adminMode && (
        <div style={{ background:"rgba(239,68,68,0.07)", borderBottom:"1px solid rgba(239,68,68,0.15)", padding:"8px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:"rgba(239,68,68,0.8)" }}>
          <span>⚙️ Mod Admin activ</span>
          <span style={{ cursor:"pointer", opacity:0.6, fontSize:14 }} onClick={() => setAdminMode(false)}>× Ieși</span>
        </div>
      )}

      {/* ── Main Content ── */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:86 }}>
        {adminMode
          ? <AdminScreen currentUser={user} onMatchUpdate={handleMatchUpdate}/>
          : tab === 'matches'
          ? <MatchesScreen predictions={predictions} onPredict={setPredictingMatch}/>
          : tab === 'leaderboard'
          ? <LeaderboardScreen currentUser={user?.nickname} predictions={predictions}/>
          : <HowToPlayScreen/>
        }
      </div>

      {/* ── Bottom Tab Bar ── */}
      {!adminMode && (
        <div style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:430,
          background:"rgba(10,14,20,0.98)",
          backdropFilter:"blur(24px)",
          borderTop:"1px solid rgba(255,255,255,0.06)",
          padding:"10px 10px 24px",
          display:"flex", justifyContent:"space-around", gap:4,
        }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  borderRadius:12, cursor:"pointer",
                  color: active ? "#fff" : "rgba(255,255,255,0.3)",
                  transition:"all 0.15s", padding:"7px 4px",
                }}
              >
                <span style={{ fontSize:20, lineHeight:1 }}>{t.icon}</span>
                <span style={{ fontSize:9, fontWeight:active?700:400, letterSpacing:"0.06em", textTransform:"uppercase" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Prediction Modal ── */}
      {predictingMatch && (
        <PredictionModal
          match={predictingMatch}
          existing={predictions[predictingMatch.id]}
          onSave={handleSavePrediction}
          onClose={() => setPredictingMatch(null)}
        />
      )}

      {/* ── Perfect Hit Overlay ── */}
      {perfectHit && <PerfectHitOverlay pts={perfectHit.pts} onDone={() => setPerfectHit(null)}/>}

      {/* ── Profile Drawer ── */}
      {showProfile && (
        <ProfileDrawer
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onAdmin={() => { setAdminMode(true); setShowProfile(false); }}
        />
      )}

    </div></>
  );
}
