import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API 요청 처리
    if (url.pathname === "/api/analyze-skin" && request.method === "POST") {
      try {
        const body = await request.json();
        const { image, surveyData } = body;

        if (!env.GOOGLE_API_KEY) {
          return new Response(JSON.stringify({ error: "API KEY MISSING" }), { 
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

        const prompt = `피부 전문가로서 사진과 정보(${JSON.stringify(surveyData)})를 분석하여 8가지 점수와 고민 부위 좌표(x,y)를 JSON으로만 답하세요. 
        구조: {"scores": [{"label": "종합 컨디션", "score": 80}, ...], "hotspots": [{"x": 50, "y": 50, "type": "점"}], "aiComment": "평가"}`;

        const base64Data = image.split(",")[1] || image;
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);

        const text = result.response.text();
        const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        
        return new Response(jsonStr, {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 그 외 모든 요청은 기존 정적 자산으로 전달 (Cloudflare가 알아서 처리)
    return env.ASSETS.fetch(request);
  }
};
