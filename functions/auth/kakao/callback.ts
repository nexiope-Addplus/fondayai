import { createJWT } from "../../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const homeUrl = `${url.origin}/`;
  const errorRedirect = (stage: string) =>
    Response.redirect(`${homeUrl}?login_error=${encodeURIComponent(stage)}`, 302);
  const code = url.searchParams.get("code");
  const lang = url.searchParams.get("state") || "ko";

  if (!code) {
    return errorRedirect("kakao_missing_code");
  }

  try {
    // 1) 코드 → 액세스 토큰 교환
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: env.KAKAO_CLIENT_ID,
      redirect_uri: `${url.origin}/auth/kakao/callback`,
      code,
    });
    if (env.KAKAO_CLIENT_SECRET) {
      tokenBody.set("client_secret", env.KAKAO_CLIENT_SECRET);
    }

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });

    if (!tokenRes.ok) {
      console.error("[Kakao OAuth] token exchange failed:", await tokenRes.text());
      return errorRedirect("kakao_token_exchange");
    }

    const tokens: any = await tokenRes.json();

    // 2) 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[Kakao OAuth] user info failed:", await userRes.text());
      return errorRedirect("kakao_user_info");
    }

    const kakaoUser: any = await userRes.json();
    const profile = kakaoUser.kakao_account?.profile ?? {};

    // 3) JWT 생성 & 쿠키 세팅
    const user = {
      id: `kakao_${kakaoUser.id}`,
      username: profile.nickname ?? "카카오 사용자",
      email: kakaoUser.kakao_account?.email ?? null,
      avatar: profile.thumbnail_image_url ?? null,
      provider: "kakao",
    };

    const jwt = await createJWT(user, env.JWT_SECRET!);
    const maxAge = 60 * 60 * 24 * 30; // 30일

    const headers = new Headers();
    headers.append("Location", `${homeUrl}?login=success&lang=${lang}`);
    headers.append("Set-Cookie", `fonday_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
    headers.append("Set-Cookie", `fonday_lang=${lang}; Path=/; Max-Age=${maxAge}`);
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    console.error("[Kakao OAuth] callback error:", e.message);
    return errorRedirect("kakao_callback_exception");
  }
};
