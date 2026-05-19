import { API_BASE_URL } from "@/lib/api-base"

export type RecruitmentStatusApi =
  | "OPEN"
  | "TEMP"
  | "FULL"
  | "CLOSED"
  | "CANCELED"

export interface CourseItemRes {
  id: number
  courseType: string
  price: number | null
  capacity: number | null
  currentCount: number | null
  remainingCount: number | null
}

export interface MarathonDetailRes {
  id: number
  title: string
  region: string
  eventDate: string
  posterImageUrl?: string | null
  registrationStartAt: string
  registrationEndAt: string
  status: string
  recruitmentStatus: RecruitmentStatusApi
  courses: CourseItemRes[]
  createdAt: string
}

interface ApiEnvelope<T> {
  code: string
  message?: string
  data?: T
}

function isApiEnvelope(v: unknown): v is ApiEnvelope<unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    "code" in v &&
    typeof (v as ApiEnvelope<unknown>).code === "string"
  )
}

function unwrapMarathonDetail(json: unknown): MarathonDetailRes {
  if (isApiEnvelope(json)) {
    if (json.code !== "SUCCESS") {
      throw new Error(json.message ?? "마라톤 정보를 불러오지 못했습니다.")
    }
    if (!json.data) {
      throw new Error("응답에 마라톤 데이터가 없습니다.")
    }
    const raw = json.data as MarathonDetailRes
    return {
      ...raw,
      courses: (raw.courses ?? []).map((c) => ({
        ...c,
        courseType: c.courseType ?? "",
      })),
    }
  }
  return json as MarathonDetailRes
}

export async function fetchMarathonDetail(
  id: string
): Promise<MarathonDetailRes> {
  const res = await fetch(`${API_BASE_URL}/api/v1/marathons/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })

  const json: unknown = await res.json().catch(() => ({}))

  if (res.status === 404) {
    throw new Error("존재하지 않는 마라톤입니다.")
  }

  if (!res.ok) {
    const msg =
      isApiEnvelope(json) && json.message
        ? json.message
        : "마라톤 정보를 불러오지 못했습니다."
    throw new Error(msg)
  }

  return unwrapMarathonDetail(json)
}