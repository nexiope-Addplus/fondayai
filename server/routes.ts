import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/analyze-skin", async (req, res) => {
    try {
      const { image, surveyData } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ message: "서버 설정 오류: API 키가 없습니다." });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = `당신은 피부과 전문의입니다. 사진과 설문 정보(${JSON.stringify(surveyData)})를 분석하여 아래 정확한 항목명으로 10가지 점수, 고민 부위 좌표, AI 코멘트를 JSON으로만 답하세요.
반드시 아래 label을 그대로 사용하세요:
1. "종합 컨디션" - 전체적인 피부 상태 (0~100)
2. "수분 밸런스" - 수분/유분 균형 (0~100, 높을수록 좋음)
3. "붉은기 수준" - 붉은기/홍조 정도 (0~100, 낮을수록 좋음)
4. "모공 상태" - 모공 청결도 (0~100, 높을수록 좋음)
5. "주름 및 탄력" - 피부 탄력과 주름 (0~100, 높을수록 좋음)
6. "잡티/색소침착" - 잡티·기미 정도 (0~100, 낮을수록 좋음)
7. "트러블 위험" - 트러블·여드름 위험 (0~100, 낮을수록 좋음)
8. "다크서클" - 눈 밑 다크서클 (0~100, 낮을수록 좋음)
9. "피부 광채" - 피부 윤기·투명도 (0~100, 높을수록 좋음)
10. "피부결 균일도" - 피부결 매끄러움 (0~100, 높을수록 좋음)
JSON 구조: {"scores": [{"label": "종합 컨디션", "score": 80}, ...10개...], "hotspots": [{"x": 50, "y": 50, "type": "점"}], "aiComment": "2~3문장 총평"}`;

      const base64Data = image.split(",")[1] || image;
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const analysisData = JSON.parse(jsonStr);
      
      res.json(analysisData);
    } catch (error: any) {
      console.error("AI Error:", error.message);
      res.status(500).json({ 
        message: "AI 분석 실패", 
        detail: error.message.includes("Safety") ? "이미지가 차단되었습니다. 다른 사진으로 시도해 주세요." : error.message 
      });
    }
  });

  app.post("/api/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("로그인이 필요합니다.");
    try {
      const { overallScore, scores, hotspots, aiComment, imageSrc } = req.body;
      const scan = await storage.createScan({
        userId: (req.user as any).id,
        overallScore: overallScore.toString(),
        scores: JSON.stringify(scores),
        hotspots: JSON.stringify(hotspots),
        aiComment,
        imageSrc
      });
      res.json(scan);
    } catch (error: any) {
      res.status(500).json({ message: "기록 저장 실패", error: error.message });
    }
  });

  app.get("/api/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("로그인이 필요합니다.");
    try {
      const scans = await storage.getScansByUserId((req.user as any).id);
      res.json(scans);
    } catch (error: any) {
      res.status(500).json({ message: "기록 조회 실패", error: error.message });
    }
  });

  return httpServer;
}
