import { getUserFromCookie } from "../_utils/jwt";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// VAPID 서명 (Worker의 sendPush 로직 간소화)
function b64u(str: string) {
  return Uint8Array.from(atob(str.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}
function toB64u(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signVapid(privateKeyB64u: string, audience: string, subject: string, publicKeyB64u: string) {
  const header = toB64u(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = toB64u(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })));
  const signingInput = `${header}.${payload}`;
  const pubBytes = b64u(publicKeyB64u);
  const key = await crypto.subtle.importKey("jwk", {
    kty: "EC", crv: "P-256",
    d: privateKeyB64u,
    x: toB64u(pubBytes.slice(1, 33)),
    y: toB64u(pubBytes.slice(33, 65)),
    key_ops: ["sign"],
  }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${toB64u(new Uint8Array(sig))}`;
}

async function sendPush(subscription: any, payload: any, env: any) {
  const { endpoint, keys: { p256dh, auth } } = subscription;
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const VAPID_PRIVATE = env.VAPID_PRIVATE_KEY;
  const VAPID_PUBLIC = env.VAPID_PUBLIC_KEY;
  const VAPID_SUB = env.VAPID_SUBJECT || "mailto:nexiope@gmail.com";
  if (!VAPID_PRIVATE || !VAPID_PUBLIC) throw new Error("VAPID keys not configured");

  const jwt = await signVapid(VAPID_PRIVATE, audience, VAPID_SUB, VAPID_PUBLIC);
  const enc = new TextEncoder();
  const receiverPublicBytes = b64u(p256dh);
  const authSecret = b64u(auth);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const localPublicJwk = await crypto.subtle.exportKey("jwk", localKeyPair.publicKey);
  const localPublicRaw = new Uint8Array(65);
  localPublicRaw[0] = 0x04;
  const xBytes = b64u(localPublicJwk.x!); const yBytes = b64u(localPublicJwk.y!);
  localPublicRaw.set(xBytes, 1); localPublicRaw.set(yBytes, 33);

  const receiverKey = await crypto.subtle.importKey("raw", receiverPublicBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: receiverKey }, localKeyPair.privateKey, 256));

  async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
    const prk = new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), ikm));
    const infoLen = new Uint8Array([0, len]);
    const t = new Uint8Array([...info, ...infoLen, 1]);
    const okm = new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), t));
    return okm.slice(0, len);
  }

  const keyInfo = new Uint8Array([...enc.encode("WebPush: info\0"), ...receiverPublicBytes, ...localPublicRaw]);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const contentKey = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
  const plaintext = new Uint8Array([...enc.encode(JSON.stringify(payload)), 2]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext));

  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096);
  const header2 = new Uint8Array([...salt, ...rs, 65, ...localPublicRaw]);
  const body = new Uint8Array([...header2, ...ciphertext]);

  const vapidPublicRaw = b64u(VAPID_PUBLIC);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${toB64u(vapidPublicRaw)}`,
    },
    body,
  });
  return res;
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  // ADMIN_KEY 인증
  const body: any = await request.json().catch(() => ({}));
  if (body.adminKey !== env.ADMIN_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const kv = env.PUSH_KV;
  if (!kv) return new Response(JSON.stringify({ error: "PUSH_KV not bound" }), { status: 500, headers: CORS });

  const type = body.type || "test"; // test, meal_lunch, meal_dinner, scan, uv

  try {
    const allIdsRaw = await kv.get("push:all_ids");
    if (!allIdsRaw) return new Response(JSON.stringify({ error: "No subscribers" }), { status: 404, headers: CORS });
    const allIds = JSON.parse(allIdsRaw);

    let sent = 0;
    let failed = 0;

    for (const id of allIds) {
      try {
        const raw = await kv.get(`push:sub:${id}`);
        if (!raw) continue;
        const record = JSON.parse(raw);
        const { subscription, lang, baumannType } = record;

        let title = "🧪 Fonday 테스트 알림";
        let pushBody = "푸시 알림이 정상 작동합니다!";

        if (type === "meal_lunch") {
          title = lang === "en" ? "🥗 Fonday Lunch Pick" : lang === "ja" ? "🥗 Fondayランチおすすめ" : "🥗 Fonday 점심 추천";
          pushBody = lang === "en" ? "Brown rice + Grilled salmon + Spinach salad" : lang === "ja" ? "玄米 + 焼きサーモン + ほうれん草サラダ" : "현미밥 + 구운 연어 + 시금치 샐러드";
        } else if (type === "meal_dinner") {
          title = lang === "en" ? "🍽️ Fonday Dinner Pick" : lang === "ja" ? "🍽️ Fondayディナーおすすめ" : "🍽️ Fonday 저녁 추천";
          pushBody = lang === "en" ? "Salmon steak + Olive oil salad" : lang === "ja" ? "サーモンステーキ + オリーブオイルサラダ" : "연어 스테이크 + 올리브오일 샐러드";
        } else if (type === "scan") {
          title = lang === "en" ? "📷 Time to scan!" : lang === "ja" ? "📷 スキャンの時間です！" : "📷 오늘의 피부 스캔 시간!";
          pushBody = lang === "en" ? "Check your skin condition today" : lang === "ja" ? "今日の肌状態をチェックしましょう" : "오늘 피부 상태를 확인해보세요";
        } else if (type === "test") {
          title = lang === "en" ? "🧪 Fonday Test" : lang === "ja" ? "🧪 Fondayテスト" : "🧪 Fonday 테스트 알림";
          pushBody = lang === "en" ? "Push notifications are working!" : lang === "ja" ? "プッシュ通知が正常に動作しています！" : "푸시 알림이 정상 작동합니다!";
        }

        const res = await sendPush(subscription, { title, body: pushBody, url: "/" }, env);
        if (res.status >= 200 && res.status < 300) sent++;
        else failed++;
      } catch (e: any) {
        console.error(`[test-push] id=${id}:`, e.message);
        failed++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failed, total: allIds.length }), { headers: CORS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
};
