// 전역 CORS 미들웨어 — 토스 미니앱(*.apps.tossmini.com)에서 API 접근 허용
export const onRequest: PagesFunction[] = [
  async (context) => {
    const { request } = context;
    const origin = request.headers.get("Origin") || "*";

    // Preflight OPTIONS 요청 즉시 응답
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Toss-User",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 실제 요청 — 다음 핸들러 실행 후 CORS 헤더 추가
    const response = await context.next();
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", origin);
    newResponse.headers.set("Access-Control-Allow-Credentials", "true");
    return newResponse;
  },
];
