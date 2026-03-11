const LOGIN_FORM = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf9f6; }
    .box { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); width: 320px; text-align: center; }
    h1 { font-size: 22px; font-weight: 900; color: #2D5F4F; margin: 0 0 8px; }
    p { color: #a8a29e; font-size: 13px; margin: 0 0 24px; }
    input { width: 100%; padding: 12px 16px; border: 1.5px solid #e7e5e4; border-radius: 12px; font-size: 15px; box-sizing: border-box; outline: none; }
    input:focus { border-color: #2D5F4F; }
    button { width: 100%; margin-top: 12px; padding: 13px; background: #2D5F4F; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🌿 Fonday Admin</h1>
    <p>관리자 비밀번호를 입력하세요</p>
    <form method="POST">
      <input type="password" name="key" placeholder="비밀번호" autofocus />
      <button type="submit">로그인</button>
    </form>
  </div>
</body>
</html>`;

// 간단한 어드민 통계 엔드포인트 (POST 폼 인증)
export const onRequest = async (context: any) => {
  const { request, env } = context;

  // GET → 로그인 폼
  if (request.method === "GET") {
    return new Response(LOGIN_FORM, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }

  // POST → 비밀번호 확인
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const formData = await request.formData();
  const key = formData.get("key");
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response(LOGIN_FORM.replace("</form>", '<p style="color:#ef4444;font-size:13px">비밀번호가 틀렸습니다</p></form>'), {
      status: 401,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  if (!env.FONDAY_DB) {
    return new Response("DB not configured", { status: 500 });
  }

  // 푸시 구독자 수 (PUSH_KV)
  let pushCount = 0;
  if (env.PUSH_KV) {
    const allIds = await env.PUSH_KV.get("push:all_ids");
    pushCount = allIds ? JSON.parse(allIds).length : 0;
  }

  const [totalResult, todayResult, weekResult, guestResult, langResult, baumannResult, dailyResult, recentResult] = await Promise.all([
    env.FONDAY_DB.prepare("SELECT COUNT(*) as total, AVG(overall_score) as avg_score FROM scans").first(),
    env.FONDAY_DB.prepare("SELECT COUNT(*) as today FROM scans WHERE date(created_at) = date('now')").first(),
    env.FONDAY_DB.prepare("SELECT COUNT(*) as week FROM scans WHERE created_at >= datetime('now', '-7 days')").first(),
    env.FONDAY_DB.prepare("SELECT SUM(is_guest) as guest, SUM(1-is_guest) as loggedin FROM scans").first(),
    env.FONDAY_DB.prepare("SELECT lang, COUNT(*) as cnt FROM scans GROUP BY lang ORDER BY cnt DESC").all(),
    env.FONDAY_DB.prepare("SELECT baumann_type, COUNT(*) as cnt FROM scans GROUP BY baumann_type ORDER BY cnt DESC LIMIT 8").all(),
    env.FONDAY_DB.prepare("SELECT date(created_at) as day, COUNT(*) as cnt FROM scans WHERE created_at >= datetime('now', '-14 days') GROUP BY day ORDER BY day").all(),
    env.FONDAY_DB.prepare("SELECT overall_score, baumann_type, skin_age, lang, is_guest, created_at FROM scans ORDER BY created_at DESC LIMIT 20").all(),
  ]);

  const total = (totalResult as any)?.total ?? 0;
  const avgScore = Math.round((totalResult as any)?.avg_score ?? 0);
  const today = (todayResult as any)?.today ?? 0;
  const week = (weekResult as any)?.week ?? 0;
  const guest = (guestResult as any)?.guest ?? 0;
  const loggedin = (guestResult as any)?.loggedin ?? 0;
  const dailyRows: any[] = (dailyResult as any)?.results ?? [];
  const maxDaily = Math.max(...dailyRows.map((r: any) => r.cnt), 1);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; max-width: 860px; margin: 0 auto; padding: 24px 20px 60px; background: #faf9f6; color: #1c1917; }
    h1 { font-size: 22px; font-weight: 900; color: #2D5F4F; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #78716c; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .05em; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { background: white; border-radius: 16px; padding: 18px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    .card .num { font-size: 30px; font-weight: 900; color: #2D5F4F; line-height: 1; }
    .card .label { font-size: 12px; color: #a8a29e; margin-top: 5px; }
    .card2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel { background: white; border-radius: 16px; padding: 18px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    th { background: #f5f5f4; padding: 9px 14px; text-align: left; font-size: 11px; color: #78716c; font-weight: 600; text-transform: uppercase; }
    td { padding: 9px 14px; font-size: 13px; border-top: 1px solid #f5f5f4; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #2D5F4F; }
    .badge-guest { background: #fef3c7; color: #92400e; }
    .bar-wrap { display: flex; flex-direction: column; gap: 6px; }
    .bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .bar-label { width: 36px; text-align: right; color: #78716c; font-weight: 600; }
    .bar-bg { flex: 1; background: #f5f5f4; border-radius: 99px; height: 10px; }
    .bar-fill { height: 10px; border-radius: 99px; background: #2D5F4F; }
    .bar-val { width: 28px; font-weight: 700; color: #2D5F4F; }
    .chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; margin-top: 8px; }
    .chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
    .chart-bar { width: 100%; background: #2D5F4F; border-radius: 4px 4px 0 0; min-height: 2px; }
    .chart-label { font-size: 9px; color: #a8a29e; white-space: nowrap; }
    .pie { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .pie-item { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    @media(max-width:600px) { .cards { grid-template-columns: repeat(2,1fr); } .card2 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>🌿 Fonday Admin</h1>
  <p style="color:#a8a29e;font-size:12px;margin:0 0 4px">${new Date().toLocaleString("ko-KR")} · <a href="" style="color:#2D5F4F">새로고침</a></p>

  <div class="cards">
    <div class="card">
      <div class="num">${total}</div>
      <div class="label">전체 스캔</div>
    </div>
    <div class="card">
      <div class="num">${today}</div>
      <div class="label">오늘 스캔</div>
    </div>
    <div class="card">
      <div class="num">${week}</div>
      <div class="label">7일 스캔</div>
    </div>
    <div class="card">
      <div class="num">${pushCount}</div>
      <div class="label">푸시 구독자</div>
    </div>
    <div class="card">
      <div class="num">${avgScore}</div>
      <div class="label">평균 점수</div>
    </div>
    <div class="card">
      <div class="num">${loggedin}</div>
      <div class="label">로그인 스캔</div>
    </div>
    <div class="card">
      <div class="num">${guest}</div>
      <div class="label">비로그인 스캔</div>
    </div>
    <div class="card">
      <div class="num">${total > 0 ? Math.round(loggedin / total * 100) : 0}%</div>
      <div class="label">로그인 전환율</div>
    </div>
  </div>

  <h2>최근 14일 스캔 추이</h2>
  <div class="panel">
    <div class="chart">
      ${dailyRows.map((r: any) => `
        <div class="chart-col">
          <div class="chart-bar" style="height:${Math.round(r.cnt / maxDaily * 72)}px" title="${r.cnt}건"></div>
          <div class="chart-label">${r.day?.slice(5) ?? ""}</div>
        </div>`).join("")}
    </div>
  </div>

  <div class="card2" style="margin-top:12px">
    <div class="panel">
      <h2 style="margin-top:0">언어 분포</h2>
      <div class="pie">
        ${((langResult as any)?.results ?? []).map((r: any, i: number) => {
          const colors = ["#2D5F4F","#F59E0B","#6366F1","#EF4444"];
          return `<div class="pie-item"><div class="dot" style="background:${colors[i % colors.length]}"></div>${r.lang?.toUpperCase()} ${r.cnt}건</div>`;
        }).join("")}
      </div>
    </div>
    <div class="panel">
      <h2 style="margin-top:0">바우만 타입 TOP</h2>
      <div class="bar-wrap">
        ${((baumannResult as any)?.results ?? []).slice(0, 5).map((r: any) => {
          const pct = total > 0 ? Math.round(r.cnt / total * 100) : 0;
          return `<div class="bar-row">
            <div class="bar-label">${r.baumann_type || "??"}</div>
            <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
            <div class="bar-val">${r.cnt}</div>
          </div>`;
        }).join("")}
      </div>
    </div>
  </div>

  <h2>최근 스캔 20건</h2>
  <table>
    <tr><th>점수</th><th>바우만</th><th>피부나이</th><th>언어</th><th>유형</th><th>시간(KST)</th></tr>
    ${((recentResult as any)?.results ?? []).map((r: any) => `
      <tr>
        <td><strong>${r.overall_score}</strong></td>
        <td><span class="badge">${r.baumann_type || "?"}</span></td>
        <td>${r.skin_age ?? "-"}</td>
        <td>${(r.lang ?? "ko").toUpperCase()}</td>
        <td><span class="badge ${r.is_guest ? 'badge-guest' : ''}">${r.is_guest ? "비로그인" : "로그인"}</span></td>
        <td style="color:#a8a29e">${r.created_at?.slice(0, 16) ?? ""}</td>
      </tr>`).join("")}
  </table>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
};
