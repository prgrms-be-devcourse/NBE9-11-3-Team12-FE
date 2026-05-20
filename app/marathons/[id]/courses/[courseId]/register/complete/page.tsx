"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, Copy, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { confirmPayment } from "@/lib/registration-query"
import { formatCourseDistance } from "@/lib/marathon-labels"

interface RegistrationData {
  registrationId: number
  marathonId: number
  marathonTitle: string
  courseId: number
  courseType: string
  status: string
  paymentStatus?: string | null
  orderId?: string | null
  amount?: number | null
  paymentDueAt?: string | null
  appliedAt: string
  approvedAt?: string | null
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined) return "-"
  return `${value.toLocaleString("ko-KR")}원`
}

function getRegistrationStatus(status: string) {
  switch (status) {
    case "COMPLETED":
      return { label: "접수 완료", className: "bg-green-100 text-green-800" }
    case "PENDING_PAYMENT":
      return { label: "결제 대기", className: "bg-yellow-100 text-yellow-800" }
    case "CANCELED":
      return { label: "접수 취소", className: "bg-red-100 text-red-800" }
    default:
      return { label: status, className: "bg-gray-100 text-gray-800" }
  }
}

function getPaymentStatus(status?: string | null) {
  switch (status) {
    case "READY":
      return "결제 대기"
    case "DONE":
      return "결제 완료"
    case "FAILED":
      return "결제 실패"
    case "EXPIRED":
      return "결제 만료"
    case "CANCELED":
      return "결제 취소"
    case "REFUNDED":
      return "환불 완료"
    case null:
    case undefined:
      return "결제 없음"
    default:
      return status
  }
}

function CompletePageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmStarted = useRef(false)

  const marathonId = Number(params.id)
  const courseId = Number(params.courseId)
  const paymentKey = searchParams.get("paymentKey")
  const orderId = searchParams.get("orderId")
  const amountParam = searchParams.get("amount")
  const failCode = searchParams.get("code")
  const failMessage = searchParams.get("message")

  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const statusBadge = useMemo(() => getRegistrationStatus(registration?.status ?? ""), [registration?.status])
  const isSuccess = !paymentError && registration?.status === "COMPLETED"
  const isPendingPayment = registration?.status === "PENDING_PAYMENT"

  useEffect(() => {
    const stored = localStorage.getItem("lastRegistration")

    if (!stored) {
      router.replace(`/marathons/${marathonId}`)
      return
    }

    try {
      setRegistration(JSON.parse(stored) as RegistrationData)
    } catch {
      router.replace(`/marathons/${marathonId}`)
      return
    }

    if (failCode || failMessage) {
      setPaymentError(failMessage || "결제가 실패했거나 취소되었습니다.")
      setIsLoading(false)
      return
    }

    if (paymentKey && orderId && amountParam) {
      if (confirmStarted.current) return
      confirmStarted.current = true

      const amount = Number(amountParam)
      if (!Number.isFinite(amount) || amount <= 0) {
        setPaymentError("결제 금액 정보가 올바르지 않습니다.")
        setIsLoading(false)
        return
      }

      confirmPayment({ paymentKey, orderId, amount })
        .then((result) => {
          setRegistration((prev) => {
            const next: RegistrationData = {
              ...(prev ?? {
                registrationId: result.registrationId,
                marathonId,
                marathonTitle: "",
                courseId,
                courseType: "",
                status: result.registrationStatus,
                appliedAt: "",
              }),
              registrationId: result.registrationId,
              status: result.registrationStatus,
              paymentStatus: result.paymentStatus,
              orderId: result.orderId,
              amount: result.amount,
              approvedAt: result.approvedAt,
            }
            localStorage.setItem("lastRegistration", JSON.stringify(next))
            return next
          })
          setPaymentConfirmed(true)
        })
        .catch((error) => {
          setPaymentError(error instanceof Error ? error.message : "결제 승인에 실패했습니다.")
        })
        .finally(() => setIsLoading(false))
      return
    }

    setIsLoading(false)
  }, [amountParam, courseId, failCode, failMessage, marathonId, orderId, paymentKey, router])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">접수와 결제 상태를 확인하는 중입니다.</p>
        </div>
      </main>
    )
  }

  if (!registration) return null

  const copyContent = `접수 번호: #${registration.registrationId}\n마라톤명: ${registration.marathonTitle}\n코스: ${formatCourseDistance(registration.courseType)}\n상태: ${statusBadge.label}\n결제 상태: ${getPaymentStatus(registration.paymentStatus)}\n접수 일시: ${formatDateTime(registration.appliedAt)}`

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${paymentError ? "bg-red-100" : "bg-green-100"
              }`}
          >
            {paymentError ? <XCircle className="h-8 w-8 text-red-600" /> : <Check className="h-8 w-8 text-green-600" />}
          </div>
          <h1 className="mb-2 text-center text-2xl font-bold">
            {paymentError ? "결제가 완료되지 않았습니다" : paymentConfirmed ? "결제 및 접수가 완료되었습니다" : isPendingPayment ? "접수 신청이 완료되었습니다" : "접수가 완료되었습니다"}
          </h1>
          <p className="text-center text-muted-foreground">
            {paymentError
              ? "아래 접수 정보를 확인한 뒤 내 접수 조회에서 결제를 다시 진행할 수 있습니다."
              : isPendingPayment
                ? "30분 이내에 결제가 완료되어야 최종 접수 완료 상태가 됩니다."
                : "아래 접수 정보를 확인해주세요."}
          </p>
        </div>

        {paymentError && (
          <Card className="mb-6 border-red-200 bg-red-50/60">
            <CardContent className="p-4 text-sm text-red-800">
              <p className="font-semibold">결제 오류</p>
              <p className="mt-1">{paymentError}</p>
              {failCode && <p className="mt-1 text-xs text-red-700">오류 코드: {failCode}</p>}
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg">접수 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">접수 번호</p>
                <p className="text-lg font-bold text-foreground">#{registration.registrationId}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">접수 상태</p>
                <div className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${statusBadge.className}`}>
                  {statusBadge.label}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">마라톤명</p>
                <p className="font-medium text-foreground">{registration.marathonTitle}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">코스</p>
                <p className="font-medium text-foreground">{formatCourseDistance(registration.courseType)}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">결제 상태</p>
                <p className="font-medium text-foreground">{getPaymentStatus(registration.paymentStatus)}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-muted-foreground">결제 금액</p>
                <p className="font-medium text-foreground">{formatPrice(registration.amount)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-1 text-sm text-muted-foreground">접수 일시</p>
              <p className="font-medium text-foreground">{formatDateTime(registration.appliedAt)}</p>
            </div>

            <Separator />

            {registration.status === "COMPLETED" ? (
              registration.approvedAt && (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">결제 승인 일시</p>
                  <p className="font-medium text-foreground">{formatDateTime(registration.approvedAt)}</p>
                </div>
              )
            ) : (
              registration.paymentDueAt && (
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">결제 만료 시각</p>
                  <p className="font-medium text-foreground">{formatDateTime(registration.paymentDueAt)}</p>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">다음 단계</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="shrink-0 text-xl font-bold text-primary">1</div>
              <div>
                <p className="text-sm font-medium">내 접수 조회에서 상태 확인</p>
                <p className="mt-1 text-xs text-muted-foreground">접수, 결제, 취소 상태는 마이페이지에서 다시 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 text-xl font-bold text-primary">2</div>
              <div>
                <p className="text-sm font-medium">참가 물품 배송</p>
                <p className="mt-1 text-xs text-muted-foreground">입력하신 배송지로 티셔츠 및 참가 물품이 배송됩니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 text-xl font-bold text-primary">3</div>
              <div>
                <p className="text-sm font-medium">대회 당일 현장 등록</p>
                <p className="mt-1 text-xs text-muted-foreground">현장에서 접수 번호를 제시하고 최종 등록을 완료해주세요.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => void navigator.clipboard.writeText(copyContent)}
          >
            <Copy className="mr-2 h-4 w-4" />
            접수 정보 복사
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/marathons/${marathonId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              대회 상세 보기
            </Link>
          </Button>
          <Button className="flex-1" asChild>
            <Link href="/mypage/registrations">내 접수 조회</Link>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
function CompletePageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">접수 결과 페이지를 불러오는 중입니다.</p>
      </div>
    </main>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={<CompletePageFallback />}>
      <CompletePageContent />
    </Suspense>
  )
}
