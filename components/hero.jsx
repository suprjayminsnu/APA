/* global React, Icon, BrandMark */

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도',
  '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주도',
];

const DISABILITY_TYPES = [
  '지체장애', '청각장애', '시각장애', '뇌병변', '지적장애',
  '신장장애', '정신장애', '자폐성', '언어장애', '간장애',
  '장루·요루', '호흡기', '뇌전증', '심장장애', '안면장애',
];

const SPORTS = [
  '수영', '요가', '볼링', '휠체어 농구', '댄스', '등산',
  '필라테스', '탁구', '배드민턴', '풋살', '리듬체조', '명상',
  '발달지원 체조', '감각운동', '걷기',
];

const QUICK_CHIPS = ['수영', '요가', '휠체어 농구', '볼링', '발달장애 아동', '주말 프로그램'];

/* ============================================================
   GPS 위치 버튼 — 클릭 시 실제 좌표 → 역지오코딩
   ============================================================ */
function GpsButton({ onLocationDetected }) {
  const [status, setStatus] = React.useState('idle'); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = React.useState('');

  async function handleClick() {
    if (!window.GeoUtils) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const pos = await window.GeoUtils.getCurrentPosition();
      const geo = await window.GeoUtils.reverseGeocode(pos.lat, pos.lng);
      setStatus('done');
      onLocationDetected({ ...pos, ...geo });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const colors = {
    idle:    { bg:'var(--canvas)', color:'var(--ink-slate)', border:'var(--border-soft)' },
    loading: { bg:'#EEF3FF',       color:'#3860BE',          border:'#3860BE' },
    done:    { bg:'#E8F5E9',       color:'#1B7A4B',          border:'#1B7A4B' },
    error:   { bg:'#FEE8E8',       color:'#C62828',          border:'#C62828' },
  };
  const c = colors[status];

  return (
    <div style={{ position:'relative' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === 'loading'}
        title="현재 위치 자동 감지"
        aria-label="GPS로 현재 위치 감지"
        style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 14px', borderRadius:999,
          border:`1.5px solid ${c.border}`,
          background:c.bg, color:c.color,
          cursor: status==='loading' ? 'wait' : 'pointer',
          fontSize:12.5, fontWeight:700, fontFamily:'inherit',
          transition:'all 200ms', whiteSpace:'nowrap',
        }}>
        {status === 'loading' ? (
          <span style={{ animation:'spin 0.8s linear infinite', display:'inline-block' }}>⊙</span>
        ) : status === 'done' ? (
          <Icon name="check" size={13} stroke={3} color={c.color}/>
        ) : status === 'error' ? (
          <Icon name="alert-circle" size={13} color={c.color}/>
        ) : (
          <Icon name="map-pin" size={13} stroke={2.2} color={c.color}/>
        )}
        {status === 'loading' ? '감지 중...'
         : status === 'done'    ? '위치 감지 완료'
         : status === 'error'   ? '다시 시도'
         : '현재 위치 사용'}
      </button>
      {status === 'error' && errorMsg && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', left:0,
          background:'#C62828', color:'#fff',
          padding:'8px 14px', borderRadius:10,
          fontSize:12, fontWeight:500, whiteSpace:'normal',
          maxWidth:280, zIndex:50, lineHeight:1.5,
          boxShadow:'0 8px 20px rgba(0,0,0,0.2)',
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Constellation
   ============================================================ */
function Constellation({ userLocation }) {
  return (
    <div className="constellation" aria-hidden="true">
      <svg className="arc-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="arcfade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#F37338" stopOpacity="0.0"/>
            <stop offset="50%"  stopColor="#F37338" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#F37338" stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="38" fill="none" stroke="#F37338" strokeWidth="0.15"
          strokeDasharray="0.6 0.8" opacity="0.45"/>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#F37338" strokeWidth="0.1"
          strokeDasharray="0.6 1.2" opacity="0.25"/>
        <path d="M 22 26 Q 50 5, 78 16" stroke="url(#arcfade)" strokeWidth="0.18" fill="none"/>
        <path d="M 86 60 Q 95 72, 75 86" stroke="url(#arcfade)" strokeWidth="0.18" fill="none"/>
        <path d="M 26 82 Q 50 95, 70 88" stroke="url(#arcfade)" strokeWidth="0.18" fill="none"/>
        <path d="M 8 54 Q 12 32, 22 26" stroke="url(#arcfade)" strokeWidth="0.18" fill="none"/>
      </svg>

      <div className="center-portrait">
        <span className="you-eyebrow">You · 당신</span>
        <span className="you-name">우리 동네</span>
        {userLocation && (
          <span className="you-sub">{userLocation.short || userLocation.displayLabel}</span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero({ variant, onSearch, userLocation, onLocationDetected }) {
  const [region, setRegion]   = React.useState('');
  const [dtype,  setDtype]    = React.useState('');
  const [sport,  setSport]    = React.useState('');
  const [regionOpen, setRegionOpen] = React.useState(false);
  const [dtypeOpen,  setDtypeOpen]  = React.useState(false);
  const [sportOpen,  setSportOpen]  = React.useState(false);

  // userLocation이 바뀌면 region 라벨 동기화
  React.useEffect(() => {
    if (userLocation?.short) setRegion(userLocation.short);
  }, [userLocation]);

  function closeAllDrops() { setRegionOpen(false); setDtypeOpen(false); setSportOpen(false); }

  function handleSearch(e) {
    e?.preventDefault();
    if (onSearch) onSearch({ region, dtype, sport, userLocation });
    document.getElementById('regions')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleChip(chip) {
    let nextSport = sport, nextDtype = dtype, extra = {};
    if (SPORTS.includes(chip)) {
      nextSport = chip; setSport(chip);
    } else if (chip === '발달장애 아동') {
      nextDtype = '자폐성'; setDtype('자폐성');
    } else if (chip === '주말 프로그램') {
      extra.weekend = true;
    }
    if (onSearch) onSearch({ region, dtype: nextDtype, sport: nextSport, userLocation, ...extra });
    document.getElementById('regions')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleLocationDetected(loc) {
    setRegion(loc.short || loc.displayLabel);
    if (onLocationDetected) onLocationDetected(loc);
    if (onSearch) onSearch({ region: loc.short, dtype, sport, userLocation: loc });
    document.getElementById('regions')?.scrollIntoView({ behavior: 'smooth' });
  }

  const dropStyle = {
    position:'absolute', top:'calc(100% + 8px)', left:0,
    background:'#fff', borderRadius:16, padding:8,
    boxShadow:'var(--shadow-2)', zIndex:100,
    minWidth:200, maxHeight:280, overflowY:'auto',
  };
  const dropItem = {
    display:'block', width:'100%', textAlign:'left',
    padding:'10px 16px', background:'none', border:'none',
    cursor:'pointer', fontSize:14, fontWeight:500, color:'var(--ink)',
    borderRadius:10, fontFamily:'inherit',
  };

  // 지역 필드 표시값
  const regionLabel = region || '지역 선택';
  const isGpsActive = userLocation && (region === userLocation.short || region === userLocation.displayLabel);

  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="ko">우리 동네 특수체육</span>
              <span className="en">/ Special sports, connected</span>
            </span>
            <h1 style={{ marginTop: 20 }}>
              내게 맞는 운동을,<br/>
              <span className="accent">걸어서 5분</span> 거리에서.
            </h1>
            <p className="lead">
              등록 장애인 263만 명을 위한 통합 검색 플랫폼. 시·군·구 단위로
              가까운 시설과 프로그램을 찾고 — 인증된 지도자에게 직접 연락하세요.
            </p>

            {/* Search card */}
            <form className="hero-search-card" role="search" onSubmit={handleSearch}>
              {/* Region field — GPS 또는 직접 선택 */}
              <div className="field" tabIndex={0}
                onClick={() => { setRegionOpen(v=>!v); setDtypeOpen(false); setSportOpen(false); }}
                style={{ position:'relative', cursor:'pointer' }}>
                <span className="label" style={{ display:'flex', alignItems:'center', gap:4 }}>
                  지역
                  {isGpsActive && (
                    <span style={{
                      fontSize:9, fontWeight:800, color:'var(--badge-business)',
                      background:'var(--badge-business-bg)', borderRadius:4,
                      padding:'1px 5px', letterSpacing:0.3, textTransform:'uppercase',
                    }}>GPS</span>
                  )}
                </span>
                <span className="value" style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <Icon name="map-pin" size={13} stroke={2.2}
                    color={isGpsActive ? 'var(--badge-business)' : 'currentColor'}/>
                  <span style={{
                    color: isGpsActive ? 'var(--ink)' : region ? 'var(--ink)' : 'var(--ink-slate)',
                    fontWeight: isGpsActive ? 700 : 500,
                  }}>
                    {regionLabel}
                  </span>
                  <Icon name="chevron-down" size={12}/>
                </span>
                {regionOpen && (
                  <div style={dropStyle} onClick={e=>e.stopPropagation()}>
                    {/* GPS 감지 버튼 */}
                    <div style={{ padding:'4px 8px 8px' }}>
                      <GpsButton onLocationDetected={loc => {
                        handleLocationDetected(loc);
                        setRegionOpen(false);
                      }}/>
                    </div>
                    <div style={{
                      margin:'0 8px 8px', height:1,
                      background:'var(--border-soft)',
                    }}/>
                    {/* 수동 선택 */}
                    {REGIONS.map(r => (
                      <button key={r} style={{
                        ...dropItem,
                        background: r === region ? 'var(--canvas)' : 'none',
                        fontWeight: r === region ? 700 : 500,
                      }} onClick={() => { setRegion(r); setRegionOpen(false); }}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Disability type */}
              <div className="field" tabIndex={0}
                onClick={() => { setDtypeOpen(v=>!v); setRegionOpen(false); setSportOpen(false); }}
                style={{ position:'relative', cursor:'pointer' }}>
                <span className="label">장애 유형</span>
                <span className={`value ${dtype?'':'placeholder'}`} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dtype || '전체 유형'}
                  <Icon name="chevron-down" size={12}/>
                </span>
                {dtypeOpen && (
                  <div style={dropStyle} onClick={e=>e.stopPropagation()}>
                    <button style={{...dropItem, color:'var(--ink-slate)'}}
                      onClick={() => { setDtype(''); setDtypeOpen(false); }}>전체 유형</button>
                    {DISABILITY_TYPES.map(d => (
                      <button key={d} style={{
                        ...dropItem,
                        background: d === dtype ? 'var(--canvas)' : 'none',
                        fontWeight: d === dtype ? 700 : 500,
                      }} onClick={() => { setDtype(d); setDtypeOpen(false); }}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sport */}
              <div className="field" tabIndex={0}
                onClick={() => { setSportOpen(v=>!v); setRegionOpen(false); setDtypeOpen(false); }}
                style={{ position:'relative', cursor:'pointer' }}>
                <span className="label">운동 종목</span>
                <span className={`value ${sport?'':'placeholder'}`} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {sport || '전체 보기'}
                  <Icon name="chevron-down" size={12}/>
                </span>
                {sportOpen && (
                  <div style={dropStyle} onClick={e=>e.stopPropagation()}>
                    <button style={{...dropItem, color:'var(--ink-slate)'}}
                      onClick={() => { setSport(''); setSportOpen(false); }}>전체 보기</button>
                    {SPORTS.map(s => (
                      <button key={s} style={{
                        ...dropItem,
                        background: s === sport ? 'var(--canvas)' : 'none',
                        fontWeight: s === sport ? 700 : 500,
                      }} onClick={() => { setSport(s); setSportOpen(false); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="submit-btn" aria-label="검색">
                <Icon name="search" size={17} stroke={2.5}/>
                <span>찾기</span>
              </button>
            </form>

            {/* GPS 위치 감지 CTA (검색카드 하단) */}
            <div style={{
              marginTop:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
            }}>
              <GpsButton onLocationDetected={handleLocationDetected}/>
              {userLocation && (
                <span style={{ fontSize:12.5, color:'var(--ink-slate)', display:'flex', alignItems:'center', gap:5 }}>
                  <Icon name="map-pin" size={12} stroke={2} color="var(--badge-business)"/>
                  <span>
                    <strong style={{ color:'var(--ink)' }}>{userLocation.short}</strong>
                    {userLocation.accuracy && ` · 정확도 ${Math.round(userLocation.accuracy)}m`}
                  </span>
                </span>
              )}
            </div>

            {/* Quick chips */}
            <div className="hero-quick-chips" style={{ marginTop:16 }}>
              <span style={{ fontSize:12, color:'var(--ink-slate)', fontWeight:600, padding:'7px 4px 7px 0' }}>
                인기 검색
              </span>
              {QUICK_CHIPS.map(c => (
                <button key={c} className="quick-chip" type="button" onClick={() => handleChip(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {variant==='photo'   ? <PhotoCollage/>
           : variant==='search' ? <BigSearchSide/>
           : <Constellation userLocation={userLocation}/>}
        </div>
      </div>
    </section>
  );
}

function PhotoCollage() {
  const portraits = [
    { sport:'수영',       sub:'서대문', size:180, top:4,  left:8,
      fill:'radial-gradient(circle at 30% 25%, #BFE2F2 0%, #5DA8CF 60%, #1B5F88 100%)' },
    { sport:'휠체어 농구', sub:'강남',  size:220, top:22, left:42,
      fill:'radial-gradient(circle at 30% 25%, #FCC9A1 0%, #F37338 55%, #9A3A0A 100%)' },
    { sport:'요가',       sub:'마포',  size:140, top:56, left:4,
      fill:'radial-gradient(circle at 30% 25%, #F4D9D2 0%, #D38A86 60%, #8B3A3A 100%)' },
    { sport:'댄스',       sub:'송파',  size:160, top:60, left:56,
      fill:'radial-gradient(circle at 30% 25%, #E7DBF2 0%, #9A82C7 60%, #4F3A8E 100%)' },
    { sport:'등산',       sub:'관악',  size:110, top:6,  left:70,
      fill:'radial-gradient(circle at 30% 25%, #D9EAD0 0%, #7BA76A 60%, #345E2D 100%)' },
  ];
  return (
    <div className="constellation" aria-hidden="true" style={{ minHeight:560 }}>
      {portraits.map((p,i) => (
        <div key={i} style={{
          position:'absolute', top:`${p.top}%`, left:`${p.left}%`,
          width:p.size, height:p.size, borderRadius:'50%', background:p.fill,
          boxShadow:'var(--shadow-2)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          color:'#fff', textAlign:'center',
        }}>
          <div style={{ fontSize:p.size>160?22:16, fontWeight:700 }}>{p.sport}</div>
          <div style={{ fontSize:11, opacity:0.85, marginTop:2 }}>{p.sub}</div>
        </div>
      ))}
    </div>
  );
}

function BigSearchSide() {
  return (
    <div style={{
      position:'relative', borderRadius:40, overflow:'hidden',
      background:'linear-gradient(165deg, #FCE0CC 0%, #F4A36F 50%, #CF4500 100%)',
      minHeight:540, padding:32,
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      color:'#fff', boxShadow:'var(--shadow-2)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
        <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block' }}/>
        실시간 위치 기반
      </div>
      <div>
        <div style={{ fontSize:14, fontWeight:600, opacity:0.85 }}>지금 우리 동네</div>
        <div style={{ fontSize:88, fontWeight:700, letterSpacing:'-0.04em', lineHeight:1, marginTop:8 }}>
          70<span style={{ fontSize:28, fontWeight:500, marginLeft:8 }}>개 프로그램</span>
        </div>
        <div style={{ marginTop:16, fontSize:14, fontWeight:500, opacity:0.92, lineHeight:1.55, maxWidth:380 }}>
          오늘 모집 중인 특수체육 프로그램. 자동 위치 감지로 5km 안의 시설부터 보여드려요.
        </div>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {['수영 12','요가 8','휠체어 농구 5','댄스 9','필라테스 6','+'].map(c => (
          <span key={c} style={{
            background:'rgba(255,255,255,0.22)', border:'1px solid rgba(255,255,255,0.45)',
            color:'#fff', borderRadius:999, padding:'7px 14px', fontSize:13, fontWeight:600,
          }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

window.Hero = Hero;
window.GpsButton = GpsButton;
window.DISABILITY_TYPES = DISABILITY_TYPES;
window.SPORTS = SPORTS;
window.REGIONS = REGIONS;
