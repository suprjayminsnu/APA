/* global React, Icon */

/* ============================================================
   15 Disability Types
   ============================================================ */
function DisabilityTypes({ onTypeSelect }) {
  const types = [
    { ko:'지체장애',  en:'Physical',    count:47 },
    { ko:'청각장애',  en:'Hearing',     count:32 },
    { ko:'시각장애',  en:'Visual',      count:28 },
    { ko:'뇌병변',   en:'Brain lesion', count:19 },
    { ko:'지적장애',  en:'Intellectual', count:41 },
    { ko:'신장장애',  en:'Renal',       count:7  },
    { ko:'정신장애',  en:'Psychiatric', count:14 },
    { ko:'자폐성',   en:'Autistic',     count:23 },
    { ko:'언어장애',  en:'Speech',      count:11 },
    { ko:'간장애',   en:'Liver',        count:4  },
    { ko:'장루·요루', en:'Ostomy',      count:3  },
    { ko:'호흡기',   en:'Respiratory',  count:6  },
    { ko:'뇌전증',   en:'Epilepsy',     count:9  },
    { ko:'심장장애',  en:'Cardiac',     count:5  },
    { ko:'안면장애',  en:'Facial',      count:3  },
  ];
  const [selected, setSelected] = React.useState(null);

  function handleSelect(ko) {
    const next = selected === ko ? null : ko;
    setSelected(next);
    if (onTypeSelect) onTypeSelect(next);
    if (next) {
      setTimeout(() => {
        document.getElementById('regions')?.scrollIntoView({ behavior:'smooth' });
      }, 200);
    }
  }

  return (
    <section className="band dark" id="types">
      <div className="wrap">
        <div style={{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end' }}>
          <div>
            <span className="eyebrow">
              <span className="ko" style={{ color:'var(--canvas)' }}>장애 유형 필터</span>
              <span className="en" style={{ color:'rgba(255,255,255,0.55)' }}>/ Disability types</span>
            </span>
            <h2 style={{ marginTop:18, maxWidth:720 }}>
              어떤 유형이든, 맞는 프로그램이 있어요.
            </h2>
          </div>
          <p style={{ fontSize:15.5, lineHeight:1.65, color:'rgba(255,255,255,0.78)', maxWidth:460 }}>
            15개 법정 장애 유형을 모두 다룹니다. 시설마다 어떤 유형을 수용 가능한지
            명시하므로, 검색 결과는 항상 당신에게 맞춰져 있습니다. 장애 유형 정보는
            민감정보로 분류되어 암호화 저장합니다.
          </p>
        </div>

        <div className="types-grid" role="group" aria-label="장애 유형 선택">
          {types.map(t => (
            <button key={t.ko} className={`type-pill${selected===t.ko?' selected':''}`}
              type="button"
              aria-pressed={selected===t.ko}
              onClick={() => handleSelect(t.ko)}>
              <span className="label">{t.ko}</span>
              <span className="count tnum">{t.count}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{
            marginTop:24, padding:'16px 24px',
            background:'rgba(207,69,0,0.15)',
            border:'1px solid rgba(207,69,0,0.4)',
            borderRadius:20,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <Icon name="filter" size={18} color="var(--orbit-amber)"/>
            <span style={{ color:'var(--canvas)', fontWeight:600, fontSize:14 }}>
              {selected} 프로그램 필터 적용 —
            </span>
            <button className="btn-pill-outline"
              style={{ padding:'6px 14px', fontSize:12, color:'var(--canvas)', borderColor:'rgba(255,255,255,0.5)' }}
              onClick={() => document.getElementById('regions')?.scrollIntoView({behavior:'smooth'})}>
              결과 보기
              <Icon name="arrow-right" size={14}/>
            </button>
          </div>
        )}

        <div style={{
          marginTop:56, padding:24,
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:24,
          display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
        }}>
          <div style={{
            width:48, height:48, borderRadius:'50%',
            background:'var(--orbit-amber)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--ink)', flexShrink:0,
          }}>
            <Icon name="shield-check" size={22} stroke={2}/>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <h4 style={{ fontSize:15, fontWeight:700, color:'var(--canvas)' }}>
              인증서 업로드는 필요 없습니다.
            </h4>
            <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.7)', marginTop:4, lineHeight:1.5 }}>
              장애 유형 선택만으로 이용 가능합니다 — 등록증·복지카드 강제 업로드는
              접근 장벽을 만들 뿐이라고 믿습니다. 개인정보보호법 제23조에 따라
              민감정보로 최소 수집·암호화 저장합니다.
            </p>
          </div>
          <button className="btn-pill-outline"
            style={{ color:'var(--canvas)', borderColor:'var(--canvas)' }}>
            개인정보 처리방침
            <Icon name="arrow-up-right" size={14}/>
          </button>
        </div>
      </div>
    </section>
  );
}

window.DisabilityTypes = DisabilityTypes;

/* ============================================================
   Trust system
   ============================================================ */
function TrustSystem() {
  return (
    <section className="band" id="trust">
      <div className="wrap">
        <div style={{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end', marginBottom:48 }}>
          <div>
            <span className="eyebrow">
              <span className="ko">신뢰 시스템</span>
              <span className="en">/ Trust &amp; safety</span>
            </span>
            <h2 style={{ marginTop:18, maxWidth:700 }}>
              검증된 시설만 — 안심하고 연결합니다.
            </h2>
          </div>
          <p style={{ fontSize:15.5, lineHeight:1.65, color:'var(--ink-charcoal)', maxWidth:460 }}>
            특수체육은 안전과 직결됩니다. 세 가지 인증 트랙으로 공급자를 검증하고,
            모든 인증은 영업일 3일 이내 사람이 직접 확인합니다.
          </p>
        </div>

        <div className="trust-grid">
          <article className="trust-card public">
            <div className="badge-big" aria-hidden="true">公</div>
            <div>
              <div className="badge-label">공공기관 인증</div>
              <h3 style={{ marginTop:6 }}>구청·복지관·체육회</h3>
            </div>
            <p className="desc">
              기관 공문 또는 공공기관 코드로 인증된 시설. 자치구·복지관·장애인체육회
              등 공식 기관이 운영하는 프로그램에 표시됩니다.
            </p>
            <div className="footnote">
              검증 수단 — <strong>공문 또는 기관 코드</strong>
            </div>
          </article>
          <article className="trust-card business">
            <div className="badge-big" aria-hidden="true">事</div>
            <div>
              <div className="badge-label">사업자 인증</div>
              <h3 style={{ marginTop:6 }}>민간 스포츠센터·학원</h3>
            </div>
            <p className="desc">
              사업자등록증을 제출한 민간 시설. 특수체육 전문 센터부터 일반 스포츠
              센터의 통합 프로그램까지 포함됩니다.
            </p>
            <div className="footnote">
              검증 수단 — <strong>사업자등록증 + 시설 사진</strong>
            </div>
          </article>
          <article className="trust-card instructor">
            <div className="badge-big" aria-hidden="true">指</div>
            <div>
              <div className="badge-label">지도사 인증</div>
              <h3 style={{ marginTop:6 }}>장애인스포츠지도사</h3>
            </div>
            <p className="desc">
              국가공인 자격증을 제출한 프리랜서 지도자. 1:1 PT, 소그룹 클래스,
              방문 지도 등 유연한 형태로 연결합니다.
            </p>
            <div className="footnote">
              검증 수단 — <strong>자격증 + 본인 확인</strong>
            </div>
          </article>
        </div>

        <div style={{
          marginTop:32, background:'var(--canvas-lifted)', borderRadius:28, padding:24,
          display:'flex', alignItems:'center', gap:24, flexWrap:'wrap',
        }}>
          <div style={{
            width:44, height:44, borderRadius:'50%',
            background:'var(--ink)', color:'var(--canvas)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Icon name="clock" size={20}/>
          </div>
          <div style={{ flex:1, minWidth:280 }}>
            <h4 style={{ fontSize:14.5, fontWeight:700 }}>인증 SLA — 영업일 3일 이내</h4>
            <p style={{ fontSize:13.5, color:'var(--ink-slate)', marginTop:4 }}>
              관리자가 직접 검토합니다. 미인증 시설도 검색은 가능하지만 배지는
              표시되지 않으며 결과 하단에 노출됩니다.
            </p>
          </div>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:8,
            fontSize:12.5, fontWeight:600, color:'var(--ink-slate)',
            padding:'8px 14px', background:'#fff', borderRadius:999,
            border:'1px solid var(--border-soft)',
          }}>
            현재 인증 대기 <span style={{ color:'var(--ink)' }}>7건</span>
          </span>
        </div>
      </div>
    </section>
  );
}

window.TrustSystem = TrustSystem;
