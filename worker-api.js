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

    // 테스트 엔드포인트: GET /test-push
    if (request.method === "GET" && new URL(request.url).pathname === "/test-push") {
      const logs = [];
      try {
        const kv = env.PUSH_KV;
        if (!kv) { return new Response("❌ PUSH_KV not bound", { headers: corsHeaders }); }
        const allIdsRaw = await kv.get("push:all_ids");
        if (!allIdsRaw) { return new Response("❌ push:all_ids 없음 (구독자 없음)", { headers: corsHeaders }); }
        const allIds = JSON.parse(allIdsRaw);
        logs.push(`구독자 수: ${allIds.length}`);
        for (const id of allIds) {
          const raw = await kv.get(`push:sub:${id}`);
          if (!raw) { logs.push(`❌ ${id}: 구독 데이터 없음`); continue; }
          const { subscription, lang } = JSON.parse(raw);
          logs.push(`📤 ${id} 전송 시도 (lang: ${lang})`);
          try {
            await sendPush(subscription, {
              title: "🌟 Fonday 테스트 알림",
              body: "푸시 알림이 정상 동작합니다! 🎉",
              url: "/",
            }, env);
            logs.push(`✅ ${id} 전송 성공`);
          } catch (e) {
            logs.push(`❌ ${id} 전송 실패: ${e.message}`);
          }
        }
      } catch (e) {
        logs.push(`❌ 오류: ${e.message}`);
      }
      return new Response(logs.join("\n"), { headers: corsHeaders });
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
  },

  // ── Cron 스케줄러 ──────────────────────────────────────────────
  // KST 09:00 (UTC 00:00) 스캔 리마인더
  // KST 12:00 (UTC 03:00) 점심 식단 알림
  // KST 18:00 (UTC 09:00) 저녁 식단 알림
  async scheduled(event, env, ctx) {
    const hour = new Date().getUTCHours();
    const isScanReminder = (hour === 0); // UTC 00:00 = KST 09:00
    const isLunch = (hour === 3);        // UTC 03:00 = KST 12:00
    const isDinner = (hour === 9);       // UTC 09:00 = KST 18:00

    if (isScanReminder) {
      ctx.waitUntil(sendScanReminderToAll(env));
    } else if (isLunch || isDinner) {
      const meal = isLunch ? "lunch" : "dinner";
      ctx.waitUntil(sendMealPushToAll(env, meal));
    }
  }
};

// ─── 식단 푸시 데이터 (피부 타입 × 언어 × 식사) ─────────────────
const MEAL_TIPS = {
  ko: {
    lunch: {
      O: { menu: "현미밥 + 구운 연어 + 시금치 샐러드", tip: "저GI 식단으로 피지 분비를 조절해요. 아연이 풍부한 연어가 모공을 정화합니다." },
      D: { menu: "아보카도 통곡물 토스트 + 달걀", tip: "오메가3와 비타민E가 피부 지질막을 강화해 건조함을 줄여요." },
      S: { menu: "강황 닭가슴살 + 브로콜리 찜", tip: "강황의 커큐민이 염증을 억제해 민감성 붉은기를 진정시켜요." },
      P: { menu: "딸기 요거트 볼 + 피망 볶음밥", tip: "비타민C가 멜라닌 합성 효소를 억제해 기미 예방에 효과적이에요." },
      W: { menu: "달걀찜 + 블루베리 + 견과류", tip: "항산화물질이 콜라겐 분해 효소를 억제해 주름을 예방해요." },
      default: { menu: "균형 잡힌 한식 정식 (밥 + 국 + 반찬 3가지)", tip: "다양한 영양소가 건강한 피부를 유지하는 데 도움이 돼요." },
    },
    dinner: {
      O: { menu: "두부 야채볶음 + 된장국", tip: "프로바이오틱스가 풍부한 된장이 장-피부 축을 강화해요." },
      D: { menu: "연어 스테이크 + 올리브오일 샐러드", tip: "건강한 지방이 피부 장벽을 복구하고 수분을 잡아줘요." },
      S: { menu: "고등어 구이 + 김치 + 나물", tip: "오메가3와 프로바이오틱스가 피부 면역을 안정시켜요." },
      P: { menu: "토마토 달걀볶음 + 시금치나물", tip: "토마토의 리코펜과 시금치의 엽산이 색소 회복을 도와요." },
      W: { menu: "닭날개 조림 + 석류 주스", tip: "콜라겐 원료(닭날개)와 레스베라트롤(석류)이 탄력을 높여요." },
      default: { menu: "생선 + 제철 채소 중심 저녁", tip: "가벼운 저녁으로 피부 야간 재생을 도와요." },
    },
  },
  en: {
    lunch: {
      O: { menu: "Brown rice + Grilled salmon + Spinach salad", tip: "Low-GI diet controls sebum. Zinc-rich salmon cleanses pores." },
      D: { menu: "Avocado whole-grain toast + Eggs", tip: "Omega-3 & Vitamin E strengthen the skin lipid barrier to fight dryness." },
      S: { menu: "Turmeric chicken + Steamed broccoli", tip: "Curcumin in turmeric suppresses inflammation and calms redness." },
      P: { menu: "Strawberry yogurt bowl + Bell pepper rice", tip: "Vitamin C inhibits melanin synthesis enzymes to prevent dark spots." },
      W: { menu: "Steamed egg + Blueberries + Mixed nuts", tip: "Antioxidants inhibit collagen-degrading enzymes to prevent wrinkles." },
      default: { menu: "Balanced meal with protein, veggies & whole grains", tip: "A variety of nutrients helps maintain healthy, glowing skin." },
    },
    dinner: {
      O: { menu: "Tofu stir-fry + Miso soup", tip: "Probiotic-rich miso strengthens the gut-skin axis." },
      D: { menu: "Salmon steak + Olive oil salad", tip: "Healthy fats repair the skin barrier and lock in moisture." },
      S: { menu: "Grilled mackerel + Kimchi + Seasoned greens", tip: "Omega-3 & probiotics stabilize skin immunity." },
      P: { menu: "Tomato egg stir-fry + Sautéed spinach", tip: "Lycopene (tomato) & folate (spinach) aid pigmentation recovery." },
      W: { menu: "Braised chicken wings + Pomegranate juice", tip: "Collagen from chicken wings + resveratrol from pomegranate boost elasticity." },
      default: { menu: "Light fish & seasonal vegetables for dinner", tip: "A light dinner supports skin overnight regeneration." },
    },
  },
  ja: {
    lunch: {
      O: { menu: "玄米 + 焼きサーモン + ほうれん草サラダ", tip: "低GI食で皮脂分泌を調節。亜鉛豊富なサーモンが毛穴を清潔に保ちます。" },
      D: { menu: "アボカド全粒粉トースト + 卵", tip: "オメガ3とビタミンEが肌の脂質バリアを強化し乾燥を改善します。" },
      S: { menu: "ターメリックチキン + ブロッコリー蒸し", tip: "クルクミンが炎症を抑え、敏感肌の赤みを鎮めます。" },
      P: { menu: "いちごヨーグルトボウル + パプリカ炒め飯", tip: "ビタミンCがメラニン合成酵素を阻害し、シミを予防します。" },
      W: { menu: "茶碗蒸し + ブルーベリー + ナッツ", tip: "抗酸化物質がコラーゲン分解酵素を阻害し、しわを予防します。" },
      default: { menu: "栄養バランスの取れた和定食", tip: "さまざまな栄養素が健康的な肌を維持するのに役立ちます。" },
    },
    dinner: {
      O: { menu: "豆腐野菜炒め + 味噌汁", tip: "プロバイオティクス豊富な味噌が腸-皮膚軸を強化します。" },
      D: { menu: "サーモンステーキ + オリーブオイルサラダ", tip: "良質な脂肪が肌バリアを修復し、潤いを閉じ込めます。" },
      S: { menu: "サバの塩焼き + キムチ + 和え物", tip: "オメガ3とプロバイオティクスが肌の免疫を安定させます。" },
      P: { menu: "トマト卵炒め + ほうれん草のおひたし", tip: "リコペン(トマト)と葉酸(ほうれん草)が色素沈着の回復を助けます。" },
      W: { menu: "手羽先の煮込み + ザクロジュース", tip: "コラーゲン(手羽先)とレスベラトロール(ザクロ)が弾力を高めます。" },
      default: { menu: "魚と旬の野菜中心の夕食", tip: "軽い夕食が肌の夜間再生をサポートします。" },
    },
  },
};

function getMealTip(baumannType, lang, meal) {
  const langData = MEAL_TIPS[lang] || MEAL_TIPS.ko;
  const mealData = langData[meal];

  // 바우만 4글자 전체 매칭 (우선순위: O/D → S/R → P/N → W/T)
  const priority = ["O", "D", "S", "R", "P", "N", "W", "T"];
  const matched = priority.filter(l => baumannType?.includes(l) && mealData[l]);

  if (matched.length === 0) return mealData.default;

  // 메뉴는 최우선 글자 기준
  const menu = mealData[matched[0]].menu;

  // 팁은 상위 2개 글자 조합 (4글자 모두 반영)
  const tips = matched.slice(0, 2).map(l => mealData[l].tip).join(" ");

  return { menu, tip: tips };
}

// ─── VAPID 서명 (Web Crypto API) ──────────────────────────────────
async function signVapid(privateKeyB64u, audience, subject) {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 43200, sub: subject };

  const encode = obj => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  const rawKeyBytes = Uint8Array.from(atob(privateKeyB64u.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  // raw 32-byte EC key → PKCS8 DER 래핑 (Web Crypto API 요구사항)
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20
  ]);
  const pkcs8Key = new Uint8Array(pkcs8Prefix.length + rawKeyBytes.length);
  pkcs8Key.set(pkcs8Prefix);
  pkcs8Key.set(rawKeyBytes, pkcs8Prefix.length);
  const key = await crypto.subtle.importKey(
    "pkcs8", pkcs8Key,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );
  const sigB64u = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${signingInput}.${sigB64u}`;
}

// ─── 단일 Push 전송 (RFC 8291 aes128gcm) ────────────────────────
async function sendPush(subscription, payload, env) {
  const { endpoint, keys: { p256dh, auth } } = subscription;
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const VAPID_PRIVATE = env.VAPID_PRIVATE_KEY;
  const VAPID_PUBLIC = env.VAPID_PUBLIC_KEY;
  const VAPID_SUB = env.VAPID_SUBJECT || "mailto:nexiope@gmail.com";

  if (!VAPID_PRIVATE || !VAPID_PUBLIC) {
    console.error("[push] VAPID keys not configured");
    return;
  }

  const jwt = await signVapid(VAPID_PRIVATE, audience, VAPID_SUB);

  const b64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const enc = new TextEncoder();

  const receiverPublicBytes = b64url(p256dh);
  const authSecret = b64url(auth);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 임시 키 쌍 생성
  const senderKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const senderPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", senderKeys.publicKey));

  // ECDH shared secret
  const receiverKey = await crypto.subtle.importKey("raw", receiverPublicBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, senderKeys.privateKey, 256);

  // PRK = HKDF(salt=authSecret, IKM=sharedSecret, info="WebPush: info\0" + receiverPub + senderPub)
  const prkIkm = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const prkInfo = new Uint8Array([...enc.encode("WebPush: info\0"), ...receiverPublicBytes, ...senderPublicRaw]);
  const prkBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecret, info: prkInfo }, prkIkm, 256);
  const prk = await crypto.subtle.importKey("raw", prkBits, { name: "HKDF" }, false, ["deriveBits"]);

  // CEK (16 bytes) + Nonce (12 bytes)
  const cekBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: aes128gcm\0") }, prk, 128);
  const nonceBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: nonce\0") }, prk, 96);
  const cek = await crypto.subtle.importKey("raw", cekBits, "AES-GCM", false, ["encrypt"]);
  const nonce = new Uint8Array(nonceBits);

  // 평문 + 레코드 구분자 \x02
  const plaintext = enc.encode(JSON.stringify(payload));
  const padded = new Uint8Array(plaintext.length + 1);
  padded.set(plaintext);
  padded[plaintext.length] = 0x02;

  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cek, padded));

  // aes128gcm 바디: salt(16) + rs(4) + keyid_len(1) + senderPub(65) + ciphertext
  const rs = 4096;
  const body = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length);
  let offset = 0;
  body.set(salt, offset); offset += 16;
  body[offset++] = (rs >> 24) & 0xff; body[offset++] = (rs >> 16) & 0xff;
  body[offset++] = (rs >> 8) & 0xff;  body[offset++] = rs & 0xff;
  body[offset++] = 65;
  body.set(senderPublicRaw, offset); offset += 65;
  body.set(ciphertext, offset);

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
}

// ─── 전체 구독자에게 스캔 리마인더 푸시 ──────────────────────────
async function sendScanReminderToAll(env) {
  const kv = env.PUSH_KV;
  if (!kv) { console.log("[push] PUSH_KV not bound"); return; }

  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  const titles = { ko: "🌟 오늘 피부 스캔 잊지 마세요", en: "🌟 Don't forget today's skin scan!", ja: "🌟 今日の肌スキャンをお忘れなく" };
  const bodies = { ko: "오늘의 피부 상태를 확인하고 스트릭을 이어가세요! 🔥", en: "Check your skin today and keep your streak going! 🔥", ja: "今日の肌状態を確認してストリークを続けましょう！🔥" };

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const { subscription, lang } = JSON.parse(raw);
      await sendPush(subscription, {
        title: titles[lang] || titles.ko,
        body: bodies[lang] || bodies.ko,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[push] scan reminder id=${id} error:`, e.message);
    }
  }
}

// ─── 전체 구독자에게 식단 푸시 ────────────────────────────────────
async function sendMealPushToAll(env, meal) {
  const kv = env.PUSH_KV;
  if (!kv) { console.log("[push] PUSH_KV not bound"); return; }

  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const { subscription, baumannType, lang } = JSON.parse(raw);
      const tip = getMealTip(baumannType, lang, meal);
      const langData = MEAL_TIPS[lang] || MEAL_TIPS.ko;
      const title = meal === "lunch"
        ? (langData.lunch.default ? "🥗 Fonday 점심 추천" : "🥗 Fonday Lunch")
        : (langData.dinner.default ? "🍽️ Fonday 저녁 추천" : "🍽️ Fonday Dinner");
      // 언어별 타이틀
      const titles = { ko: meal === "lunch" ? "🥗 Fonday 점심 추천" : "🍽️ Fonday 저녁 추천",
                       en: meal === "lunch" ? "🥗 Fonday Lunch Pick" : "🍽️ Fonday Dinner Pick",
                       ja: meal === "lunch" ? "🥗 Fondayランチおすすめ" : "🍽️ Fondayディナーおすすめ" };
      const typeLabel = baumannType ? `[${baumannType}] ` : "";
      await sendPush(subscription, {
        title: titles[lang] || titles.ko,
        body: `${typeLabel}${tip.menu}\n${tip.tip}`,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[push] id=${id} error:`, e.message);
    }
  }
}
