export const onRequest = (context: any) => {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINE_CHANNEL_ID,
    redirect_uri: `${origin}/auth/line/callback`,
    state: crypto.randomUUID(),
    scope: "profile openid",
  });

  return Response.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`,
    302
  );
};
