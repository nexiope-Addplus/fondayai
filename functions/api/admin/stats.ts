// 간단한 어드민 통계 엔드포인트
// 접근 제한: ADMIN_KEY 환경변수와 일치하는 ?key= 파라미터 필요
export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // HTTP Basic Auth
  const unauthorized = new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Fonday Admin"' },
  });
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return unauthorized;
  const decoded = atob(authHeader.slice(6));
  const colonIdx = decoded.indexOf(":");
  const password = colonIdx >= 0 ? decoded.slice(colonIdx + 1) : decoded;
  if (!env.ADMIN_KEY || password !== env.ADMIN_KEY) return unauthorized;

  if (!env.FONDAY_DB) {
    return new Response("DB not configured", { status: 500 });
  }

  const [totalResult, todayResult, baumannResult, recentResult] = await Promise.all([
    // 전체 스캔 수
    env.FONDAY_DB.prepare("SELECT COUNT(*) as total, AVG(overall_score) as avg_score FROM scans").first(),
    // 오늘 스캔 수
    env.FONDAY_DB.prepare("SELECT COUNT(*) as today FROM scans WHERE created_at >= date('now')").first(),
    // 바우만 타입 분포
    env.FONDAY_DB.prepare("SELECT baumann_type, COUNT(*) as cnt FROM scans GROUP BY baumann_type ORDER BY cnt DESC LIMIT 10").all(),
    // 최근 10개 스캔
    env.FONDAY_DB.prepare("SELECT overall_score, baumann_type, skin_age, lang, created_at FROM scans ORDER BY created_at DESC LIMIT 10").all(),
  ]);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #faf9f6; color: #1c1917; }
    h1 { font-size: 24px; font-weight: 900; color: #2D5F4F; }
    h2 { font-size: 16px; font-weight: 700; color: #57534e; margin-top: 32px; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .card .num { font-size: 36px; font-weight: 900; color: #2D5F4F; }
    .card .label { font-size: 13px; color: #a8a29e; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    th { background: #f5f5f4; padding: 10px 14px; text-align: left; font-size: 12px; color: #78716c; font-weight: 600; }
    td { padding: 10px 14px; font-size: 13px; border-top: 1px solid #f5f5f4; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #2D5F4F; }
  </style>
</head>
<body>
  <h1>🌿 Fonday Admin</h1>
  <p style="color:#a8a29e;font-size:13px">${new Date().toLocaleString("ko-KR")}</p>

  <div class="cards">
    <div class="card">
      <div class="num">${(totalResult as any)?.total ?? 0}</div>
      <div class="label">전체 스캔 수</div>
    </div>
    <div class="card">
      <div class="num">${(todayResult as any)?.today ?? 0}</div>
      <div class="label">오늘 스캔 수</div>
    </div>
    <div class="card">
      <div class="num">${Math.round((totalResult as any)?.avg_score ?? 0)}</div>
      <div class="label">평균 점수</div>
    </div>
  </div>

  <h2>바우만 타입 분포</h2>
  <table>
    <tr><th>타입</th><th>스캔 수</th></tr>
    ${((baumannResult as any)?.results ?? []).map((r: any) =>
      `<tr><td><span class="badge">${r.baumann_type || "??"}</span></td><td>${r.cnt}</td></tr>`
    ).join("")}
  </table>

  <h2>최근 스캔 10건</h2>
  <table>
    <tr><th>점수</th><th>바우만</th><th>피부나이</th><th>언어</th><th>시간</th></tr>
    ${((recentResult as any)?.results ?? []).map((r: any) =>
      `<tr>
        <td><strong>${r.overall_score}</strong></td>
        <td><span class="badge">${r.baumann_type || "?"}</span></td>
        <td>${r.skin_age ?? "-"}</td>
        <td>${r.lang}</td>
        <td style="color:#a8a29e">${r.created_at?.slice(0, 16) ?? ""}</td>
      </tr>`
    ).join("")}
  </table>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
};
