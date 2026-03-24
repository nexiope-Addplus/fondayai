/** UTC ISO → KST 표시 문자열 (yyyy-MM-dd HH:mm) */
function toKST(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 16).replace("T", " ");
  } catch { return isoStr.slice(0, 16); }
}
function nowKST(): string { return toKST(new Date().toISOString()); }

const CSS = `
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 960px; margin: 0 auto; padding: 24px 20px 80px; background: #faf9f6; color: #1c1917; }
h1 { font-size: 22px; font-weight: 900; color: #4A7C6E; margin: 0 0 4px; }
h2 { font-size: 11px; font-weight: 700; color: #a8a29e; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .08em; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
.card { background: white; border-radius: 14px; padding: 16px 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
.card .num { font-size: 28px; font-weight: 900; color: #4A7C6E; line-height: 1; }
.card .label { font-size: 11px; color: #a8a29e; margin-top: 4px; }
.card .sub { font-size: 11px; color: #4A7C6E; font-weight: 600; margin-top: 2px; }
.grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.panel { background: white; border-radius: 14px; padding: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
.panel h3 { font-size: 12px; font-weight: 700; color: #78716c; margin: 0 0 12px; text-transform: uppercase; letter-spacing: .05em; }
table { width: 100%; border-collapse: collapse; background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
th { background: #f5f5f4; padding: 8px 12px; text-align: left; font-size: 10px; color: #78716c; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
td { padding: 8px 12px; font-size: 12px; border-top: 1px solid #f5f5f4; }
.badge { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 700; background: #ecfdf5; color: #4A7C6E; }
.badge-guest { background: #fef3c7; color: #92400e; }
.badge-f { background: #fce7f3; color: #9d174d; }
.badge-m { background: #ede9fe; color: #5b21b6; }
.badge-red { background: #fef2f2; color: #b91c1c; }
.badge-blue { background: #eff6ff; color: #1d4ed8; }
.bar-wrap { display: flex; flex-direction: column; gap: 5px; }
.bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.bar-label { width: 72px; text-align: right; color: #78716c; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.bar-label-wide { width: 96px; text-align: right; color: #78716c; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
.bar-bg { flex: 1; background: #f5f5f4; border-radius: 99px; height: 9px; }
.bar-fill { height: 9px; border-radius: 99px; background: #4A7C6E; }
.bar-val { width: 28px; font-weight: 700; color: #4A7C6E; font-size: 11px; text-align: right; flex-shrink: 0; }
.bar-pct { width: 34px; font-size: 10px; color: #a8a29e; flex-shrink: 0; }
.chart { display: flex; align-items: flex-end; gap: 3px; height: 72px; margin-top: 8px; }
.chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 3px; }
.chart-bar { width: 100%; background: #4A7C6E; border-radius: 3px 3px 0 0; min-height: 2px; }
.chart-label { font-size: 8px; color: #a8a29e; white-space: nowrap; }
.pie-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pie-item { display: flex; align-items: center; gap: 5px; font-size: 11px; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.funnel { display: flex; gap: 0; }
.funnel-step { flex: 1; text-align: center; padding: 12px 8px; background: #f5f5f4; border-right: 2px solid white; }
.funnel-step:first-child { border-radius: 10px 0 0 10px; }
.funnel-step:last-child { border-right: none; border-radius: 0 10px 10px 0; }
.funnel-num { font-size: 22px; font-weight: 900; color: #4A7C6E; }
.funnel-label { font-size: 10px; color: #78716c; margin-top: 3px; }
.funnel-rate { font-size: 11px; font-weight: 700; color: #f59e0b; margin-top: 2px; }
.metric-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f5f5f4; font-size: 12px; }
.metric-row:last-child { border-bottom: none; }
.nav { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.nav a { text-decoration: none; font-size: 12px; font-weight: 700; color: #4A7C6E; background: white; padding: 6px 14px; border-radius: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.nav a:hover { background: #ecfdf5; }
.section { margin-top: 24px; }
.score-dist { display: flex; align-items: flex-end; gap: 2px; height: 56px; margin-top: 8px; }
.score-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
.score-bar { width: 100%; border-radius: 2px 2px 0 0; min-height: 2px; }
.score-label { font-size: 7px; color: #a8a29e; margin-top: 2px; }
.date-filter { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.date-filter input { padding: 6px 12px; border: 1.5px solid #e7e5e4; border-radius: 10px; font-size: 13px; outline: none; font-family: inherit; }
.date-filter input:focus { border-color: #4A7C6E; }
.date-filter button { padding: 6px 14px; background: #f5f5f4; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; color: #78716c; cursor: pointer; }
.date-filter button:hover { background: #ecfdf5; color: #4A7C6E; }
.badge-kakao { background: #FEE500; color: #3C1E1E; }
.badge-google { background: #E8F0FE; color: #1a73e8; }
.badge-line { background: #E6FFE6; color: #06C755; }
.cosmetics-table td { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media(max-width:640px) { .cards { grid-template-columns: repeat(2,1fr); } .grid4,.grid3,.grid2 { grid-template-columns: 1fr; } .funnel { flex-direction: column; } .funnel-step { border-right: none; border-bottom: 2px solid white; } .funnel-step:first-child { border-radius: 10px 10px 0 0; } .funnel-step:last-child { border-radius: 0 0 10px 10px; } }
`;

const LOGIN_FORM = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #faf9f6; }
    .box { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); width: 320px; text-align: center; }
    h1 { font-size: 22px; font-weight: 900; color: #4A7C6E; margin: 0 0 8px; }
    p { color: #a8a29e; font-size: 13px; margin: 0 0 24px; }
    input { width: 100%; padding: 12px 16px; border: 1.5px solid #e7e5e4; border-radius: 12px; font-size: 15px; box-sizing: border-box; outline: none; }
    input:focus { border-color: #4A7C6E; }
    button { width: 100%; margin-top: 12px; padding: 13px; background: #4A7C6E; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
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

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "GET") {
    return new Response(LOGIN_FORM, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const formData = await request.formData();
  const key = formData.get("key");
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response(LOGIN_FORM.replace("</form>", '<p style="color:#ef4444;font-size:13px">비밀번호가 틀렸습니다</p></form>'), {
      status: 401, headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
  if (!env.FONDAY_DB) {
    return new Response("DB not configured", { status: 500 });
  }

  try {
    const safe = async (stmt: any, method: "first" | "all") => {
      try { return method === "first" ? await stmt.first() : await stmt.all(); }
      catch { return method === "first" ? null : { results: [] }; }
    };

    // ── 1. 스캔 기본 통계 ──────────────────────────────────────────
    const [
      totalRow, todayRow, weekRow, monthRow, guestRow,
      langRows, baumannRows, dailyRows,
      genderRows, ageRows, scoreDistRows, scoreMetricsRows,
      providerRows,
      retentionRow, retentionDailyRows,
      hourlyRows, realtimeScanRow,
      cosmeticsCategoryRows,
    ] = await Promise.all([
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as total, AVG(overall_score) as avg FROM scans"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM scans WHERE date(datetime(created_at,'+9 hours'))=date(datetime('now','+9 hours'))"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM scans WHERE datetime(created_at,'+9 hours')>=datetime('now','+9 hours','-7 days')"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM scans WHERE datetime(created_at,'+9 hours')>=datetime('now','+9 hours','-30 days')"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT SUM(is_guest) as guest, SUM(1-is_guest) as loggedin FROM scans"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT lang, COUNT(*) as cnt FROM scans GROUP BY lang ORDER BY cnt DESC"), "all"),
      safe(env.FONDAY_DB.prepare("SELECT baumann_type, COUNT(*) as cnt FROM scans GROUP BY baumann_type ORDER BY cnt DESC LIMIT 8"), "all"),
      safe(env.FONDAY_DB.prepare("SELECT date(datetime(created_at,'+9 hours')) as day, COUNT(*) as cnt FROM scans WHERE datetime(created_at,'+9 hours')>=datetime('now','+9 hours','-30 days') GROUP BY day ORDER BY day"), "all"),
      safe(env.FONDAY_DB.prepare("SELECT gender, COUNT(*) as cnt FROM scans WHERE gender!='' GROUP BY gender ORDER BY cnt DESC"), "all"),
      safe(env.FONDAY_DB.prepare("SELECT age_group, COUNT(*) as cnt FROM scans WHERE age_group!='' GROUP BY age_group ORDER BY cnt DESC"), "all"),
      // 점수 분포 (0-9, 10-19, ... 90-100)
      safe(env.FONDAY_DB.prepare("SELECT (overall_score/10)*10 as bucket, COUNT(*) as cnt FROM scans GROUP BY bucket ORDER BY bucket"), "all"),
      // 지표별 평균 점수 (scores JSON 파싱은 어렵으므로 overall만)
      safe(env.FONDAY_DB.prepare("SELECT MIN(overall_score) as min, MAX(overall_score) as max, AVG(overall_score) as avg, COUNT(*) as total FROM scans"), "first"),
      // 로그인 방식 분포
      safe(env.FONDAY_DB.prepare("SELECT provider, COUNT(*) as cnt FROM scans WHERE provider != '' GROUP BY provider ORDER BY cnt DESC"), "all"),
      // 7일 내 재스캔율 (같은 user_id가 2회 이상)
      safe(env.FONDAY_DB.prepare(`
        SELECT COUNT(DISTINCT user_id) as returning_users
        FROM scans WHERE user_id != '' AND user_id NOT LIKE 'v_%'
        AND datetime(created_at,'+9 hours') >= datetime('now','+9 hours','-7 days')
        AND user_id IN (SELECT user_id FROM scans GROUP BY user_id HAVING COUNT(*) >= 2)
      `), "first"),
      // 일별 재방문 유저 수 (30일)
      safe(env.FONDAY_DB.prepare(`
        SELECT date(datetime(created_at,'+9 hours')) as day,
          COUNT(DISTINCT user_id) as users,
          COUNT(DISTINCT CASE WHEN user_id IN (SELECT user_id FROM scans s2 WHERE s2.created_at < scans.created_at AND s2.user_id = scans.user_id) THEN user_id END) as returning
        FROM scans WHERE user_id != '' AND datetime(created_at,'+9 hours') >= datetime('now','+9 hours','-30 days')
        GROUP BY day ORDER BY day
      `), "all"),
      // 시간대별 스캔 분포 (0~23시)
      safe(env.FONDAY_DB.prepare(`
        SELECT CAST(strftime('%H', datetime(created_at, '+9 hours')) AS INTEGER) as hour, COUNT(*) as cnt
        FROM scans GROUP BY hour ORDER BY hour
      `), "all"),
      // 실시간: 최근 1시간 스캔 수
      safe(env.FONDAY_DB.prepare(`
        SELECT COUNT(*) as cnt FROM scans
        WHERE datetime(created_at) >= datetime('now', '-1 hour')
      `), "first"),
      // 카테고리별 화장품 등록 수
      safe(env.FONDAY_DB.prepare(`
        SELECT category, COUNT(*) as cnt FROM cosmetics WHERE status='active' GROUP BY category ORDER BY cnt DESC
      `), "all"),
    ]);

    // ── 2. 푸시 구독자 수 ──────────────────────────────────────────
    let pushCount = 0;
    if (env.PUSH_KV) {
      const allIds = await env.PUSH_KV.get("push:all_ids").catch(() => null);
      pushCount = allIds ? JSON.parse(allIds).length : 0;
    }

    // ── 3. 이벤트 기반 분석 (events 테이블 없으면 graceful skip) ───
    const eventsExist = await env.FONDAY_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='events'"
    ).first().catch(() => null);

    let tabRows: any[] = [];
    let featureRows: any[] = [];
    let funnelRows: any = {};
    let dailyActiveRows: any[] = [];
    let eventDailyRows: any[] = [];
    let realtimeSessionsRow: any = null;
    let pushAppOpensRow: any = null;

    if (eventsExist) {
      const [tabRes, featureRes, funnelRes, dauRes, eventDailyRes, rtSessionsRes, pushOpensRes] = await Promise.all([
        safe(env.FONDAY_DB.prepare(
          "SELECT json_extract(event_data,'$.tab') as tab, COUNT(*) as cnt FROM events WHERE event_type='tab_view' GROUP BY tab ORDER BY cnt DESC"
        ), "all"),
        safe(env.FONDAY_DB.prepare(
          "SELECT json_extract(event_data,'$.feature') as feature, COUNT(*) as cnt FROM events WHERE event_type='feature_use' GROUP BY feature ORDER BY cnt DESC LIMIT 10"
        ), "all"),
        // 퍼널: app_open → scan_start → scan_complete, push_prompt_shown → accepted
        safe(env.FONDAY_DB.prepare(
          "SELECT event_type, COUNT(*) as cnt FROM events WHERE event_type IN ('app_open','scan_start','scan_complete','scan_fail','push_prompt_shown','push_prompt_accepted','push_prompt_dismissed','pwa_prompt_shown','pwa_prompt_accepted','pwa_prompt_dismissed') GROUP BY event_type"
        ), "all"),
        // DAU 30일 (세션 기준)
        safe(env.FONDAY_DB.prepare(
          "SELECT date(datetime(created_at,'+9 hours')) as day, COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT CASE WHEN user_id!='' THEN user_id END) as users FROM events WHERE event_type='app_open' AND datetime(created_at,'+9 hours')>=datetime('now','+9 hours','-30 days') GROUP BY day ORDER BY day"
        ), "all"),
        // 이벤트 유형별 일별 추이 (30일)
        safe(env.FONDAY_DB.prepare(
          "SELECT date(datetime(created_at,'+9 hours')) as day, COUNT(*) as cnt FROM events WHERE datetime(created_at,'+9 hours')>=datetime('now','+9 hours','-30 days') GROUP BY day ORDER BY day"
        ), "all"),
        // 실시간 세션 (15분)
        safe(env.FONDAY_DB.prepare(
          "SELECT COUNT(DISTINCT session_id) as sessions FROM events WHERE datetime(created_at) >= datetime('now', '-15 minutes')"
        ), "first"),
        // 푸시 후 앱 오픈 (7일)
        safe(env.FONDAY_DB.prepare(
          "SELECT COUNT(*) as opens FROM events WHERE event_type='app_open' AND datetime(created_at,'+9 hours') >= datetime('now','+9 hours','-7 days')"
        ), "first"),
      ]);
      tabRows = (tabRes as any)?.results ?? [];
      featureRows = (featureRes as any)?.results ?? [];
      dailyActiveRows = (dauRes as any)?.results ?? [];
      eventDailyRows = (eventDailyRes as any)?.results ?? [];
      const funnelArr: any[] = (funnelRes as any)?.results ?? [];
      for (const r of funnelArr) funnelRows[r.event_type] = r.cnt;
      realtimeSessionsRow = rtSessionsRes;
      pushAppOpensRow = pushOpensRes;
    }

    // ── 4. 기타 데이터 ────────────────────────────────────────────
    const [recentRows, diaryCountRow, cosmeticsCountRow, cosmeticsListRows] = await Promise.all([
      env.FONDAY_DB.prepare("SELECT user_id, overall_score, baumann_type, skin_age, lang, is_guest, gender, age_group, scores, city, country, referrer, provider, device_info, created_at FROM scans ORDER BY created_at DESC LIMIT 100")
        .all().catch(() => env.FONDAY_DB.prepare("SELECT user_id, overall_score, baumann_type, skin_age, lang, is_guest, gender, age_group, city, country, referrer, provider, created_at FROM scans ORDER BY created_at DESC LIMIT 100").all())
        .catch(() => ({ results: [] })),
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM diary_entries"), "first"),
      safe(env.FONDAY_DB.prepare("SELECT COUNT(*) as cnt FROM cosmetics"), "first"),
      safe(env.FONDAY_DB.prepare(`
        SELECT c.user_id, c.name, c.brand, c.category, c.created_at,
          (SELECT COUNT(*) FROM cosmetics c2 WHERE c2.user_id = c.user_id AND c2.status='active') as total
        FROM cosmetics c WHERE c.status='active' ORDER BY c.user_id, c.created_at DESC LIMIT 100
      `), "all"),
    ]);

    // ── 5. 도시/유입경로 데이터 (컬럼 미존재시 graceful) ──────────
    let cityArr: any[] = [];
    let referrerArr: any[] = [];
    let cityDataAvailable = true;
    let referrerDataAvailable = true;

    try {
      const cityRes = await safe(env.FONDAY_DB.prepare("SELECT city, country, COUNT(*) as cnt FROM scans WHERE city != '' GROUP BY city, country ORDER BY cnt DESC LIMIT 15"), "all");
      cityArr = (cityRes as any)?.results ?? [];
    } catch {
      cityDataAvailable = false;
    }
    if (cityArr.length === 0) cityDataAvailable = false;

    try {
      const referrerRes = await safe(env.FONDAY_DB.prepare("SELECT referrer, COUNT(*) as cnt FROM scans WHERE referrer != '' GROUP BY referrer ORDER BY cnt DESC LIMIT 10"), "all");
      referrerArr = (referrerRes as any)?.results ?? [];
    } catch {
      referrerDataAvailable = false;
    }
    if (referrerArr.length === 0) referrerDataAvailable = false;

    // ── 계산 ──────────────────────────────────────────────────────
    const total = (totalRow as any)?.total ?? 0;
    const avgScore = Math.round((totalRow as any)?.avg ?? 0);
    const todayCnt = (todayRow as any)?.cnt ?? 0;
    const weekCnt = (weekRow as any)?.cnt ?? 0;
    const monthCnt = (monthRow as any)?.cnt ?? 0;
    const guest = (guestRow as any)?.guest ?? 0;
    const loggedin = (guestRow as any)?.loggedin ?? 0;
    const loginRate = total > 0 ? Math.round(loggedin / total * 100) : 0;

    const pushOptInRate = (funnelRows["push_prompt_shown"] ?? 0) > 0
      ? Math.round((funnelRows["push_prompt_accepted"] ?? 0) / funnelRows["push_prompt_shown"] * 100) : 0;
    const scanConvRate = (funnelRows["scan_start"] ?? 0) > 0
      ? Math.round((funnelRows["scan_complete"] ?? 0) / funnelRows["scan_start"] * 100) : 0;
    const pwaAcceptRate = (funnelRows["pwa_prompt_shown"] ?? 0) > 0
      ? Math.round((funnelRows["pwa_prompt_accepted"] ?? 0) / funnelRows["pwa_prompt_shown"] * 100) : 0;

    const dailyScanArr: any[] = (dailyRows as any)?.results ?? [];
    const maxDaily = Math.max(...dailyScanArr.map((r: any) => r.cnt), 1);
    const maxDAU = Math.max(...dailyActiveRows.map((r: any) => r.sessions), 1);
    const maxEventDaily = Math.max(...eventDailyRows.map((r: any) => r.cnt), 1);

    const scoreDistArr: any[] = (scoreDistRows as any)?.results ?? [];
    const maxScoreDist = Math.max(...scoreDistArr.map((r: any) => r.cnt), 1);

    const genderArr: any[] = (genderRows as any)?.results ?? [];
    const genderTotal = genderArr.reduce((s: number, r: any) => s + r.cnt, 0) || 1;
    const AGE_ORDER = ["10대","20대 초반","20대 후반","30대 초반","30대 후반","40대 초반","40대 후반","50대+"];
    const ageArr: any[] = [...((ageRows as any)?.results ?? [])].sort((a, b) =>
      (AGE_ORDER.indexOf(a.age_group) + 99) % 99 - (AGE_ORDER.indexOf(b.age_group) + 99) % 99
    );

    const scoreColors = ["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#4A7C6E"];

    const TAB_LABEL: Record<string, string> = {
      scan: "스캔", routine: "루틴", diary: "일기", magazine: "매거진", my: "MY",
    };

    const PROVIDER_LABEL: Record<string, string> = {
      kakao: "카카오", google: "Google", line: "LINE",
    };

    const REFERRER_LABEL: Record<string, string> = {
      instagram: "인스타그램", google_search: "구글 검색", direct: "직접 방문",
      twitter: "트위터/X", facebook: "페이스북", naver: "네이버", kakaotalk: "카카오톡",
      youtube: "유튜브", tiktok: "틱톡", blog: "블로그",
    };

    const providerArr: any[] = (providerRows as any)?.results ?? [];
    const providerTotal = providerArr.reduce((s: number, r: any) => s + r.cnt, 0) || 1;
    const providerColors: Record<string, string> = { kakao: "#FEE500", google: "#4285F4", line: "#06C755" };

    // ── 리텐션 계산 ──────────────────────────────────────────────
    const returningUsers = (retentionRow as any)?.returning_users ?? 0;
    const weekUniqueUsers = weekCnt > 0 ? weekCnt : 1; // approximate
    const retentionDailyArr: any[] = (retentionDailyRows as any)?.results ?? [];
    const maxRetentionDaily = Math.max(...retentionDailyArr.map((r: any) => r.users), 1);

    // ── 시간대별 계산 ──────────────────────────────────────────
    const hourlyArr: any[] = (hourlyRows as any)?.results ?? [];
    const maxHourly = Math.max(...hourlyArr.map((r: any) => r.cnt), 1);
    const peakHour = hourlyArr.reduce((best: any, r: any) => r.cnt > (best?.cnt ?? 0) ? r : best, null);

    // ── 실시간 계산 ──────────────────────────────────────────
    const realtimeScans = (realtimeScanRow as any)?.cnt ?? 0;
    const realtimeSessions = (realtimeSessionsRow as any)?.sessions ?? 0;

    // ── 푸시 효과 계산 ──────────────────────────────────────────
    const pushAppOpens7d = (pushAppOpensRow as any)?.opens ?? 0;

    // ── 화장품 카테고리 계산 ──────────────────────────────────────
    const cosmeticsCatArr: any[] = (cosmeticsCategoryRows as any)?.results ?? [];
    const maxCosmeticsCat = Math.max(...cosmeticsCatArr.map((r: any) => r.cnt), 1);

    const maxCity = Math.max(...cityArr.map((r: any) => r.cnt), 1);
    const maxReferrer = Math.max(...referrerArr.map((r: any) => r.cnt), 1);

    const cosmeticsArr: any[] = (cosmeticsListRows as any)?.results ?? [];

    // ── HTML 렌더 ─────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Fonday Admin</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>🌿 Fonday Admin Dashboard</h1>
  <p style="color:#a8a29e;font-size:12px;margin:4px 0 16px">${nowKST()} KST &nbsp;·&nbsp; <a href="" style="color:#4A7C6E;font-weight:700">새로고침</a></p>

  <nav class="nav">
    <a href="#overview">개요</a>
    <a href="#funnel">퍼널</a>
    <a href="#scan">스캔 분석</a>
    <a href="#users">유저 분석</a>
    <a href="#location">접속 지역</a>
    <a href="#referrer">유입 경로</a>
    <a href="#cosmetics">화장품</a>
    <a href="#retention">리텐션</a>
    <a href="#timepattern">시간대</a>
    <a href="#features">피처 사용률</a>
    <a href="#engagement">참여도</a>
    <a href="#recent">최근 스캔</a>
  </nav>

  <!-- ═══ 개요 ═══════════════════════════════════════════════════ -->
  <div id="overview" class="section">
    <h2>개요</h2>
    <div class="cards">
      <div class="card" style="border:2px solid #4A7C6E;background:#ecfdf5">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e"></span>
          <span style="font-size:11px;font-weight:700;color:#4A7C6E">실시간</span>
        </div>
        <div class="num" style="margin-top:6px">${realtimeSessions > 0 ? realtimeSessions : realtimeScans}</div>
        <div class="label">${realtimeSessions > 0 ? realtimeSessions + '명 접속 중 (15분)' : realtimeScans + '건 스캔 (1시간)'}</div>
      </div>
      <div class="card"><div class="num">${total.toLocaleString()}</div><div class="label">전체 스캔</div></div>
      <div class="card"><div class="num">${todayCnt}</div><div class="label">오늘 스캔 (KST)</div></div>
      <div class="card"><div class="num">${weekCnt}</div><div class="label">7일 스캔</div><div class="sub">${monthCnt} / 30일</div></div>
      <div class="card"><div class="num">${pushCount}</div><div class="label">푸시 구독자</div></div>
      <div class="card"><div class="num">${avgScore}</div><div class="label">평균 점수</div><div class="sub">${(scoreMetricsRows as any)?.min ?? 0} ~ ${(scoreMetricsRows as any)?.max ?? 0}</div></div>
      <div class="card"><div class="num">${loggedin}</div><div class="label">로그인 스캔</div><div class="sub">${loginRate}% 전환율</div></div>
      <div class="card"><div class="num">${guest}</div><div class="label">비로그인 스캔</div></div>
      <div class="card"><div class="num">${(diaryCountRow as any)?.cnt ?? 0}</div><div class="label">일기 항목</div><div class="sub">${(cosmeticsCountRow as any)?.cnt ?? 0} 화장품</div></div>
    </div>
  </div>

  <!-- ═══ 퍼널 ════════════════════════════════════════════════════ -->
  <div id="funnel" class="section">
    <h2>전환 퍼널 ${!eventsExist ? '<span style="color:#f59e0b;font-weight:600">(events 테이블 미생성 — /api/admin/d1-migrate4 실행 필요)</span>' : ''}</h2>
    <div class="panel">
      <h3>스캔 퍼널</h3>
      <div class="funnel">
        <div class="funnel-step">
          <div class="funnel-num">${(funnelRows["app_open"] ?? 0).toLocaleString()}</div>
          <div class="funnel-label">앱 오픈</div>
        </div>
        <div class="funnel-step">
          <div class="funnel-num">${(funnelRows["scan_start"] ?? 0).toLocaleString()}</div>
          <div class="funnel-label">스캔 시작</div>
          <div class="funnel-rate">${(funnelRows["app_open"] ?? 0) > 0 ? Math.round((funnelRows["scan_start"] ?? 0) / funnelRows["app_open"] * 100) : 0}%</div>
        </div>
        <div class="funnel-step">
          <div class="funnel-num">${(funnelRows["scan_complete"] ?? 0).toLocaleString()}</div>
          <div class="funnel-label">스캔 완료</div>
          <div class="funnel-rate">${scanConvRate}%</div>
        </div>
        <div class="funnel-step" style="background:#fef3c7">
          <div class="funnel-num" style="color:#92400e">${(funnelRows["scan_fail"] ?? 0).toLocaleString()}</div>
          <div class="funnel-label">스캔 실패</div>
          <div class="funnel-rate" style="color:#ef4444">${(funnelRows["scan_start"] ?? 0) > 0 ? Math.round((funnelRows["scan_fail"] ?? 0) / funnelRows["scan_start"] * 100) : 0}%</div>
        </div>
      </div>
    </div>
    <div class="grid2" style="margin-top:10px">
      <div class="panel">
        <h3>푸시 알림 퍼널</h3>
        <div class="funnel">
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["push_prompt_shown"] ?? 0)}</div><div class="funnel-label">프롬프트 노출</div></div>
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["push_prompt_accepted"] ?? 0)}</div><div class="funnel-label">수락</div><div class="funnel-rate">${pushOptInRate}%</div></div>
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["push_prompt_dismissed"] ?? 0)}</div><div class="funnel-label">거절</div></div>
        </div>
      </div>
      <div class="panel">
        <h3>PWA 설치 퍼널</h3>
        <div class="funnel">
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["pwa_prompt_shown"] ?? 0)}</div><div class="funnel-label">설치 프롬프트</div></div>
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["pwa_prompt_accepted"] ?? 0)}</div><div class="funnel-label">설치 수락</div><div class="funnel-rate">${pwaAcceptRate}%</div></div>
          <div class="funnel-step"><div class="funnel-num">${(funnelRows["pwa_prompt_dismissed"] ?? 0)}</div><div class="funnel-label">거절</div></div>
        </div>
      </div>
    </div>

    <!-- 이탈 지점 분석 -->
    <div class="panel" style="margin-top:10px">
      <h3>이탈 지점 분석 (DROP-OFF)</h3>
      ${!eventsExist
        ? '<p style="font-size:12px;color:#a8a29e;margin:0">이벤트 추적 미설정 — /api/admin/d1-migrate4 실행 필요</p>'
        : (() => {
            const steps = [
              { key: "app_open", label: "앱 오픈" },
              { key: "scan_start", label: "스캔 시작" },
              { key: "scan_complete", label: "스캔 완료" },
            ];
            const stepValues = steps.map(s => ({ ...s, cnt: funnelRows[s.key] ?? 0 }));
            return '<div style="display:flex;flex-direction:column;gap:6px">' +
              stepValues.map((s, i) => {
                const prevCnt = i > 0 ? stepValues[i - 1].cnt : s.cnt;
                const convRate = prevCnt > 0 ? Math.round(s.cnt / prevCnt * 100) : 0;
                const dropRate = i > 0 ? (100 - convRate) : 0;
                const barWidth = stepValues[0].cnt > 0 ? Math.round(s.cnt / stepValues[0].cnt * 100) : 0;
                return '<div style="display:flex;align-items:center;gap:10px">' +
                  '<div style="width:80px;text-align:right;font-size:11px;font-weight:600;color:#78716c">' + s.label + '</div>' +
                  '<div style="flex:1;background:#f5f5f4;border-radius:6px;height:28px;position:relative;overflow:hidden">' +
                    '<div style="height:100%;background:' + (i === 0 ? '#4A7C6E' : '#4A7C6E') + ';width:' + barWidth + '%;border-radius:6px;display:flex;align-items:center;padding:0 8px">' +
                      '<span style="font-size:11px;font-weight:700;color:white">' + s.cnt.toLocaleString() + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<div style="width:60px;font-size:11px;text-align:right">' +
                    (i > 0 ? '<span style="color:#ef4444;font-weight:700">-' + dropRate + '%</span>' : '') +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>';
          })()
      }
    </div>
  </div>

  <!-- ═══ 스캔 분석 ════════════════════════════════════════════════ -->
  <div id="scan" class="section">
    <h2>스캔 분석</h2>
    <div class="grid2">
      <div class="panel">
        <h3>30일 일별 스캔 추이</h3>
        <div class="chart">
          ${dailyScanArr.map((r: any) => `
            <div class="chart-col">
              <div class="chart-bar" style="height:${Math.round(r.cnt / maxDaily * 64)}px" title="${r.day}: ${r.cnt}건"></div>
              <div class="chart-label">${(r.day ?? "").slice(5)}</div>
            </div>`).join("") || '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'}
        </div>
      </div>
      <div class="panel">
        <h3>점수 분포</h3>
        <div class="score-dist">
          ${scoreDistArr.map((r: any) => {
            const bucket = Number(r.bucket);
            const color = scoreColors[Math.min(Math.floor(bucket / 10), 9)];
            return `<div class="score-col">
              <div class="score-bar" style="background:${color};height:${Math.round(r.cnt / maxScoreDist * 50)}px" title="${bucket}~${bucket+9}점: ${r.cnt}명"></div>
              <div class="score-label">${bucket}</div>
            </div>`;
          }).join("") || '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'}
        </div>
      </div>
    </div>
    <div class="grid3" style="margin-top:10px">
      <div class="panel">
        <h3>바우만 타입 TOP8</h3>
        <div class="bar-wrap">
          ${((baumannRows as any)?.results ?? []).map((r: any) => {
            const pct = total > 0 ? Math.round(r.cnt / total * 100) : 0;
            return `<div class="bar-row">
              <div class="bar-label">${r.baumann_type || "??"}</div>
              <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
              <div class="bar-val">${r.cnt}</div>
              <div class="bar-pct">${pct}%</div>
            </div>`;
          }).join("") || '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'}
        </div>
      </div>
      <div class="panel">
        <h3>성별 분포</h3>
        <div class="bar-wrap">
          ${genderArr.map((r: any) => {
            const pct = Math.round(r.cnt / genderTotal * 100);
            const color = r.gender === "female" ? "#ec4899" : r.gender === "male" ? "#6366f1" : "#4A7C6E";
            const label = r.gender === "female" ? "여성" : r.gender === "male" ? "남성" : r.gender;
            return `<div class="bar-row">
              <div class="bar-label">${label}</div>
              <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
              <div class="bar-val">${r.cnt}</div>
              <div class="bar-pct">${pct}%</div>
            </div>`;
          }).join("") || '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'}
        </div>
      </div>
      <div class="panel">
        <h3>나이대 분포</h3>
        <div class="bar-wrap">
          ${ageArr.length === 0
            ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
            : ageArr.map((r: any) => {
                const ageTotal2 = ageArr.reduce((s: number, x: any) => s + x.cnt, 0) || 1;
                const pct = Math.round(r.cnt / ageTotal2 * 100);
                return `<div class="bar-row">
                  <div class="bar-label-wide">${r.age_group}</div>
                  <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
                  <div class="bar-val">${r.cnt}</div>
                  <div class="bar-pct">${pct}%</div>
                </div>`;
              }).join("")
          }
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ 유저 분석 ════════════════════════════════════════════════ -->
  <div id="users" class="section">
    <h2>유저 분석</h2>
    <div class="grid3">
      <div class="panel">
        <h3>언어 분포</h3>
        <div class="pie-row">
          ${((langRows as any)?.results ?? []).map((r: any, i: number) => {
            const colors = ["#4A7C6E","#f59e0b","#6366f1","#ef4444","#10b981"];
            const langTotal = ((langRows as any)?.results ?? []).reduce((s: number, x: any) => s + x.cnt, 0) || 1;
            const pct = Math.round(r.cnt / langTotal * 100);
            return `<div class="pie-item"><div class="dot" style="background:${colors[i % colors.length]}"></div>${(r.lang ?? "ko").toUpperCase()} ${r.cnt} (${pct}%)</div>`;
          }).join("")}
        </div>
        <div class="bar-wrap" style="margin-top:10px">
          ${((langRows as any)?.results ?? []).map((r: any) => {
            const langTotal = ((langRows as any)?.results ?? []).reduce((s: number, x: any) => s + x.cnt, 0) || 1;
            const pct = Math.round(r.cnt / langTotal * 100);
            const colors: Record<string,string> = { ko: "#4A7C6E", en: "#f59e0b", ja: "#6366f1" };
            const color = colors[r.lang ?? "ko"] ?? "#4A7C6E";
            return `<div class="bar-row">
              <div class="bar-label">${(r.lang ?? "ko").toUpperCase()}</div>
              <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
              <div class="bar-val">${r.cnt}</div>
            </div>`;
          }).join("")}
        </div>
      </div>
      <div class="panel">
        <h3>로그인 vs 게스트</h3>
        <div style="margin-top:8px">
          <div class="metric-row">
            <span>로그인 스캔</span>
            <span style="font-weight:700;color:#4A7C6E">${loggedin} (${loginRate}%)</span>
          </div>
          <div class="metric-row">
            <span>게스트 스캔</span>
            <span style="font-weight:700;color:#92400e">${guest} (${100 - loginRate}%)</span>
          </div>
          <div class="metric-row">
            <span>푸시 구독자</span>
            <span style="font-weight:700;color:#6366f1">${pushCount}</span>
          </div>
          <div class="metric-row">
            <span>푸시 옵트인율</span>
            <span style="font-weight:700;color:#f59e0b">${pushOptInRate}%</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <h3>수익화 신호</h3>
        <div style="margin-top:8px">
          <div class="metric-row">
            <span>화장품 등록 수</span>
            <span style="font-weight:700">${(cosmeticsCountRow as any)?.cnt ?? 0}</span>
          </div>
          <div class="metric-row">
            <span>일기 항목 수</span>
            <span style="font-weight:700">${(diaryCountRow as any)?.cnt ?? 0}</span>
          </div>
          <div class="metric-row">
            <span>스캔 완료율</span>
            <span style="font-weight:700;color:#10b981">${scanConvRate}%</span>
          </div>
          <div class="metric-row">
            <span>PWA 설치 전환율</span>
            <span style="font-weight:700;color:#6366f1">${pwaAcceptRate}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 로그인 방식 분포 -->
    <div class="panel" style="margin-top:10px">
      <h3>로그인 방식 분포</h3>
      ${providerArr.length === 0
        ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
        : `<div class="bar-wrap">
            ${providerArr.map((r: any) => {
              const pct = Math.round(r.cnt / providerTotal * 100);
              const color = providerColors[r.provider] ?? "#4A7C6E";
              const label = PROVIDER_LABEL[r.provider] ?? r.provider;
              return `<div class="bar-row">
                <div class="bar-label">${label}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
                <div class="bar-val">${r.cnt}</div>
                <div class="bar-pct">${pct}%</div>
              </div>`;
            }).join("")}
          </div>`
      }
    </div>
  </div>

  <!-- ═══ 리텐션 ═══════════════════════════════════════════════════ -->
  <div id="retention" class="section">
    <h2>리텐션 (재방문율)</h2>
    <div class="grid2">
      <div class="panel">
        <h3>7일 재방문율</h3>
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:40px;font-weight:900;color:#4A7C6E">${returningUsers}</div>
          <div style="font-size:12px;color:#78716c;margin-top:4px">7일 내 2회 이상 스캔 유저</div>
        </div>
      </div>
      <div class="panel">
        <h3>30일 일별 신규 vs 재방문</h3>
        <div class="chart">
          ${retentionDailyArr.length === 0
            ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
            : retentionDailyArr.map((r: any) => {
                const newUsers = (r.users ?? 0) - (r.returning ?? 0);
                const totalH = Math.round((r.users ?? 0) / maxRetentionDaily * 64);
                const retH = Math.round((r.returning ?? 0) / maxRetentionDaily * 64);
                const newH = totalH - retH;
                return '<div class="chart-col">' +
                  '<div style="display:flex;flex-direction:column;align-items:center;width:100%">' +
                    '<div style="width:100%;background:#f59e0b;border-radius:3px 3px 0 0;height:' + newH + 'px" title="' + (r.day ?? '') + ': 신규 ' + newUsers + '"></div>' +
                    '<div style="width:100%;background:#4A7C6E;height:' + retH + 'px" title="' + (r.day ?? '') + ': 재방문 ' + (r.returning ?? 0) + '"></div>' +
                  '</div>' +
                  '<div class="chart-label">' + ((r.day ?? '').slice(5)) + '</div>' +
                '</div>';
              }).join('')
          }
        </div>
        <div style="display:flex;gap:12px;margin-top:8px">
          <div style="display:flex;align-items:center;gap:4px;font-size:10px"><div style="width:10px;height:10px;border-radius:2px;background:#f59e0b"></div>신규</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px"><div style="width:10px;height:10px;border-radius:2px;background:#4A7C6E"></div>재방문</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ 시간대별 사용 패턴 ═══════════════════════════════════════ -->
  <div id="timepattern" class="section">
    <h2>시간대별 사용 패턴 (KST)</h2>
    <div class="panel">
      <h3>24시간 스캔 분포 ${peakHour ? '&nbsp;<span style="color:#f59e0b;font-weight:700">피크: ' + peakHour.hour + '시 (' + peakHour.cnt + '건)</span>' : ''}</h3>
      <div style="display:flex;align-items:flex-end;gap:2px;height:100px;margin-top:8px">
        ${(() => {
          const fullHours = Array.from({length: 24}, (_, i) => {
            const match = hourlyArr.find((r: any) => r.hour === i);
            return { hour: i, cnt: match?.cnt ?? 0 };
          });
          return fullHours.map((r: any) => {
            const isPeak = peakHour && r.hour === peakHour.hour;
            const barH = Math.round(r.cnt / maxHourly * 88);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">' +
              '<div style="font-size:8px;color:#78716c;font-weight:600">' + (r.cnt > 0 ? r.cnt : '') + '</div>' +
              '<div style="width:100%;background:' + (isPeak ? '#f59e0b' : '#4A7C6E') + ';border-radius:3px 3px 0 0;height:' + barH + 'px;min-height:2px"></div>' +
              '<div style="font-size:8px;color:#a8a29e">' + r.hour + '</div>' +
            '</div>';
          }).join('');
        })()}
      </div>
    </div>
  </div>

  <!-- ═══ 접속 지역 ═══════════════════════════════════════════════ -->
  <div id="location" class="section">
    <h2>접속 지역 TOP15</h2>
    <div class="panel">
      <h3>도시별 스캔 수</h3>
      ${!cityDataAvailable
        ? '<p style="font-size:12px;color:#a8a29e;margin:0">데이터 수집 중</p>'
        : `<div class="bar-wrap">
            ${cityArr.map((r: any) => {
              const pct = Math.round(r.cnt / maxCity * 100);
              return `<div class="bar-row">
                <div class="bar-label-wide">${r.city}${r.country ? ' (' + r.country + ')' : ''}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
                <div class="bar-val">${r.cnt}</div>
              </div>`;
            }).join("")}
          </div>`
      }
    </div>
  </div>

  <!-- ═══ 유입 경로 ═══════════════════════════════════════════════ -->
  <div id="referrer" class="section">
    <h2>유입 경로 분석</h2>
    <div class="panel">
      <h3>유입 경로별 스캔 수</h3>
      ${!referrerDataAvailable
        ? '<p style="font-size:12px;color:#a8a29e;margin:0">데이터 수집 중</p>'
        : `<div class="bar-wrap">
            ${referrerArr.map((r: any) => {
              const pct = Math.round(r.cnt / maxReferrer * 100);
              const label = REFERRER_LABEL[r.referrer] ?? r.referrer;
              return `<div class="bar-row">
                <div class="bar-label-wide">${label}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:#6366f1"></div></div>
                <div class="bar-val">${r.cnt}</div>
              </div>`;
            }).join("")}
          </div>`
      }
    </div>
  </div>

  <!-- ═══ 화장품 등록 현황 (유저별 접기/펼치기) ═══════════════════ -->
  <div id="cosmetics" class="section">
    <h2>화장품 등록 현황</h2>

    <!-- 카테고리별 분포 -->
    <div class="panel" style="margin-bottom:10px">
      <h3>카테고리별 등록 수</h3>
      ${cosmeticsCatArr.length === 0
        ? '<p style="font-size:11px;color:#a8a29e;margin:0">등록된 화장품 없음</p>'
        : '<div class="bar-wrap">' +
            cosmeticsCatArr.map((r: any) => {
              const pct = Math.round(r.cnt / maxCosmeticsCat * 100);
              return '<div class="bar-row">' +
                '<div class="bar-label-wide">' + (r.category || "미분류") + '</div>' +
                '<div class="bar-bg"><div class="bar-fill" style="width:' + pct + '%;background:#7C3AED"></div></div>' +
                '<div class="bar-val">' + r.cnt + '</div>' +
              '</div>';
            }).join('') +
          '</div>'
      }
    </div>
    ${cosmeticsArr.length === 0
      ? '<p style="font-size:12px;color:#a8a29e;margin:0">등록된 화장품 없음</p>'
      : (() => {
          // 유저별 그룹핑
          const userMap = new Map<string, any[]>();
          for (const r of cosmeticsArr) {
            const uid = r.user_id || "unknown";
            if (!userMap.has(uid)) userMap.set(uid, []);
            userMap.get(uid)!.push(r);
          }
          return Array.from(userMap.entries()).map(([uid, items], idx) => {
            const shortId = uid.slice(0, 12) + "...";
            const provider = items[0]?.provider || "";
            const providerBadge = provider === "kakao" ? "badge-kakao" : provider === "google" ? "badge-google" : provider === "line" ? "badge-line" : "";
            const providerLabel = provider ? (PROVIDER_LABEL[provider] ?? provider) : "";
            return `
            <div class="panel" style="margin-bottom:8px">
              <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer" onclick="var el=document.getElementById('cosm-${idx}');el.style.display=el.style.display==='none'?'':'none';this.querySelector('.toggle-icon').textContent=el.style.display==='none'?'▶':'▼'">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="toggle-icon" style="font-size:10px;color:#a8a29e">▶</span>
                  <span style="font-size:12px;font-weight:700;color:#78716c" title="${uid}">${shortId}</span>
                  ${providerLabel ? '<span class="badge ' + providerBadge + '">' + providerLabel + '</span>' : ''}
                  <span class="badge">${items.length}개 등록</span>
                </div>
                <span style="font-size:11px;color:#a8a29e">${toKST(items[0]?.created_at).slice(0, 10)}</span>
              </div>
              <div id="cosm-${idx}" style="display:none;margin-top:10px">
                <table style="box-shadow:none">
                  <tr><th>제품명</th><th>브랜드</th><th>카테고리</th><th>시간대</th><th>등록일</th></tr>
                  ${items.map((r: any) => `
                    <tr>
                      <td><strong>${r.name || "-"}</strong></td>
                      <td>${r.brand || "-"}</td>
                      <td><span class="badge">${r.category || "-"}</span></td>
                      <td style="font-size:11px">${r.time_of_day === "am" ? "🌅 아침" : r.time_of_day === "pm" ? "🌙 저녁" : "종일"}</td>
                      <td style="color:#a8a29e;font-size:11px">${toKST(r.created_at)}</td>
                    </tr>`).join("")}
                </table>
              </div>
            </div>`;
          }).join("");
        })()
    }
  </div>

  <!-- ═══ 피처 사용률 ══════════════════════════════════════════════ -->
  <div id="features" class="section">
    <h2>피처 사용률 ${!eventsExist ? '<span style="color:#f59e0b;font-weight:600">(events 테이블 필요)</span>' : ''}</h2>
    <div class="grid2">
      <div class="panel">
        <h3>탭 방문 비율</h3>
        ${tabRows.length === 0
          ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
          : (() => {
              const tabTotal = tabRows.reduce((s: number, r: any) => s + r.cnt, 0) || 1;
              const tabColors: Record<string,string> = { scan: "#4A7C6E", routine: "#f59e0b", diary: "#6366f1", magazine: "#ec4899", my: "#10b981" };
              return `<div class="bar-wrap">
                ${tabRows.map((r: any) => {
                  const pct = Math.round(r.cnt / tabTotal * 100);
                  const color = tabColors[r.tab] ?? "#4A7C6E";
                  return `<div class="bar-row">
                    <div class="bar-label">${TAB_LABEL[r.tab] ?? r.tab}</div>
                    <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
                    <div class="bar-val">${r.cnt}</div>
                    <div class="bar-pct">${pct}%</div>
                  </div>`;
                }).join("")}
              </div>`;
            })()
        }
      </div>
      <div class="panel">
        <h3>피처 사용 TOP10</h3>
        ${featureRows.length === 0
          ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
          : (() => {
              const featureTotal = featureRows.reduce((s: number, r: any) => s + r.cnt, 0) || 1;
              return `<div class="bar-wrap">
                ${featureRows.filter((r: any) => r.feature).map((r: any) => {
                  const pct = Math.round(r.cnt / featureTotal * 100);
                  return `<div class="bar-row">
                    <div class="bar-label">${r.feature}</div>
                    <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
                    <div class="bar-val">${r.cnt}</div>
                    <div class="bar-pct">${pct}%</div>
                  </div>`;
                }).join("")}
              </div>`;
            })()
        }
      </div>
    </div>
  </div>

  <!-- ═══ 참여도 ════════════════════════════════════════════════════ -->
  <div id="engagement" class="section">
    <h2>참여도 & 활성 유저 ${!eventsExist ? '<span style="color:#f59e0b;font-weight:600">(events 테이블 필요)</span>' : ''}</h2>

    <!-- 푸시 알림 효과 -->
    <div class="panel" style="margin-bottom:10px">
      <h3>푸시 알림 효과</h3>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">
        <div style="flex:1;min-width:120px;background:#f5f5f4;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#6366f1">${pushCount}</div>
          <div style="font-size:11px;color:#78716c;margin-top:4px">푸시 구독자</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f5f5f4;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#4A7C6E">${eventsExist ? pushAppOpens7d : '-'}</div>
          <div style="font-size:11px;color:#78716c;margin-top:4px">7일 앱 오픈 수</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f5f5f4;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#f59e0b">${pushCount > 0 && eventsExist ? Math.round(pushAppOpens7d / pushCount * 100) + '%' : '-'}</div>
          <div style="font-size:11px;color:#78716c;margin-top:4px">구독자 대비 오픈율</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f5f5f4;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:#10b981">${weekCnt > 0 ? (pushCount / weekCnt * 100).toFixed(1) + '%' : '-'}</div>
          <div style="font-size:11px;color:#78716c;margin-top:4px">7일 스캔 대비 구독률</div>
        </div>
      </div>
      ${!eventsExist ? '<p style="font-size:11px;color:#f59e0b;margin:8px 0 0">이벤트 추적 미설정 — 푸시 구독자 수와 스캔 빈도만 표시</p>' : ''}
    </div>

    <div class="grid2">
      <div class="panel">
        <h3>30일 DAU (세션 기준)</h3>
        <div class="chart">
          ${dailyActiveRows.length === 0
            ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
            : dailyActiveRows.map((r: any) => `
                <div class="chart-col">
                  <div class="chart-bar" style="height:${Math.round(r.sessions / maxDAU * 64)}px;background:#6366f1" title="${r.day}: ${r.sessions} 세션, ${r.users ?? 0} 로그인유저"></div>
                  <div class="chart-label">${(r.day ?? "").slice(5)}</div>
                </div>`).join("")
          }
        </div>
      </div>
      <div class="panel">
        <h3>30일 이벤트 발생 추이</h3>
        <div class="chart">
          ${eventDailyRows.length === 0
            ? '<p style="font-size:11px;color:#a8a29e;margin:0">데이터 없음</p>'
            : eventDailyRows.map((r: any) => `
                <div class="chart-col">
                  <div class="chart-bar" style="height:${Math.round(r.cnt / maxEventDaily * 64)}px;background:#f59e0b" title="${r.day}: ${r.cnt}건"></div>
                  <div class="chart-label">${(r.day ?? "").slice(5)}</div>
                </div>`).join("")
          }
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ 최근 스캔 ════════════════════════════════════════════════ -->
  <div id="recent" class="section">
    <h2>최근 스캔 100건</h2>
    <div class="date-filter">
      <label style="font-size:12px;font-weight:700;color:#78716c">필터:</label>
      <input type="date" id="scanDateFilter" onchange="filterScans()" />
      <select id="loginFilter" onchange="filterScans()" style="padding:6px 10px;border:1.5px solid #e7e5e4;border-radius:8px;font-size:12px;background:white">
        <option value="">전체</option>
        <option value="login">로그인만</option>
        <option value="guest">비로그인만</option>
      </select>
      <select id="providerFilter" onchange="filterScans()" style="padding:6px 10px;border:1.5px solid #e7e5e4;border-radius:8px;font-size:12px;background:white">
        <option value="">전체 로그인방식</option>
        <option value="kakao">카카오</option>
        <option value="google">Google</option>
        <option value="line">LINE</option>
      </select>
      <button onclick="document.getElementById('scanDateFilter').value='';document.getElementById('loginFilter').value='';document.getElementById('providerFilter').value='';filterScans()">초기화</button>
      <span id="filterCount" style="font-size:11px;color:#a8a29e;margin-left:8px"></span>
    </div>
    <div id="scanTable">
      ${((recentRows as any)?.results ?? []).map((r: any, idx: number) => {
        const kstTime = toKST(r.created_at);
        const dateStr = kstTime.slice(0, 10);
        const providerLabel = r.provider ? (PROVIDER_LABEL[r.provider] ?? r.provider) : "";
        const providerBadge = r.provider === "kakao" ? "badge-kakao" : r.provider === "google" ? "badge-google" : r.provider === "line" ? "badge-line" : "";
        const cityDisplay = r.city ? (r.city + (r.country ? ' (' + r.country + ')' : '')) : "";
        const referrerDisplay = r.referrer ? (REFERRER_LABEL[r.referrer] ?? r.referrer) : "";
        const userId = r.user_id || "";
        const shortUserId = userId.length > 12 ? userId.slice(0, 12) + "..." : userId;
        // device_info 파싱
        let device: any = {};
        try { device = JSON.parse(r.device_info || "{}"); } catch {}
        // scores 파싱
        let scoreItems: any[] = [];
        try { scoreItems = JSON.parse(r.scores || "[]"); } catch {}
        return `
        <div class="panel scan-row" data-date="${dateStr}" data-login="${r.is_guest ? 'guest' : 'login'}" data-provider="${r.provider || ''}" style="margin-bottom:6px;padding:10px 14px;cursor:pointer" onclick="var d=document.getElementById('sd-${idx}');d.style.display=d.style.display==='none'?'':'none';this.querySelector('.stoggle').textContent=d.style.display==='none'?'▶':'▼'">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="stoggle" style="font-size:10px;color:#a8a29e">▶</span>
              <strong style="font-size:16px;color:#4A7C6E">${r.overall_score}</strong>
              <span class="badge">${r.baumann_type || "?"}</span>
              <span class="badge ${r.is_guest ? 'badge-guest' : ''}">${r.is_guest ? '비로그인' : '로그인'}</span>
              ${providerLabel ? '<span class="badge ' + providerBadge + '">' + providerLabel + '</span>' : ''}
              ${cityDisplay ? '<span style="font-size:11px;color:#78716c">' + cityDisplay + '</span>' : ''}
            </div>
            <span style="font-size:11px;color:#a8a29e">${kstTime}</span>
          </div>
          <div id="sd-${idx}" style="display:none;margin-top:12px" onclick="event.stopPropagation()">
            <div class="grid3" style="gap:8px;margin-bottom:10px">
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">유저 ID</div>
                <div style="font-size:12px;font-weight:600;margin-top:4px;word-break:break-all" title="${userId}">${shortUserId || "-"}</div>
              </div>
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">피부나이</div>
                <div style="font-size:16px;font-weight:700;color:#7C3AED;margin-top:4px">${r.skin_age ?? "-"}</div>
              </div>
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">성별 / 나이대</div>
                <div style="font-size:12px;font-weight:600;margin-top:4px">${r.gender === "female" ? "여성" : r.gender === "male" ? "남성" : "-"} · ${r.age_group || "-"}</div>
              </div>
            </div>
            <div class="grid3" style="gap:8px;margin-bottom:10px">
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">언어</div>
                <div style="font-size:12px;font-weight:600;margin-top:4px">${(r.lang ?? "ko").toUpperCase()}</div>
              </div>
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">유입 경로</div>
                <div style="font-size:12px;font-weight:600;margin-top:4px">${referrerDisplay || "-"}</div>
              </div>
              <div style="background:#f5f5f4;border-radius:10px;padding:10px">
                <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700">기기</div>
                <div style="font-size:12px;font-weight:600;margin-top:4px">${device.os || "-"} · ${device.browser || "-"} · ${device.deviceType || "-"}</div>
              </div>
            </div>
            ${scoreItems.length > 1 ? `
              <div style="font-size:10px;color:#a8a29e;text-transform:uppercase;font-weight:700;margin-bottom:6px">10개 항목 점수</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${scoreItems.map((s: any) => `
                  <span style="font-size:11px;padding:3px 8px;border-radius:20px;background:#f5f5f4;font-weight:600">
                    ${s.label?.replace(/\s/g,'') ?? '?'} <strong style="color:#4A7C6E">${s.score ?? '-'}</strong>
                  </span>
                `).join("")}
              </div>
            ` : ''}
          </div>
        </div>`;
      }).join("")}
    </div>
  </div>

  <!-- ═══ 데이터 초기화 ══════════════════════════════════════════════ -->
  <div style="margin-top:48px;padding:20px;background:#fff5f5;border-radius:14px;border:1.5px solid #fecaca">
    <h2 style="margin:0 0 6px;color:#b91c1c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">⚠️ 위험 구역 — 전체 데이터 초기화</h2>
    <p style="font-size:12px;color:#78716c;margin:0 0 14px">스캔, 일기, 화장품, 이벤트, 푸시 구독이 <strong>모두 삭제</strong>됩니다. 복구 불가합니다.</p>
    <form method="POST" action="/api/admin/reset-data"
      onsubmit="return confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')">
      <input type="hidden" name="key" value="${key}" />
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input
          type="text" name="confirm" placeholder="전체초기화 입력 후 버튼 클릭"
          style="flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #fca5a5;border-radius:10px;font-size:13px;outline:none;background:white"
        />
        <button type="submit"
          style="padding:10px 20px;background:#ef4444;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">
          전체 초기화
        </button>
      </div>
      <p style="font-size:11px;color:#a8a29e;margin:8px 0 0">입력란에 <code style="background:#f5f5f4;padding:1px 5px;border-radius:4px">전체초기화</code> 를 정확히 입력해야 실행됩니다</p>
    </form>
  </div>

  <p style="margin-top:24px;font-size:11px;color:#d4d4d4;text-align:center">
    Fonday Admin · events 테이블 미생성 시: POST /api/admin/d1-migrate4
  </p>

  <script>
    function filterScans() {
      var dateVal = document.getElementById('scanDateFilter').value;
      var loginVal = document.getElementById('loginFilter').value;
      var providerVal = document.getElementById('providerFilter').value;
      var rows = document.querySelectorAll('#scanTable .scan-row');
      var shown = 0;
      for (var i = 0; i < rows.length; i++) {
        var rowDate = rows[i].getAttribute('data-date');
        var rowLogin = rows[i].getAttribute('data-login');
        var rowProvider = rows[i].getAttribute('data-provider');
        var match = true;
        if (dateVal && rowDate !== dateVal) match = false;
        if (loginVal && rowLogin !== loginVal) match = false;
        if (providerVal && rowProvider !== providerVal) match = false;
        rows[i].style.display = match ? '' : 'none';
        if (match) shown++;
      }
      var counter = document.getElementById('filterCount');
      if (counter) counter.textContent = shown + '건 표시';
    }
  </script>
</body>
</html>`;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });

  } catch (e: any) {
    console.error("Admin stats error:", e);
    return new Response(`<pre style="font-family:monospace;padding:24px;background:#faf9f6">Error: ${e?.message ?? "unknown"}</pre>`, {
      status: 500, headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
};
