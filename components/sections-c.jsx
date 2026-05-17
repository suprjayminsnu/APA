/* global React, ReactDOM, Icon */

/* ============================================================
   AI 추천 패널 — modal-root 포탈로 렌더링
   ============================================================ */
function AiRecommendPanel(props) {
  var facilities  = props.facilities;
  var userLocation = props.userLocation;
  var onClose     = props.onClose;

  var DISABILITY_TYPES = [
    '지체장애', '뇌병변장애', '시각장애', '청각장애', '언어장애',
    '지적장애', '자폐성장애', '정신장애', '신장장애', '심장장애',
    '호흡기장애', '간장애', '안면장애', '장루·요루장애', '뇌전증장애',
  ];

  var dtype_state   = React.useState('');
  var dtype         = dtype_state[0];
  var setDtype      = dtype_state[1];

  var maxDist_state = React.useState(10);
  var maxDist       = maxDist_state[0];
  var setMaxDist    = maxDist_state[1];

  var loading_state = React.useState(false);
  var loading       = loading_state[0];
  var setLoading    = loading_state[1];

  var result_state  = React.useState(null);
  var result        = result_state[0];
  var setResult     = result_state[1];

  var error_state   = React.useState('');
  var error         = error_state[0];
  var setError      = error_state[1];

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    var candidates = (facilities || []).map(function(f) {
      var item = Object.assign({}, f);
      if (userLocation && userLocation.lat && f.lat && f.lng && window.GeoUtils) {
        item.distKm = window.GeoUtils.haversineKm(
          userLocation.lat, userLocation.lng, f.lat, f.lng
        );
      }
      return item;
    });

    if (userLocation && maxDist) {
      candidates = candidates.filter(function(f) {
        return f.distKm == null || f.distKm <= maxDist;
      });
    }

    candidates.sort(function(a, b) {
      return (a.distKm != null ? a.distKm : 9999) -
             (b.distKm != null ? b.distKm : 9999);
    });

    var localKey = window.__GEMINI_API_KEY;
    var useLocal  = localKey && localKey !== 'YOUR_GEMINI_API_KEY_HERE';

    var geminiPromise;
    if (useLocal) {
      /* 로컬 개발: 브라우저에서 Gemini API 직접 호출 */
      var facilityList = candidates.slice(0, 30).map(function(f, i) {
        return (i+1) + '. ' + f.name + ' (' + f.region + ' ' + (f.district||'') + ')' +
          ' — 주소: ' + (f.address||'') +
          (f.distKm != null ? ' — 거리: ' + f.distKm.toFixed(1) + 'km' : '') +
          (f.phone ? ' — 전화: ' + f.phone : '') +
          (f.voucher ? ' — 바우처 가능' : '');
      }).join('\n');

      var prompt =
        '당신은 장애인 특수체육 시설 추천 전문가입니다.\n\n' +
        '사용자 정보:\n' +
        '- 장애 유형: ' + (dtype || '미입력') + '\n' +
        '- 최대 이동 가능 거리: ' + (maxDist ? maxDist + 'km' : '제한 없음') + '\n' +
        '- 현재 위치: ' + (userLocation ? (userLocation.short || '') : '미입력') + '\n\n' +
        '아래는 대한장애인체육회 등록 장애인전용체육시설 목록입니다:\n' + facilityList + '\n\n' +
        '위 정보를 바탕으로:\n' +
        '1. 사용자의 장애 유형과 거리에 가장 적합한 시설 3~5개를 추천하세요.\n' +
        '2. 각 시설 추천 이유를 1~2문장으로 설명하세요.\n' +
        '3. 추가 조언이나 주의사항을 한 단락으로 작성하세요.\n\n' +
        '반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 반환하세요:\n' +
        '{\n  "recommendations": [\n    {\n      "rank": 1,\n      "facilityIndex": <위 목록의 번호 (1-based)>,\n      "name": "시설명",\n      "reason": "추천 이유"\n    }\n  ],\n  "advice": "추가 조언"\n}';

      geminiPromise = fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + localKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
        }
      ).then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) throw new Error((data.error && data.error.message) || 'Gemini API 오류');
          var rawText = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || '';
          var jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          var parsed = JSON.parse(jsonText);
          if (parsed.recommendations) {
            parsed.recommendations = parsed.recommendations.map(function(r) {
              var idx = (r.facilityIndex || 1) - 1;
              return Object.assign({}, r, { facility: candidates[idx] || null });
            });
          }
          return parsed;
        });
      });
    } else {
      /* Vercel 배포: 서버리스 함수 호출 */
      geminiPromise = fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disabilityType: dtype,
          maxDistanceKm: maxDist,
          userAddress: userLocation ? (userLocation.short || userLocation.address || '') : '',
          facilities: candidates.slice(0, 30),
        }),
      }).then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) throw new Error(data.error || 'API 오류');
          if (data.parseError) throw new Error('AI 응답 파싱 실패. 다시 시도해주세요.');
          if (data.recommendations) {
            data.recommendations = data.recommendations.map(function(r) {
              var idx = (r.facilityIndex || 1) - 1;
              return Object.assign({}, r, { facility: candidates[idx] || null });
            });
          }
          return data;
        });
      });
    }

    geminiPromise
    .then(function(data) { setResult(data); })
    .catch(function(err) { setError(err.message); })
    .finally(function() { setLoading(false); });
  }

  var overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  };

  var boxStyle = {
    background: '#fff',
    borderRadius: '24px',
    width: 'min(540px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
    padding: '32px 28px',
    fontFamily: 'Pretendard,-apple-system,sans-serif',
  };

  var panel = React.createElement(
    'div',
    { style: overlayStyle, onClick: function(e) { if (e.target === e.currentTarget) onClose(); } },
    React.createElement(
      'div',
      { style: boxStyle },

      /* 헤더 */
      React.createElement(
        'div',
        { style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 } },
        React.createElement(
          'div',
          null,
          React.createElement(
            'div',
            { style: { display:'flex', alignItems:'center', gap:8, marginBottom:6 } },
            React.createElement('span', {
              style: { background:'linear-gradient(135deg,#CF4500,#F37338)', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:800, color:'#fff', letterSpacing:0.5 }
            }, 'AI 추천'),
            React.createElement('span', { style: { fontSize:11, color:'#999' } }, 'Gemini 2.0')
          ),
          React.createElement('h3', { style: { fontSize:20, fontWeight:800, color:'#1A1A18', margin:0 } }, '나에게 맞는 시설 추천받기')
        ),
        React.createElement('button', {
          onClick: onClose,
          style: { background:'none', border:'none', cursor:'pointer', fontSize:24, color:'#aaa', padding:4, lineHeight:1 }
        }, '×')
      ),

      /* 폼 (결과 없을 때) */
      !result && React.createElement(
        'form',
        { onSubmit: handleSubmit },

        /* 장애 유형 */
        React.createElement(
          'div',
          { style: { marginBottom:18 } },
          React.createElement('label', {
            style: { display:'block', fontSize:13, fontWeight:700, color:'#333', marginBottom:8 }
          }, '장애 유형 ', React.createElement('span', { style: { color:'#CF4500' } }, '*')),
          React.createElement(
            'select',
            {
              value: dtype,
              onChange: function(e) { setDtype(e.target.value); },
              required: true,
              style: {
                width:'100%', padding:'11px 14px',
                border:'1.5px solid #e0e0e0', borderRadius:12,
                fontSize:14, fontFamily:'inherit', color:'#333', background:'#fff',
              }
            },
            React.createElement('option', { value:'' }, '장애 유형을 선택하세요'),
            DISABILITY_TYPES.map(function(t) {
              return React.createElement('option', { key:t, value:t }, t);
            })
          )
        ),

        /* 거리 슬라이더 */
        React.createElement(
          'div',
          { style: { marginBottom:18 } },
          React.createElement(
            'label',
            { style: { display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:700, color:'#333', marginBottom:8 } },
            React.createElement('span', null, '최대 이동 거리'),
            React.createElement('span', { style: { color:'#CF4500', fontWeight:800 } }, maxDist + 'km')
          ),
          userLocation
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement('input', {
                  type:'range', min:1, max:100, step:1,
                  value: maxDist,
                  onChange: function(e) { setMaxDist(Number(e.target.value)); },
                  style: { width:'100%', accentColor:'#CF4500' }
                }),
                React.createElement(
                  'div',
                  { style: { display:'flex', justifyContent:'space-between', fontSize:11, color:'#aaa', marginTop:4 } },
                  React.createElement('span', null, '1km'),
                  React.createElement('span', null, '50km'),
                  React.createElement('span', null, '100km')
                ),
                React.createElement('p', { style: { fontSize:12, color:'#888', marginTop:6 } },
                  '기준: ' + (userLocation.short || userLocation.address || '')
                )
              )
            : React.createElement('div', {
                style: { padding:'12px 14px', borderRadius:12, background:'#FFF8F5', border:'1.5px solid #FFD6C0', fontSize:13, color:'#CF4500' }
              }, '📍 지도에서 GPS 위치를 먼저 설정하면 거리 기반 추천이 가능합니다.')
        ),

        /* 에러 */
        error && React.createElement('div', {
          style: { padding:'10px 14px', borderRadius:10, background:'#FFF5F5', border:'1px solid #FFCDD2', fontSize:13, color:'#C62828', marginBottom:14 }
        }, error),

        /* 제출 버튼 */
        React.createElement(
          'button',
          {
            type: 'submit',
            disabled: loading || !dtype,
            style: {
              width:'100%', padding:14,
              background: (loading || !dtype) ? '#ccc' : 'linear-gradient(135deg,#CF4500,#F37338)',
              color:'#fff', border:'none', borderRadius:14,
              fontSize:15, fontWeight:800,
              cursor: (loading || !dtype) ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }
          },
          loading
            ? [React.createElement('span', { key:'s', style: { animation:'spin 0.8s linear infinite', display:'inline-block', fontSize:18 } }, '⊙'), ' AI 분석 중…']
            : [React.createElement('span', { key:'i', style: { fontSize:16 } }, '✨'), ' AI 시설 추천받기']
        )
      ),

      /* 결과 */
      result && React.createElement(
        'div',
        null,
        React.createElement('div', {
          style: { padding:'12px 16px', borderRadius:12, marginBottom:20, background:'#F0FFF4', border:'1px solid #C6F6D5', fontSize:13, color:'#276749' }
        }, '✅ ' + dtype + ' 기준으로 ' + ((result.recommendations && result.recommendations.length) || 0) + '개 시설을 추천합니다.'),

        React.createElement(
          'div',
          { style: { display:'flex', flexDirection:'column', gap:12, marginBottom:20 } },
          (result.recommendations || []).map(function(rec, i) {
            var f = rec.facility;
            return React.createElement(
              'div',
              { key: i, style: { padding:16, borderRadius:14, border:'1.5px solid #eee', background: i === 0 ? '#FFFAF7' : '#fff' } },
              React.createElement(
                'div',
                { style: { display:'flex', alignItems:'center', gap:8, marginBottom:8 } },
                React.createElement('span', {
                  style: { background: i===0?'#CF4500':'#F37338', color:'#fff', borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }
                }, i + 1),
                React.createElement('span', { style: { fontWeight:700, fontSize:15, color:'#1A1A18' } }, rec.name),
                f && f.distKm != null && React.createElement('span', {
                  style: { marginLeft:'auto', fontSize:12, color:'#888', background:'#f5f5f5', borderRadius:999, padding:'2px 8px' }
                }, f.distKm.toFixed(1) + 'km')
              ),
              React.createElement('p', { style: { fontSize:13, color:'#555', lineHeight:1.6, margin:'0 0 8px 32px' } }, rec.reason),
              f && React.createElement(
                'div',
                { style: { marginLeft:32, fontSize:12, color:'#888' } },
                f.address && React.createElement('div', null, '📍 ' + f.address),
                f.phone && React.createElement('div', { style: { marginTop:2 } }, '☎ ' + f.phone),
                f.voucher && React.createElement('span', {
                  style: { display:'inline-block', marginTop:6, background:'#E8F4FD', color:'#1A5276', borderRadius:999, padding:'2px 8px', fontSize:11, fontWeight:700 }
                }, '바우처 가능')
              )
            );
          })
        ),

        result.advice && React.createElement('div', {
          style: { padding:'14px 16px', borderRadius:12, background:'#F8F9FA', border:'1px solid #e9ecef', fontSize:13, color:'#495057', lineHeight:1.65 }
        },
          React.createElement('strong', { style: { display:'block', marginBottom:6, color:'#333' } }, '💡 추가 안내'),
          result.advice
        ),

        React.createElement(
          'div',
          { style: { display:'flex', gap:10, marginTop:20 } },
          React.createElement('button', {
            onClick: function() { setResult(null); setError(''); },
            style: { flex:1, padding:12, background:'#f5f5f5', color:'#333', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }
          }, '다시 검색'),
          React.createElement('button', {
            onClick: onClose,
            style: { flex:1, padding:12, background:'linear-gradient(135deg,#CF4500,#F37338)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }
          }, '지도에서 확인')
        )
      )
    )
  );

  var modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(panel, modalRoot) : panel;
}

/* ============================================================
   MapPreview
   ============================================================ */
function MapPreview(props) {
  var searchFilters   = props.searchFilters;
  var propUserLocation = props.userLocation;

  var s1 = React.useState({ verified:false, weekend:false, free:false });
  var uiFilters    = s1[0];
  var setUiFilters = s1[1];

  var s2 = React.useState(0);
  var maxDistFilter    = s2[0];
  var setMaxDistFilter = s2[1];

  var s3 = React.useState(false);
  var gpsLoading    = s3[0];
  var setGpsLoading = s3[1];

  var s4 = React.useState(null);
  var localUserLoc    = s4[0];
  var setLocalUserLoc = s4[1];

  var s5 = React.useState('');
  var gpsError    = s5[0];
  var setGpsError = s5[1];

  var s6 = React.useState('');
  var mapError    = s6[0];
  var setMapError = s6[1];

  var s7 = React.useState('');
  var mapSearchQuery    = s7[0];
  var setMapSearchQuery = s7[1];

  var s8 = React.useState([]);
  var mapFacilities    = s8[0];
  var setMapFacilities = s8[1];

  var s9 = React.useState(false);
  var dataLoading    = s9[0];
  var setDataLoading = s9[1];

  var s10 = React.useState(false);
  var showAiPanel    = s10[0];
  var setShowAiPanel = s10[1];

  var s11 = React.useState(!!(window.naver && window.naver.maps));
  var naverReady    = s11[0];
  var setNaverReady = s11[1];

  var s12 = React.useState(false);
  var mapInitialized    = s12[0];
  var setMapInitialized = s12[1];

  var mapDivRef      = React.useRef(null);
  var mapObjRef      = React.useRef(null);
  var markersRef     = React.useRef([]);
  var infoWindowsRef = React.useRef([]);

  var userLocation = propUserLocation || localUserLoc;

  /* ── 표시 목록 ─────────────────────────────────────────── */
  var displayFacilities = React.useMemo(function() {
    var list = mapFacilities.slice();
    if (uiFilters.verified) list = list.filter(function(f) { return f.verified_at; });
    if (uiFilters.weekend)  list = list.filter(function(f) { return f.has_weekend; });
    if (uiFilters.free)     list = list.filter(function(f) { return f.is_free; });

    if (userLocation && userLocation.lat && window.GeoUtils) {
      list = list.map(function(f) {
        if (!f.lat || !f.lng) return f;
        return Object.assign({}, f, {
          distKm: window.GeoUtils.haversineKm(
            userLocation.lat, userLocation.lng, f.lat, f.lng
          ),
        });
      });
      if (maxDistFilter > 0) {
        list = list.filter(function(f) {
          return f.distKm == null || f.distKm <= maxDistFilter;
        });
      }
      list.sort(function(a, b) {
        return (a.distKm != null ? a.distKm : Infinity) -
               (b.distKm != null ? b.distKm : Infinity);
      });
    }
    return list;
  }, [mapFacilities, uiFilters, maxDistFilter, userLocation]);

  /* ── 지오코딩: Naver SDK → 프록시 → 포기 순 ──────────── */
  function geocodeFacility(facility) {
    if (facility.lat && facility.lng) return Promise.resolve(facility);

    var query = facility.address || (facility.region + ' ' + (facility.district || ''));
    query = query.trim();

    // 1) Naver Maps SDK geocoder (서브모듈 로드 시)
    if (window.naver && window.naver.maps && window.naver.maps.Service) {
      return new Promise(function(resolve) {
        window.naver.maps.Service.geocode(
          { query: query },
          function(status, response) {
            if (
              status === window.naver.maps.Service.Status.OK &&
              response.v2 &&
              response.v2.addresses &&
              response.v2.addresses.length > 0
            ) {
              var addr = response.v2.addresses[0];
              resolve(Object.assign({}, facility, {
                lat: parseFloat(addr.y),
                lng: parseFloat(addr.x),
              }));
            } else {
              resolve(facility);
            }
          }
        );
      });
    }

    // 2) 서버 프록시 (Vercel 배포 환경)
    return fetch('/api/naver-proxy?action=geocode&query=' + encodeURIComponent(query))
      .then(function(res) {
        if (!res.ok) return facility;
        return res.json().then(function(data) {
          var addr = data.addresses && data.addresses[0];
          if (addr) {
            return Object.assign({}, facility, {
              lat: parseFloat(addr.y),
              lng: parseFloat(addr.x),
            });
          }
          return facility;
        });
      })
      .catch(function() { return facility; });
  }

  /* ── 시설 로드 ─────────────────────────────────────────── */
  function loadFacilities(query) {
    setDataLoading(true);

    // HWPC 73개
    var hwpcList = (window.HWPC_FACILITIES || []).filter(function(f) {
      if (!query) return true;
      var q = query.toLowerCase();
      return (f.name && f.name.toLowerCase().includes(q)) ||
             (f.region && f.region.toLowerCase().includes(q)) ||
             (f.address && f.address.toLowerCase().includes(q));
    });

    // Supabase / 샘플
    window.IeumAPI.fetchFacilities(query ? { search: query } : {})
      .then(function(result) {
        var supaList = (!result.error && result.data) ? result.data : (window.SAMPLE_FACILITIES || []);

        // 중복 제거 후 합치기
        var seen = new Set();
        var combined = [];
        supaList.forEach(function(f) { seen.add(f.id); combined.push(f); });
        hwpcList.forEach(function(f) { if (!seen.has(f.id)) combined.push(f); });

        // 좌표 없는 것만 geocode (최대 50개 병렬)
        var noCoord = combined.filter(function(f) { return !f.lat || !f.lng; }).slice(0, 50);
        var hasCoord = combined.filter(function(f) { return f.lat && f.lng; });

        return Promise.all(noCoord.map(geocodeFacility)).then(function(geocoded) {
          return hasCoord.concat(geocoded);
        });
      })
      .then(function(all) {
        setMapFacilities(all);
      })
      .catch(function() {
        setMapFacilities(window.SAMPLE_FACILITIES || []);
      })
      .finally(function() {
        setDataLoading(false);
      });
  }

  /* ── Effects ────────────────────────────────────────────── */
  React.useEffect(function() { loadFacilities(''); }, []);

  React.useEffect(function() {
    if (naverReady) return;
    function trySet() {
      if (window.naver && window.naver.maps) { setNaverReady(true); return true; }
      return false;
    }
    if (trySet()) return;
    window.addEventListener('naverMapsReady', trySet);
    var id = setInterval(trySet, 500);
    return function() { window.removeEventListener('naverMapsReady', trySet); clearInterval(id); };
  }, [naverReady]);

  /* Naver SDK가 늦게 로드될 경우 좌표 없는 시설 재지오코딩 */
  React.useEffect(function() {
    if (!naverReady || mapFacilities.length === 0) return;
    var missing = mapFacilities.filter(function(f) { return !f.lat || !f.lng; });
    if (missing.length === 0) return;
    Promise.all(missing.map(geocodeFacility)).then(function(geocoded) {
      setMapFacilities(function(prev) {
        var updated = prev.slice();
        geocoded.forEach(function(gf) {
          if (!gf.lat || !gf.lng) return;
          var idx = updated.findIndex(function(f) { return f.id === gf.id; });
          if (idx !== -1) updated[idx] = gf;
        });
        return updated;
      });
    });
  }, [naverReady]);

  React.useEffect(function() {
    if (!naverReady || mapObjRef.current) return;
    var tid = setTimeout(function() {
      if (!mapDivRef.current) return;
      try {
        var N = window.naver.maps;
        var map = new N.Map(mapDivRef.current, {
          center: new N.LatLng(36.5, 127.5),
          zoom: 7,
          mapTypeId: N.MapTypeId.NORMAL,
          logoControlOptions: { position: N.Position.BOTTOM_LEFT },
          mapDataControlOptions: { position: N.Position.BOTTOM_LEFT },
        });
        mapObjRef.current = map;
        N.Event.addListener(map, 'click', function() {
          infoWindowsRef.current.forEach(function(iw) { try { iw.close(); } catch(e) {} });
        });
        setMapInitialized(true);
      } catch(err) {
        setMapError('지도를 불러오지 못했습니다. API 키 / 허용 도메인 설정을 확인하세요.');
      }
    }, 0);
    return function() { clearTimeout(tid); };
  }, [naverReady]);

  /* ── 마커 업데이트 ─────────────────────────────────────── */
  React.useEffect(function() {
    if (!mapInitialized || !mapObjRef.current) return;
    var N = window.naver.maps;
    var map = mapObjRef.current;

    markersRef.current.forEach(function(m) { try { m.setMap(null); } catch(e) {} });
    markersRef.current = [];
    infoWindowsRef.current.forEach(function(iw) { try { iw.close(); } catch(e) {} });
    infoWindowsRef.current = [];

    var valid = displayFacilities.filter(function(f) { return f.lat && f.lng; });

    valid.forEach(function(f, idx) {
      var isHwpc = f.id && String(f.id).startsWith('hwpc_');
      var color = isHwpc ? '#1B7A4B'
        : f.badge_type === 'public'    ? '#2A6FDB'
        : f.badge_type === 'business'  ? '#CF4500'
        : '#F37338';

      var marker = new N.Marker({
        position: new N.LatLng(f.lat, f.lng),
        map: map,
        title: f.name,
        icon: {
          content:
            '<div style="background:' + color + ';color:#fff;border-radius:50%;' +
            'width:30px;height:30px;display:flex;align-items:center;justify-content:center;' +
            'font-size:10px;font-weight:800;border:2.5px solid #fff;' +
            'box-shadow:0 2px 10px rgba(0,0,0,0.3);cursor:pointer;' +
            'font-family:Pretendard,-apple-system,sans-serif;">' +
            (idx + 1) + '</div>',
          anchor: new N.Point(15, 15),
        },
      });

      var typeLabel = isHwpc ? '장애인전용체육시설'
        : f.badge_type === 'public'   ? '공공 인증'
        : f.badge_type === 'business' ? '사업자 인증'
        : '지도사 인증';

      var infoHtml =
        '<div style="padding:12px 16px;min-width:200px;max-width:260px;' +
        'font-family:Pretendard,-apple-system,sans-serif;">' +
        '<div style="font-size:13.5px;font-weight:700;color:#1A1A18;margin-bottom:4px">' + f.name + '</div>' +
        '<div style="font-size:11.5px;color:' + color + ';font-weight:600;margin-bottom:4px">' + typeLabel + '</div>' +
        (f.address ? '<div style="font-size:11.5px;color:#555;margin-top:3px">' + f.address + '</div>' : '') +
        (f.phone   ? '<div style="font-size:11px;color:#888;margin-top:2px">☎ ' + f.phone + '</div>' : '') +
        (f.distKm != null && window.GeoUtils
          ? '<div style="font-size:11px;color:#888;margin-top:3px">📍 ' + window.GeoUtils.formatDistance(f.distKm) + '</div>'
          : '') +
        (f.voucher ? '<span style="display:inline-block;margin-top:6px;background:#E8F4FD;color:#1A5276;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:700">바우처</span>' : '') +
        '</div>';

      var iw = new N.InfoWindow({
        content: infoHtml,
        borderWidth: 0,
        borderRadius: '14px',
        disableAnchor: false,
        backgroundColor: '#fff',
        pixelOffset: new N.Point(0, -5),
      });

      (function(infoW, mk) {
        N.Event.addListener(mk, 'click', function() {
          infoWindowsRef.current.forEach(function(w) { try { w.close(); } catch(e) {} });
          infoW.open(map, mk);
        });
      })(iw, marker);

      markersRef.current.push(marker);
      infoWindowsRef.current.push(iw);
    });

    if (!userLocation && valid.length >= 2 && valid.length <= 80) {
      try {
        var bounds = new N.LatLngBounds(
          new N.LatLng(valid[0].lat, valid[0].lng),
          new N.LatLng(valid[0].lat, valid[0].lng)
        );
        valid.forEach(function(f) { bounds.extend(new N.LatLng(f.lat, f.lng)); });
        map.fitBounds(bounds, { top:60, right:20, bottom:20, left:20 });
      } catch(e) {}
    }
  }, [mapInitialized, displayFacilities]);

  React.useEffect(function() {
    return function() {
      markersRef.current.forEach(function(m) { try { m.setMap(null); } catch(e) {} });
      if (mapObjRef.current) { try { mapObjRef.current.destroy(); } catch(e) {} mapObjRef.current = null; }
    };
  }, []);

  React.useEffect(function() {
    if (!mapObjRef.current || !window.naver || !userLocation) return;
    mapObjRef.current.setCenter(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng));
    mapObjRef.current.setZoom(12);
  }, [userLocation && userLocation.lat, userLocation && userLocation.lng]);

  /* ── GPS ───────────────────────────────────────────────── */
  function handleGpsClick() {
    if (!window.GeoUtils) return;
    setGpsLoading(true); setGpsError('');
    window.GeoUtils.getCurrentPosition()
      .then(function(pos) {
        return window.GeoUtils.reverseGeocode(pos.lat, pos.lng)
          .then(function(geo) { setLocalUserLoc(Object.assign({}, pos, geo)); });
      })
      .catch(function(err) {
        setGpsError(err.message);
        setTimeout(function() { setGpsError(''); }, 5000);
      })
      .finally(function() { setGpsLoading(false); });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadFacilities(mapSearchQuery.trim());
  }

  function toggleFilter(key) {
    setUiFilters(function(prev) {
      return Object.assign({}, prev, { [key]: !prev[key] });
    });
  }

  var visibleCount = displayFacilities.filter(function(f) { return f.lat && f.lng; }).length;
  var hwpcCount    = (window.HWPC_FACILITIES || []).length;

  /* ── 렌더 ──────────────────────────────────────────────── */
  return React.createElement(
    'section',
    { className:'band', id:'map' },
    React.createElement(
      'div',
      { className:'wrap' },

      /* 상단 헤더 */
      React.createElement(
        'div',
        { style:{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end' } },
        React.createElement(
          'div',
          null,
          React.createElement('span', { className:'eyebrow' },
            React.createElement('span', { className:'ko' }, '지도 뷰'),
            React.createElement('span', { className:'en' }, '/ Live map')
          ),
          React.createElement('h2', { style:{ marginTop:18, maxWidth:700 } }, '지도에서 가까운 시설을 한눈에.')
        ),
        React.createElement(
          'div',
          null,
          React.createElement('p', { style:{ fontSize:15.5, lineHeight:1.65, color:'var(--ink-charcoal)', maxWidth:460 } },
            userLocation
              ? React.createElement(React.Fragment, null,
                  React.createElement('strong', { style:{ color:'var(--badge-business)' } }, 'GPS 위치 감지 중'),
                  ' — ' + (userLocation.short || '') + '을 중심으로 표시합니다.'
                )
              : '대한장애인체육회 등록 ' + hwpcCount + '개 전용시설을 지도에 표시합니다.'
          ),
          /* AI 추천 버튼 */
          React.createElement(
            'button',
            {
              onClick: function() { setShowAiPanel(true); },
              style:{
                marginTop:14, display:'inline-flex', alignItems:'center', gap:8,
                padding:'11px 22px',
                background:'linear-gradient(135deg,#CF4500,#F37338)',
                color:'#fff', border:'none', borderRadius:999,
                fontSize:14, fontWeight:800, cursor:'pointer',
                fontFamily:'inherit',
                boxShadow:'0 4px 20px rgba(207,69,0,0.35)',
              }
            },
            React.createElement('span', { style:{ fontSize:16 } }, '✨'),
            ' AI 시설 추천받기'
          )
        )
      ),

      /* GPS 배너 */
      userLocation
        ? React.createElement('div', {
            style:{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', padding:'12px 20px', borderRadius:16, marginBottom:16, background:'var(--badge-business-bg)', border:'1px solid rgba(27,122,75,0.25)' }
          },
            React.createElement(Icon, { name:'map-pin', size:16, color:'var(--badge-business)' }),
            React.createElement('span', { style:{ fontSize:13.5, fontWeight:600, color:'var(--badge-business)' } },
              '현재 위치: ' + (userLocation.short || '') +
              (userLocation.accuracy ? ' · 정확도 ' + Math.round(userLocation.accuracy) + 'm' : '')
            )
          )
        : React.createElement('div', {
            style:{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', padding:'12px 20px', borderRadius:16, marginBottom:16, background:'var(--canvas-lifted)', border:'1px solid var(--border-soft)' }
          },
            React.createElement(Icon, { name:'map-pin', size:16, color:'var(--ink-slate)' }),
            React.createElement('span', { style:{ fontSize:13.5, color:'var(--ink-slate)' } }, '전국 ' + hwpcCount + '개 장애인전용체육시설 표시 중 —'),
            React.createElement('button', {
              onClick: handleGpsClick,
              disabled: gpsLoading,
              style:{ background:'var(--ink)', color:'#fff', border:'none', borderRadius:999, padding:'7px 16px', fontSize:13, fontWeight:700, cursor: gpsLoading?'wait':'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }
            },
              gpsLoading
                ? React.createElement(React.Fragment, null, React.createElement('span', { style:{ animation:'spin 0.8s linear infinite', display:'inline-block' } }, '⊙'), ' 감지 중...')
                : React.createElement(React.Fragment, null, React.createElement(Icon, { name:'map-pin', size:13, color:'#fff' }), ' 내 위치로 이동')
            ),
            gpsError && React.createElement('span', { style:{ fontSize:12.5, color:'#C62828', display:'flex', alignItems:'center', gap:4 } },
              React.createElement(Icon, { name:'alert-circle', size:13, color:'#C62828' }), ' ', gpsError
            )
          ),

      /* 지도 프레임 */
      React.createElement(
        'div',
        { className:'map-frame', style:{ position:'relative' } },
        React.createElement('div', { ref:mapDivRef, style:{ width:'100%', height:'100%' } }),

        /* 로딩 오버레이 */
        !naverReady && !mapError && React.createElement('div', {
          style:{ position:'absolute', inset:0, zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#EDECEA', gap:12, borderRadius:'inherit' }
        },
          React.createElement('div', { style:{ width:44, height:44, borderRadius:'50%', border:'3px solid #ddd', borderTopColor:'var(--orbit-rust)', animation:'spin 0.9s linear infinite' } }),
          React.createElement('span', { style:{ fontSize:14, color:'var(--ink-slate)' } }, '네이버 지도 불러오는 중…')
        ),

        /* 에러 오버레이 */
        mapError && React.createElement('div', {
          style:{ position:'absolute', inset:0, zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#FFF5F5', gap:12, padding:24, borderRadius:'inherit' }
        },
          React.createElement(Icon, { name:'alert-circle', size:28, color:'#C62828' }),
          React.createElement('p', { style:{ fontSize:14, color:'#C62828', textAlign:'center', lineHeight:1.6, maxWidth:360 } }, mapError)
        ),

        /* 검색창 */
        React.createElement(
          'form',
          {
            onSubmit: handleSearchSubmit,
            style:{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', boxShadow:'0 4px 24px rgba(0,0,0,0.22)', borderRadius:999, overflow:'hidden', width:'min(400px, calc(100% - 240px))' }
          },
          React.createElement('input', {
            type:'text', value:mapSearchQuery,
            onChange: function(e) { setMapSearchQuery(e.target.value); },
            placeholder:'시설명, 지역, 주소 검색…',
            style:{ flex:1, padding:'11px 18px', border:'none', outline:'none', fontSize:13.5, fontFamily:'inherit', background:'#fff', color:'var(--ink)', minWidth:0 }
          }),
          React.createElement('button', {
            type:'submit', disabled:dataLoading,
            style:{ padding:'11px 18px', background:'var(--orbit-rust)', color:'#fff', border:'none', cursor:dataLoading?'wait':'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6, flexShrink:0 }
          },
            dataLoading
              ? React.createElement('span', { style:{ animation:'spin 0.8s linear infinite', display:'inline-block', fontSize:15 } }, '⊙')
              : React.createElement(Icon, { name:'search', size:15, color:'#fff', stroke:2.5 })
          )
        ),

        /* UI 오버레이 */
        React.createElement(
          'div',
          { className:'map-overlay' },

          /* 사이드 패널 */
          React.createElement(
            'aside',
            { className:'map-side-panel', style:{ pointerEvents:'auto' } },
            React.createElement('div', { className:'panel-title' },
              userLocation ? (userLocation.displayLabel || userLocation.short || '내 위치') : '전체',
              mapSearchQuery && React.createElement('span', { style:{ color:'var(--orbit-rust)' } }, ' "' + mapSearchQuery + '"')
            ),
            React.createElement('div', { className:'panel-count tnum' },
              dataLoading
                ? React.createElement('span', { style:{ fontSize:12, color:'var(--ink-slate)' } }, '검색 중…')
                : visibleCount + '개 시설'
            ),

            /* 체크박스 필터 */
            React.createElement(
              'div',
              { className:'panel-filters' },
              [
                { key:'verified', label:'인증 시설만' },
                { key:'weekend',  label:'주말 운영' },
                { key:'free',     label:'무료 프로그램' },
              ].map(function(f) {
                return React.createElement(
                  'div',
                  { key:f.key, className:'panel-filter', onClick:function() { toggleFilter(f.key); }, style:{ cursor:'pointer' } },
                  React.createElement('span', { className:'chk ' + (uiFilters[f.key] ? 'on' : '') },
                    uiFilters[f.key] && React.createElement(Icon, { name:'check', size:12, stroke:3 })
                  ),
                  React.createElement('span', { style:{ flex:1, color: uiFilters[f.key] ? 'var(--ink)' : 'var(--ink-slate)' } }, f.label)
                );
              }),

              /* 거리 슬라이더 */
              userLocation && React.createElement(
                'div',
                { style:{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border-soft)' } },
                React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--ink-slate)', marginBottom:6 } },
                  React.createElement('span', null, '최대 거리'),
                  React.createElement('span', { style:{ fontWeight:700, color: maxDistFilter>0 ? 'var(--orbit-rust)' : 'var(--ink-slate)' } },
                    maxDistFilter > 0 ? maxDistFilter + 'km' : '전체'
                  )
                ),
                React.createElement('input', {
                  type:'range', min:0, max:100, step:5,
                  value: maxDistFilter,
                  onChange: function(e) { setMaxDistFilter(Number(e.target.value)); },
                  style:{ width:'100%', accentColor:'var(--orbit-rust)' }
                })
              )
            ),

            /* 범례 */
            React.createElement('div', { style:{ display:'flex', gap:8, marginTop:8, fontSize:10, color:'var(--ink-slate)', flexWrap:'wrap' } },
              React.createElement('span', { style:{ display:'flex', alignItems:'center', gap:3 } },
                React.createElement('span', { style:{ background:'#1B7A4B', borderRadius:'50%', width:10, height:10, display:'inline-block' } }),
                ' 전용시설'
              ),
              React.createElement('span', { style:{ display:'flex', alignItems:'center', gap:3 } },
                React.createElement('span', { style:{ background:'#2A6FDB', borderRadius:'50%', width:10, height:10, display:'inline-block' } }),
                ' 공공인증'
              )
            ),

            /* 패널 내 AI 버튼 */
            React.createElement('button', {
              onClick: function() { setShowAiPanel(true); },
              style:{ width:'100%', marginTop:10, padding:'9px 0', background:'linear-gradient(135deg,#CF4500,#F37338)', color:'#fff', border:'none', borderRadius:10, fontSize:12.5, fontWeight:800, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }
            },
              React.createElement('span', null, '✨'),
              ' AI 시설 추천'
            ),

            /* 시설 목록 */
            React.createElement(
              'div',
              { style:{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border-soft)', overflowY:'auto', maxHeight:220 } },
              dataLoading
                ? React.createElement('div', { style:{ textAlign:'center', padding:'24px 0', color:'var(--ink-slate)', fontSize:13 } },
                    React.createElement('span', { style:{ animation:'spin 0.8s linear infinite', display:'inline-block', marginRight:6 } }, '⊙'),
                    '데이터 불러오는 중…'
                  )
                : displayFacilities.length === 0
                  ? React.createElement('div', { style:{ textAlign:'center', padding:'24px 0', color:'var(--ink-slate)', fontSize:13 } }, '검색 결과가 없습니다')
                  : displayFacilities.map(function(f, idx) {
                      var isHwpc = f.id && String(f.id).startsWith('hwpc_');
                      var bg = isHwpc ? '#1B7A4B' : f.badge_type==='public' ? '#2A6FDB' : f.badge_type==='business' ? '#CF4500' : '#F37338';
                      return React.createElement(
                        'div',
                        { key: f.id || idx, style:{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 0', fontSize:12, color:'var(--ink-charcoal)', borderBottom:'1px solid var(--border-soft)' } },
                        React.createElement('span', { style:{ background:bg, color:'#fff', borderRadius:'50%', width:20, height:20, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, marginTop:1 } }, idx+1),
                        React.createElement('div', { style:{ flex:1, minWidth:0 } },
                          React.createElement('div', { style:{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, f.name),
                          React.createElement('div', { style:{ fontSize:10, color:'var(--ink-slate)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' } }, f.address || f.region || '')
                        ),
                        React.createElement('div', { style:{ flexShrink:0, textAlign:'right' } },
                          f.distKm != null && window.GeoUtils
                            ? React.createElement('span', { style:{ color:'var(--ink-slate)', fontSize:11 } }, window.GeoUtils.formatDistance(f.distKm))
                            : !f.lat
                              ? React.createElement('span', { style:{ color:'var(--ink-dust)', fontSize:10 } }, '위치 미등록')
                              : null
                        )
                      );
                    })
            )
          ),

          /* GPS 버튼 */
          React.createElement('div', {
            style:{ position:'absolute', right:24, bottom:24, pointerEvents:'auto' }
          },
            React.createElement('button', {
              onClick: handleGpsClick,
              disabled: gpsLoading,
              'aria-label': '현재 위치로 이동',
              style:{ width:44, height:44, borderRadius:'50%', background: gpsLoading?'#aaa':'var(--orbit-rust)', border:0, cursor: gpsLoading?'wait':'pointer', boxShadow:'0 8px 20px rgba(0,0,0,0.16)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }
            },
              gpsLoading
                ? React.createElement('span', { style:{ animation:'spin 0.8s linear infinite', display:'inline-block', fontSize:18 } }, '⊙')
                : React.createElement(Icon, { name:'map-pin', size:18, stroke:2.2 })
            )
          )
        )
      ),

      /* 하단 범례 */
      React.createElement('div', { style:{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 } },
        React.createElement('div', { style:{ display:'flex', gap:16, fontSize:12, color:'var(--ink-slate)' } },
          React.createElement('span', { style:{ display:'flex', alignItems:'center', gap:5 } },
            React.createElement('span', { style:{ background:'#1B7A4B', borderRadius:'50%', width:12, height:12, display:'inline-block' } }),
            '대한장애인체육회 장애인전용체육시설 (' + hwpcCount + '개)'
          ),
          React.createElement('span', { style:{ display:'flex', alignItems:'center', gap:5 } },
            React.createElement('span', { style:{ background:'#2A6FDB', borderRadius:'50%', width:12, height:12, display:'inline-block' } }),
            '이음 등록 시설'
          )
        ),
        React.createElement('p', { style:{ fontSize:12, color:'var(--ink-slate)', margin:0 } }, '* 네이버 지도 API v3 / Geocoder 서브모듈')
      )
    ),

    /* AI 추천 패널 (portal) */
    showAiPanel && React.createElement(AiRecommendPanel, {
      facilities: mapFacilities,
      userLocation: userLocation,
      onClose: function() { setShowAiPanel(false); }
    })
  );
}

window.MapPreview = MapPreview;

/* ============================================================
   Provider CTA
   ============================================================ */
function ProviderCTA(props) {
  var onRegister = props.onRegister;
  var cards = [
    { role:'공공기관', title:'구청·복지관·체육회', desc:'담당자 계정으로 통합 관리. 분산된 공지를 한 채널로 모으세요.', items:['기관 코드로 즉시 인증','월별 이용 리포트 자동 생성','다중 시설 일괄 관리 (Phase 3 SaaS)'], cta:'공공기관 등록 안내', style:{} },
    { role:'민간 시설', title:'스포츠센터·학원', desc:'특수체육 대상으로 새로운 고객층을 발굴하세요.', items:['사업자등록증 1장으로 인증 신청','사진·프로그램·요금 직접 편집','프리미엄 노출 광고 (Phase 2)'], cta:'시설 등록하기', style:{ background:'rgba(243,115,56,0.10)', borderColor:'rgba(243,115,56,0.45)' } },
    { role:'프리랜서 지도자', title:'장애인스포츠지도사', desc:'자격증 한 장으로 프로필 노출. 1:1, 소그룹, 방문 지도 가능.', items:['자격증 + 본인 확인 인증','활동 지역·종목·요일 자유 설정','예약·결제 매칭 (Phase 2)'], cta:'지도자 가입', style:{} },
  ];
  return React.createElement(
    'section', { className:'band dark', id:'provider' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'5fr 4fr', gap:48, alignItems:'end' } },
        React.createElement('div', null,
          React.createElement('span', { className:'eyebrow' },
            React.createElement('span', { className:'ko', style:{ color:'var(--canvas)' } }, '공급자에게'),
            React.createElement('span', { className:'en', style:{ color:'rgba(255,255,255,0.55)' } }, '/ For providers')
          ),
          React.createElement('h2', { style:{ marginTop:18, maxWidth:720 } }, '당신의 시설을, 이음에 등록하세요.')
        ),
        React.createElement('p', { style:{ fontSize:15.5, lineHeight:1.65, color:'rgba(255,255,255,0.78)', maxWidth:460 } }, '대시보드에서 시설 정보·프로그램·정원을 직접 관리합니다. 등록은 무료, 검색 노출까지 평균 3 영업일.')
      ),
      React.createElement('div', { className:'provider-grid' },
        cards.map(function(p) {
          return React.createElement('article', { key:p.role, className:'provider-card', style:p.style },
            React.createElement('span', { className:'role-eyebrow' }, p.role),
            React.createElement('h3', null, p.title),
            React.createElement('p', { className:'role-desc' }, p.desc),
            React.createElement('ul', null, p.items.map(function(item) { return React.createElement('li', { key:item }, item); })),
            React.createElement('button', { className:'arrow-cta', onClick:function() { onRegister && onRegister(p.role); } },
              p.cta, ' ', React.createElement(Icon, { name:'arrow-up-right', size:14 })
            )
          );
        })
      ),
      React.createElement('div', { style:{ marginTop:56, background:'var(--orbit-rust)', borderRadius:32, padding:'40px 48px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' } },
        React.createElement('div', { style:{ flex:1, minWidth:320 } },
          React.createElement('h3', { style:{ color:'#fff', fontSize:26, fontWeight:700, letterSpacing:'-0.5px' } }, '지자체·복지관 파일럿 모집 중'),
          React.createElement('p', { style:{ color:'rgba(255,255,255,0.9)', fontSize:15, marginTop:10, lineHeight:1.55, maxWidth:600 } }, '서울 25개 자치구 + 국민체육진흥공단과의 B2B 파일럿을 준비하고 있어요.')
        ),
        React.createElement('div', { style:{ display:'flex', gap:12 } },
          React.createElement('button', { className:'btn-pill-ink', style:{ background:'#fff', color:'var(--orbit-rust)' }, onClick:function() { onRegister && onRegister('파트너십'); } }, '파트너십 문의 ', React.createElement(Icon, { name:'arrow-right', size:16 })),
          React.createElement('button', { className:'btn-pill-outline', style:{ borderColor:'rgba(255,255,255,0.6)', color:'#fff' } }, '제안서 다운로드')
        )
      )
    )
  );
}
window.ProviderCTA = ProviderCTA;

/* ============================================================
   Commitments
   ============================================================ */
function Commitments() {
  var items = [
    { ic:'eye',      title:'KWCAG 2.2 준수', en:'Accessibility', desc:'한국형 웹 접근성 지침. 스크린리더 ARIA 레이블, 최소 44px 터치 타겟, 전체 키보드 내비게이션.' },
    { ic:'lock',     title:'민감정보 암호화', en:'Data privacy',  desc:'장애 유형은 개인정보보호법 제23조 민감정보. Supabase RLS + 컬럼 암호화로 최소 수집·저장.' },
    { ic:'users',    title:'보호자 대리 이용', en:'Guardian flow', desc:'자녀·가족 대신 검색하는 보호자를 위해 별도 플로우를 설계 중입니다. Phase 2 출시 예정.' },
    { ic:'mountain', title:'농어촌 자동 확대', en:'Rural coverage', desc:'시설이 적은 지역은 5km → 10km → 시·도 전체로 반경을 자동 확대해 검색합니다.' },
  ];
  return React.createElement('section', { className:'band compact' },
    React.createElement('div', { className:'wrap' },
      React.createElement('span', { className:'eyebrow' },
        React.createElement('span', { className:'ko' }, '우리의 약속'),
        React.createElement('span', { className:'en' }, '/ Commitments')
      ),
      React.createElement('h2', { style:{ marginTop:18, maxWidth:720 } }, '접근성과 안전을 — 기능보다 먼저.'),
      React.createElement('div', { className:'commit-grid' },
        items.map(function(it) {
          return React.createElement('article', { key:it.title, className:'commit-card' },
            React.createElement('div', { className:'ic' }, React.createElement(Icon, { name:it.ic, size:18, stroke:2.2 })),
            React.createElement('h4', null, it.title),
            React.createElement('div', { style:{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:'var(--ink-slate)', textTransform:'uppercase', marginTop:-4 } }, it.en),
            React.createElement('p', null, it.desc)
          );
        })
      )
    )
  );
}
window.Commitments = Commitments;

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  var year = new Date().getFullYear();
  var serviceLinks = ['시설 찾기','동네별 검색','장애 유형별','지도 뷰','인증 시설'];
  var providerLinks = ['시설 등록','지도자 가입','인증 안내','대시보드 로그인','파트너십 문의 ↗'];
  var supportLinks = ['도움말 센터','접근성 가이드','스크린리더 안내','보호자 이용 안내','1:1 문의'];
  var companyLinks = ['소개','로드맵 (Phase 1~4)','채용','블로그','언론 보도'];

  function linkList(links) {
    return React.createElement('ul', null, links.map(function(t) { return React.createElement('li', { key:t }, React.createElement('a', { href:'#' }, t)); }));
  }

  return React.createElement('footer', { className:'site-foot' },
    React.createElement('div', { className:'wrap' },
      React.createElement('div', { className:'foot-grid' },
        React.createElement('div', { className:'foot-brand-block' },
          React.createElement('div', { className:'brand-title' },
            React.createElement('span', { className:'mark-mini' }),
            React.createElement('span', null, '이음')
          ),
          React.createElement('p', null, '우리 동네에서 나에게 맞는 특수체육 프로그램을 5분 안에 찾는다 — 등록 장애인 263만 명을 위한 통합 검색 플랫폼.'),
          React.createElement('div', { style:{ marginTop:24, display:'flex', flexDirection:'column', gap:6, fontSize:12.5, color:'rgba(255,255,255,0.55)' } },
            React.createElement('span', null, 'contact@ieum.kr'),
            React.createElement('span', null, '서울특별시 · ' + year)
          )
        ),
        React.createElement('div', null, React.createElement('h5', null, '서비스'), linkList(serviceLinks)),
        React.createElement('div', null, React.createElement('h5', null, '공급자'), linkList(providerLinks)),
        React.createElement('div', null, React.createElement('h5', null, '지원'), linkList(supportLinks)),
        React.createElement('div', null, React.createElement('h5', null, '회사'), linkList(companyLinks))
      ),
      React.createElement('div', { className:'foot-bottom' },
        React.createElement('div', null, '© ' + year + ' 이음. — 우리 동네 특수체육 연결 플랫폼.'),
        React.createElement('div', { className:'legal' },
          React.createElement('a', { href:'#' }, '개인정보 처리방침'),
          React.createElement('a', { href:'#' }, '이용약관'),
          React.createElement('a', { href:'#' }, '장애 정보 활용 고지')
        )
      )
    )
  );
}
window.Footer = Footer;
