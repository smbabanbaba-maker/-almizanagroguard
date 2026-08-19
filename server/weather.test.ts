import { describe, expect, it, vi } from "vitest";
import { getLiveWeather, normalizeWeatherResponse } from "./weather";

const location = {
  latitude: 12.0022,
  longitude: 8.592,
  label: "Kano, Nigeria",
};
const clearPayload = {
  current: {
    time: "2026-08-19T12:00",
    temperature_2m: 29.4,
    relative_humidity_2m: 68,
    apparent_temperature: 31.2,
    weather_code: 1,
    wind_speed_10m: 10.6,
  },
  daily: {
    precipitation_probability_max: [24],
    precipitation_sum: [0],
    wind_speed_10m_max: [16],
  },
};

describe("AgroGuard live weather provider", () => {
  it("normalizes a current forecast into farmer-ready field guidance", () => {
    expect(normalizeWeatherResponse(clearPayload, location)).toMatchObject({
      location: "Kano, Nigeria",
      condition: "Mainly clear",
      temperatureC: 29,
      feelsLikeC: 31,
      rainProbability: 24,
      humidity: 68,
      windKmh: 11,
      alerts: [],
      source: "Open-Meteo live forecast",
    });
  });

  it("flags rain, wind, and heat risks in the field guidance", () => {
    const risky = normalizeWeatherResponse(
      {
        current: {
          ...clearPayload.current,
          temperature_2m: 36,
          weather_code: 63,
        },
        daily: {
          precipitation_probability_max: [70],
          precipitation_sum: [12],
          wind_speed_10m_max: [28],
        },
      },
      location
    );
    expect(risky.alerts).toHaveLength(3);
    expect(risky.fieldNote).toContain("Rain risk is elevated");
  });

  it("requests the documented current and daily variables from Open-Meteo", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(clearPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    await getLiveWeather(fetcher, location);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("api.open-meteo.com/v1/forecast?"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    const requestUrl = String(fetcher.mock.calls[0]?.[0]);
    expect(requestUrl).toContain(
      "current=temperature_2m%2Crelative_humidity_2m"
    );
    expect(requestUrl).toContain(
      "daily=precipitation_probability_max%2Cprecipitation_sum"
    );
  });
});
