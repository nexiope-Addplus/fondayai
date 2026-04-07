/**
 * GET /api/admin/insta-dashboard?key=ADMIN_KEY
 * 인스타 콘텐츠 관리 대시보드 (HTML)
 * - 생성된 콘텐츠 목록
 * - 콘텐츠 생성 버튼
 * - 이미지 생성 + 다운로드
 */

interface Env {
  FONDAY_DB: D1Database;
  ADMIN_KEY?: string;
}

function toKST(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 16).replace("T", " ");
  } catch { return isoStr.slice(0, 16); }
}

const CSS = `
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif; max-width: 960px; margin: 0 auto; padding: 24px 20px 80px; background: #faf9f6; color: #1c1917; }
h1 { font-size: 22px; font-weight: 900; color: #E94560; margin: 0 0 4px; }
.subtitle { font-size: 12px; color: #a8a29e; margin-bottom: 20px; }
h2 { font-size: 11px; font-weight: 700; color: #a8a29e; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: .08em; }
.actions { display: flex; gap: 10px; margin: 16px 0; }
.btn { padding: 10px 20px; border-radius: 10px; border: none; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn-primary { background: #E94560; color: white; }
.btn-primary:hover { background: #d13a54; }
.btn-secondary { background: #4F46E5; color: white; }
.btn-secondary:hover { background: #4338CA; }
.btn-sm { padding: 6px 12px; font-size: 11px; border-radius: 8px; }
.content-card { background: white; border-radius: 14px; padding: 20px; margin-bottom: 12px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.content-meta { display: flex; gap: 8px; align-items: center; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.badge-carousel { background: #EEF2FF; color: #4F46E5; }
.badge-reels { background: #FEF3C7; color: #92400E; }
.badge-pillar { background: #ECFDF5; color: #065F46; }
.hook { font-size: 16px; font-weight: 700; color: #1A1A2E; margin-bottom: 8px; }
.slide { font-size: 12px; color: #6B6860; padding: 6px 0; border-bottom: 1px solid #f5f5f4; }
.slide-title { font-weight: 600; color: #1c1917; }
.caption-box { background: #f5f5f4; border-radius: 8px; padding: 12px; font-size: 12px; color: #44403c; margin-top: 10px; white-space: pre-wrap; }
.hashtags { font-size: 11px; color: #4F46E5; margin-top: 6px; }
.images-row { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; }
.images-row img { width: 150px; height: 150px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 1px solid #e5e5e5; }
.preview-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
.preview-overlay img { max-width: 90vw; max-height: 75vh; border-radius: 12px; }
.preview-actions { display: flex; gap: 12px; }
.preview-close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 32px; cursor: pointer; }
.status-draft { color: #a8a29e; }
.status-published { color: #16a34a; }
.date-group { font-size: 14px; font-weight: 700; color: #E94560; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #E94560; }
#loading { display: none; padding: 20px; text-align: center; color: #a8a29e; }
`;

const PILLAR_LABELS: Record<string, string> = {
  "data-insight": "📊 데이터",
  "skin-tip": "💡 피부 팁",
  "ingredient-compare": "🧴 성분 비교",
  "app-cta": "📱 앱 유도",
};

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

  const url = new URL(request.url);
  const adminKey = env.ADMIN_KEY;
  if (!adminKey) return new Response("No admin key", { status: 500 });

  const cookies = request.headers.get("cookie") || "";
  const cookieMatch = cookies.match(/fonday-admin=([a-zA-Z0-9_\-]+)/);
  const keyParam = url.searchParams.get("key");
  const isAuthed = (cookieMatch && cookieMatch[1] === adminKey) || keyParam === adminKey;
  if (!isAuthed) return new Response("Unauthorized", { status: 401 });

  // DB에서 콘텐츠 조회
  let contents: any[] = [];
  try {
    await env.FONDAY_DB.prepare(`
      CREATE TABLE IF NOT EXISTS insta_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pillar TEXT NOT NULL,
        format TEXT NOT NULL,
        hook TEXT NOT NULL,
        slides TEXT NOT NULL,
        caption TEXT NOT NULL,
        hashtags TEXT NOT NULL,
        cta TEXT NOT NULL,
        ingredient_focus TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    const { results } = await env.FONDAY_DB.prepare(
      "SELECT * FROM insta_content ORDER BY scheduled_date DESC, scheduled_time ASC LIMIT 60"
    ).all();
    contents = results || [];
  } catch { /* table might not exist yet */ }

  // 날짜별 그룹핑
  const grouped: Record<string, any[]> = {};
  for (const c of contents) {
    const date = c.scheduled_date as string;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(c);
  }

  // HTML 렌더링
  let contentHtml = "";

  if (contents.length === 0) {
    contentHtml = `<div style="text-align:center;padding:60px 20px;color:#a8a29e;">
      <p style="font-size:40px;">📭</p>
      <p>아직 생성된 콘텐츠가 없습니다</p>
      <p style="font-size:12px;">아래 "오늘 콘텐츠 생성" 버튼을 눌러보세요</p>
    </div>`;
  } else {
    for (const [date, items] of Object.entries(grouped)) {
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const d = new Date(date + "T00:00:00Z");
      const dayName = dayNames[d.getUTCDay()];
      contentHtml += `<div class="date-group">${date} (${dayName})</div>`;

      for (const c of items) {
        const slides = JSON.parse(c.slides as string);
        const hashtags = JSON.parse(c.hashtags as string);
        const formatBadge = c.format === "carousel"
          ? '<span class="badge badge-carousel">캐러셀</span>'
          : '<span class="badge badge-reels">릴스</span>';
        const pillarLabel = PILLAR_LABELS[c.pillar as string] || c.pillar;

        let slidesHtml = "";
        for (let i = 0; i < slides.length; i++) {
          slidesHtml += `<div class="slide"><span class="slide-title">${i + 1}. ${esc(slides[i].title)}</span><br/>${esc(slides[i].body)}</div>`;
        }

        contentHtml += `
<div class="content-card" id="card-${c.id}">
  <div class="content-header">
    <div class="content-meta">
      ${formatBadge}
      <span class="badge badge-pillar">${pillarLabel}</span>
      <span style="font-size:11px;color:#a8a29e;">${c.scheduled_time}</span>
      ${c.ingredient_focus ? `<span style="font-size:11px;color:#4F46E5;">🔬 ${esc(c.ingredient_focus as string)}</span>` : ""}
    </div>
    <div>
      <button class="btn btn-secondary btn-sm" onclick="generateImages(${c.id})">🖼️ 이미지 생성</button>
    </div>
  </div>
  <div class="hook">${esc(c.hook as string)}</div>
  ${slidesHtml}
  <div class="caption-box">${esc(c.caption as string)}</div>
  <div class="hashtags">${hashtags.map((h: string) => esc(h)).join(" ")}</div>
  <div class="images-row" id="images-${c.id}"></div>
</div>`;
      }
    }
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Fonday 인스타 콘텐츠</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>📸 인스타 콘텐츠 자동 생성</h1>
  <div class="subtitle">Fonday AI × Gemini — 매일 2개 자동 생성</div>

  <div class="actions">
    <button class="btn btn-primary" onclick="generateToday()">🚀 오늘 콘텐츠 생성</button>
    <button class="btn btn-secondary" onclick="generateTomorrow()">📅 내일 콘텐츠 생성</button>
  </div>
  <div id="loading">⏳ 생성 중... (20~30초 소요)</div>

  <h2>GENERATED CONTENT</h2>
  ${contentHtml}

  <script>
    const ADMIN_KEY = "${adminKey}";

    async function generateToday() {
      await generateForDate();
    }
    async function generateTomorrow() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      await generateForDate(dateStr);
    }
    async function generateForDate(date) {
      document.getElementById("loading").style.display = "block";
      try {
        const body = { key: ADMIN_KEY };
        if (date) body.date = date;
        const res = await fetch("/api/admin/insta-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.ok) {
          alert("생성 완료! " + data.generated.length + "개 콘텐츠");
          location.reload();
        } else {
          alert("오류: " + (data.error || "Unknown") + "\\n" + (data.detail || "") + "\\n" + (data.stack || ""));
        }
      } catch (e) {
        alert("생성 실패: " + e.message);
      }
      document.getElementById("loading").style.display = "none";
    }
    async function generateImages(contentId) {
      const row = document.getElementById("images-" + contentId);
      row.innerHTML = "<span style='font-size:12px;color:#a8a29e;'>🖼️ 슬라이드 정보 로딩 중...</span>";
      try {
        // 1단계: 메타데이터 (슬라이드 개수 확인)
        const metaRes = await fetch("/api/admin/insta-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: ADMIN_KEY, contentId, slideIndex: -1 }),
        });
        const meta = await metaRes.json();
        if (!meta.ok) {
          row.innerHTML = "<span style='color:#dc2626;font-size:12px;'>오류: " + (meta.error || "") + "</span>";
          return;
        }
        const total = meta.totalSlides || 5;
        row.innerHTML = "";

        // 2단계: 한 장씩 순차 생성
        for (let i = 0; i < total; i++) {
          const placeholder = document.createElement("span");
          placeholder.style.cssText = "display:inline-block;width:150px;height:150px;border-radius:8px;background:#f5f5f4;line-height:150px;text-align:center;font-size:11px;color:#a8a29e;";
          placeholder.textContent = (i+1) + "번 생성 중...";
          placeholder.id = "ph-" + contentId + "-" + i;
          row.appendChild(placeholder);
        }

        for (let i = 0; i < total; i++) {
          try {
            const slideRes = await fetch("/api/admin/insta-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: ADMIN_KEY, contentId, slideIndex: i }),
            });
            const slideData = await slideRes.json();
            const ph = document.getElementById("ph-" + contentId + "-" + i);
            if (slideData.ok && slideData.image) {
              const img = document.createElement("img");
              img.src = slideData.image;
              img.alt = "slide " + (i+1);
              img.style.cssText = "width:150px;height:150px;border-radius:8px;object-fit:cover;cursor:pointer;";
              img.onclick = function() { showPreview(slideData.image, contentId, i+1); };
              ph.replaceWith(img);
            } else {
              ph.textContent = "실패: " + (slideData.error || "") + " " + (slideData.detail || "");
              ph.style.cssText += "color:#dc2626;font-size:9px;overflow:hidden;word-break:break-all;";
            }
          } catch (e) {
            const ph = document.getElementById("ph-" + contentId + "-" + i);
            if (ph) { ph.textContent = "오류"; ph.style.color = "#dc2626"; }
          }
        }
      } catch (e) {
        row.innerHTML = "<span style='color:#dc2626;font-size:12px;'>실패: " + e.message + "</span>";
      }
    }

    function showPreview(imageSrc, contentId, slideNum) {
      // 기존 오버레이 제거
      const existing = document.getElementById("preview-overlay");
      if (existing) existing.remove();

      const overlay = document.createElement("div");
      overlay.id = "preview-overlay";
      overlay.className = "preview-overlay";
      overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

      const closeBtn = document.createElement("button");
      closeBtn.className = "preview-close";
      closeBtn.textContent = "×";
      closeBtn.onclick = function() { overlay.remove(); };

      const img = document.createElement("img");
      img.src = imageSrc;

      const actions = document.createElement("div");
      actions.className = "preview-actions";

      const dlBtn = document.createElement("button");
      dlBtn.className = "btn btn-primary";
      dlBtn.textContent = "📥 다운로드";
      dlBtn.onclick = function() {
        const a = document.createElement("a");
        a.href = imageSrc;
        a.download = "fonday-slide-" + contentId + "-" + slideNum + ".png";
        a.click();
      };

      actions.appendChild(dlBtn);
      overlay.appendChild(closeBtn);
      overlay.appendChild(img);
      overlay.appendChild(actions);
      document.body.appendChild(overlay);
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
