import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { isConfigured, d1Query } from "./d1";
import type { Scan } from "@shared/schema";

function parseGeminiJson(text: string) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("AI가 JSON을 반환하지 않았습니다.");
  }

  const candidate = text.slice(jsonStart, jsonEnd + 1);
  const attempts = [
    candidate,
    candidate
      .replace(/```json|```/gi, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":'),
  ];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      continue;
    }
  }

  throw new Error("AI 응답 JSON 파싱에 실패했습니다.");
}

/** D1 row → Scan 타입 변환 */
function mapD1Scan(row: any): Scan {
  return {
    id: row.id,
    userId: row.user_id || "",
    overallScore: String(row.overall_score ?? 0),
    scores: row.scores || "[]",
    hotspots: "[]",
    aiComment: row.ai_comment || null,
    imageSrc: null,
    baumannType: row.baumann_type || null,
    skinAge: row.skin_age != null ? String(row.skin_age) : null,
    shareToken: row.share_token || null,
    createdAt: row.created_at || null,
  };
}

function buildPrompt(surveyData: any, lang: string): string {
  const surveyJson = JSON.stringify(surveyData);

  if (lang === "en") {
    return `You are a dermatology specialist. Analyze the attached face photo and survey info (${surveyJson}) and respond ONLY in JSON format. Do not output any text other than JSON. All descriptive text fields (comment, aiComment, finding, desc, reason) must be written in English.

The scores array must contain all 10 items in this exact order (score: integer 0-100, comment: 1-sentence English interpretation):
{"label":"종합 컨디션","score":number,"comment":"interpretation"}
{"label":"수분 밸런스","score":number,"comment":"interpretation"}
{"label":"붉은기 수준","score":number,"comment":"interpretation"}
{"label":"모공 상태","score":number,"comment":"interpretation"}
{"label":"주름 및 탄력","score":number,"comment":"interpretation"}
{"label":"잡티/색소침착","score":number,"comment":"interpretation"}
{"label":"트러블 위험","score":number,"comment":"interpretation"}
{"label":"다크서클","score":number,"comment":"interpretation"}
{"label":"피부 광채","score":number,"comment":"interpretation"}
{"label":"피부결 균일도","score":number,"comment":"interpretation"}

skinAge: estimated skin age integer based on the photo
hotspots: visible blemish/acne/spot locations (% coordinates), empty array if none
aiComment: 2-3 sentence overall skin assessment in English
skinReport: 4 area findings (area: short English label max 10 chars, finding: 1-2 English sentences)
improvements: 3 improvement recommendations (title: max 15 chars English, desc: max 2 English sentences)
cosmetics: 2 recommended products (type: max 15 chars English, key: key ingredient name, reason: 1 English sentence)
prediction: 2 future skin score scenarios based on the analysis
- good: if recommended routine is followed (days: 14, score: predicted overall score integer, scenario: max 20 chars English scenario name, routine: array of 3 concrete daily routine steps in English max 20 chars each)
- bad: if bad habits continue (days: 7, score: predicted overall score integer, scenario: max 20 chars English scenario name, risks: array of 3 risk factors in English max 20 chars each)

Output format (follow this exact structure):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"Overall skin condition is good."},{"label":"수분 밸런스","score":60,"comment":"Skin is slightly dehydrated."},{"label":"붉은기 수준","score":45,"comment":"Mild redness is observed."},{"label":"모공 상태","score":70,"comment":"Pores are relatively clean."},{"label":"주름 및 탄력","score":80,"comment":"Skin elasticity is good."},{"label":"잡티/색소침착","score":55,"comment":"Some pigmentation is visible."},{"label":"트러블 위험","score":65,"comment":"Low breakout risk."},{"label":"다크서클","score":50,"comment":"Mild dark circles present."},{"label":"피부 광채","score":70,"comment":"Moderate radiance."},{"label":"피부결 균일도","score":75,"comment":"Skin texture is fairly even."}],"skinAge":29,"aiComment":"Overall skin assessment goes here.","hotspots":[{"x":45,"y":55,"type":"blemish"}],"skinReport":[{"area":"Forehead","finding":"Slight oiliness observed on the forehead."},{"area":"Cheeks","finding":"Cheeks appear slightly dry."},{"area":"Nose","finding":"Pores around the nose are slightly enlarged."},{"area":"Chin","finding":"Chin area is relatively stable."}],"improvements":[{"title":"Hydration","desc":"Use a hyaluronic acid serum morning and night. It strengthens the skin moisture barrier."},{"title":"Sun Protection","desc":"Apply SPF50+ sunscreen every day. Essential for preventing pigmentation."},{"title":"Calming Routine","desc":"Use a centella-based toner to soothe skin. Choose fragrance-free formulas."}],"cosmetics":[{"type":"Hydrating Serum","key":"Hyaluronic Acid","reason":"Replenishes skin moisture to combat dryness."},{"type":"Sunscreen","key":"Zinc Oxide","reason":"Shields skin from UV rays to prevent premature aging."}],"prediction":{"good":{"days":14,"score":79,"scenario":"Routine maintained","routine":["AM: HA serum + SPF50","PM: ceramide cream","2x/week: gentle exfoliant"]},"bad":{"days":7,"score":65,"scenario":"Sleep deprivation","risks":["Under 6h sleep","Skip sunscreen","High sugar diet"]}}}`;
  }

  if (lang === "ja") {
    return `あなたは皮膚科専門医です。添付の顔写真と調査情報(${surveyJson})を分析し、以下のJSON形式のみで回答してください。JSON以外のテキストは絶対に出力しないでください。すべての説明テキスト（comment、aiComment、finding、desc、reason）は日本語で記述してください。

scoresの配列は以下の10項目を順番通りにすべて含めてください（score: 0〜100の整数、comment: その項目の日本語1文解釈）：
{"label":"종합 컨디션","score":数値,"comment":"解釈"}
{"label":"수분 밸런스","score":数値,"comment":"解釈"}
{"label":"붉은기 수준","score":数値,"comment":"解釈"}
{"label":"모공 상태","score":数値,"comment":"解釈"}
{"label":"주름 및 탄력","score":数値,"comment":"解釈"}
{"label":"잡티/색소침착","score":数値,"comment":"解釈"}
{"label":"트러블 위험","score":数値,"comment":"解釈"}
{"label":"다크서클","score":数値,"comment":"解釈"}
{"label":"피부 광채","score":数値,"comment":"解釈"}
{"label":"피부결 균일도","score":数値,"comment":"解釈"}

skinAge: 写真から推定した肌年齢（整数）
hotspots: 実際に見えるシミ・吹き出物の位置（%座標）、なければ空配列
aiComment: 総評2〜3文（日本語）
skinReport: 部位別所見4つ（area: 5文字以内の日本語、finding: 1〜2文の日本語）
improvements: 改善方案3つ（title: 10文字以内の日本語、desc: 2文以内の日本語）
cosmetics: おすすめスキンケア2つ（type: 6文字以内の日本語、key: 主要成分名、reason: 1文の日本語）
prediction: 分析結果に基づく肌スコア予測シナリオ2つ
- good: 推奨ルーティンを継続した場合 (days: 14, score: 予測総合スコア整数, scenario: 15文字以内の日本語, routine: 具体的な日課3つ各15文字以内の日本語配列)
- bad: 悪い生活習慣が続いた場合 (days: 7, score: 予測総合スコア整数, scenario: 15文字以内の日本語, risks: リスク要因3つ各15文字以内の日本語配列)

出力形式（必ずこの構造で）：
{"scores":[{"label":"종합 컨디션","score":75,"comment":"全体的な肌コンディションは良好です。"},{"label":"수분 밸런스","score":60,"comment":"やや水分が不足しています。"},{"label":"붉은기 수준","score":45,"comment":"軽い赤みが観察されます。"},{"label":"모공 상태","score":70,"comment":"毛穴の状態は比較的きれいです。"},{"label":"주름 및 탄력","score":80,"comment":"弾力が良好です。"},{"label":"잡티/색소침착","score":55,"comment":"一部に色素沈着が見られます。"},{"label":"트러블 위험","score":65,"comment":"ニキビリスクは低いです。"},{"label":"다크서클","score":50,"comment":"クマがやや見られます。"},{"label":"피부 광채","score":70,"comment":"適度なツヤがあります。"},{"label":"피부결 균일도","score":75,"comment":"肌のキメは比較的均一です。"}],"skinAge":29,"aiComment":"ここに総評を記述してください。","hotspots":[{"x":45,"y":55,"type":"シミ"}],"skinReport":[{"area":"おでこ","finding":"おでこにやや皮脂が観察されます。"},{"area":"ほお","finding":"ほお部分はやや乾燥しています。"},{"area":"鼻","finding":"鼻周りの毛穴がやや広がっています。"},{"area":"あご","finding":"あごのラインは比較的安定しています。"}],"improvements":[{"title":"保湿補給","desc":"ヒアルロン酸セラムを朝晩使用してください。肌の水分バリアを強化します。"},{"title":"紫外線対策","desc":"毎日SPF50+の日焼け止めを塗ってください。色素沈着予防に必須です。"},{"title":"鎮静ケア","desc":"センテラトナーで肌を落ち着かせてください。刺激の少ない製品を選びましょう。"}],"cosmetics":[{"type":"美容液","key":"ヒアルロン酸","reason":"肌に水分を補給し、乾燥を改善します。"},{"type":"日焼け止め","key":"酸化亜鉛","reason":"紫外線から肌を守り、老化を予防します。"}],"prediction":{"good":{"days":14,"score":79,"scenario":"ルーティン維持時","routine":["朝: HAセラム+日焼け止め","夜: セラミドクリーム","週2: 低刺激ピーリング"]},"bad":{"days":7,"score":65,"scenario":"睡眠不足が続く場合","risks":["睡眠6時間未満","日焼け止めをサボる","刺激の強い食事"]}}}`;
  }

  // Korean (default)
  return `당신은 피부과 전문의입니다. 첨부된 얼굴 사진과 설문 정보(${surveyJson})를 분석하여 아래 JSON 형식으로만 답하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.

scores 배열은 반드시 아래 10개 항목을 순서대로 모두 포함해야 합니다 (score: 0~100 정수, comment: 해당 항목에 대한 한국어 해석 1문장):
{"label":"종합 컨디션","score":숫자,"comment":"해석"}
{"label":"수분 밸런스","score":숫자,"comment":"해석"}
{"label":"붉은기 수준","score":숫자,"comment":"해석"}
{"label":"모공 상태","score":숫자,"comment":"해석"}
{"label":"주름 및 탄력","score":숫자,"comment":"해석"}
{"label":"잡티/색소침착","score":숫자,"comment":"해석"}
{"label":"트러블 위험","score":숫자,"comment":"해석"}
{"label":"다크서클","score":숫자,"comment":"해석"}
{"label":"피부 광채","score":숫자,"comment":"해석"}
{"label":"피부결 균일도","score":숫자,"comment":"해석"}

skinAge: 사진 기반 추정 피부나이 정수
hotspots: 실제로 보이는 기미·잡티·여드름 위치(% 좌표), 없으면 빈 배열
aiComment: 총평 2~3문장
skinReport: 피부 영역별 소견 4가지 (area: 5자이내, finding: 1~2문장)
improvements: 분석 결과 기반 개선방안 3가지 (title: 6자이내, desc: 2문장이내)
cosmetics: 피부 맞춤 추천 화장품 2가지 (type: 6자이내, key: 핵심성분, reason: 1문장)
prediction: 분석 결과 기반 피부 점수 예측 시나리오 2가지
- good: 권장 루틴 유지 시 (days: 14, score: 예측 종합점수 정수, scenario: 10자이내 시나리오명, routine: 구체적인 일과 3가지 각 15자이내 배열)
- bad: 나쁜 생활습관 지속 시 (days: 7, score: 예측 종합점수 정수, scenario: 10자이내 시나리오명, risks: 위험요인 3가지 각 15자이내 배열)

출력 형식 (반드시 이 구조 그대로):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"전반적인 피부 컨디션이 양호합니다."},{"label":"수분 밸런스","score":60,"comment":"수분이 다소 부족합니다."},{"label":"붉은기 수준","score":45,"comment":"붉은기가 약간 관찰됩니다."},{"label":"모공 상태","score":70,"comment":"모공 상태가 깨끗합니다."},{"label":"주름 및 탄력","score":80,"comment":"탄력이 좋은 편입니다."},{"label":"잡티/색소침착","score":55,"comment":"일부 색소침착이 있습니다."},{"label":"트러블 위험","score":65,"comment":"트러블 위험도가 낮습니다."},{"label":"다크서클","score":50,"comment":"다크서클이 다소 있습니다."},{"label":"피부 광채","score":70,"comment":"적당한 광채가 있습니다."},{"label":"피부결 균일도","score":75,"comment":"피부결이 고른 편입니다."}],"skinAge":29,"aiComment":"총평을 여기에 작성하세요.","hotspots":[{"x":45,"y":55,"type":"잡티"}],"skinReport":[{"area":"이마","finding":"이마에 약간의 유분이 관찰됩니다."},{"area":"볼","finding":"볼 부위는 건조한 편입니다."},{"area":"코","finding":"코 주변 모공이 다소 넓습니다."},{"area":"턱","finding":"턱 라인은 비교적 안정적입니다."}],"improvements":[{"title":"수분 보충","desc":"히알루론산 세럼을 아침저녁 사용하세요. 피부 수분 장벽을 강화합니다."},{"title":"자외선 차단","desc":"SPF50+ 선크림을 매일 사용하세요. 색소침착 예방에 필수입니다."},{"title":"진정 루틴","desc":"센텔라 토너로 피부를 진정시키세요. 자극 없는 제품을 선택하세요."}],"cosmetics":[{"type":"수분 세럼","key":"히알루론산","reason":"피부 수분을 채워 건조함을 개선합니다."},{"type":"선크림","key":"징크옥사이드","reason":"자외선 차단으로 피부 노화를 예방합니다."}],"prediction":{"good":{"days":14,"score":79,"scenario":"루틴 유지 시","routine":["아침: 히알루론산 세럼+선크림","저녁: 세라마이드 크림","주 2회: 저자극 각질 케어"]},"bad":{"days":7,"score":65,"scenario":"수면 부족 지속 시","risks":["수면 6시간 이하","자외선 차단 생략","자극적 식단·음주"]}}}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // cosmetics 테이블 초기화 (멱등)
  if (isConfigured()) {
    d1Query(
      `CREATE TABLE IF NOT EXISTS cosmetics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT DEFAULT '',
        category TEXT NOT NULL,
        time_of_day TEXT DEFAULT 'both',
        opened_at TEXT,
        ingredients TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        is_skincare_relevant INTEGER DEFAULT 1,
        image_thumbnail TEXT DEFAULT '',
        created_at TEXT NOT NULL
      )`,
      []
    ).catch(() => {});
    // 기존 테이블에 컬럼 추가 (없으면 추가, 있으면 무시)
    d1Query("ALTER TABLE cosmetics ADD COLUMN image_thumbnail TEXT DEFAULT ''", []).catch(() => {});
    d1Query("ALTER TABLE cosmetics ADD COLUMN ingredients TEXT DEFAULT ''", []).catch(() => {});
  }

  // diary_entries 테이블 초기화 (멱등)
  if (isConfigured()) {
    d1Query(
      `CREATE TABLE IF NOT EXISTS diary_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date_str TEXT NOT NULL,
        memo TEXT DEFAULT '',
        todos TEXT DEFAULT '[]',
        cause_tags TEXT DEFAULT '[]',
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, date_str)
      )`,
      []
    ).catch(() => {});
  }

  app.post("/api/analyze-skin", async (req, res) => {
    try {
      const { image, surveyData, lang = "ko" } = req.body;
      const apiKey = process.env.GOOGLE_API_KEY;
      
      if (!apiKey) {
        console.error("[Server] GOOGLE_API_KEY is missing in process.env");
        return res.status(500).json({ 
          message: "서버 설정 오류: API 키가 없습니다.",
          detail: "환경 변수 GOOGLE_API_KEY가 설정되지 않았습니다."
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          // @ts-ignore — thinkingConfig is supported by gemini-2.5-flash
          thinkingConfig: { thinkingBudget: 1024 },
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = buildPrompt(surveyData, lang);

      const base64Data = image.split(",")[1] || image;
      const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType } }
      ]);

      const response = await result.response;
      const text = response.text();

      console.log("[Gemini] 응답 길이:", text.length, "/ 앞100자:", text.slice(0, 100));

      // 마크다운 코드블록 + thinking 텍스트 방어
      const analysisData = parseGeminiJson(text);

      // scores: 반드시 10개 항목 강제 보정 (comment 포함)
      const REQUIRED_LABELS = [
        "종합 컨디션","수분 밸런스","붉은기 수준","모공 상태","주름 및 탄력",
        "잡티/색소침착","트러블 위험","다크서클","피부 광채","피부결 균일도"
      ];
      const existingScores: {label: string; score: number; comment?: string}[] = Array.isArray(analysisData.scores) ? analysisData.scores : [];
      analysisData.scores = REQUIRED_LABELS.map((label, i) => {
        const found = existingScores.find((s) => s.label === label) || existingScores[i];
        const score = found ? Math.max(0, Math.min(100, Math.round(Number(found.score) || 50))) : 50;
        const comment = (found?.comment && typeof found.comment === "string") ? found.comment.trim() : "";
        return { label, score, comment };
      });

      // 배열 필드 기본값 보장
      if (!Array.isArray(analysisData.improvements)) analysisData.improvements = [];
      if (!Array.isArray(analysisData.cosmetics)) analysisData.cosmetics = [];
      if (!Array.isArray(analysisData.skinReport)) analysisData.skinReport = [];
      if (!Array.isArray(analysisData.hotspots)) analysisData.hotspots = [];

      // skinAge 숫자 보장 (없으면 점수 기반 추정)
      let skinAge = Math.round(Number(analysisData.skinAge));
      if (!skinAge || isNaN(skinAge) || skinAge <= 0) {
        const wrinkle = analysisData.scores[4]?.score ?? 70;
        const radiance = analysisData.scores[8]?.score ?? 70;
        const base = parseInt(String(surveyData?.age)) || 30;
        const delta = Math.round(((100 - wrinkle) + (100 - radiance)) / 20 - 5);
        skinAge = Math.max(15, Math.min(70, base + delta));
      }
      analysisData.skinAge = skinAge;

      res.json(analysisData);
    } catch (error: any) {
      console.error("[AI Error]", error.message, error.stack?.slice(0, 300));
      res.status(500).json({ 
        message: "AI 분석 실패", 
        detail: error.message.includes("Safety") ? "이미지가 차단되었습니다. 다른 사진으로 시도해 주세요." : error.message 
      });
    }
  });

  app.post("/api/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("로그인이 필요합니다.");
    try {
      const { overallScore, scores, hotspots, aiComment, imageSrc, baumannType, skinAge, lang } = req.body;
      const shareToken = randomUUID();
      const userId = (req.user as any).id;
      const scan = await storage.createScan({
        userId,
        overallScore: overallScore.toString(),
        scores: JSON.stringify(scores),
        hotspots: JSON.stringify(hotspots),
        aiComment,
        imageSrc,
        baumannType: baumannType || null,
        skinAge: skinAge != null ? skinAge.toString() : null,
        shareToken,
      });
      // D1에도 저장 (영구 보존, user_id 포함)
      if (isConfigured()) {
        await d1Query(
          `INSERT OR IGNORE INTO scans (id, overall_score, baumann_type, skin_age, ai_comment, scores, share_token, lang, is_guest, user_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [scan.id, parseInt(overallScore) || 0, baumannType || "", skinAge ?? null, aiComment || "", JSON.stringify(scores || []), shareToken, lang || "ko", 0, userId, scan.createdAt || new Date().toISOString()]
        );
      }
      res.json(scan);
    } catch (error: any) {
      res.status(500).json({ message: "기록 저장 실패", error: error.message });
    }
  });

  app.get("/api/scans/shared/:token", async (req, res) => {
    try {
      const token = req.params.token;
      if (!token) return res.status(400).json({ message: "토큰이 필요합니다." });

      const scan = await storage.getScanByShareToken(token);
      if (!scan) return res.status(404).json({ message: "공유된 스캔 결과를 찾을 수 없습니다." });

      // Only return non-sensitive fields to the public
      const publicScanData = {
        overallScore: scan.overallScore,
        scores: typeof scan.scores === 'string' ? JSON.parse(scan.scores) : scan.scores,
        baumannType: scan.baumannType,
        skinAge: scan.skinAge,
        aiComment: scan.aiComment,
        shareToken: scan.shareToken,
        createdAt: scan.createdAt
      };

      res.json(publicScanData);
    } catch (error: any) {
      res.status(500).json({ message: "공유 데이터 조회 실패", error: error.message });
    }
  });

  app.get("/api/ranking", async (req, res) => {
    try {
      const myScore = req.query.myScore ? parseInt(req.query.myScore as string) : null;

      // D1 우선 (더 많은 데이터), 실패 시 MemStorage 폴백
      let rawScans: { overallScore: string; baumannType: string | null }[] = [];
      if (isConfigured()) {
        const result = await d1Query(
          "SELECT overall_score, baumann_type FROM scans ORDER BY created_at DESC LIMIT 10000",
          []
        );
        if (result?.results?.length) {
          rawScans = result.results.map((r: any) => ({
            overallScore: String(r.overall_score ?? 0),
            baumannType: r.baumann_type || null,
          }));
        }
      }
      if (rawScans.length === 0) {
        rawScans = await storage.getAllScans();
      }

      const allScans = rawScans;
      const dbScores = allScans.map(s => parseInt(s.overallScore) || 0).filter(s => s > 0);

      // Include the current user's score in the pool (handles fresh scans not yet saved)
      const scorePool = (myScore && myScore > 0) ? [...dbScores, myScore] : dbScores;

      const totalScans = scorePool.length;
      const avgScore = scorePool.length ? Math.round(scorePool.reduce((a, b) => a + b, 0) / scorePool.length) : 0;
      const topScore = scorePool.length ? Math.max(...scorePool) : 0;

      const scoreDistribution = [
        { label: "0-20", count: 0 },
        { label: "21-40", count: 0 },
        { label: "41-60", count: 0 },
        { label: "61-80", count: 0 },
        { label: "81-100", count: 0 },
      ];
      scorePool.forEach(s => {
        if (s <= 20) scoreDistribution[0].count++;
        else if (s <= 40) scoreDistribution[1].count++;
        else if (s <= 60) scoreDistribution[2].count++;
        else if (s <= 80) scoreDistribution[3].count++;
        else scoreDistribution[4].count++;
      });

      const baumannDistribution: Record<string, number> = {};
      allScans.forEach(s => {
        if (s.baumannType) {
          baumannDistribution[s.baumannType] = (baumannDistribution[s.baumannType] || 0) + 1;
        }
      });

      const result: any = { totalScans, avgScore, topScore, scoreDistribution, baumannDistribution };

      if (myScore && myScore > 0 && scorePool.length > 0) {
        const scoresBelow = scorePool.filter(s => s < myScore).length;
        result.myPercentile = Math.max(1, Math.round((1 - scoresBelow / scorePool.length) * 100));
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "랭킹 조회 실패", error: error.message });
    }
  });

  app.get("/api/scans", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("로그인이 필요합니다.");
    try {
      const userId = (req.user as any).id;
      // D1 우선 (영구 저장 데이터), 실패 시 MemStorage 폴백
      if (isConfigured()) {
        const result = await d1Query(
          "SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
          [userId]
        );
        if (result?.results?.length) {
          return res.json(result.results.map(mapD1Scan));
        }
      }
      const scans = await storage.getScansByUserId(userId);
      res.json(scans);
    } catch (error: any) {
      res.status(500).json({ message: "기록 조회 실패", error: error.message });
    }
  });

  // ── 화장품 API ──────────────────────────────────────────────────

  // 화장품 사진 → Gemini Vision으로 제품 자동 분류 (인증 불필요)
  app.post("/api/cosmetics/classify", async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 필요" });
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key 없음" });
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const prompt = `이 화장품 제품 사진을 분석하세요.
JSON으로만 응답하세요 (다른 텍스트 절대 금지):
{"name":"제품명","brand":"브랜드명","category":"카테고리","isSkincareRelevant":true,"productType":"","ingredients":"전성분"}
카테고리는 반드시 다음 중 하나: 클렌저|토너|세럼|크림|선크림|각질케어|진정케어|장벽케어|아이크림|기타스킨케어|스킨케어아님
스킨케어아님이면 isSkincareRelevant=false, productType에 제품 종류 기입 (예: 파운데이션)
ingredients: 사진에 전성분 텍스트가 보이면 그대로 추출. 안 보이면 제품명+브랜드 기반으로 알려진 주요 성분을 쉼표로 나열. 알 수 없으면 빈 문자열.`;
      const result = await model.generateContent([
        { inlineData: { mimeType, data: imageData } },
        prompt
      ]);
      const text = result.response.text();
      const parsed = parseGeminiJson(text);
      res.json(parsed);
    } catch {
      res.json({ name: "", brand: "", category: "기타스킨케어", isSkincareRelevant: true, productType: "" });
    }
  });

  // 화장품 등록 (로그인 필수)
  app.post("/api/cosmetics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인 필요" });
    const userId = (req.user as any).id;
    const { name, brand, category, timeOfDay, openedAt, ingredients, isSkincareRelevant, imageThumbnail } = req.body;
    if (!name || !category) return res.status(400).json({ error: "name, category 필요" });
    if (!isConfigured()) return res.json({ success: true, offline: true });
    try {
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      await d1Query(
        `INSERT INTO cosmetics (id, user_id, name, brand, category, time_of_day, opened_at, ingredients, status, is_skincare_relevant, image_thumbnail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        [id, userId, name, brand || "", category, timeOfDay || "both", openedAt || null, ingredients || "", isSkincareRelevant !== false ? 1 : 0, imageThumbnail || "", createdAt]
      );
      res.json({ id, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 화장품 목록 조회 (로그인 필수)
  app.get("/api/cosmetics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json([]);
    const userId = (req.user as any).id;
    if (!isConfigured()) return res.json([]);
    try {
      const result = await d1Query(
        "SELECT * FROM cosmetics WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC",
        [userId]
      );
      res.json(result?.results || []);
    } catch {
      res.json([]);
    }
  });

  // 화장품 삭제 (로그인 필수)
  app.delete("/api/cosmetics/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인 필요" });
    const userId = (req.user as any).id;
    const { id } = req.params;
    if (!isConfigured()) return res.json({ success: true });
    try {
      await d1Query(
        "UPDATE cosmetics SET status = 'deleted' WHERE id = ? AND user_id = ?",
        [id, userId]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 피부 일기 — 전체 항목 조회 (로그인 필수)
  app.get("/api/diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json([]);
    const userId = (req.user as any).id;
    if (!isConfigured()) return res.json([]);
    try {
      const result = await d1Query(
        "SELECT date_str, memo, todos, cause_tags, updated_at FROM diary_entries WHERE user_id = ? ORDER BY date_str DESC",
        [userId]
      );
      res.json(result?.results || []);
    } catch {
      res.json([]);
    }
  });

  // 피부 일기 — 날짜별 upsert (로그인 필수)
  app.post("/api/diary", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "로그인 필요" });
    const userId = (req.user as any).id;
    const { dateStr, memo, todos, causeTags } = req.body;
    if (!dateStr) return res.status(400).json({ error: "dateStr 필요" });
    if (!isConfigured()) return res.json({ success: true, offline: true });
    try {
      const id = `${userId}_${dateStr}`;
      const updatedAt = new Date().toISOString();
      await d1Query(
        `INSERT INTO diary_entries (id, user_id, date_str, memo, todos, cause_tags, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, date_str) DO UPDATE SET
           memo = excluded.memo,
           todos = excluded.todos,
           cause_tags = excluded.cause_tags,
           updated_at = excluded.updated_at`,
        [id, userId, dateStr, memo || "", JSON.stringify(todos || []), JSON.stringify(causeTags || []), updatedAt]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
