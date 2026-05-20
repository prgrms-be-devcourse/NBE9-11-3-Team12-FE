import { fetchWithAuth, unwrapApiResponse } from "@/lib/api-base"

export interface CreateRegistrationReq {
  courseId: number
  snapZipCode: string
  snapAddress: string
  snapDetail?: string
  tSize: string
  agreedTerms: boolean
}

export interface CreateRegistrationRes {
  registrationId: number
  marathonId: number
  marathonTitle: string
  courseId: number
  courseType: string
  status: "PENDING_PAYMENT" | "COMPLETED" | "CANCELED" | string
  paymentStatus?: string | null
  orderId?: string | null
  amount?: number | null
  paymentDueAt?: string | null
  appliedAt: string
}

export async function createRegistration(body: CreateRegistrationReq): Promise<CreateRegistrationRes> {
  const response = await fetchWithAuth("/api/v1/registrations", {
    method: "POST",
    body: JSON.stringify(body),
  })

  return unwrapApiResponse<CreateRegistrationRes>(response, "접수에 실패했습니다.")
}
