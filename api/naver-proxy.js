/**
 * api/naver-proxy.js — Vercel 서버리스 함수
 * 네이버 지도 REST API 프록시.
 * Client Secret은 이 서버에서만 사용되며 프론트엔드에 절대 노출되지 않습니다.
 *
 * Vercel 환경변수 설정:
 *   NAVER_CLIENT_ID      → 네이버 클라우드 플랫폼 > Application > Client ID
 *   NAVER_CLIENT_SECRET  → 네이버 클라우드 플랫폼 > Application > Client Secret
 *
 * 사용법 (프론트엔드에서):
 *   GET /api/naver-proxy?action=geocode&query=주소명
 *   GET /api/naver-proxy?action=reverse&lat=37.5&lng=127.0
 */
export default async function handler(req, res) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(503).json({
      error: 'Naver API credentials not configured',
      hint: 'Set NAVER_CLIENT_ID and NAVER_CLIENT_SECRET in Vercel environment variables',
    });
  }

  const { action, query, lat, lng } = req.query;

  let naverUrl;

  if (action === 'geocode' && query) {
    // 주소 → 좌표
    naverUrl = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  } else if (action === 'reverse' && lat && lng) {
    // 좌표 → 주소
    naverUrl = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json&orders=roadaddr,addr`;
  } else {
    return res.status(400).json({
      error: 'Invalid parameters',
      usage: '?action=geocode&query=주소 또는 ?action=reverse&lat=위도&lng=경도',
    });
  }

  try {
    const naverRes = await fetch(naverUrl, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
        'Accept': 'application/json',
      },
    });

    const data = await naverRes.json();

    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.status(naverRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Proxy request failed', message: err.message });
  }
}
