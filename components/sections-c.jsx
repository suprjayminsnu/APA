/* global React, Icon */

/* ============================================================
   시설 데이터 — 컴포넌트 외부 상수 (useEffect 의존성 문제 방지)
   ============================================================ */
var MAP_FACILITIES = [
  { id:1, name:'서대문구장애인복지관', type:'공공', lat:37.579, lng:126.937,
    programs:'수영·필라테스·풋살', badge:'public' },
  { id:2, name:'연남 인클루시브 요가', type:'지도사', lat:37.562, lng:126.927,
    programs:'요가·명상', badge:'instructor' },
  { id:3, name:'강남구장애인체육관', type:'공공', lat:37.517, lng:127.047,
    programs:'휠체어 농구·탁구', badge:'public' },
  { id:4, name:'동작 키즈 발달체육', type:'사업자', lat:37.512, lng:126.939,
    programs:'발달지원 체조·감각운동', badge:'business' },
  { id:5, name:'관악 둘레길 등산', type:'지도사', lat:37.478, lng:126.952,
    programs:'등산·걷기', badge:'instructor' },
  { id:6, name:'송파 인클루시브 댄스', type:'사업자', lat:37.514, lng:127.106,
    programs:'댄스·리듬체조', badge:'business' },
];

/* ============================================================
   Map preview — 네이버 지도 API v3
   ============================================================ */
function MapPreview({ searchFilters, userLocation: propUserLocation }) {
  const [filters, setFilters] = React.useState({
    verified: true, disabilityAccess: true, weekend: false, free: false,
  });
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [localUserLoc, setLocalUserLoc] = React.useState(null);
  const [gpsError, setGpsError] = React.useState('');
  const [mapError, setMapError] = React.useState('');

  // 네이버 SDK 준비 상태 — 이미 로드됐으면 즉시 true
  const [naverReady, setNaverReady] = React.useState(
    !!(window.naver && window.naver.maps)
  );

  // 지도 DOM 컨테이너 ref — 항상 렌더링되므로 항상 유효
  const mapDivRef = React.useRef(null);
  const mapObjRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const infoWindowsRef = React.useRef([]);

  const userLocation = propUserLocation || localUserLoc;

  // 거리 계산 (GPS 있을 때)
  const facilitiesWithDist = React.useMemo(function () {
    if (!userLocation || !userLocation.lat || !window.GeoUtils) return MAP_FACILITIES;
    return MAP_FACILITIES.map(function (f) {
      return Object.assign({}, f, {
        distKm: window.GeoUtils.haversineKm(userLocation.lat, userLocation.lng, f.lat, f.lng),
      });
    }).sort(function (a, b) { return a.distKm - b.distKm; });
  }, [userLocation]);

  /* ----------------------------------------------------------
     1. 네이버 SDK 준비 감지
        이벤트 + 폴링 두 가지 모두 사용 — 타이밍 문제 완전 해결
     ---------------------------------------------------------- */
  React.useEffect(function () {
    if (naverReady) return;

    function trySet() {
      if (window.naver && window.naver.maps) {
        setNaverReady(true);
        return true;
      }
      return false;
    }

    if (trySet()) return; // 이미 준비된 경우

    window.addEventListener('naverMapsReady', trySet);
    var pollId = setInterval(trySet, 500);

    return function () {
      window.removeEventListener('naverMapsReady', trySet);
      clearInterval(pollId);
    };
  }, [naverReady]);

  /* ----------------------------------------------------------
     2. 지도 초기화 — naverReady가 true가 된 직후 실행
        mapDivRef는 항상 렌더링되므로 항상 유효
     ---------------------------------------------------------- */
  React.useEffect(function () {
    if (!naverReady || mapObjRef.current) return;

    // DOM 커밋이 완료된 다음 tick에 실행
    var timerId = setTimeout(function () {
      if (!mapDivRef.current) return;

      try {
        var N = window.naver.maps;

        var map = new N.Map(mapDivRef.current, {
          center: new N.LatLng(37.5791, 126.9368),
          zoom: 12,
          mapTypeId: N.MapTypeId.NORMAL,
          logoControlOptions: {
            position: N.Position.BOTTOM_LEFT,
          },
          mapDataControlOptions: {
            position: N.Position.BOTTOM_LEFT,
          },
        });
        mapObjRef.current = map;

        // 시설 마커 + InfoWindow
        MAP_FACILITIES.forEach(function (f) {
          var color = f.badge === 'public'   ? '#2A6FDB'
                    : f.badge === 'business' ? '#CF4500'
                    : '#F37338';

          var marker = new N.Marker({
            position: new N.LatLng(f.lat, f.lng),
            map: map,
            title: f.name,
            icon: {
              content: [
                '<div style="',
                  'background:' + color + ';',
                  'color:#fff;',
                  'border-radius:50%;',
                  'width:32px;height:32px;',
                  'display:flex;align-items:center;justify-content:center;',
                  'font-size:12px;font-weight:800;',
                  'border:2.5px solid #fff;',
                  'box-shadow:0 2px 10px rgba(0,0,0,0.3);',
                  'cursor:pointer;',
                  'font-family:Pretendard,-apple-system,sans-serif;',
                '">',
                  f.id,
                '</div>',
              ].join(''),
              anchor: new N.Point(16, 16),
            },
          });

          var typeLabel = f.badge === 'public' ? '공공 인증'
                        : f.badge === 'business' ? '사업자 인증'
                        : '지도사 인증';
          var typeColor = f.badge === 'public' ? '#2A6FDB'
                        : f.badge === 'business' ? '#CF4500'
                        : '#F37338';

          var infoWindow = new N.InfoWindow({
            content: [
              '<div style="',
                'padding:12px 16px;',
                'min-width:180px;',
                'font-family:Pretendard,-apple-system,sans-serif;',
              '">',
                '<div style="font-size:13.5px;font-weight:700;color:#1A1A18;margin-bottom:5px">',
                  f.name,
                '</div>',
                '<div style="font-size:12px;color:' + typeColor + ';font-weight:600;margin-bottom:3px">',
                  typeLabel,
                '</div>',
                '<div style="font-size:12px;color:#666">',
                  f.programs,
                '</div>',
              '</div>',
            ].join(''),
            borderWidth: 0,
            borderRadius: '14px',
            disableAnchor: false,
            backgroundColor: '#fff',
            pixelOffset: new N.Point(0, -5),
          });

          N.Event.addListener(marker, 'click', function () {
            infoWindowsRef.current.forEach(function (iw) { iw.close(); });
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
          infoWindowsRef.current.push(infoWindow);
        });

        // 지도 클릭 시 InfoWindow 닫기
        N.Event.addListener(map, 'click', function () {
          infoWindowsRef.current.forEach(function (iw) { iw.close(); });
        });

        console.log('[이음] 네이버 지도 초기화 완료');

      } catch (err) {
        console.error('[이음] 네이버 지도 초기화 실패:', err);
        setMapError('지도를 불러오지 못했습니다. 콘솔을 확인하거나 API 키 / 허용 도메인 설정을 점검해 주세요.');
      }
    }, 0);

    return function () {
      clearTimeout(timerId);
    };
  }, [naverReady]);

  /* ----------------------------------------------------------
     3. 지도 정리 — 언마운트 시
     ---------------------------------------------------------- */
  React.useEffect(function () {
    return function () {
      markersRef.current.forEach(function (m) { try { m.setMap(null); } catch(e){} });
      markersRef.current = [];
      infoWindowsRef.current = [];
      if (mapObjRef.current) {
        try { mapObjRef.current.destroy(); } catch(e){}
        mapObjRef.current = null;
      }
    };
  }, []);

  /* ----------------------------------------------------------
     4. 위치 변경 시 지도 중심 이동
     ---------------------------------------------------------- */
  React.useEffect(function () {
    if (!mapObjRef.current || !window.naver || !window.naver.maps) return;
    var lat = userLocation ? userLocation.lat : 37.5791;
    var lng = userLocation ? userLocation.lng : 126.9368;
    var zoom = userLocation ? 13 : 12;
    mapObjRef.current.setCenter(new window.naver.maps.LatLng(lat, lng));
    mapObjRef.current.setZoom(zoom);
  }, [userLocation && userLocation.lat, userLocation && userLocation.lng]);

  // GPS 감지
  async function handleGpsClick() {
    if (!window.GeoUtils) return;
    setGpsLoading(true); setGpsError('');
    try {
      var pos = await window.GeoUtils.getCurrentPosition();
      var geo = await window.GeoUtils.reverseGeocode(pos.lat, pos.lng);
      setLocalUserLoc(Object.assign({}, pos, geo));
    } catch (err) {
      setGpsError(err.message);
      setTimeout(function () { setGpsError(''); }, 5000);
    } finally {
      setGpsLoading(false);
    }
  }

  return (
    <section className="band" id="map">
      <div className="wrap">
        <div style={{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end' }}>
          <div>
            <span className="eyebrow">
              <span className="ko">지도 뷰</span>
              <span className="en">/ Live map</span>
            </span>
            <h2 style={{ marginTop:18, maxWidth:700 }}>
              지도에서 가까운 시설을 한눈에.
            </h2>
          </div>
          <p style={{ fontSize:15.5, lineHeight:1.65, color:'var(--ink-charcoal)', maxWidth:460 }}>
            {userLocation
              ? <><strong style={{color:'var(--badge-business)'}}>GPS 위치 감지 중</strong> — {userLocation.short}을 중심으로 표시합니다.</>
              : '네이버 지도 기반 위치 검색. GPS로 자동 감지하고, 시·도 단위로 반경을 자동 확대해 농어촌 지역의 공백도 줄입니다.'}
          </p>
        </div>

        {/* GPS 상태 배너 */}
        {userLocation ? (
          <div style={{
            display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
            padding:'12px 20px', borderRadius:16, marginBottom:16,
            background:'var(--badge-business-bg)',
            border:'1px solid rgba(27,122,75,0.25)',
          }}>
            <Icon name="map-pin" size={16} color="var(--badge-business)"/>
            <span style={{ fontSize:13.5, fontWeight:600, color:'var(--badge-business)' }}>
              현재 위치: {userLocation.short}
              {userLocation.accuracy && (
                <span style={{fontWeight:400, opacity:0.8}}>
                  {' '}· 정확도 {Math.round(userLocation.accuracy)}m
                </span>
              )}
            </span>
            <span style={{ marginLeft:'auto', fontSize:12, color:'var(--badge-business)', opacity:0.7 }}>
              좌표 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
          </div>
        ) : (
          <div style={{
            display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
            padding:'12px 20px', borderRadius:16, marginBottom:16,
            background:'var(--canvas-lifted)',
            border:'1px solid var(--border-soft)',
          }}>
            <Icon name="map-pin" size={16} color="var(--ink-slate)"/>
            <span style={{ fontSize:13.5, color:'var(--ink-slate)' }}>서울 전체 기준으로 표시 중 —</span>
            <button onClick={handleGpsClick} disabled={gpsLoading}
              style={{
                background:'var(--ink)', color:'#fff', border:'none',
                borderRadius:999, padding:'7px 16px', fontSize:13, fontWeight:700,
                cursor:gpsLoading ? 'wait' : 'pointer', fontFamily:'inherit',
                display:'inline-flex', alignItems:'center', gap:6,
              }}>
              {gpsLoading
                ? <><span style={{animation:'spin 0.8s linear infinite', display:'inline-block'}}>⊙</span> 감지 중...</>
                : <><Icon name="map-pin" size={13} color="#fff"/> 내 위치로 이동</>}
            </button>
            {gpsError && (
              <span style={{ fontSize:12.5, color:'#C62828', display:'flex', alignItems:'center', gap:4 }}>
                <Icon name="alert-circle" size={13} color="#C62828"/> {gpsError}
              </span>
            )}
          </div>
        )}

        {/* 지도 영역 */}
        <div className="map-frame" style={{ position:'relative' }}>

          {/* 네이버 지도 컨테이너 — 항상 렌더링 (ref 안정성 확보) */}
          <div
            ref={mapDivRef}
            style={{ width:'100%', height:'100%' }}
          />

          {/* 로딩 오버레이 — SDK 준비 전 표시 */}
          {!naverReady && !mapError && (
            <div style={{
              position:'absolute', inset:0, zIndex:4,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              background:'#EDECEA', gap:12,
              borderRadius:'inherit',
            }}>
              <div style={{
                width:44, height:44, borderRadius:'50%',
                border:'3px solid #ddd',
                borderTopColor:'var(--orbit-rust)',
                animation:'spin 0.9s linear infinite',
              }}/>
              <span style={{ fontSize:14, color:'var(--ink-slate)' }}>
                네이버 지도 불러오는 중…
              </span>
              <span style={{ fontSize:12, color:'var(--ink-dust)' }}>
                처음 로드 시 수초 소요될 수 있습니다
              </span>
            </div>
          )}

          {/* 에러 오버레이 */}
          {mapError && (
            <div style={{
              position:'absolute', inset:0, zIndex:4,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              background:'#FFF5F5', gap:12, padding:24,
              borderRadius:'inherit',
            }}>
              <Icon name="alert-circle" size={28} color="#C62828"/>
              <p style={{ fontSize:14, color:'#C62828', textAlign:'center', lineHeight:1.6, maxWidth:360 }}>
                {mapError}
              </p>
            </div>
          )}

          {/* UI 오버레이 (사이드패널, GPS 버튼) */}
          <div className="map-overlay">
            {/* Side panel */}
            <aside className="map-side-panel">
              <div className="panel-title">
                {userLocation ? userLocation.displayLabel : '서울 전체'} · 반경 5km
              </div>
              <div className="panel-count tnum">{facilitiesWithDist.length}개 시설</div>

              <div className="panel-filters">
                {[
                  { key:'verified',        label:'인증 시설만',    count:5 },
                  { key:'disabilityAccess',label:'장애 접근 가능', count:6 },
                  { key:'weekend',         label:'주말 운영',      count:3 },
                  { key:'free',            label:'무료 프로그램',  count:1 },
                ].map(function (f) { return (
                  <div key={f.key} className="panel-filter"
                    onClick={function () { setFilters(function (prev) { return Object.assign({}, prev, { [f.key]: !prev[f.key] }); }); }}
                    style={{ cursor:'pointer' }}>
                    <span className={`chk ${filters[f.key] ? 'on' : ''}`}>
                      {filters[f.key] && <Icon name="check" size={12} stroke={3}/>}
                    </span>
                    <span style={{ flex:1, color:filters[f.key] ? 'var(--ink)' : 'var(--ink-slate)' }}>
                      {f.label}
                    </span>
                    <span style={{ color:'var(--ink-slate)', fontSize:12, fontWeight:600 }}>{f.count}</span>
                  </div>
                ); })}
              </div>

              {/* 시설 목록 */}
              <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border-soft)' }}>
                {facilitiesWithDist.map(function (f) { return (
                  <div key={f.id} style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'6px 0', fontSize:12, color:'var(--ink-charcoal)',
                    borderBottom:'1px solid var(--border-soft)',
                  }}>
                    <span style={{
                      background: f.badge === 'public' ? '#2A6FDB' : f.badge === 'business' ? '#CF4500' : '#F37338',
                      color:'#fff', borderRadius:'50%',
                      width:20, height:20, flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:800,
                    }}>{f.id}</span>
                    <span style={{ flex:1, fontWeight:600 }}>{f.name}</span>
                    {f.distKm != null && window.GeoUtils && (
                      <span style={{ color:'var(--ink-slate)', fontSize:11 }}>
                        {window.GeoUtils.formatDistance(f.distKm)}
                      </span>
                    )}
                  </div>
                ); })}
              </div>
            </aside>

            {/* GPS 버튼 */}
            <div style={{
              position:'absolute', right:24, bottom:24,
              display:'flex', flexDirection:'column', gap:8,
              pointerEvents:'auto',
            }}>
              <button
                style={{
                  width:44, height:44, borderRadius:'50%',
                  background: gpsLoading ? '#aaa' : 'var(--orbit-rust)',
                  border:0, cursor: gpsLoading ? 'wait' : 'pointer',
                  boxShadow:'0 8px 20px rgba(0,0,0,0.16)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', transition:'background 200ms',
                }}
                aria-label="현재 위치로 이동"
                title="현재 위치로 이동"
                onClick={handleGpsClick}
                disabled={gpsLoading}>
                {gpsLoading
                  ? <span style={{animation:'spin 0.8s linear infinite', display:'inline-block', fontSize:18}}>⊙</span>
                  : <Icon name="map-pin" size={18} stroke={2.2}/>}
              </button>
            </div>
          </div>
        </div>

        <p style={{ marginTop:16, fontSize:12.5, color:'var(--ink-slate)', textAlign:'right' }}>
          * 마커는 실제 시설 좌표 기반입니다. 네이버 지도 API v3로 운영됩니다.
        </p>
      </div>
    </section>
  );
}

window.MapPreview = MapPreview;

/* ============================================================
   Provider CTA
   ============================================================ */
function ProviderCTA({ onRegister }) {
  return (
    <section className="band dark" id="provider">
      <div className="wrap">
        <div style={{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end' }}>
          <div>
            <span className="eyebrow">
              <span className="ko" style={{ color:'var(--canvas)' }}>공급자에게</span>
              <span className="en" style={{ color:'rgba(255,255,255,0.55)' }}>/ For providers</span>
            </span>
            <h2 style={{ marginTop:18, maxWidth:720 }}>
              당신의 시설을, 이음에 등록하세요.
            </h2>
          </div>
          <p style={{ fontSize:15.5, lineHeight:1.65, color:'rgba(255,255,255,0.78)', maxWidth:460 }}>
            대시보드에서 시설 정보·프로그램·정원을 직접 관리합니다. 등록은 무료,
            검색 노출까지 평균 3 영업일.
          </p>
        </div>

        <div className="provider-grid">
          {[
            {
              role:'공공기관', title:'구청·복지관·체육회',
              desc:'담당자 계정으로 통합 관리. 분산된 공지를 한 채널로 모으세요.',
              items:['기관 코드로 즉시 인증','월별 이용 리포트 자동 생성','다중 시설 일괄 관리 (Phase 3 SaaS)'],
              cta:'공공기관 등록 안내',
              style:{},
            },
            {
              role:'민간 시설', title:'스포츠센터·학원',
              desc:'특수체육 대상으로 새로운 고객층을 발굴하세요.',
              items:['사업자등록증 1장으로 인증 신청','사진·프로그램·요금 직접 편집','프리미엄 노출 광고 (Phase 2)'],
              cta:'시설 등록하기',
              style:{ background:'rgba(243,115,56,0.10)', borderColor:'rgba(243,115,56,0.45)' },
            },
            {
              role:'프리랜서 지도자', title:'장애인스포츠지도사',
              desc:'자격증 한 장으로 프로필 노출. 1:1, 소그룹, 방문 지도 가능.',
              items:['자격증 + 본인 확인 인증','활동 지역·종목·요일 자유 설정','예약·결제 매칭 (Phase 2)'],
              cta:'지도자 가입',
              style:{},
            },
          ].map(p => (
            <article key={p.role} className="provider-card" style={p.style}>
              <span className="role-eyebrow">{p.role}</span>
              <h3>{p.title}</h3>
              <p className="role-desc">{p.desc}</p>
              <ul>
                {p.items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <button className="arrow-cta" onClick={() => onRegister && onRegister(p.role)}>
                {p.cta} <Icon name="arrow-up-right" size={14}/>
              </button>
            </article>
          ))}
        </div>

        <div style={{
          marginTop:56, background:'var(--orbit-rust)', borderRadius:32,
          padding:'40px 48px',
          display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
        }}>
          <div style={{ flex:1, minWidth:320 }}>
            <h3 style={{ color:'#fff', fontSize:26, fontWeight:700, letterSpacing:'-0.5px' }}>
              지자체·복지관 파일럿 모집 중
            </h3>
            <p style={{ color:'rgba(255,255,255,0.9)', fontSize:15, marginTop:10, lineHeight:1.55, maxWidth:600 }}>
              서울 25개 자치구 + 국민체육진흥공단과의 B2B 파일럿을 준비하고 있어요.
              데이터 리포트와 통합 운영 채널을 제공합니다.
            </p>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn-pill-ink"
              style={{ background:'#fff', color:'var(--orbit-rust)' }}
              onClick={() => onRegister && onRegister('파트너십')}>
              파트너십 문의
              <Icon name="arrow-right" size={16}/>
            </button>
            <button className="btn-pill-outline"
              style={{ borderColor:'rgba(255,255,255,0.6)', color:'#fff' }}>
              제안서 다운로드
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

window.ProviderCTA = ProviderCTA;

/* ============================================================
   Commitments
   ============================================================ */
function Commitments() {
  const items = [
    { ic:'eye',      title:'KWCAG 2.2 준수', en:'Accessibility',
      desc:'한국형 웹 접근성 지침. 스크린리더 ARIA 레이블, 최소 44px 터치 타겟, 전체 키보드 내비게이션.' },
    { ic:'lock',     title:'민감정보 암호화', en:'Data privacy',
      desc:'장애 유형은 개인정보보호법 제23조 민감정보. Supabase RLS + 컬럼 암호화로 최소 수집·저장.' },
    { ic:'users',    title:'보호자 대리 이용', en:'Guardian flow',
      desc:'자녀·가족 대신 검색하는 보호자를 위해 별도 플로우를 설계 중입니다. Phase 2 출시 예정.' },
    { ic:'mountain', title:'농어촌 자동 확대', en:'Rural coverage',
      desc:'시설이 적은 지역은 5km → 10km → 시·도 전체로 반경을 자동 확대해 검색합니다.' },
  ];

  return (
    <section className="band compact">
      <div className="wrap">
        <span className="eyebrow">
          <span className="ko">우리의 약속</span>
          <span className="en">/ Commitments</span>
        </span>
        <h2 style={{ marginTop:18, maxWidth:720 }}>접근성과 안전을 — 기능보다 먼저.</h2>
        <div className="commit-grid">
          {items.map(it => (
            <article key={it.title} className="commit-card">
              <div className="ic"><Icon name={it.ic} size={18} stroke={2.2}/></div>
              <h4>{it.title}</h4>
              <div style={{
                fontSize:11, fontWeight:700, letterSpacing:0.4,
                color:'var(--ink-slate)', textTransform:'uppercase', marginTop:-4,
              }}>{it.en}</div>
              <p>{it.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Commitments = Commitments;

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand-block">
            <div className="brand-title">
              <span className="mark-mini"/>
              <span>이음</span>
            </div>
            <p>
              우리 동네에서 나에게 맞는 특수체육 프로그램을 5분 안에 찾는다 —
              등록 장애인 263만 명을 위한 통합 검색 플랫폼.
            </p>
            <div style={{ marginTop:24, display:'flex', flexDirection:'column', gap:6, fontSize:12.5, color:'rgba(255,255,255,0.55)' }}>
              <span>contact@ieum.kr</span>
              <span>서울특별시 · {year}</span>
            </div>
          </div>
          <div>
            <h5>서비스</h5>
            <ul>
              <li><a href="#regions">시설 찾기</a></li>
              <li><a href="#regions">동네별 검색</a></li>
              <li><a href="#types">장애 유형별</a></li>
              <li><a href="#map">지도 뷰</a></li>
              <li><a href="#trust">인증 시설</a></li>
            </ul>
          </div>
          <div>
            <h5>공급자</h5>
            <ul>
              <li><a href="#provider">시설 등록</a></li>
              <li><a href="#provider">지도자 가입</a></li>
              <li><a href="#trust">인증 안내</a></li>
              <li><a href="#provider">대시보드 로그인</a></li>
              <li><a href="#provider">파트너십 문의 ↗</a></li>
            </ul>
          </div>
          <div>
            <h5>지원</h5>
            <ul>
              <li><a href="#">도움말 센터</a></li>
              <li><a href="#">접근성 가이드</a></li>
              <li><a href="#">스크린리더 안내</a></li>
              <li><a href="#">보호자 이용 안내</a></li>
              <li><a href="#">1:1 문의</a></li>
            </ul>
          </div>
          <div>
            <h5>회사</h5>
            <ul>
              <li><a href="#">소개</a></li>
              <li><a href="#">로드맵 (Phase 1~4)</a></li>
              <li><a href="#">채용</a></li>
              <li><a href="#">블로그</a></li>
              <li><a href="#">언론 보도</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <div>© {year} 이음. — 우리 동네 특수체육 연결 플랫폼.</div>
          <div className="legal">
            <a href="#">개인정보 처리방침</a>
            <a href="#">이용약관</a>
            <a href="#">장애 정보 활용 고지</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
