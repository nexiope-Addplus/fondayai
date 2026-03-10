interface Env {
  OPENWEATHER_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "lat/lon required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = ctx.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      ),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API error: ${weatherRes.status}`);
    }

    const weather = await weatherRes.json() as any;
    const aqi = aqiRes.ok ? (await aqiRes.json() as any) : null;

    const result = {
      temp: Math.round(weather.main?.temp ?? 0),
      humidity: weather.main?.humidity ?? 0,
      weatherId: weather.weather?.[0]?.id ?? 800,
      weatherMain: weather.weather?.[0]?.main ?? "Clear",
      cityName: weather.name ?? "",
      aqi: aqi?.list?.[0]?.main?.aqi ?? null, // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
      uvIndex: null as number | null, // free tier doesn't include UVI in current weather
    };

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800", // 30min cache
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
