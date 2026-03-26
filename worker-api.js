import { callGemini, extractText, SAFETY_SETTINGS_NONE } from "./functions/lib/vertex-ai";

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

    // 진단 엔드포인트: GET /debug-vapid (ADMIN_KEY 인증 필수)
    if (request.method === "GET" && new URL(request.url).pathname === "/debug-vapid") {
      const adminKey = new URL(request.url).searchParams.get("key");
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

      const pub = env.VAPID_PUBLIC_KEY?.trim();
      const priv = env.VAPID_PRIVATE_KEY?.trim();
      if (!pub || !priv) return new Response("VAPID keys not set", { headers: corsHeaders });
      const b64url = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
      const toB64u = arr => btoa(String.fromCharCode(...arr)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
      let pubBytes, privBytes;
      try { pubBytes = b64url(pub); } catch(e) { return new Response(`pubKey decode error: ${e.message}`, { headers: corsHeaders }); }
      try { privBytes = b64url(priv); } catch(e) { return new Response(`privKey decode error: ${e.message}`, { headers: corsHeaders }); }
      const info = {
        pubKeyLen: pubBytes.length,
        pubKeyFirstByte: `0x${pubBytes[0].toString(16).padStart(2,"0")}`,
        privKeyLen: privBytes.length,
        pubHasStdChars: /[+/=]/.test(pub),
        privHasStdChars: /[+/=]/.test(priv),
      };
      // 키쌍 매칭 검증
      try {
        const privKey = await crypto.subtle.importKey("jwk", {
          kty:"EC", crv:"P-256",
          d: priv,
          x: toB64u(pubBytes.slice(1,33)),
          y: toB64u(pubBytes.slice(33,65)),
          key_ops:["sign"],
        }, { name:"ECDSA", namedCurve:"P-256" }, false, ["sign"]);
        const pubKey = await crypto.subtle.importKey("raw", pubBytes, { name:"ECDSA", namedCurve:"P-256" }, false, ["verify"]);
        const testMsg = new TextEncoder().encode("fonday-test");
        const sig = await crypto.subtle.sign({ name:"ECDSA", hash:"SHA-256" }, privKey, testMsg);
        const valid = await crypto.subtle.verify({ name:"ECDSA", hash:"SHA-256" }, pubKey, sig, testMsg);
        info.keypairMatches = valid;
      } catch(e) {
        info.keypairError = e.message;
      }
      // JWT 생성 후 반환 (jwt.io에서 검증용)
      try {
        info.sampleJwt = await signVapid(priv, "https://web.push.apple.com", env.VAPID_SUBJECT || "mailto:nexiope@gmail.com", pub);
      } catch(e) {
        info.jwtError = e.message;
      }
      return new Response(JSON.stringify(info, null, 2), { headers: corsHeaders });
    }

    // 테스트 엔드포인트: GET /test-push (ADMIN_KEY 인증 필수)
    if (request.method === "GET" && new URL(request.url).pathname === "/test-push") {
      const adminKey = new URL(request.url).searchParams.get("key");
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

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

        if (!env.GCP_SERVICE_ACCOUNT) {
          return new Response(JSON.stringify({ error: "GCP_SERVICE_ACCOUNT MISSING" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const prompt = buildPrompt(surveyData, lang);

        const base64Data = image.split(",")[1] || image;
        const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

        const geminiResponse = await callGemini({
          gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Data } },
              ],
            },
          ],
          safetySettings: SAFETY_SETTINGS_NONE,
        });

        const text = extractText(geminiResponse);
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
  // KST 07:30 (UTC 22:30) 스캔 리마인더
  // KST 12:00 (UTC 03:00) 점심 식단 알림
  // KST 15:00 (UTC 06:00) 수분 리마인더
  // KST 18:00 (UTC 09:00) 저녁 식단 알림
  // KST 20:00 (UTC 11:00) 루틴 리마인더
  // KST 21:00 (UTC 12:00) 루틴 리마인더
  // KST 22:00 (UTC 13:00) 루틴 리마인더
  async scheduled(event, env, ctx) {
    const now = new Date();
    const hour = now.getUTCHours();

    if (hour === 0) {
      // KST 09:00 — 화장품 효과 리마인더
      ctx.waitUntil(sendCosmeticEffectReminders(env));
    } else if (hour === 22) {
      // KST 07:00 — 스캔 리마인더 + 날씨 케어 동시 발송
      ctx.waitUntil(Promise.all([
        sendScanReminderToAll(env),
        sendWeatherCarePushToAll(env),
      ]));
    } else if (hour === 1) {
      // KST 10:00 — UV 케어
      ctx.waitUntil(sendUVCarePushToAll(env));
    } else if (hour === 3) {
      // KST 12:00 — 점심
      ctx.waitUntil(sendMealPushToAll(env, "lunch"));
    } else if (hour === 6) {
      // KST 15:00 — 수분 리마인더
      ctx.waitUntil(sendHydrationPushToAll(env));
    } else if (hour === 9) {
      // KST 18:00 — 저녁
      ctx.waitUntil(sendMealPushToAll(env, "dinner"));
    } else if (hour === 11 || hour === 12 || hour === 13) {
      // KST 20/21/22시 — 루틴 리마인더
      ctx.waitUntil(sendRoutineReminderToAll(env, hour + 9));
    } else if (hour === 14) {
      // KST 23:00 — 취침 케어
      ctx.waitUntil(sendBedtimeCarePushToAll(env));
    }
  }
};

// ─── 식단 푸시 데이터 (피부 타입 × 언어 × 식사) — 배열로 다양화 ─────────────────
const MEAL_TIPS = {
  ko: {
    lunch: {
      O: [
        { menu: "현미밥 + 구운 연어 + 시금치 샐러드", tip: "저GI 식단으로 피지 분비를 조절해요. 아연이 풍부한 연어가 모공을 정화합니다." },
        { menu: "퀴노아 샐러드 + 닭가슴살 + 아몬드", tip: "저당 식단과 양질의 단백질이 피지 밸런스를 유지해요." },
        { menu: "메밀국수 + 두부 + 미나리", tip: "가벼운 탄수화물과 식물성 단백질로 피지 과다를 예방해요." },
        { menu: "잡곡밥 + 청국장찌개 + 콩나물", tip: "발효식품이 장 건강을 개선해 피지 조절에 도움이 돼요." },
      ],
      D: [
        { menu: "아보카도 통곡물 토스트 + 달걀", tip: "오메가3와 비타민E가 피부 지질막을 강화해 건조함을 줄여요." },
        { menu: "연어 포케 볼 + 현미밥", tip: "오메가3가 풍부한 연어가 피부 수분 장벽을 보호해요." },
        { menu: "호두 크림 파스타 + 루꼴라", tip: "견과류의 건강한 지방이 피부 보습을 내부에서 돕습니다." },
        { menu: "버섯 리조또 + 올리브오일 드레싱", tip: "버섯의 비타민D와 올리브오일이 건조한 피부를 안정시켜요." },
      ],
      S: [
        { menu: "강황 닭가슴살 + 브로콜리 찜", tip: "강황의 커큐민이 염증을 억제해 민감성 붉은기를 진정시켜요." },
        { menu: "부드러운 두부찌개 + 시금치나물", tip: "순한 식재료 중심의 식사가 피부 자극을 최소화해요." },
        { menu: "오트밀 포리지 + 바나나 + 꿀", tip: "순한 곡물과 과일로 소화 부담을 줄이면 피부 민감도가 낮아져요." },
        { menu: "흰살생선 구이 + 감자 퓨레", tip: "자극 없는 담백한 식단이 민감한 피부를 안정시켜요." },
      ],
      P: [
        { menu: "딸기 요거트 볼 + 피망 볶음밥", tip: "비타민C가 멜라닌 합성 효소를 억제해 기미 예방에 효과적이에요." },
        { menu: "오렌지 치킨 샐러드 + 파프리카", tip: "감귤류의 비타민C가 색소 침착을 예방하고 톤을 균일하게 해요." },
        { menu: "키위 스무디볼 + 그래놀라", tip: "키위의 비타민C와 항산화 성분이 맑은 피부를 유지해요." },
        { menu: "토마토 리코펜 파스타 + 샐러드", tip: "리코펜이 자외선 손상을 줄이고 색소 침착을 완화해요." },
      ],
      W: [
        { menu: "달걀찜 + 블루베리 + 견과류", tip: "항산화물질이 콜라겐 분해 효소를 억제해 주름을 예방해요." },
        { menu: "콜라겐 보충 사골국 + 잡곡밥", tip: "사골의 천연 콜라겐이 피부 탄력을 직접 보충해요." },
        { menu: "삼색 나물비빔밥 + 미역국", tip: "해조류의 미네랄이 피부 재생을 촉진하고 탄력을 유지해요." },
        { menu: "장어덮밥 + 콩나물국", tip: "비타민A가 풍부한 장어가 피부 세포 재생을 촉진해요." },
      ],
      default: [
        { menu: "균형 잡힌 한식 정식 (밥 + 국 + 반찬 3가지)", tip: "다양한 영양소가 건강한 피부를 유지하는 데 도움이 돼요." },
        { menu: "제철 재료 비빔밥 + 된장국", tip: "다양한 색깔의 제철 재료로 피부에 필요한 영양을 채워요." },
        { menu: "두부김치 + 잡곡밥 + 미역국", tip: "발효식품과 해조류로 장 건강과 피부 건강을 동시에 챙겨요." },
      ],
    },
    dinner: {
      O: [
        { menu: "두부 야채볶음 + 된장국", tip: "프로바이오틱스가 풍부한 된장이 장-피부 축을 강화해요." },
        { menu: "닭가슴살 샐러드 + 현미밥", tip: "저녁에는 가벼운 단백질 중심으로 피지 부담을 줄이세요." },
        { menu: "새우 채소 볶음 + 미소국", tip: "저지방 해산물과 발효 수프로 깔끔하게 마무리하세요." },
        { menu: "버섯 수프 + 통밀빵", tip: "가벼운 저녁이 밤사이 피지 분비를 줄이는 데 도움이 돼요." },
      ],
      D: [
        { menu: "연어 스테이크 + 올리브오일 샐러드", tip: "건강한 지방이 피부 장벽을 복구하고 수분을 잡아줘요." },
        { menu: "아보카도 새우 타코 + 라임", tip: "아보카도의 모노불포화 지방이 밤사이 피부 보습을 도와요." },
        { menu: "크림 버섯 리조또 + 견과류 토핑", tip: "저녁에 건강한 지방을 보충하면 아침 건조감이 줄어요." },
        { menu: "전복죽 + 참기름 나물", tip: "전복의 아미노산이 밤사이 피부 재생을 돕고 보습을 유지해요." },
      ],
      S: [
        { menu: "고등어 구이 + 김치 + 나물", tip: "오메가3와 프로바이오틱스가 피부 면역을 안정시켜요." },
        { menu: "흰살생선 찜 + 순두부", tip: "자극 없는 순한 저녁 식단으로 피부 진정 효과를 높여요." },
        { menu: "양배추 쌈밥 + 된장찌개", tip: "양배추의 비타민U가 피부 점막을 보호하고 진정시켜요." },
        { menu: "닭가슴살 수프 + 감자", tip: "따뜻하고 부드러운 수프가 민감한 피부를 안정시켜요." },
      ],
      P: [
        { menu: "토마토 달걀볶음 + 시금치나물", tip: "토마토의 리코펜과 시금치의 엽산이 색소 회복을 도와요." },
        { menu: "비트 샐러드 + 구운 닭가슴살", tip: "비트의 베타인이 피부 세포 순환을 도와 색소를 개선해요." },
        { menu: "당근 수프 + 통밀빵 + 파프리카", tip: "베타카로틴이 피부 톤을 균일하게 하고 멜라닌을 조절해요." },
        { menu: "연어 샐러드 + 레몬 드레싱", tip: "비타민C와 오메가3가 함께 색소 침착 개선을 가속해요." },
      ],
      W: [
        { menu: "닭날개 조림 + 석류 주스", tip: "콜라겐 원료(닭날개)와 레스베라트롤(석류)이 탄력을 높여요." },
        { menu: "족발 + 깻잎쌈 + 마늘", tip: "족발의 천연 콜라겐과 깻잎의 항산화 성분이 주름을 예방해요." },
        { menu: "사골국 + 잡곡밥 + 나물", tip: "사골의 젤라틴이 피부 탄력을 보충하고 주름을 완화해요." },
        { menu: "삼겹살 쌈 + 부추무침 + 마늘", tip: "동물성 콜라겐과 부추의 비타민K가 탄력 유지에 도움이 돼요." },
      ],
      default: [
        { menu: "생선 + 제철 채소 중심 저녁", tip: "가벼운 저녁으로 피부 야간 재생을 도와요." },
        { menu: "닭가슴살 구이 + 샐러드 + 현미", tip: "단백질과 채소 중심 저녁으로 피부 회복을 도와요." },
        { menu: "콩국수 + 오이 + 토마토", tip: "식물성 단백질과 수분이 풍부한 저녁으로 피부를 가볍게 해요." },
      ],
    },
  },
  en: {
    lunch: {
      O: [
        { menu: "Brown rice + Grilled salmon + Spinach salad", tip: "Low-GI diet controls sebum. Zinc-rich salmon cleanses pores." },
        { menu: "Quinoa bowl + Grilled chicken + Almonds", tip: "Low-sugar meals with quality protein keep oil levels balanced." },
        { menu: "Soba noodles + Tofu + Watercress", tip: "Light carbs and plant protein help prevent excess sebum." },
      ],
      D: [
        { menu: "Avocado whole-grain toast + Eggs", tip: "Omega-3 & Vitamin E strengthen the skin lipid barrier to fight dryness." },
        { menu: "Salmon poke bowl + Brown rice", tip: "Omega-3 rich salmon protects your skin's moisture barrier." },
        { menu: "Walnut cream pasta + Arugula", tip: "Healthy fats from nuts help moisturize skin from within." },
      ],
      S: [
        { menu: "Turmeric chicken + Steamed broccoli", tip: "Curcumin in turmeric suppresses inflammation and calms redness." },
        { menu: "Gentle tofu stew + Spinach", tip: "Mild ingredients minimize skin irritation for sensitive types." },
        { menu: "Oatmeal porridge + Banana + Honey", tip: "Gentle grains reduce digestive stress and lower skin sensitivity." },
      ],
      P: [
        { menu: "Strawberry yogurt bowl + Bell pepper rice", tip: "Vitamin C inhibits melanin synthesis enzymes to prevent dark spots." },
        { menu: "Orange chicken salad + Bell peppers", tip: "Citrus vitamin C prevents pigmentation and evens skin tone." },
        { menu: "Kiwi smoothie bowl + Granola", tip: "Kiwi's vitamin C and antioxidants maintain a clear complexion." },
      ],
      W: [
        { menu: "Steamed egg + Blueberries + Mixed nuts", tip: "Antioxidants inhibit collagen-degrading enzymes to prevent wrinkles." },
        { menu: "Bone broth soup + Mixed grain rice", tip: "Natural collagen in bone broth directly supports skin elasticity." },
        { menu: "Colorful bibimbap + Seaweed soup", tip: "Seaweed minerals promote skin renewal and maintain firmness." },
      ],
      default: [
        { menu: "Balanced meal with protein, veggies & whole grains", tip: "A variety of nutrients helps maintain healthy, glowing skin." },
        { menu: "Seasonal grain bowl with mixed toppings", tip: "Colorful seasonal ingredients supply essential skin nutrients." },
      ],
    },
    dinner: {
      O: [
        { menu: "Tofu stir-fry + Miso soup", tip: "Probiotic-rich miso strengthens the gut-skin axis." },
        { menu: "Grilled chicken salad + Brown rice", tip: "Light protein at dinner reduces overnight oil production." },
        { menu: "Shrimp veggie stir-fry + Miso broth", tip: "Low-fat seafood keeps the evening meal light on pores." },
      ],
      D: [
        { menu: "Salmon steak + Olive oil salad", tip: "Healthy fats repair the skin barrier and lock in moisture." },
        { menu: "Avocado shrimp tacos + Lime", tip: "Avocado's monounsaturated fats support overnight skin hydration." },
        { menu: "Creamy mushroom risotto + Walnut topping", tip: "Healthy fats at dinner reduce morning dryness." },
      ],
      S: [
        { menu: "Grilled mackerel + Kimchi + Seasoned greens", tip: "Omega-3 & probiotics stabilize skin immunity." },
        { menu: "Steamed white fish + Silken tofu", tip: "Gentle dinner ingredients help calm irritated skin overnight." },
        { menu: "Cabbage wraps + Soybean paste stew", tip: "Cabbage's vitamin U protects and soothes skin membranes." },
      ],
      P: [
        { menu: "Tomato egg stir-fry + Sautéed spinach", tip: "Lycopene (tomato) & folate (spinach) aid pigmentation recovery." },
        { menu: "Beet salad + Grilled chicken breast", tip: "Beetroot betaine supports cell turnover and improves pigmentation." },
        { menu: "Carrot soup + Whole wheat bread", tip: "Beta-carotene helps even skin tone and regulate melanin." },
      ],
      W: [
        { menu: "Braised chicken wings + Pomegranate juice", tip: "Collagen from chicken wings + resveratrol from pomegranate boost elasticity." },
        { menu: "Bone broth + Mixed grain rice + Greens", tip: "Gelatin in bone broth replenishes skin elasticity." },
        { menu: "Pork belly wraps + Garlic chives", tip: "Animal collagen and vitamin K from chives help maintain firmness." },
      ],
      default: [
        { menu: "Light fish & seasonal vegetables for dinner", tip: "A light dinner supports skin overnight regeneration." },
        { menu: "Grilled chicken + Salad + Brown rice", tip: "Protein and veggie-focused dinner supports skin recovery." },
      ],
    },
  },
  ja: {
    lunch: {
      O: [
        { menu: "玄米 + 焼きサーモン + ほうれん草サラダ", tip: "低GI食で皮脂分泌を調節。亜鉛豊富なサーモンが毛穴を清潔に保ちます。" },
        { menu: "キヌアボウル + グリルチキン + アーモンド", tip: "低糖質と良質なタンパク質で皮脂バランスを維持します。" },
        { menu: "蕎麦 + 豆腐 + クレソン", tip: "軽い炭水化物と植物性タンパク質で皮脂過剰を防ぎます。" },
      ],
      D: [
        { menu: "アボカド全粒粉トースト + 卵", tip: "オメガ3とビタミンEが肌の脂質バリアを強化し乾燥を改善します。" },
        { menu: "サーモンポケボウル + 玄米", tip: "オメガ3豊富なサーモンが肌の水分バリアを保護します。" },
        { menu: "くるみクリームパスタ + ルッコラ", tip: "ナッツの健康的な脂肪が肌の保湿を内側からサポートします。" },
      ],
      S: [
        { menu: "ターメリックチキン + ブロッコリー蒸し", tip: "クルクミンが炎症を抑え、敏感肌の赤みを鎮めます。" },
        { menu: "優しい豆腐スープ + ほうれん草", tip: "刺激の少ない食材で肌への負担を最小限にします。" },
        { menu: "オートミール + バナナ + はちみつ", tip: "やさしい穀物で消化負担を減らし、肌の敏感度を下げます。" },
      ],
      P: [
        { menu: "いちごヨーグルトボウル + パプリカ炒め飯", tip: "ビタミンCがメラニン合成酵素を阻害し、シミを予防します。" },
        { menu: "オレンジチキンサラダ + パプリカ", tip: "柑橘類のビタミンCが色素沈着を防ぎ、肌トーンを均一にします。" },
        { menu: "キウイスムージーボウル + グラノーラ", tip: "キウイのビタミンCと抗酸化成分が澄んだ肌を維持します。" },
      ],
      W: [
        { menu: "茶碗蒸し + ブルーベリー + ナッツ", tip: "抗酸化物質がコラーゲン分解酵素を阻害し、しわを予防します。" },
        { menu: "骨だしスープ + 雑穀ご飯", tip: "骨だしの天然コラーゲンが肌の弾力を直接補充します。" },
        { menu: "三色ナムルビビンバ + わかめスープ", tip: "海藻のミネラルが肌の再生を促進し、ハリを維持します。" },
      ],
      default: [
        { menu: "栄養バランスの取れた和定食", tip: "さまざまな栄養素が健康的な肌を維持するのに役立ちます。" },
        { menu: "旬の食材を使った彩り豊かな丼", tip: "色とりどりの旬の食材が肌に必要な栄養を補います。" },
      ],
    },
    dinner: {
      O: [
        { menu: "豆腐野菜炒め + 味噌汁", tip: "プロバイオティクス豊富な味噌が腸-皮膚軸を強化します。" },
        { menu: "グリルチキンサラダ + 玄米", tip: "軽めのタンパク質で夜間の皮脂分泌を抑えます。" },
        { menu: "エビ野菜炒め + 味噌ブロス", tip: "低脂肪のシーフードで毛穴に負担をかけない夕食を。" },
      ],
      D: [
        { menu: "サーモンステーキ + オリーブオイルサラダ", tip: "良質な脂肪が肌バリアを修復し、潤いを閉じ込めます。" },
        { menu: "アボカドエビタコス + ライム", tip: "アボカドの一価不飽和脂肪酸が夜間の肌の保湿をサポートします。" },
        { menu: "クリームきのこリゾット + くるみトッピング", tip: "夕食の健康的な脂肪が朝の乾燥感を軽減します。" },
      ],
      S: [
        { menu: "サバの塩焼き + キムチ + 和え物", tip: "オメガ3とプロバイオティクスが肌の免疫を安定させます。" },
        { menu: "蒸し白身魚 + 絹ごし豆腐", tip: "やさしい夕食の食材が刺激を受けた肌を一晩で鎮めます。" },
        { menu: "キャベツ巻き + 味噌煮込み", tip: "キャベツのビタミンUが肌の粘膜を保護し鎮静させます。" },
      ],
      P: [
        { menu: "トマト卵炒め + ほうれん草のおひたし", tip: "リコペン(トマト)と葉酸(ほうれん草)が色素沈着の回復を助けます。" },
        { menu: "ビーツサラダ + グリルチキン", tip: "ビーツのベタインが細胞ターンオーバーを促進し色素沈着を改善します。" },
        { menu: "にんじんスープ + 全粒粉パン", tip: "ベータカロテンが肌トーンを均一にし、メラニンを調節します。" },
      ],
      W: [
        { menu: "手羽先の煮込み + ザクロジュース", tip: "コラーゲン(手羽先)とレスベラトロール(ザクロ)が弾力を高めます。" },
        { menu: "骨だしスープ + 雑穀ご飯 + ナムル", tip: "骨だしのゼラチンが肌の弾力を補充します。" },
        { menu: "豚バラ巻き + ニラ和え + にんにく", tip: "動物性コラーゲンとニラのビタミンKがハリの維持に役立ちます。" },
      ],
      default: [
        { menu: "魚と旬の野菜中心の夕食", tip: "軽い夕食が肌の夜間再生をサポートします。" },
        { menu: "グリルチキン + サラダ + 玄米", tip: "タンパク質と野菜中心の夕食が肌の回復をサポートします。" },
      ],
    },
  },
};

const SCORE_FOCUS_MAP = {
  "수분 밸런스": "hydration",
  "붉은기 수준": "calming",
  "모공 상태": "trouble",
  "주름 및 탄력": "firmness",
  "잡티/색소침착": "brightening",
  "트러블 위험": "trouble",
  "다크서클": "recovery",
  "피부 광채": "brightening",
  "피부결 균일도": "firmness",
};

const MEAL_VARIETY = {
  ko: {
    lunch: {
      hydration: [
        { key: "hydration-a", menu: "오이냉국", tip: "수분이 낮은 날에는 수분 많은 채소 반찬을 함께 드세요." },
        { key: "hydration-b", menu: "두유 한 컵", tip: "점심에 수분과 단백질을 같이 보충하면 건조감 완화에 도움이 됩니다." },
      ],
      calming: [
        { key: "calming-a", menu: "양배추찜", tip: "자극이 적은 채소를 곁들이면 붉은기 완화에 유리합니다." },
        { key: "calming-b", menu: "무가당 보리차", tip: "매운 양념 대신 담백한 구성으로 민감도를 낮춰주세요." },
      ],
      trouble: [
        { key: "trouble-a", menu: "병아리콩 샐러드", tip: "섬유질과 식물성 단백질을 더해 피지 급등을 완화하세요." },
        { key: "trouble-b", menu: "구운 버섯", tip: "튀김 대신 구운 토핑을 더하면 모공과 트러블 부담이 덜합니다." },
      ],
      brightening: [
        { key: "brightening-a", menu: "파프리카 샐러드", tip: "비타민C가 풍부한 채소를 더해 칙칙함 관리에 힘을 주세요." },
        { key: "brightening-b", menu: "키위 1개", tip: "항산화 과일을 곁들이면 색소 고민 완화에 도움이 됩니다." },
      ],
      firmness: [
        { key: "firmness-a", menu: "검은콩 반찬", tip: "단백질과 폴리페놀을 보강해 탄력 관리에 도움을 주세요." },
        { key: "firmness-b", menu: "참깨나물", tip: "미네랄이 풍부한 곁들임을 더해 피부결 회복을 보조하세요." },
      ],
      recovery: [
        { key: "recovery-a", menu: "단호박 샐러드", tip: "눈가 피로가 있는 날엔 베타카로틴 식품을 함께 드세요." },
        { key: "recovery-b", menu: "삶은 달걀 추가", tip: "점심 단백질을 보강하면 오후 처짐과 칙칙함 완화에 유리합니다." },
      ],
      default: [
        { key: "default-a", menu: "제철 과일 한 조각", tip: "한 가지 색이 아닌 여러 색 재료를 먹는 편이 피부에 유리합니다." },
        { key: "default-b", menu: "나물 한 접시", tip: "가공식품보다 채소 반찬 비중을 조금 더 올려보세요." },
      ],
    },
    dinner: {
      hydration: [
        { key: "hydration-a", menu: "들깨 버섯국", tip: "저녁에는 수분과 지방을 함께 보충해 장벽 회복을 도와주세요." },
        { key: "hydration-b", menu: "아보카도 슬라이스", tip: "건조한 날 저녁엔 좋은 지방을 조금 더하는 편이 좋습니다." },
      ],
      calming: [
        { key: "calming-a", menu: "찐애호박", tip: "자극적인 야식 대신 부드러운 채소를 더해 붉은기를 가라앉히세요." },
        { key: "calming-b", menu: "두부구이 추가", tip: "맵고 짠 반찬보다 담백한 단백질을 선택하는 편이 안전합니다." },
      ],
      trouble: [
        { key: "trouble-a", menu: "렌틸콩 곁들임", tip: "야식성 탄수화물 대신 포만감 있는 콩류를 더해 트러블 부담을 줄이세요." },
        { key: "trouble-b", menu: "구운 가지", tip: "기름진 저녁 대신 채소 비중을 늘리면 밤사이 피지 부담이 덜합니다." },
      ],
      brightening: [
        { key: "brightening-a", menu: "토마토 샐러드", tip: "저녁 항산화 식품은 칙칙함과 색소 고민 관리에 도움이 됩니다." },
        { key: "brightening-b", menu: "오렌지 반 개", tip: "비타민C 공급원을 조금 더하면 다음 날 피부 톤 관리에 유리합니다." },
      ],
      firmness: [
        { key: "firmness-a", menu: "검은깨 두부", tip: "탄력 저하가 느껴질 때는 단백질과 미네랄 보강이 중요합니다." },
        { key: "firmness-b", menu: "해조류 무침", tip: "미네랄이 풍부한 해조류를 곁들여 피부결 회복을 보조하세요." },
      ],
      recovery: [
        { key: "recovery-a", menu: "브로콜리 찜", tip: "피로 누적이 보이면 항산화 채소를 저녁에 더해 회복을 도와주세요." },
        { key: "recovery-b", menu: "따뜻한 우엉차", tip: "늦은 저녁 카페인 대신 부담 적은 음료로 마무리하는 편이 좋습니다." },
      ],
      default: [
        { key: "default-a", menu: "나물 2가지", tip: "저녁엔 탄수화물보다 채소와 단백질 비중을 높여보세요." },
        { key: "default-b", menu: "맑은 국 한 그릇", tip: "과식보다 가벼운 구성이 다음 날 피부 컨디션에 유리합니다." },
      ],
    },
  },
  en: {
    lunch: {
      hydration: [
        { key: "hydration-a", menu: "cucumber soup", tip: "Add a water-rich side when hydration is trending low." },
        { key: "hydration-b", menu: "a cup of soy milk", tip: "Extra fluids plus protein at lunch can help dryness." },
      ],
      calming: [
        { key: "calming-a", menu: "steamed cabbage", tip: "Mild vegetable sides are better than spicy add-ons on red days." },
        { key: "calming-b", menu: "unsweetened barley tea", tip: "Keep the lunch profile gentle to calm reactive skin." },
      ],
      trouble: [
        { key: "trouble-a", menu: "chickpea salad", tip: "More fiber and lean protein can reduce oil spikes." },
        { key: "trouble-b", menu: "roasted mushrooms", tip: "Roasted toppings are easier on pores than fried sides." },
      ],
      brightening: [
        { key: "brightening-a", menu: "bell pepper salad", tip: "Vitamin C rich vegetables support tone recovery." },
        { key: "brightening-b", menu: "one kiwi", tip: "An antioxidant fruit side helps with dullness care." },
      ],
      firmness: [
        { key: "firmness-a", menu: "black bean side", tip: "Protein and polyphenols support firmness care." },
        { key: "firmness-b", menu: "sesame greens", tip: "Mineral-rich greens help texture recovery." },
      ],
      recovery: [
        { key: "recovery-a", menu: "pumpkin salad", tip: "Beta-carotene rich sides can help on tired-eye days." },
        { key: "recovery-b", menu: "an extra boiled egg", tip: "A little more lunch protein helps afternoon recovery." },
      ],
      default: [
        { key: "default-a", menu: "seasonal fruit", tip: "A more colorful plate usually supports better skin nutrition." },
        { key: "default-b", menu: "mixed greens", tip: "Shift part of the meal from processed foods to vegetables." },
      ],
    },
    dinner: {
      hydration: [
        { key: "hydration-a", menu: "perilla mushroom soup", tip: "Pair fluid intake with healthy fats at dinner for barrier support." },
        { key: "hydration-b", menu: "sliced avocado", tip: "A little extra healthy fat helps on dry-skin evenings." },
      ],
      calming: [
        { key: "calming-a", menu: "steamed zucchini", tip: "Choose soft, mild sides over spicy late-night foods." },
        { key: "calming-b", menu: "extra grilled tofu", tip: "A bland protein side is safer for redness-prone skin." },
      ],
      trouble: [
        { key: "trouble-a", menu: "lentil side", tip: "Swap greasy late carbs for legumes to lower breakout load." },
        { key: "trouble-b", menu: "roasted eggplant", tip: "More vegetables at dinner reduce overnight oil burden." },
      ],
      brightening: [
        { key: "brightening-a", menu: "tomato salad", tip: "Antioxidant foods at dinner help with tone and spot care." },
        { key: "brightening-b", menu: "half an orange", tip: "A small vitamin C side can support next-day brightness." },
      ],
      firmness: [
        { key: "firmness-a", menu: "black sesame tofu", tip: "Protein and minerals support elasticity and texture." },
        { key: "firmness-b", menu: "seaweed side", tip: "Mineral-rich sea vegetables help recovery overnight." },
      ],
      recovery: [
        { key: "recovery-a", menu: "steamed broccoli", tip: "Antioxidant vegetables can help when fatigue shows up under the eyes." },
        { key: "recovery-b", menu: "warm burdock tea", tip: "Finish dinner with a low-stimulus drink instead of caffeine." },
      ],
      default: [
        { key: "default-a", menu: "two vegetable sides", tip: "Keep dinner lighter with more vegetables than refined carbs." },
        { key: "default-b", menu: "clear soup", tip: "A lighter dinner often leads to better skin the next morning." },
      ],
    },
  },
  ja: {
    lunch: {
      hydration: [
        { key: "hydration-a", menu: "きゅうりのスープ", tip: "水分が低い日は水分の多い副菜を追加してください。" },
        { key: "hydration-b", menu: "豆乳1杯", tip: "昼に水分とたんぱく質を足すと乾燥対策に役立ちます。" },
      ],
      calming: [
        { key: "calming-a", menu: "蒸しキャベツ", tip: "赤みがある日は辛い副菜よりやさしい野菜が向いています。" },
        { key: "calming-b", menu: "無糖の麦茶", tip: "刺激の少ない構成が敏感肌の安定に有利です。" },
      ],
      trouble: [
        { key: "trouble-a", menu: "ひよこ豆サラダ", tip: "食物繊維とたんぱく質を足すと皮脂の急上昇を抑えやすいです。" },
        { key: "trouble-b", menu: "ローストきのこ", tip: "揚げ物より焼きトッピングの方が毛穴負担が軽くなります。" },
      ],
      brightening: [
        { key: "brightening-a", menu: "パプリカサラダ", tip: "ビタミンC豊富な副菜がくすみケアを支えます。" },
        { key: "brightening-b", menu: "キウイ1個", tip: "抗酸化フルーツを足すと肌トーン管理に役立ちます。" },
      ],
      firmness: [
        { key: "firmness-a", menu: "黒豆の副菜", tip: "たんぱく質とポリフェノールがハリケアを助けます。" },
        { key: "firmness-b", menu: "ごま和え", tip: "ミネラル豊富な副菜がキメの回復を支えます。" },
      ],
      recovery: [
        { key: "recovery-a", menu: "かぼちゃサラダ", tip: "目元疲れがある日はβカロテン食品を足してください。" },
        { key: "recovery-b", menu: "ゆで卵追加", tip: "昼のたんぱく質補強が午後の回復に役立ちます。" },
      ],
      default: [
        { key: "default-a", menu: "旬の果物", tip: "色の多い食事の方が肌には有利です。" },
        { key: "default-b", menu: "青菜の副菜", tip: "加工食品より野菜の割合を少し増やしてみてください。" },
      ],
    },
    dinner: {
      hydration: [
        { key: "hydration-a", menu: "えごまきのこスープ", tip: "夜は水分と良質な脂質を一緒に補うのが有利です。" },
        { key: "hydration-b", menu: "アボカドスライス", tip: "乾燥する夜は良質な脂質を少し足してください。" },
      ],
      calming: [
        { key: "calming-a", menu: "蒸しズッキーニ", tip: "刺激の強い夜食よりやさしい野菜を選んでください。" },
        { key: "calming-b", menu: "豆腐焼き追加", tip: "赤みがある日は淡白なたんぱく質が無難です。" },
      ],
      trouble: [
        { key: "trouble-a", menu: "レンズ豆の副菜", tip: "脂っこい夜食より豆類で満足感を作る方が安全です。" },
        { key: "trouble-b", menu: "焼きナス", tip: "野菜の比率を増やすと夜間の皮脂負担を抑えやすいです。" },
      ],
      brightening: [
        { key: "brightening-a", menu: "トマトサラダ", tip: "夜の抗酸化食材がくすみや色素悩みの管理を助けます。" },
        { key: "brightening-b", menu: "オレンジ半分", tip: "少量のビタミンCが翌朝の明るさ維持に役立ちます。" },
      ],
      firmness: [
        { key: "firmness-a", menu: "黒ごま豆腐", tip: "たんぱく質とミネラルが弾力とキメを支えます。" },
        { key: "firmness-b", menu: "海藻の副菜", tip: "ミネラル豊富な海藻が夜の回復を助けます。" },
      ],
      recovery: [
        { key: "recovery-a", menu: "蒸しブロッコリー", tip: "疲れが出る日は抗酸化野菜を夜に追加してください。" },
        { key: "recovery-b", menu: "温かいごぼう茶", tip: "カフェインより穏やかな飲み物で締める方が良いです。" },
      ],
      default: [
        { key: "default-a", menu: "野菜の副菜2つ", tip: "夕食は炭水化物より野菜とたんぱく質を少し増やしてください。" },
        { key: "default-b", menu: "澄まし汁", tip: "軽めの夕食の方が翌朝の肌コンディションに有利です。" },
      ],
    },
  },
};

function getCareSettings(record = {}) {
  const source = record?.careSettings || {};
  // careSettings 자체가 없는 레거시 구독은 enabled=true로 취급 (기존 구독자 알림 유지)
  const hasExplicitSettings = record?.careSettings != null;
  return {
    enabled: hasExplicitSettings ? Boolean(source.enabled) : true,
    scan: source.scan !== false,
    meal: source.meal !== false,
    hydration: source.hydration !== false,
    routine: source.routine !== false,
    uvCare: source.uvCare !== false,
    bedtime: source.bedtime !== false,
    weatherCare: source.weatherCare !== false,
  };
}

function hashString(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getPrimaryFocus(scoreSummary) {
  if (!Array.isArray(scoreSummary) || scoreSummary.length === 0) return "default";

  const sorted = [...scoreSummary]
    .map(item => ({ label: item?.label, score: Number(item?.score) }))
    .filter(item => item.label && Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score);

  for (const item of sorted) {
    const focus = SCORE_FOCUS_MAP[item.label];
    if (focus) return focus;
  }
  return "default";
}

function pickVariant(items, seed, previousKey) {
  if (!Array.isArray(items) || items.length === 0) return null;
  let index = hashString(seed) % items.length;
  if (items.length > 1 && previousKey && items[index]?.key === previousKey) {
    index = (index + 1) % items.length;
  }
  return items[index];
}

function getMealTip({ baumannType, lang, meal, scoreSummary, subscriberId, mealHistory }) {
  const langData = MEAL_TIPS[lang] || MEAL_TIPS.ko;
  const mealData = langData[meal];
  const history = mealHistory?.[meal] || null;
  const focus = getPrimaryFocus(scoreSummary);
  const addonData = ((MEAL_VARIETY[lang] || MEAL_VARIETY.ko)[meal] || {});

  // 바우만 4글자 전체 매칭 (우선순위: O/D → S/R → P/N → W/T)
  // 배열 형태 지원: 매칭된 타입의 메뉴를 모두 모아서 로테이션
  const priority = ["O", "D", "S", "R", "P", "N", "W", "T"];
  const matched = priority.filter(l => baumannType?.includes(l) && mealData[l]);
  const baseOptions = [];
  if (matched.length > 0) {
    for (const key of matched) {
      const items = Array.isArray(mealData[key]) ? mealData[key] : [mealData[key]];
      items.forEach((item, i) => baseOptions.push({ key: `${key}_${i}`, ...item }));
    }
  } else {
    const defaults = Array.isArray(mealData.default) ? mealData.default : [mealData.default];
    defaults.forEach((item, i) => baseOptions.push({ key: `default_${i}`, ...item }));
  }
  const dateSeed = new Date().toISOString().slice(0, 10);
  const base = pickVariant(baseOptions, `${subscriberId}:${meal}:base:${focus}:${dateSeed}`, history?.baseKey) || baseOptions[0];
  const addonOptions = addonData[focus] || addonData.default || [];
  const addon = pickVariant(addonOptions, `${subscriberId}:${meal}:addon:${focus}:${dateSeed}`, history?.addonKey);
  const secondaryTips = matched
    .filter(key => key !== base.key.split("_")[0])
    .slice(0, 1)
    .map(key => { const items = Array.isArray(mealData[key]) ? mealData[key] : [mealData[key]]; return items[0]?.tip; });
  const tipParts = [base.tip, addon?.tip, ...secondaryTips].filter(Boolean);

  return {
    menu: addon ? `${base.menu} + ${addon.menu}` : base.menu,
    tip: tipParts.join(" "),
    baseKey: base.key,
    addonKey: addon?.key || null,
    focus,
  };
}

// ─── VAPID 서명 (JWK 방식, Web Crypto API) ───────────────────────
async function signVapid(privateKeyB64u, audience, subject, publicKeyB64u) {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 43200, sub: subject };

  const encode = obj => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const toB64u = arr => btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  // VAPID 공개키(비압축 65바이트: 0x04 || x || y)에서 x, y 추출 → JWK로 import
  const pubBytes = b64u(publicKeyB64u);
  const key = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256",
    d: privateKeyB64u,
    x: toB64u(pubBytes.slice(1, 33)),
    y: toB64u(pubBytes.slice(33, 65)),
    key_ops: ["sign"],
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput)
  );
  const sigB64u = toB64u(new Uint8Array(sig));
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

  const jwt = await signVapid(VAPID_PRIVATE, audience, VAPID_SUB, VAPID_PUBLIC);

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

// ─── 루틴 리마인더 푸시 (KST 20/21/22시, 사용자 설정 시간에만 발송) ─────
async function sendRoutineReminderToAll(env, kstHour) {
  const kv = env.PUSH_KV;
  if (!kv) { console.log("[push] PUSH_KV not bound"); return; }

  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  const titles = {
    ko: "📋 루틴 체크하셨나요?",
    en: "📋 Did you complete your routine?",
    ja: "📋 ルーティンはお済みですか？",
  };
  const bodies = {
    ko: "오늘 피부 루틴을 완료하고 피부 일기에 기록해보세요 ✨",
    en: "Complete your skin routine and log it in your diary ✨",
    ja: "今日のスキンルーティンを完了して肌日記に記録しましょう ✨",
  };

  for (const id of allIds) {
    try {
      // 이 구독자가 루틴 리마인더를 설정했는지 확인
      const reminderRaw = await kv.get(`push:reminder:${id}`);
      if (!reminderRaw) continue;

      const reminder = JSON.parse(reminderRaw);
      // 설정된 시간과 현재 KST 시간이 일치할 때만 발송
      if (reminder.hour !== kstHour) continue;

      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.routine) continue;
      const l = reminder.lang || lang || "ko";

      await sendPush(subscription, {
        title: titles[l] || titles.ko,
        body: bodies[l] || bodies.ko,
        url: "/?tab=diary",
      }, env);
    } catch (e) {
      console.error(`[push] routine reminder id=${id} error:`, e.message);
    }
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
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.scan) continue;
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

async function sendHydrationPushToAll(env) {
  const kv = env.PUSH_KV;
  if (!kv) { console.log("[push] PUSH_KV not bound"); return; }

  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  const titles = {
    ko: "💧 AI 밀착케어 수분 체크",
    en: "💧 AI Care Hydration Check",
    ja: "💧 AI密着ケア 水分チェック",
  };
  const bodies = {
    ko: "오후 피부 처짐을 막으려면 지금 물 한 컵과 가벼운 보습 리터치가 좋아요.",
    en: "A glass of water and a light moisture refresh can help your skin through the afternoon.",
    ja: "午後の乾燥だれを防ぐために、今は水1杯と軽い保湿リタッチがおすすめです。",
  };

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.hydration) continue;
      await sendPush(subscription, {
        title: titles[lang] || titles.ko,
        body: bodies[lang] || bodies.ko,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[push] hydration id=${id} error:`, e.message);
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
      const record = JSON.parse(raw);
      const { subscription, baumannType, lang, scoreSummary, mealHistory } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.meal) continue;
      const tip = getMealTip({ baumannType, lang, meal, scoreSummary, subscriberId: id, mealHistory });
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
      await kv.put(`push:sub:${id}`, JSON.stringify({
        ...record,
        mealHistory: {
          ...(mealHistory || {}),
          [meal]: {
            sentAt: new Date().toISOString(),
            baseKey: tip.baseKey,
            addonKey: tip.addonKey,
            focus: tip.focus,
          },
        },
      }));
    } catch (e) {
      console.error(`[push] id=${id} error:`, e.message);
    }
  }
}

// ─── 날씨 케어 푸시 (KST 08:00 — Open-Meteo Seoul 기반) ──────────
async function sendWeatherCarePushToAll(env) {
  const kv = env.PUSH_KV;
  if (!kv) return;
  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  // Open-Meteo Seoul 오늘 날씨 fetch (API키 불필요)
  let weatherCode = 0, tempMax = 20, tempMin = 10, precip = 0;
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum" +
      "&timezone=Asia/Seoul&forecast_days=1"
    );
    const data = await res.json();
    weatherCode = data.daily?.weather_code?.[0] ?? 0;
    tempMax = data.daily?.temperature_2m_max?.[0] ?? 20;
    tempMin = data.daily?.temperature_2m_min?.[0] ?? 10;
    precip = data.daily?.precipitation_sum?.[0] ?? 0;
  } catch (e) {
    console.error("[weather-care] fetch failed:", e.message);
  }

  // 날씨 코드별 피부 케어 팁
  function getWeatherTip(code, max, min, rain, lang) {
    const isCold = max < 10;
    const isHot = max > 28;
    const isRainy = code >= 51 && code <= 82 || rain > 1;
    const isClear = code <= 3;
    const isFoggy = code === 45 || code === 48;

    const tips = {
      ko: isCold
        ? { icon: "🥶", title: "한파 피부 케어", body: `오늘 최저 ${Math.round(min)}°C · 찬 바람에 장벽이 무너지기 쉬워요. 크림을 겹쳐 바르고 외출 전 선크림도 잊지 마세요.` }
        : isRainy
        ? { icon: "🌧", title: "비 오는 날 피부 케어", body: `오늘 강수 ${Math.round(rain)}mm · 습도가 높아 모공이 넓어지기 쉬워요. 가벼운 수분 세럼으로 정돈해 주세요.` }
        : isFoggy
        ? { icon: "🌫", title: "미세먼지·안개 주의", body: `오늘 안개/먼지 많음 · 외출 후 이중세안을 꼭 해주세요. 항산화 세럼으로 피부를 보호하세요.` }
        : isHot
        ? { icon: "🌡", title: "고온 피부 케어", body: `오늘 최고 ${Math.round(max)}°C · 피지 분비가 늘어요. 오일 프리 보습과 SPF50+ 선크림을 챙겨주세요.` }
        : isClear
        ? { icon: "☀️", title: "맑은 날 피부 루틴", body: `오늘 맑고 ${Math.round(min)}~${Math.round(max)}°C · 자외선이 강해요. 외출 2시간마다 선크림을 덧발라 주세요.` }
        : { icon: "🌤", title: "오늘 날씨 피부 케어", body: `오늘 ${Math.round(min)}~${Math.round(max)}°C · 수분 밸런스를 유지하고 보습 한 단계 더 챙겨보세요.` },
      en: isCold
        ? { icon: "🥶", title: "Cold Weather Skin Care", body: `Low ${Math.round(min)}°C today · Cold wind breaks down your barrier. Layer up your cream and don't skip sunscreen.` }
        : isRainy
        ? { icon: "🌧", title: "Rainy Day Skin Care", body: `${Math.round(rain)}mm today · High humidity can enlarge pores. Use a light hydrating serum to keep skin balanced.` }
        : isFoggy
        ? { icon: "🌫", title: "Fog & Dust Alert", body: `Foggy/dusty today · Double cleanse after going out and use an antioxidant serum for protection.` }
        : isHot
        ? { icon: "🌡", title: "Hot Weather Skin Care", body: `High ${Math.round(max)}°C today · Sebum production rises. Go for oil-free moisturizer and SPF50+ sunscreen.` }
        : isClear
        ? { icon: "☀️", title: "Sunny Day Skin Routine", body: `Clear skies, ${Math.round(min)}~${Math.round(max)}°C · UV is strong. Reapply sunscreen every 2 hours outdoors.` }
        : { icon: "🌤", title: "Today's Skin Care", body: `${Math.round(min)}~${Math.round(max)}°C today · Keep moisture balanced and add one extra hydration step.` },
      ja: isCold
        ? { icon: "🥶", title: "寒波時のスキンケア", body: `最低気温${Math.round(min)}°C · 冷たい風でバリアが崩れやすいです。クリームを重ねて日焼け止めもお忘れなく。` }
        : isRainy
        ? { icon: "🌧", title: "雨の日のスキンケア", body: `降水量${Math.round(rain)}mm · 湿度が高く毛穴が開きやすいです。軽い保湿セラムで整えてください。` }
        : isFoggy
        ? { icon: "🌫", title: "霧・ほこり注意", body: `霧・ほこりが多い日 · 外出後はダブルクレンジングを。抗酸化セラムで肌を守ってください。` }
        : isHot
        ? { icon: "🌡", title: "高温時のスキンケア", body: `最高${Math.round(max)}°C · 皮脂分泌が増えます。オイルフリー保湿とSPF50+日焼け止めを。` }
        : isClear
        ? { icon: "☀️", title: "晴れの日のルーティン", body: `晴れ、${Math.round(min)}~${Math.round(max)}°C · 紫外線が強め。外出中は2時間ごとに日焼け止めを塗り直してください。` }
        : { icon: "🌤", title: "今日のスキンケア", body: `${Math.round(min)}~${Math.round(max)}°C · 水分バランスを保ち、保湿をもう一手間加えてみてください。` },
    };
    return tips[lang] || tips.ko;
  }

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.weatherCare) continue;
      const tip = getWeatherTip(weatherCode, tempMax, tempMin, precip, lang || "ko");
      await sendPush(subscription, {
        title: `${tip.icon} ${tip.title}`,
        body: tip.body,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[weather-care] id=${id} error:`, e.message);
    }
  }
}

// ─── UV 케어 푸시 (KST 10:00 — Open-Meteo UV index) ─────────────
async function sendUVCarePushToAll(env) {
  const kv = env.PUSH_KV;
  if (!kv) return;
  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  // Open-Meteo Seoul 시간별 UV 지수
  let uvAt10 = 3;
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780" +
      "&hourly=uv_index&timezone=Asia/Seoul&forecast_days=1"
    );
    const data = await res.json();
    uvAt10 = data.hourly?.uv_index?.[10] ?? 3; // 10시 인덱스
  } catch (e) {
    console.error("[uv-care] fetch failed:", e.message);
  }

  // UV 2 이하면 발송 생략 (낮음)
  if (uvAt10 < 2) return;

  function getUVTip(uv, lang) {
    const level = uv >= 11 ? "extreme" : uv >= 8 ? "veryHigh" : uv >= 6 ? "high" : uv >= 3 ? "moderate" : "low";
    const tips = {
      ko: {
        moderate: { title: `☀️ UV ${Math.round(uv)} 보통`, body: "SPF30 이상 선크림을 바르고 자외선이 강한 11시~15시에는 그늘을 이용하세요." },
        high:     { title: `🌞 UV ${Math.round(uv)} 높음`, body: "SPF50+ 선크림 필수! 2시간마다 덧바르고 챙 넓은 모자를 챙기세요." },
        veryHigh: { title: `🔆 UV ${Math.round(uv)} 매우 높음`, body: "자외선이 매우 강해요. 장시간 외출을 자제하고 SPF50+ + PA+++ 이상을 사용하세요." },
        extreme:  { title: `⚠️ UV ${Math.round(uv)} 위험`, body: "자외선 위험 수준! 외출 시 물리적 차단제와 보호 의류를 반드시 착용하세요." },
      },
      en: {
        moderate: { title: `☀️ UV ${Math.round(uv)} Moderate`, body: "Apply SPF30+ sunscreen and seek shade between 11am–3pm." },
        high:     { title: `🌞 UV ${Math.round(uv)} High`, body: "SPF50+ is essential! Reapply every 2 hours and wear a wide-brim hat." },
        veryHigh: { title: `🔆 UV ${Math.round(uv)} Very High`, body: "UV is very strong. Limit time outdoors and use SPF50+ PA+++ or higher." },
        extreme:  { title: `⚠️ UV ${Math.round(uv)} Extreme`, body: "Dangerous UV level! Wear physical sunscreen and protective clothing outdoors." },
      },
      ja: {
        moderate: { title: `☀️ UV ${Math.round(uv)} 普通`, body: "SPF30以上の日焼け止めを塗り、11時~15時は日陰を活用しましょう。" },
        high:     { title: `🌞 UV ${Math.round(uv)} 高い`, body: "SPF50+必須！2時間おとに塗り直し、つばの広い帽子を忘れずに。" },
        veryHigh: { title: `🔆 UV ${Math.round(uv)} 非常に高い`, body: "UV非常に強いです。外出を控え、SPF50+ PA+++ 以上を使用してください。" },
        extreme:  { title: `⚠️ UV ${Math.round(uv)} 危険`, body: "危険なUVレベルです！外出時は物理的日焼け止めと保護衣類を必ず着用。" },
      },
    };
    return (tips[lang] || tips.ko)[level] || (tips[lang] || tips.ko).moderate;
  }

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.uvCare) continue;
      const tip = getUVTip(uvAt10, lang || "ko");
      await sendPush(subscription, {
        title: tip.title,
        body: tip.body,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[uv-care] id=${id} error:`, e.message);
    }
  }
}

// ─── 취침 케어 푸시 (KST 23:00) ──────────────────────────────────
async function sendBedtimeCarePushToAll(env) {
  const kv = env.PUSH_KV;
  if (!kv) return;
  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  const titles = {
    ko: "🌙 취침 전 피부 케어",
    en: "🌙 Bedtime Skin Care",
    ja: "🌙 就寝前スキンケア",
  };

  // 바우만 타입별 취침 케어 팁
  const bedtimeTips = {
    ko: {
      O: "모공 속 노폐물을 클렌징으로 깨끗이 씻어내고 가벼운 나이트 크림으로 마무리하세요.",
      D: "수분 크림을 듬뿍 바르고 슬리핑 팩으로 밀봉해 아침까지 촉촉하게 유지하세요.",
      S: "자극 없는 진정 앰플을 먼저 바른 후 세라마이드 크림으로 장벽을 강화하세요.",
      P: "비타민C 세럼이나 나이아신아마이드로 취침 중 색소 케어를 해보세요.",
      W: "레티놀 또는 펩타이드 크림으로 밤사이 콜라겐 합성을 도와보세요.",
      default: "클렌징 → 토너 → 에센스 → 크림 순서로 나이트 루틴을 완성하세요. 숙면도 최고의 피부 케어예요.",
    },
    en: {
      O: "Deep cleanse to clear pores, then finish with a light night cream.",
      D: "Apply rich moisturizer and seal with a sleeping pack for all-night hydration.",
      S: "Start with a soothing ampoule, then layer ceramide cream to rebuild your barrier.",
      P: "Use a vitamin C serum or niacinamide overnight to target pigmentation while you sleep.",
      W: "Apply retinol or peptide cream to support collagen synthesis overnight.",
      default: "Complete your night routine: cleanse → toner → essence → cream. Good sleep is the best skin care.",
    },
    ja: {
      O: "クレンジングで毛穴の汚れをしっかり落とし、軽いナイトクリームで仕上げてください。",
      D: "たっぷりの保湿クリームを塗り、スリーピングパックで朝まで水分を閉じ込めてください。",
      S: "低刺激の鎮静アンプルを先に塗り、セラミドクリームでバリアを強化してください。",
      P: "ビタミンCセラムやナイアシンアミドで就寝中に色素ケアをしてみてください。",
      W: "レチノールまたはペプチドクリームで夜間のコラーゲン合成をサポートしましょう。",
      default: "クレンジング→トナー→エッセンス→クリームの順にナイトルーティンを完成させてください。良質な睡眠も最高のスキンケアです。",
    },
  };

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, baumannType, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled || !care.bedtime) continue;
      const l = lang || "ko";
      const tips = bedtimeTips[l] || bedtimeTips.ko;
      // 바우만 4글자 중 첫 번째 매칭
      const priority = ["S", "D", "P", "W", "O"];
      const matched = priority.find(k => baumannType?.includes(k) && tips[k]);
      const body = matched ? tips[matched] : tips.default;
      await sendPush(subscription, {
        title: titles[l] || titles.ko,
        body,
        url: "/",
      }, env);
    } catch (e) {
      console.error(`[bedtime-care] id=${id} error:`, e.message);
    }
  }
}

// ─── 화장품 효과 리마인더 (KST 09:00) ─────────────────────────────
// 등록 3일/7일/14일 차 화장품에 대해 효과 추적 알림 발송
async function sendCosmeticEffectReminders(env) {
  const kv = env.PUSH_KV;
  const db = env.FONDAY_DB;
  if (!kv || !db) { console.log("[cosmetic-remind] KV or DB not bound"); return; }

  const allIdsRaw = await kv.get("push:all_ids");
  if (!allIdsRaw) return;
  const allIds = JSON.parse(allIdsRaw);

  const today = new Date();
  const toDateStr = (d) => d.toISOString().slice(0, 10);
  const milestones = [3, 7, 14];
  const targetDates = milestones.map(days => {
    const d = new Date(today); d.setDate(d.getDate() - days);
    return { days, dateStr: toDateStr(d) };
  });

  for (const id of allIds) {
    try {
      const raw = await kv.get(`push:sub:${id}`);
      if (!raw) continue;
      const record = JSON.parse(raw);
      const { subscription, lang } = record;
      const care = getCareSettings(record);
      if (!care.enabled) continue;

      // 이 유저의 화장품 중 3/7/14일 전에 등록된 것 찾기
      // user_id는 subscription endpoint 기반 해시이므로 DB에서 직접 조회 어려움
      // → KV에 user_id가 저장되어 있는지 확인
      const userId = record.userId;
      if (!userId) continue;

      const cosmetics = await db
        .prepare("SELECT id, name, category, opened_at, created_at FROM cosmetics WHERE user_id = ? AND status = 'active'")
        .bind(userId)
        .all();
      const items = cosmetics.results || [];
      if (items.length === 0) continue;

      // 스캔 데이터 조회 (최근 20개)
      let scans = [];
      try {
        const scansKvRaw = await kv.get(`scans:${userId}`);
        if (scansKvRaw) scans = JSON.parse(scansKvRaw);
      } catch {}

      for (const item of items) {
        const startDate = (item.opened_at || item.created_at || "").slice(0, 10);
        if (!startDate) continue;

        const matched = targetDates.find(t => t.dateStr === startDate);
        if (!matched) continue;

        // 효과 계산: 등록 전후 스캔 점수 비교
        const startTs = new Date(startDate).getTime();
        const beforeScans = scans.filter(s => new Date(s.createdAt).getTime() < startTs).slice(0, 3);
        const afterScans = scans.filter(s => new Date(s.createdAt).getTime() >= startTs).slice(0, 5);

        const beforeAvg = beforeScans.length > 0
          ? Math.round(beforeScans.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / beforeScans.length)
          : null;
        const afterAvg = afterScans.length > 0
          ? Math.round(afterScans.reduce((sum, s) => sum + (Number(s.overallScore) || 0), 0) / afterScans.length)
          : null;
        const delta = beforeAvg != null && afterAvg != null ? afterAvg - beforeAvg : null;

        const productName = item.name || item.category;
        let title, body;

        if (lang === "en") {
          title = `✨ ${productName} — Day ${matched.days}`;
          if (matched.days === 3) {
            body = delta != null
              ? `3 days in! Your score shifted by ${delta >= 0 ? "+" : ""}${delta} since starting. Keep scanning daily for better tracking.`
              : `3 days in! Keep scanning daily to track the effect of ${productName}.`;
          } else if (matched.days === 7) {
            body = delta != null
              ? `1 week with ${productName}! Overall score ${delta >= 0 ? "+" : ""}${delta}. ${delta >= 3 ? "Looking good! 🎉" : delta <= -3 ? "Might want to check this." : "Steady so far."}`
              : `1 week with ${productName}! Scan today to see your 7-day effect report.`;
          } else {
            body = delta != null
              ? `2-week report for ${productName}: score ${delta >= 0 ? "+" : ""}${delta}. ${delta >= 5 ? "This product seems to work for you! 🌟" : delta <= -5 ? "Consider reviewing this product." : "Check the full report in the Routine tab."}`
              : `2 weeks with ${productName}! Check your effect report in the Routine tab.`;
          }
        } else if (lang === "ja") {
          title = `✨ ${productName} — ${matched.days}日目`;
          if (matched.days === 3) {
            body = delta != null
              ? `3日経過！スコアが${delta >= 0 ? "+" : ""}${delta}変化しました。毎日スキャンして効果を追跡しましょう。`
              : `3日経過！毎日スキャンして${productName}の効果を追跡しましょう。`;
          } else if (matched.days === 7) {
            body = delta != null
              ? `${productName}を1週間使用！総合スコア${delta >= 0 ? "+" : ""}${delta}。${delta >= 3 ? "良い感じです！🎉" : delta <= -3 ? "確認した方が良いかもしれません。" : "安定しています。"}`
              : `${productName}を1週間使用！今日スキャンして7日間の効果を確認しましょう。`;
          } else {
            body = delta != null
              ? `${productName}の2週間レポート：スコア${delta >= 0 ? "+" : ""}${delta}。${delta >= 5 ? "この製品はあなたに合っているようです！🌟" : delta <= -5 ? "この製品を見直してみてください。" : "ルーティンタブで詳細レポートを確認してください。"}`
              : `${productName}を2週間使用！ルーティンタブで効果レポートを確認しましょう。`;
          }
        } else {
          title = `✨ ${productName} — ${matched.days}일차`;
          if (matched.days === 3) {
            body = delta != null
              ? `3일째! 사용 시작 후 점수가 ${delta >= 0 ? "+" : ""}${delta}점 변화했어요. 매일 스캔하면 더 정확한 효과를 확인할 수 있어요.`
              : `3일째! 매일 스캔하면 ${productName}의 효과를 추적할 수 있어요.`;
          } else if (matched.days === 7) {
            body = delta != null
              ? `${productName} 1주일! 종합 점수 ${delta >= 0 ? "+" : ""}${delta}점. ${delta >= 3 ? "좋은 흐름이에요! 🎉" : delta <= -3 ? "한번 확인해보세요." : "안정적이에요."}`
              : `${productName} 1주일! 오늘 스캔하면 7일 효과 리포트를 볼 수 있어요.`;
          } else {
            body = delta != null
              ? `${productName} 2주 리포트: 점수 ${delta >= 0 ? "+" : ""}${delta}점. ${delta >= 5 ? "이 제품 잘 맞는 것 같아요! 🌟" : delta <= -5 ? "이 제품을 재검토해보세요." : "루틴 탭에서 자세한 리포트를 확인하세요."}`
              : `${productName} 2주차! 루틴 탭에서 효과 리포트를 확인하세요.`;
          }
        }

        await sendPush(subscription, { title, body, url: "/" }, env);
        console.log(`[cosmetic-remind] ${id} ${productName} day ${matched.days} sent`);
      }
    } catch (e) {
      console.error(`[cosmetic-remind] id=${id} error:`, e.message);
    }
  }
}
