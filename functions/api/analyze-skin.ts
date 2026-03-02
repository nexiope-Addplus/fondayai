import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    const body: any = await request.json();
    const { image, surveyData } = body;

    if (!env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ 
        message: "API KEY MISSING", 
        detail: "Cloudflare 환경 변수에 GOOGLE_API_KEY를 추가해 주세요." 
      }), { 
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

    const prompt = `피부 분석 전문가로서 다음 사진과 정보(${JSON.stringify(surveyData)})를 분석하세요.
    반드시 다음 JSON 형식으로만 답하세요:
    {
      "scores": [{"label": "종합 컨디션", "score": 80}, ...],
      "hotspots": [{"x": 50, "y": 50, "type": "트러블"}],
      "aiComment": "피부 요약 평"
    }
    8가지 항목(종합 컨디션, 수분 밸런스, 붉은기 수준, 모공 상태, 주름 및 탄력, 잡티/색소침착, 트러블 위험, 다크서클)을 모두 포함하세요.`;

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

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    return new Response(jsonStr, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      message: "AI 분석 실패", 
      detail: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
