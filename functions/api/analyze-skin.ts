import { callGemini, extractText, SAFETY_SETTINGS_NONE } from "../lib/vertex-ai";

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
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
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

function buildPrompt(surveyData: any, lang: string): string {
  const surveyJson = JSON.stringify(surveyData);

  if (lang === "en") {
    return `You are a dermatology specialist. Analyze the attached face photo and survey info (${surveyJson}) and respond ONLY in JSON format. Do not output any text other than JSON. All descriptive text fields (comment, aiComment, finding, desc, reason) must be written in English.
IMPORTANT: Base your analysis primarily on what you observe in the photo. Use survey info (especially age) only as supplementary reference — if the photo shows different skin condition than the survey suggests, trust the photo.

CRITICAL SCORING RULE: All scores are 0-100 where 100 = best condition. Specifically:
- 붉은기 수준: 100 = no redness at all (clear skin), 0 = severe redness/rosacea
- 트러블 위험: 100 = no trouble/acne risk at all, 0 = severe acne/breakouts
- 다크서클: 100 = no dark circles at all, 0 = severe dark circles
- 잡티/색소침착: 100 = no blemishes/pigmentation, 0 = severe blemishes
- All other items follow the same pattern: 100 = best, 0 = worst

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
nutritionTips: personalized advice based on the LOWEST scoring items in the scan
- supplements: 2-3 supplements for this skin type (emoji: single emoji, name: supplement name max 20 chars, dose: dosage e.g. "500mg once daily", reason: 1 English sentence explaining benefit, targetScore: the score label name this supplement helps most)
- avoidFoods: 3 common everyday foods to avoid today — fast food, snacks, coffee, alcohol, bread, etc. (practical items people regularly encounter, no overlap with supplements, no duplicates between items) (emoji: single emoji, food: name max 15 chars, reason: 1 English sentence on skin impact)
- hydrationGoal: 1 English sentence daily water intake recommendation tailored to the skin condition

Output format (follow this exact structure):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"Overall skin condition is good."},{"label":"수분 밸런스","score":60,"comment":"Skin is slightly dehydrated."},{"label":"붉은기 수준","score":45,"comment":"Mild redness is observed."},{"label":"모공 상태","score":70,"comment":"Pores are relatively clean."},{"label":"주름 및 탄력","score":80,"comment":"Skin elasticity is good."},{"label":"잡티/색소침착","score":55,"comment":"Some pigmentation is visible."},{"label":"트러블 위험","score":65,"comment":"Low breakout risk."},{"label":"다크서클","score":50,"comment":"Mild dark circles present."},{"label":"피부 광채","score":70,"comment":"Moderate radiance."},{"label":"피부결 균일도","score":75,"comment":"Skin texture is fairly even."}],"skinAge":29,"aiComment":"Overall skin assessment goes here.","hotspots":[{"x":45,"y":55,"type":"blemish"}],"skinReport":[{"area":"Forehead","finding":"Slight oiliness observed on the forehead."},{"area":"Cheeks","finding":"Cheeks appear slightly dry."},{"area":"Nose","finding":"Pores around the nose are slightly enlarged."},{"area":"Chin","finding":"Chin area is relatively stable."}],"improvements":[{"title":"Hydration","desc":"Use a hyaluronic acid serum morning and night. It strengthens the skin moisture barrier."},{"title":"Sun Protection","desc":"Apply SPF50+ sunscreen every day. Essential for preventing pigmentation."},{"title":"Calming Routine","desc":"Use a centella-based toner to soothe skin. Choose fragrance-free formulas."}],"cosmetics":[{"type":"Hydrating Serum","key":"Hyaluronic Acid","reason":"Replenishes skin moisture to combat dryness."},{"type":"Sunscreen","key":"Zinc Oxide","reason":"Shields skin from UV rays to prevent premature aging."}],"prediction":{"good":{"days":14,"score":79,"scenario":"Routine maintained","routine":["AM: HA serum + SPF50","PM: ceramide cream","2x/week: gentle exfoliant"]},"bad":{"days":7,"score":65,"scenario":"Sleep deprivation","risks":["Under 6h sleep","Skip sunscreen","High sugar diet"]}},"nutritionTips":{"supplements":[{"emoji":"🐟","name":"Omega-3","dose":"1000mg once daily","reason":"Reduces skin inflammation and strengthens the moisture barrier.","targetScore":"Trouble Risk"},{"emoji":"☀️","name":"Vitamin D3","dose":"1000IU once daily","reason":"Supports skin cell renewal and reduces dryness.","targetScore":"Moisture Balance"},{"emoji":"🍊","name":"Vitamin C","dose":"500mg once daily","reason":"Brightens skin and reduces pigmentation.","targetScore":"Pigmentation"}],"avoidFoods":[{"emoji":"🍟","food":"Fried chicken","reason":"Increases sebum production worsening breakouts."},{"emoji":"☕","food":"Coffee","reason":"Dehydrates skin and triggers inflammation."},{"emoji":"🍜","food":"Instant noodles","reason":"High sodium causes water retention and puffiness."}],"hydrationGoal":"Drink 8 glasses of water daily (about 1.5L) to support your moisture balance score."}}`;
  }

  if (lang === "ja") {
    return `あなたは皮膚科専門医です。添付の顔写真と調査情報(${surveyJson})を分析し、以下のJSON形式のみで回答してください。JSON以外のテキストは絶対に出力しないでください。すべての説明テキスト（comment、aiComment、finding、desc、reason）は日本語で記述してください。
重要：分析は主に写真から観察できる内容を基準にしてください。調査情報（特に年齢）は補助的な参考情報としてのみ使用し、写真の状態と調査内容が異なる場合は写真を優先してください。

重要なスコアルール：すべてのスコアは0〜100で、100が最良の状態です。具体的に：
- 붉은기 수준（赤み）：100 = 赤みが全くない清潔な肌、0 = 重度の赤み/酒さ
- 트러블 위험（トラブルリスク）：100 = トラブル/ニキビリスクが全くない、0 = 重度のニキビ
- 다크서클（クマ）：100 = クマが全くない、0 = 重度のクマ
- 잡티/색소침착（シミ/色素沈着）：100 = シミ/色素沈着が全くない、0 = 重度のシミ
- その他の項目も同様：100 = 最良、0 = 最悪

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
nutritionTips: スキャンで最もスコアが低い項目に基づくパーソナライズされた食事アドバイス
- supplements: この肌タイプに合うサプリ2〜3種 (emoji: 絵文字1つ, name: 15文字以内のサプリ名, dose: 服用目安, reason: 1文の日本語で効果説明, targetScore: このサプリが最も役立つスコア項目名)
- avoidFoods: 今日避けるべき身近な食べ物3つ (ラーメン・お菓子・コーヒー・アルコール等、日常的によく食べるもの中心、supplementsと重複なし、互いに重複なし) (emoji: 絵文字1つ, food: 10文字以内の日本語食品名, reason: 1文の日本語で悪影響説明)
- hydrationGoal: 肌の状態に合わせた1文の日本語での1日の水分摂取推奨

出力形式（必ずこの構造で）：
{"scores":[{"label":"종합 컨디션","score":75,"comment":"全体的な肌コンディションは良好です。"},{"label":"수분 밸런스","score":60,"comment":"やや水分が不足しています。"},{"label":"붉은기 수준","score":45,"comment":"軽い赤みが観察されます。"},{"label":"모공 상태","score":70,"comment":"毛穴の状態は比較的きれいです。"},{"label":"주름 및 탄력","score":80,"comment":"弾力が良好です。"},{"label":"잡티/색소침착","score":55,"comment":"一部に色素沈着が見られます。"},{"label":"트러블 위험","score":65,"comment":"ニキビリスクは低いです。"},{"label":"다크서클","score":50,"comment":"クマがやや見られます。"},{"label":"피부 광채","score":70,"comment":"適度なツヤがあります。"},{"label":"피부결 균일도","score":75,"comment":"肌のキメは比較的均一です。"}],"skinAge":29,"aiComment":"ここに総評を記述してください。","hotspots":[{"x":45,"y":55,"type":"シミ"}],"skinReport":[{"area":"おでこ","finding":"おでこにやや皮脂が観察されます。"},{"area":"ほお","finding":"ほお部分はやや乾燥しています。"},{"area":"鼻","finding":"鼻周りの毛穴がやや広がっています。"},{"area":"あご","finding":"あごのラインは比較的安定しています。"}],"improvements":[{"title":"保湿補給","desc":"ヒアルロン酸セラムを朝晩使用してください。肌の水分バリアを強化します。"},{"title":"紫外線対策","desc":"毎日SPF50+の日焼け止めを塗ってください。色素沈着予防に必須です。"},{"title":"鎮静ケア","desc":"センテラトナーで肌を落ち着かせてください。刺激の少ない製品を選びましょう。"}],"cosmetics":[{"type":"美容液","key":"ヒアルロン酸","reason":"肌に水分を補給し、乾燥を改善します。"},{"type":"日焼け止め","key":"酸化亜鉛","reason":"紫外線から肌を守り、老化を予防します。"}],"prediction":{"good":{"days":14,"score":79,"scenario":"ルーティン維持時","routine":["朝: HAセラム+日焼け止め","夜: セラミドクリーム","週2: 低刺激ピーリング"]},"bad":{"days":7,"score":65,"scenario":"睡眠不足が続く場合","risks":["睡眠6時間未満","日焼け止めをサボる","刺激の強い食事"]}},"nutritionTips":{"supplements":[{"emoji":"🐟","name":"オメガ3","dose":"1日1回1000mg","reason":"皮膚の炎症を抑え水分バリアを強化します。","targetScore":"トラブルリスク"},{"emoji":"☀️","name":"ビタミンD3","dose":"1日1回1000IU","reason":"肌細胞の再生を助け乾燥を改善します。","targetScore":"水分バランス"},{"emoji":"🍊","name":"ビタミンC","dose":"1日1回500mg","reason":"肌を明るくし色素沈着を改善します。","targetScore":"シミ・色素沈着"}],"avoidFoods":[{"emoji":"🍜","food":"ラーメン","reason":"塩分が多く肌のむくみや炎症を悪化させます。"},{"emoji":"☕","food":"コーヒー","reason":"利尿作用で肌を乾燥させ炎症を引き起こします。"},{"emoji":"🍪","food":"お菓子","reason":"血糖値の急上昇が肌の炎症を引き起こします。"}],"hydrationGoal":"1日8杯の水（約1.5L）を飲んで水分バランスを整えましょう。"}}`;
  }

  // Korean (default)
  return `당신은 피부과 전문의입니다. 첨부된 얼굴 사진과 설문 정보(${surveyJson})를 분석하여 아래 JSON 형식으로만 답하세요. JSON 외 다른 텍스트는 절대 출력하지 마세요.
중요: 분석은 사진에서 실제로 관찰되는 내용을 최우선으로 하세요. 설문 정보(특히 나이)는 참고용으로만 활용하고, 사진 상태와 설문 내용이 다를 경우 사진을 기준으로 판단하세요.

중요 점수 규칙: 모든 점수는 0~100이며 100이 가장 좋은 상태입니다. 구체적으로:
- 붉은기 수준: 100 = 붉은기가 전혀 없는 깨끗한 피부, 0 = 심한 홍조/발적
- 트러블 위험: 100 = 트러블/여드름 위험이 전혀 없음, 0 = 심한 여드름/트러블
- 다크서클: 100 = 다크서클이 전혀 없음, 0 = 심한 다크서클
- 잡티/색소침착: 100 = 잡티가 전혀 없음, 0 = 심한 잡티/색소침착
- 나머지 항목도 동일: 100 = 최상, 0 = 최악

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
nutritionTips: 스캔 점수 중 가장 낮은 항목에 직결되는 맞춤 식단 조언
- supplements: 이 피부 타입에 도움되는 영양제 2~3가지 (emoji: 이모지 1개, name: 영양제명 10자이내, dose: "하루 1회 500mg" 형식 복용법, reason: 1문장 효과 설명, targetScore: 이 영양제가 가장 도움되는 점수 항목명)
- avoidFoods: 오늘 피해야 할 음식 3가지 — 라면·치킨·과자·커피·술·빵·떡볶이 등 일상에서 자주 접하는 음식 위주로, supplements와 겹치지 않게, 서로 중복 없이 (emoji: 이모지 1개, food: 8자이내, reason: 1문장 피부에 미치는 악영향 설명)
- hydrationGoal: 현재 피부 상태에 맞는 하루 수분 섭취 권장 1문장

출력 형식 (반드시 이 구조 그대로):
{"scores":[{"label":"종합 컨디션","score":75,"comment":"전반적인 피부 컨디션이 양호합니다."},{"label":"수분 밸런스","score":60,"comment":"수분이 다소 부족합니다."},{"label":"붉은기 수준","score":45,"comment":"붉은기가 약간 관찰됩니다."},{"label":"모공 상태","score":70,"comment":"모공 상태가 깨끗합니다."},{"label":"주름 및 탄력","score":80,"comment":"탄력이 좋은 편입니다."},{"label":"잡티/색소침착","score":55,"comment":"일부 색소침착이 있습니다."},{"label":"트러블 위험","score":65,"comment":"트러블 위험도가 낮습니다."},{"label":"다크서클","score":50,"comment":"다크서클이 다소 있습니다."},{"label":"피부 광채","score":70,"comment":"적당한 광채가 있습니다."},{"label":"피부결 균일도","score":75,"comment":"피부결이 고른 편입니다."}],"skinAge":29,"aiComment":"총평을 여기에 작성하세요.","hotspots":[{"x":45,"y":55,"type":"잡티"}],"skinReport":[{"area":"이마","finding":"이마에 약간의 유분이 관찰됩니다."},{"area":"볼","finding":"볼 부위는 건조한 편입니다."},{"area":"코","finding":"코 주변 모공이 다소 넓습니다."},{"area":"턱","finding":"턱 라인은 비교적 안정적입니다."}],"improvements":[{"title":"수분 보충","desc":"히알루론산 세럼을 아침저녁 사용하세요. 피부 수분 장벽을 강화합니다."},{"title":"자외선 차단","desc":"SPF50+ 선크림을 매일 사용하세요. 색소침착 예방에 필수입니다."},{"title":"진정 루틴","desc":"센텔라 토너로 피부를 진정시키세요. 자극 없는 제품을 선택하세요."}],"cosmetics":[{"type":"수분 세럼","key":"히알루론산","reason":"피부 수분을 채워 건조함을 개선합니다."},{"type":"선크림","key":"징크옥사이드","reason":"자외선 차단으로 피부 노화를 예방합니다."}],"prediction":{"good":{"days":14,"score":79,"scenario":"루틴 유지 시","routine":["아침: 히알루론산 세럼+선크림","저녁: 세라마이드 크림","주 2회: 저자극 각질 케어"]},"bad":{"days":7,"score":65,"scenario":"수면 부족 지속 시","risks":["수면 6시간 이하","자외선 차단 생략","자극적 식단·음주"]}},"nutritionTips":{"supplements":[{"emoji":"🐟","name":"오메가3","dose":"하루 1회 1000mg","reason":"피지 염증을 완화하고 수분 장벽을 강화합니다.","targetScore":"트러블 위험"},{"emoji":"☀️","name":"비타민D3","dose":"하루 1회 1000IU","reason":"피부 세포 재생을 촉진하고 건조함을 개선합니다.","targetScore":"수분 밸런스"},{"emoji":"🍊","name":"비타민C","dose":"하루 1회 500mg","reason":"항산화 작용으로 색소침착을 개선하고 피부 광채를 높입니다.","targetScore":"잡티/색소침착"}],"avoidFoods":[{"emoji":"🍜","food":"라면","reason":"나트륨 과다로 피부 부종과 염증을 악화시킵니다."},{"emoji":"☕","food":"커피","reason":"이뇨 작용으로 피부 수분을 빼앗아 건조함을 유발합니다."},{"emoji":"🍗","food":"치킨","reason":"포화지방이 피지 분비를 늘려 트러블을 악화시킵니다."}],"hydrationGoal":"하루 물 8잔(약 1.5L)으로 수분 밸런스 점수를 회복하세요."}}`;
}

export const onRequest = async (context: any) => {
  const { request, env } = context;

  // Preflight(OPTIONS) 요청 대응
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // POST 요청 처리
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { image, surveyData } = body;
      const ALLOWED_LANGS = ["ko", "en", "ja"] as const;
      const rawLang = body.lang ?? "ko";
      const lang = ALLOWED_LANGS.includes(rawLang) ? rawLang : "ko";

      if (!env.GCP_SERVICE_ACCOUNT) {
        return new Response(JSON.stringify({ error: "GCP_SERVICE_ACCOUNT is missing in environment variables." }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const prompt = buildPrompt(surveyData, lang);

      const base64Data = image.split(",")[1] || image;
      const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      const response = await callGemini({
        gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 1024 },
        },
        safetySettings: SAFETY_SETTINGS_NONE,
      });

      const text = extractText(response);
      const analysisData = parseGeminiJson(text);

      // scores: 반드시 10개 항목 강제 보정
      const REQUIRED_LABELS = [
        "종합 컨디션","수분 밸런스","붉은기 수준","모공 상태","주름 및 탄력",
        "잡티/색소침착","트러블 위험","다크서클","피부 광채","피부결 균일도"
      ];
      const existingScores = Array.isArray(analysisData.scores) ? analysisData.scores : [];
      analysisData.scores = REQUIRED_LABELS.map((label, i) => {
        const found = existingScores.find((s: any) => s.label === label) || existingScores[i];
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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  // 허용되지 않는 메소드
  return new Response(JSON.stringify({ error: `Method ${request.method} not allowed` }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
};
