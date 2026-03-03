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

      const prompt = `당신은 피부과 전문의입니다. 첨부된 사진과 설문 정보(${JSON.stringify(surveyData)})를 분석하여 아래 JSON 형식으로만 답하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.

scores 배열은 반드시 아래 10개 항목을 순서대로 모두 포함해야 합니다:
{"label":"종합 컨디션","score":?}
{"label":"수분 밸런스","score":?}
{"label":"붉은기 수준","score":?}
{"label":"모공 상태","score":?}
{"label":"주름 및 탄력","score":?}
{"label":"잡티/색소침착","score":?}
{"label":"트러블 위험","score":?}
{"label":"다크서클","score":?}
{"label":"피부 광채","score":?}
{"label":"피부결 균일도","score":?}

hotspots: 사진에서 실제로 보이는 기미·잡티·여드름·트러블 위치만 표시. 좌표는 사진 내 % 기준 (x: 왼쪽→오른쪽, y: 위→아래). 없으면 빈 배열.
improvements: 분석 결과 기반 핵심 개선 방안 정확히 3가지. title은 6자 이내 명사형, desc는 2문장 이내 실용적 조언.
cosmetics: 피부 상태에 맞는 추천 화장품 2가지. type은 제품 종류(5자 이내), key는 핵심 성분(8자 이내), reason은 추천 이유 1문장.

출력 형식 (반드시 이 구조 그대로):
{"scores":[{"label":"종합 컨디션","score":75},{"label":"수분 밸런스","score":60},{"label":"붉은기 수준","score":40},{"label":"모공 상태","score":70},{"label":"주름 및 탄력","score":80},{"label":"잡티/색소침착","score":35},{"label":"트러블 위험","score":30},{"label":"다크서클","score":45},{"label":"피부 광채","score":65},{"label":"피부결 균일도","score":72}],"hotspots":[{"x":45,"y":55,"type":"기미"}],"aiComment":"총평 2~3문장","improvements":[{"title":"수분 보충","desc":"히알루론산 세럼을 아침저녁 사용하세요. 피부 속 수분 장벽을 강화하는 데 도움이 됩니다."},{"title":"자외선 차단","desc":"SPF50+ 선크림을 매일 덧바르세요. 색소침착 예방에 필수입니다."},{"title":"진정 루틴","desc":"센텔라·알로에 성분 토너로 피부를 진정시키세요. 자극 없는 순한 제품을 선택하는 것이 중요합니다."}],"cosmetics":[{"type":"수분 세럼","key":"히알루론산","reason":"피부 속 수분을 채워 건조함과 당김을 빠르게 개선합니다."},{"type":"선크림","key":"징크옥사이드","reason":"자외선 차단으로 색소침착과 피부 노화를 예방합니다."}]}`;

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
