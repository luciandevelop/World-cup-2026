// ─── src/screens/AuthScreens.jsx ─────────────────────────────────────────────
// Email-first passwordless login + NicknameScreen with premium AvatarPicker
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { GoogleLogo, AppleLogo, Spinner, FootballAvatar } from '../components/UI.jsx';
import { TAKEN_NICKNAMES } from '../data/gameData.js';
import { AVATARS, getDefaultAvatarForNick, NICKNAME_SUGGESTIONS } from '../data/avatars.js';
import {
  signInWithGoogle, signInWithApple,
  checkNicknameAvailable, sendEmailCode, verifyEmailCode,
  FIREBASE_CONFIGURED,
} from '../services/authService.js';

// ─── EMAIL LOGIN SCREEN ───────────────────────────────────────────────────────
export function LoginScreen({ onLogin }) {
  // step: 'email' | 'password'
  // 'email'    — user enters their email address
  // 'password' — user enters their password (email/password Firebase Auth)
  const [step,       setStep]     = useState('email');
  const [email,      setEmail]    = useState('');
  const [password,   setPassword] = useState('');
  const [showPw,     setShowPw]   = useState(false);
  const [loading,    setLoading]  = useState(false);
  const [socialLoad, setSocialLoad] = useState(null);
  const [error,      setError]    = useState('');

  // Hard block: if Firebase is not configured, nothing works.
  // Show an error and do not render any login form.
  if (!FIREBASE_CONFIGURED) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080C0E', padding:'24px' }}>
        <div style={{ maxWidth:340, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#EF4444', marginBottom:8 }}>
            Firebase nu este configurat
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:20 }}>
            Variabilele de mediu VITE_FIREBASE_* lipsesc.<br/>
            Adaugă-le în <code style={{ color:'rgba(255,255,255,0.65)' }}>.env.local</code> sau în setările Vercel, apoi redeploy.
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:"'DM Mono',monospace", padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:8, textAlign:'left', lineHeight:2 }}>
            VITE_FIREBASE_API_KEY=...<br/>
            VITE_FIREBASE_AUTH_DOMAIN=...<br/>
            VITE_FIREBASE_PROJECT_ID=...<br/>
            VITE_FIREBASE_MESSAGING_SENDER_ID=...<br/>
            VITE_FIREBASE_APP_ID=...
          </div>
        </div>
      </div>
    );
  }

  const handleSendCode = async () => {
    if (!email.trim()) { setError('Introdu adresa de email.'); return; }
    setLoading(true); setError('');
    const res = await sendEmailCode(email.trim());
    setLoading(false);
    if (!res.success) { setError(res.error || 'Eroare.'); return; }
    // Firebase mode always returns usePassword:true
    setStep('password');
  };

  const handlePasswordLogin = async () => {
    if (password.length < 6) { setError('Parola trebuie să aibă cel puțin 6 caractere.'); return; }
    setLoading(true); setError('');
    const res = await verifyEmailCode(email.trim(), password);
    setLoading(false);
    if (!res.success) { setError(res.error || 'Eroare la autentificare.'); return; }
    // onLogin is a no-op in App.jsx — onFirebaseAuthChange handles the state transition.
    onLogin(res);
  };

  const handleGoogle = async () => {
    setSocialLoad('google'); setError('');
    try {
      const result = await signInWithGoogle();
      // onLogin is a no-op — onFirebaseAuthChange handles the state transition.
      onLogin(result);
    } catch(e) {
      const msg = e.message === 'FIREBASE_NOT_CONFIGURED'
        ? 'Firebase nu este configurat.'
        : 'Eroare Google. Încearcă email.';
      setError(msg);
      setSocialLoad(null);
    }
  };

  return (
    <div style={{
      minHeight:'100dvh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)',
      padding:'24px 20px', position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-180, left:'50%', transform:'translateX(-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,160,0.05),transparent 65%)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:360 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:64, marginBottom:12, animation:'float 3s ease-in-out infinite', lineHeight:1, filter:'drop-shadow(0 0 28px rgba(255,215,0,0.28))' }}>🏆</div>
          <div style={{ fontSize:9, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(0,229,160,0.65)', fontWeight:700, marginBottom:8 }}>FIFA World Cup 2026™</div>
          <h1 style={{ fontSize:38, fontWeight:900, color:'#fff', margin:'0 0 6px', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.04em', lineHeight:1.05 }}>
            PREDICȚII<br/><span style={{ color:'#00E5A0' }}>& GLORIE</span>
          </h1>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.25)', margin:0, lineHeight:1.6 }}>
            48 echipe · 104 meciuri · tu vs prieteni
          </p>
        </div>

        {step === 'email' && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:8, fontWeight:600 }}>
              Intră cu email — fără parolă
            </div>
            <input type="email" inputMode="email" autoComplete="email"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
              placeholder="adresa@email.com" autoFocus
              style={{ width:'100%', padding:'14px 16px', marginBottom:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${error?'rgba(255,107,107,0.4)':'rgba(255,255,255,0.12)'}`, borderRadius:13, color:'#fff', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
            />
            <button onClick={handleSendCode} disabled={loading} style={{ width:'100%', padding:'14px', background:loading?'rgba(0,229,160,0.4)':'linear-gradient(135deg,#00E5A0,#00C27A)', border:'none', borderRadius:13, color:'#060C09', fontSize:15, fontWeight:800, cursor:loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em', boxShadow:loading?'none':'0 6px 20px rgba(0,229,160,0.22)' }}>
              {loading ? <><Spinner size={16} color="#060C09"/>Trimit codul...</> : 'TRIMITE COD →'}
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 14px' }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>sau continuă cu</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <SocialBtn icon={<GoogleLogo size={17}/>} label="Google" loading={socialLoad==='google'} disabled={!!socialLoad} onClick={handleGoogle}/>
              <SocialBtn icon={<AppleLogo size={17}/>}  label="Apple"  loading={socialLoad==='apple'}  disabled={!!socialLoad} onClick={handleApple} muted/>
            </div>
          </div>
        )}

        {/* ── Firebase email/password step ─────────────────────────────── */}
        {step === 'password' && (
          <div>
            <button onClick={() => { setStep('email'); setPassword(''); setError(''); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:12, cursor:'pointer', padding:'0 0 12px', display:'flex', alignItems:'center', gap:5 }}>
              ← Înapoi
            </button>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>Parolă</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>
                Cont pentru<br/>
                <strong style={{ color:'rgba(255,255,255,0.65)' }}>{email}</strong>
              </div>
              <div style={{ fontSize:11, color:'rgba(0,229,160,0.5)', marginTop:6, lineHeight:1.5 }}>
                Dacă nu ai cont, introduci o parolă nouă și contul se creează automat.
              </div>
            </div>
            <div style={{ position:'relative', marginBottom:10 }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="Minim 6 caractere"
                autoFocus
                style={{ width:'100%', padding:'14px 44px 14px 16px', background:'rgba(255,255,255,0.06)', border:`1px solid ${error?'rgba(255,107,107,0.4)':'rgba(255,255,255,0.12)'}`, borderRadius:13, color:'#fff', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
              />
              <button
                onClick={() => setShowPw(p => !p)}
                style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:16, padding:2 }}
              >{showPw ? '🙈' : '👁️'}</button>
            </div>
            <button onClick={handlePasswordLogin} disabled={loading || password.length < 6} style={{ width:'100%', padding:'14px', background:(loading||password.length<6)?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#00E5A0,#00C27A)', border:'none', borderRadius:13, color:(loading||password.length<6)?'rgba(255,255,255,0.25)':'#060C09', fontSize:15, fontWeight:800, cursor:(loading||password.length<6)?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em' }}>
              {loading ? <><Spinner size={16} color="#060C09"/>Se autentifică...</> : 'INTRĂ ÎN JOC →'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop:12, fontSize:12, color:'#FF6B6B', background:'rgba(255,107,107,0.07)', border:'1px solid rgba(255,107,107,0.15)', borderRadius:8, padding:'8px 12px' }}>{error}</div>
        )}
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.1)', marginTop:20, lineHeight:1.6, textAlign:'center' }}>
          🔒 Fără parolă · Sesiune persistentă · Nickname unic
        </p>
      </div>
    </div>
  );
}

function SocialBtn({ icon, label, loading, disabled, onClick, muted }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex:1, padding:'11px 10px', background:muted?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:loading?'rgba(255,255,255,0.3)':'#fff', fontSize:13, fontWeight:600, cursor:loading||disabled?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.15s' }}>
      {loading ? <Spinner size={15}/> : icon}
      <span>{label}</span>
    </button>
  );
}

// ─── RARITY CONFIG ────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { label:'Comun',    color:'rgba(200,200,200,0.5)',  bg:'rgba(200,200,200,0.06)' },
  rare:      { label:'Rar',      color:'#60A5FA',                bg:'rgba(96,165,250,0.10)'  },
  epic:      { label:'Epic',     color:'#C084FC',                bg:'rgba(192,132,252,0.10)' },
  legendary: { label:'Legendar', color:'#FBBF24',                bg:'rgba(251,191,36,0.10)'  },
};

const AVATAR_CATEGORIES = [
  { id:'nations',     label:'🌍 Națiuni',  filter: av => av.kind === 'nation'      },
  { id:'jerseys',     label:'👕 Tricouri', filter: av => av.kind === 'jersey'      },
  { id:'achievements',label:'🏆 Trofee',   filter: av => av.kind === 'achievement' },
];
const RARITY_ORDER = { legendary:0, epic:1, rare:2, common:3 };

// ─── PREMIUM AVATAR PICKER ────────────────────────────────────────────────────
export function AvatarPicker({ selected, onSelect }) {
  const [cat, setCat] = useState('nations');

  const catFilter = AVATAR_CATEGORIES.find(c => c.id === cat)?.filter || (() => true);
  const visible   = [...AVATARS.filter(catFilter)]
    .sort((a,b) => (RARITY_ORDER[a.rarity]??9) - (RARITY_ORDER[b.rarity]??9));

  const selAv = AVATARS.find(a => a.id === selected);
  const rar   = selAv?.rarity ? RARITY_CONFIG[selAv.rarity] : null;

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:9, fontWeight:700 }}>
        Alege avatarul
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:9, scrollbarWidth:'none' }}>
        {AVATAR_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            flexShrink:0, padding:'5px 10px', borderRadius:20, fontSize:10, fontWeight:700,
            cursor:'pointer',
            background: cat===c.id ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${cat===c.id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
            color: cat===c.id ? '#fff' : 'rgba(255,255,255,0.38)',
            transition:'all 0.12s',
          }}>{c.label}</button>
        ))}
      </div>

      {/* Grid — 5 columns for good size */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, maxHeight:200, overflowY:'auto', paddingBottom:2 }}>
        {visible.map(av => {
          const isSel = selected === av.id;
          const rc    = RARITY_CONFIG[av.rarity] || RARITY_CONFIG.common;
          return (
            <div key={av.id} onClick={() => onSelect(av.id)} title={av.name} style={{
              position:'relative',
              borderRadius:11,
              background: isSel ? `linear-gradient(145deg,${av.bg},rgba(0,0,0,0.9))` : 'rgba(255,255,255,0.03)',
              border:`1.5px solid ${isSel ? rc.color : 'rgba(255,255,255,0.07)'}`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between',
              padding:'7px 3px 5px',
              cursor:'pointer',
              transition:'all 0.13s',
              transform: isSel ? 'scale(1.06)' : 'scale(1)',
              boxShadow: isSel ? `0 0 16px ${av.glow||rc.color}44` : 'none',
              aspectRatio:'3/4',
            }}>
              {/* Rarity dot */}
              <div style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:rc.color, boxShadow:`0 0 5px ${rc.color}` }}/>
              {/* Selected tick */}
              {isSel && <div style={{ position:'absolute', top:3, left:4, width:13, height:13, borderRadius:'50%', background:rc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, color:'#000', fontWeight:900 }}>✓</div>}
              {/* Avatar */}
              <FootballAvatar avatarId={av.id} nickname={av.name} size={44} style={{ border:'none', boxShadow:'none' }}/>
              {/* Name */}
              <div style={{ fontSize:7.5, fontWeight:700, color: isSel?'#fff':'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%', padding:'0 2px' }}>
                {av.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected detail panel */}
      {selAv && (
        <div style={{ marginTop:8, padding:'8px 11px', background:`linear-gradient(135deg,${selAv.bg}cc,rgba(0,0,0,0.85))`, border:`1px solid ${rar?.color||'rgba(255,255,255,0.08)'}33`, borderRadius:11, display:'flex', alignItems:'center', gap:10, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 15% 50%,${selAv.glow||'rgba(255,255,255,0.05)'}18,transparent 60%)`, pointerEvents:'none' }}/>
          <FootballAvatar avatarId={selAv.id} nickname={selAv.name} size={40}/>
          <div style={{ flex:1, position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{selAv.name}</span>
              {rar && <span style={{ fontSize:8, padding:'1.5px 6px', borderRadius:4, background:rar.bg, color:rar.color, fontWeight:800, letterSpacing:'0.1em' }}>{rar.label.toUpperCase()}</span>}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontStyle:'italic' }}>"{selAv.desc}"</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NICKNAME SCREEN ──────────────────────────────────────────────────────────
export function NicknameScreen({ googleUser, onComplete }) {
  const [nick,     setNick]     = useState('');
  const [status,   setStatus]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [avatarId, setAvatarId] = useState(() => getDefaultAvatarForNick(googleUser?.name || 'Player').id);
  let debounce = null;

  const check = (val) => {
    const v = val.replace(/\s/g,'').slice(0,20);
    setNick(v);
    clearTimeout(debounce);
    if (v.length < 3) { setStatus(v.length > 0 ? 'short' : null); return; }
    setStatus('checking');
    debounce = setTimeout(async () => {
      const ok = await checkNicknameAvailable(v, TAKEN_NICKNAMES);
      setStatus(ok ? 'ok' : 'taken');
    }, 500);
  };

  const save = () => {
    if (status !== 'ok' || saving) return;
    setSaving(true);
    setTimeout(() => onComplete(nick, avatarId), 600);
  };

  const sugg = NICKNAME_SUGGESTIONS.slice(0, 3);
  const bc   = status==='ok'?'#00E5A0':status==='taken'?'#FF6B6B':'rgba(255,255,255,0.1)';
  const av   = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)', padding:'20px 18px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:360, animation:'fadeUp 0.35s ease both' }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'11px 14px', marginBottom:22 }}>
          <FootballAvatar avatarId={av.id} nickname={av.name} size={44}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{googleUser?.name || googleUser?.email}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{googleUser?.email}</div>
          </div>
          <div style={{ fontSize:9, color:'#00E5A0', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.2)', padding:'2px 8px', borderRadius:20, fontWeight:700, flexShrink:0 }}>
            ✓ {googleUser?.provider === 'google' ? 'Google' : googleUser?.provider === 'apple' ? 'Apple' : 'Email'}
          </div>
        </div>

        <div style={{ fontSize:9, color:'rgba(0,229,160,0.65)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>Pasul 1 / 2</div>
        <h2 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:'0 0 4px', fontFamily:"'Bebas Neue',sans-serif" }}>ALEGE NICKNAME</h2>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginBottom:16, lineHeight:1.5 }}>Apare în clasament. Prietenii îl văd. 😈</p>

        <div style={{ position:'relative', marginBottom:5 }}>
          <input value={nick} onChange={e => check(e.target.value)} placeholder="ex: VARzaCuCarnati"
            onKeyDown={e => e.key === 'Enter' && save()} autoFocus
            style={{ width:'100%', padding:'13px 44px 13px 14px', background:'rgba(255,255,255,0.05)', border:`1px solid ${bc}`, borderRadius:12, color:'#fff', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
          />
          <div style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>
            {status==='checking' && <Spinner size={14}/>}
            {status==='ok'       && <span style={{ color:'#00E5A0' }}>✓</span>}
            {status==='taken'    && <span style={{ color:'#FF6B6B' }}>✗</span>}
          </div>
        </div>

        <div style={{ minHeight:15, marginBottom:10, fontSize:11 }}>
          {status==='taken' && <span style={{ color:'#FF6B6B' }}>❌ Deja luat</span>}
          {status==='ok'    && <span style={{ color:'#00E5A0' }}>✅ Disponibil!</span>}
          {status==='short' && <span style={{ color:'rgba(255,255,255,0.3)' }}>Minim 3 caractere</span>}
        </div>

        <div style={{ display:'flex', gap:5, marginBottom:18 }}>
          {sugg.map((s,i) => <button key={i} onClick={() => check(s)} style={{ padding:'4px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, color:'rgba(255,255,255,0.45)', fontSize:11, cursor:'pointer' }}>{s}</button>)}
        </div>

        <div style={{ marginBottom:20 }}>
          <AvatarPicker selected={avatarId} onSelect={setAvatarId}/>
        </div>

        <button onClick={save} disabled={status!=='ok'||saving} style={{
          width:'100%', padding:15,
          background: status==='ok'&&!saving ? 'linear-gradient(135deg,#00E5A0,#00C27A)' : 'rgba(255,255,255,0.05)',
          border:'none', borderRadius:13,
          color: status==='ok'&&!saving ? '#060C09' : 'rgba(255,255,255,0.2)',
          fontSize:16, fontWeight:900, cursor:status==='ok'&&!saving?'pointer':'default',
          fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em',
          boxShadow: status==='ok' ? '0 6px 22px rgba(0,229,160,0.25)' : 'none',
          transition:'all 0.25s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          {saving ? <><Spinner size={16} color='#060C09'/>Intru...</> : 'INTRĂ ÎN JOC →'}
        </button>
      </div>
    </div>
  );
}
