export const onRequest = async (context: any) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  return new Response("OK", {
    status: 200,
    headers: {
      "Set-Cookie":
        "fonday_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    },
  });
};
