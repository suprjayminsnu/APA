/* global React, Icon */

/* ============================================================
   Modal base
   ============================================================ */
function Modal({ title, onClose, children, wide }) {
  // Close on Escape
  React.useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  // Lock body scroll
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return ReactDOM.createPortal(
    <div role="dialog" aria-modal="true" aria-label={title}
      style={{
        position:'fixed', inset:0, zIndex:9000,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'rgba(20,20,19,0.55)',
        backdropFilter:'blur(4px)',
        padding:20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:'#fff', borderRadius:28,
        padding:'40px 40px 36px',
        width:'100%', maxWidth: wide ? 680 : 460,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,0.28)',
        position:'relative',
      }}>
        <button onClick={onClose} aria-label="닫기" style={{
          position:'absolute', top:20, right:20,
          width:36, height:36, borderRadius:'50%',
          border:'1px solid var(--border-soft)',
          background:'var(--canvas)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name="x" size={16}/>
        </button>
        {title && <h3 style={{ marginBottom:28, fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>{title}</h3>}
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}

/* ============================================================
   Auth Modal (login / signup tabs)
   ============================================================ */
function AuthModal({ mode = 'login', onClose, onAuthSuccess }) {
  const [tab, setTab] = React.useState(mode);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    try {
      if (tab === 'login') {
        const { data, error: err } = await window.IeumAPI.signIn(email, password);
        if (err) { setError(err.message); return; }
        onAuthSuccess && onAuthSuccess(data.user);
        onClose();
      } else {
        const { data, error: err } = await window.IeumAPI.signUp(email, password, { full_name: name });
        if (err) { setError(err.message); return; }
        if (data?.user?.identities?.length === 0) {
          setError('이미 가입된 이메일입니다. 로그인해 주세요.');
          return;
        }
        setSuccess('회원가입 완료! 이메일을 확인해 계정을 활성화해 주세요.');
        setTimeout(() => { onClose(); }, 2500);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width:'100%', padding:'14px 16px',
    border:'1.5px solid var(--border-soft)',
    borderRadius:14, fontSize:15, fontFamily:'inherit',
    outline:'none', transition:'border-color 200ms',
    boxSizing:'border-box',
  };

  return (
    <Modal title={null} onClose={onClose}>
      {/* Brand */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:10,
          fontSize:22, fontWeight:800, letterSpacing:'-0.5px', color:'var(--ink)',
        }}>
          <span style={{
            width:32, height:32, borderRadius:'50%', background:'var(--orbit-rust)',
            display:'inline-block',
          }}/>
          이음
        </div>
        <p style={{ fontSize:13.5, color:'var(--ink-slate)', marginTop:8 }}>
          우리 동네 특수체육 연결 플랫폼
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display:'flex', border:'1px solid var(--border-soft)', borderRadius:14,
        marginBottom:24, overflow:'hidden',
      }}>
        {[{id:'login',label:'로그인'},{id:'signup',label:'회원가입'}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
            style={{
              flex:1, padding:'12px', border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:14, fontWeight:600,
              background: tab===t.id ? 'var(--ink)' : 'transparent',
              color: tab===t.id ? '#fff' : 'var(--ink-slate)',
              transition:'all 200ms',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {tab === 'signup' && (
          <input type="text" placeholder="이름" value={name}
            onChange={e => setName(e.target.value)} required
            style={inputStyle} aria-label="이름"/>
        )}
        <input type="email" placeholder="이메일" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={inputStyle} aria-label="이메일" autoComplete="email"/>
        <input type="password" placeholder="비밀번호 (8자 이상)" value={password}
          onChange={e => setPassword(e.target.value)} required minLength={8}
          style={inputStyle} aria-label="비밀번호" autoComplete={tab==='login'?'current-password':'new-password'}/>

        {error && (
          <div style={{
            padding:'12px 16px', borderRadius:12,
            background:'#FEE8E8', color:'#C62828',
            fontSize:13.5, display:'flex', gap:8, alignItems:'flex-start',
          }}>
            <Icon name="alert-circle" size={16} color="#C62828"/>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding:'12px 16px', borderRadius:12,
            background:'#E8F5E9', color:'#2E7D32',
            fontSize:13.5, display:'flex', gap:8, alignItems:'flex-start',
          }}>
            <Icon name="check" size={16} color="#2E7D32"/>
            {success}
          </div>
        )}

        {window.IeumAPI && window.SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co' && (
          <div style={{
            padding:'10px 14px', borderRadius:12,
            background:'#FFF3E0', color:'#E65100',
            fontSize:12.5, display:'flex', gap:8, alignItems:'flex-start',
          }}>
            <Icon name="info" size={14} color="#E65100"/>
            Supabase 미연결 상태입니다. supabase-client.js에서 프로젝트 URL/키를 설정해 주세요.
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{
            background:'var(--ink)', color:'#fff',
            border:'none', borderRadius:14, padding:'16px',
            fontSize:15, fontWeight:700, cursor:loading?'wait':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity:loading?0.7:1, transition:'opacity 200ms',
            fontFamily:'inherit',
          }}>
          {loading ? '처리 중...' : tab==='login' ? '로그인' : '회원가입'}
          {!loading && <Icon name="arrow-right" size={16} color="#fff"/>}
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:20, fontSize:12.5, color:'var(--ink-slate)', lineHeight:1.6 }}>
        {tab==='login' ? (
          <>계정이 없으신가요? <button style={{ background:'none',border:'none',cursor:'pointer',color:'var(--orbit-rust)',fontWeight:600,fontSize:'inherit' }} onClick={()=>setTab('signup')}>회원가입</button></>
        ) : (
          <>이미 계정이 있으신가요? <button style={{ background:'none',border:'none',cursor:'pointer',color:'var(--orbit-rust)',fontWeight:600,fontSize:'inherit' }} onClick={()=>setTab('login')}>로그인</button></>
        )}
      </p>
      <p style={{ textAlign:'center', fontSize:11.5, color:'var(--ink-dust)', marginTop:12, lineHeight:1.5 }}>
        가입 시 이용약관 및 개인정보 처리방침에 동의합니다.
      </p>
    </Modal>
  );
}

/* ============================================================
   Facility Detail Modal
   ============================================================ */
function FacilityDetailModal({ facility: f, onClose, user, onLoginNeeded }) {
  if (!f) return null;
  const badge = f.badge_type || f.badge;
  const badgeLabel = badge==='public' ? '공공' : badge==='business' ? '사업자' : '지도사';
  const badgeColor = badge==='public' ? 'var(--badge-public)'
    : badge==='business' ? 'var(--badge-business)'
    : 'var(--badge-instructor)';
  const portrait = f.portrait_gradient || f.portrait || '';

  return (
    <Modal title={null} onClose={onClose} wide>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, marginBottom:28 }}>
        <div style={{
          width:80, height:80, borderRadius:'50%',
          background:portrait, flexShrink:0,
        }}/>
        <div>
          <h2 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', marginBottom:8 }}>{f.name}</h2>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{
              background: badge==='public'?'var(--badge-public-bg)':badge==='business'?'var(--badge-business-bg)':'var(--badge-instructor-bg)',
              color:badgeColor, borderRadius:999, padding:'4px 12px',
              fontSize:12, fontWeight:700,
            }}>{badgeLabel} 인증</span>
            <span style={{ fontSize:13.5, color:'var(--ink-slate)', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="map-pin" size={13} stroke={2}/>{f.region || f.district}
            </span>
          </div>
        </div>
      </div>

      {f.description && (
        <p style={{ fontSize:15, lineHeight:1.65, color:'var(--ink-charcoal)', marginBottom:24 }}>
          {f.description}
        </p>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        <InfoRow icon="star" label="프로그램" value={(f.programs||[]).join(', ')}/>
        <InfoRow icon="users" label="수용 장애 유형" value={(f.disability_types||[]).join(', ')}/>
        <InfoRow icon="clock" label="운영 시간" value={f.operating_hours||'-'}/>
        <InfoRow icon="star" label="이용 요금" value={f.price_label||f.price||'-'}/>
        {f.phone && <InfoRow icon="phone" label="연락처" value={f.phone}/>}
        {f.website && <InfoRow icon="globe" label="웹사이트" value={
          <a href={f.website} target="_blank" rel="noopener noreferrer"
            style={{ color:'var(--link)', display:'flex', alignItems:'center', gap:4 }}>
            {f.website} <Icon name="external-link" size={12}/>
          </a>
        }/>}
      </div>

      {/* Seats availability */}
      <div style={{
        padding:'16px 20px', borderRadius:16,
        background: f.seats_open ? '#E8F5E9' : '#FFEBEE',
        marginBottom:24,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{
          width:10, height:10, borderRadius:'50%',
          background: f.seats_open ? '#4CAF50' : '#F44336',
          flexShrink:0,
        }}/>
        <span style={{ fontWeight:600, fontSize:14, color: f.seats_open ? '#2E7D32' : '#C62828' }}>
          {f.seats_label || (f.seats_open ? '모집 중' : '모집 마감')}
        </span>
      </div>

      {/* CTA */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        {f.phone && (
          <a href={`tel:${f.phone}`} className="btn-pill-ink" style={{ textDecoration:'none' }}>
            <Icon name="phone" size={15} color="#fff"/>
            전화 연락
          </a>
        )}
        <button className="btn-pill-outline"
          onClick={() => {
            if (!user) { onClose(); onLoginNeeded(); return; }
            alert('관심 시설에 저장되었습니다. (Phase 2 기능)');
          }}>
          <Icon name="star" size={15}/>
          관심 시설 저장
        </button>
        <a href={`https://map.naver.com/v5/search/${encodeURIComponent(f.name)}`}
          target="_blank" rel="noopener noreferrer"
          className="btn-pill-outline" style={{ textDecoration:'none' }}>
          <Icon name="map-pin" size={15}/>
          지도에서 보기
        </a>
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      padding:'12px 16px', background:'var(--canvas)', borderRadius:12,
      border:'1px solid var(--border-soft)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <Icon name={icon} size={13} stroke={2} color="var(--ink-slate)"/>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--ink-slate)', textTransform:'uppercase', letterSpacing:0.4 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)', lineHeight:1.4 }}>
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   Provider Registration Modal
   ============================================================ */
function ProviderRegisterModal({ role = '시설', onClose, user }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name:'', region:'', type: role.includes('지도사') ? 'instructor' : role.includes('공공') ? 'public' : 'business',
    programs:[], phone:'', website:'', description:'', contactEmail: user?.email || '',
  });
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const ALL_SPORTS = window.SPORTS || ['수영','요가','댄스','볼링','탁구','등산','휠체어 농구','필라테스'];

  function update(key, val) { setForm(f => ({...f, [key]:val})); }
  function toggleProgram(p) {
    setForm(f => ({
      ...f,
      programs: f.programs.includes(p) ? f.programs.filter(x=>x!==p) : [...f.programs, p],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (window.IeumAPI) {
        await window.IeumAPI.registerProvider({
          ...form,
          user_id: user?.id,
          submitted_at: new Date().toISOString(),
          status: 'pending',
        });
      }
      setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width:'100%', padding:'12px 14px', border:'1.5px solid var(--border-soft)',
    borderRadius:12, fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box',
  };

  if (done) {
    return (
      <Modal title="등록 신청 완료" onClose={onClose}>
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{
            width:64, height:64, borderRadius:'50%', background:'#E8F5E9',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px',
          }}>
            <Icon name="check" size={28} color="#2E7D32" stroke={3}/>
          </div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:12 }}>신청이 접수되었습니다!</h3>
          <p style={{ color:'var(--ink-slate)', lineHeight:1.65, marginBottom:24 }}>
            영업일 기준 3일 이내 인증 검토 후 이메일로 안내드립니다.<br/>
            인증 완료 시 이음 검색 결과에 노출됩니다.
          </p>
          <button className="btn-pill-ink" onClick={onClose}>확인</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`${role} 등록 신청`} onClose={onClose} wide>
      {!user && (
        <div style={{
          padding:'12px 16px', marginBottom:20, borderRadius:12,
          background:'#FFF3E0', color:'#E65100', fontSize:13.5,
          display:'flex', gap:8,
        }}>
          <Icon name="info" size={16} color="#E65100"/>
          로그인 후 등록하시면 진행 상황을 이메일로 받아볼 수 있습니다.
        </div>
      )}

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:6 }}>
              시설/기관명 *
            </label>
            <input style={inputStyle} required value={form.name}
              onChange={e=>update('name',e.target.value)} placeholder="예: 서대문구장애인복지관"/>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:6 }}>
              지역 *
            </label>
            <input style={inputStyle} required value={form.region}
              onChange={e=>update('region',e.target.value)} placeholder="예: 서울특별시 서대문구"/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:6 }}>
              연락처 전화번호
            </label>
            <input style={inputStyle} value={form.phone} type="tel"
              onChange={e=>update('phone',e.target.value)} placeholder="02-XXXX-XXXX"/>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:6 }}>
              담당자 이메일 *
            </label>
            <input style={inputStyle} required value={form.contactEmail} type="email"
              onChange={e=>update('contactEmail',e.target.value)} placeholder="담당자 이메일"/>
          </div>
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:8 }}>
            운영 프로그램 (복수 선택)
          </label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ALL_SPORTS.map(s => (
              <button key={s} type="button"
                onClick={() => toggleProgram(s)}
                style={{
                  padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:600, cursor:'pointer',
                  border: form.programs.includes(s) ? '0' : '1.5px solid var(--border-soft)',
                  background: form.programs.includes(s) ? 'var(--orbit-rust)' : 'transparent',
                  color: form.programs.includes(s) ? '#fff' : 'var(--ink)',
                  fontFamily:'inherit',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize:12, fontWeight:700, color:'var(--ink-slate)', display:'block', marginBottom:6 }}>
            시설 소개
          </label>
          <textarea style={{ ...inputStyle, minHeight:80, resize:'vertical' }}
            value={form.description}
            onChange={e=>update('description',e.target.value)}
            placeholder="시설 특징, 접근성 정보, 특이사항 등을 입력해 주세요."/>
        </div>

        <div style={{
          padding:'14px 18px', borderRadius:14, background:'var(--canvas)',
          border:'1px solid var(--border-soft)', fontSize:13, color:'var(--ink-slate)', lineHeight:1.6,
        }}>
          <strong style={{ color:'var(--ink)' }}>다음 단계:</strong> 제출 후 인증 서류를 이메일로 요청드립니다.
          검토 후 영업일 3일 이내 인증이 완료됩니다.
        </div>

        <button type="submit" disabled={loading} className="btn-pill-ink"
          style={{ justifyContent:'center', opacity:loading?0.7:1 }}>
          {loading ? '제출 중...' : '등록 신청하기'}
          {!loading && <Icon name="arrow-right" size={16} color="#fff"/>}
        </button>
      </form>
    </Modal>
  );
}

window.Modal = Modal;
window.AuthModal = AuthModal;
window.FacilityDetailModal = FacilityDetailModal;
window.ProviderRegisterModal = ProviderRegisterModal;
