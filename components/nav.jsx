/* global React, Icon, BrandMark */

function Nav({ user, onLogin, onSignup, onLogout, currentSection }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const links = [
    { href: '#regions', label: '동네 검색' },
    { href: '#types',   label: '장애 유형' },
    { href: '#map',     label: '지도' },
    { href: '#trust',   label: '신뢰 인증' },
    { href: '#provider', label: '시설 등록' },
  ];

  return (
    <div className="nav-outer" role="navigation" aria-label="주 내비게이션">
      <nav className="nav-pill">
        <a href="#top" className="brand" aria-label="이음 홈으로">
          <span className="mark" aria-hidden="true"/>
          이음
        </a>

        <div className="links" role="menubar">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className={currentSection === l.href.slice(1) ? 'active' : ''}
              role="menuitem">
              {l.label}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <button className="icon-btn" aria-label="검색"
            onClick={() => document.getElementById('hero-search-input')?.focus()}>
            <Icon name="search" size={18} stroke={2.2}/>
          </button>

          {user ? (
            <>
              <span style={{
                fontSize: 13, fontWeight: 600, color: 'var(--ink)',
                padding: '6px 12px',
              }}>
                {user.email?.split('@')[0]}
              </span>
              <button
                className="btn-pill-ink"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={onLogout}
                aria-label="로그아웃">
                <Icon name="log-out" size={14}/>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-pill-outline"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={onLogin}
                aria-label="로그인">
                로그인
              </button>
              <button
                className="btn-pill-ink"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={onSignup}
                aria-label="회원가입">
                회원가입
              </button>
            </>
          )}
        </div>

        <button className="icon-btn mobile-menu-btn" aria-label="메뉴 열기"
          onClick={() => setMenuOpen(v => !v)}
          style={{ display: 'none' }}>
          <Icon name={menuOpen ? 'x' : 'menu'} size={20}/>
        </button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu" role="menu">
          {links.map(l => (
            <a key={l.href} href={l.href} role="menuitem"
              onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          {!user && (
            <>
              <button onClick={() => { onLogin(); setMenuOpen(false); }}>로그인</button>
              <button onClick={() => { onSignup(); setMenuOpen(false); }}>회원가입</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

window.Nav = Nav;
