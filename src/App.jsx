// ─── src/App.jsx ──────────────────────────────────────────────────────────────
// Main application shell — v8 Firestore
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import CSS from './styles/globalCSS.js';
import {
  MATCHES, buildMatches, calcBreakdown, calcPoints, buildLeaderboard, calculateUserScore,
  ADMIN_EMAILS, ADMIN_EMAILS_RUNTIME, QUALIFY_PCT, generateActivityFeed, matchLockState,
} from './data/gameData.js';
import { getAvatarById, getDefaultAvatarForNick, AVATARS } from './data/avatars.js';
import { LoginScreen, NicknameScreen } from './screens/AuthScreens.jsx';
import MatchesScreen     from './screens/MatchesScreen.jsx';
import LeaderboardScreen from './screens/LeaderboardScreen.jsx';
import AdminScreen, { loadAdminResults, loadGroupOverrides } from './screens/AdminScreen.jsx';
import HowToPlayScreen   from './screens/HowToPlayScreen.jsx';
import BracketScreen     from './screens/BracketScreen.jsx';
import PredictionModal   from './components/PredictionModal.jsx';
import { FootballAvatar, Spinner } from './components/UI.jsx';
import {
  getPersistedSession, persistSession, signOut,
  saveUserProfile, getUserProfile, onFirebaseAuthChange,
} from './services/authService.js';
import {
  savePrediction, loadUserPredictions,
  loadAllPredictions, loadAllUsers, loadMatchResults,
  subscribeToMatchResults, subscribeToPredictions, subscribeToUsers,
  REALTIME_MODE,
} from './services/firestoreService.js';
import { FIREBASE_CONFIGURED } from './services/firebase.js';

export const APP_VERSION = 'v8';

// ─── PERFECT HIT OVERLAY ──────────────────────────────────────────────────────
function PerfectHitOverlay({ pts, onDone }) {
  const particles = Array.from({length:14}, (_,i) => ({
    x:Math.random()*90+5, y:Math.random()*80+5,
    c:i%3===0?'#FFD700':i%3===1?'#fff':'#00E5A0',
    s:4+Math.random()*6,
    tx:(Math.random()-0.5)*160, ty:-40-Math.random()*80,
  }));
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.92)',backdropFilter:'blur(10px)',animation:'fadeIn 0.15s' }} onClick={onDone}>
      {particles.map((p,i) => <div key={i} style={{ position:'absolute',left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,borderRadius:'50%',background:p.c,animation:`particlePop 1.4s ${i*0.06}s ease-out forwards`,'--tx':`${p.tx}px`,'--ty':`${p.ty}px`,pointerEvents:'none' }}/>)}
      <div style={{ textAlign:'center',animation:'celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',padding:'0 32px' }}>
        <div style={{ width:84,height:84,borderRadius:'50%',margin:'0 auto 16px',background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',animation:'goldPulse 1.8s ease-out forwards' }}>
          <div style={{ fontSize:36 }}>🎯</div>
        </div>
        <div style={{ fontSize:9,color:'rgba(212,175,55,0.5)',letterSpacing:'0.22em',textTransform:'uppercase',marginBottom:6,fontWeight:700 }}>Predicție Perfectă</div>
        <div style={{ fontSize:52,fontWeight:900,color:'#fff',fontFamily:"'Bebas Neue',sans-serif",letterSpacing:'0.04em',lineHeight:1,marginBottom:6 }}>+{pts} PTS</div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,0.3)',marginBottom:20 }}>Scor · posesie · cornere — toate exacte</div>
        <div style={{ fontSize:10,color:'rgba(255,255,255,0.15)' }}>atinge pentru a închide</div>
      </div>
    </div>
  );
}

// ─── RARITY CONFIG (mirrors AuthScreens) ─────────────────────────────────────
const RARITY_CFG = {
  common:    { label:'',        color:'transparent',             bg:'transparent' },
  rare:      { label:'Rar',     color:'#4A9EFF',                bg:'rgba(74,158,255,0.08)' },
  epic:      { label:'Epic',    color:'#9B59B6',                bg:'rgba(155,89,182,0.10)' },
  legendary: { label:'Legendar',color:'#FFD700',                bg:'rgba(255,215,0,0.08)' },
};

const AV_CATS = [
  { id:'all',      label:'Toate' },
  { id:'nations',  label:'Natiuni',   filter: a => a.kind === 'nation' },
  { id:'jerseys',  label:'Tricouri',  filter: a => a.kind === 'jersey' },
  { id:'players',  label:'Jucători',  filter: a => a.kind === 'jersey' && a.rarity === 'epic' },
  { id:'trophies', label:'Trofee',    filter: a => a.kind === 'achievement' },
  { id:'fantasy',  label:'Personaje', filter: a => a.kind === 'achievement' && (a.rarity === 'rare' || a.rarity === 'common') },
];

// ─── AVATAR CHANGE MODAL ──────────────────────────────────────────────────────
function AvatarChangeModal({ currentId, onSelect, onClose }) {
  const [sel, setSel] = useState(currentId);
  const [cat, setCat] = useState('all');
  const av  = AVATARS.find(a => a.id === sel) || AVATARS[0];
  const rc  = av?.rarity ? RARITY_CFG[av.rarity] : null;
  const catObj = AV_CATS.find(c => c.id === cat);
  const visible = cat === 'all' ? AVATARS : AVATARS.filter(catObj?.filter || (()=>true));

  return (
    <div style={{ position:'fixed',inset:0,zIndex:90,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',justifyContent:'flex-end',animation:'fadeIn 0.15s' }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#111820',borderRadius:'22px 22px 0 0',padding:'16px 14px 32px',border:'1px solid rgba(255,255,255,0.08)',borderBottom:'none',animation:'slideUp 0.28s ease',maxHeight:'82dvh',overflowY:'auto' }}>
        <div style={{ width:36,height:3,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0 auto 14px' }}/>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
          <FootballAvatar avatarId={av.id} nickname={av.name} size={42}/>
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:'#fff',display:'flex',alignItems:'center',gap:6 }}>
              {av.name}
              {rc?.label && <span style={{ fontSize:9,padding:'2px 7px',borderRadius:10,background:rc.bg,color:rc.color,fontWeight:700 }}>{rc.label}</span>}
            </div>
            <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)' }}>{av.desc}</div>
          </div>
        </div>
        {/* Category filter */}
        <div style={{ display:'flex',gap:4,overflowX:'auto',marginBottom:10 }}>
          {AV_CATS.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{ flexShrink:0,padding:'3px 9px',borderRadius:20,fontSize:10,fontWeight:700,cursor:'pointer',background:cat===c.id?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${cat===c.id?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'}`,color:cat===c.id?'#fff':'rgba(255,255,255,0.38)' }}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginBottom:14,maxHeight:200,overflowY:'auto' }}>
          {visible.map(a => {
            const isSel = sel===a.id;
            const arc = a.rarity ? RARITY_CFG[a.rarity] : null;
            return (
              <div key={a.id} onClick={()=>setSel(a.id)} title={a.name} style={{ width:'100%',aspectRatio:'1',borderRadius:11,background:a.bg,border:`2px solid ${isSel?a.accent:'rgba(255,255,255,0.06)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:21,cursor:'pointer',boxShadow:isSel?`0 0 12px ${a.accent}55`:a.shine?`0 0 5px ${a.accent}22`:'none',transition:'all 0.12s',position:'relative',padding:0 }}>
                <FootballAvatar avatarId={a.id} nickname={a.name} size={36} style={{border:'none',boxShadow:'none'}}/>
                {arc?.label && <div style={{ position:'absolute',bottom:0,right:0,width:8,height:8,borderRadius:'50%',background:arc.color,border:'1px solid rgba(0,0,0,0.6)' }}/>}
              </div>
            );
          })}
        </div>
        <button onClick={()=>onSelect(sel)} style={{ width:'100%',padding:13,background:'linear-gradient(135deg,#00E5A0,#00C27A)',border:'none',borderRadius:12,color:'#060C09',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:"'Bebas Neue',sans-serif",letterSpacing:'0.08em' }}>
          Salvează avatarul
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE DRAWER ───────────────────────────────────────────────────────────
function ProfileDrawer({ user, totalPts, myRank, streak, onClose, onLogout, onAdmin, onAvatarChange }) {
  const adminEmails = [...ADMIN_EMAILS, ...ADMIN_EMAILS_RUNTIME];
  const isAdmin = adminEmails.includes(user?.email) || user?.isAdmin;
  const av = getAvatarById(user?.avatarId) || getDefaultAvatarForNick(user?.nickname||'?');

  return (
    <div style={{ position:'fixed',inset:0,zIndex:80,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(5px)',animation:'fadeIn 0.15s' }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ position:'absolute',top:0,right:0,width:264,height:'100%',background:'#0E1520',borderLeft:'1px solid rgba(255,255,255,0.06)',padding:'56px 18px 36px',display:'flex',flexDirection:'column',animation:'slideIn 0.2s ease' }}>

        {/* Avatar + name */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',marginBottom:20 }}>
          <div onClick={onAvatarChange} style={{ cursor:'pointer',position:'relative' }}>
            <FootballAvatar nickname={user?.nickname||'?'} avatarId={user?.avatarId} size={68}/>
            <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderRadius:'50%',background:'rgba(10,14,20,0.9)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11 }}>✏️</div>
          </div>
          <div style={{ fontSize:15,fontWeight:700,color:'#fff',marginTop:10 }}>{user?.nickname}</div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.28)' }}>{user?.email}</div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,0.2)',marginTop:3 }}>{av.name}</div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:20 }}>
          {[{l:'Locul',v:myRank?`#${myRank}`:'—',c:'#FFD700'},{l:'Streak',v:streak?`🔥${streak}`:'—',c:'#FF9800'},{l:'Puncte',v:totalPts,c:'#00E5A0'}].map((s,i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'10px 6px',textAlign:'center' }}>
              <div style={{ fontSize:15,fontWeight:800,color:s.c,fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
              <div style={{ fontSize:9,color:'rgba(255,255,255,0.22)',marginTop:2,letterSpacing:'0.05em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {!FIREBASE_CONFIGURED && (
          <div style={{ padding:'7px 10px',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:8,fontSize:10,color:'rgba(245,158,11,0.6)',marginBottom:16,lineHeight:1.4 }}>
            ⚠️ Demo mode — configurează Firebase pentru auth real
          </div>
        )}

        <div style={{ flex:1 }}/>

        {isAdmin && (
          <button onClick={onAdmin} style={{ width:'100%',padding:'11px 14px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:11,color:'#EF4444',fontSize:12,fontWeight:700,cursor:'pointer',marginBottom:8,textAlign:'left' }}>
            ⚙️ Panou Admin
          </button>
        )}
        <button onClick={onLogout} style={{ width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:11,color:'rgba(255,255,255,0.45)',fontSize:12,fontWeight:600,cursor:'pointer',textAlign:'left' }}>
          Deconectează-te
        </button>
        <div style={{ fontSize:9,color:'rgba(255,255,255,0.08)',textAlign:'center',marginTop:14 }}>World Cup Arena {APP_VERSION}</div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stage,      setStage]      = useState('init');
  const [googleUser, setGoogleUser] = useState(null);
  const [user,       setUser]       = useState(null);
  const [tab,        setTab]        = useState('matches');
  const [adminMode,  setAdminMode]  = useState(false);
  const [showProfile,setShowProfile]= useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [predictions,setPredictions]= useState({});
  const [predictingMatch, setPredictingMatch] = useState(null);
  const [perfectHit, setPerfectHit] = useState(null);
  const [finishedResults,  setFinishedResults]  = useState(() => loadAdminResults()); // persist across reloads
  const [allPredictions,   setAllPredictions]   = useState({});
  const [groupOverrides,   setGroupOverrides]   = useState(() => loadGroupOverrides()); // { uid: { matchId: pred } } — all users
  const [allUsers,         setAllUsers]         = useState({}); // { uid: { nickname, avatarId, ... } }
  const [activityFeed,     setActivityFeed]     = useState([]);
  // prevLeaderboard: snapshot before last finishedResults change, for rank-delta events
  const prevLeaderboardRef  = useRef([]);
  const [prevLeaderboard,   setPrevLeaderboard]  = useState([]);

  // ── Restore session + set up realtime listeners ──────────────────────────
  useEffect(() => {
    // Realtime: match results (Firestore or localStorage poll)
    const unsubResults = subscribeToMatchResults(results => setFinishedResults(results));
    // Realtime: all users' predictions
    const unsubPreds   = subscribeToPredictions(preds => setAllPredictions(preds));
    // Realtime: user profiles (for leaderboard nicknames/avatars)
    const unsubUsers   = subscribeToUsers(users => setAllUsers(users));

    // Load initial all-users predictions and profiles
    loadAllPredictions().then(setAllPredictions);
    loadAllUsers().then(setAllUsers);

    // Auth state — handles both Firebase (Google + Email) and demo (localStorage)
    const unsubAuth = onFirebaseAuthChange(async (fbUser) => {
      if (fbUser) {
        // Firebase authenticated user (Google or Email OTP)
        const profile = await getUserProfile(fbUser.uid);
        if (profile?.nickname) {
          // Known user with a nickname — go straight to app
          const fullUser = {
            uid:      fbUser.uid,
            email:    fbUser.email,
            name:     fbUser.displayName || profile.nickname,
            photoURL: fbUser.photoURL    || null,
            provider: fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
            ...profile,
          };
          setUser(fullUser);
          setGoogleUser(fullUser);
          persistSession(fullUser);
          const preds = await loadUserPredictions(fbUser.uid);
          setPredictions(preds);
          setStage('app');
          return;
        } else {
          // Firebase user exists but has no nickname yet → pick nickname
          const partialUser = {
            uid:      fbUser.uid,
            email:    fbUser.email,
            name:     fbUser.displayName || fbUser.email.split('@')[0],
            photoURL: fbUser.photoURL    || null,
            provider: fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
          };
          setGoogleUser(partialUser);
          setStage('pick-nick');
          return;
        }
      }

      // No Firebase user — try localStorage session (demo mode or stale session)
      const session = getPersistedSession();
      if (session?.uid && session?.nickname) {
        setUser(session);
        setGoogleUser(session);
        const preds = await loadUserPredictions(session.uid);
        setPredictions(preds);
        setStage('app');
      } else {
        setStage('login');
      }
    });

    return () => { unsubResults(); unsubPreds(); unsubUsers(); unsubAuth(); };
  }, []);

  // ── Computed state ────────────────────────────────────────────────────────
  const liveMatches = buildMatches(finishedResults);

  // Single source of truth for current user's score
  const myPredsByNumber = Object.fromEntries(Object.entries(predictions).map(([id,p])=>[Number(id),p]));
  const myScore  = calculateUserScore(myPredsByNumber, finishedResults);
  const totalPts = myScore.points;

  // ── Leaderboard from real multi-user data ────────────────────────────────
  // allPredictions: { uid: { matchId: pred } } — from all registered users
  // allUsers:       { uid: { nickname, avatarId, ... } }
  // Map uid → nickname for buildLeaderboard
  const predsByNick = Object.entries(allPredictions).reduce((acc, [uid, preds]) => {
    const nick = allUsers[uid]?.nickname || (uid === user?.uid ? user?.nickname : null);
    if (nick) acc[nick] = Object.fromEntries(Object.entries(preds).map(([id,p])=>[Number(id),p]));
    return acc;
  }, {});
  // Always include current user even if allPredictions hasn't caught up yet
  if (user?.nickname) {
    predsByNick[user.nickname] = Object.fromEntries(Object.entries(predictions).map(([id,p])=>[Number(id),p]));
  }
  const leaderboard = buildLeaderboard(predsByNick, user?.nickname||'Me', liveMatches.filter(m=>m.isFinished));
  const myEntry     = leaderboard.find(p => p.nickname === user?.nickname);
  const myRank      = myEntry?.rank;
  const streak      = myEntry?.exactScores || 0;

  // Regenerate activity feed whenever leaderboard or results change (useMemo for perf)
  const activityFeedComputed = useMemo(() => generateActivityFeed({
    leaderboard,
    prevLeaderboard,
    finishedResults,
    allPredictions,
    allUsers,
    matches: liveMatches,
  }), [leaderboard.length, prevLeaderboard, finishedResults, allPredictions, allUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSavePrediction = async (id, pred) => {
    // BUG-4 fix: enforce lock on save — prevents stale clients from submitting
    const targetMatch = liveMatches.find(m => m.id === Number(id));
    if (targetMatch) {
      const lockInfo = matchLockState(targetMatch);
      if (lockInfo.state !== 'open') {
        console.warn('[Lock] Prediction rejected for locked match:', id, lockInfo.state);
        return;
      }
    }
    const next = { ...predictions, [id]: pred };
    setPredictions(next);
    // Save to Firestore (or localStorage) — syncs to all users via realtime listener
    if (user?.uid) {
      await savePrediction(user.uid, id, pred);
      const [allPredsSnapshot, allUsersSnapshot] = await Promise.all([loadAllPredictions(), loadAllUsers()]);
      setAllPredictions(allPredsSnapshot);
      setAllUsers(allUsersSnapshot);
    }
    const m = liveMatches.find(m => m.id === Number(id));
    if (m?.isFinished) {
      const b = calcBreakdown(pred, m);
      if (b?.isPerfect) setPerfectHit({ pts:b.total });
    }
  };

  // BUG-3 fix: capture leaderboard snapshot BEFORE each results update
  // so generateActivityFeed can compute rank deltas
  useEffect(() => {
    return () => {
      // Save current leaderboard as "previous" when component re-renders with new finishedResults
      prevLeaderboardRef.current = leaderboard;
    };
  });

  useEffect(() => {
    // When finishedResults change, save the pre-change leaderboard for delta computation
    setPrevLeaderboard(prevLeaderboardRef.current);
  }, [finishedResults]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMatchUpdate = useCallback(async (update) => {
    if (update?._action === 'reset') {
      setFinishedResults({});
      return;
    }
    if (update?._action === 'lineup') {
      setFinishedResults(prev => ({ ...prev }));
      return;
    }
    // Reload overrides any time admin saves (they may have changed)
    setGroupOverrides(loadGroupOverrides());
    if (!REALTIME_MODE) {
      const results = await loadMatchResults();
      setFinishedResults(results);
    }
  }, []);

  // handleLogin is called by LoginScreen after email OTP or Google popup.
  // In Firebase mode, onFirebaseAuthChange will also fire and handle the state.
  // We still process it here for demo mode (no Firebase) where onFirebaseAuthChange
  // returns null and localStorage session is the only source of truth.
  const handleLogin = (authData) => {
    setGoogleUser(authData);
    getUserProfile(authData.uid).then(profile => {
      if (profile?.nickname) {
        const fullUser = { ...authData, ...profile };
        setUser(fullUser);
        persistSession(fullUser);
        loadUserPredictions(authData.uid).then(setPredictions);
        setStage('app');
      } else {
        // New user — needs to pick nickname
        setStage('pick-nick');
      }
    });
  };

  const handleNickname = async (nick, avatarId) => {
    const profile = { nickname:nick, avatarId };
    await saveUserProfile(googleUser.uid, profile);
    const fullUser = { ...googleUser, ...profile };
    setUser(fullUser);
    persistSession(fullUser);
    setStage('app');
  };

  const handleLogout = () => {
    signOut();
    setUser(null); setGoogleUser(null); setPredictions({});
    setAdminMode(false); setShowProfile(false);
    setStage('login');
  };

  const handleAvatarChange = async (avatarId) => {
    if (!user?.uid) return;
    const updated = { ...user, avatarId };
    await saveUserProfile(user.uid, { avatarId });
    setUser(updated);
    persistSession(updated);
    setShowAvatarPicker(false);
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id:'matches',     label:'Meciuri',  icon:'⚽' },
    { id:'leaderboard', label:'Clasament', icon:'🏆' },
    { id:'bracket',     label:'Tablou',   icon:'🗂️' },
    { id:'rules',       label:'Reguli',   icon:'📋' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  if (stage === 'init') return (
    <><style>{CSS}</style>
    <div style={{ minHeight:'100dvh',background:'#0A0E14',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <Spinner size={36} color="#00E5A0"/>
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
    <div style={{ fontFamily:"'Space Grotesk','Syne',sans-serif",background:'#0A0E14',minHeight:'100dvh',color:'#fff',maxWidth:430,margin:'0 auto',display:'flex',flexDirection:'column',position:'relative' }}>

      {/* ── Header ── */}
      <div style={{ position:'sticky',top:0,zIndex:50,background:'rgba(10,14,20,0.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'10px 14px 9px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div>
          <div style={{ fontSize:8,color:'rgba(212,175,55,0.45)',letterSpacing:'0.22em',textTransform:'uppercase',fontWeight:700,marginBottom:1 }}>FIFA World Cup 2026™</div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ fontSize:17,fontWeight:800,color:'#fff',lineHeight:1.1,letterSpacing:'-0.02em' }}>World Cup Arena</div>
            <div style={{ fontSize:8,fontWeight:800,color:'rgba(0,229,160,0.7)',background:'rgba(0,229,160,0.08)',border:'1px solid rgba(0,229,160,0.2)',padding:'2px 6px',borderRadius:5,letterSpacing:'0.06em',flexShrink:0 }}>v8 Firestore</div>
          </div>
        </div>
        {/* Compact stats strip */}
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          {(myRank || totalPts > 0) && (
            <div style={{ display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:20,padding:'4px 10px' }}>
              {myRank && <span style={{ fontSize:11,fontWeight:700,color:'#FFD700' }}>🏆 #{myRank}</span>}
              {streak > 0 && <span style={{ fontSize:11,fontWeight:700,color:'#FF9800' }}>🔥{streak}</span>}
              {totalPts > 0 && <span style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)',fontFamily:"'DM Mono',monospace" }}>⚡{totalPts}</span>}
            </div>
          )}
          {[...ADMIN_EMAILS, ...ADMIN_EMAILS_RUNTIME].includes(user?.email) && !adminMode && (
            <button
              onClick={() => setAdminMode(true)}
              style={{ padding:'5px 10px', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:20, color:'#EF4444', fontSize:11, fontWeight:800, cursor:'pointer', flexShrink:0 }}
            >
              ⚙️ Admin
            </button>
          )}
          <div onClick={()=>setShowProfile(true)} style={{ cursor:'pointer', border:`2px solid ${adminMode?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:'50%' }}>
            <FootballAvatar nickname={user?.nickname||'?'} avatarId={user?.avatarId} size={30}/>
          </div>
        </div>
      </div>

      {/* ── Admin banner ── */}
      {adminMode && (
        <div style={{ background:'rgba(239,68,68,0.07)',borderBottom:'1px solid rgba(239,68,68,0.14)',padding:'7px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12,color:'rgba(239,68,68,0.8)' }}>
          <span>⚙️ Admin Test Mode — luciavram87@gmail.com</span>
          <span style={{ cursor:'pointer',opacity:0.6 }} onClick={()=>setAdminMode(false)}>× Ieși</span>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex:1,overflowY:'auto',paddingBottom:72 }}>
        {adminMode
          ? <AdminScreen currentUser={user} finishedResults={finishedResults} onMatchUpdate={handleMatchUpdate}/>
          : tab==='matches'
          ? <MatchesScreen predictions={predictions} onPredict={setPredictingMatch} finishedResults={finishedResults} groupOverrides={groupOverrides} allPredictions={allPredictions} allUsers={allUsers} activityFeed={activityFeedComputed}/>
          : tab==='leaderboard'
          ? <LeaderboardScreen currentUser={user?.nickname} predictions={predictions} allPredictions={predsByNick} allUsers={allUsers} finishedResults={finishedResults}/>
          : tab==='bracket'
          ? <BracketScreen/>
          : <HowToPlayScreen/>
        }
      </div>

      {/* ── Bottom Tab Bar — slimmer ── */}
      {!adminMode && (
        <div style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'rgba(10,14,20,0.97)',backdropFilter:'blur(24px)',borderTop:'1px solid rgba(255,255,255,0.06)',padding:'7px 8px 20px',display:'flex',justifyContent:'space-around',gap:2 }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:'transparent',border:'none',cursor:'pointer',color:active?'#fff':'rgba(255,255,255,0.3)',transition:'all 0.15s',padding:'5px 2px',position:'relative' }}>
                {active && <div style={{ position:'absolute',top:-7,left:'50%',transform:'translateX(-50%)',width:20,height:2,borderRadius:1,background:'#00E5A0' }}/>}
                <span style={{ fontSize:18,lineHeight:1 }}>{t.icon}</span>
                <span style={{ fontSize:8,fontWeight:active?700:400,letterSpacing:'0.06em',textTransform:'uppercase' }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {predictingMatch && (
        <PredictionModal match={predictingMatch} existing={predictions[predictingMatch.id]} onSave={handleSavePrediction} onClose={()=>setPredictingMatch(null)}/>
      )}
      {perfectHit && <PerfectHitOverlay pts={perfectHit.pts} onDone={()=>setPerfectHit(null)}/>}
      {showProfile && (
        <ProfileDrawer user={user} totalPts={totalPts} myRank={myRank} streak={streak} onClose={()=>setShowProfile(false)} onLogout={handleLogout} onAdmin={()=>{setAdminMode(true);setShowProfile(false);}} onAvatarChange={()=>{setShowProfile(false);setShowAvatarPicker(true);}}/>
      )}
      {showAvatarPicker && (
        <AvatarChangeModal currentId={user?.avatarId} onSelect={handleAvatarChange} onClose={()=>setShowAvatarPicker(false)}/>
      )}

    </div></>
  );
}
