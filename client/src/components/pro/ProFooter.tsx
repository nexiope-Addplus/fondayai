import { ArrowRight } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/register";

export default function ProFooter() {
  return (
    <footer className="bg-[#0F1E13] text-white">
      {/* Final CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2
          className="text-[28px] md:text-[32px] font-bold"
          style={{ wordBreak: "keep-all" }}
        >
          지금 무료로 시작하세요
        </h2>
        <p className="mt-3 text-slate-400" style={{ wordBreak: "keep-all" }}>
          상담 리포트, 전후 비교, 재방문 관리까지. 장비 없이 시작하세요.
        </p>
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-white text-[#1F5F57] font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          무료로 시작하기
          <ArrowRight size={18} />
        </a>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Fonday</span>
            <span className="text-xs bg-[#8B5CF6] text-white px-1.5 py-0.5 rounded-full">
              Pro
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="mailto:nexiope@gmail.com" className="hover:text-white transition-colors">
              nexiope@gmail.com
            </a>
            <a href="/pro/legal/terms" className="hover:text-white transition-colors">
              이용약관
            </a>
            <a href="/pro/legal/privacy" className="hover:text-white transition-colors">
              개인정보처리방침
            </a>
          </div>

          <p className="text-center md:text-right">
            <span>&copy; 2026 주식회사 에드플러스</span>
            <span className="mx-2 text-white/20">|</span>
            <span>사업자등록번호 831-88-01319</span>
            <span className="mx-2 text-white/20">|</span>
            <span>대구광역시 알파시티1로 160</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
