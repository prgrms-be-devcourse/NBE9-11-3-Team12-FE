import { fetchWithAuth, unwrapApiResponse } from "@/lib/api-base"

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
  status: "PENDING_PAYMENT" | "COMPLETED" | "CANCELED" | string
  paymentStatus: string | null
  orderId: string | null
  amount: number | null
  paymentDueAt: string | null
  approvedAt?: string | null
  refundedAt?: string | null
  refundReason?: string | null
  failCode?: string | null
  failMessage?: string | null
  canPay: boolean
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
  snapDetail: string | null
  tSize: string
  agreedTerms: boolean
  appliedAt: string
}

export interface ConfirmPaymentReq {
  paymentKey: string
  orderId: string
  amount: number
}

export interface ConfirmPaymentRes {
  registrationId: number
  registrationStatus: "PENDING_PAYMENT" | "COMPLETED" | "CANCELED" | string
  orderId: string
  amount: number
  paymentStatus: string
  approvedAt: string | null
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

  return unwrapApiResponse<MyRegistrationListRes>(response, "내 접수 내역을 불러오지 못했습니다.")
}

export async function cancelMyRegistration(registrationId: number) {
  const response = await fetchWithAuth(`/api/v1/registrations/${registrationId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    await unwrapApiResponse<void>(response, "접수 취소에 실패했습니다.")
  }
}

export async function confirmPayment(body: ConfirmPaymentReq) {
  const response = await fetchWithAuth("/api/v1/payments/confirm", {
    method: "POST",
    body: JSON.stringify(body),
  })

  return unwrapApiResponse<ConfirmPaymentRes>(response, "결제 승인에 실패했습니다.")
}

export async function fetchRegistrationOverview(marathonId: string) {
  const response = await fetchWithAuth(`/api/v1/organizer/marathons/${marathonId}/registrations/summary`, {
    method: "GET",
  })

  return unwrapApiResponse<RegistrationOverviewRes>(response, "접수 요약 정보를 불러오지 못했습니다.")
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

  return unwrapApiResponse<RegistrationParticipantListRes>(response, "참가자 목록을 불러오지 못했습니다.")
}

export async function fetchRegistrationParticipantDetail(marathonId: string, registrationId: number) {
  const response = await fetchWithAuth(
    `/api/v1/organizer/marathons/${marathonId}/registrations/${registrationId}`,
    { method: "GET" }
  )

  return unwrapApiResponse<RegistrationParticipantDetailRes>(response, "참가자 상세 정보를 불러오지 못했습니다.")
}
