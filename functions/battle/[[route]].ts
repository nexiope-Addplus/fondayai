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

  let ogTitle = "Fonday AI - 피부 분석 대결!";
  let ogDescription = "내 피부 점수를 확인하고 친구와 대결해보세요.";
  let ogImage = "https://fonday.ai/og-default.png"; // Fallback image

  try {
    if (env.SCANS_KV && token) {
      // Fetch the shared scan from KV
      const raw = await env.SCANS_KV.get(`share:${token}`);
      if (raw) {
        const scan = JSON.parse(raw);
        
        // Extract data for the image
        const baumann = scan.baumannType || "Unknown";
        const score = scan.overallScore || "?";

        // Generate dynamic OG image showing the user's Baumann type vs ?
        // Using placehold.co for a quick, dynamic, impact-driven banner.
        // You can replace this with your own dynamic image generation service later if needed.
        const encodedText = encodeURIComponent(`${baumann} vs ?`);
        ogImage = `https://placehold.co/1200x630/1e1e2f/ffffff.png?text=${encodedText}&font=Montserrat`;

        ogTitle = `[Fonday 피부 대결] 내 타입은 ${baumann}(${score}점)! 당신은?`;
        ogDescription = "상대방의 점수와 비교해서 누가 피부 미인인지 겨뤄보세요!";
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
