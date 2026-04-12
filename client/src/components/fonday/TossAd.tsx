import React, { useEffect, useRef, useState, useCallback } from "react";
import { isTossMiniApp } from "./utils";

// ─── 광고 그룹 ID (출시 전 실제 ID로 교체) ──────────────────────
const AD_IDS = {
  rewarded: "ait-ad-test-rewarded-id",
  interstitial: "ait-ad-test-interstitial-id",
  banner: "ait-ad-test-banner-id",
} as const;

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
