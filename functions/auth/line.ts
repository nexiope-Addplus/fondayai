export const onRequest = (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const lang = url.searchParams.get("lang") || "ko";
  const source = url.searchParams.get("source") || "";
  const sourceTag = source === "app" ? "|app" : "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINE_CHANNEL_ID,
    redirect_uri: `${origin}/auth/line/callback`,
    state: `${lang}_${crypto.randomUUID().slice(0, 8)}${sourceTag}`,
    scope: "profile openid",
    disable_auto_login: "true",
  });

  return Response.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`,
    302
  );
};
