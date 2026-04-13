import React, { useRef, useState, useEffect } from "react";

// ─── 페이스 메시 오버레이 (실제 얼굴 인식) ──────────────────────
export function FaceMeshOverlay({ imageSrc }: { imageSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const drawFallbackMesh = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      const dpr = window.devicePixelRatio || 1;
      const cW = canvas.offsetWidth || 100;
      const cH = canvas.offsetHeight || 120;
      canvas.width = cW * dpr;
      canvas.height = cH * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = [
        [0.5, 0.14], [0.36, 0.2], [0.64, 0.2], [0.28, 0.31], [0.72, 0.31],
        [0.24, 0.49], [0.76, 0.49], [0.32, 0.71], [0.68, 0.71], [0.5, 0.84],
        [0.41, 0.4], [0.59, 0.4], [0.5, 0.52], [0.44, 0.63], [0.56, 0.63],
      ].map(([x, y]) => [x * canvas.width, y * canvas.height] as const);

      const tessellationEdges = [
        [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 9],
        [1, 10], [2, 11], [10, 12], [11, 12], [10, 13], [11, 14], [13, 9], [14, 9],
        [3, 10], [4, 11], [5, 12], [6, 12], [7, 13], [8, 14], [10, 11], [13, 14],
      ];
      const contourEdges = [
        [0, 1], [1, 3], [3, 5], [5, 7], [7, 9],
        [0, 2], [2, 4], [4, 6], [6, 8], [8, 9],
        [10, 11], [13, 14], [10, 13], [11, 14],
      ];

      const isSmall = cW < 150;
      const tessWidth = (isSmall ? 0.4 : 0.6) * dpr;
      const contourWidth = (isSmall ? 1.0 : 1.5) * dpr;
      const dotRadius = (isSmall ? 1.0 : 1.5) * dpr;

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = tessWidth;
      for (const [a, b] of tessellationEdges) {
        ctx.beginPath();
        ctx.moveTo(points[a][0], points[a][1]);
        ctx.lineTo(points[b][0], points[b][1]);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = contourWidth;
      for (const [a, b] of contourEdges) {
        ctx.beginPath();
        ctx.moveTo(points[a][0], points[a][1]);
        ctx.lineTo(points[b][0], points[b][1]);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (const [x, y] of points) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!cancelled) setVisible(true);
    };

    (async () => {
      try {
        const mp = await import('@mediapipe/face_mesh');
        const { FaceMesh, FACEMESH_CONTOURS, FACEMESH_TESSELATION } = mp;

        const img = new Image();
        img.src = imageSrc;
        await new Promise<void>((r, rej) => { img.onload = () => r(); img.onerror = rej; });

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        let lms: any[] = [];
        await new Promise<void>((resolve) => {
          faceMesh.onResults((results: any) => {
            if (!cancelled && results.multiFaceLandmarks?.[0]) {
              lms = results.multiFaceLandmarks[0];
            }
            resolve();
          });
          faceMesh.send({ image: img });
        });
        faceMesh.close();

        if (cancelled) return;
        if (!lms.length) {
          await drawFallbackMesh();
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // DOM 렌더 대기 (offsetWidth가 0일 수 있음)
        await new Promise<void>(r => requestAnimationFrame(() => r()));

        // 실제 표시 크기 (CSS pixel), devicePixelRatio로 선명하게
        const dpr = window.devicePixelRatio || 1;
        const cW = canvas.offsetWidth || 100;
        const cH = canvas.offsetHeight || 120;
        canvas.width = cW * dpr;
        canvas.height = cH * dpr;

        // object-cover 와 동일한 좌표 변환
        const iW = img.naturalWidth;
        const iH = img.naturalHeight;
        const scale = Math.max(cW / iW, cH / iH);
        const ox = (cW - iW * scale) / 2;
        const oy = (cH - iH * scale) / 2;
        const toXY = (lm: any): [number, number] => [
          (lm.x * iW * scale + ox) * dpr,
          (lm.y * iH * scale + oy) * dpr,
        ];

        const ctx = canvas.getContext('2d')!;

        // 작은 컨테이너일수록 선 굵기 조정
        const isSmall = cW < 150;
        const tessWidth = isSmall ? 0.4 * dpr : 0.6 * dpr;
        const contourWidth = isSmall ? 1.0 * dpr : 1.5 * dpr;
        const dotRadius = isSmall ? 1.0 * dpr : 1.5 * dpr;

        // 테셀레이션 (촘촘한 메시)
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = tessWidth;
        for (const [a, b] of FACEMESH_TESSELATION) {
          const [ax, ay] = toXY(lms[a]);
          const [bx, by] = toXY(lms[b]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        // 외곽선 + 눈/코/입 강조
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = contourWidth;
        for (const [a, b] of FACEMESH_CONTOURS) {
          const [ax, ay] = toXY(lms[a]);
          const [bx, by] = toXY(lms[b]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        // 랜드마크 점 (8개마다 1개)
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < lms.length; i += 8) {
          const [x, y] = toXY(lms[i]);
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!cancelled) setVisible(true);
      } catch (e) {
        await drawFallbackMesh();
        console.warn('Face mesh detection failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [imageSrc]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Face mesh analysis overlay"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
    />
  );
}
