/**
 * 모닝 뉴스레터 카드 자동 생성 — Cloudflare Worker용
 *
 * Satori (JSX→SVG) + resvg-wasm (SVG→PNG) 로 서버리스 이미지 생성
 * 크론 트리거: UTC 21:30 (KST 06:30) — 07:00 게시 전 생성
 *
 * 워크플로우:
 * 1. OpenMeteo → 서울/도쿄 날씨
 * 2. 날씨 → 스킨케어 팁 생성
 * 3. Satori → SVG → PNG (1080×1080)
 * 4. R2 업로드 + D1 등록 (status='scheduled', time='07:00')
 */

// Polyfill: css-to-react-native이 process.env.NODE_ENV를 참조함
if (typeof globalThis.process === "undefined") {
  globalThis.process = { env: { NODE_ENV: "production" } };
}

const SIZE = 1080;
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

// Google Fonts CDN에서 폰트 파일 fetch (캐시됨)
const FONT_URLS = {
  ko: {
    regular: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.woff",
    bold: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.woff",
    extraBold: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-900-normal.woff",
  },
  ja: {
    regular: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.woff",
    bold: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-700-normal.woff",
    extraBold: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-900-normal.woff",
  },
};

async function loadFonts(lang) {
  const urls = FONT_URLS[lang];
  const [regular, bold, extraBold] = await Promise.all([
    fetch(urls.regular).then(r => r.arrayBuffer()),
    fetch(urls.bold).then(r => r.arrayBuffer()),
    fetch(urls.extraBold).then(r => r.arrayBuffer()),
  ]);
  return [
    { name: "Noto Sans", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans", data: bold, weight: 700, style: "normal" },
    { name: "Noto Sans", data: extraBold, weight: 900, style: "normal" },
  ];
}

// ── 날씨 API ────────────────────────────────────────────────────

async function getWeather(lat, lon, date) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,uv_index_max,precipitation_sum&timezone=Asia/Seoul&start_date=${date}&end_date=${date}`;
  const res = await fetch(url);
  const data = await res.json();
  const d = data.daily;
  return {
    temp_min: Math.round(d.temperature_2m_min[0]),
    temp_max: Math.round(d.temperature_2m_max[0]),
    humidity: Math.round(d.relative_humidity_2m_mean?.[0] ?? 50),
    uv_index: Math.round(d.uv_index_max[0]),
    precipitation: d.precipitation_sum[0],
  };
}

// ── 날씨 → 스킨케어 팁 ──────────────────────────────────────────

function generateTips(w, lang) {
  const points = [];
  let headline = "";
  let routine = "";
  const tempDiff = w.temp_max - w.temp_min;

  if (lang === "ko") {
    if (tempDiff >= 10) points.push(`일교차 ${tempDiff}° — 피부 장벽 약해지기 쉬움, 세라마이드 보습 강화`);
    else if (tempDiff >= 7) points.push(`일교차 ${tempDiff}° — 아침저녁 보습 신경쓰기`);

    if (w.uv_index >= 8) { points.push(`UV ${w.uv_index} (매우 높음) — SPF50+ 필수, 2시간마다 덧바르기`); headline = "자외선 주의보, 선크림 꼼꼼히"; }
    else if (w.uv_index >= 6) { points.push(`UV ${w.uv_index} (높음) — SPF50 선크림 필수`); headline = "자외선 높은 날, 선크림 잊지 마세요"; }
    else if (w.uv_index >= 3) points.push(`UV ${w.uv_index} (보통) — 선크림 기본 도포`);
    else points.push(`UV ${w.uv_index} (낮음) — 기본 선크림이면 충분`);

    if (w.humidity < 40) { points.push(`습도 ${w.humidity}% (건조) — 미스트 수시 분사, 보습 레이어링`); if (!headline) headline = "건조한 날, 수분 채우기"; }
    else if (w.humidity > 70) { points.push(`습도 ${w.humidity}% (높음) — 가벼운 수분 제품 위주`); if (!headline) headline = "습한 날, 가볍게 케어하기"; }
    else points.push(`습도 ${w.humidity}% — 적당한 날씨, 기본 루틴 유지`);

    if (w.precipitation > 5) points.push("비 예보 — 우산 챙기고, 저녁 클렌징 꼼꼼히");
    if (w.temp_max >= 25) points.push(`최고 ${w.temp_max}° — 피지 분비 증가, 클렌징 신경쓰기`);
    else if (w.temp_max <= 10) points.push(`최고 ${w.temp_max}° — 찬 바람에 장벽 손상 주의, 크림 두껍게`);
    if (points.length < 4) points.push("세안 후 3분 안에 보습 — 수분 증발 전에 잡아주기");
    if (!headline) headline = "오늘의 피부 관리 포인트";

    if (w.uv_index >= 6 && w.humidity < 40) routine = "순한 세안 > 히알루론산 세럼 > 세라마이드 크림 > SPF50 선크림";
    else if (w.uv_index >= 6) routine = "세안 > 토너 > 가벼운 보습 > SPF50 선크림";
    else if (w.humidity < 40) routine = "순한 세안 > 토너 패딩 > 보습 세럼 > 크림 > 선크림";
    else routine = "세안 > 토너 > 보습 > 선크림";
  } else {
    // 일본어
    if (tempDiff >= 10) points.push(`寒暖差${tempDiff}° — 肌バリアが揺らぐ時期、セラミドで強化`);
    else if (tempDiff >= 7) points.push(`寒暖差${tempDiff}° — 朝晩の保湿をしっかりと`);

    if (w.uv_index >= 8) { points.push(`UV ${w.uv_index}（非常に高い）— SPF50+必須、2時間ごとに塗り直しを`); headline = "紫外線注意報！\nUVケアをしっかり"; }
    else if (w.uv_index >= 6) { points.push(`UV ${w.uv_index}（高い）— SPF50の日焼け止め必須`); headline = "紫外線が強い日、\nUVケアを忘れずに"; }
    else if (w.uv_index >= 3) points.push(`UV ${w.uv_index}（普通）— 基本の日焼け止めを`);
    else points.push(`UV ${w.uv_index}（低い）— 基本の日焼け止めでOK`);

    if (w.humidity < 40) { points.push(`湿度${w.humidity}%（乾燥）— ミストをこまめに、重ね保湿を`); if (!headline) headline = "乾燥した日、うるおいチャージ"; }
    else if (w.humidity > 70) { points.push(`湿度${w.humidity}%（高い）— さっぱりタイプの保湿を`); if (!headline) headline = "湿度の高い日、軽めケアで"; }
    else points.push(`湿度${w.humidity}% — 肌にちょうどいい日、基本ケアでOK`);

    if (w.precipitation > 5) points.push("雨の日も紫外線あり、夜のクレンジングは丁寧に");
    if (w.temp_max >= 25) points.push(`最高${w.temp_max}° — 皮脂が出やすい日、クレンジングは丁寧に`);
    else if (w.temp_max <= 10) points.push(`最高${w.temp_max}° — 冷たい風で肌が揺らぎやすい、クリーム厚めに`);
    if (points.length < 4) points.push("洗顔後3分以内に保湿 — 水分が逃げる前にフタを");
    if (!headline) headline = "今日のスキンケアポイント";

    if (w.uv_index >= 6 && w.humidity < 40) routine = "優しい洗顔 > ヒアルロン酸セラム > セラミドクリーム > SPF50日焼け止め";
    else if (w.uv_index >= 6) routine = "洗顔 > 化粧水 > 軽めの乳液 > SPF50日焼け止め";
    else if (w.humidity < 40) routine = "優しい洗顔 > 化粧水 > 保湿セラム > クリーム > 日焼け止め";
    else routine = "洗顔 > 化粧水 > 保湿 > 日焼け止め";
  }

  return { headline, points: points.slice(0, 4), routine };
}

// ── 캡션 생성 ────────────────────────────────────────────────────

function buildCaption(date, weather, tips, lang) {
  const icon = weather.uv_index >= 6 ? "☀️" : weather.precipitation > 5 ? "🌧️" : "🌤️";
  if (lang === "ko") {
    return `오늘의 피부 날씨 · 서울 기준\n${date}\n\n${icon} ${weather.temp_min}° → ${weather.temp_max}° | 습도 ${weather.humidity}% | UV ${weather.uv_index}\n\n${tips.points.join("\n")}\n\n오늘의 루틴: ${tips.routine}\n\n내 피부 타입에 맞는 루틴이 궁금하다면\n프로필 링크에서 무료 AI 피부 분석 받아보세요.\n\n#오늘의스킨케어 #데일리스킨케어 #피부관리 #스킨케어루틴 #AI피부분석`;
  }
  return `今日の肌天気 · 東京基準\n${date}\n\n${icon} ${weather.temp_min}° → ${weather.temp_max}° | 湿度 ${weather.humidity}% | UV ${weather.uv_index}\n\n${tips.points.join("\n")}\n\n今日のルーティン: ${tips.routine}\n\n無料AI肌診断はプロフィールリンクから✨\n\n#スキンケア #デイリースキンケア #肌ケア #美肌 #AI肌診断`;
}

// ── 메인 함수 ────────────────────────────────────────────────────

export async function generateMorningNewsletter(env, overrideDate) {
  // KST 오늘 날짜 (또는 테스트용 강제 날짜)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = overrideDate || kst.toISOString().split("T")[0];

  console.log(`[newsletter] ${dateStr} 모닝 뉴스레터 생성 시작`);

  // 이미 오늘 07:00 매거진이 있으면 스킵
  const existingKo = await env.FONDAY_DB.prepare(
    "SELECT COUNT(*) as count FROM insta_content WHERE scheduled_date = ? AND scheduled_time = '07:00' AND pillar = 'newsletter'"
  ).bind(dateStr).first();
  if (existingKo?.count > 0) {
    console.log(`[newsletter] ${dateStr} 이미 생성됨, 스킵`);
    return;
  }

  try {
    // @cf-wasm/satori + @cf-wasm/resvg (CF Workers 전용, WASM 자동 처리)
    const { satori } = await import("@cf-wasm/satori");
    const { Resvg } = await import("@cf-wasm/resvg/workerd");
    await generateForLang(satori, Resvg, env, dateStr, "ko", 37.5665, 126.978);
    console.log(`[newsletter] ${dateStr} KO 완료`);
  } catch (err) {
    console.error(`[newsletter] ${dateStr} 에러:`, err);
  }
}

// ── 일본 매거진 별도 생성 (CPU 제한 분리) ────────────────────────
export async function generateMorningNewsletterJA(env, overrideDate) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = overrideDate || kst.toISOString().split("T")[0];

  console.log(`[newsletter-ja-cron] ${dateStr} 일본 뉴스레터 생성 시작`);

  const existingJa = await env.FONDAY_DB.prepare(
    "SELECT COUNT(*) as count FROM insta_content_ja WHERE scheduled_date = ? AND scheduled_time = '07:00' AND pillar = 'newsletter'"
  ).bind(dateStr).first();
  if (existingJa?.count > 0) {
    console.log(`[newsletter-ja-cron] ${dateStr} 이미 생성됨, 스킵`);
    return;
  }

  try {
    const { satori } = await import("@cf-wasm/satori");
    const { Resvg } = await import("@cf-wasm/resvg/workerd");
    await generateForLang(satori, Resvg, env, dateStr, "ja", 35.6762, 139.6503);
    console.log(`[newsletter-ja-cron] ${dateStr} JA 완료`);
  } catch (err) {
    console.error(`[newsletter-ja-cron] ${dateStr} 에러:`, err);
  }
}

// ── 날씨 조건 판별 ──────────────────────────────────────────────
function getWeatherCondition(w) {
  if (w.precipitation > 1) return "rainy";
  if (w.uv_index >= 6) return "uv-high";
  if (w.humidity < 40) return "sunny-dry";
  if (w.humidity > 70) return "sunny-humid";
  return "cloudy";
}

// ── R2에서 bg 이미지를 base64 data URI로 로드 ──────────────────
async function loadBgFromR2(env, r2Key) {
  const obj = await env.INSTA_IMAGES.get(`magazine-pool/${r2Key}`);
  if (!obj) throw new Error(`R2 bg not found: magazine-pool/${r2Key}`);
  const buf = await obj.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

// ── R2에서 metadata.json 로드 ───────────────────────────────────
async function loadMetadata(env) {
  const obj = await env.INSTA_IMAGES.get("magazine-pool/metadata.json");
  if (!obj) return null;
  return obj.json();
}

// ── bg 이미지 위에 텍스트를 오버레이하는 JSX 빌더 ────────────────
function buildSlideJSX(bgDataUri, textContent, meta) {
  const align = meta?.textAlign || "center";
  const vertical = meta?.textVertical || "bottom";

  // 텍스트 정렬
  const justifyContent = vertical === "top" ? "flex-start" : vertical === "center" ? "center" : "flex-end";
  const alignItems = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const textAlign = align;

  // bg 이미지에 이미 좌우 50px 회색 여백 포함됨
  // 텍스트는 여백 안쪽에 배치 (padding 100px)
  return {
    type: "div",
    props: {
      style: {
        width: SIZE, height: SIZE, display: "flex", flexDirection: "column",
        justifyContent, alignItems,
        backgroundImage: `url(${bgDataUri})`, backgroundSize: "cover", backgroundPosition: "center",
        padding: "60px 100px",
      },
      children: [
        // 그라데이션 오버레이 (전체 캔버스)
        { type: "div", props: { style: {
          position: "absolute", top: 0, left: 0, width: SIZE, height: SIZE, display: "flex",
          background: vertical === "bottom"
            ? "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)"
            : vertical === "top"
            ? "linear-gradient(to top, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)",
        }}},
        // 텍스트
        { type: "div", props: { style: {
          display: "flex", flexDirection: "column", width: "100%", textAlign,
        }, children: textContent }},
      ],
    },
  };
}

// ── 커버 슬라이드 (1장) ─────────────────────────────────────────
function buildCoverContent(dateStr, weather, tips, lang) {
  const d = new Date(dateStr + "T00:00:00+09:00");
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = lang === "ja" ? WEEKDAYS_JA[d.getDay()] : WEEKDAYS_KO[d.getDay()];

  const cityName = lang === "ja" ? "東京" : "서울";
  const humidityLabel = lang === "ja" ? "湿度" : "습도";
  const weatherLine = `${cityName} ${weather.temp_min}° / ${weather.temp_max}° | ${humidityLabel} ${weather.humidity}% | UV ${weather.uv_index}`;

  return [
    { type: "span", props: { style: { fontSize: "20px", fontWeight: 700, letterSpacing: "3px", color: "#FFFFFF", opacity: 0.8, marginBottom: "16px" }, children: "BEAUTY MAGAZINE" } },
    { type: "span", props: { style: { fontSize: lang === "ja" ? "56px" : "80px", fontWeight: 900, color: "#FFFFFF", lineHeight: "1.3", marginBottom: "20px" }, children: tips.headline } },
    { type: "span", props: { style: { fontSize: "30px", color: "#FFFFFF", opacity: 0.8, marginBottom: "12px" }, children: weatherLine } },
    { type: "div", props: { style: { display: "flex", justifyContent: "space-between", width: "100%", marginTop: "24px" }, children: [
      { type: "span", props: { style: { fontSize: "20px", fontWeight: 700, letterSpacing: "2px", color: "#FFFFFF", opacity: 0.5 }, children: "FONDAY" } },
      { type: "span", props: { style: { fontSize: "18px", color: "#FFFFFF", opacity: 0.5 }, children: "AI Skin Analysis" } },
    ]}},
  ];
}

// ── 포인트 슬라이드 (2장) ────────────────────────────────────────
function buildPointContent(tips, lang) {
  const pointSize = lang === "ja" ? "32px" : "40px";
  return [
    { type: "span", props: { style: { fontSize: "20px", fontWeight: 700, letterSpacing: "3px", color: "#FFFFFF", opacity: 0.7, marginBottom: "24px" }, children: lang === "ja" ? "ポイント" : "TODAY'S POINT" } },
    ...tips.points.slice(0, 3).map((point) => ({
      type: "div", props: { style: { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "24px" }, children: [
        { type: "div", props: { style: { width: "9px", height: "9px", borderRadius: "50%", background: "#E11D48", marginTop: "14px", flexShrink: 0, display: "flex" } } },
        { type: "span", props: { style: { fontSize: pointSize, color: "#FFFFFF", lineHeight: "1.5" }, children: point } },
      ]},
    })),
  ];
}

// ── 루틴 슬라이드 (3장) ─────────────────────────────────────────
function buildRoutineContent(tips, lang) {
  const routineSize = lang === "ja" ? "38px" : "46px";
  return [
    { type: "span", props: { style: { fontSize: "28px", fontWeight: 700, letterSpacing: "3px", color: "#E11D48", marginBottom: "20px" }, children: "TODAY'S ROUTINE" } },
    { type: "span", props: { style: { fontSize: routineSize, fontWeight: 700, color: "#FFFFFF", lineHeight: "1.5" }, children: tips.routine } },
  ];
}

async function generateForLang(satori, Resvg, env, dateStr, lang, lat, lon) {
  const prefix = `[newsletter-${lang}]`;

  // 1. 날씨
  const weather = await getWeather(lat, lon, dateStr);
  console.log(`${prefix} 날씨: ${weather.temp_min}→${weather.temp_max}° 습도${weather.humidity}% UV${weather.uv_index}`);

  // 2. 팁 생성
  const tips = generateTips(weather, lang);

  // 3. 날씨 조건 → bg 이미지 선택
  const condition = getWeatherCondition(weather);
  const langSuffix = lang === "ja" ? "-ja" : "";
  const dayNum = parseInt(dateStr.replace(/-/g, ""), 10);
  const pointIdx = String((dayNum % 10) + 1).padStart(2, "0");
  const routineIdx = String(((dayNum + 3) % 10) + 1).padStart(2, "0");

  console.log(`${prefix} 조건: ${condition}, 포인트: ${pointIdx}, 루틴: ${routineIdx}`);

  // 4. R2에서 bg 이미지 + 메타데이터 로드
  const coverBg = await loadBgFromR2(env, `cover/cover-${condition}${langSuffix}.jpg`);
  const pointBg = await loadBgFromR2(env, `point/point-${pointIdx}.jpg`);
  const routineBg = await loadBgFromR2(env, `routine/routine-${routineIdx}.jpg`);
  const metadata = await loadMetadata(env);

  // 5. 폰트 로드
  const fonts = await loadFonts(lang);

  // 6. 4장 렌더링 (커버 + 포인트 + 루틴 + CTA)
  const coverMeta = metadata?.cover?.[condition]?.[lang] || { textAlign: "left", textVertical: "bottom" };
  const pointMeta = metadata?.point?.[pointIdx] || { textAlign: "center", textVertical: "bottom" };
  const routineMeta = metadata?.routine?.[routineIdx] || { textAlign: "center", textVertical: "bottom" };

  const slides = [
    { name: "커버", jsx: buildSlideJSX(coverBg, buildCoverContent(dateStr, weather, tips, lang), coverMeta) },
    { name: "포인트", jsx: buildSlideJSX(pointBg, buildPointContent(tips, lang), pointMeta) },
    { name: "루틴", jsx: buildSlideJSX(routineBg, buildRoutineContent(tips, lang), routineMeta) },
  ];

  const imageUrls = [];
  const r2Prefix = `${dateStr}/0700${langSuffix}`;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    console.log(`${prefix} ${slide.name} 렌더링...`);
    const svg = await satori(slide.jsx, { width: SIZE, height: SIZE, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
    const pngBuffer = resvg.render().asPng();

    const r2Key = `${r2Prefix}/slide-${i + 1}.png`;
    await env.INSTA_IMAGES.put(r2Key, pngBuffer, { httpMetadata: { contentType: "image/png" } });
    imageUrls.push(`https://fonday-push-worker.nexiope.workers.dev/insta-images/${r2Key}`);
  }

  // CTA 슬라이드 (기존 이미지 참조)
  const ctaKey = lang === "ja" ? "cta/cta-magazine-ja.png" : "cta/cta-magazine.png";
  const ctaExists = await env.INSTA_IMAGES.head(`magazine-pool/${ctaKey}`);
  if (ctaExists) {
    imageUrls.push(`https://fonday-push-worker.nexiope.workers.dev/insta-images/magazine-pool/${ctaKey}`);
  }

  // 7. D1 등록 (캐러셀 형식)
  const table = lang === "ja" ? "insta_content_ja" : "insta_content";
  const caption = buildCaption(dateStr, weather, tips, lang);

  await env.FONDAY_DB.prepare(
    `INSERT INTO ${table} (pillar, format, hook, hook_sub, slides, caption, hashtags, cta, ingredient_focus, image_urls, image_prompts, status, scheduled_date, scheduled_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'scheduled', ?, ?)`
  ).bind(
    "newsletter",
    "carousel",
    tips.headline,
    "",
    "[]",
    caption,
    lang === "ko" ? '["#오늘의스킨케어","#데일리스킨케어","#피부관리","#스킨케어루틴","#AI피부분석"]' : '["#スキンケア","#デイリースキンケア","#肌ケア","#美肌","#AI肌診断"]',
    lang === "ko" ? "내 피부 타입 알아보기" : "肌タイプを調べる",
    lang === "ko" ? "날씨 기반 스킨케어" : "天気ベーススキンケア",
    JSON.stringify(imageUrls),
    dateStr,
    "07:00"
  ).run();

  console.log(`${prefix} D1 등록 완료 (${imageUrls.length}장 캐러셀)`);
  return "OK";
}
