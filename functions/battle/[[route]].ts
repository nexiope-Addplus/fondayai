// functions/battle/[token].ts
// This file catches requests to /battle/:token
// It fetches the shared scan data and injects dynamic OG meta tags into the React app's index.html

export const onRequest = async (context: any) => {
  const { request, env, params, next } = context;
  const token = params.token;

  // Let the asset fetcher (next) get the static index.html or other assets
  const response = await next();

  // We only want to rewrite HTML responses (prevent rewriting JS/CSS)
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    return response;
  }

  let ogTitle = "Fonday° 피부 챌린지";
  let ogDescription = "셀카 한 장으로 피부 MBTI 진단! 30초면 끝.";
  let ogImage = "https://fondayai.com/og-image-v3.png";

  try {
    if (env.SCANS_KV && token) {
      const raw = await env.SCANS_KV.get(`share:${token}`);
      if (raw) {
        const scan = JSON.parse(raw);
        const baumann = scan.baumannType || "????";
        const score = scan.overallScore || "?";
        const skinAge = scan.skinAge || "";
        const lang = scan.lang || "ko";

        // 바우만 타입별 컬러
        const typeColors: Record<string, string> = {
          O: "F59E0B", D: "3B82F6", S: "EF4444", R: "10B981",
          P: "8B5CF6", N: "06B6D4", W: "6366F1", T: "14B8A6",
        };
        const firstColor = typeColors[baumann[0]] || "C97062";

        // 동적 OG 이미지 — SVG 기반 텍스트 (placehold.co 대체)
        const text = encodeURIComponent(`${baumann}  ${score}점`);
        const subText = encodeURIComponent("vs  ???");
        ogImage = `https://placehold.co/1200x630/${firstColor}/ffffff.png?text=${text}%0A${subText}&font=Montserrat`;

        if (lang === "ja") {
          ogTitle = `[Fonday° チャレンジ] ${baumann}タイプ ${score}点！あなたは？`;
          ogDescription = `肌年齢${skinAge ? skinAge + "歳" : "??歳"}の${baumann}タイプに勝てる？30秒でチェック！`;
        } else if (lang === "en") {
          ogTitle = `[Fonday° Challenge] I'm ${baumann}, ${score}pts! Beat me?`;
          ogDescription = `Skin age ${skinAge || "??"} · ${baumann} type. Can you beat this score? 30-sec scan!`;
        } else {
          ogTitle = `[Fonday° 챌린지] 나는 ${baumann} ${score}점! 너는?`;
          ogDescription = `피부나이 ${skinAge ? skinAge + "세" : "??세"} · ${baumann} 타입. 이길 수 있어? 30초 스캔!`;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching KV for OG tag generation:", err);
  }

  // Create an HTMLRewriter instance to inject tags into the <head>
  const rewriter = new HTMLRewriter()
    .on("head", {
      element(element: any) {
        // Inject Open Graph tags for rich previews
        element.append(`<meta property="og:title" content="${ogTitle}" />`, { html: true });
        element.append(`<meta property="og:description" content="${ogDescription}" />`, { html: true });
        element.append(`<meta property="og:image" content="${ogImage}" />`, { html: true });
        
        // Twitter Card tags
        element.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        element.append(`<meta name="twitter:title" content="${ogTitle}" />`, { html: true });
        element.append(`<meta name="twitter:description" content="${ogDescription}" />`, { html: true });
        element.append(`<meta name="twitter:image" content="${ogImage}" />`, { html: true });
      }
    });

  // Return the transformed response
  return rewriter.transform(response);
};
