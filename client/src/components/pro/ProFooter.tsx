import { ArrowRight } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/";

export default function ProFooter() {
  return (
    <footer className="bg-[#24313A] text-white">
      {/* Final CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2
          className="text-[28px] md:text-[32px] font-bold"
          style={{ wordBreak: "keep-all" }}
        >
          얼리 파트너 30곳 한정
        </h2>
        <p className="mt-3 text-slate-400" style={{ wordBreak: "keep-all" }}>
          지금 가입하면 Fonday Pro를 1년 무료로 사용할 수 있습니다.
        </p>
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-white text-[#315F72] font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          지금 가입하고 1년 무료 받기
          <ArrowRight size={18} />
        </a>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Fonday</span>
            <span className="text-xs bg-[#C9815E] text-white px-1.5 py-0.5 rounded-full">
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
