/**
 * POST /api/admin/insta-gen-image — Imagen 4로 슬라이드 배경 이미지 1장 생성
 * Body: { key, prompt } — 영문 이미지 프롬프트
 * Response: { ok, image: "data:image/png;base64,..." }
 *
 * 대시보드에서 온디맨드로 호출 (DB에 저장 안 함)
 */
import { generateImage } from "../../lib/vertex-ai";

interface Env {
  GCP_SERVICE_ACCOUNT: string;
  ADMIN_KEY?: string;
}

export const onRequest = async (context: any) => {
  const { request, env } = context as { request: Request; env: Env };

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const adminKey = env.ADMIN_KEY;
  if (!adminKey) return new Response(JSON.stringify({ error: "No admin key" }), { status: 500, headers: { "Content-Type": "application/json" } });

  try {
    const body = await request.json() as { key?: string; prompt?: string };
    if (body.key !== adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (!body.prompt) {
      return new Response(JSON.stringify({ error: "prompt required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const images = await generateImage({
      gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
      prompt: body.prompt,
      numberOfImages: 1,
      aspectRatio: "1:1",
      model: "imagen-4.0-fast-generate-001",
      personGeneration: "allow_adult",
    });

    if (!images.length) {
      return new Response(JSON.stringify({ error: "No image generated" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, image: images[0] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("insta-gen-image error:", err);
    return new Response(JSON.stringify({ error: "Image generation failed", detail: err?.message ?? String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
