/**
 * api/config.js — Vercel 서버리스 함수
 * 프론트엔드에 공개해도 되는 설정값만 반환합니다.
 * Client Secret은 절대 여기에 포함하지 마세요.
 *
 * Vercel 환경변수 설정:
 *   NAVER_CLIENT_ID  → 네이버 클라우드 플랫폼 > Application > Client ID
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.setHeader('Content-Type', 'application/json');

  res.json({
    naverClientId: process.env.NAVER_CLIENT_ID || null,
  });
}
