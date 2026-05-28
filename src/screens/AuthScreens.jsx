// ─── src/screens/AuthScreens.jsx ─────────────────────────────────────────────
import { useState } from 'react';
import { GoogleLogo, AppleLogo, Spinner } from '../components/UI.jsx';
import { TAKEN_NICKNAMES } from '../data/gameData.js';
import { AVATARS, getDefaultAvatarForNick } from '../data/avatars.js';
import { signInWithGoogle, signInWithApple, checkNicknameAvailable } from '../services/authService.js';

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
export function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(null); // 'google'|'apple'|null
  const [error, setError]     = useState('');

  const handleGoogle = async () => {
    setLoading('google'); setError('');
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch(e) {
      setError('Autentificarea a eșuat. Încearcă din nou.');
      setLoading(null);
    }
  };

  const handleApple = async () => {
    setLoading('apple'); setError('');
    try {
      await signInWithApple();
    } catch(e) {
      if (e.message === 'coming_soon') {
        setError('Apple Sign-In — Coming Soon 🍎');
      } else {
        setError('Autentificarea Apple a eșuat.');
      }
      setLoading(null);
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

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:360, textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:16, animation:'float 3s ease-in-out infinite', filter:'drop-shadow(0 0 32px rgba(255,215,0,0.3))', lineHeight:1 }}>🏆</div>

        <div style={{ fontSize:9, letterSpacing:'0.28em', textTransform:'uppercase', color:'rgba(0,229,160,0.65)', fontWeight:700, marginBottom:10 }}>
          FIFA World Cup 2026™
        </div>

        <h1 style={{ fontSize:42, fontWeight:900, color:'#fff', margin:'0 0 10px', fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.04em', lineHeight:1.05 }}>
          PREDICȚII<br/>
          <span style={{ color:'#00E5A0' }}>& GLORIE</span>
        </h1>

        <p style={{ fontSize:13, color:'rgba(255,255,255,0.28)', marginBottom:36, lineHeight:1.7 }}>
          48 de echipe · 104 meciuri<br/>
          Tu și prietenii — cine ghicește mai bine?
        </p>

        {/* Stats strip */}
        <div style={{ display:'flex', marginBottom:32, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
          {[{v:'200',l:'Max pts/meci'},{v:'12',l:'Grupe'},{v:'104',l:'Meciuri'}].map((s,i) => (
            <div key={i} style={{ flex:1, padding:'11px 6px', background:'rgba(255,255,255,0.03)', textAlign:'center', borderRight:i<2?'1px solid rgba(255,255,255,0.05)':'none' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff', fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.22)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <AuthBtn icon={<GoogleLogo size={19}/>} label="Continuă cu Google" loading={loading==='google'} disabled={!!loading} onClick={handleGoogle}/>
          <AuthBtn icon={<AppleLogo size={19}/>}  label="Continuă cu Apple"  loading={loading==='apple'}  disabled={!!loading} onClick={handleApple} muted/>
        </div>

        {error && (
          <div style={{ marginTop:14, fontSize:12, color:'#FF6B6B', background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.18)', borderRadius:8, padding:'8px 12px' }}>
            {error}
          </div>
        )}

        <p style={{ fontSize:10, color:'rgba(255,255,255,0.12)', marginTop:20, lineHeight:1.6 }}>
          🔒 Autentificare securizată · Datele tale sunt protejate
        </p>
      </div>
    </div>
  );
}

function AuthBtn({ icon, label, loading, disabled, onClick, muted }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'14px 18px',
      background: loading ? 'rgba(255,255,255,0.04)' : muted ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)',
      border:`1px solid ${loading ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
      borderRadius:14, color:loading ? 'rgba(255,255,255,0.3)' : '#fff',
      fontSize:14, fontWeight:600, cursor:loading||disabled?'default':'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', gap:11, transition:'all 0.2s',
    }}>
      {loading ? <Spinner size={18}/> : icon}
      <span>{loading ? 'Se conectează...' : label}</span>
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

// ─── AVATAR CATEGORIES ────────────────────────────────────────────────────────
const AVATAR_CATEGORIES = [
  { id:'personality', label:'Personalități',  filter: av => !av.rarity || av.rarity === 'common' && !av.id.startsWith('flag_') && !av.id.startsWith('kit_') },
  { id:'nations',     label:'🌍 Naționale',   filter: av => av.id.startsWith('flag_') },
  { id:'jerseys',     label:'👕 Echipamente', filter: av => av.id.startsWith('kit_') },
  { id:'stars',       label:'⭐ Superstele',  filter: av => av.rarity === 'epic' },
  { id:'legendary',   label:'🔮 Legendar',    filter: av => av.rarity === 'legendary' },
];

// ─── AVATAR PICKER ────────────────────────────────────────────────────────────
function AvatarPicker({ selected, onSelect }) {
  const [cat, setCat] = useState('personality');
  const catAvatars = AVATAR_CATEGORIES.find(c => c.id === cat)?.filter;
  const visible = catAvatars ? AVATARS.filter(catAvatars) : AVATARS;
  const selAv = AVATARS.find(a => a.id === selected);
  const rar = selAv?.rarity ? RARITY_CONFIG[selAv.rarity] : null;

  return (
    <div>
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8, fontWeight:600 }}>
        Alege avatarul tău
      </div>
      {/* Category tabs */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', marginBottom:8 }}>
        {AVATAR_CATEGORIES.map(c => (
          <button key={c.id} onClick={()=>setCat(c.id)} style={{ flexShrink:0, padding:'4px 9px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer', transition:'all 0.12s', background:cat===c.id?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${cat===c.id?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.07)'}`, color:cat===c.id?'#fff':'rgba(255,255,255,0.4)' }}>
            {c.label}
          </button>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, maxHeight:170, overflowY:'auto' }}>
        {visible.map(av => {
          const isSel = selected === av.id;
          const rc = av.rarity ? RARITY_CONFIG[av.rarity] : null;
          return (
            <div key={av.id} onClick={()=>onSelect(av.id)} title={av.name} style={{
              width:'100%', aspectRatio:'1', borderRadius:10,
              background: av.bg,
              border:`2px solid ${isSel ? av.accent : 'rgba(255,255,255,0.06)'}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20, cursor:'pointer', transition:'all 0.12s', position:'relative',
              boxShadow: isSel ? `0 0 14px ${av.accent}55` : av.shine ? `0 0 6px ${av.accent}22` : 'none',
            }}>
              {av.emoji}
              {rc && rc.label !== 'Comun' && (
                <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderRadius:'50%', background:rc.color, border:'1px solid rgba(0,0,0,0.5)' }}/>
              )}
            </div>
          );
        })}
      </div>
      {/* Selected preview */}
      {selAv && (
        <div style={{ marginTop:8, padding:'7px 10px', background:'rgba(255,255,255,0.04)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>{selAv.emoji}</span>
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
  const [status,   setStatus]   = useState(null); // null|'checking'|'ok'|'taken'|'short'
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
    setTimeout(() => onComplete(nick, avatarId), 700);
  };

  const base = googleUser?.name ? googleUser.name.split(' ')[0] : 'Player';
  const sugg = [base+'FC', base+'Goat', 'Leu'+(base.length*7%89+10)];
  const bc   = status==='ok' ? '#00E5A0' : status==='taken' ? '#FF6B6B' : 'rgba(255,255,255,0.1)';
  const av   = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse 120% 80% at 50% -10%,#0F2D1A,#080C0E 60%)', padding:'20px 18px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:360, animation:'fadeUp 0.35s ease both' }}>

        {/* Profile card */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 14px', marginBottom:24 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:av.bg, border:`2px solid ${av.accent}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{av.emoji}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{googleUser?.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{googleUser?.email}</div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:9, color:'#00E5A0', background:'rgba(0,229,160,0.1)', border:'1px solid rgba(0,229,160,0.2)', padding:'3px 8px', borderRadius:20, fontWeight:700 }}>
            ✓ {googleUser?.provider === 'apple' ? 'Apple' : 'Google'}
          </div>
        </div>

        <div style={{ fontSize:9, color:'rgba(0,229,160,0.65)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:6, fontWeight:700 }}>Pasul 1 / 2</div>
        <h2 style={{ fontSize:28, fontWeight:900, color:'#fff', margin:'0 0 4px', fontFamily:"'Bebas Neue',sans-serif" }}>ALEGE NICKNAME</h2>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.28)', marginBottom:18, lineHeight:1.5 }}>Apare în clasament. Prietenii îl văd. 😈</p>

        {/* Input */}
        <div style={{ position:'relative', marginBottom:6 }}>
          <input value={nick} onChange={e=>check(e.target.value)} placeholder="ex: RaduGoalMaster"
            onKeyDown={e=>e.key==='Enter'&&save()} autoFocus
            style={{ width:'100%', padding:'14px 44px 14px 14px', background:'rgba(255,255,255,0.05)', border:`1px solid ${bc}`, borderRadius:12, color:'#fff', fontSize:16, fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
          />
          <div style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', fontSize:17 }}>
            {status==='checking' && <Spinner size={15}/>}
            {status==='ok'       && <span style={{ color:'#00E5A0' }}>✓</span>}
            {status==='taken'    && <span style={{ color:'#FF6B6B' }}>✗</span>}
          </div>
        </div>

        <div style={{ minHeight:16, marginBottom:12, fontSize:11 }}>
          {status==='taken' && <span style={{ color:'#FF6B6B' }}>❌ Deja luat — încearcă altul</span>}
          {status==='ok'    && <span style={{ color:'#00E5A0' }}>✅ Disponibil!</span>}
          {status==='short' && <span style={{ color:'rgba(255,255,255,0.3)' }}>Minim 3 caractere</span>}
        </div>

        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {sugg.map((s,i) => (
            <button key={i} onClick={()=>check(s)} style={{ padding:'5px 11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, color:'rgba(255,255,255,0.45)', fontSize:11, cursor:'pointer' }}>{s}</button>
          ))}
        </div>

        {/* Avatar picker */}
        <div style={{ marginBottom:22 }}>
          <AvatarPicker selected={avatarId} onSelect={setAvatarId}/>
        </div>

        <button onClick={save} disabled={status!=='ok'||saving} style={{
          width:'100%', padding:16,
          background: status==='ok'&&!saving ? 'linear-gradient(135deg,#00E5A0,#00C27A)' : 'rgba(255,255,255,0.05)',
          border:'none', borderRadius:14,
          color: status==='ok'&&!saving ? '#060C09' : 'rgba(255,255,255,0.2)',
          fontSize:16, fontWeight:900, cursor:status==='ok'&&!saving?'pointer':'default',
          fontFamily:"'Bebas Neue',sans-serif", letterSpacing:'0.08em',
          boxShadow: status==='ok' ? '0 6px 24px rgba(0,229,160,0.25)' : 'none',
          transition:'all 0.25s', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        }}>
          {saving ? <><Spinner size={17} color='#060C09'/>Intru...</> : 'INTRĂ ÎN JOC →'}
        </button>
      </div>
    </div>
  );
}
