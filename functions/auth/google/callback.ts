import { createJWT } from "../../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const homeUrl = `${url.origin}/`;
  const errorRedirect = (stage: string) =>
    Response.redirect(`${homeUrl}?login_error=${encodeURIComponent(stage)}`, 302);
  const code = url.searchParams.get("code");

  if (!code) {
    return errorRedirect("google_missing_code");
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
      return errorRedirect("google_token_exchange");
    }

    const tokens: any = await tokenRes.json();

    // 2) 사용자 정보 조회
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return errorRedirect("google_user_info");
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
        Location: "/?login=success",
        "Set-Cookie": `fonday_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
      },
    });
  } catch (e: any) {
    console.error("[Google OAuth] callback error:", e.message);
    return errorRedirect("google_callback_exception");
  }
};
