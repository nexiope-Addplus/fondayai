import { CheckCircle2, Database, FileCheck2, MessageSquareText, ShieldCheck } from "lucide-react";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "의학적 진단이 아닌 상담 보조",
    desc: "AI 결과는 고객에게 상태를 설명하기 위한 참고 자료입니다. 최종 관리는 원장님의 전문 판단으로 안내합니다.",
  },
  {
    icon: Database,
    title: "사진과 상담 기록 관리",
    desc: "고객 사진, 분석 결과, 상담 메모, 다음 방문일을 한 고객 흐름으로 정리해 전후 비교에 활용합니다.",
  },
  {
    icon: FileCheck2,
    title: "고객 동의 전제로 운영",
    desc: "피부 사진 촬영과 분석은 고객 동의를 전제로 하며, 개인정보 처리방침과 약관에서 처리 방식을 확인할 수 있습니다.",
  },
  {
    icon: MessageSquareText,
    title: "리포트로 상담 근거 제공",
    desc: "점수, AI 코멘트, 홈케어 가이드를 고객용 리포트로 전달해 상담 후에도 관리 이유가 남습니다.",
  },
];

const FLOW = [
  "고객 이름과 기본 정보 등록",
  "스마트폰 또는 태블릿으로 피부 촬영",
  "10개 항목 분석 리포트 확인",
  "관리 추천과 홈케어 가이드 전달",
  "다음 방문일 기준으로 리마인더 관리",
];

export default function ProTrust() {
  return (
    <section id="trust" className="py-20 bg-[#F7FAF8]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
          <div>
            <p className="text-sm font-bold text-[#1F5F57]">Trust & Operation</p>
            <h2
              className="mt-3 text-[32px] md:text-[40px] font-bold text-slate-900 leading-tight"
              style={{ wordBreak: "keep-all" }}
            >
              샵에서 바로 쓰려면,
              <br />
              설명보다 안심이 먼저입니다
            </h2>
            <p
              className="mt-5 text-base text-slate-600 leading-relaxed"
              style={{ wordBreak: "keep-all" }}
            >
              Fonday Pro는 피부 상태를 대신 판단하는 도구가 아니라, 상담 흐름을 정리하고 고객이 이해할 수 있는 리포트로 바꾸는 운영 도구입니다.
            </p>

            <div className="mt-8 rounded-2xl bg-white border border-emerald-100 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">상담 운영 흐름</p>
              <div className="mt-4 space-y-3">
                {FLOW.map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1F5F57] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F5F57]/10">
                  <point.icon className="h-5 w-5 text-[#1F5F57]" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">{point.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500" style={{ wordBreak: "keep-all" }}>
                  {point.desc}
                </p>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-2xl bg-[#10231F] p-6 text-white">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <p className="font-semibold">가입 전 확인할 수 있는 문서</p>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/75" style={{ wordBreak: "keep-all" }}>
                    이용약관, 개인정보 처리방침, 환불 기준을 공개해 두었습니다. 고객 사진 처리와 AI 분석 면책 범위를 먼저 확인한 뒤 도입할 수 있습니다.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <a href="/pro/legal/terms" className="font-semibold text-emerald-200 hover:text-white">
                      이용약관 보기
                    </a>
                    <a href="/pro/legal/privacy" className="font-semibold text-emerald-200 hover:text-white">
                      개인정보처리방침 보기
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
