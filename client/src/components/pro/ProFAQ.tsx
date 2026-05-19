import { useState } from "react";
import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  {
    q: "별도 장비가 필요한가요?",
    a: "스마트폰/태블릿 카메라만 있으면 됩니다. 별도의 피부 측정 장비를 구매할 필요가 없습니다.",
  },
  {
    q: "AI 분석은 정확한가요?",
    a: "AI 분석은 상담 보조 자료입니다. 조명, 각도, 촬영 상태에 따라 결과가 달라질 수 있으므로 원장님의 전문 판단과 함께 사용해야 합니다.",
  },
  {
    q: "고객 데이터는 안전한가요?",
    a: "피부 사진과 분석 결과는 서비스 제공 목적에 맞춰 처리되며, AI 학습이나 마케팅 목적으로 별도 사용하지 않습니다. 자세한 내용은 개인정보 처리방침에서 확인할 수 있습니다.",
  },
  {
    q: "무료 체험 후 자동 결제되나요?",
    a: "아니요, 카드 등록 없이 무료로 시작합니다. 유료 전환은 직접 선택하셔야 합니다.",
  },
  {
    q: "기존 고객 데이터를 가져올 수 있나요?",
    a: "현재는 직접 입력이 필요하며, CSV 가져오기를 준비 중입니다.",
  },
  {
    q: "해지는 어떻게 하나요?",
    a: "설정에서 언제든 해지 가능, 위약금 없습니다.",
  },
  {
    q: "고객에게 리포트를 어떻게 전달하나요?",
    a: "분석 결과와 홈케어 가이드를 고객용 리포트로 정리하고, QR 공유 흐름으로 상담 이후에도 다시 확인할 수 있게 제공합니다.",
  },
];

export default function ProFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <h2
          className="text-[32px] font-bold text-slate-900 text-center"
          style={{ wordBreak: "keep-all" }}
        >
          자주 묻는 질문
        </h2>

        <div className="mt-12 space-y-3">
          {QUESTIONS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 flex-shrink-0 transition-transform ${
                    openIdx === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
