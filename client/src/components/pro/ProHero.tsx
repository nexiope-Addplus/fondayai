import { ArrowRight, Play } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/register";

const TRUST_ITEMS = ["장비 구매 없음", "카드 등록 없음", "고객 리포트 공유"];

export default function ProHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0faf8] via-white to-[#f5f0ff]">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <h1
            className="text-[36px] md:text-[48px] font-bold text-slate-900 leading-tight"
            style={{ wordBreak: "keep-all" }}
          >
            피부 분석은 AI가,
            <br />
            상담은 원장님이
          </h1>
          <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-md" style={{ wordBreak: "keep-all" }}>
            스마트폰 하나로 피부 상태를 분석하고, 고객에게 남는 상담 리포트와 홈케어 가이드를 제공하세요.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1F5F57] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#174a44] transition-colors"
            >
              무료로 시작하기
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
                <span className="w-1 h-1 rounded-full bg-[#1F5F57]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard in tablet frame */}
        <div className="flex justify-center">
          <div className="rounded-[24px] bg-[#2c2c2e] p-[10px] shadow-2xl">
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
