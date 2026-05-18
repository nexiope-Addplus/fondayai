import { ArrowRight, Users, Zap } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/register";

export default function ProBeta() {
  return (
    <section className="py-16 bg-gradient-to-br from-[#1F5F57] to-[#143f3a] text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              {"베타 테스트 모집 중"}
            </div>
            <h2
              className="mt-5 text-[28px] md:text-[36px] font-bold leading-tight"
              style={{ wordBreak: "keep-all" }}
            >
              {"선착순 30개 샵,"}
              <br />
              {"무료로 먼저 사용해보세요"}
            </h2>
            <p
              className="mt-4 text-lg text-white/75 leading-relaxed"
              style={{ wordBreak: "keep-all" }}
            >
              {"정식 출시 전, 베타 파트너 샵을 모집합니다. 베타 기간 동안 Pro 플랜 전체 기능을 무료로 사용하고, 피드백으로 함께 만들어가세요."}
            </p>
            <a
              href={REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 bg-white text-[#1F5F57] font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              {"베타 신청하기"}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <BetaCard icon={<Users className="h-5 w-5" />} number="30" label="모집 샵" sub="선착순 마감" />
            <BetaCard icon={<Zap className="h-5 w-5" />} number="0원" label="베타 기간" sub="Pro 전 기능 무료" />
            <BetaCard number="10+" label="분석 항목" sub="AI 피부 점수화" />
            <BetaCard number="QR" label="고객 리포트" sub="상담 후 바로 공유" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BetaCard({
  icon,
  number,
  label,
  sub,
}: {
  icon?: React.ReactNode;
  number: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-sm">
      {icon && <div className="mb-2 text-white/70">{icon}</div>}
      <p className="text-2xl font-bold">{number}</p>
      <p className="mt-1 text-sm font-semibold text-white/90">{label}</p>
      <p className="mt-0.5 text-xs text-white/50">{sub}</p>
    </div>
  );
}
