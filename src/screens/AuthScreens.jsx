// ─── src/screens/AuthScreens.jsx ─────────────────────────────────────────────
// Email-first passwordless login (primary).
// Google/Apple: optional secondary buttons.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { GoogleLogo, AppleLogo, Spinner, FootballAvatar } from '../components/UI.jsx';
import { TAKEN_NICKNAMES } from '../data/gameData.js';
import { AVATARS, getDefaultAvatarForNick, NICKNAME_SUGGESTIONS } from '../data/avatars.js';
import {
  signInWithGoogle, signInWithApple,
  checkNicknameAvailable, sendEmailCode, verifyEmailCode,
} from '../services/authService.js';

// ─── EMAIL LOGIN SCREEN ───────────────────────────────────────────────────────
export function LoginScreen({ onLogin }) {
  // step: 'email' | 'code' | 'social'
  const [step,       setStep]   = useState('email');
  const [email,      setEmail]  = useState('');
  const [code,       setCode]   = useState('');
  const [demoCode,   setDemoCode] = useState(''); // shown in demo mode only
  const [loading,    setLoading] = useState(false);
  const [socialLoad, setSocialLoad] = useState(null);
  const [error,      setError]  = useState('');

  // ── Step 1: send code ──
  const handleSendCode = async () => {
    if (!email.trim()) { setError('Introdu adresa de email.'); return; }
    setLoading(true); setError('');
    const res = await sendEmailCode(email.trim());
    setLoading(false);
    if (!res.success) { setError(res.error || 'Eroare la trimitere.'); return; }
    // Demo mode: show code on screen
    if (res.demoCode) setDemoCode(res.demoCode);
    setStep('code');
  };

  // ── Step 2: verify code ──
  const handleVerifyCode = async () => {
    if (code.trim().length < 6) { setError('Introdu codul din 6 cifre.'); return; }
    setLoading(true); setError('');
    const res = await verifyEmailCode(email.trim(), code.trim());
    setLoading(false);
    if (!res.success) { setError(res.error || 'Cod invalid.'); return; }
    onLogin({ uid:res.uid, email:res.email, name:res.name, provider:'email' });
  };

  // ── Social login ──
  const handleGoogle = async () => {
    setSocialLoad('google'); setError('');
    try { onLogin(await signInWithGoogle()); }
    catch(e) { setError('Eroare Google. Încearcă email.'); setSocialLoad(null); }
  };
  const handleApple = async () => {
    setSocialLoad('apple'); setError('');
    try { await signInWithApple(); }
    catch(e) {
      setError(e.message === 'coming_soon' ? 'Apple Sign-In — în curând 🍎' : 'Eroare Apple.');
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
        {/* Header */}
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

        {/* Email step */}
        {step === 'email' && (
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:8, fontWeight:600 }}>
              Intră cu email — fără parolă
            </div>
            <input
              type="email" inputMode="email" autoComplete="email"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
              placeholder="adresa@email.com"
              autoFocus
              style={{
                width:'100%', padding:'14px 16px', marginBottom:10,
                background:'rgba(255,255,255,0.06)', border:`1px solid ${error?'rgba(255,107,107,0.4)':'rgba(255,255,255,0.12)'}`,
                borderRadius:13, color:'#fff', fontSize:16, fontFamily:'inherit',
                outline:'none', boxSizing:'border-box',
              }}
            />
            <button onClick={handleSendCode} disabled={loading} style={{
              width:'100%', padding:'14px', background: loading ? 'rgba(0,229,160,0.4)' : 'linear-gradient(135deg,#00E5A0,#00C27A)',
              border:'none', borderRadius:13, color:'#060C09', fontSize:15, fontWeight:800,
              cursor:loading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(0,229,160,0.22)',
            }}>
              {loading ? <><Spinner size={16} color="#060C09"/>Trimit codul...</> : 'TRIMITE COD →'}
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 14px' }}>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)' }}>sau continuă cu</span>
              <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)' }}/>
            </div>

            {/* Social — secondary */}
            <div style={{ display:'flex', gap:8 }}>
              <SocialBtn icon={<GoogleLogo size={17}/>} label="Google" loading={socialLoad==='google'} disabled={!!socialLoad} onClick={handleGoogle}/>
              <SocialBtn icon={<AppleLogo size={17}/>}  label="Apple"  loading={socialLoad==='apple'}  disabled={!!socialLoad} onClick={handleApple} muted/>
            </div>
          </div>
        )}

        {/* Code verification step */}
        {step === 'code' && (
          <div>
            <button onClick={() => { setStep('email'); setCode(''); setError(''); setDemoCode(''); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:12, cursor:'pointer', padding:'0 0 12px', display:'flex', alignItems:'center', gap:5 }}>
              ← Înapoi
            </button>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:4 }}>Verifică emailul</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>
                Am trimis un cod de 6 cifre la<br/>
                <strong style={{ color:'rgba(255,255,255,0.65)' }}>{email}</strong>
              </div>
            </div>

            {/* Demo mode code display */}
            {demoCode && (
              <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                <div style={{ fontSize:9, color:'rgba(245,158,11,0.6)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
                  📧 Demo mode — codul tău
                </div>
                <div style={{ fontSize:28, fontWeight:900, color:'#F59E0B', fontFamily:"'DM Mono',monospace", letterSpacing:'0.2em' }}>
                  {demoCode}
                </div>
                <div style={{ fontSize:10, color:'rgba(245,158,11,0.4)', marginTop:3 }}>
                  În producție, codul se trimite pe email real.
                </div>
              </div>
            )}

            {/* Code input */}
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={e => { setCode(e.target.value.replace(/\D/g,'')); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
              placeholder="000000"
              autoFocus
              style={{
                width:'100%', padding:'16px', marginBottom:10,
                background:'rgba(255,255,255,0.06)', border:`1px solid ${error?'rgba(255,107,107,0.4)':'rgba(255,255,255,0.12)'}`,
                borderRadius:13, color:'#fff', fontSize:28, fontFamily:"'DM Mono',monospace",
                outline:'none', boxSizing:'border-box', textAlign:'center', letterSpacing:'0.3em',
              }}
            />
            <button onClick={handleVerifyCode} disabled={loading || code.length < 6} style={{
              width:'100%', padding:'14px',
              background: (loading || code.length < 6) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#00E5A0,#00C27A)',
              border:'none', borderRadius:13, color: (loading || code.length < 6) ? 'rgba(255,255,255,0.25)' : '#060C09',
              fontSize:15, fontWeight:800, cursor:(loading||code.length<6)?'default':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em',
            }}>
              {loading ? <><Spinner size={16} color="#060C09"/>Verifică...</> : 'INTRĂ CU COD →'}
            </button>
            <button onClick={() => { setCode(''); setDemoCode(''); handleSendCode(); }} style={{ width:'100%', marginTop:10, padding:'8px', background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:12, cursor:'pointer' }}>
              Retrimite codul
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop:12, fontSize:12, color:'#FF6B6B', background:'rgba(255,107,107,0.07)', border:'1px solid rgba(255,107,107,0.15)', borderRadius:8, padding:'8px 12px' }}>
            {error}
          </div>
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
    <button onClick={onClick} disabled={disabled} style={{
      flex:1, padding:'11px 10px',
      background: muted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
      border:'1px solid rgba(255,255,255,0.1)', borderRadius:12,
      color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
      fontSize:13, fontWeight:600, cursor:loading||disabled?'default':'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.15s',
    }}>
      {loading ? <Spinner size={15}/> : icon}
      <span>{label}</span>
    </button>
  );
}

// ─── RARITY CONFIG ────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { label:'Comun',     color:'rgba(255,255,255,0.35)', bg:'rgba(255,255,255,0.04)' },
  rare:      { label:'Rar',       color:'#4A9EFF',               bg:'rgba(74,158,255,0.08)'  },
  epic:      { label:'Epic',      color:'#9B59B6',               bg:'rgba(155,89,182,0.10)'  },
  legendary: { label:'Legendar',  color:'#FFD700',               bg:'rgba(255,215,0,0.08)'   },
};

const AVATAR_CATEGORIES = [
  { id:'nations',   label:'Natiuni',        filter: av => av.id.startsWith('flag_') },
  { id:'jerseys',   label:'Tricouri',       filter: av => av.id.startsWith('kit_') },
  { id:'players',   label:'Jucatori',       filter: av => av.rarity === 'epic' },
  { id:'trophies',  label:'Trofee',         filter: av => av.rarity === 'legendary' || av.id === 'clean_sheet' || av.id === 'var_hunter' || av.id === 'penalty_k' || av.id === 'assist_king' || av.id === 'top_scorer' },
  { id:'fantasy',   label:'Personaje',      filter: av => av.rarity === 'common' && !av.id.startsWith('flag_') && !av.id.startsWith('kit_') },
];

function AvatarPicker({ selected, onSelect }) {
  const [cat, setCat] = useState('players');
  const catAvatars = AVATAR_CATEGORIES.find(c => c.id === cat)?.filter;
  const visible    = catAvatars ? AVATARS.filter(catAvatars) : AVATARS;
  const selAv      = AVATARS.find(a => a.id === selected);
  const rar        = selAv?.rarity ? RARITY_CONFIG[selAv.rarity] : null;

  return (
    <div>
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>Alege avatarul</div>
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:8 }}>
        {AVATAR_CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{ flexShrink:0, padding:'4px 9px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', background:cat===c.id?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${cat===c.id?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'}`, color:cat===c.id?'#fff':'rgba(255,255,255,0.4)' }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, maxHeight:168, overflowY:'auto' }}>
        {visible.map(av => {
          const isSel = selected === av.id;
          const rc    = av.rarity ? RARITY_CONFIG[av.rarity] : null;
          return (
            <div key={av.id} onClick={() => onSelect(av.id)} title={av.name} style={{
              width:'100%', aspectRatio:'1', borderRadius:10, background:av.bg,
              border:`2px solid ${isSel ? av.accent : 'rgba(255,255,255,0.06)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, cursor:'pointer', transition:'all 0.12s', position:'relative', padding:0,
              boxShadow: isSel ? `0 0 14px ${av.accent}55` : av.shine ? `0 0 6px ${av.accent}22` : 'none',
            }}>
              <FootballAvatar avatarId={av.id} nickname={av.name} size={34} style={{border:'none',boxShadow:'none'}}/>
              {rc && rc.label !== 'Comun' && <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderRadius:'50%', background:rc.color, border:'1px solid rgba(0,0,0,0.5)' }}/>}
            </div>
          );
        })}
      </div>
      {selAv && (
        <div style={{ marginTop:8, padding:'6px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
          <FootballAvatar avatarId={selAv.id} nickname={selAv.name} size={36}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
              {selAv.name}
              {rar && rar.label !== 'Comun' && <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:rar.bg, color:rar.color, fontWeight:700 }}>{rar.label}</span>}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{selAv.desc}</div>
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

  const base = googleUser?.name ? googleUser.name.split(' ')[0] : 'Player';
  const sugg = NICKNAME_SUGGESTIONS.slice(0, 3);
  const bc   = status==='ok'?'#00E5A0':status==='taken'?'#FF6B6B':'rgba(255,255,255,0.1)';
  const av   = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)', padding:'20px 18px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:360, animation:'fadeUp 0.35s ease both' }}>

        {/* Who are you */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'11px 14px', marginBottom:22 }}>
          <FootballAvatar avatarId={av.id} nickname={av.name} size={44}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{googleUser?.name || googleUser?.email}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{googleUser?.email || 'demo'}</div>
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
