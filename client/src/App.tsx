import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import SkinScanPage from "@/pages/skin-scan";
import BattlePage from "@/pages/battle";
import LegalPage from "@/pages/legal";



function Router() {
  return (
    <Switch>
      <Route path="/" component={SkinScanPage} />
      <Route path="/battle/:token" component={BattlePage} />
      <Route path="/legal/:type" component={LegalPage} />
    </Switch>
  );
}

// 유입 경로 추적 (첫 방문 시 저장)
if (!sessionStorage.getItem("fonday_ref")) {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || params.get("ref") || "";
  const ref = document.referrer || "";
  const channel = source
    || (ref.includes("instagram") ? "instagram"
    : ref.includes("threads") ? "threads"
    : ref.includes("t.co") || ref.includes("twitter") ? "twitter"
    : ref.includes("facebook") ? "facebook"
    : ref.includes("google") ? "google_search"
    : ref.includes("naver") ? "naver_search"
    : ref.includes("daum") ? "daum_search"
    : ref.includes("yahoo") ? "yahoo_search"
    : ref ? "referral"
    : "direct");
  sessionStorage.setItem("fonday_ref", channel);
  localStorage.setItem("fonday_referrer", channel);
}

function AppContent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
