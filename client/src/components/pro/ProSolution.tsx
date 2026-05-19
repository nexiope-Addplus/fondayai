import { ScanFace, MessageCircle, Sparkles, QrCode, ChevronRight } from "lucide-react";

const STEPS = [
  {
    num: 1,
    icon: ScanFace,
    title: "피부 분석",
    desc: "AI가 10개 항목을 점수화",
  },
  {
    num: 2,
    icon: MessageCircle,
    title: "원인 설명",
    desc: "왜 이런 상태인지 고객에게 시각적으로",
  },
  {
    num: 3,
    icon: Sparkles,
    title: "관리 추천",
    desc: "맞춤 케어 프로그램 제안",
  },
  {
    num: 4,
    icon: QrCode,
    title: "리포트 공유",
    desc: "QR로 고객에게 전달, 재방문 리마인더",
  },
];

export default function ProSolution() {
  return (
    <section id="solution" className="py-20 bg-[#F4FAFA]">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2
          className="text-[32px] font-bold text-slate-900"
          style={{ wordBreak: "keep-all" }}
        >
          상담 흐름 하나로 해결됩니다
        </h2>

        <div className="mt-14 flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center">
              {/* Step card */}
              <div className="flex flex-col items-center text-center w-44">
                <div className="w-14 h-14 rounded-2xl bg-[#315F72]/10 flex items-center justify-center mb-3">
                  <step.icon size={24} className="text-[#315F72]" />
                </div>
                <span className="text-xs font-bold text-[#C9815E] mb-1">
                  STEP {step.num}
                </span>
                <p className="font-semibold text-slate-900">{step.title}</p>
                <p
                  className="mt-1 text-sm text-slate-500"
                  style={{ wordBreak: "keep-all" }}
                >
                  {step.desc}
                </p>
              </div>

              {/* Arrow between steps */}
              {i < STEPS.length - 1 && (
                <ChevronRight
                  size={20}
                  className="text-slate-300 mx-2 hidden md:block flex-shrink-0"
                />
              )}
            </div>
          ))}
        </div>

        {/* Step screenshots in tablet frames */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { src: "/pro/scan-result.png", label: "Step 1 · 피부 분석" },
            { src: "/pro/analysis.png", label: "Step 2 · 원인 설명" },
            { src: "/pro/recommend.png", label: "Step 3 · 관리 추천" },
            { src: "/pro/report.png", label: "Step 4 · 리포트 공유" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="rounded-[14px] bg-[#24313A] p-[5px] shadow-lg">
                <div className="rounded-[9px] overflow-hidden">
                  <img src={item.src} alt={item.label} className="w-full block" />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
