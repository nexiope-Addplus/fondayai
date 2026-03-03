import { getUserFromCookie } from "../_utils/jwt";

export const onRequest = async (context: any) => {
  const { request, env } = context;

  const user = await getUserFromCookie(request, env.JWT_SECRET || "fonday-secret-key");

  if (!user) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });
};
