export interface CreateRegistrationReq {
  marathonId: number
  courseId: number
}

export interface CreateRegistrationRes {
  registrationId: number
  marathonId: number
  marathonTitle: string
  courseId: number
  courseType: string
  status: string
  appliedAt: string
}

export async function createRegistration(
  body: CreateRegistrationReq
): Promise<CreateRegistrationRes> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || "접수 실패")
  }

  return data.data
}
