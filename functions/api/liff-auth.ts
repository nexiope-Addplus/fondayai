import { createJWT } from "../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Missing access token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // LIFF 액세스 토큰으로 LINE 프로필 조회
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error("[LIFF Auth] profile fetch failed:", await profileRes.text());
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lineUser: any = await profileRes.json();

    const user = {
      id: `line_${lineUser.userId}`,
      username: lineUser.displayName ?? "LINE 사용자",
      email: null,
      avatar: lineUser.pictureUrl ?? null,
      provider: "line",
    };

    const jwt = await createJWT(user, env.JWT_SECRET!);
    const maxAge = 60 * 60 * 24 * 30; // 30일

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `fonday_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
      },
    });
  } catch (e: any) {
    console.error("[LIFF Auth] error:", e.message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
