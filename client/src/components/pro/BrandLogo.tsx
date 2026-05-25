/** Fonday Bloom F 브랜드 로고 — fonday-b2b 와 동일 디자인.
 *  스코프: /pro 페이지 전용. fondayai 글로벌 토큰과 무관하게 hsl 리터럴 사용. */
interface Props {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function BrandLogo({ size = 36, className, ariaLabel = "Fonday" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {/* top + bottom petals (blush pink) */}
      <ellipse cx="40" cy="22" rx="11" ry="16" fill="#FFCFD4" />
      <ellipse cx="40" cy="58" rx="11" ry="16" fill="#FFCFD4" />
      {/* left + right petals (teal soft) */}
      <ellipse cx="22" cy="40" rx="16" ry="11" fill="#7BC4BA" />
      <ellipse cx="58" cy="40" rx="16" ry="11" fill="#7BC4BA" />
      {/* center disc */}
      <circle cx="40" cy="40" r="11" fill="#2E9D8F" />
      {/* F glyph */}
      <text
        x="40"
        y="46"
        textAnchor="middle"
        fontFamily='"Pretendard Variable", "Pretendard", system-ui, sans-serif'
        fontSize="14"
        fontWeight="900"
        fill="#fff"
      >
        F
      </text>
    </svg>
  );
}
