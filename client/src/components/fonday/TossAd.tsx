import React, { useEffect, useRef, useState, useCallback } from "react";
import { isTossMiniApp } from "./utils";

// ─── 광고 그룹 ID ──────────────────────────────────────────────
const AD_IDS = {
  rewarded: "ait.v2.live.37fdbda715004e10",
  interstitial: "ait.v2.live.f3ad01c781624fd6",
  banner: "ait.v2.live.48cb80ceb2544e3e",
} as const;

// ─── 스캔 횟수 제한 (1회 무료 + 광고/공유로 1회씩 추가, 최대 3회/일) ──
const SCAN_QUOTA_KEY = "fonday_scan_quota";
const FREE_SCANS = 1;
const MAX_DAILY_SCANS = 3;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface ScanQuota { date: string; used: number; granted: number }

function getScanQuota(): ScanQuota {
  try {
    const raw = localStorage.getItem(SCAN_QUOTA_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === todayKey()) {
        return { date: data.date, used: data.used || 0, granted: data.granted || 0 };
      }
    }
  } catch {}
  return { date: todayKey(), used: 0, granted: 0 };
}

function saveScanQuota(quota: ScanQuota) {
  try { localStorage.setItem(SCAN_QUOTA_KEY, JSON.stringify(quota)); } catch {}
}

/** Total available scans = free + granted by ads/shares */
function totalAvailable(quota: ScanQuota): number {
  return Math.min(FREE_SCANS + quota.granted, MAX_DAILY_SCANS);
}

/** Get remaining scans today */
export function getRemainingScans(): number {
  const q = getScanQuota();
  return Math.max(totalAvailable(q) - q.used, 0);
}

/** Use one scan credit. Returns false if no credits left. */
export function useScanCredit(): boolean {
  const quota = getScanQuota();
  if (quota.used >= totalAvailable(quota)) return false;
  quota.used += 1;
  saveScanQuota(quota);
  return true;
}

/** Can earn more scans via ad/share? */
export function canEarnMoreScans(): boolean {
  const q = getScanQuota();
  return totalAvailable(q) < MAX_DAILY_SCANS;
}

/** Add one scan credit from rewarded ad or share */
export function addScanCredit(): boolean {
  const quota = getScanQuota();
  if (totalAvailable(quota) >= MAX_DAILY_SCANS) return false;
  quota.granted += 1;
  saveScanQuota(quota);
  return true;
}

// ─── 보상형 광고 (상세 분석 보기) ────────────────────────────────
export function useRewardedAd() {
  const [loaded, setLoaded] = useState(false);
  const [showing, setShowing] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    if (!isTossMiniApp()) return;
    import("@apps-in-toss/web-framework").then(({ loadFullScreenAd }) => {
      if (!loadFullScreenAd.isSupported()) return;
      cleanupRef.current = loadFullScreenAd({
        options: { adGroupId: AD_IDS.rewarded },
        onEvent: (e) => {
          if (e.type === "loaded") setLoaded(true);
        },
        onError: (err) => console.warn("[RewardedAd] load error:", err),
      });
    }).catch(() => {});
  }, []);

  const show = useCallback(() => {
    if (!isTossMiniApp() || !loaded) return;
    setShowing(true);
    import("@apps-in-toss/web-framework").then(({ showFullScreenAd }) => {
      showFullScreenAd({
        options: { adGroupId: AD_IDS.rewarded },
        onEvent: (e) => {
          if (e.type === "userEarnedReward") setRewarded(true);
          if (e.type === "dismissed") setShowing(false);
        },
        onError: (err) => {
          console.warn("[RewardedAd] show error:", err);
          setShowing(false);
        },
      });
    }).catch(() => setShowing(false));
  }, [loaded]);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  return { loaded, showing, rewarded, load, show };
}

// ─── 전면 광고 (2회차 스캔부터) ──────────────────────────────────
export function useInterstitialAd() {
  const [loaded, setLoaded] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    if (!isTossMiniApp()) return;
    import("@apps-in-toss/web-framework").then(({ loadFullScreenAd }) => {
      if (!loadFullScreenAd.isSupported()) return;
      cleanupRef.current = loadFullScreenAd({
        options: { adGroupId: AD_IDS.interstitial },
        onEvent: (e) => {
          if (e.type === "loaded") setLoaded(true);
        },
        onError: (err) => console.warn("[InterstitialAd] load error:", err),
      });
    }).catch(() => {});
  }, []);

  const show = useCallback((): Promise<void> => {
    if (!isTossMiniApp() || !loaded) return Promise.resolve();
    return new Promise((resolve) => {
      import("@apps-in-toss/web-framework").then(({ showFullScreenAd }) => {
        showFullScreenAd({
          options: { adGroupId: AD_IDS.interstitial },
          onEvent: (e) => {
            if (e.type === "dismissed") resolve();
          },
          onError: () => resolve(),
        });
      }).catch(() => resolve());
    });
  }, [loaded]);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  return { loaded, load, show };
}

// ─── 배너 광고 (홈 하단 인라인) ──────────────────────────────────
export function TossBannerAd({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTossMiniApp() || !containerRef.current) return;
    let destroyFn: (() => void) | null = null;

    import("@apps-in-toss/web-framework").then(({ TossAds }) => {
      if (!TossAds.attachBanner.isSupported() || !containerRef.current) return;
      TossAds.initialize({ appId: "fonday" });
      const result = TossAds.attachBanner(AD_IDS.banner, containerRef.current, {
        theme: "light",
        tone: "grey",
        variant: "card",
        onSlotRender: () => setVisible(true),
        onSlotError: () => setVisible(false),
      });
      destroyFn = result.destroy;
    }).catch(() => {});

    return () => { destroyFn?.(); };
  }, []);

  if (!isTossMiniApp()) return null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: visible ? "block" : "none", minHeight: visible ? 96 : 0 }}
    />
  );
}
