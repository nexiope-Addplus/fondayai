// R2 image proxy for Instagram — serves images from R2 via fondayai.com
// Meta blocks .workers.dev domains, so we proxy through Pages custom domain
interface Env {
  INSTA_IMAGES: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
  if (!key) return new Response("Not found", { status: 404 });

  const obj = await env.INSTA_IMAGES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const ext = key.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    "application/octet-stream";

  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

// HEAD support for Instagram pre-validation
export const onRequestHead: PagesFunction<Env> = async ({ params, env }) => {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;
  if (!key) return new Response(null, { status: 404 });

  const obj = await env.INSTA_IMAGES.head(key);
  if (!obj) return new Response(null, { status: 404 });

  const ext = key.split(".").pop()?.toLowerCase();
  const contentType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    "application/octet-stream";

  return new Response(null, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(obj.size),
      "Access-Control-Allow-Origin": "*",
    },
  });
};
