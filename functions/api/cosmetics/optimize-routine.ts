import { getUserFromCookie } from "../../_utils/jwt";

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
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
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

  const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");
  if (!user) {
    return new Response(JSON.stringify({ error: "로그인 필요" }), { status: 401, headers: CORS });
  }

  const body: any = await request.json();
  const { cosmetics } = body;

  if (!Array.isArray(cosmetics) || cosmetics.length === 0) {
    return new Response(JSON.stringify({ am: [], pm: [], conflicts: [] }), { headers: CORS });
  }

  const apiKey = env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key 없음" }), { status: 500, headers: CORS });
  }

  try {
    const cosmeticList = cosmetics.map((c: any) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      time_of_day: c.time_of_day,
      ingredients: c.ingredients || "",
    }));

    const prompt = `당신은 피부과 전문의입니다. 다음 화장품 목록을 분석하여 아침(AM)과 저녁(PM) 루틴을 최적화해주세요.

화장품 목록:
${JSON.stringify(cosmeticList, null, 2)}

규칙:
1. 성분 충돌 검사 (같은 루틴에 함께 쓰면 안 되는 조합):
   - 레티놀/레티날/레티노이드 + AHA/BHA(글라이콜릭애씨드/살리실릭애씨드/락틱애씨드) → 강한 자극
   - 레티놀/레티날 + 비타민C(아스코르빌글루코사이드/아스코르브산) → AM/PM 분리 권장
   - 비타민C + AHA/BHA → 자극 증가
   - 복수의 AHA/BHA 제품 → 과각질제거
   - 나이아신아마이드 고농도 + 비타민C 고농도 → 효과 감소
2. 충돌이 있으면 하나를 AM, 하나를 PM으로 분리하거나 덜 중요한 것을 제외
3. 카테고리별 기본 시간: 클렌저(AM+PM), 토너(AM+PM), 세럼(AM+PM), 선크림(AM전용), 각질케어(PM), 레티놀포함크림(PM), 진정케어(PM), 장벽케어(PM), 크림(PM)
4. 제품의 time_of_day가 am 또는 pm으로 지정된 경우 그것을 우선 적용
5. 바르는 순서: 클렌저→토너→각질케어→세럼→아이크림→진정케어→장벽케어→크림→선크림

반드시 아래 JSON 형식으로만 응답 (다른 텍스트 절대 금지):
{
  "am": [{"id":"제품id","order":1}, {"id":"제품id","order":2}],
  "pm": [{"id":"제품id","order":1}, {"id":"제품id","order":2}],
  "conflicts": [{"productNames":["제품명1","제품명2"],"reason":"충돌 이유","resolution":"해결 방법"}]
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const geminiData: any = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseGeminiJson(text);

    return new Response(JSON.stringify(parsed), { headers: CORS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
};
