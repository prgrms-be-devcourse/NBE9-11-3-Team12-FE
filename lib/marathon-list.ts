import { API_BASE_URL } from "@/lib/api-base"

export type RecruitmentStatusApi =

  | "OPEN"
  | "TEMP"
  | "FULL"
  | "CLOSED"
  | "CANCELED"
export interface MarathonListItem {
  id: number
  title: string
  region: string
  eventDate: string
  status: string
  posterImageUrl?: string | null
  totalCapacity: number
  totalCurrentCount: number
  recruitmentStatus: RecruitmentStatusApi
  registrationStartAt: string
  registrationEndAt: string
  courses: {
    courseType: string
    capacity: number
    currentCount: number
  }[]
}

export interface PageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface MarathonListResponse {
  content: MarathonListItem[]
  pageInfo: PageInfo
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
    "code" in v
  )
}

export async function fetchMarathonList(
  page: number = 0,
  size: number = 12
): Promise<MarathonListResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/marathons?page=${page}&size=${size}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  )

  const json: any = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error("마라톤 목록 조회 실패")
  }

  if (json.code === "SUCCESS") {
    const content = (json.data?.content ?? []).map((m: any) => ({
      ...m,
      courses: m.courses ?? [],
    }))

    const pageInfo: PageInfo = json.data?.pageRes ?? {
      page: 0,
      size,
      totalElements: content.length,
      totalPages: 1,
    }

    return { content, pageInfo }
  }

  return {
    content: [],
    pageInfo: { page: 0, size, totalElements: 0, totalPages: 0 },
  }
}