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

  const candidates = facilities
    .filter(f => f.address)
    .slice(0, 10);

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

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
  });

  const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
  ];

  async function callGemini(modelIndex, attempt) {
    const model = MODELS[modelIndex];
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
    );
    if (geminiRes.status === 429) {
      // 같은 모델 재시도 (최대 2회, 지수 백오프)
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
        return callGemini(modelIndex, attempt + 1);
      }
      // 다음 모델로 폴백
      if (modelIndex + 1 < MODELS.length) {
        console.warn(`[Gemini] ${model} 429 — ${MODELS[modelIndex + 1]}로 폴백`);
        return callGemini(modelIndex + 1, 1);
      }
    }
    return geminiRes;
  }

  try {
    const geminiRes = await callGemini(0, 1);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[Gemini] API 오류 (status ' + geminiRes.status + '):', errText);
      return res.status(200).json({ error: 'Gemini API 호출 실패 (' + geminiRes.status + ')', detail: errText, parseError: true });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱: 마크다운 제거 후 { } 범위 추출
    let jsonText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd = jsonText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) jsonText = jsonText.slice(jsonStart, jsonEnd + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error('[Gemini] JSON 파싱 실패, 원문:', rawText.slice(0, 300));
      return res.status(200).json({ raw: rawText, parseError: true });
    }

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
