export const onRequest = (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const lang = url.searchParams.get("lang") || "ko";

  const params = new URLSearchParams({
    client_id: env.KAKAO_CLIENT_ID,
    redirect_uri: `${origin}/auth/kakao/callback`,
    response_type: "code",
    state: lang,
  });

  return Response.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params}`,
    302
  );
};
