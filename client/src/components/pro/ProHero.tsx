import { ArrowRight, Play } from "lucide-react";
import BrandLogo from "./BrandLogo";

const REGISTER_URL = "https://pro.fondayai.com/";

const TRUST_ITEMS = ["선착순 30곳", "카드 등록 없음", "가입 후 바로 사용"];

/** Hero — Spa Teal × Warm Cream + 실 스크린샷 + 떠다니는 데이터 뱃지.
 *  카피/CTA/REGISTER_URL/구조 보존, 비주얼만 fonday-b2b v2 톤으로 통일. */
export default function ProHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#E3F2EF] via-white to-[#FBEBE0]">
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2">
            <BrandLogo size={36} />
            <span className="inline-flex items-center rounded-full bg-[#2E9D8F]/10 px-3 py-1 text-[12px] font-extrabold text-[#115048]">
              얼리 파트너 30곳 한정 · 1년 무료
            </span>
          </div>
          <h1
            className="mt-5 text-[36px] md:text-[48px] font-extrabold text-slate-900 leading-tight tracking-[-0.02em]"
            style={{ wordBreak: "keep-all" }}
          >
            피부 상담 리포트,
            <br />
            <span className="text-[#2E9D8F]">1년 무료</span>로 먼저 쓰세요
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
              className="inline-flex items-center gap-2 bg-[#2E9D8F] text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-[#2E9D8F]/30 hover:bg-[#1E7E72] transition-colors"
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
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Play size={16} />
              상담 화면 미리보기
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
            {TRUST_ITEMS.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#2E9D8F]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* 태블릿 + 실 스크린샷 + 떠다니는 데이터 뱃지 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="rounded-[28px] bg-[#14182B] p-3 shadow-[0_30px_80px_-20px_rgba(46,157,143,0.35)]">
              <img
                src="/pro/result-step01.png"
                alt="Fonday Pro 피부 점수 결과 화면"
                width={480}
                height={334}
                className="block w-full max-w-[460px] rounded-[18px]"
              />
            </div>

            {/* 좌상단 뱃지 — 점수 */}
            <div className="hidden md:block absolute -left-6 top-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/10 -rotate-[4deg]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">오늘 점수</p>
              <p
                className="mt-0.5 text-[28px] font-extrabold leading-none text-[#115048]"
                style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
              >
                78
              </p>
            </div>

            {/* 우상단 뱃지 — 수분 변화 */}
            <div className="hidden md:block absolute -right-4 top-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/10 rotate-[3deg]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">수분</p>
              <p className="mt-0.5 text-[18px] font-extrabold leading-none text-[#B85F44]">+5점</p>
            </div>

            {/* 우하단 뱃지 — 분석 완료 */}
            <div className="hidden md:flex absolute -right-6 bottom-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-lg shadow-slate-900/10 rotate-[2deg]">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#2E9D8F] text-white">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.5 L5 9 L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[12px] font-extrabold text-slate-900">AI 분석 완료</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
