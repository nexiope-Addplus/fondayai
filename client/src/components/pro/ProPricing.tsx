import { Check } from "lucide-react";

const REGISTER_URL = "https://pro.fondayai.com/register";

interface Plan {
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "0원",
    unit: "/월",
    features: ["월 5건 분석", "기본 AI 분석", "고객 리포트", "카드 등록 없이 시작"],
    cta: "무료로 시작하기",
  },
  {
    name: "Pro",
    price: "29,000원",
    unit: "/월",
    features: [
      "무제한 분석",
      "전후 비교",
      "홈케어 가이드",
      "재방문 리마인더",
      "샵 브랜딩",
      "고객 상담 기록 관리",
    ],
    cta: "Pro 시작하기",
    highlighted: true,
    badge: "추천",
  },
  {
    name: "Premium",
    price: "79,000원",
    unit: "/월",
    features: [
      "Pro 전체 기능",
      "다매장 관리",
      "우선 지원",
      "API 연동",
      "운영 정책 맞춤 상담",
    ],
    cta: "문의하기",
  },
];

export default function ProPricing() {
  return (
    <section id="pricing" className="py-20 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2
          className="text-[32px] font-bold text-slate-900"
          style={{ wordBreak: "keep-all" }}
        >
          무료로 검증하고,
          <br className="hidden sm:block" />
          필요할 때 Pro로 확장하세요
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 text-left ${
                plan.highlighted
                  ? "border border-slate-200 shadow-xl bg-white scale-[1.02]"
                  : "border border-slate-200 shadow-sm bg-white"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
              <p className="mt-2">
                <span className="text-[32px] font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.unit}</span>
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {plan.name === "Free"
                  ? "첫 상담 흐름을 부담 없이 테스트하세요."
                  : plan.name === "Pro"
                    ? "1인 샵과 단일 매장 운영에 가장 적합합니다."
                    : "여러 매장 또는 외부 시스템 연동이 필요할 때."}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={16} className="text-[#1F5F57] mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href={REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 block text-center font-medium py-3 rounded-xl transition-colors ${
                  plan.highlighted
                    ? "bg-[#1F5F57] text-white hover:bg-[#174a44]"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500" style={{ wordBreak: "keep-all" }}>
          무료 플랜은 자동 결제되지 않습니다. 유료 전환과 해지는 직접 선택할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
