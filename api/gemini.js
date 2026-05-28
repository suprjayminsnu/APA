/**
 * api/gemini.js — Vercel 서버리스 함수
 * Gemini API를 통해 장애인 체육시설 추천
 *
 * Vercel 환경변수:
 *   GEMINI_API_KEY → Google AI Studio에서 발급한 API 키
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const { disabilityType, maxDistanceKm, userAddress, facilities } = req.body || {};

  if (!facilities || !Array.isArray(facilities) || facilities.length === 0) {
    return res.status(400).json({ error: 'facilities 데이터가 필요합니다.' });
  }

  // 거리 정보가 있는 시설만, 없으면 전체 (최대 30개)
  const candidates = facilities
    .filter(f => f.address)
    .slice(0, 30);

  const facilityList = candidates.map((f, i) =>
    `${i + 1}. ${f.name} (${f.region} ${f.district}) — 주소: ${f.address}` +
    (f.distKm != null ? ` — 거리: ${f.distKm.toFixed(1)}km` : '') +
    (f.phone ? ` — 전화: ${f.phone}` : '') +
    (f.voucher ? ' — 바우처 가능' : '')
  ).join('\n');

  const prompt = `당신은 장애인 특수체육 시설 추천 전문가입니다.

사용자 정보:
- 장애 유형: ${disabilityType || '미입력'}
- 최대 이동 가능 거리: ${maxDistanceKm ? maxDistanceKm + 'km' : '제한 없음'}
- 현재 위치: ${userAddress || '미입력'}

아래는 대한장애인체육회 등록 장애인전용체육시설 목록입니다:
${facilityList}

위 정보를 바탕으로:
1. 사용자의 장애 유형과 거리에 가장 적합한 시설 3~5개를 추천하세요.
2. 각 시설 추천 이유를 1~2문장으로 설명하세요.
3. 추가 조언이나 주의사항을 한 단락으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 반환하세요:
{
  "recommendations": [
    {
      "rank": 1,
      "facilityIndex": <위 목록의 번호 (1-based)>,
      "name": "시설명",
      "reason": "추천 이유"
    }
  ],
  "advice": "추가 조언"
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Gemini] API 오류 (status ' + geminiRes.status + '):', errText);
      return res.status(200).json({ error: 'Gemini API 호출 실패 (' + geminiRes.status + ')', detail: errText, parseError: true });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱 (마크다운 코드블록 제거)
    const jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // 파싱 실패 시 원문 반환
      return res.status(200).json({ raw: rawText, parseError: true });
    }

    // facilityIndex로 실제 시설 데이터 연결
    if (parsed.recommendations) {
      parsed.recommendations = parsed.recommendations.map(r => {
        const idx = (r.facilityIndex || 1) - 1;
        const facility = candidates[idx] || null;
        return { ...r, facility };
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[Gemini] 서버 오류:', err);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
}
