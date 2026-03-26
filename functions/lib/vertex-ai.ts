/**
 * Vertex AI Gemini helper for Cloudflare Workers / Functions.
 *
 * Replaces @google/generative-ai SDK with direct REST calls to
 * Vertex AI, using Web Crypto API for JWT signing (no Node.js deps).
 *
 * Usage:
 *   const result = await callGemini({
 *     gcpServiceAccount: env.GCP_SERVICE_ACCOUNT,
 *     contents: [{ parts: [{ text: "Hello" }] }],
 *   });
 *   const text = result.candidates[0].content.parts.find(p => p.text)?.text;
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallGeminiOptions {
  /** JSON string of the GCP service account key */
  gcpServiceAccount: string;
  /** Model name — default "gemini-2.5-flash" */
  model?: string;
  /** Vertex AI contents array */
  contents: any[];
  /** Optional generationConfig */
  generationConfig?: any;
  /** Optional safetySettings */
  safetySettings?: any[];
  /** Optional systemInstruction */
  systemInstruction?: any;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GCP_PROJECT_ID = "project-16bcf261-8966-4697-89a";
const GCP_REGION = "us-central1";
const TOKEN_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
const TOKEN_LIFETIME_SECS = 3600;

// ---------------------------------------------------------------------------
// In-memory token cache  (per-isolate; fine for Workers)
// ---------------------------------------------------------------------------

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// ---------------------------------------------------------------------------
// Helpers — Base64url encode (no padding)
// ---------------------------------------------------------------------------

function base64urlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToUint8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// ---------------------------------------------------------------------------
// PEM → CryptoKey (PKCS#8)
// ---------------------------------------------------------------------------

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/[\n\r\s]/g, "");

  const binaryStr = atob(pemBody);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

// ---------------------------------------------------------------------------
// Create a signed JWT for Google OAuth2
// ---------------------------------------------------------------------------

async function createSignedJwt(
  serviceAccount: { client_email: string; private_key: string },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: TOKEN_URI,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECS,
    scope: TOKEN_SCOPE,
  };

  const encodedHeader = base64urlEncode(strToUint8(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(strToUint8(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    strToUint8(signingInput),
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

// ---------------------------------------------------------------------------
// Exchange JWT for an OAuth2 access token (with caching)
// ---------------------------------------------------------------------------

async function getAccessToken(
  serviceAccount: { client_email: string; private_key: string },
): Promise<string> {
  // Return cached token if still valid (with 60s margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const jwt = await createSignedJwt(serviceAccount);

  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OAuth2 token exchange failed (${res.status}): ${errText}`);
  }

  const data: any = await res.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? TOKEN_LIFETIME_SECS) * 1000,
  };

  return cachedToken.accessToken;
}

// ---------------------------------------------------------------------------
// Call Vertex AI Gemini API
// ---------------------------------------------------------------------------

export async function callGemini(options: CallGeminiOptions): Promise<any> {
  const {
    gcpServiceAccount,
    model = "gemini-2.5-flash",
    contents,
    generationConfig,
    safetySettings,
    systemInstruction,
  } = options;

  const sa = JSON.parse(gcpServiceAccount);
  const accessToken = await getAccessToken(sa);

  const url =
    `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/${model}:generateContent`;

  const body: any = { contents };
  if (generationConfig) body.generationConfig = generationConfig;
  if (safetySettings) body.safetySettings = safetySettings;
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vertex AI API error (${res.status}): ${errText}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Convenience: extract text from Vertex AI response
// ---------------------------------------------------------------------------

export function extractText(response: any): string {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  // Skip thinking parts — only return text parts
  return parts
    .filter((p: any) => typeof p.text === "string" && !p.thought)
    .map((p: any) => p.text)
    .join("");
}

// ---------------------------------------------------------------------------
// Safety settings shortcut — block none for all categories
// ---------------------------------------------------------------------------

export const SAFETY_SETTINGS_NONE = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
];
