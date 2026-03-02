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

      const prompt = `당신은 피부과 전문의입니다. 사진과 정보(${JSON.stringify(surveyData)})를 분석하여 8가지 항목 점수와 고민 부위 좌표(x,y)를 JSON으로만 답하세요. 
      구조: {"scores": [{"label": "종합 컨디션", "score": 80}, ...], "hotspots": [{"x": 50, "y": 50, "type": "점"}], "aiComment": "평가"}`;

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
