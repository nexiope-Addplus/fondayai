/**
 * Cloudflare D1 HTTP API 클라이언트
 * 환경변수: CF_ACCOUNT_ID, CF_D1_TOKEN
 * DB ID는 하드코딩 (fonday-db)
 */
const DB_ID = process.env.CF_D1_DB_ID || "125366b1-198e-4cef-a3d7-167befda2c77";

function getBase() {
  const accountId = process.env.CF_ACCOUNT_ID;
  if (!accountId) return null;
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${DB_ID}`;
}

function isConfigured() {
  return !!(process.env.CF_ACCOUNT_ID && process.env.CF_D1_TOKEN);
}

async function d1Query(sql: string, params: (string | number | null)[] = []) {
  const base = getBase();
  const token = process.env.CF_D1_TOKEN;
  if (!base || !token) return null;
  try {
    const resp = await fetch(`${base}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });
    if (!resp.ok) {
      console.error("[D1] query failed:", resp.status, await resp.text());
      return null;
    }
    const data: any = await resp.json();
    if (!data.success) {
      console.error("[D1] query error:", data.errors);
      return null;
    }
    return data.result?.[0] ?? null;
  } catch (e) {
    console.error("[D1] fetch error:", e);
    return null;
  }
}

export { isConfigured, d1Query };
