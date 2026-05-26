# 이음 (Ieum) — 우리 동네 특수체육 연결 플랫폼

> "우리 동네에서 나에게 맞는 특수체육 프로그램을 5분 안에 찾는다."

등록 장애인 263만 명을 위한 통합 특수체육 검색 플랫폼.

## 로컬 실행

```bash
# Python 3
python -m http.server 8080

# 브라우저에서 열기
open http://localhost:8080
```

## Supabase 연결 (선택)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. `supabase-client.js`에서 다음 두 줄을 수정:
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
   ```
3. Supabase Dashboard > SQL Editor에서 아래 테이블 생성:

```sql
-- 시설 테이블
create table facilities (
  id bigint primary key generated always as identity,
  name text not null,
  region text,
  district text,
  badge_type text check (badge_type in ('public','business','instructor')),
  programs text[],
  price_label text,
  seats_open boolean default true,
  seats_label text,
  lat numeric,
  lng numeric,
  disability_types text[],
  phone text,
  website text,
  operating_hours text,
  description text,
  is_free boolean default false,
  has_weekend boolean default false,
  is_active boolean default true,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- 공급자 등록 신청
create table provider_registrations (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users,
  name text,
  region text,
  type text,
  programs text[],
  phone text,
  contact_email text,
  description text,
  status text default 'pending',
  submitted_at timestamptz default now()
);

-- RLS 설정
alter table facilities enable row level security;
create policy "시설 공개 조회" on facilities for select using (is_active = true);

alter table provider_registrations enable row level security;
create policy "본인 신청만 조회" on provider_registrations for select using (auth.uid() = user_id);
create policy "신청 등록" on provider_registrations for insert with check (true);
```

## 시설 좌표 갱신하는 법

시설 주소가 추가·변경되거나 좌표가 없는 시설이 생기면 아래 절차로 일괄 지오코딩합니다.

1. `.env.local` 파일에 네이버 클라우드 플랫폼 API 키 설정:
   ```
   NAVER_CLIENT_ID=여기에_클라이언트ID
   NAVER_CLIENT_SECRET=여기에_클라이언트_시크릿
   ```
2. 스크립트 실행:
   ```bash
   npm run geocode
   ```
3. 변경된 `facility-data.js`를 커밋 후 Vercel에 푸시하면 자동 배포:
   ```bash
   git add facility-data.js
   git commit -m "chore: 시설 좌표 갱신"
   git push
   ```

> **참고**: `geocode_source === "region_centroid"` 인 시설은 정확한 도로명 주소를 못 찾아 시·도 중심점으로 표시된 것입니다. 지도에서 반투명·점선 마커로 구분되므로 수동 확인 후 `facility-data.js`에서 직접 좌표를 수정하세요.

## 네이버 지도 API 연결

1. [Naver Cloud Platform](https://www.ncloud.com)에서 API 키 발급
2. `index.html`에서 주석 해제 후 `YOUR_CLIENT_ID` 교체:
   ```html
   <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
   ```

## 기술 스택

- **Frontend**: React 18 (Babel Standalone — 빌드 불필요)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **지도**: Google Maps Embed (→ Naver Maps API v3 전환 예정)
- **폰트**: Pretendard (한국어 최적화)
- **디자인 시스템**: Orbit (Claude Design)

## 구현된 기능

- [x] 히어로 검색 (지역 / 장애 유형 / 종목 드롭다운)
- [x] 실시간 신규 프로그램 티커
- [x] 자치구별 시설 필터링
- [x] 장애 유형 15개 필터
- [x] 시설 상세 모달 (전화/지도/관심저장)
- [x] 로그인/회원가입 (Supabase Auth)
- [x] 공급자 등록 신청 폼
- [x] Google Maps 지도 뷰
- [x] 반응형 (모바일/태블릿/데스크탑)
- [x] 접근성 (ARIA, 키보드 내비게이션, 44px 터치 타겟)

## 로드맵

| Phase | 기능 |
|-------|------|
| 1 (현재) | 검색 + 시설 상세 + 공급자 등록 |
| 2 | 예약·결제 매칭, 보호자 플로우, 프리미엄 노출 |
| 3 | 공공기관 SaaS, 다중 시설 관리, 모바일 앱 |
| 4 | AI 매칭 추천, 커뮤니티 기능 |
