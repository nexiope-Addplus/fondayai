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
    const url = new URL(request.url);
    const temp = url.searchParams.get("temp");
    const humidity = url.searchParams.get("humidity");
    const aqi = url.searchParams.get("aqi");

    if (!temp || !humidity) {
      return new Response(JSON.stringify({ error: "Weather data required" }), { status: 400, headers: CORS });
    }

    const user = await getUserFromCookie(request, env);
    let latest = null;
    let weakest = null;

    if (user) {
      const kvKey = `scans:${user.id}`;
      const rawScans = await env.SCANS_KV.get(kvKey);
      const scans = rawScans ? JSON.parse(rawScans) : [];
      if (scans.length > 0) {
        latest = scans[0];
        weakest = [...latest.scores].slice(1).sort((a: any, b: any) => (Number(a.score) || 0) - (Number(b.score) || 0))[0];
      }
    }

    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let prompt = "";
    if (latest && weakest) {
      prompt = `
        당신은 개인 피부 케어 매니저입니다. 아래 정보를 바탕으로 유저에게 오늘 꼭 필요한 '한 문장' 조언을 한국어로 해주세요.
        - 유저의 가장 취약한 지표: ${weakest.label} (점수: ${weakest.score}/100)
        - 현재 날씨: 기온 ${temp}도, 습도 ${humidity}%, 공기질 지수(AQI) ${aqi || '보통'}
        - 유저의 바우만 타입: ${latest.baumannType}
        
        지시사항:
        1. 친절하면서도 전문적인 비서처럼 말하세요.
        2. 날씨 위협 요소와 피부 취약점을 직접 연결하세요.
        3. 아주 구체적인 행동 하나를 제안하세요.
        4. 딱 한 문장으로 답변하세요. (25자 내외 권장)
      `;
    } else {
      prompt = `
        당신은 개인 피부 케어 매니저입니다. 현재 날씨 정보를 바탕으로 일반적인 유저에게 오늘 꼭 필요한 피부 케어 '한 문장' 조언을 한국어로 해주세요.
        - 현재 날씨: 기온 ${temp}도, 습도 ${humidity}%, 공기질 지수(AQI) ${aqi || '보통'}
        
        지시사항:
        1. 모든 사람에게 도움될만한 기상 맞춤 조언을 하세요.
        2. 친절하고 구체적인 행동 하나를 제안하세요.
        3. 딱 한 문장으로 답변하세요. (25자 내외 권장)
      `;
    }

    const result = await model.generateContent(prompt);
    const briefing = result.response.text().trim();

    return new Response(JSON.stringify({ 
      briefing,
      priority: Number(humidity) < 30 || Number(temp) > 30 ? "high" : "normal",
      targetMetric: weakest?.label || "일반 케어"
    }), { headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ briefing: "오늘도 당신의 피부를 응원합니다! 규칙적인 관리를 잊지 마세요." }), { headers: CORS });
  }
};
