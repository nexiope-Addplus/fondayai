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

  // Decode subscription keys
  const receiverPublicBytes = b64u(p256dh);
  const authSecret = b64u(auth);

  // Generate ephemeral ECDH key pair
  const senderKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  ) as CryptoKeyPair;
  const senderPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", senderKeys.publicKey)
  );

  // ECDH shared secret
  const receiverKey = await crypto.subtle.importKey(
    "raw", receiverPublicBytes, { name: "ECDH", namedCurve: "P-256" }, false, []
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: receiverKey }, senderKeys.privateKey, 256
  );

  // RFC 8291 key derivation using Web Crypto HKDF
  // Step 1: IKM = HKDF(salt=authSecret, ikm=sharedSecret, info="WebPush: info\0" || ua_public || as_public, 32)
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const keyInfo = new Uint8Array([...enc.encode("WebPush: info\0"), ...receiverPublicBytes, ...senderPublicRaw]);
  const ikm = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: authSecret, info: keyInfo }, ikmKey, 256
  );

  // Step 2: Derive CEK and Nonce from IKM with random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prkKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);

  // CEK = HKDF(salt, IKM, "Content-Encoding: aes128gcm\0", 16)
  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: aes128gcm\0") }, prkKey, 128
  );
  // Nonce = HKDF(salt, IKM, "Content-Encoding: nonce\0", 12)
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: nonce\0") }, prkKey, 96
  );

  // Encrypt payload with AES-128-GCM
  const aesKey = await crypto.subtle.importKey("raw", cekBits, "AES-GCM", false, ["encrypt"]);
  const nonce = new Uint8Array(nonceBits);

  // RFC 8188: plaintext || delimiter(0x02 for final record)
  const plaintext = enc.encode(JSON.stringify(payload));
  const padded = new Uint8Array(plaintext.length + 1);
  padded.set(plaintext);
  padded[plaintext.length] = 0x02;

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded)
  );

  // Build aes128gcm body: salt(16) + rs(4, big-endian) + idlen(1) + keyid(65) + ciphertext
  const rs = 4096;
  const body = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length);
  let offset = 0;
  body.set(salt, offset); offset += 16;
  body[offset++] = (rs >> 24) & 0xff;
  body[offset++] = (rs >> 16) & 0xff;
  body[offset++] = (rs >> 8) & 0xff;
  body[offset++] = rs & 0xff;
  body[offset++] = 65; // idlen = 65 (uncompressed public key)
  body.set(senderPublicRaw, offset); offset += 65;
  body.set(ciphertext, offset);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC}`,
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
    const details: any[] = [];

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
        const statusCode = res.status;
        if (statusCode >= 200 && statusCode < 300) {
          sent++;
          details.push({ id: id.slice(0, 8), status: statusCode, ok: true });
        } else {
          failed++;
          const errText = await res.text().catch(() => "");
          details.push({ id: id.slice(0, 8), status: statusCode, error: errText.slice(0, 200) });
        }
      } catch (e: any) {
        console.error(`[test-push] id=${id}:`, e.message);
        failed++;
        details.push({ id: id.slice(0, 8), status: 0, error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, sent, failed, total: allIds.length, details }), { headers: CORS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
};
