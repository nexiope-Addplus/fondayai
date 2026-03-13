import { getUserFromCookie } from "../../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequest = async (context: any) => {
  const { request, env, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (request.method !== "DELETE") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");
  if (!user) {
    return new Response(JSON.stringify({ error: "로그인 필요" }), { status: 401, headers: CORS });
  }

  const id = params.id;
  const db = env.FONDAY_DB;
  if (!db) {
    return new Response(JSON.stringify({ success: true }), { headers: CORS });
  }

  try {
    await db
      .prepare("UPDATE cosmetics SET status = 'deleted' WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .run();
    return new Response(JSON.stringify({ success: true }), { headers: CORS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
};
