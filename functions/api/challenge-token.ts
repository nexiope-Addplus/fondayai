const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method === "POST") {
    if (!env.SCANS_KV) {
      return new Response(JSON.stringify({ error: "Storage not configured" }), {
        status: 500,
        headers: CORS,
      });
    }

    try {
      const body = await request.json();
      const { overallScore, baumannType, scores, skinAge, aiComment, lang, isGuest, gender, ageGroup } = body;

      const shareToken = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const scanData = {
        overallScore,
        baumannType,
        scores,
        skinAge,
        aiComment,
        shareToken,
        createdAt,
      };

      // KV 저장 (챌린지/배틀 기능용, 30일 TTL)
      await env.SCANS_KV.put(`share:${shareToken}`, JSON.stringify(scanData), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

      // D1 저장 (게스트만 — 로그인 유저는 /api/scans에서 이미 저장)
      if (env.FONDAY_DB && isGuest !== false) {
        // Cloudflare 데이터 추출
        const cf = (request as any).cf || {};
        const city = cf.city || "";
        const country = cf.country || "";
        const region = cf.region || "";
        const timezone = cf.timezone || "";
        const ua = request.headers.get("user-agent") || "";
        const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
        const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "other";
        const browser = /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : /Edge/.test(ua) ? "Edge" : "other";
        const deviceInfo = JSON.stringify({ deviceType, os, browser, region, timezone });
        const referrer = body.referrer || "";

        // visitor_id: 비로그인 유저 식별 (IP 해시 — IP 자체는 미저장)
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const visitorRaw = `${ip}:${ua}`;
        const visitorHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(visitorRaw));
        const visitorId = "v_" + Array.from(new Uint8Array(visitorHash)).slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");

        // 새 컬럼 자동 추가
        for (const col of ["city", "country", "referrer", "provider", "device_info"]) {
          await env.FONDAY_DB.prepare(`SELECT ${col} FROM scans LIMIT 0`).all().catch(async () => {
            await env.FONDAY_DB.prepare(`ALTER TABLE scans ADD COLUMN ${col} TEXT DEFAULT ''`).run().catch(() => {});
          });
        }

        await env.FONDAY_DB.prepare(
          `INSERT OR IGNORE INTO scans (id, user_id, overall_score, baumann_type, skin_age, ai_comment, scores, share_token, lang, is_guest, gender, age_group, city, country, referrer, device_info, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          visitorId,
          overallScore ?? 0,
          baumannType ?? "",
          skinAge ?? null,
          aiComment ?? "",
          JSON.stringify(scores ?? []),
          shareToken,
          lang ?? "ko",
          gender ?? "",
          ageGroup ?? "",
          city,
          country,
          referrer,
          deviceInfo,
          createdAt
        ).run();
      }

      return new Response(JSON.stringify({ shareToken }), {
        status: 200,
        headers: CORS,
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: CORS,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
