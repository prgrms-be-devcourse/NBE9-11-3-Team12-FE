export type TossPaymentsInstance = {
  requestPayment: (
    method: string,
    options: {
      amount: number
      orderId: string
      orderName: string
      customerName?: string
      successUrl: string
      failUrl: string
    }
  ) => Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance
  }
}

export const TOSS_PAYMENTS_SCRIPT_URL = "https://js.tosspayments.com/v1/payment"

export function getTossClientKey(): string {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() ?? ""
}

export function buildPaymentRedirectUrls(marathonId: number, courseId: number) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const completePath = `/marathons/${marathonId}/courses/${courseId}/register/complete`

  return {
    successUrl: `${origin}${completePath}`,
    failUrl: `${origin}${completePath}`,
  }
}

export async function requestTossCardPayment(params: {
  orderId: string
  amount: number
  orderName: string
  customerName?: string
  marathonId: number
  courseId: number
}) {
  const clientKey = getTossClientKey()

  if (!clientKey) {
    throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되어 있지 않습니다.")
  }

  if (!window.TossPayments) {
    throw new Error("Toss Payments 스크립트가 아직 로드되지 않았습니다.")
  }

  const { successUrl, failUrl } = buildPaymentRedirectUrls(params.marathonId, params.courseId)
  const tossPayments = window.TossPayments(clientKey)

  await tossPayments.requestPayment("카드", {
    amount: params.amount,
    orderId: params.orderId,
    orderName: params.orderName,
    customerName: params.customerName,
    successUrl,
    failUrl,
  })
}
