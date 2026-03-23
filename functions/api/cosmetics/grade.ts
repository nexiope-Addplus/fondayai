import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromCookie } from "../../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseGeminiJson(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    const cleaned = candidate
      .replace(/```json|```/gi, "")
      .replace(/[""]/g, '"')
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned);
  }
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: CORS });

  try {
    const user = await getUserFromCookie(request, env.JWT_SECRET!);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

    const body: any = await request.json();
    const { baumannType, scores, lang } = body;

    // DB에서 사용자 화장품 목록 가져오기
    const db = env.FONDAY_DB;
    if (!db) return new Response(JSON.stringify({ error: "DB unavailable" }), { status: 500, headers: CORS });

    const cosmResult = await db
      .prepare("SELECT * FROM cosmetics WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC")
      .bind(user.id)
      .all();
    const cosmetics: any[] = cosmResult.results ?? [];

    if (cosmetics.length === 0) {
      return new Response(JSON.stringify([]), { headers: CORS });
    }

    // 피부 점수 요약
    const scoresArr = Array.isArray(scores) ? scores : [];
    const weakMetrics = scoresArr
      .filter((s: any) => s && s.score !== undefined)
      .sort((a: any, b: any) => Number(a.score) - Number(b.score))
      .slice(0, 3)
      .map((s: any) => `${s.label}(${s.score}점)`)
      .join(", ");

    const cosmeticList = cosmetics
      .map((c: any) => `- id:"${c.id}" name:"${c.name}" brand:"${c.brand || ""}" category:"${c.category}" ingredients:"${c.ingredients || ""}"`)
      .join("\n");

    const langInst = lang === "ko" ? "한국어" : lang === "ja" ? "日本語" : "English";
    const prompt = `
당신은 피부과 전문의 수준의 화장품 성분 분석 AI입니다.
아래 사용자 피부 정보와 화장품 목록을 분석하여 각 제품에 대한 궁합 성적을 매겨주세요.

[사용자 피부 정보]
- 바우만 피부 타입: ${baumannType || "분석 전"}
- 취약 지표 (낮은 순): ${weakMetrics || "없음"}

[화장품 목록]
${cosmeticList}

[지시사항]
1. 각 화장품 id에 대해 아래 JSON 형식으로 분석하세요.
2. grade: A(90+) B(75+) C(60+) D(40+) F(40미만)
3. pros: 이 피부 타입에 좋은 성분/효과 (최대 3개, ${langInst}로)
4. cons: 주의해야 할 성분/이유 (최대 2개, ${langInst}로, 없으면 빈 배열)
5. keyIngredients: 핵심 성분 (최대 3개, 성분명만)
6. conflictIngredients: 피부 타입과 충돌하는 성분 (있으면, 없으면 빈 배열)
7. summary: 한 줄 요약 (${langInst}로, 20자 이내)
8. ingredients 정보가 없으면 카테고리와 바우만 타입으로 추정하세요.
9. 반드시 모든 화장품 id에 대한 결과를 반환하세요.

반드시 아래 JSON 배열만 반환하세요 (설명 없이):
[
  {
    "id": "화장품id",
    "grade": "A",
    "score": 85,
    "summary": "수분 부족 피부에 최적",
    "pros": ["히알루론산으로 수분 공급", "저자극 성분"],
    "cons": [],
    "keyIngredients": ["히알루론산", "세라마이드"],
    "conflictIngredients": []
  }
]
`;

    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const grades = parseGeminiJson(text);
    if (!Array.isArray(grades)) throw new Error("Invalid response format");

    return new Response(JSON.stringify(grades), { headers: CORS });

  } catch (err: any) {
    console.error("[cosmetics/grade]", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
};
