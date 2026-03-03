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
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = `당신은 피부과 전문의입니다. 첨부된 얼굴 사진과 설문 정보를 분석하여 JSON으로 응답하세요.

설문 정보: ${JSON.stringify(surveyData)}

반환할 JSON 구조:
{
  "scores": [
    {"label":"종합 컨디션","score": 0~100 사이 정수},
    {"label":"수분 밸런스","score": 0~100},
    {"label":"붉은기 수준","score": 0~100},
    {"label":"모공 상태","score": 0~100},
    {"label":"주름 및 탄력","score": 0~100},
    {"label":"잡티/색소침착","score": 0~100},
    {"label":"트러블 위험","score": 0~100},
    {"label":"다크서클","score": 0~100},
    {"label":"피부 광채","score": 0~100},
    {"label":"피부결 균일도","score": 0~100}
  ],
  "hotspots": [{"x": 0~100, "y": 0~100, "type": "기미|잡티|여드름|트러블"}],
  "aiComment": "피부 전반 전문가 총평 2~3문장",
  "skinAge": 추정 피부나이 정수,
  "skinReport": [
    {"area": "영역명(5자이내)", "finding": "해당 영역 소견 1~2문장"},
    {"area": "영역명", "finding": "소견"},
    {"area": "영역명", "finding": "소견"},
    {"area": "영역명", "finding": "소견"}
  ],
  "improvements": [
    {"title": "방안명(6자이내)", "desc": "구체적 실천 조언 2문장이내"},
    {"title": "방안명", "desc": "조언"},
    {"title": "방안명", "desc": "조언"}
  ],
  "cosmetics": [
    {"type": "제품종류(6자이내)", "key": "핵심성분(8자이내)", "reason": "추천이유 1문장"},
    {"type": "제품종류", "key": "성분", "reason": "이유"}
  ]
}

규칙:
- scores는 반드시 위 10개 항목 모두 포함
- hotspots는 실제 보이는 트러블만, 없으면 빈 배열
- skinReport는 정확히 4개
- improvements는 정확히 3개
- cosmetics는 정확히 2개
- skinAge는 숫자`;

      const base64Data = image.split(",")[1] || image;
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const analysisData = JSON.parse(text);

      // scores: 반드시 10개 항목 강제 보정
      const REQUIRED_LABELS = [
        "종합 컨디션","수분 밸런스","붉은기 수준","모공 상태","주름 및 탄력",
        "잡티/색소침착","트러블 위험","다크서클","피부 광채","피부결 균일도"
      ];
      const existingScores: {label: string; score: number}[] = Array.isArray(analysisData.scores) ? analysisData.scores : [];
      analysisData.scores = REQUIRED_LABELS.map(label => {
        const found = existingScores.find((s) => s.label === label);
        return { label, score: found ? Math.max(0, Math.min(100, Number(found.score) || 50)) : 50 };
      });

      // 배열 필드 기본값 보장
      if (!Array.isArray(analysisData.improvements)) analysisData.improvements = [];
      if (!Array.isArray(analysisData.cosmetics)) analysisData.cosmetics = [];
      if (!Array.isArray(analysisData.skinReport)) analysisData.skinReport = [];
      if (!Array.isArray(analysisData.hotspots)) analysisData.hotspots = [];

      // skinAge 숫자 보장
      analysisData.skinAge = parseInt(String(analysisData.skinAge)) || null;

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
