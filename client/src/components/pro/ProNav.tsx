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
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1F5F57]">Fonday</span>
          <span className="text-xs font-semibold bg-[#8B5CF6] text-white px-2 py-0.5 rounded-full">
            Pro
          </span>
        </div>

        {/* Center links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link.href)}
              className="text-sm text-slate-600 hover:text-[#1F5F57] transition-colors"
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
          className="flex items-center gap-1.5 bg-[#1F5F57] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#174a44] transition-colors"
        >
          무료 시작하기
          <ExternalLink size={14} />
        </a>
      </div>
    </nav>
  );
}
