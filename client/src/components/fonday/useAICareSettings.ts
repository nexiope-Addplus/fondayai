import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import type { AICareSettings, AnalysisResult } from "./types";
import {
  buildBaumannTypeFromResult,
  buildPushScoreSummary,
  getAICareSettings,
  getReminderSettings,
  saveAICareSettings,
  saveReminderSettings,
  shouldShowPushPrompt,
  syncReminderToServer,
} from "./utils";

export function useAICareSettings(analysisResult: AnalysisResult | null) {
  const { t } = useTranslation();
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [aiCareSettings, setAICareSettings] = useState<AICareSettings>(() => getAICareSettings());

  const pushBaumannType = buildBaumannTypeFromResult(analysisResult);

  const aiCareLabels = i18n.language?.startsWith("en")
    ? {
        title: "Skincare Alerts",
        desc: "All-day skin coaching: scan, meals, hydration, UV, weather & bedtime routine.",
        on: "Alerts ON",
        off: "Get Alerts",
        scan: "📷 Scan",
        meal: "🥗 Meals",
        hydration: "💧 Hydration",
        routine: "✨ Routine",
        uvCare: "☀️ UV",
        bedtime: "🌙 Bedtime",
        weatherCare: "🌤 Weather",
        schedule: "08:00 Weather · 07:30 Scan · 10:00 UV · 12:00 Lunch · 15:00 Water · 18:00 Dinner · Routine · 23:00 Bedtime",
      }
    : i18n.language?.startsWith("ja")
      ? {
          title: "スキンケア通知",
          desc: "スキャン・食事・水分・UV・天気・就寝ケアまで丸ごと管理します。",
          on: "通知 ON",
          off: "通知を受け取る",
          scan: "📷 スキャン",
          meal: "🥗 食事",
          hydration: "💧 水分",
          routine: "✨ ルーティン",
          uvCare: "☀️ UV",
          bedtime: "🌙 就寝",
          weatherCare: "🌤 天気",
          schedule: "08:00 天気 · 07:30 スキャン · 10:00 UV · 12:00 昼食 · 15:00 水分 · 18:00 夕食 · ルーティン · 23:00 就寝",
        }
      : {
          title: "스킨케어 알림",
          desc: "하루 종일 피부 코칭: 스캔, 식단, 수분, UV, 날씨, 취침 루틴까지.",
          on: "알림 ON",
          off: "알림 받기",
          scan: "📷 스캔",
          meal: "🥗 식단",
          hydration: "💧 수분",
          routine: "✨ 루틴",
          uvCare: "☀️ UV",
          bedtime: "🌙 취침",
          weatherCare: "🌤 날씨",
          schedule: "08:00 날씨 · 07:30 스캔 · 10:00 UV · 12:00 점심 · 15:00 수분 · 18:00 저녁 · 루틴 · 23:00 취침",
        };

  const syncPushSubscription = async (subscription: PushSubscriptionJSON, nextCareSettings: AICareSettings) => {
    await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        baumannType: pushBaumannType,
        lang: i18n.language || "ko",
        scoreSummary: buildPushScoreSummary(analysisResult),
        careSettings: nextCareSettings,
      }),
    });
  };

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => {
        if (sub) setPushSubscribed(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!analysisResult) return;
    const timer = setTimeout(() => {
      if (!pushSubscribed && shouldShowPushPrompt()) {
        setShowPushPrompt(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisResult]);

  useEffect(() => {
    if (pushSubscribed) setShowPushPrompt(false);
  }, [pushSubscribed]);

  useEffect(() => {
    if (!analysisResult || !pushSubscribed) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    navigator.serviceWorker.ready
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        if (!existing || cancelled) return;

        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: existing.toJSON(),
            baumannType: pushBaumannType,
            lang: i18n.language || "ko",
            scoreSummary: buildPushScoreSummary(analysisResult),
            careSettings: aiCareSettings,
          }),
        });
        await syncReminderToServer(getReminderSettings());
      })
      .catch((error) => console.error("[push-sync]", error));

    return () => {
      cancelled = true;
    };
  }, [aiCareSettings, analysisResult, pushBaumannType, pushSubscribed]);

  const handlePushToggle = async (forceEnabled?: boolean) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert(t("nutrients.pushUnsupported")); return;
    }
    if (Notification.permission === "denied") {
      alert(t("nutrients.pushDenied")); return;
    }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      const shouldEnable = forceEnabled ?? !pushSubscribed;
      if (existing && !shouldEnable) {
        const nextCare = { ...aiCareSettings, enabled: false };
        setAICareSettings(nextCare);
        saveAICareSettings(nextCare);
        await syncReminderToServer({ ...getReminderSettings(), enabled: false });
        await fetch("/api/push-subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
        setPushSubscribed(false);
      } else {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { setPushLoading(false); return; }
        // 빌드 타임 env가 없으면 서버에서 공개키 가져오기
        let VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
        if (!VAPID_PUBLIC) {
          try {
            const res = await fetch("/api/vapid-public-key");
            if (res.ok) { const d = await res.json(); VAPID_PUBLIC = d.key || ""; }
          } catch {}
        }
        if (!VAPID_PUBLIC) { setPushLoading(false); return; }
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC,
        });
        const nextCare = { ...aiCareSettings, enabled: true };
        setAICareSettings(nextCare);
        saveAICareSettings(nextCare);
        await syncPushSubscription(sub.toJSON(), nextCare);
        await syncReminderToServer({
          ...getReminderSettings(),
          enabled: nextCare.routine,
          hour: nextCare.routineHour,
          minute: nextCare.routineMinute,
        });
        setPushSubscribed(true);
      }
    } catch (e) { console.error("[push]", e); }
    setPushLoading(false);
  };

  const updateAICareOption = async (key: "scan" | "meal" | "hydration" | "routine" | "uvCare" | "bedtime" | "weatherCare", value: boolean) => {
    const next = { ...aiCareSettings, [key]: value };
    setAICareSettings(next);
    saveAICareSettings(next);
    if (key === "routine") {
      saveReminderSettings({
        ...getReminderSettings(),
        enabled: value,
        hour: next.routineHour,
        minute: next.routineMinute,
      });
      await syncReminderToServer({
        ...getReminderSettings(),
        enabled: value,
        hour: next.routineHour,
        minute: next.routineMinute,
      });
    }
    if (!pushSubscribed) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await syncPushSubscription(sub.toJSON(), next);
    } catch (error) {
      console.error("[ai-care-option]", error);
    }
  };

  return {
    aiCareSettings,
    setAICareSettings,
    pushSubscribed,
    pushLoading,
    showPushPrompt,
    setShowPushPrompt,
    handlePushToggle,
    updateAICareOption,
    aiCareLabels,
  };
}
