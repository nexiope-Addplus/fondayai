import { createJWT } from "../../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state") || "ko";
  const isApp = stateRaw.includes("|app");
  const lang = stateRaw.split("_")[0] || "ko";

  if (!code) {
    return Response.redirect("/", 302);
  }

  try {
    // 1) 코드 → 액세스 토큰 교환
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${url.origin}/auth/line/callback`,
        client_id: env.LINE_CHANNEL_ID,
        client_secret: env.LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error("[LINE OAuth] token exchange failed:", await tokenRes.text());
      return Response.redirect("/", 302);
    }

    const tokens: any = await tokenRes.json();

    // 2) 사용자 정보 조회
    const userRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[LINE OAuth] user info failed:", await userRes.text());
      return Response.redirect("/", 302);
    }

    const lineUser: any = await userRes.json();

    // 3) JWT 생성 & 쿠키 세팅
    const user = {
      id: `line_${lineUser.userId}`,
      username: lineUser.displayName ?? "LINE 사용자",
      email: null,
      avatar: lineUser.pictureUrl ?? null,
      provider: "line",
    };

    const jwt = await createJWT(user, env.JWT_SECRET!);
    const maxAge = 60 * 60 * 24 * 30; // 30일

    if (isApp) {
      return Response.redirect(`fondayapp://login?token=${jwt}`, 302);
    }

    const headers = new Headers();
    headers.append("Location", `/?login=success&lang=${lang}`);
    headers.append("Set-Cookie", `fonday_session=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
    headers.append("Set-Cookie", `fonday_lang=${lang}; Path=/; Max-Age=${maxAge}`);
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    console.error("[LINE OAuth] callback error:", e.message);
    return Response.redirect("/", 302);
  }
};
