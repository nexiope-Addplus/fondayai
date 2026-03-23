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
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const kv = env.PUSH_KV;
  if (!kv) {
    return new Response(JSON.stringify({ error: "KV 없음" }), { status: 500, headers: CORS });
  }

  const key = `user-stats:${user.id}`;

  if (request.method === "GET") {
    const raw = await kv.get(key);
    if (!raw) return new Response(JSON.stringify(null), { headers: CORS });
    return new Response(raw, { headers: CORS });
  }

  if (request.method === "POST") {
    const body: any = await request.json();
    // 기존 데이터와 병합 (streak: count 더 큰 쪽, attendance: dates 합집합)
    const existing = await kv.get(key).then((r: string | null) => r ? JSON.parse(r) : null).catch(() => null);

    let merged = { streak: body.streak, attendance: body.attendance, missionState: body.missionState };
    if (existing) {
      // streak: count가 더 큰 쪽 우선
      if ((existing.streak?.count ?? 0) > (body.streak?.count ?? 0)) {
        merged.streak = existing.streak;
      }
      // attendance: dates 합집합
      if (existing.attendance?.dates && body.attendance?.dates) {
        const unionDates = [...new Set([...existing.attendance.dates, ...body.attendance.dates])] as string[];
        merged.attendance = { dates: unionDates, totalPoints: unionDates.length * 3 };
      }
    }

    await kv.put(key, JSON.stringify(merged), { expirationTtl: 60 * 60 * 24 * 365 });
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
