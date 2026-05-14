/* global React, ReactDOM,
   Nav, Hero, ImpactStrip, Neighborhoods, DisabilityTypes,
   TrustSystem, MapPreview, ProviderCTA, Commitments, Footer,
   TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor,
   useTweaks, Icon,
   AuthModal, FacilityDetailModal, ProviderRegisterModal,
   SearchResultsBar
*/

const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = {
  accent: '#CF4500',
  heroVariant: 'constellation',
  showLiveTicker: true,
  denseFacilities: false,
  showCommitments: true,
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Auth state
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'signup'

  // Search filters (from hero)
  const [searchFilters, setSearchFilters] = useState(null);
  const [totalSearchCount, setTotalSearchCount] = useState(0);

  // Modals
  const [facilityDetail, setFacilityDetail] = useState(null);
  const [providerRegModal, setProviderRegModal] = useState(null);

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--orbit-rust', t.accent);
  }, [t.accent]);

  // Init Supabase + auth listener
  useEffect(() => {
    if (window.IeumAPI) {
      window.IeumAPI.initSupabase();
      window.IeumAPI.getSession().then(session => {
        if (session?.user) setUser(session.user);
      });
      const unsubscribe = window.IeumAPI.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return unsubscribe;
    }
  }, []);

  // Search handler
  const handleSearch = useCallback((filters) => {
    setSearchFilters(filters);
    // Count results
    const all = window.SAMPLE_FACILITIES || [];
    let list = all;
    if (filters.dtype) list = list.filter(f => f.disability_types?.includes(filters.dtype));
    if (filters.sport) list = list.filter(f => f.programs?.includes(filters.sport));
    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    if (filters.weekend) list = list.filter(f => f.has_weekend);
    setTotalSearchCount(list.length);
  }, []);

  // Type filter from disability section
  const handleTypeSelect = useCallback((dtype) => {
    if (dtype) handleSearch({ ...(searchFilters||{}), dtype });
  }, [searchFilters, handleSearch]);

  // Logout
  async function handleLogout() {
    await window.IeumAPI?.signOut();
    setUser(null);
  }

  return (
    <div id="top" data-screen-label="01 Landing">
      <Nav
        user={user}
        onLogin={() => setAuthModal('login')}
        onSignup={() => setAuthModal('signup')}
        onLogout={handleLogout}
      />

      <SearchResultsBar filters={searchFilters} totalCount={totalSearchCount}/>

      <Hero variant={t.heroVariant} onSearch={handleSearch}/>

      <ImpactStrip showTicker={t.showLiveTicker}/>

      <Neighborhoods
        dense={t.denseFacilities}
        searchFilters={searchFilters}
        onDetail={(f) => setFacilityDetail(f)}
      />

      <DisabilityTypes onTypeSelect={handleTypeSelect}/>

      <TrustSystem/>

      <MapPreview searchFilters={searchFilters}/>

      <ProviderCTA
        onRegister={(role) => {
          if (!user) { setAuthModal('login'); return; }
          setProviderRegModal(role);
        }}
      />

      {t.showCommitments && <Commitments/>}

      <Footer/>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks · 이음 디자인">
        <TweakSection label="브랜드 액센트"/>
        <TweakColor
          label="포인트 색상"
          value={t.accent}
          options={['#CF4500','#F37338','#9A3A0A','#2A6FDB','#1B7A4B']}
          onChange={v => setTweak('accent', v)}
        />
        <TweakSection label="히어로 변형"/>
        <TweakRadio
          label="레이아웃"
          value={t.heroVariant}
          options={['constellation','search','photo']}
          onChange={v => setTweak('heroVariant', v)}
        />
        <TweakSection label="섹션 토글"/>
        <TweakToggle
          label="실시간 신규 티커"
          value={t.showLiveTicker}
          onChange={v => setTweak('showLiveTicker', v)}
        />
        <TweakToggle
          label="시설 카드 조밀하게"
          value={t.denseFacilities}
          onChange={v => setTweak('denseFacilities', v)}
        />
        <TweakToggle
          label="우리의 약속 섹션"
          value={t.showCommitments}
          onChange={v => setTweak('showCommitments', v)}
        />
      </TweaksPanel>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={u => setUser(u)}
        />
      )}

      {/* Facility Detail Modal */}
      {facilityDetail && (
        <FacilityDetailModal
          facility={facilityDetail}
          onClose={() => setFacilityDetail(null)}
          user={user}
          onLoginNeeded={() => setAuthModal('login')}
        />
      )}

      {/* Provider Register Modal */}
      {providerRegModal && (
        <ProviderRegisterModal
          role={providerRegModal}
          onClose={() => setProviderRegModal(null)}
          user={user}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
