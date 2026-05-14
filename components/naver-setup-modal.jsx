/* global React, ReactDOM, Icon */

/* ============================================================
   Naver Maps API 설정 모달
   - 로컬 개발: localStorage에 Client ID 저장
   - Vercel 배포: NAVER_CLIENT_ID 환경변수 → /api/config 자동 읽기
   - Client Secret은 Vercel 환경변수에만 저장, 절대 프론트 노출 없음
   ============================================================ */

const NAVER_ID_STORAGE_KEY = 'ieum_naver_client_id';

function NaverSetupModal({ onClose, onConfigured }) {
  const [clientId, setClientId] = React.useState('');
  const [error, setError] = React.useState('');

  function handleSave(e) {
    e.preventDefault();
    const trimmed = clientId.trim();
    if (!trimmed) {
      setError('Client ID를 입력해 주세요.');
      return;
    }
    localStorage.setItem(NAVER_ID_STORAGE_KEY, trimmed);
    onConfigured(trimmed);
  }

  const inputStyle = {
    width: '100%', padding: '13px 15px',
    border: '1.5px solid var(--border-soft)',
    borderRadius: 14, fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    letterSpacing: '0.02em',
    transition: 'border-color 200ms',
  };

  const codeStyle = {
    display: 'inline-block',
    background: '#F4F4F2', borderRadius: 6,
    padding: '2px 7px', fontFamily: 'monospace',
    fontSize: 12.5, color: '#333',
  };

  return ReactDOM.createPortal(
    <div
      role="dialog" aria-modal="true" aria-label="네이버 지도 API 설정"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(20,20,19,0.6)',
        backdropFilter: 'blur(6px)',
        padding: 20,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 28,
        padding: '40px 40px 36px',
        width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
        position: 'relative',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #03C75A, #02a84c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon name="map-pin" size={18} color="#fff" stroke={2.5}/>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
              네이버 지도 API 연결
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ink-slate)', margin: 0, marginTop: 2 }}>
              최초 1회 설정 · 이 기기에만 저장됩니다
            </p>
          </div>
        </div>

        <div style={{
          height: 1, background: 'var(--border-soft)', margin: '20px 0',
        }}/>

        {/* 안내 */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          fontSize: 13, color: '#166534', lineHeight: 1.6,
          marginBottom: 22,
        }}>
          <strong>로컬 개발 환경용 설정입니다.</strong><br/>
          Vercel에 배포할 때는 아래 <strong>환경변수</strong>를 대신 사용하세요:<br/>
          <span style={codeStyle}>NAVER_CLIENT_ID</span> &nbsp;
          <span style={codeStyle}>NAVER_CLIENT_SECRET</span>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Client ID */}
          <div>
            <label style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 7,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-slate)' }}>
                CLIENT ID (앱 키)
              </span>
              <a
                href="https://console.ncloud.com/naver-service/application"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11.5, color: 'var(--orbit-rust)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                발급받기 <Icon name="external-link" size={11} color="var(--orbit-rust)"/>
              </a>
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => { setClientId(e.target.value); setError(''); }}
              placeholder="예: abc1234defgh5678"
              style={inputStyle}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#C62828', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="alert-circle" size={13} color="#C62828"/> {error}
              </p>
            )}
          </div>

          {/* Secret 안내 */}
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: '#FFF7ED', border: '1px solid #FED7AA',
            fontSize: 12.5, color: '#92400E', lineHeight: 1.65,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="shield" size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }}/>
              <div>
                <strong>Client Secret (비밀키)는 여기에 입력하지 마세요.</strong><br/>
                비밀키는 Vercel 대시보드 → Settings → Environment Variables에<br/>
                <span style={codeStyle}>NAVER_CLIENT_SECRET</span> 으로 설정하면<br/>
                서버에서만 안전하게 사용됩니다.
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            style={{
              background: 'var(--ink)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '15px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit', transition: 'opacity 200ms',
            }}
          >
            지도 API 연결하기
            <Icon name="arrow-right" size={16} color="#fff"/>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-dust)', fontSize: 13, padding: '4px',
              fontFamily: 'inherit',
            }}
          >
            나중에 설정하기
          </button>
        </form>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}

/* ============================================================
   네이버 지도 스크립트 동적 로드
   ============================================================ */
function loadNaverMapsScript(clientId) {
  return new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) {
      resolve(); // 이미 로드됨
      return;
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => {
      // 지도가 준비됐음을 앱 전체에 알린다
      window.dispatchEvent(new CustomEvent('naverMapsReady'));
      resolve();
    };
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

/* ============================================================
   초기화: 로컬config → Vercel환경변수 → localStorage → 모달 순으로 시도
   반환값: true = 모달 표시 필요, false = 자동 설정 완료
   ============================================================ */
async function initNaverMaps() {
  // 이미 로드된 경우
  if (window.naver && window.naver.maps) return false;

  // 0순위: naver-config.local.js (로컬 개발 전용, gitignored)
  if (window.__NAVER_CLIENT_ID) {
    try {
      await loadNaverMapsScript(window.__NAVER_CLIENT_ID);
      window.__naverClientId = window.__NAVER_CLIENT_ID;
      console.log('[이음] 네이버 지도 API 연결됨 (로컬 config)');
      return false;
    } catch {
      console.warn('[이음] 로컬 config의 Client ID가 유효하지 않습니다.');
    }
  }

  // 1순위: Vercel 환경변수 (/api/config 엔드포인트)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      if (config.naverClientId) {
        await loadNaverMapsScript(config.naverClientId);
        window.__naverClientId = config.naverClientId;
        console.log('[이음] 네이버 지도 API 연결됨 (Vercel 환경변수)');
        return false;
      }
    }
  } catch {
    // /api/config 없음 = 로컬 개발 환경
  }

  // 2순위: localStorage (팝업으로 이전에 입력한 값)
  const stored = localStorage.getItem(NAVER_ID_STORAGE_KEY);
  if (stored) {
    try {
      await loadNaverMapsScript(stored);
      window.__naverClientId = stored;
      console.log('[이음] 네이버 지도 API 연결됨 (localStorage)');
      return false;
    } catch {
      localStorage.removeItem(NAVER_ID_STORAGE_KEY);
    }
  }

  // 3순위: 팝업 모달로 입력 요청
  return true;
}

window.NaverSetupModal = NaverSetupModal;
window.initNaverMaps = initNaverMaps;
window.loadNaverMapsScript = loadNaverMapsScript;
window.NAVER_ID_STORAGE_KEY = NAVER_ID_STORAGE_KEY;
