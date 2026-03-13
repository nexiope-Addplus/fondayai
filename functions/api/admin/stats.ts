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

/** UTC ISO → KST 표시 문자열 (yyyy-MM-dd HH:mm) */
function toKST(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 16).replace("T", " ");
  } catch { return isoStr.slice(0, 16); }
}

/** 현재 KST 시각 */
function nowKST(): string {
  return toKST(new Date().toISOString());
}

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

  // KST 기준 날짜: UTC+9 offset
  const [
    totalResult, todayResult, weekResult, guestResult,
    langResult, baumannResult, dailyResult, recentResult,
    genderResult, ageGroupResult,
  ] = await Promise.all([
    env.FONDAY_DB.prepare("SELECT COUNT(*) as total, AVG(overall_score) as avg_score FROM scans").first(),
    // 오늘 = KST 기준
    env.FONDAY_DB.prepare("SELECT COUNT(*) as today FROM scans WHERE date(datetime(created_at, '+9 hours')) = date(datetime('now', '+9 hours'))").first(),
    // 7일 = KST 기준
    env.FONDAY_DB.prepare("SELECT COUNT(*) as week FROM scans WHERE datetime(created_at, '+9 hours') >= datetime('now', '+9 hours', '-7 days')").first(),
    env.FONDAY_DB.prepare("SELECT SUM(is_guest) as guest, SUM(1-is_guest) as loggedin FROM scans").first(),
    env.FONDAY_DB.prepare("SELECT lang, COUNT(*) as cnt FROM scans GROUP BY lang ORDER BY cnt DESC").all(),
    env.FONDAY_DB.prepare("SELECT baumann_type, COUNT(*) as cnt FROM scans GROUP BY baumann_type ORDER BY cnt DESC LIMIT 8").all(),
    // 14일 추이 — KST 기준 날짜로 그룹핑
    env.FONDAY_DB.prepare("SELECT date(datetime(created_at, '+9 hours')) as day, COUNT(*) as cnt FROM scans WHERE datetime(created_at, '+9 hours') >= datetime('now', '+9 hours', '-14 days') GROUP BY day ORDER BY day").all(),
    env.FONDAY_DB.prepare("SELECT overall_score, baumann_type, skin_age, lang, is_guest, gender, age_group, created_at FROM scans ORDER BY created_at DESC LIMIT 20").all(),
    // 성별 분포
    env.FONDAY_DB.prepare("SELECT gender, COUNT(*) as cnt FROM scans WHERE gender != '' GROUP BY gender ORDER BY cnt DESC").all(),
    // 나이대 분포
    env.FONDAY_DB.prepare("SELECT age_group, COUNT(*) as cnt FROM scans WHERE age_group != '' GROUP BY age_group ORDER BY cnt DESC").all(),
  ]);

  const total = (totalResult as any)?.total ?? 0;
  const avgScore = Math.round((totalResult as any)?.avg_score ?? 0);
  const today = (todayResult as any)?.today ?? 0;
  const week = (weekResult as any)?.week ?? 0;
  const guest = (guestResult as any)?.guest ?? 0;
  const loggedin = (guestResult as any)?.loggedin ?? 0;
  const dailyRows: any[] = (dailyResult as any)?.results ?? [];
  const maxDaily = Math.max(...dailyRows.map((r: any) => r.cnt), 1);

  const genderRows: any[] = (genderResult as any)?.results ?? [];
  const ageGroupRows: any[] = (ageGroupResult as any)?.results ?? [];
  const genderTotal = genderRows.reduce((s: number, r: any) => s + r.cnt, 0) || 1;
  const ageTotal = ageGroupRows.reduce((s: number, r: any) => s + r.cnt, 0) || 1;

  // 성별 레이블 변환
  const genderLabel = (g: string) => g === "female" ? "여성" : g === "male" ? "남성" : g;
  const genderColors: Record<string, string> = { female: "#ec4899", male: "#6366f1" };

  // 나이대 순서 정렬 (Korean age group 순서)
  const AGE_ORDER = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
  const sortedAgeRows = [...ageGroupRows].sort((a, b) => {
    const ai = AGE_ORDER.indexOf(a.age_group);
    const bi = AGE_ORDER.indexOf(b.age_group);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px 20px 60px; background: #faf9f6; color: #1c1917; }
    h1 { font-size: 22px; font-weight: 900; color: #2D5F4F; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #78716c; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .05em; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { background: white; border-radius: 16px; padding: 18px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    .card .num { font-size: 30px; font-weight: 900; color: #2D5F4F; line-height: 1; }
    .card .label { font-size: 12px; color: #a8a29e; margin-top: 5px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .panel { background: white; border-radius: 16px; padding: 18px; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
    th { background: #f5f5f4; padding: 9px 14px; text-align: left; font-size: 11px; color: #78716c; font-weight: 600; text-transform: uppercase; }
    td { padding: 9px 14px; font-size: 13px; border-top: 1px solid #f5f5f4; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #2D5F4F; }
    .badge-guest { background: #fef3c7; color: #92400e; }
    .badge-f { background: #fce7f3; color: #9d174d; }
    .badge-m { background: #ede9fe; color: #5b21b6; }
    .bar-wrap { display: flex; flex-direction: column; gap: 6px; }
    .bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .bar-label { width: 64px; text-align: right; color: #78716c; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-bg { flex: 1; background: #f5f5f4; border-radius: 99px; height: 10px; }
    .bar-fill { height: 10px; border-radius: 99px; background: #2D5F4F; }
    .bar-val { width: 32px; font-weight: 700; color: #2D5F4F; font-size: 12px; }
    .chart { display: flex; align-items: flex-end; gap: 4px; height: 80px; margin-top: 8px; }
    .chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
    .chart-bar { width: 100%; background: #2D5F4F; border-radius: 4px 4px 0 0; min-height: 2px; }
    .chart-label { font-size: 9px; color: #a8a29e; white-space: nowrap; }
    .pie { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .pie-item { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .gender-bars { display: flex; gap: 8px; align-items: flex-end; height: 64px; margin: 8px 0; }
    .gender-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .gender-bar { width: 100%; border-radius: 6px 6px 0 0; }
    .gender-label { font-size: 11px; color: #78716c; font-weight: 700; }
    .gender-pct { font-size: 13px; font-weight: 900; color: #1c1917; }
    @media(max-width:640px) { .cards { grid-template-columns: repeat(2,1fr); } .grid3,.grid2 { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>🌿 Fonday Admin</h1>
  <p style="color:#a8a29e;font-size:12px;margin:0 0 4px">${nowKST()} KST · <a href="" style="color:#2D5F4F">새로고침</a></p>

  <div class="cards">
    <div class="card">
      <div class="num">${total}</div>
      <div class="label">전체 스캔</div>
    </div>
    <div class="card">
      <div class="num">${today}</div>
      <div class="label">오늘 스캔 (KST)</div>
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

  <h2>최근 14일 스캔 추이 (KST)</h2>
  <div class="panel">
    <div class="chart">
      ${dailyRows.map((r: any) => `
        <div class="chart-col">
          <div class="chart-bar" style="height:${Math.round(r.cnt / maxDaily * 72)}px" title="${r.cnt}건"></div>
          <div class="chart-label">${r.day?.slice(5) ?? ""}</div>
        </div>`).join("")}
    </div>
  </div>

  <div class="grid3" style="margin-top:12px">
    <div class="panel">
      <h2 style="margin-top:0">성별 분포</h2>
      ${genderRows.length === 0
        ? `<p style="font-size:12px;color:#a8a29e">데이터 없음</p>`
        : `<div class="gender-bars">
          ${genderRows.map((r: any) => {
            const pct = Math.round(r.cnt / genderTotal * 100);
            const color = genderColors[r.gender] ?? "#2D5F4F";
            return `<div class="gender-col">
              <div class="gender-pct">${pct}%</div>
              <div class="gender-bar" style="background:${color};height:${Math.max(8, Math.round(pct * 0.5))}px"></div>
              <div class="gender-label">${genderLabel(r.gender)}</div>
              <div style="font-size:11px;color:#a8a29e">${r.cnt}명</div>
            </div>`;
          }).join("")}
        </div>`
      }
    </div>

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

  <h2>나이대 분포</h2>
  <div class="panel">
    <div class="bar-wrap">
      ${sortedAgeRows.length === 0
        ? `<p style="font-size:12px;color:#a8a29e;margin:0">데이터 없음 (마이그레이션 후 새 스캔부터 수집됩니다)</p>`
        : sortedAgeRows.map((r: any) => {
          const pct = Math.round(r.cnt / ageTotal * 100);
          return `<div class="bar-row">
            <div class="bar-label" style="width:80px">${r.age_group}</div>
            <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
            <div class="bar-val">${r.cnt}</div>
            <div style="font-size:11px;color:#a8a29e">${pct}%</div>
          </div>`;
        }).join("")
      }
    </div>
  </div>

  <h2>최근 스캔 20건</h2>
  <table>
    <tr><th>점수</th><th>바우만</th><th>피부나이</th><th>성별</th><th>나이대</th><th>언어</th><th>유형</th><th>시간(KST)</th></tr>
    ${((recentResult as any)?.results ?? []).map((r: any) => `
      <tr>
        <td><strong>${r.overall_score}</strong></td>
        <td><span class="badge">${r.baumann_type || "?"}</span></td>
        <td>${r.skin_age ?? "-"}</td>
        <td><span class="badge ${r.gender === 'female' ? 'badge-f' : r.gender === 'male' ? 'badge-m' : ''}">${r.gender === 'female' ? '여성' : r.gender === 'male' ? '남성' : '-'}</span></td>
        <td style="font-size:12px">${r.age_group || "-"}</td>
        <td>${(r.lang ?? "ko").toUpperCase()}</td>
        <td><span class="badge ${r.is_guest ? 'badge-guest' : ''}">${r.is_guest ? "비로그인" : "로그인"}</span></td>
        <td style="color:#a8a29e;font-size:12px">${toKST(r.created_at)}</td>
      </tr>`).join("")}
  </table>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
};
