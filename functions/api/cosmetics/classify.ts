const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseGeminiJson(text: string) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("AI가 JSON을 반환하지 않았습니다.");
  }

  const candidate = text.slice(jsonStart, jsonEnd + 1);
  const attempts = [
    candidate,
    candidate
      .replace(/```json|```/gi, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":'),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      continue;
    }
  }

  throw new Error("AI 응답 JSON 파싱에 실패했습니다.");
}

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body: any = await request.json();
  const { imageBase64 } = body;

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: "imageBase64 필요" }), { status: 400, headers: CORS });
  }

  const apiKey = env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key 없음" }), { status: 500, headers: CORS });
  }

  try {
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";

    const prompt = `이 화장품 제품 사진을 분석하세요.
JSON으로만 응답하세요 (다른 텍스트 절대 금지):
{"name":"제품명","brand":"브랜드명","category":"카테고리","isSkincareRelevant":true,"productType":"","ingredients":"전성분"}
카테고리는 반드시 다음 중 하나: 클렌저|토너|세럼|크림|선크림|각질케어|진정케어|장벽케어|아이크림|기타스킨케어|스킨케어아님
스킨케어아님이면 isSkincareRelevant=false, productType에 제품 종류 기입 (예: 파운데이션)
ingredients: 사진에 전성분 텍스트가 보이면 그대로 추출. 안 보이면 제품명+브랜드 기반으로 알려진 주요 성분을 쉼표로 나열. 알 수 없으면 빈 문자열.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mimeType, data: imageData } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const geminiData: any = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseGeminiJson(text);

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch {
    return new Response(
      JSON.stringify({ name: "", brand: "", category: "기타스킨케어", isSkincareRelevant: true, productType: "" }),
      { headers: CORS }
    );
  }
};
