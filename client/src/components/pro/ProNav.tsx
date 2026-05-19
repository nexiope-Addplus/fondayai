import { ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { label: "기능", href: "#features" },
  { label: "사용방법", href: "#solution" },
  { label: "신뢰", href: "#trust" },
  { label: "요금제", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "문의", href: "#contact" },
];

const REGISTER_URL = "https://pro.fondayai.com/register";

export default function ProNav() {
  // Smooth scroll to section
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — scroll to top on click */}
        <a
          href="/pro"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xl font-bold text-[#315F72]">Fonday</span>
          <span className="text-xs font-semibold bg-[#C9815E] text-white px-2 py-0.5 rounded-full">
            Pro
          </span>
        </a>

        {/* Center links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link.href)}
              className="text-sm text-slate-600 hover:text-[#315F72] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-[#315F72] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#274B5A] transition-colors"
        >
          1년 무료 시작
          <ExternalLink size={14} />
        </a>
      </div>
    </nav>
  );
}
