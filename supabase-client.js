// Supabase client configuration
// Replace with your actual Supabase project URL and anon key
// Get these from: https://supabase.com/dashboard > Project Settings > API

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client (loaded via CDN in index.html)
// NOTE: variable named _supabase to avoid conflict with global window.supabase from CDN
let _supabase = null;

function initSupabase() {
  if (typeof window.supabase !== 'undefined' &&
      SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co') {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[이음] Supabase 연결됨');
    return true;
  }
  console.warn('[이음] Supabase 미설정 — 샘플 데이터로 실행 중');
  return false;
}

// ─── Auth helpers ───────────────────────────────────────────────────────────

async function signUp(email, password, metadata = {}) {
  if (!_supabase) return { error: { message: 'Supabase가 설정되지 않았습니다.' } };
  return _supabase.auth.signUp({ email, password, options: { data: metadata } });
}

async function signIn(email, password) {
  if (!_supabase) return { error: { message: 'Supabase가 설정되지 않았습니다.' } };
  return _supabase.auth.signInWithPassword({ email, password });
}

async function signOut() {
  if (!_supabase) return;
  return _supabase.auth.signOut();
}

async function getSession() {
  if (!_supabase) return null;
  const { data } = await _supabase.auth.getSession();
  return data.session;
}

function onAuthStateChange(callback) {
  if (!_supabase) return () => {};
  const { data: { subscription } } = _supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ─── Facilities API ─────────────────────────────────────────────────────────

async function fetchFacilities(filters = {}) {
  if (!_supabase) {
    // Supabase 미연결 시 빈 배열 반환 — 지도에는 HWPC 73개만 표시
    return { data: [], error: null };
  }

  let query = _supabase
    .from('facilities')
    .select(`
      id, name, region, district, badge_type,
      programs, price_label, seats_open, seats_label,
      lat, lng, description, phone, website,
      disability_types, operating_hours,
      created_at, verified_at
    `)
    .eq('is_active', true);

  if (filters.district) query = query.eq('district', filters.district);
  if (filters.disability_type) query = query.contains('disability_types', [filters.disability_type]);
  if (filters.sport) query = query.contains('programs', [filters.sport]);
  if (filters.verified_only) query = query.not('verified_at', 'is', null);
  if (filters.seats_open) query = query.eq('seats_open', true);
  if (filters.free_only) query = query.eq('is_free', true);
  if (filters.weekend) query = query.eq('has_weekend', true);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  query = query.order('verified_at', { ascending: false, nullsFirst: false });

  return query;
}

async function fetchFacilityById(id) {
  if (!_supabase) {
    const f = SAMPLE_FACILITIES.find(f => f.id === id);
    return { data: f, error: null };
  }
  return _supabase.from('facilities').select('*').eq('id', id).single();
}

async function registerProvider(data) {
  if (!_supabase) return { error: { message: 'Supabase가 설정되지 않았습니다.' } };
  return _supabase.from('provider_registrations').insert([data]);
}

// ─── Sample data (fallback when Supabase is not configured) ─────────────────

const SAMPLE_FACILITIES = [
  {
    id: 1,
    name: '서대문구장애인복지관',
    region: '서울특별시 서대문구',
    district: '서대문구',
    badge_type: 'public',
    programs: ['수영', '필라테스', '풋살'],
    price_label: '월 4만원',
    seats_open: true,
    seats_label: '정원 8명 중 3자리',
    lat: 37.5795, lng: 126.9368,
    disability_types: ['지체장애', '뇌병변', '지적장애', '자폐성'],
    phone: '02-360-8500',
    website: 'https://swdc.or.kr',
    operating_hours: '월-금 09:00-18:00, 토 09:00-13:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #C0DDEB 0%, #5DA8CF 60%, #1B5F88 100%)',
    description: '서대문구에서 운영하는 공립 장애인복지관으로 수영, 필라테스, 풋살 등 다양한 프로그램을 제공합니다.',
    is_free: false,
    has_weekend: true,
    verified_at: '2026-01-15',
  },
  {
    id: 2,
    name: '연남 인클루시브 요가',
    region: '서울특별시 마포구',
    district: '마포구',
    badge_type: 'instructor',
    programs: ['요가', '명상'],
    price_label: '회당 2만원',
    seats_open: true,
    seats_label: '정원 6명 중 5자리',
    lat: 37.5622, lng: 126.9271,
    disability_types: ['지체장애', '뇌병변', '시각장애'],
    phone: '010-1234-5678',
    website: null,
    operating_hours: '화·목 10:00-12:00, 토 14:00-16:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #F4D9D2 0%, #D38A86 60%, #8B3A3A 100%)',
    description: '인클루시브 요가를 통해 모든 장애 유형의 분들이 함께하는 소그룹 수업입니다. 국가공인 장애인스포츠지도사가 직접 진행합니다.',
    is_free: false,
    has_weekend: true,
    verified_at: '2026-02-03',
  },
  {
    id: 3,
    name: '강남구장애인체육관',
    region: '서울특별시 강남구',
    district: '강남구',
    badge_type: 'public',
    programs: ['휠체어 농구', '탁구', '볼링'],
    price_label: '월 3만원',
    seats_open: false,
    seats_label: '정원 마감',
    lat: 37.5172, lng: 127.0473,
    disability_types: ['지체장애', '뇌병변', '청각장애'],
    phone: '02-3423-5555',
    website: 'https://gangnam.go.kr',
    operating_hours: '월-토 09:00-21:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #FCC9A1 0%, #F37338 60%, #9A3A0A 100%)',
    description: '강남구에서 운영하는 구립 장애인체육관. 휠체어 농구, 탁구, 볼링 등 다양한 경기 종목을 체험할 수 있습니다.',
    is_free: false,
    has_weekend: true,
    verified_at: '2026-01-20',
  },
  {
    id: 4,
    name: '동작 키즈 발달체육',
    region: '서울특별시 동작구',
    district: '동작구',
    badge_type: 'business',
    programs: ['발달지원 체조', '감각운동'],
    price_label: '월 16만원',
    seats_open: true,
    seats_label: '정원 4명 중 2자리',
    lat: 37.5124, lng: 126.9393,
    disability_types: ['지적장애', '자폐성', '뇌병변'],
    phone: '02-820-1234',
    website: null,
    operating_hours: '월·수·금 15:00-18:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #FAE7C7 0%, #E8B560 60%, #A56B14 100%)',
    description: '아동 발달장애 전문 소그룹 체육 수업. 감각통합과 대근육 발달에 특화된 프로그램을 운영합니다.',
    is_free: false,
    has_weekend: false,
    verified_at: '2026-03-01',
  },
  {
    id: 5,
    name: '관악 둘레길 등산 모임',
    region: '서울특별시 관악구',
    district: '관악구',
    badge_type: 'instructor',
    programs: ['등산', '걷기'],
    price_label: '무료',
    seats_open: true,
    seats_label: '매주 토요일',
    lat: 37.4784, lng: 126.9516,
    disability_types: ['지체장애', '시각장애', '정신장애'],
    phone: '010-9876-5432',
    website: null,
    operating_hours: '토 08:00-12:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #D9EAD0 0%, #7BA76A 60%, #345E2D 100%)',
    description: '관악산 둘레길을 함께 걷는 장애인 등산 모임. 매주 토요일 오전 관악구청 앞에서 출발합니다.',
    is_free: true,
    has_weekend: true,
    verified_at: '2026-02-15',
  },
  {
    id: 6,
    name: '송파 인클루시브 댄스',
    region: '서울특별시 송파구',
    district: '송파구',
    badge_type: 'business',
    programs: ['댄스', '리듬체조'],
    price_label: '월 9만원',
    seats_open: true,
    seats_label: '정원 10명 중 7자리',
    lat: 37.5145, lng: 127.1059,
    disability_types: ['지체장애', '청각장애', '지적장애', '자폐성'],
    phone: '02-411-7890',
    website: 'https://inclusive-dance.kr',
    operating_hours: '화·목 18:00-20:00, 토 14:00-16:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #E7DBF2 0%, #9A82C7 60%, #4F3A8E 100%)',
    description: '휠체어 댄스, 인클루시브 댄스 전문 스튜디오. 청각장애·지체장애·발달장애 통합 수업을 운영합니다.',
    is_free: false,
    has_weekend: true,
    verified_at: '2026-01-30',
  },
  {
    id: 7,
    name: '노원구 시각장애인 수영교실',
    region: '서울특별시 노원구',
    district: '노원구',
    badge_type: 'public',
    programs: ['수영'],
    price_label: '월 2만원',
    seats_open: true,
    seats_label: '정원 6명 중 4자리',
    lat: 37.6542, lng: 127.0568,
    disability_types: ['시각장애'],
    phone: '02-950-3333',
    website: 'https://nowon.go.kr',
    operating_hours: '월·수·금 10:00-12:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #BFE2F2 0%, #4A9FD0 60%, #1B5F88 100%)',
    description: '시각장애인 전용 수영 프로그램. 경험 풍부한 장애인스포츠지도사가 1:1 보조 교육을 제공합니다.',
    is_free: false,
    has_weekend: false,
    verified_at: '2026-02-10',
  },
  {
    id: 8,
    name: '종로 청각장애 배드민턴',
    region: '서울특별시 종로구',
    district: '종로구',
    badge_type: 'business',
    programs: ['배드민턴', '탁구'],
    price_label: '월 6만원',
    seats_open: true,
    seats_label: '정원 12명 중 8자리',
    lat: 37.5720, lng: 126.9792,
    disability_types: ['청각장애'],
    phone: '02-731-2200',
    website: null,
    operating_hours: '토·일 09:00-17:00',
    portrait_gradient: 'radial-gradient(circle at 30% 25%, #D0ECF5 0%, #5BACC5 60%, #2A7A9A 100%)',
    description: '청각장애인을 위한 배드민턴·탁구 동호회. 수어로 소통하며 함께 즐기는 스포츠 공간입니다.',
    is_free: false,
    has_weekend: true,
    verified_at: '2026-03-05',
  },
];

window.SAMPLE_FACILITIES = SAMPLE_FACILITIES;
window.IeumAPI = {
  initSupabase,
  signUp,
  signIn,
  signOut,
  getSession,
  onAuthStateChange,
  fetchFacilities,
  fetchFacilityById,
  registerProvider,
};
