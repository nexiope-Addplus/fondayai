import { createJWT } from "../../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.redirect("/", 302);
  }

  try {
    // 1) 코드 → 액세스 토큰 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[Google OAuth] token exchange failed:", await tokenRes.text());
      return Response.redirect("/", 302);
    }

    const tokens: any = await tokenRes.json();

    // 2) 사용자 정보 조회
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return Response.redirect("/", 302);
    }

    const googleUser: any = await userRes.json();

    // 3) JWT 생성 & 쿠키 세팅
    const user = {
      id: googleUser.id,
      username: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.picture,
      provider: "google",
    };

    const jwt = await createJWT(user, env.JWT_SECRET || "fonday-secret-key");
    const maxAge = 60 * 60 * 24 * 30; // 30일

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `fonday_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
      },
    });
  } catch (e: any) {
    console.error("[Google OAuth] callback error:", e.message);
    return Response.redirect("/", 302);
  }
};
