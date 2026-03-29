import { callGemini, extractText } from "../lib/vertex-ai";
import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED_LANGS = ["ko", "en", "ja"] as const;

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const url = new URL(request.url);
    const temp = url.searchParams.get("temp");
    const humidity = url.searchParams.get("humidity");
    const aqi = url.searchParams.get("aqi");
    const pm25 = url.searchParams.get("pm25");
    const pm10 = url.searchParams.get("pm10");
    const uvIndex = url.searchParams.get("uv");
    const rawLang = url.searchParams.get("lang") || "ko";
    const lang = ALLOWED_LANGS.includes(rawLang as any) ? rawLang : "ko";

    if (!temp || !humidity) {
      return new Response(JSON.stringify({ error: "Weather data required" }), { status: 400, headers: CORS });
    }

    const user = await getUserFromCookie(request, env);
    let latest: any = null;
    let weakest: any = null;

    if (user) {
      const kvKey = `scans:${user.id}`;
      const rawScans = await env.SCANS_KV.get(kvKey);
      const scans = rawScans ? JSON.parse(rawScans) : [];
      if (scans.length > 0) {
        latest = scans[0];
        weakest = [...latest.scores].slice(1).sort((a: any, b: any) => (Number(a.score) || 0) - (Number(b.score) || 0))[0];
      }
    }

    // PM2.5 등급
    const pm25Val = pm25 ? Number(pm25) : null;
    const pm25Grade = pm25Val != null
      ? pm25Val <= 15 ? "좋음(Good)" : pm25Val <= 35 ? "보통(Fair)" : pm25Val <= 75 ? "나쁨(Poor)" : "매우나쁨(Very Poor)"
      : "정보 없음";

    // UV 등급
    const uvVal = uvIndex ? Number(uvIndex) : null;
    const uvGrade = uvVal != null
      ? uvVal <= 2 ? "낮음(Low)" : uvVal <= 5 ? "보통(Moderate)" : uvVal <= 7 ? "높음(High)" : uvVal <= 10 ? "매우높음(Very High)" : "위험(Extreme)"
      : "정보 없음";

    const langInstructions: Record<string, string> = {
      ko: "한국어로 답변하세요.",
      en: "Answer in English.",
      ja: "日本語で答えてください。",
    };

    let prompt = "";
    if (latest && weakest) {
      prompt = `
        당신은 개인 피부 케어 매니저입니다. 아래 정보를 바탕으로 유저에게 오늘 꼭 필요한 피부 케어 조언을 해주세요.

        [유저 피부 상태]
        - 바우만 타입: ${latest.baumannType}
        - 가장 취약한 지표: ${weakest.label} (점수: ${weakest.score}/100)
        - 종합 점수: ${latest.overallScore}/100

        [현재 날씨/환경]
        - 기온: ${temp}°C
        - 습도: ${humidity}%
        - 미세먼지(PM2.5): ${pm25Val != null ? `${pm25Val}µg/m³ (${pm25Grade})` : pm25Grade}
        - UV 지수: ${uvVal != null ? `${uvVal} (${uvGrade})` : uvGrade}
        - 공기질(AQI): ${aqi || "정보 없음"}

        지시사항:
        1. 날씨/환경 데이터와 유저의 피부 취약점을 직접 연결하세요.
        2. 미세먼지가 나쁘면 → 이중 세안, 장벽 강화 크림, 외출 시 마스크 등 구체적 행동 제안
        3. UV가 높으면 → 자외선 차단, 덧바르기 주기, 항산화 세럼 등 제안
        4. 습도가 낮으면 → 보습 강화, 수분 팩 등 제안
        5. 한 문장 briefing (25자 내외) + 한 문장 detail (구체적 행동)을 JSON으로 답변하세요.
        6. ${langInstructions[lang] || langInstructions.ko}

        답변 형식 (JSON만):
        {"briefing": "한 줄 요약", "detail": "구체적 행동 제안", "priority": "high 또는 normal"}
      `;
    } else {
      prompt = `
        당신은 피부 케어 매니저입니다. 현재 날씨/환경 정보를 바탕으로 일반적인 피부 케어 조언을 해주세요.

        [현재 날씨/환경]
        - 기온: ${temp}°C
        - 습도: ${humidity}%
        - 미세먼지(PM2.5): ${pm25Val != null ? `${pm25Val}µg/m³ (${pm25Grade})` : pm25Grade}
        - UV 지수: ${uvVal != null ? `${uvVal} (${uvGrade})` : uvGrade}
        - 공기질(AQI): ${aqi || "정보 없음"}

        지시사항:
        1. 날씨/환경에 맞는 구체적 피부 케어 행동을 제안하세요.
        2. 한 문장 briefing (25자 내외) + 한 문장 detail (구체적 행동)을 JSON으로 답변하세요.
        3. ${langInstructions[lang] || langInstructions.ko}

        답변 형식 (JSON만):
        {"briefing": "한 줄 요약", "detail": "구체적 행동 제안", "priority": "high 또는 normal"}
      `;
    }

    const response = await callGemini({
      gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const raw = extractText(response).trim();
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { briefing: raw, detail: "", priority: "normal" };
    }

    return new Response(JSON.stringify({
      briefing: parsed.briefing || raw,
      detail: parsed.detail || "",
      priority: parsed.priority || (
        (pm25Val != null && pm25Val > 35) || (uvVal != null && uvVal > 7) || Number(humidity) < 30 || Number(temp) > 33
          ? "high" : "normal"
      ),
      targetMetric: weakest?.label || null,
    }), { headers: CORS });

  } catch (err: any) {
    return new Response(JSON.stringify({ briefing: "오류 발생: " + err.message }), { headers: CORS });
  }
};
