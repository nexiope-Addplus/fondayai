import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // AI 분석 엔드포인트
  app.post("/api/analyze-skin", async (req, res) => {
    try {
      const { image, surveyData } = req.body;
      
      if (!image) {
        return res.status(400).send("이미지 데이터가 없습니다.");
      }

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY가 서버에 설정되지 않았습니다.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        당신은 전문 피부과 전문의이자 AI 피부 분석가입니다. 
        제공된 피부 사진과 설문 정보(${JSON.stringify(surveyData)})를 바탕으로 다음 8가지 항목을 0~100점 사이로 분석해 주세요.
        또한, 사진에서 트러블, 잡티, 주름 등 개선이 필요한 주요 지점의 좌표(x, y)를 최대 10개까지 찾아주세요.
        좌표는 이미지 왼쪽 상단을 (0,0), 오른쪽 하단을 (100,100)으로 하는 상대적 백분율 값이어야 합니다.
        결과는 반드시 순수한 JSON 형식으로만 응답해 주세요. 다른 설명은 생략하세요.
        
        항목:
        1. 종합 컨디션, 2. 수분 밸런스, 3. 붉은기 수준, 4. 모공 상태, 5. 주름 및 탄력, 6. 잡티/색소침착, 7. 트러블 위험, 8. 다크서클

        응답 JSON 구조 예시:
        {
          "scores": [{"label": "종합 컨디션", "score": 85}, ...],
          "hotspots": [{"x": 45.2, "y": 30.5, "type": "트러블"}],
          "aiComment": "분석 결과 요약"
        }
      `;

      const base64Data = image.split(",")[1] || image;
      
      console.log("AI 분석 시작...");
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
      console.log("AI 응답 수신 성공");
      
      // JSON 파싱 시도 (마크다운 코드 블록 제거 등)
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const analysisData = JSON.parse(cleanJson);

      if (!analysisData.scores) throw new Error("분석 데이터 형식이 잘못되었습니다.");
      
      res.json(analysisData);
    } catch (error: any) {
      console.error("AI 분석 상세 오류:", error.message);
      res.status(500).json({ 
        message: "피부 분석 중 오류가 발생했습니다.", 
        detail: error.message 
      });
    }
  });

  return httpServer;
}
