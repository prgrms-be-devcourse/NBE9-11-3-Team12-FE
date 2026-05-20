"use client"

import { useEffect, useState } from "react"
import { Wind, Droplets, MapPin, Loader2 } from "lucide-react"

interface WeatherData {
  temperature: number
  apparentTemperature: number
  weatherCode: number
  windSpeed: number
  humidity: number
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️"
  if (code <= 2) return "🌤️"
  if (code === 3) return "☁️"
  if (code <= 48) return "🌫️"
  if (code <= 55) return "🌦️"
  if (code <= 65) return "🌧️"
  if (code <= 77) return "❄️"
  if (code <= 82) return "🌧️"
  if (code <= 86) return "🌨️"
  return "⛈️"
}

function getWeatherLabel(code: number): string {
  if (code === 0) return "맑음"
  if (code <= 2) return "구름 조금"
  if (code === 3) return "흐림"
  if (code <= 48) return "안개"
  if (code <= 55) return "이슬비"
  if (code <= 65) return "비"
  if (code <= 77) return "눈"
  if (code <= 82) return "소나기"
  if (code <= 86) return "눈소나기"
  return "천둥번개"
}

interface RunningCondition {
  message: string
  colorClass: string
}

function getRunningCondition(weather: WeatherData): RunningCondition {
  const { temperature, weatherCode, windSpeed } = weather

  if (weatherCode >= 95) {
    return { message: "천둥번개가 쳐요! 오늘은 실내 훈련을 추천해요", colorClass: "text-red-500" }
  }
  if (weatherCode >= 51) {
    return { message: "오늘은 실내 훈련을 추천해요", colorClass: "text-blue-500" }
  }
  if (windSpeed >= 30) {
    return { message: "바람이 강해요! 페이스 조절에 주의하세요", colorClass: "text-yellow-500" }
  }
  if (temperature > 30) {
    return { message: "너무 더워요! 이른 아침 러닝을 노려보세요!", colorClass: "text-orange-500" }
  }
  if (temperature > 25) {
    return { message: "조금 덥지만 달릴 만해요! 수분 보충 잊지 마세요", colorClass: "text-amber-500" }
  }
  if (temperature >= 10 && temperature <= 22 && weatherCode <= 3) {
    return { message: "러닝하기 완벽한 날씨입니다!", colorClass: "text-green-500" }
  }
  if (temperature >= 5 && temperature < 15) {
    return { message: "시원해서 러닝하기 괜찮은 날이에요", colorClass: "text-cyan-500" }
  }
  if (temperature < 0) {
    return { message: "많이 추워요! 방한 장갑과 두꺼운 옷을 챙기세요", colorClass: "text-slate-500" }
  }
  if (temperature < 5) {
    return { message: "쌀쌀해요! 충분히 워밍업하고 달리세요", colorClass: "text-blue-400" }
  }
  return { message: "오늘도 힘차게 달려보세요!", colorClass: "text-primary" }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m"
  )
  url.searchParams.set("timezone", "auto")
  url.searchParams.set("wind_speed_unit", "kmh")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error("날씨 정보를 불러오지 못했습니다")

  const data = await res.json()
  const c = data.current
  return {
    temperature: Math.round(c.temperature_2m),
    apparentTemperature: Math.round(c.apparent_temperature),
    weatherCode: c.weather_code,
    windSpeed: Math.round(c.wind_speed_10m),
    humidity: c.relative_humidity_2m,
  }
}

function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("위치 정보를 지원하지 않는 브라우저입니다"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => reject(new Error("위치 정보 접근이 거부되었습니다")),
      { timeout: 8000 }
    )
  })
}

async function fetchLocationName(lat: number, lon: number): Promise<string> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
  const res = await fetch(url)
  if (!res.ok) return "현재 위치"
  const data = await res.json()
  const locality: string = data.locality || data.city || ""
  const subdivision: string = data.principalSubdivision || ""
  if (locality && subdivision) return `${locality}, ${subdivision}`
  return subdivision || locality || "현재 위치"
}

// Seoul fallback
const SEOUL = { lat: 37.5665, lon: 126.978 }

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [locationLabel, setLocationLabel] = useState("현재 위치")
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      let usedFallback = false

      const { lat, lon } = await getUserLocation().catch(() => {
        usedFallback = true
        return SEOUL
      })

      try {
        const [data, locationName] = await Promise.all([
          fetchWeather(lat, lon),
          usedFallback ? Promise.resolve("서울 기준") : fetchLocationName(lat, lon),
        ])
        if (!cancelled) {
          setWeather(data)
          setLocationLabel(locationName)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          날씨 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  if (error || !weather) return null

  const condition = getRunningCondition(weather)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        {/* 날씨 정보 */}
        <div className="flex items-center gap-5">
          <span className="text-6xl leading-none" role="img" aria-label={getWeatherLabel(weather.weatherCode)}>
            {getWeatherEmoji(weather.weatherCode)}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-foreground">
                {weather.temperature}°
              </span>
              <span className="text-lg text-muted-foreground">
                체감 {weather.apparentTemperature}°
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-base text-muted-foreground">
              <span>{getWeatherLabel(weather.weatherCode)}</span>
              <span className="text-muted-foreground/40">·</span>
              <Wind className="h-4 w-4" />
              <span>{weather.windSpeed} km/h</span>
              <span className="text-muted-foreground/40">·</span>
              <Droplets className="h-4 w-4" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground/60">
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationLabel}</span>
            </div>
          </div>
        </div>

        {/* 러닝 컨디션 메시지 */}
        <div className={`text-xl font-semibold sm:text-2xl ${condition.colorClass}`}>
          🏃 {condition.message}
        </div>
      </div>
    </div>
  )
}
