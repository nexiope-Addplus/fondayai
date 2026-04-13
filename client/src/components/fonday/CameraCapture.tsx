import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCAN_FROM } from "./constants";
import { isTossMiniApp } from "./utils";

type BrightnessLevel = "ok" | "too_dark" | "too_bright";

function measureBrightness(video: HTMLVideoElement): { avg: number; level: BrightnessLevel } {
  const c = document.createElement("canvas");
  const size = 64;
  c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return { avg: 128, level: "ok" };
  ctx.drawImage(video, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  const avg = sum / (size * size);
  if (avg < 50) return { avg, level: "too_dark" };
  if (avg > 210) return { avg, level: "too_bright" };
  return { avg, level: "ok" };
}

// ─── 얼굴 가이드 카메라 ──────────────────────────────────────────
export function CameraCapture({ onCapture, onClose }: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [useFile, setUseFile] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState<BrightnessLevel>("ok");
  const brightnessTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ready) return;
    brightnessTimer.current = setInterval(() => {
      if (videoRef.current) {
        const { level } = measureBrightness(videoRef.current);
        setBrightnessLevel(level);
      }
    }, 1000);
    return () => { if (brightnessTimer.current) clearInterval(brightnessTimer.current); };
  }, [ready]);

  useEffect(() => {
    // 토스 미니앱은 getUserMedia 대신 파일 선택(카메라 캡처) 방식 사용
    if (isTossMiniApp()) { setUseFile(true); return; }

    if (!navigator.mediaDevices?.getUserMedia) { setUseFile(true); return; }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setUseFile(true));

    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // 얼굴 영역: 가로 70%, 세로 85%, 세로 위쪽 편향 크롭
    const cropW = vw * 0.70;
    const cropH = Math.min(vh, cropW * 1.3);
    const cropX = (vw - cropW) / 2;
    const cropY = Math.max(0, (vh - cropH) * 0.25);

    // max 1024px로 제한하여 전송 크기 최적화
    const MAX_DIM = 1024;
    const scale = Math.min(1, MAX_DIM / Math.max(cropW, cropH));
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 전면 카메라 좌우 반전 보정
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    try {
      const brightness = measureBrightness(video);
      localStorage.setItem("fonday_scan_meta", JSON.stringify({
        brightness: Math.round(brightness.avg),
        brightnessLevel: brightness.level,
        timestamp: new Date().toISOString(),
        device: navigator.userAgent.slice(0, 80),
      }));
    } catch {}

    canvas.toBlob(blob => {
      if (!blob) return;
      streamRef.current?.getTracks().forEach(t => t.stop());
      onCapture(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.82);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onCapture(file); }
  };

  if (useFile) {
    const captureRef = React.createRef<HTMLInputElement>();
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <div className="relative flex-1 overflow-hidden px-6 pt-14 pb-8 flex flex-col items-center justify-center">
          <button onClick={onClose} aria-label={t("common.close")} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="w-full max-w-[340px]">
            <div className="text-center mb-6">
              <p className="text-white text-sm font-semibold drop-shadow-lg">{isTossMiniApp() ? t("camera.tossGuide1") : t("camera.guide1")}</p>
              <p className="text-white/60 text-xs mt-1">{isTossMiniApp() ? t("camera.tossGuide2") : t("camera.guide2")}</p>
            </div>

            <div className="relative mx-auto aspect-[3/4] max-h-[58vh] overflow-hidden rounded-[32px] bg-neutral-900 border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_52%)]" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <mask id="faceGuideCutout">
                    <rect width="100%" height="100%" fill="white" />
                    <ellipse cx="50%" cy="42%" rx="29%" ry="34%" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.54)" mask="url(#faceGuideCutout)" />
                <ellipse cx="50%" cy="42%" rx="29%" ry="34%"
                  fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" />
                <ellipse cx="50%" cy="42%" rx="29%" ry="34%"
                  fill="none" stroke={SCAN_FROM} strokeWidth="1.5" strokeDasharray="10 6" opacity="0.72" />
                <line x1="21%" y1="42%" x2="79%" y2="42%" stroke="rgba(255,255,255,0.26)" strokeWidth="1" strokeDasharray="4 5" />
                <line x1="50%" y1="11%" x2="50%" y2="74%" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 5" />
              </svg>
              <div className="absolute left-5 right-5 bottom-6">
                <div className="rounded-2xl bg-black/45 backdrop-blur px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                    {isTossMiniApp() ? t("camera.tossSelectTitle") : t("scanning.progress", "Analyzing")}
                  </p>
                  <p className="text-[12px] text-white/65 mt-1">
                    {isTossMiniApp() ? t("camera.tossSelectDesc") : t("camera.selectMethod", "촬영 방법을 선택해 주세요")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black px-6 pb-8 pt-2 flex flex-col gap-3">
          <Button onClick={() => captureRef.current?.click()} className="bg-white text-black font-bold px-8 h-14 rounded-2xl">
            {t("camera.capture", "셀카 촬영하기")}
          </Button>
          <input ref={captureRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
          <Button onClick={() => fileRef.current?.click()} className="bg-white/20 text-white font-bold px-8 h-14 rounded-2xl">
            {t("camera.selectPhoto", "앨범에서 선택")}
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-white/60">{t("camera.cancel")}</Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* 카메라 뷰 */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label={t("camera.preview")}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* 얼굴 가이드 오버레이 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="faceCutout">
              <rect width="100%" height="100%" fill="white" />
              <ellipse cx="50%" cy="40%" rx="32%" ry="37%" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#faceCutout)" />
          {/* 가이드 타원 실선 */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />
          {/* 가이드 타원 점선 (컬러) */}
          <ellipse cx="50%" cy="40%" rx="32%" ry="37%"
            fill="none" stroke={SCAN_FROM} strokeWidth="1.5" strokeDasharray="10 6" opacity="0.7" />
        </svg>

        {/* 안내 문구 */}
        <div className="absolute top-[8%] left-0 right-0 text-center pointer-events-none px-6">
          <p className="text-white text-sm font-semibold drop-shadow-lg">{t("camera.guide1")}</p>
          <p className="text-white/60 text-xs mt-1">{t("camera.guide2")}</p>
        </div>

        {/* 밝기 경고 */}
        <AnimatePresence>
          {brightnessLevel !== "ok" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-[18%] left-4 right-4 flex items-center justify-center gap-2 bg-black/70 backdrop-blur rounded-xl py-2.5 px-4 pointer-events-none"
            >
              {brightnessLevel === "too_dark" ? (
                <><Moon className="w-4 h-4 text-yellow-400 shrink-0" /><span className="text-yellow-300 text-xs font-medium">{t("camera.tooDark", "조명이 부족합니다. 밝은 곳에서 촬영해주세요")}</span></>
              ) : (
                <><Sun className="w-4 h-4 text-orange-400 shrink-0" /><span className="text-orange-300 text-xs font-medium">{t("camera.tooBright", "빛이 너무 강합니다. 직사광선을 피해주세요")}</span></>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 닫기 버튼 */}
        <button onClick={onClose} aria-label={t("common.close")} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* 촬영 버튼 */}
      <div className="bg-black py-8 flex items-center justify-center">
        <motion.button
          onClick={capture}
          disabled={!ready}
          aria-label={t("camera.capture")}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl disabled:opacity-30"
          whileTap={{ scale: 0.88 }}
        >
          <div className="w-15 h-15 w-[60px] h-[60px] rounded-full border-[3px] border-black/15" />
        </motion.button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
