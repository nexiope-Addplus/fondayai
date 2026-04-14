// ─── 이미지 처리 / 음식 유틸 ─────────────────────────────────────────────────

export async function cropFaceFromImage(src: string): Promise<string> {
  try {
    const mp = await import('@mediapipe/face_mesh');
    const { FaceMesh } = mp;
    const img = new Image();
    img.src = src;
    await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); });
    const faceMesh = new FaceMesh({
      locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.3, minTrackingConfidence: 0.3 });
    let lms: any[] = [];
    await new Promise<void>((r) => {
      faceMesh.onResults((res: any) => { if (res.multiFaceLandmarks?.[0]) lms = res.multiFaceLandmarks[0]; r(); });
      faceMesh.send({ image: img });
    });
    faceMesh.close();
    if (!lms.length) return src;
    const xs = lms.map((l: any) => l.x);
    const ys = lms.map((l: any) => l.y);
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    const fW = maxX - minX, fH = maxY - minY;
    minX = Math.max(0, minX - fW * 0.22);
    maxX = Math.min(1, maxX + fW * 0.22);
    minY = Math.max(0, minY - fH * 0.48);
    maxY = Math.min(1, maxY + fH * 0.12);
    const iW = img.naturalWidth, iH = img.naturalHeight;
    const sx = minX * iW, sy = minY * iH, sw = (maxX - minX) * iW, sh = (maxY - minY) * iH;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return src;
  }
}

export function compressThumbnail(base64: string, maxSize = 300): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export function parseFoodOptions(value?: string): string[] {
  if (!value) return [];
  const delimiter = value.includes("|") ? "|" : "·";
  return value.split(delimiter).map((item) => item.trim()).filter(Boolean);
}

export function pickFoodOption(value: string | undefined, seed: number, fallbackIndex = 0): string | null {
  const options = parseFoodOptions(value);
  if (options.length === 0) return null;
  const normalizedSeed = Math.abs(Math.round(seed));
  return options[normalizedSeed % options.length] ?? options[Math.min(fallbackIndex, options.length - 1)] ?? null;
}

export function dedupeFoods(items: ({ food: string; why: string } | null)[]): { food: string; why: string }[] {
  const seen = new Set<string>();
  return items.filter((item): item is { food: string; why: string } => {
    if (!item?.food) return false;
    if (seen.has(item.food)) return false;
    seen.add(item.food);
    return true;
  });
}
