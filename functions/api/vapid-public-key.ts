// VAPID 공개키 반환 — 클라이언트 push 구독 시 사용
// 공개키는 비밀이 아니므로 인증 없이 반환
export const onRequestGet = async (context: any) => {
  const { env } = context;
  return new Response(JSON.stringify({ key: env.VAPID_PUBLIC_KEY || "" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
