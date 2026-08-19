import { z } from "zod";

export const WEATHER_FETCH_TIMEOUT_MS = 8_000;

export type WeatherSnapshot = {
  location: string;
  latitude: number;
  longitude: number;
  condition: string;
  temperatureC: number;
  feelsLikeC: number;
  rainProbability: number;
  humidity: number;
  windKmh: number;
  fieldNote: string;
  alerts: string[];
  observedAt: string;
  source: "Open-Meteo live forecast";
};

const responseSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  daily: z.object({
    precipitation_probability_max: z.array(z.number()).min(1),
    precipitation_sum: z.array(z.number()).min(1),
    wind_speed_10m_max: z.array(z.number()).min(1),
  }),
});

type OpenMeteoResponse = z.infer<typeof responseSchema>;

const weatherCondition = (code: number) => {
  if (code === 0) return "Clear skies";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([85, 86].includes(code)) return "Snow showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Changing conditions";
};

const asLocationNumber = (
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max
    ? numeric
    : fallback;
};

export function getWeatherLocation() {
  return {
    latitude: asLocationNumber(
      process.env.AGROGUARD_WEATHER_LATITUDE,
      12.0022,
      -90,
      90
    ),
    longitude: asLocationNumber(
      process.env.AGROGUARD_WEATHER_LONGITUDE,
      8.592,
      -180,
      180
    ),
    label:
      process.env.AGROGUARD_WEATHER_LOCATION?.trim().slice(0, 80) ||
      "Kano, Nigeria",
  };
}

export function normalizeWeatherResponse(
  payload: OpenMeteoResponse,
  location = getWeatherLocation()
): WeatherSnapshot {
  const current = payload.current;
  const rainProbability = Math.round(
    payload.daily.precipitation_probability_max[0]
  );
  const rainTotal = payload.daily.precipitation_sum[0];
  const maxWind = payload.daily.wind_speed_10m_max[0];
  const alerts: string[] = [];

  if (rainProbability >= 60 || rainTotal >= 8) {
    alerts.push(
      "Rain risk is elevated today. Protect drying harvests and avoid spraying before rain."
    );
  }
  if (maxWind >= 25) {
    alerts.push(
      "Wind may affect spraying. Wait for calmer conditions before applying products."
    );
  }
  if (current.temperature_2m >= 35) {
    alerts.push(
      "High heat can stress crops. Check soil moisture and water early if needed."
    );
  }
  if ([95, 96, 99].includes(current.weather_code)) {
    alerts.push(
      "Thunderstorm risk is present. Pause field work during lightning and secure loose materials."
    );
  }

  const fieldNote = alerts[0]
    ? alerts[0]
    : "Good window for scouting and light field work. Check leaf surfaces before spraying.";

  return {
    location: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    condition: weatherCondition(current.weather_code),
    temperatureC: Math.round(current.temperature_2m),
    feelsLikeC: Math.round(current.apparent_temperature),
    rainProbability,
    humidity: Math.round(current.relative_humidity_2m),
    windKmh: Math.round(current.wind_speed_10m),
    fieldNote,
    alerts,
    observedAt: current.time,
    source: "Open-Meteo live forecast",
  };
}

export async function getLiveWeather(
  fetcher: typeof fetch = fetch,
  location = getWeatherLocation()
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "1",
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_FETCH_TIMEOUT_MS);

  try {
    const response = await fetcher(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { headers: { accept: "application/json" }, signal: controller.signal }
    );
    if (!response.ok)
      throw new Error(`Weather provider returned ${response.status}`);
    return normalizeWeatherResponse(
      responseSchema.parse(await response.json()),
      location
    );
  } catch (error) {
    console.warn("[AgroGuard] Live weather request failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error(
      "Live weather data is unavailable right now. Please try again shortly."
    );
  } finally {
    clearTimeout(timer);
  }
}
