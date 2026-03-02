import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const onRequest = async (context: any) => {
  const { request, env } = context;

  // Preflight(OPTIONS) 요청 대응
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // POST 요청 처리
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { image, surveyData } = body;

      if (!env.GOOGLE_API_KEY) {
        return new Response(JSON.stringify({ error: "GOOGLE_API_KEY is missing in environment variables." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = `당신은 피부 전문가입니다. 다음 사진과 정보(${JSON.stringify(surveyData)})를 정밀 분석하여 결과를 JSON으로만 답하세요. 
      형식: {"scores": [{"label": "종합 컨디션", "score": 85}, ...], "hotspots": [{"x": 45, "y": 30, "type": "트러블"}], "aiComment": "평가"}`;

      const base64Data = image.split(",")[1] || image;
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);

      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;

      return new Response(jsonStr, {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  // 허용되지 않는 메소드
  return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
