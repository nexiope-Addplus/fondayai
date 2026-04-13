export const onRequest = (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const lang = url.searchParams.get("lang") || "ko";
  const source = url.searchParams.get("source") || "";
  const stateObj = source === "app" ? `${lang}|app` : lang;

  const params = new URLSearchParams({
    client_id: env.KAKAO_CLIENT_ID,
    redirect_uri: `${origin}/auth/kakao/callback`,
    response_type: "code",
    state: stateObj,
  });

  return Response.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params}`,
    302
  );
};
