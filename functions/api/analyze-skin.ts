import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface Env {
  GOOGLE_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // 요청 바디 파싱
    const body: any = await request.json();
    const { image, surveyData } = body;

    if (!env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ 
        message: "서버 설정 오류", 
        detail: "GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
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

    const prompt = `당신은 피부과 전문의입니다. 사진과 정보(${JSON.stringify(surveyData)})를 분석하여 8가지 항목 점수와 고민 부위 좌표(x,y)를 JSON으로만 답하세요. 
    구조: {"scores": [{"label": "종합 컨디션", "score": 80}, ...], "hotspots": [{"x": 50, "y": 50, "type": "점"}], "aiComment": "평가"}`;

    const base64Data = image.split(",")[1] || image;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // JSON 추출 및 응답
    const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const analysisData = JSON.parse(jsonStr);

    return new Response(JSON.stringify(analysisData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Pages Function Error:", error.message);
    return new Response(JSON.stringify({
      message: "AI 분석 중 서버 오류가 발생했습니다.",
      detail: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
