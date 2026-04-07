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
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
  <style>${CSS}</style>
</head>
<body>
  <h1>📸 인스타 콘텐츠 자동 생성</h1>
  <div class="subtitle">Fonday AI × Gemini — 매일 2개 자동 생성</div>

  <div class="actions">
    <button class="btn btn-primary" onclick="generateToday()">오늘 콘텐츠 생성</button>
    <button class="btn btn-secondary" onclick="generateTomorrow()">내일 콘텐츠 생성</button>
    <button class="btn btn-sm" style="background:#dc2626;color:white" onclick="clearAll()">전체 삭제</button>
  </div>
  <div id="loading">⏳ 생성 중... (20~30초 소요)</div>

  <h2>GENERATED CONTENT</h2>
  ${contentHtml}

  <script>
    const ADMIN_KEY = "${adminKey}";
    // 각 콘텐츠의 JSON 데이터를 ID로 캐시
    const contentCache = {};
    ${contents.map(c => `contentCache[${c.id}] = ${JSON.stringify({
      hook: c.hook, hookSub: c.hook_sub || "", slides: JSON.parse(c.slides as string),
      caption: c.caption, hashtags: JSON.parse(c.hashtags as string), cta: c.cta,
      ingredientFocus: c.ingredient_focus || "",
      imagePrompts: JSON.parse((c.image_prompts as string) || "[]"),
    })};`).join("\n    ")}

    async function clearAll() {
      if (!confirm("모든 콘텐츠를 삭제합니다. 계속?")) return;
      try {
        await fetch("/api/admin/insta-content?key="+ADMIN_KEY, { method:"DELETE" });
        location.reload();
      } catch(e) { alert("삭제 실패: "+e.message); }
    }
    async function generateToday() { await generateForDate(); }
    async function generateTomorrow() {
      const t = new Date(); t.setDate(t.getDate()+1);
      await generateForDate(t.toISOString().split("T")[0]);
    }
    async function generateForDate(date) {
      document.getElementById("loading").style.display = "block";
      try {
        const body = { key: ADMIN_KEY };
        if (date) body.date = date;
        const res = await fetch("/api/admin/insta-content", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const data = await res.json();
        if (data.ok) { alert("생성 완료!"); location.reload(); }
        else { alert("오류: "+(data.error||"")+"\\n"+(data.detail||"")); }
      } catch(e) { alert("실패: "+e.message); }
      document.getElementById("loading").style.display = "none";
    }

    // ── 슬라이드 HTML 빌더 — 스킨케어 소프트 파스텔 톤 ──
    const S = 540;
    const C = {
      bg1:"#FFF5F5", bg2:"#FFF0F6", bg3:"#F5F0FF", bg4:"#F0FFF4", bgCta:"#FF6B81",
      accent:"#FF6B81", accent2:"#A78BFA", accent3:"#34D399",
      white:"#FFFFFF", text:"#2D3436", sub:"#636E72", muted:"#B2BEC3", border:"#F0E6E6",
    };
    const NC = ["#FF6B81","#A78BFA","#34D399"];

    function cut(s,max) { return s && s.length > max ? s.slice(0,max)+"..." : (s||""); }

    function dots(idx, light) {
      return '<div style="position:absolute;bottom:44px;left:0;right:0;display:flex;gap:8px;justify-content:center">'
        +Array.from({length:5},(_,i)=>{
          const a = i===idx;
          const bg = a ? (light?"#FFFFFF":C.accent) : (light?"rgba(255,255,255,0.3)":"#DFD6D6");
          return '<div style="width:'+(a?20:8)+'px;height:8px;border-radius:4px;background:'+bg+';transition:all .2s"></div>';
        }).join("")+'</div>';
    }
    function footer(light) {
      const c = light?"rgba(255,255,255,0.5)":"#B2BEC3";
      return '<div style="position:absolute;bottom:14px;left:36px;right:36px;display:flex;justify-content:space-between">'
        +'<span style="font-weight:700;letter-spacing:2px;font-size:11px;color:'+c+'">FONDAY</span>'
        +'<span style="font-size:10px;color:'+c+'">AI Skin Analysis</span></div>';
    }

    // bgImg: base64 data URI or empty
    function slideHook(d, bgImg) {
      const hasBg = bgImg && bgImg.length > 50;
      const bgStyle = hasBg
        ? 'background:url('+bgImg+') center/cover no-repeat'
        : 'background:linear-gradient(135deg,'+C.bg1+','+C.bg2+')';
      // 이미지 배경 위에 텍스트 가독성을 위한 오버레이
      const overlay = hasBg
        ? '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 50%,rgba(0,0,0,0.7) 100%)"></div>'
        : '';
      const txtColor = hasBg ? '#FFFFFF' : C.text;
      const subColor = hasBg ? 'rgba(255,255,255,0.7)' : C.sub;
      const mutedColor = hasBg ? 'rgba(255,255,255,0.5)' : C.muted;
      return '<div style="width:'+S+'px;height:'+S+'px;position:relative;'+bgStyle+';display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Pretendard Variable,sans-serif;overflow:hidden">'
        +overlay
        // 뱃지
        +(d.badge?'<div style="position:relative;z-index:1;background:rgba(255,255,255,0.9);color:'+C.accent+';font-size:12px;font-weight:700;padding:6px 18px;border-radius:20px;margin-bottom:24px;backdrop-filter:blur(8px)">'+cut(d.badge,15)+'</div>':'')
        // 메인 타이틀
        +'<div style="position:relative;z-index:1;color:'+txtColor+';font-size:30px;font-weight:900;text-align:center;letter-spacing:-0.5px;line-height:1.4;padding:0 50px;overflow:hidden;max-height:130px;text-shadow:'+(hasBg?'0 2px 8px rgba(0,0,0,0.3)':'none')+'">'+cut(d.title,30)+'</div>'
        // 서브
        +'<div style="position:relative;z-index:1;color:'+subColor+';font-size:14px;margin-top:14px;padding:0 60px;text-align:center;overflow:hidden;max-height:44px">'+cut(d.sub,40)+'</div>'
        // 스와이프
        +'<div style="position:relative;z-index:1;color:'+mutedColor+';font-size:11px;margin-top:36px;letter-spacing:1px">SWIPE &rarr;</div>'
        +dots(0,hasBg)+footer(hasBg)+'</div>';
    }

    function slideInfo(d, num, idx, bgImg) {
      const nc = NC[(num-1)%3];
      const hasBg = bgImg && bgImg.length > 50;
      const topBg = hasBg
        ? 'background:url('+bgImg+') center/cover no-repeat'
        : 'background:linear-gradient(135deg,'+['#FFE5EC','#E8DEF8','#D1FAE5'][(num-1)%3]+','+['#FFF0F3','#F3EEFF','#ECFDF5'][(num-1)%3]+')';
      // 상단 50% 이미지/그라데이션 + 하단 50% 정보 카드
      return '<div style="width:'+S+'px;height:'+S+'px;position:relative;background:'+C.white+';font-family:Pretendard Variable,sans-serif;overflow:hidden">'
        // 상단 비주얼 영역
        +'<div style="position:absolute;top:0;left:0;right:0;height:50%;'+topBg+'"></div>'
        +'<div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,transparent 50%,'+C.white+' 100%)"></div>'
        // 넘버 뱃지 (상단 좌측)
        +'<div style="position:absolute;top:20px;left:24px;width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:'+nc+';font-weight:900;font-size:18px;z-index:1">'+num+'</div>'
        // 하단 정보 영역 (풀 카드, 여백 줄임)
        +'<div style="position:absolute;bottom:80px;left:28px;right:28px;top:42%">'
          +'<div style="font-size:24px;font-weight:800;color:'+C.text+';line-height:1.35;margin-bottom:12px">'+cut(d.title,20)+'</div>'
          +'<div style="font-size:15px;color:'+C.sub+';line-height:1.7">'+cut(d.body,150)+'</div>'
          +(d.tip?'<div style="margin-top:20px;padding-top:14px;border-top:1px solid '+C.border+';display:flex;align-items:center;gap:8px">'
            +'<div style="width:6px;height:6px;border-radius:50%;background:'+nc+';flex-shrink:0"></div>'
            +'<span style="font-size:13px;font-weight:600;color:'+nc+'">'+cut(d.tip,30)+'</span></div>':'')
        +'</div>'
        +dots(idx,false)+footer(false)+'</div>';
    }

    function slideCta(d, bgImg) {
      const hasBg = bgImg && bgImg.length > 50;
      const bgStyle = hasBg
        ? 'background:url('+bgImg+') center/cover no-repeat'
        : 'background:linear-gradient(135deg,#FF6B81,#FF8E9E)';
      const overlay = hasBg
        ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45)"></div>'
        : '';
      return '<div style="width:'+S+'px;height:'+S+'px;position:relative;'+bgStyle+';display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Pretendard Variable,sans-serif;overflow:hidden">'
        +overlay
        +'<div style="position:relative;z-index:1;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:2px;margin-bottom:16px">MY SKIN TYPE</div>'
        +'<div style="position:relative;z-index:1;color:white;font-size:26px;font-weight:900;text-align:center;line-height:1.4;padding:0 50px;overflow:hidden;max-height:110px;text-shadow:0 2px 8px rgba(0,0,0,0.3)">'+cut(d.title,30)+'</div>'
        +'<div style="position:relative;z-index:1;background:white;color:#FF6B81;font-weight:800;font-size:15px;padding:14px 40px;border-radius:32px;margin-top:28px;box-shadow:0 4px 16px rgba(0,0,0,0.15)">무료 피부 분석 받기</div>'
        +'<div style="position:relative;z-index:1;color:rgba(255,255,255,0.55);font-size:11px;margin-top:16px">프로필 링크에서 바로 시작</div>'
        +dots(4,true)+footer(true)+'</div>';
    }

    async function generateImages(contentId) {
      const row = document.getElementById("images-"+contentId);
      const data = contentCache[contentId];
      if (!data) { row.innerHTML = "<span style='color:#dc2626;font-size:12px'>데이터 없음</span>"; return; }

      row.innerHTML = "<span style='font-size:12px;color:#a8a29e'>이미지 생성 중...</span>";

      let renderArea = document.getElementById("render-area");
      if (!renderArea) {
        renderArea = document.createElement("div");
        renderArea.id = "render-area";
        renderArea.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
        document.body.appendChild(renderArea);
      }

      const slides = data.slides || [];
      const prompts = data.imagePrompts || [];

      // Imagen 4로 배경 이미지 생성 (5장 전부)
      const imgs = [];
      if (prompts.length > 0) {
        for (let i = 0; i < Math.min(prompts.length, 5); i++) {
          row.innerHTML = "<span style='font-size:12px;color:#a8a29e'>배경 이미지 생성 중... ("+(i+1)+"/"+Math.min(prompts.length,5)+")</span>";
          // 429 방지: 요청 간 3초 딜레이
          if (i > 0) await new Promise(r => setTimeout(r, 3000));
          // 실패 시 1회 재시도 (5초 후)
          let success = false;
          for (let attempt = 0; attempt < 2 && !success; attempt++) {
            try {
              if (attempt > 0) await new Promise(r => setTimeout(r, 5000));
              const res = await fetch("/api/admin/insta-gen-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: ADMIN_KEY, prompt: prompts[i] }),
              });
              const d = await res.json();
              if (d.ok && d.image) { imgs.push(d.image); success = true; }
              else { console.warn("Imagen slide "+i+" attempt "+attempt+" failed:", d.error, d.detail); }
            } catch(e) { console.warn("Imagen slide "+i+" attempt "+attempt+" error:", e); }
          }
          if (!success) imgs.push("");
        }
      }
      // 5개 미만이면 빈 문자열로 패딩
      while (imgs.length < 5) imgs.push("");

      const configs = [
        { html: slideHook({ title: data.hook, sub: data.hookSub || slides[0]?.body || "", badge: data.ingredientFocus }, imgs[0]) },
        { html: slideInfo(slides[1]||slides[0]||{title:"",body:"",tip:""}, 1, 1, imgs[1]) },
        { html: slideInfo(slides[2]||{title:"",body:"",tip:""}, 2, 2, imgs[2]) },
        { html: slideInfo(slides[3]||{title:"",body:"",tip:""}, 3, 3, imgs[3]) },
        { html: slideCta({ title: data.cta || "내 피부 타입 무료 분석" }, imgs[4]) },
      ];

      row.innerHTML = "";
      for (let i=0;i<5;i++) {
        const ph = document.createElement("span");
        ph.style.cssText = "display:inline-block;width:150px;height:150px;border-radius:8px;background:#f5f5f4;line-height:150px;text-align:center;font-size:11px;color:#a8a29e";
        ph.textContent = (i+1)+"번...";
        ph.id = "ph-"+contentId+"-"+i;
        row.appendChild(ph);
      }

      for (let i=0;i<5;i++) {
        const w = document.createElement("div");
        w.innerHTML = configs[i].html;
        renderArea.appendChild(w);
        try {
          const canvas = await html2canvas(w.firstChild, {scale:2,useCORS:true,backgroundColor:null,width:S,height:S});
          const url = canvas.toDataURL("image/png");
          const ph = document.getElementById("ph-"+contentId+"-"+i);
          const img = document.createElement("img");
          img.src = url; img.style.cssText = "width:150px;height:150px;border-radius:8px;object-fit:cover;cursor:pointer";
          img.onclick = function(){showPreview(url,contentId,i+1)};
          if(ph) ph.replaceWith(img);
        } catch(e) {
          const ph = document.getElementById("ph-"+contentId+"-"+i);
          if(ph){ph.textContent="err";ph.style.color="#dc2626";}
        }
        renderArea.removeChild(w);
      }
    }

    function showPreview(src,cid,num) {
      let ov = document.getElementById("preview-overlay"); if(ov) ov.remove();
      ov = document.createElement("div"); ov.id="preview-overlay"; ov.className="preview-overlay";
      ov.onclick = function(e){if(e.target===ov)ov.remove()};
      const cl = document.createElement("button"); cl.className="preview-close"; cl.textContent="x"; cl.onclick=function(){ov.remove()};
      const im = document.createElement("img"); im.src=src;
      const ac = document.createElement("div"); ac.className="preview-actions";
      const dl = document.createElement("button"); dl.className="btn btn-primary"; dl.textContent="다운로드";
      dl.onclick = function(){const a=document.createElement("a");a.href=src;a.download="fonday-"+cid+"-"+num+".png";a.click()};
      ac.appendChild(dl); ov.appendChild(cl); ov.appendChild(im); ov.appendChild(ac); document.body.appendChild(ov);
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
