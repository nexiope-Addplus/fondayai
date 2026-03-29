// WMO weather code → OWM-compatible weatherId mapping
function wmoToWeatherId(code: number): number {
  if (code === 0) return 800;           // Clear sky
  if (code <= 3) return 801 + (code - 1); // Partly/mostly cloudy, overcast
  if (code <= 48) return 741;           // Fog / rime fog
  if (code <= 55) return 300;           // Drizzle
  if (code <= 57) return 301;           // Freezing drizzle
  if (code <= 65) return 500 + (code - 61); // Rain
  if (code <= 67) return 511;           // Freezing rain
  if (code <= 75) return 600 + (code - 71); // Snow
  if (code === 77) return 611;          // Snow grains
  if (code <= 82) return 521;           // Rain showers
  if (code <= 86) return 621;           // Snow showers
  if (code === 95) return 200;          // Thunderstorm
  return 202;                           // Thunderstorm with hail
}

function wmoToMain(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Clouds";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Drizzle";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain";
  if (code <= 86) return "Snow";
  return "Thunderstorm";
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "lat/lon required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [meteoRes, geoRes, aqRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index`
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "FondayAI/1.0" } }
      ),
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,european_aqi`
      ).catch(() => null),
    ]);

    if (!meteoRes.ok) throw new Error(`Open-Meteo error: ${meteoRes.status}`);

    const meteo = await meteoRes.json() as any;
    const geo = geoRes.ok ? (await geoRes.json() as any) : null;

    const current = meteo.current ?? {};
    const wmoCode = current.weather_code ?? 0;
    const addr = geo?.address ?? {};
    const cityName = addr.city || addr.town || addr.village || addr.county || addr.state || "";

    // Air quality data
    let aqiVal: number | null = null;
    let pm25: number | null = null;
    let pm10: number | null = null;
    if (aqRes && aqRes.ok) {
      try {
        const aq = await aqRes.json() as any;
        aqiVal = aq?.current?.european_aqi ?? null;
        pm25 = aq?.current?.pm2_5 ?? null;
        pm10 = aq?.current?.pm10 ?? null;
      } catch {}
    }

    const result = {
      temp: Math.round(current.temperature_2m ?? 0),
      humidity: current.relative_humidity_2m ?? 0,
      weatherId: wmoToWeatherId(wmoCode),
      weatherMain: wmoToMain(wmoCode),
      cityName,
      aqi: aqiVal,
      pm25,
      pm10,
      uvIndex: current.uv_index ?? null,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
