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
      const { image, surveyData } = req.body; // Base64 이미지와 설문 데이터
      
      if (!image) {
        return res.status(400).send("이미지 데이터가 없습니다.");
      }

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        // API 키가 없을 경우 시뮬레이션 데이터 반환 (테스트용)
        console.warn("GOOGLE_API_KEY가 설정되지 않았습니다. 시뮬레이션 모드로 작동합니다.");
        return res.json({
          scores: [
            { label: "종합 컨디션", score: 72 },
            { label: "수분 밸런스", score: 45 },
            { label: "붉은기 수준", score: 68 },
            { label: "모공 상태", score: 52 },
            { label: "주름 및 탄력", score: 75 },
            { label: "잡티/색소침착", score: 42 },
            { label: "트러블 위험", score: 35 },
            { label: "다크서클", score: 60 },
          ],
          aiComment: "전반적으로 양호하나 붉은기가 관찰됩니다. 진정 케어에 집중해 보세요."
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // AI에게 보낼 정밀 프롬프트
      const prompt = `
        당신은 전문 피부과 전문의이자 AI 피부 분석가입니다. 
        제공된 피부 사진과 설문 정보(${JSON.stringify(surveyData)})를 바탕으로 다음 8가지 항목을 0~100점 사이로 분석해 주세요.
        또한, 사진에서 트러블, 잡티, 주름 등 개선이 필요한 주요 지점의 좌표(x, y)를 최대 10개까지 찾아주세요.
        좌표는 이미지 왼쪽 상단을 (0,0), 오른쪽 하단을 (100,100)으로 하는 상대적 백분율 값이어야 합니다.
        결과는 반드시 JSON 형식으로만 응답해 주세요.
        
        항목:
        1. 종합 컨디션, 2. 수분 밸런스, 3. 붉은기 수준, 4. 모공 상태, 5. 주름 및 탄력, 6. 잡티/색소침착, 7. 트러블 위험, 8. 다크서클

        응답 형식:
        {
          "scores": [
            {"label": "종합 컨디션", "score": 85},
            ...
          ],
          "hotspots": [
            {"x": 45.2, "y": 30.5, "type": "트러블"},
            {"x": 60.1, "y": 55.0, "type": "잡티"}
          ],
          "aiComment": "피부 상태에 대한 짧은 요약 평 (한글)"
        }
      `;

      // Base64 데이터에서 헤더 제거
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
      
      // JSON 추출 및 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!analysisData) throw new Error("AI 응답 형식이 올바르지 않습니다.");
      
      res.json(analysisData);
    } catch (error) {
      console.error("AI 분석 오류:", error);
      res.status(500).json({ message: "피부 분석 중 오류가 발생했습니다." });
    }
  });

  return httpServer;
}
