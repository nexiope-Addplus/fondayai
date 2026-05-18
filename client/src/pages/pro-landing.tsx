import ProNav from "@/components/pro/ProNav";
import ProHero from "@/components/pro/ProHero";
import ProProblem from "@/components/pro/ProProblem";
import ProSolution from "@/components/pro/ProSolution";
import ProFeatures from "@/components/pro/ProFeatures";
import ProBeta from "@/components/pro/ProBeta";
import ProTrust from "@/components/pro/ProTrust";
import ProPricing from "@/components/pro/ProPricing";
import ProFAQ from "@/components/pro/ProFAQ";
import ProContact from "@/components/pro/ProContact";
import ProFooter from "@/components/pro/ProFooter";
import { useEffect } from "react";

export default function ProLandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const title = "Fonday Pro - 피부관리샵을 위한 AI 상담 리포트";
    const description =
      "스마트폰 하나로 피부 분석, 상담 리포트, 전후 비교, 재방문 리마인더까지. 1인 피부관리샵과 에스테틱 원장님을 위한 Fonday Pro.";
    const ogTitle = "Fonday Pro - 피부관리샵 AI 상담 리포트";
    const ogDescription =
      "장비 없이 시작하는 피부 상담 자동화. 고객 리포트와 홈케어 가이드로 상담 신뢰와 재방문을 높이세요.";

    const setMeta = (selector: string, attr: "content" | "href", value: string) => {
      const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (el) el.setAttribute(attr, value);
    };

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", ogTitle);
    setMeta('meta[property="og:description"]', "content", ogDescription);
    setMeta('meta[property="og:url"]', "content", "https://fondayai.com/pro");
    setMeta('meta[name="twitter:title"]', "content", ogTitle);
    setMeta('meta[name="twitter:description"]', "content", ogDescription);
    setMeta('link[rel="canonical"]', "href", "https://fondayai.com/pro");

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <ProNav />
      <ProHero />
      <ProProblem />
      <ProSolution />
      <ProFeatures />
      <ProTrust />
      <ProPricing />
      <ProFAQ />
      <ProBeta />
      <ProContact />
      <ProFooter />
    </div>
  );
}
