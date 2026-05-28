/* global React, Icon, SAMPLE_FACILITIES */

/* ============================================================
   Live ticker items — auto-updates every 8s
   ============================================================ */
const TICKER_ITEMS = [];

function LiveTicker() {
  const [idx, setIdx] = React.useState(0);
  if (TICKER_ITEMS.length === 0) return null;
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER_ITEMS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="openings-row" aria-label="실시간 신규 프로그램" aria-live="polite">
      <span className="live">
        <span className="pulse" aria-hidden="true"/>
        오늘 신규
      </span>
      <div className="ticker">
        {TICKER_ITEMS.map((item, i) => (
          <span key={i} className="item" style={{
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.5s ease',
            position: i === 0 ? 'relative' : 'absolute',
            top: 0, left: 0,
            pointerEvents: i === idx ? 'auto' : 'none',
          }}>
            <span className="name">{item.facility}</span>
            <span className="div">·</span>
            {item.program}
          </span>
        ))}
      </div>
      <button className="more-pill"
        onClick={() => document.getElementById('regions')?.scrollIntoView({behavior:'smooth'})}>
        더 보기 →
      </button>
    </div>
  );
}

/* ============================================================
   Impact strip
   ============================================================ */
function ImpactStrip({ showTicker }) {
  return (
    <section className="band compact" style={{ paddingTop:16, paddingBottom:16 }}>
      <div className="wrap">
        {showTicker && <LiveTicker/>}
        <div className="impact-grid">
          <div className="impact-card warm">
            <span className="stat-label">등록 장애인 (2024.12)</span>
            <div className="big-num tnum">
              263<span style={{ fontSize:32, fontWeight:600, letterSpacing:'-0.02em' }}>만 명</span>
            </div>
            <p className="compare">전체 인구의 5.1% — 그러나 통합된 체육 검색 창구는 없었습니다.</p>
          </div>
          <div className="impact-card">
            <span className="stat-label">생활체육 참여율 격차</span>
            <div className="big-num tnum" style={{ display:'flex', alignItems:'baseline', gap:14 }}>
              <span style={{ color:'var(--orbit-rust)' }}>34.8<span style={{ fontSize:28 }}>%</span></span>
              <span style={{ fontSize:20, color:'var(--ink-slate)', fontWeight:500 }}>vs</span>
              <span style={{ fontSize:32, color:'var(--ink-slate)' }}>62.9<span style={{ fontSize:18 }}>%</span></span>
            </div>
            <p className="compare">장애인 vs 비장애인. 28.1%p의 격차 — 정보 접근성에서 시작합니다.</p>
          </div>
          <div className="impact-card ink">
            <span className="stat-label" style={{ color:'var(--orbit-amber)' }}>장애인스포츠지도사 1인이 담당하는</span>
            <div className="big-num tnum">660<span style={{ fontSize:28, opacity:0.7 }}> 명</span></div>
            <p className="compare">미국은 1인당 104명. 우리는 그 6.3배입니다 — 연결의 효율이 답입니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

window.ImpactStrip = ImpactStrip;

/* ============================================================
   Facility card
   ============================================================ */
function FacilityCard({ f, onDetail }) {
  const portrait = f.portrait_gradient || f.portrait || 'radial-gradient(circle at 30% 25%, #ddd 0%, #aaa 100%)';
  const badge = f.badge_type || f.badge;
  const badgeLabel = badge === 'public' ? '공공' : badge === 'business' ? '사업자' : '지도사';
  const programs = f.programs || [];
  const seatsOpen = f.seats_open !== undefined ? f.seats_open : (f.seats?.open);
  const seatsLabel = f.seats_label || (f.seats?.label);

  return (
    <article className="facility-card" tabIndex={0}
      onClick={() => onDetail && onDetail(f)}
      onKeyDown={e => e.key==='Enter' && onDetail && onDetail(f)}
      role="button" aria-label={`${f.name} 상세 보기`}
      style={{ cursor:'pointer' }}>
      <div className="portrait-row">
        <div className="portrait" style={{ background:portrait }}>
          <div className="badge-overlay">
            <span className={`badge-dot ${badge}`}>✓</span>
          </div>
        </div>
        <div className="name-block">
          <h3 className="name">{f.name}</h3>
          <div className="meta">
            <Icon name="map-pin" size={12} stroke={2}/>
            <span>{f.region || f.district}</span>
            <span className="dot"/>
            <span style={{
              color: badge==='public' ? 'var(--badge-public)'
                   : badge==='business' ? 'var(--badge-business)'
                   : 'var(--badge-instructor)',
              fontWeight:600,
            }}>
              {badgeLabel} 인증
            </span>
          </div>
          {f.phone && (
            <div className="meta" style={{ marginTop:4 }}>
              <Icon name="phone" size={11} stroke={2}/>
              <span style={{ fontSize:12, color:'var(--ink-slate)' }}>{f.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="program-row">
        {programs.map(p => <span key={p} className="program-chip">{p}</span>)}
      </div>

      {f.disability_types && (
        <div className="program-row" style={{ marginTop:6 }}>
          {f.disability_types.slice(0,3).map(d => (
            <span key={d} className="program-chip" style={{
              background:'var(--canvas)', color:'var(--ink-slate)',
              border:'1px solid var(--border-soft)', fontSize:11,
            }}>{d}</span>
          ))}
          {f.disability_types.length > 3 && (
            <span className="program-chip" style={{
              background:'var(--canvas)', color:'var(--ink-slate)',
              border:'1px solid var(--border-soft)', fontSize:11,
            }}>+{f.disability_types.length-3}</span>
          )}
        </div>
      )}

      <div className="footer-row">
        <span className="price">
          {(f.price_label||f.price) === '무료'
            ? <span className="free">무료</span>
            : (f.price_label||f.price)}
        </span>
        {/* 거리 표시 (GPS 활성 시) */}
        {f.distanceKm !== undefined && f.distanceKm !== Infinity && (
          <span style={{
            display:'inline-flex', alignItems:'center', gap:3,
            fontSize:12, fontWeight:700,
            color: f.distanceKm < 1 ? 'var(--badge-business)'
                 : f.distanceKm < 3 ? 'var(--orbit-rust)'
                 : 'var(--ink-slate)',
            background: f.distanceKm < 1 ? 'var(--badge-business-bg)'
                      : f.distanceKm < 3 ? 'var(--badge-instructor-bg)'
                      : 'var(--canvas)',
            borderRadius:999, padding:'3px 8px',
          }}>
            <Icon name="map-pin" size={11} stroke={2.5}
              color={f.distanceKm < 1 ? 'var(--badge-business)' : f.distanceKm < 3 ? 'var(--orbit-rust)' : 'var(--ink-slate)'}/>
            {window.GeoUtils?.formatDistance(f.distanceKm)}
          </span>
        )}
        <span className="seat">
          {seatsOpen
            ? <span className="open">{seatsLabel}</span>
            : <span className="full">{seatsLabel}</span>}
        </span>
      </div>
    </article>
  );
}

window.FacilityCard = FacilityCard;

/* ============================================================
   Neighborhoods
   ============================================================ */
function Neighborhoods({ dense, searchFilters, onDetail }) {
  const DISTRICTS = [
    { name:'내 근처', count:null, gps:true },
    { name:'서대문구' }, { name:'마포구' },
    { name:'강남구' },  { name:'송파구' },
    { name:'관악구' },  { name:'동작구' },
    { name:'종로구' },  { name:'노원구' },
    { name:'+ 17개 자치구', count:null },
  ];

  const userLocation = searchFilters?.userLocation;
  const [active, setActive] = React.useState('내 근처');
  const [facilities, setFacilities] = React.useState(window.HWPC_FACILITIES || []);
  const [loading, setLoading] = React.useState(false);
  const [gpsRadius, setGpsRadius] = React.useState(null); // 자동 확대 반경

  // userLocation 변경 시 '내 근처' 탭 자동 선택
  React.useEffect(() => {
    if (userLocation) setActive('내 근처');
  }, [userLocation]);

  // 거리 계산 + 필터 + 정렬
  const filtered = React.useMemo(() => {
    let list = [...facilities];

    // 기본 필터
    if (searchFilters?.dtype) list = list.filter(f => f.disability_types?.includes(searchFilters.dtype));
    if (searchFilters?.sport) list = list.filter(f => f.programs?.includes(searchFilters.sport));
    if (searchFilters?.query) {
      const q = searchFilters.query.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q) || f.programs?.some(p=>p.toLowerCase().includes(q)));
    }
    if (searchFilters?.weekend) list = list.filter(f => f.has_weekend);

    // GPS 기반 '내 근처' 탭: 거리 계산 + 자동 확대
    if (active === '내 근처' && userLocation?.lat && window.GeoUtils) {
      const { results, radius } = window.GeoUtils.getResultsWithAutoExpand(list, userLocation.lat, userLocation.lng);
      setGpsRadius(radius);
      return results; // distanceKm 필드 포함
    }

    // 거리 정보 추가 (GPS 있을 때 다른 탭도)
    if (userLocation?.lat && window.GeoUtils) {
      list = list.map(f => ({
        ...f,
        distanceKm: (f.lat && f.lng)
          ? window.GeoUtils.haversineKm(userLocation.lat, userLocation.lng, f.lat, f.lng)
          : undefined,
      }));
    }
    return list;
  }, [facilities, searchFilters, active, userLocation]);

  React.useEffect(() => {
    async function load() {
      if (window.IeumAPI) {
        setLoading(true);
        const district = (active === '내 근처' || active.startsWith('+')) ? undefined : active;
        const { data, error } = await window.IeumAPI.fetchFacilities({ district });
        // Supabase 데이터와 HWPC 73개를 병합 (중복 id 제거)
        const hwpc = window.HWPC_FACILITIES || [];
        const supaData = (!error && data && data.length > 0) ? data : [];
        const seen = new Set(supaData.map(f => f.id));
        const merged = [...supaData, ...hwpc.filter(f => !seen.has(f.id))];
        setFacilities(merged);
        setLoading(false);
      }
    }
    load();
  }, [active]);

  const districtFiltered = (active === '내 근처' || active.startsWith('+'))
    ? filtered
    : filtered.filter(f => (f.district||f.region||'').includes(active));

  return (
    <section className="band" id="regions">
      <div className="wrap">
        <span className="eyebrow">
          <span className="ko">우리 동네</span>
          <span className="en">/ Today, in your neighborhood</span>
        </span>
        <h2 style={{ marginTop:18, maxWidth:700 }}>
          {active === '내 근처' && userLocation
            ? <>{userLocation.displayLabel}의 특수체육 시설</>
            : '우리 동네 시설'}
        </h2>
        <p style={{ marginTop:14, fontSize:17, color:'var(--ink-charcoal)', maxWidth:580, lineHeight:1.55, whiteSpace:'nowrap' }}>
          {active === '내 근처' && gpsRadius
            ? `GPS 기준 반경 ${gpsRadius}km 내 시설을 거리순으로 보여드립니다. 결과가 적으면 자동으로 반경을 넓힙니다.`
            : '시·군·구 단위로 가까운 시설을 먼저 보여드려요. 결과가 적으면 자동으로 반경을 넓혀 검색합니다.'}
        </p>

        {searchFilters && (searchFilters.dtype || searchFilters.sport || searchFilters.query) && (
          <div style={{
            display:'flex', gap:8, flexWrap:'wrap', marginTop:20,
            padding:'12px 16px', background:'var(--canvas-lifted)',
            borderRadius:16, border:'1px solid var(--border-soft)',
          }}>
            <span style={{ fontSize:13, color:'var(--ink-slate)', fontWeight:600 }}>필터 적용됨:</span>
            {searchFilters.dtype && <span className="program-chip" style={{ background:'var(--orbit-rust)', color:'#fff' }}>{searchFilters.dtype}</span>}
            {searchFilters.sport && <span className="program-chip" style={{ background:'var(--orbit-rust)', color:'#fff' }}>{searchFilters.sport}</span>}
            {searchFilters.query && <span className="program-chip">{searchFilters.query}</span>}
            {searchFilters.weekend && <span className="program-chip">주말 운영</span>}
            <span style={{ fontSize:12, color:'var(--ink-slate)', marginLeft:'auto', alignSelf:'center' }}>
              {districtFiltered.length}개 결과
            </span>
          </div>
        )}

        <div className="region-chips" role="tablist" aria-label="자치구 선택">
          {DISTRICTS.map(r => (
            <button key={r.name}
              className={`region-chip ${r.name===active?'active':''}`}
              onClick={() => setActive(r.name)}
              role="tab"
              aria-selected={r.name===active}
              type="button"
              style={r.gps ? {
                display:'inline-flex', alignItems:'center', gap:5,
                background: r.name===active ? 'var(--ink)' : userLocation ? 'var(--badge-business-bg)' : undefined,
                color: r.name===active ? '#fff' : userLocation ? 'var(--badge-business)' : undefined,
                borderColor: userLocation ? 'var(--badge-business)' : undefined,
              } : undefined}>
              {r.gps && <Icon name="map-pin" size={12} stroke={2.5}
                color={r.name===active ? '#fff' : userLocation ? 'var(--badge-business)' : 'var(--ink-slate)'}/>}
              {r.name}
              {r.count!==null && <span className="count">{r.count}</span>}
              {r.gps && !userLocation && (
                <span style={{ fontSize:10, opacity:0.6, fontWeight:500 }}>GPS 필요</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-slate)' }}>
            <Icon name="search" size={32} stroke={1.5}/>
            <p style={{ marginTop:12 }}>시설 정보를 불러오는 중...</p>
          </div>
        ) : districtFiltered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--ink-slate)' }}>
            <Icon name="alert-circle" size={32} stroke={1.5}/>
            <p style={{ marginTop:12 }}>해당 조건의 시설이 없습니다. 반경을 넓혀 검색합니다.</p>
            <button className="btn-pill-outline" style={{ marginTop:16 }}
              onClick={() => setActive('+ 17개 자치구')}>
              전체 보기
            </button>
          </div>
        ) : (
          <div className="facility-grid"
            style={dense ? { gridTemplateColumns:'repeat(4, 1fr)' } : undefined}>
            {(active === '내 근처' && !userLocation ? districtFiltered.slice(0, 9) : districtFiltered).map(f => (
              <FacilityCard key={f.id} f={f} onDetail={onDetail}/>
            ))}
          </div>
        )}

        <div style={{ marginTop:40, display:'flex', justifyContent:'center' }}>
          <button className="btn-pill-outline"
            onClick={() => document.getElementById('map')?.scrollIntoView({behavior:'smooth'})}>
            지도에서 전체 시설 보기
            <Icon name="arrow-right" size={16} stroke={2}/>
          </button>
        </div>
      </div>
    </section>
  );
}

window.Neighborhoods = Neighborhoods;
