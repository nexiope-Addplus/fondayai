export const onRequest = (context: any) => {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    client_id: env.KAKAO_CLIENT_ID,
    redirect_uri: `${origin}/auth/kakao/callback`,
    response_type: "code",
  });

  return Response.redirect(
    `https://kauth.kakao.com/oauth/authorize?${params}`,
    302
  );
};
