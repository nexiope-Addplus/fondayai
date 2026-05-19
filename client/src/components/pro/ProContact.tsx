import { useState } from "react";
import { Check, Loader2, Mail, Send } from "lucide-react";

export default function ProContact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSending(true);
    try {
      await fetch("https://pro.fondayai.com/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "landing-contact",
          message: `[랜딩 문의] ${shopName || "미입력"} / ${name} / ${phone}\n${message}`,
          rating: 0,
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1fr_1fr] gap-12 items-start">
          <div>
            <h2
              className="text-[32px] font-bold text-slate-900"
              style={{ wordBreak: "keep-all" }}
            >
              {"궁금한 점이 있으신가요?"}
            </h2>
            <p
              className="mt-3 text-lg text-slate-500 leading-relaxed"
              style={{ wordBreak: "keep-all" }}
            >
              {"도입 검토, 기능 문의, 베타 참여 등 무엇이든 편하게 연락해주세요. 평일 기준 24시간 이내 답변드립니다."}
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF7F8]">
                  <Mail className="h-4 w-4 text-[#315F72]" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{"이메일"}</p>
                  <a href="mailto:nexiope@gmail.com" className="text-sm font-semibold text-slate-900 hover:text-[#315F72]">
                    nexiope@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          {sent ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Check className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900">{"문의가 접수되었습니다"}</p>
              <p className="mt-2 text-sm text-slate-500">{"빠른 시일 내에 답변드리겠습니다."}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E8D7CA] bg-[#FFF8F1] p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{"이름"} <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#315F72] focus:ring-2 focus:ring-[#315F72]/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{"연락처"} <span className="text-red-400">*</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#315F72] focus:ring-2 focus:ring-[#315F72]/10"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{"샵 이름"}</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="피부관리샵 이름 (선택)"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#315F72] focus:ring-2 focus:ring-[#315F72]/10"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">{"문의 내용"}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="궁금한 점이나 요청 사항을 자유롭게 적어주세요"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none resize-none focus:border-[#315F72] focus:ring-2 focus:ring-[#315F72]/10"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !name.trim() || !phone.trim()}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#315F72] text-sm font-semibold text-white hover:bg-[#274B5A] transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "보내는 중..." : "문의하기"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
