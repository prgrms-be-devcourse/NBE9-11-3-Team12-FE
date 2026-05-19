import { fetchWithAuth } from "@/lib/api-base"

export interface ApiEnvelope<T> {
  code: string
  message?: string
  data?: T
}

export interface PageRes {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface MyRegistrationItem {
  registrationId: number | null
  historyId: number | null
  marathonId: number
  marathonTitle: string | null
  courseId: number | null
  courseType: string | null
  status: string
  price: number | null
  eventDate: string | null
  snapName: string | null
  snapPhoneNumber: string | null
  snapZipCode: string | null
  snapAddress: string | null
  snapDetail: string | null
  tSize: string | null
  agreedTerms: boolean | null
  appliedAt: string | null
  canceledAt: string | null
}

export interface MyRegistrationListRes {
  content: MyRegistrationItem[]
  pageRes: PageRes
}

export interface RegistrationOverviewRes {
  marathon: {
    marathonId: number
    marathonTitle: string
    eventDate: string
    region: string
    totalCurrentCount: number
    totalCapacity: number
    totalRemainingCount: number
    totalRecruitmentRate: number
  }
  courseStatuses: Array<{
    courseId: number
    courseType: string
    price: number
    currentCount: number
    capacity: number
    remainingCount: number
    recruitmentRate: number
  }>
}

export interface RegistrationParticipantItem {
  registrationId: number
  name: string
  phoneNumber: string
  tSize: string
  courseId: number
  courseType: string
  status: string
  appliedAt: string
}

export interface RegistrationParticipantListRes {
  content: RegistrationParticipantItem[]
  pageRes: PageRes
}

export interface RegistrationParticipantDetailRes {
  registrationId: number
  marathonId: number
  marathonTitle: string
  courseId: number
  courseType: string
  status: string
  snapName: string
  snapPhoneNumber: string
  snapZipCode: string
  snapAddress: string
  snapDetail: string
  tSize: string
  agreedTerms: boolean
  appliedAt: string
}

export function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "code" in value
}

async function unwrapResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (isApiEnvelope<T>(json) && json.message) {
      throw Object.assign(new Error(json.message), { status: response.status })
    }

    throw Object.assign(new Error(fallbackMessage), { status: response.status })
  }

  if (isApiEnvelope<T>(json)) {
    if (json.code !== "SUCCESS") {
      throw new Error(json.message ?? fallbackMessage)
    }

    if (json.data === undefined || json.data === null) {
      throw new Error("응답 데이터가 없습니다.")
    }

    return json.data
  }

  return json as T
}

export async function fetchMyRegistrations(params: {
  status: "ACTIVE" | "CANCELED"
  page: number
  size: number
}) {
  const query = new URLSearchParams({
    status: params.status,
    page: String(params.page),
    size: String(params.size),
  })

  const response = await fetchWithAuth(`/api/v1/registrations/me?${query.toString()}`, {
    method: "GET",
  })

  return unwrapResponse<MyRegistrationListRes>(response, "내 접수 내역을 불러오지 못했습니다.")
}

export async function fetchRegistrationOverview(marathonId: string) {
  const response = await fetchWithAuth(`/api/v1/organizer/marathons/${marathonId}/registrations/summary`, {
    method: "GET",
  })

  return unwrapResponse<RegistrationOverviewRes>(response, "접수 요약 정보를 불러오지 못했습니다.")
}

export async function fetchRegistrationParticipants(params: {
  marathonId: string
  page: number
  size: number
  courseId?: string
  name?: string
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  })

  if (params.courseId && params.courseId !== "ALL") {
    query.set("courseId", params.courseId)
  }

  if (params.name?.trim()) {
    query.set("name", params.name.trim())
  }

  const response = await fetchWithAuth(
    `/api/v1/organizer/marathons/${params.marathonId}/registrations?${query.toString()}`,
    { method: "GET" }
  )

  return unwrapResponse<RegistrationParticipantListRes>(response, "참가자 목록을 불러오지 못했습니다.")
}

export async function fetchRegistrationParticipantDetail(marathonId: string, registrationId: number) {
  const response = await fetchWithAuth(
    `/api/v1/organizer/marathons/${marathonId}/registrations/${registrationId}`,
    { method: "GET" }
  )

  return unwrapResponse<RegistrationParticipantDetailRes>(response, "참가자 상세 정보를 불러오지 못했습니다.")
}

// export async function cancelMyRegistration(registrationId: number) {
//   const response = await fetchWithAuth(`/api/v1/registrations/${registrationId}`, {
//     method: "DELETE",
//   })

//   return unwrapResponse<void>(response, "접수 취소에 실패했습니다.")
// }

export async function cancelMyRegistration(registrationId: number) {
  const response = await fetchWithAuth(`/api/v1/registrations/${registrationId}`, {
    method: "DELETE",
  })

  const json: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (isApiEnvelope<void>(json) && json.message) {
      throw Object.assign(new Error(json.message), { status: response.status })
    }

    throw Object.assign(new Error("접수 취소에 실패했습니다."), { status: response.status })
  }

  if (isApiEnvelope<void>(json) && json.code !== "SUCCESS") {
    throw new Error(json.message ?? "접수 취소에 실패했습니다.")
  }

  return
}