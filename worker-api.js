import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

function buildPrompt(surveyData, lang) {
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

Output format (follow this exact structure):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"Overall skin condition is good."},{"label":"수분 밸런스","score":60,"comment":"Skin is slightly dehydrated."},{"label":"붉은기 수준","score":45,"comment":"Mild redness is observed."},{"label":"모공 상태","score":70,"comment":"Pores are relatively clean."},{"label":"주름 및 탄력","score":80,"comment":"Skin elasticity is good."},{"label":"잡티/색소침착","score":55,"comment":"Some pigmentation is visible."},{"label":"트러블 위험","score":65,"comment":"Low breakout risk."},{"label":"다크서클","score":50,"comment":"Mild dark circles present."},{"label":"피부 광채","score":70,"comment":"Moderate radiance."},{"label":"피부결 균일도","score":75,"comment":"Skin texture is fairly even."}],"skinAge":29,"aiComment":"Overall skin assessment goes here.","hotspots":[{"x":45,"y":55,"type":"blemish"}],"skinReport":[{"area":"Forehead","finding":"Slight oiliness observed on the forehead."},{"area":"Cheeks","finding":"Cheeks appear slightly dry."},{"area":"Nose","finding":"Pores around the nose are slightly enlarged."},{"area":"Chin","finding":"Chin area is relatively stable."}],"improvements":[{"title":"Hydration","desc":"Use a hyaluronic acid serum morning and night. It strengthens the skin moisture barrier."},{"title":"Sun Protection","desc":"Apply SPF50+ sunscreen every day. Essential for preventing pigmentation."},{"title":"Calming Routine","desc":"Use a centella-based toner to soothe skin. Choose fragrance-free formulas."}],"cosmetics":[{"type":"Hydrating Serum","key":"Hyaluronic Acid","reason":"Replenishes skin moisture to combat dryness."},{"type":"Sunscreen","key":"Zinc Oxide","reason":"Shields skin from UV rays to prevent premature aging."}]}`;
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

出力形式（必ずこの構造で）：
{"scores":[{"label":"종합 컨디션","score":75,"comment":"全体的な肌コンディションは良好です。"},{"label":"수분 밸런스","score":60,"comment":"やや水分が不足しています。"},{"label":"붉은기 수준","score":45,"comment":"軽い赤みが観察されます。"},{"label":"모공 상태","score":70,"comment":"毛穴の状態は比較的きれいです。"},{"label":"주름 및 탄력","score":80,"comment":"弾力が良好です。"},{"label":"잡티/색소침착","score":55,"comment":"一部に色素沈着が見られます。"},{"label":"트러블 위험","score":65,"comment":"ニキビリスクは低いです。"},{"label":"다크서클","score":50,"comment":"クマがやや見られます。"},{"label":"피부 광채","score":70,"comment":"適度なツヤがあります。"},{"label":"피부결 균일도","score":75,"comment":"肌のキメは比較的均一です。"}],"skinAge":29,"aiComment":"ここに総評を記述してください。","hotspots":[{"x":45,"y":55,"type":"シミ"}],"skinReport":[{"area":"おでこ","finding":"おでこにやや皮脂が観察されます。"},{"area":"ほお","finding":"ほお部分はやや乾燥しています。"},{"area":"鼻","finding":"鼻周りの毛穴がやや広がっています。"},{"area":"あご","finding":"あごのラインは比較的安定しています。"}],"improvements":[{"title":"保湿補給","desc":"ヒアルロン酸セラムを朝晩使用してください。肌の水分バリアを強化します。"},{"title":"紫外線対策","desc":"毎日SPF50+の日焼け止めを塗ってください。色素沈着予防に必須です。"},{"title":"鎮静ケア","desc":"センテラトナーで肌を落ち着かせてください。刺激の少ない製品を選びましょう。"}],"cosmetics":[{"type":"美容液","key":"ヒアルロン酸","reason":"肌に水分を補給し、乾燥を改善します。"},{"type":"日焼け止め","key":"酸化亜鉛","reason":"紫外線から肌を守り、老化を予防します。"}]}`;
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

출력 형식 (반드시 이 구조 그대로):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"전반적인 피부 컨디션이 양호합니다."},{"label":"수분 밸런스","score":60,"comment":"수분이 다소 부족합니다."},{"label":"붉은기 수준","score":45,"comment":"붉은기가 약간 관찰됩니다."},{"label":"모공 상태","score":70,"comment":"모공 상태가 깨끗합니다."},{"label":"주름 및 탄력","score":80,"comment":"탄력이 좋은 편입니다."},{"label":"잡티/색소침착","score":55,"comment":"일부 색소침착이 있습니다."},{"label":"트러블 위험","score":65,"comment":"트러블 위험도가 낮습니다."},{"label":"다크서클","score":50,"comment":"다크서클이 다소 있습니다."},{"label":"피부 광채","score":70,"comment":"적당한 광채가 있습니다."},{"label":"피부결 균일도","score":75,"comment":"피부결이 고른 편입니다."}],"skinAge":29,"aiComment":"총평을 여기에 작성하세요.","hotspots":[{"x":45,"y":55,"type":"잡티"}],"skinReport":[{"area":"이마","finding":"이마에 약간의 유분이 관찰됩니다."},{"area":"볼","finding":"볼 부위는 건조한 편입니다."},{"area":"코","finding":"코 주변 모공이 다소 넓습니다."},{"area":"턱","finding":"턱 라인은 비교적 안정적입니다."}],"improvements":[{"title":"수분 보충","desc":"히알루론산 세럼을 아침저녁 사용하세요. 피부 수분 장벽을 강화합니다."},{"title":"자외선 차단","desc":"SPF50+ 선크림을 매일 사용하세요. 색소침착 예방에 필수입니다."},{"title":"진정 루틴","desc":"센텔라 토너로 피부를 진정시키세요. 자극 없는 제품을 선택하세요."}],"cosmetics":[{"type":"수분 세럼","key":"히알루론산","reason":"피부 수분을 채워 건조함을 개선합니다."},{"type":"선크림","key":"징크옥사이드","reason":"자외선 차단으로 피부 노화를 예방합니다."}]}`;
}

export default {
  async fetch(request, env) {
    // CORS 헤더 설정
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // OPTIONS 요청 처리 (CORS Preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { image, surveyData, lang = "ko" } = body;

        if (!env.GOOGLE_API_KEY) {
          return new Response(JSON.stringify({ error: "API KEY MISSING" }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }

        const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
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

        const text = result.response.text();
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("AI가 JSON을 반환하지 않았습니다.");
        }
        const analysisData = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

        // scores: 반드시 10개 항목 강제 보정
        const REQUIRED_LABELS = [
          "종합 컨디션","수분 밸런스","붉은기 수준","모공 상태","주름 및 탄력",
          "잡티/색소침착","트러블 위험","다크서클","피부 광채","피부결 균일도"
        ];
        const existingScores = Array.isArray(analysisData.scores) ? analysisData.scores : [];
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

        // skinAge 숫자 보장
        let skinAge = Math.round(Number(analysisData.skinAge));
        if (!skinAge || isNaN(skinAge) || skinAge <= 0) {
          const wrinkle = analysisData.scores[4]?.score ?? 70;
          const radiance = analysisData.scores[8]?.score ?? 70;
          const base = parseInt(String(surveyData?.age)) || 30;
          const delta = Math.round(((100 - wrinkle) + (100 - radiance)) / 20 - 5);
          skinAge = Math.max(15, Math.min(70, base + delta));
        }
        analysisData.skinAge = skinAge;
        
        return new Response(JSON.stringify(analysisData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Fonday AI API Worker is running.", { status: 200 });
  }
};
