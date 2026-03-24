import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET!);
  if (!user) {
    return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), {
      status: 401,
      headers: CORS,
    });
  }

  const kvKey = `scans:${user.id}`;

  // ── GET: 스캔 히스토리 조회 ──────────────────────────
  if (request.method === "GET") {
    let scans: any[] = [];
    if (env.SCANS_KV) {
      const raw = await env.SCANS_KV.get(kvKey);
      if (raw) scans = JSON.parse(raw);
    }
    return new Response(JSON.stringify(scans), { headers: CORS });
  }

  // ── POST: 스캔 저장 ──────────────────────────────────
  if (request.method === "POST") {
    const body: any = await request.json();

    const shareToken = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const newScan = {
      id: Date.now().toString(),
      createdAt,
      overallScore: String(body.overallScore),
      skinAge: body.skinAge ?? null,
      baumannType: body.baumannType ?? null,
      aiComment: body.aiComment ?? "",
      scores: body.scores ?? [],
      hotspots: body.hotspots ?? [],
      improvements: body.improvements ?? [],
      cosmetics: body.cosmetics ?? [],
      weatherInfo: body.weatherInfo ?? null,
      shareToken,
    };

    if (env.SCANS_KV) {
      const raw = await env.SCANS_KV.get(kvKey);
      const scans: any[] = raw ? JSON.parse(raw) : [];
      scans.unshift(newScan);
      await env.SCANS_KV.put(kvKey, JSON.stringify(scans.slice(0, 30)));
      await env.SCANS_KV.put(`share:${shareToken}`, JSON.stringify(newScan));
    }

    // Cloudflare에서 모든 합법 데이터 추출
    const cf = (request as any).cf || {};
    const city = cf.city || "";
    const country = cf.country || "";
    const region = cf.region || "";
    const timezone = cf.timezone || "";
    const referrer = body.referrer || "";

    // User-Agent 파싱 (기기/OS/브라우저)
    const ua = request.headers.get("user-agent") || "";
    const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
    const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "other";
    const browser = /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : /Edge/.test(ua) ? "Edge" : "other";
    const deviceInfo = JSON.stringify({ deviceType, os, browser, region, timezone });

    // D1에도 저장 (관리자 통계용)
    if (env.FONDAY_DB) {
      // 새 컬럼 자동 추가 (없으면 무시)
      for (const col of ["city", "country", "referrer", "provider", "device_info"]) {
        await env.FONDAY_DB.prepare(
          `SELECT ${col} FROM scans LIMIT 0`
        ).all().catch(async () => {
          await env.FONDAY_DB.prepare(
            `ALTER TABLE scans ADD COLUMN ${col} TEXT DEFAULT ''`
          ).run().catch(() => {});
        });
      }

      const scanId = crypto.randomUUID();
      // 전체 컬럼 INSERT 시도, 실패하면 기본 컬럼으로 fallback
      await env.FONDAY_DB.prepare(
        `INSERT OR IGNORE INTO scans
           (id, user_id, overall_score, baumann_type, skin_age, ai_comment, scores,
            weather_info, share_token, lang, is_guest, gender, age_group, city, country, referrer, provider, device_info, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        scanId, user.id, body.overallScore ?? 0, body.baumannType ?? "", body.skinAge ?? null,
        body.aiComment ?? "", JSON.stringify(body.scores ?? []), JSON.stringify(body.weatherInfo ?? null),
        shareToken, body.lang ?? "ko", body.gender ?? "", body.ageGroup ?? "",
        city, country, referrer, user.provider || "", deviceInfo, createdAt
      ).run().catch(async () => {
        // fallback: 새 컬럼 없이 저장
        await env.FONDAY_DB.prepare(
          `INSERT OR IGNORE INTO scans
             (id, user_id, overall_score, baumann_type, skin_age, ai_comment, scores,
              weather_info, share_token, lang, is_guest, gender, age_group, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
        ).bind(
          scanId, user.id, body.overallScore ?? 0, body.baumannType ?? "", body.skinAge ?? null,
          body.aiComment ?? "", JSON.stringify(body.scores ?? []), JSON.stringify(body.weatherInfo ?? null),
          shareToken, body.lang ?? "ko", body.gender ?? "", body.ageGroup ?? "", createdAt
        ).run().catch(() => {});
      });
    }

    return new Response(JSON.stringify(newScan), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
