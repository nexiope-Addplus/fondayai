const STATS = [
  {
    value: "전후 변화",
    desc: "고객은 관리 후 무엇이 달라졌는지 눈으로 확인하고 싶어합니다",
  },
  {
    value: "상담 근거",
    desc: "구두 설명만으로는 피부 상태와 관리 이유를 오래 기억하기 어렵습니다",
  },
  {
    value: "재방문 관리",
    desc: "다음 방문일과 홈케어 안내가 흩어지면 고객 관리가 끊기기 쉽습니다",
  },
];

export default function ProProblem() {
  return (
    <section id="problem" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm font-bold text-[#3F5F7A]">Problem</p>
        <h2
          className="mt-3 text-[32px] font-bold text-slate-900"
          style={{ wordBreak: "keep-all" }}
        >
          고객은 변화를 보고 싶고,
          <br className="hidden sm:block" />
          원장님은 설명할 근거가 필요합니다
        </h2>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.value}
              className="rounded-2xl border border-slate-200 shadow-sm p-8"
            >
              <p className="text-[28px] font-bold text-[#3F5F7A]">{stat.value}</p>
              <p
                className="mt-3 text-base text-slate-600 leading-relaxed"
                style={{ wordBreak: "keep-all" }}
              >
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        <p
          className="mt-10 text-lg text-slate-500"
          style={{ wordBreak: "keep-all" }}
        >
          구두 설명만으로는 관리 효과가 남지 않습니다. 상담 전후의 변화를 기록하고, 고객이 다시 볼 수 있는 리포트가 필요합니다.
        </p>
      </div>
    </section>
  );
}
