import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  
  try {
    const user = await getUserFromCookie(request, env);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

    const url = new URL(request.url);
    const temp = url.searchParams.get("temp");
    const humidity = url.searchParams.get("humidity");
    const aqi = url.searchParams.get("aqi");

    if (!temp || !humidity) {
      return new Response(JSON.stringify({ error: "Weather data required" }), { status: 400, headers: CORS });
    }

    // 1. 유저의 최근 스캔 데이터 가져오기
    const kvKey = `scans:${user.id}`;
    const rawScans = await env.SCANS_KV.get(kvKey);
    const scans = rawScans ? JSON.parse(rawScans) : [];
    
    if (scans.length === 0) {
      return new Response(JSON.stringify({ briefing: "첫 스캔을 완료하시면 맞춤 케어 브리핑을 시작할게요!" }), { headers: CORS });
    }

    const latest = scans[0];
    const weakest = [...latest.scores].slice(1).sort((a: any, b: any) => a.score - b.score)[0];

    // 2. Gemini를 이용한 능동적 조언 생성
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      당신은 개인 피부 케어 매니저입니다. 아래 정보를 바탕으로 유저에게 오늘 꼭 필요한 '한 문장' 조언을 한국어로 해주세요.
      - 유저의 가장 취약한 지표: ${weakest.label} (점수: ${weakest.score}/100)
      - 현재 날씨: 기온 ${temp}도, 습도 ${humidity}%, 공기질 지수(AQI) ${aqi || '보통'}
      - 유저의 바우만 타입: ${latest.baumannType}
      
      지시사항:
      1. 친절하면서도 전문적인 비서처럼 말하세요.
      2. 날씨 위협 요소와 피부 취약점을 직접 연결하세요. (예: "오늘은 습도가 낮아 ${weakest.label} 점수가 더 떨어질 수 있으니...")
      3. 아주 구체적인 행동 하나를 제안하세요.
      4. 딱 한 문장으로 답변하세요. (25자 내외 권장)
    `;

    const result = await model.generateContent(prompt);
    const briefing = result.response.text().trim();

    return new Response(JSON.stringify({ 
      briefing,
      priority: Number(humidity) < 30 || Number(temp) > 30 ? "high" : "normal",
      targetMetric: weakest.label
    }), { headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ briefing: "오늘도 당신의 피부를 응원합니다! 규칙적인 관리를 잊지 마세요." }), { headers: CORS });
  }
};
