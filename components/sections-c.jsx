/* global React, Icon */

/* ============================================================
   Map preview — Google Maps iframe + overlay
   ============================================================ */
function MapPreview({ searchFilters }) {
  const [filters, setFilters] = React.useState({
    verified: true, disabilityAccess: true, weekend: false, free: false,
  });
  const [activeMarker, setActiveMarker] = React.useState(1);

  const FACILITIES_ON_MAP = [
    { id:1, name:'서대문구장애인복지관', type:'공공', lat:37.579, lng:126.937,
      programs:'수영·필라테스·풋살', top:'38%', left:'22%',
      gradient:'radial-gradient(circle at 30% 25%, #FCC9A1 0%, #F37338 60%, #9A3A0A 100%)', badge:'public' },
    { id:2, name:'연남 인클루시브 요가', type:'지도사', lat:37.562, lng:126.927,
      programs:'요가·명상', top:'52%', left:'38%',
      gradient:'radial-gradient(circle at 30% 25%, #F4D9D2 0%, #D38A86 60%, #8B3A3A 100%)', badge:'instructor' },
    { id:3, name:'강남구장애인체육관', type:'공공', lat:37.517, lng:127.047,
      programs:'휠체어 농구·탁구', top:'34%', left:'56%',
      gradient:'radial-gradient(circle at 30% 25%, #C0DDEB 0%, #5DA8CF 60%, #1B5F88 100%)', badge:'public' },
    { id:4, name:'동작 키즈 발달체육', type:'사업자', lat:37.512, lng:126.939,
      programs:'발달지원 체조·감각운동', top:'64%', left:'70%',
      gradient:'radial-gradient(circle at 30% 25%, #FAE7C7 0%, #E8B560 60%, #A56B14 100%)', badge:'business' },
    { id:5, name:'관악 둘레길 등산', type:'지도사', lat:37.478, lng:126.952,
      programs:'등산·걷기', top:'46%', left:'80%',
      gradient:'radial-gradient(circle at 30% 25%, #D9EAD0 0%, #7BA76A 60%, #345E2D 100%)', badge:'instructor' },
    { id:6, name:'송파 인클루시브 댄스', type:'사업자', lat:37.514, lng:127.106,
      programs:'댄스·리듬체조', top:'72%', left:'30%',
      gradient:'radial-gradient(circle at 30% 25%, #E7DBF2 0%, #9A82C7 60%, #4F3A8E 100%)', badge:'business' },
  ];

  const mapSrc = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d50000!2d126.9368!3d37.5791!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sko!2skr!4v1700000000000!5m2!1sko!2skr";
  const active = FACILITIES_ON_MAP.find(f => f.id === activeMarker);

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
            Google Maps 기반 위치 검색. GPS로 자동 감지하고, 시·도 단위로
            반경을 자동 확대해 농어촌 지역의 공백도 줄입니다.
            (실서비스는 네이버 지도 API v3로 전환 예정)
          </p>
        </div>

        <div className="map-frame">
          <iframe
            src={mapSrc}
            title="서울 특수체육 시설 지도"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />

          <div className="map-overlay">
            {/* Side panel */}
            <aside className="map-side-panel">
              <div className="panel-title">서울 전체 · 반경 5km</div>
              <div className="panel-count tnum">{FACILITIES_ON_MAP.length}개 시설</div>

              <div className="panel-filters">
                {[
                  { key:'verified', label:'인증 시설만', count:5 },
                  { key:'disabilityAccess', label:'장애 접근 가능', count:6 },
                  { key:'weekend', label:'주말 운영', count:3 },
                  { key:'free', label:'무료 프로그램', count:1 },
                ].map(f => (
                  <div key={f.key} className="panel-filter"
                    onClick={() => setFilters(prev => ({...prev, [f.key]:!prev[f.key]}))}
                    style={{ cursor:'pointer' }}>
                    <span className={`chk ${filters[f.key]?'on':''}`}>
                      {filters[f.key] && <Icon name="check" size={12} stroke={3}/>}
                    </span>
                    <span style={{ flex:1, color:filters[f.key]?'var(--ink)':'var(--ink-slate)' }}>
                      {f.label}
                    </span>
                    <span style={{ color:'var(--ink-slate)', fontSize:12, fontWeight:600 }}>{f.count}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop:14, paddingTop:12,
                borderTop:'1px solid var(--border-soft)',
                fontSize:12, color:'var(--ink-slate)',
                display:'flex', alignItems:'center', gap:6,
              }}>
                <Icon name="map-pin" size={12} stroke={2.2}/>
                현재 위치 자동 감지 사용 중
              </div>
            </aside>

            {/* Markers */}
            {FACILITIES_ON_MAP.map(f => (
              <button key={f.id}
                className={`pin-marker ${f.badge==='instructor'?'amber':''}`}
                style={{
                  top:f.top, left:f.left,
                  transform: f.id===activeMarker ? 'scale(1.2)' : 'scale(1)',
                  zIndex: f.id===activeMarker ? 10 : 5,
                }}
                onClick={() => setActiveMarker(f.id===activeMarker ? null : f.id)}
                aria-label={f.name}
                title={f.name}>
                {f.id}
              </button>
            ))}

            {/* Popup card */}
            {active && (
              <div className="pin-card" style={{
                top:`calc(${active.top} - 100px)`,
                left:`calc(${active.left} - 20px)`,
              }}>
                <div className="mini-portrait" style={{ background:active.gradient }}/>
                <div>
                  <div className="mini-name">{active.name}</div>
                  <div className="mini-sub">
                    <span style={{
                      color: active.badge==='public' ? 'var(--badge-public)'
                           : active.badge==='business' ? 'var(--badge-business)'
                           : 'var(--badge-instructor)',
                      fontWeight:700,
                    }}>{active.type}</span>
                    &nbsp;· {active.programs}
                  </div>
                </div>
              </div>
            )}

            {/* Zoom controls */}
            <div style={{
              position:'absolute', right:24, bottom:24,
              display:'flex', flexDirection:'column', gap:8,
              pointerEvents:'auto',
            }}>
              <button style={{
                width:44, height:44, borderRadius:'50%', background:'#fff',
                border:0, cursor:'pointer',
                boxShadow:'0 8px 20px rgba(0,0,0,0.16)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }} aria-label="확대">
                <Icon name="plus" size={18}/>
              </button>
              <button style={{
                width:44, height:44, borderRadius:'50%', background:'var(--orbit-rust)',
                border:0, cursor:'pointer',
                boxShadow:'0 8px 20px rgba(0,0,0,0.16)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff',
              }} aria-label="현재 위치로"
                onClick={() => navigator.geolocation?.getCurrentPosition(() => {}, () => {})}>
                <Icon name="map-pin" size={18} stroke={2.2}/>
              </button>
            </div>
          </div>
        </div>

        <p style={{ marginTop:16, fontSize:12.5, color:'var(--ink-slate)', textAlign:'right' }}>
          * 지도 마커는 실제 시설 위치를 기반으로 합니다. 실서비스에서는 네이버 지도 API v3로 전환됩니다.
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
