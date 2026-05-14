/* ============================================================
   geo.js — 실제 GPS 위치 기반 유틸리티
   ============================================================ */

// ─── Haversine 거리 계산 (km) ──────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── 거리 표시 포맷 ────────────────────────────────────────
function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

// ─── getCurrentPosition (Promise 래핑) ────────────────────
function getCurrentPosition(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => {
        const msg =
          err.code === 1 ? '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.' :
          err.code === 2 ? '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.' :
          err.code === 3 ? '위치 요청 시간이 초과되었습니다.' :
          '위치를 가져오는 중 오류가 발생했습니다.';
        reject(new Error(msg));
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true, ...opts }
    );
  });
}

// ─── Nominatim 역지오코딩 (OpenStreetMap, 무료/키 불필요) ──
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko&zoom=12`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'ko', 'User-Agent': 'Ieum-Platform/1.0' }
    });
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const addr = data.address || {};

    // 한국 행정구역 파싱
    const city  = addr.city || addr.county || addr.province || addr.state || '';
    const district = addr.city_district || addr.suburb || addr.borough || '';
    const dong = addr.neighbourhood || addr.quarter || '';

    // 표시용 짧은 주소
    const short = district
      ? `${city} ${district}`
      : city || data.display_name?.split(', ').slice(-3, -1).join(' ') || '현재 위치';

    return {
      full: data.display_name,
      city,
      district,
      dong,
      short,             // 예: "서울특별시 서대문구"
      displayLabel: district || city || '현재 위치',
    };
  } catch {
    return { short: '현재 위치', displayLabel: '현재 위치', city:'', district:'', dong:'' };
  }
}

// ─── 시설 목록을 거리순 정렬 ──────────────────────────────
function sortFacilitiesByDistance(facilities, userLat, userLng) {
  return facilities
    .map(f => ({
      ...f,
      distanceKm: (f.lat && f.lng)
        ? haversineKm(userLat, userLng, f.lat, f.lng)
        : Infinity,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ─── 반경 내 시설 필터 ────────────────────────────────────
function filterByRadius(facilities, userLat, userLng, radiusKm) {
  return facilities.filter(f => {
    if (!f.lat || !f.lng) return false;
    return haversineKm(userLat, userLng, f.lat, f.lng) <= radiusKm;
  });
}

// ─── 자동 반경 확대 (PRD 농어촌 정책) ─────────────────────
// 결과가 없으면 5km → 10km → 시·도 전체(100km) 순서로 확대
function getResultsWithAutoExpand(facilities, userLat, userLng) {
  const radii = [5, 10, 30, 100];
  for (const r of radii) {
    const results = filterByRadius(facilities, userLat, userLng, r);
    if (results.length >= 3) {
      return { results: sortFacilitiesByDistance(results, userLat, userLng), radius: r };
    }
  }
  // 전체 반환
  return {
    results: sortFacilitiesByDistance(facilities, userLat, userLng),
    radius: null,
  };
}

// ─── 네이버 지도 검색 URL (시설명 검색) ───────────────────
function buildNaverMapsSearchUrl(query) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
}

// ─── 전역 노출 ─────────────────────────────────────────────
window.GeoUtils = {
  haversineKm,
  formatDistance,
  getCurrentPosition,
  reverseGeocode,
  sortFacilitiesByDistance,
  filterByRadius,
  getResultsWithAutoExpand,
  buildNaverMapsSearchUrl,
};
