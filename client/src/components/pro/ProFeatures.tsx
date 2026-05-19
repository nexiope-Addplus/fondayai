import {
  ScanFace,
  ArrowLeftRight,
  BookOpen,
  Bell,
  FileText,
  Palette,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScanFace,
    title: "AI 피부 분석",
    desc: "스마트폰 사진으로 10개 항목 분석, 점수 + 등급 + AI 코멘트",
  },
  {
    icon: ArrowLeftRight,
    title: "전후 비교",
    desc: "관리 전후 변화를 같은 기준으로 저장해 상담 근거 확보",
  },
  {
    icon: BookOpen,
    title: "홈케어 가이드",
    desc: "아침/저녁 루틴과 주의 성분을 고객에게 전달",
  },
  {
    icon: Bell,
    title: "재방문 리마인더",
    desc: "다음 방문일과 관리 주기를 기록해 이탈 방지",
  },
  {
    icon: FileText,
    title: "고객 리포트",
    desc: "QR로 공유 가능한 전문 리포트, 샵 로고 포함",
  },
  {
    icon: Palette,
    title: "샵 브랜딩",
    desc: "로고, CTA 문구 커스텀으로 내 샵만의 전문성",
  },
];

export default function ProFeatures() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2
          className="text-[32px] font-bold text-slate-900"
          style={{ wordBreak: "keep-all" }}
        >
          Fonday Pro가 하는 일
        </h2>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="rounded-2xl border border-slate-200 shadow-sm p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-[#3F5F7A]/10 flex items-center justify-center mb-4">
                <feat.icon size={22} className="text-[#3F5F7A]" />
              </div>
              <p className="font-semibold text-slate-900 text-lg">{feat.title}</p>
              <p
                className="mt-2 text-sm text-slate-500 leading-relaxed"
                style={{ wordBreak: "keep-all" }}
              >
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
