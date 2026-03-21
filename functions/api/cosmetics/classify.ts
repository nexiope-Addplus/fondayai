const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_CATEGORIES = new Set([
  "클렌저",
  "토너",
  "세럼",
  "크림",
  "선크림",
  "각질케어",
  "진정케어",
  "장벽케어",
  "아이크림",
  "기타스킨케어",
  "스킨케어아님",
]);

function normalizeCategory(category?: string) {
  if (!category) return "기타스킨케어";
  return ALLOWED_CATEGORIES.has(category) ? category : "기타스킨케어";
}

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
반드시 사진에서 직접 읽히는 정보만 사용하세요. 보이지 않는 브랜드/제품명/전성분을 추정해서 지어내면 안 됩니다.
JSON으로만 응답하세요 (다른 텍스트 절대 금지):
{"name":"제품명","brand":"브랜드명","category":"카테고리","isSkincareRelevant":true,"productType":"","ingredients":"전성분","confidence":"high|medium|low"}
카테고리는 반드시 다음 중 하나: 클렌저|토너|세럼|크림|선크림|각질케어|진정케어|장벽케어|아이크림|기타스킨케어|스킨케어아님
규칙:
1. 제품명/브랜드는 사진에서 읽히는 경우만 기입. 불명확하면 빈 문자열.
2. 전성분은 사진에 실제로 보이는 경우만 추출. 보이지 않으면 절대 추정하지 말고 빈 문자열.
3. 메이크업, 향수, 헤어제품, 바디제품이면 isSkincareRelevant=false 와 category="스킨케어아님" 으로 반환.
4. 스킨케어 제품이지만 정확한 분류가 애매하면 category="기타스킨케어".
5. confidence는 사진에서 텍스트/제품 유형이 얼마나 분명한지 high|medium|low 중 하나로 반환.`;

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
    parsed.category = normalizeCategory(parsed.category);
    if (parsed.category === "스킨케어아님") parsed.isSkincareRelevant = false;
    if (!["high", "medium", "low"].includes(parsed.confidence)) parsed.confidence = "low";
    if (typeof parsed.ingredients !== "string") parsed.ingredients = "";
    if (typeof parsed.name !== "string") parsed.name = "";
    if (typeof parsed.brand !== "string") parsed.brand = "";

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch {
    return new Response(
      JSON.stringify({ name: "", brand: "", category: "기타스킨케어", isSkincareRelevant: true, productType: "", ingredients: "", confidence: "low" }),
      { headers: CORS }
    );
  }
};
