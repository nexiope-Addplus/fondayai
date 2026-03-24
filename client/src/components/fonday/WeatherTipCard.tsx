import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sun } from "lucide-react";
import { DEEP_GREEN, TINT_GREEN, TEXT_SECONDARY, fadeChild, BORDER_COLOR, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";
import type { WeatherData } from "./types";
import { getWeatherTipKey } from "./utils";

// ─── 날씨 연동 데일리 팁 카드 ─────────────────────────────────────
export function WeatherTipCard({ compact, weather }: {
  compact?: boolean;
  weather?: WeatherData | null;
} = {}) {
  const { t } = useTranslation();

  // 로딩 상태 처리 (데이터가 아직 없을 때)
  if (!weather) {
    return (
      <div className="px-3.5 py-2.5 border-t border-stone-100/80 animate-pulse" style={{ background: TINT_GREEN }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-stone-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-stone-200 rounded w-1/3" />
            <div className="h-2 bg-stone-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const tipKey = getWeatherTipKey(weather);
  const tipRaw = t(`weather.tips.${tipKey}`, { returnObjects: true });
  const tipArr = Array.isArray(tipRaw) ? tipRaw : [tipRaw];
  const dayIdx = Math.floor(Date.now() / 86400000) % Math.max(1, tipArr.length);
  const rawTip = tipArr[dayIdx];
  const fallbackTip = { emoji: "🌤️", title: "오늘의 피부 케어", body: "날씨에 맞춘 스킨케어로 하루를 시작하세요." };
  const tip = (rawTip && typeof rawTip === 'object' && 'emoji' in rawTip) ? rawTip as { emoji: string; title: string; body: string } : fallbackTip;
  const aqiLabel = weather.aqi ? t(`weather.aqi${weather.aqi}`) : null;

  if (compact) {
    return (
      <div className="px-3.5 py-2.5 border-t border-stone-100/80"
        style={{ background: TINT_GREEN }}>
        <div className="flex items-start gap-2.5">
          <span className="text-xl leading-none flex-shrink-0 mt-0.5">{tip.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-700 leading-tight">{tip.title}</p>
            <p className="text-[10.5px] text-stone-500 leading-relaxed mt-0.5">{tip.body}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: DEEP_GREEN }}>{weather.temp}°C</span>
            {weather.cityName && (
              <span className="text-[11px] text-stone-400 font-medium">📍 {weather.cityName}</span>
            )}
            {aqiLabel && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/70 text-stone-500">{aqiLabel}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={fadeChild} className="mb-4">
      <div
        className="rounded-2xl p-4 overflow-hidden relative"
        style={{ background: TINT_GREEN, border: `1px solid ${BORDER_COLOR}` }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20"
          style={{ background: DEEP_GREEN }} />
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: DEEP_GREEN }}>
            <Sun className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>
            {t("weather.cardTitle")}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none flex-shrink-0">{tip.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 mb-1 leading-tight">{tip.title}</p>
            <p className="text-[11.5px] text-stone-500 leading-relaxed">{tip.body}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ background: DEEP_GREEN }}>
            {weather.temp}°C
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 text-stone-600">
            {t("weather.humidity", { val: weather.humidity })}
          </span>
          {aqiLabel && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 text-stone-600">
              {aqiLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── idle 미리보기 점수 바 ────────────────────────────────────────
export function MiniScoreBarIdle({ label, score, color, delay, delta }: {
  label: string;
  score: number;
  color: string;
  delay: number;
  delta?: number | null;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] flex-shrink-0 w-[80px] leading-snug break-words" style={{ color: TEXT_SECONDARY }}>{label}</span>
      <div className="flex-1 h-[5px] rounded-full overflow-hidden mt-1" style={{ background: "#E8E0D8" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: animated ? `${score}%` : "0%",
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>
      <span className="text-[11px] font-normal flex-shrink-0 w-6 text-right mt-0.5" style={{ fontFamily: FONT_DISPLAY, color }}>{score}</span>
      {delta != null && delta !== 0 && (
        <span className={`text-[10px] font-bold flex-shrink-0 w-8 text-right mt-0.5 ${delta > 0 ? "text-emerald-500" : "text-rose-500"}`}>
          {delta > 0 ? `+${delta}` : `${delta}`}
        </span>
      )}
    </div>
  );
}
