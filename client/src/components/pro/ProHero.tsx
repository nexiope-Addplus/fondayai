import { ArrowRight, Play } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/register";

const TRUST_ITEMS = ["선착순 30곳", "카드 등록 없음", "가입 후 바로 사용"];

export default function ProHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8F1] via-white to-[#EEF7F8]">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center rounded-full bg-[#315F72]/10 px-4 py-1.5 text-sm font-bold text-[#315F72]">
            얼리 파트너 30곳 한정 · 가입 후 1년 무료
          </div>
          <h1
            className="mt-5 text-[36px] md:text-[48px] font-bold text-slate-900 leading-tight"
            style={{ wordBreak: "keep-all" }}
          >
            피부 상담 리포트,
            <br />
            1년 무료로 먼저 쓰세요
          </h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-md" style={{ wordBreak: "keep-all" }}>
            스마트폰 하나로 피부 상태를 분석하고, 고객에게 보여줄 수 있는 상담 리포트와 홈케어 가이드를 바로 만들어보세요.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#315F72] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#274B5A] transition-colors"
            >
              지금 가입하고 1년 무료 받기
              <ArrowRight size={18} />
            </a>
            <a
              href="#solution"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#solution")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Play size={16} />
              상담 화면 미리보기
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            {TRUST_ITEMS.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#315F72]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard in tablet frame */}
        <div className="flex justify-center">
          <div className="rounded-[24px] bg-[#24313A] p-[10px] shadow-2xl">
            <div className="rounded-[14px] overflow-hidden">
              <img
                src="/pro/dashboard.png"
                alt="Fonday Pro 대시보드"
                className="w-full max-w-[460px] block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
