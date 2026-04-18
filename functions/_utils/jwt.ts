function base64urlEncode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): string {
  const pad = str.length % 4;
  const padded = pad ? str + "=".repeat(4 - pad) : str;
  return decodeURIComponent(
    atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function arrayBufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function createJWT(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })
  );
  const sigInput = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sigInput));
  return `${sigInput}.${arrayBufferToBase64url(sig)}`;
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, b, s] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const pad = s.length % 4;
    const paddedSig = pad ? s + "=".repeat(4 - pad) : s;
    const sigBytes = Uint8Array.from(
      atob(paddedSig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(`${h}.${b}`)
    );
    if (!valid) return null;
    return JSON.parse(base64urlDecode(b));
  } catch {
    return null;
  }
}

export async function getUserFromCookie(
  request: Request,
  secret: string
): Promise<Record<string, unknown> | null> {
  // 1) Bearer 토큰 (네이티브 앱)
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const user = await verifyJWT(token, secret);
    if (user) return user;
  }

  // 2) 쿠키 (웹)
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.split(";").find((c) => c.trim().startsWith("fonday_session="));
  if (match) {
    const token = match.split("=").slice(1).join("=").trim();
    const user = await verifyJWT(token, secret);
    if (user) return user;
  }

  // 3) 토스 미니앱 유저 (getAnonymousKey hash)
  const tossHash = request.headers.get("X-Toss-User");
  if (tossHash && tossHash.length >= 8) {
    return { id: `toss_${tossHash}`, provider: "toss", username: "토스 사용자" };
  }

  return null;
}
