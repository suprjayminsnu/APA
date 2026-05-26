/**
 * scripts/geocode-facilities.mjs
 * 네이버 Geocoding API로 facility-data.js의 모든 시설 좌표를 사전 채워넣는 스크립트.
 *
 * 실행: npm run geocode
 * 필요: .env.local 에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 설정
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* ── .env.local 파싱 ─────────────────────────────────────── */
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local 파일이 없습니다.');
    console.error('   NAVER_CLIENT_ID 와 NAVER_CLIENT_SECRET 을 .env.local 에 추가하세요.');
    process.exit(1);
  }
  const raw = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

/* ── 시·도 중심점 폴백 ────────────────────────────────────── */
const REGION_CENTROIDS = {
  '서울': [37.5665, 126.9780],
  '부산': [35.1796, 129.0756],
  '대구': [35.8714, 128.6014],
  '인천': [37.4563, 126.7052],
  '광주': [35.1595, 126.8526],
  '대전': [36.3504, 127.3845],
  '울산': [35.5384, 129.3114],
  '세종': [36.4800, 127.2890],
  '경기': [37.4138, 127.5183],
  '강원': [37.8228, 128.1555],
  '충북': [36.6358, 127.4913],
  '충남': [36.5184, 126.8000],
  '전북': [35.7175, 127.1530],
  '전남': [34.8161, 126.4630],
  '경북': [36.4919, 128.8889],
  '경남': [35.4606, 128.2132],
  '제주': [33.4996, 126.5312],
};

function getRegionCentroid(region) {
  for (const [key, coords] of Object.entries(REGION_CENTROIDS)) {
    if (region && region.includes(key)) return coords;
  }
  return null;
}

/* ── 주소 정규화 ─────────────────────────────────────────── */
function normalizeAddress(addr) {
  let s = addr;

  // 1) 행정구역 앞 공백 제거: "서울 특별시" → "서울특별시", "대전광역 시" → "대전광역시"
  s = s.replace(/([가-힣])\s+(특별시|광역시|특별자치시|특별자치도)/g, '$1$2');

  // 2) "광역 시" 처럼 글자 중간에 공백이 낀 경우
  s = s.replace(/광역\s+시/g, '광역시');
  s = s.replace(/특별\s+시/g, '특별시');
  s = s.replace(/자치\s+시/g, '자치시');
  s = s.replace(/자치\s+도/g, '자치도');

  // 3) 시·도명이 분리된 경우: "서울 시" → "서울시", "마포 구" → "마포구", "홍천 읍" → "홍천읍"
  //    (한글 + 공백 + 시|군|구|읍|면|동|리) 패턴
  s = s.replace(/([가-힣])\s+(시|군|구|읍|면|동|리)(\s|$)/g, '$1$2$3');

  // 4) 연속 공백 → 단일 공백
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/* ── delay 유틸 ──────────────────────────────────────────── */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 네이버 Geocoding 단건 호출 ──────────────────────────── */
async function callNaver(query, clientId, clientSecret, retryCount = 0) {
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      if (retryCount === 0) {
        await delay(500);
        return callNaver(query, clientId, clientSecret, 1);
      }
      return null;
    }
    const data = await res.json();
    const addresses = data.addresses || [];
    if (addresses.length > 0) {
      return { lat: parseFloat(addresses[0].y), lng: parseFloat(addresses[0].x) };
    }
    return null;
  } catch (err) {
    if (retryCount === 0) {
      await delay(1000);
      return callNaver(query, clientId, clientSecret, 1);
    }
    return null;
  }
}

/* ── 시설 1개 지오코딩 (폴백 체인) ──────────────────────── */
async function geocodeOne(facility, clientId, clientSecret) {
  const normalized = normalizeAddress(facility.address || '');

  // (a) 정규화된 전체 주소
  let result = await callNaver(normalized, clientId, clientSecret);
  if (result) return { ...result, geocode_source: 'naver_full' };
  await delay(200);

  // (b) 마지막 토큰(번지/건물번호) 제거
  const tokens = normalized.trim().split(/\s+/);
  if (tokens.length > 1) {
    const shorter = tokens.slice(0, -1).join(' ');
    result = await callNaver(shorter, clientId, clientSecret);
    if (result) return { ...result, geocode_source: 'naver_partial' };
    await delay(200);
  }

  // (c) 시설명 + 시·도
  const nameQuery = `${facility.name} ${facility.region}`;
  result = await callNaver(nameQuery, clientId, clientSecret);
  if (result) return { ...result, geocode_source: 'naver_name' };
  await delay(200);

  // (d) 시·군·구까지만
  if (facility.district) {
    const regionStr = normalizeAddress(`${facility.region} ${facility.district}`);
    result = await callNaver(regionStr, clientId, clientSecret);
    if (result) return { ...result, geocode_source: 'naver_district' };
    await delay(200);
  }

  // (e) 시·도 중심점 폴백
  const centroid = getRegionCentroid(facility.region);
  if (centroid) {
    return { lat: centroid[0], lng: centroid[1], geocode_source: 'region_centroid' };
  }

  return { lat: null, lng: null, geocode_source: 'failed' };
}

/* ── facility-data.js 파싱 ───────────────────────────────── */
function parseFacilityData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  // 헤더 주석 보존
  const headerMatch = raw.match(/^(\/\*[\s\S]*?\*\/\s*)/);
  const header = headerMatch ? headerMatch[1] : '';

  // JSON 배열 부분 추출
  const arrMatch = raw.match(/window\.HWPC_FACILITIES\s*=\s*(\[[\s\S]*?\]);/);
  if (!arrMatch) throw new Error('window.HWPC_FACILITIES 배열을 찾을 수 없습니다.');
  const facilities = JSON.parse(arrMatch[1]);
  return { facilities, header };
}

/* ── facility-data.js 직렬화 & 저장 ─────────────────────── */
function saveFacilityData(filePath, facilities, stats) {
  const now = new Date().toISOString().slice(0, 10);
  const header =
    `/* ============================================================\n` +
    `   대한장애인체육회 장애인전용체육시설 데이터 (${facilities.length}개)\n` +
    `   좌표: 네이버 Geocoding API 사전 지오코딩 (${now} 갱신)\n` +
    `   전체 ${stats.total}개 / naver_full ${stats.naver_full}개 / naver_partial ${stats.naver_partial}개\n` +
    `          / naver_name ${stats.naver_name}개 / naver_district ${stats.naver_district}개\n` +
    `          / region_centroid ${stats.region_centroid}개 / 기존좌표유지 ${stats.kept}개\n` +
    `   ============================================================ */\n`;

  const json = JSON.stringify(facilities, null, 2);
  const content = `${header}window.HWPC_FACILITIES = ${json};\n`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

/* ── 메인 ─────────────────────────────────────────────────── */
async function main() {
  const env = loadEnv();
  const clientId = env.NAVER_CLIENT_ID;
  const clientSecret = env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ .env.local 에 NAVER_CLIENT_ID 와 NAVER_CLIENT_SECRET 이 없습니다.');
    process.exit(1);
  }

  const dataPath = path.join(ROOT, 'facility-data.js');
  console.log(`📂 파일 로드: ${dataPath}`);
  const { facilities } = parseFacilityData(dataPath);
  console.log(`✅ ${facilities.length}개 시설 파싱 완료\n`);

  // 주소 정규화 로그
  console.log('── 주소 정규화 ────────────────────────────────');
  for (const f of facilities) {
    const orig = f.address || '';
    const norm = normalizeAddress(orig);
    if (orig !== norm) {
      console.log(`  [${f.id}] "${orig}"\n       → "${norm}"`);
      f.address = norm;
    }
  }
  console.log('');

  const stats = {
    total: facilities.length,
    naver_full: 0, naver_partial: 0, naver_name: 0,
    naver_district: 0, region_centroid: 0, kept: 0, failed: 0,
  };
  const centroidList = []; // 시·도 폴백된 것들

  console.log('── 지오코딩 시작 ──────────────────────────────');
  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${facilities.length}] ${f.name} ... `);

    const geo = await geocodeOne(f, clientId, clientSecret);

    if (geo.geocode_source) {
      facilities[i] = { ...f, lat: geo.lat, lng: geo.lng, geocode_source: geo.geocode_source };
      stats[geo.geocode_source] = (stats[geo.geocode_source] || 0) + 1;

      if (geo.geocode_source === 'region_centroid') {
        centroidList.push({ id: f.id, name: f.name, address: f.address, region: f.region });
        console.log(`⚠️  region_centroid (${f.region})`);
      } else if (geo.geocode_source === 'failed') {
        stats.failed++;
        console.log(`❌ 실패`);
      } else {
        console.log(`✅ ${geo.geocode_source} → (${geo.lat?.toFixed(5)}, ${geo.lng?.toFixed(5)})`);
      }
    }

    await delay(200);
  }

  console.log('\n── 저장 ────────────────────────────────────────');
  saveFacilityData(dataPath, facilities, stats);
  console.log(`✅ facility-data.js 저장 완료`);

  // 시·도별 집계
  console.log('\n── 시·도별 지오코딩 결과 ──────────────────────');
  const byRegion = {};
  for (const f of facilities) {
    const r = f.region || '기타';
    if (!byRegion[r]) byRegion[r] = { total: 0, ok: 0, centroid: 0 };
    byRegion[r].total++;
    if (f.lat && f.lng) {
      if (f.geocode_source === 'region_centroid') byRegion[r].centroid++;
      else byRegion[r].ok++;
    }
  }
  for (const [region, cnt] of Object.entries(byRegion)) {
    console.log(`  ${region}: 전체 ${cnt.total}개 → 정확 ${cnt.ok}개, 시도폴백 ${cnt.centroid}개`);
  }

  console.log('\n── 최종 통계 ───────────────────────────────────');
  console.log(`  naver_full      : ${stats.naver_full}개`);
  console.log(`  naver_partial   : ${stats.naver_partial}개`);
  console.log(`  naver_name      : ${stats.naver_name}개`);
  console.log(`  naver_district  : ${stats.naver_district}개`);
  console.log(`  region_centroid : ${stats.region_centroid}개`);
  console.log(`  failed          : ${stats.failed || 0}개`);

  if (centroidList.length > 0) {
    console.log('\n── 시·도 폴백 목록 (수동 확인 필요) ───────────');
    for (const f of centroidList) {
      console.log(`  [${f.id}] ${f.name} | ${f.region} | ${f.address}`);
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
