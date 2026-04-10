export const onRequest = (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const lang = url.searchParams.get("lang") || "ko";
  const source = url.searchParams.get("source") || "";

  // state에 lang과 source를 함께 전달
  const stateObj = source === "app" ? `${lang}|app` : lang;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state: stateObj,
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302
  );
};
