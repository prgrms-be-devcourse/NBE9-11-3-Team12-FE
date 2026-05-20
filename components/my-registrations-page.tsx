"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleX,
  CreditCard,
  Loader2,
  MapPin,
  Shirt,
  Ticket,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { cancelMyRegistration, fetchMyRegistrations, MyRegistrationItem, PageRes } from "@/lib/registration-query"
import { formatCourseDistance } from "@/lib/marathon-labels"
import { requestTossCardPayment, TOSS_PAYMENTS_SCRIPT_URL } from "@/lib/toss-payments"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 6

type RegistrationFilter = "ACTIVE" | "CANCELED"

function formatDate(value: string | null) {
  if (!value) return "-"

  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

function formatDateTime(value: string | null) {
  if (!value) return "-"

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "-"
  return `${price.toLocaleString("ko-KR")}원`
}

function formatRegistrationStatus(item: MyRegistrationItem, filter: RegistrationFilter) {
  if (filter === "CANCELED") return "취소됨"
  switch (item.status) {
    case "COMPLETED":
      return "접수 완료"
    case "PENDING_PAYMENT":
      return "결제 대기"
    case "CANCELED":
      return "취소됨"
    default:
      return item.status
  }
}

function formatPaymentStatus(status: string | null) {
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
    case "REFUND_REQUESTED":
      return "환불 요청"
    case "REFUND_PROCESSING":
      return "환불 처리 중"
    case "REFUNDED":
      return "환불 완료"
    case "REFUND_FAILED":
      return "환불 실패"
    case null:
      return "결제 없음"
    default:
      return status
  }
}

function getPaymentMetaRows(item: MyRegistrationItem) {
  switch (item.paymentStatus) {
    case "READY":
      return [{ label: "만료 일시", value: formatDateTime(item.paymentDueAt) }]
    case "DONE":
      return [{ label: "결제 일시", value: formatDateTime(item.approvedAt ?? null) }]
    case "REFUND_REQUESTED":
      return [
        { label: "결제 일시", value: formatDateTime(item.approvedAt ?? null) },
        { label: "환불 요청 일시", value: formatDateTime(item.canceledAt) },
        { label: "환불 사유", value: item.refundReason ?? "접수 취소 환불" },
      ]
    case "REFUND_PROCESSING":
      return [
        { label: "결제 일시", value: formatDateTime(item.approvedAt ?? null) },
        { label: "환불 요청 일시", value: formatDateTime(item.canceledAt) },
        { label: "환불 사유", value: item.refundReason ?? "접수 취소 환불" },
      ]
    case "REFUNDED":
      return [
        { label: "결제 일시", value: formatDateTime(item.approvedAt ?? null) },
        { label: "환불 완료 일시", value: formatDateTime(item.refundedAt ?? null) },
        { label: "환불 사유", value: item.refundReason ?? "접수 취소 환불" },
      ]
    case "REFUND_FAILED":
      return [
        { label: "결제 일시", value: formatDateTime(item.approvedAt ?? null) },
        { label: "환불 요청 일시", value: formatDateTime(item.canceledAt) },
        { label: "실패 사유", value: item.failMessage ?? item.failCode ?? "환불 처리에 실패했습니다." },
      ]
    case "EXPIRED":
      return [{ label: "만료 일시", value: formatDateTime(item.paymentDueAt) }]
    case "CANCELED":
      return [{ label: "취소 일시", value: formatDateTime(item.canceledAt) }]
    case "FAILED":
      return [{ label: "실패 사유", value: item.failMessage ?? item.failCode ?? "결제 승인에 실패했습니다." }]
    default:
      if (item.status === "PENDING_PAYMENT") {
        return [{ label: "만료 일시", value: formatDateTime(item.paymentDueAt) }]
      }
      return []
  }
}

function getPaymentGuide(item: MyRegistrationItem) {
  switch (item.paymentStatus) {
    case "REFUND_REQUESTED":
      return "환불 요청이 등록되었습니다. 환불 배치 처리 후 상태가 갱신됩니다."
    case "REFUND_PROCESSING":
      return "환불 처리 중입니다. 외부 결제사 응답에 따라 완료 또는 실패로 변경됩니다."
    case "REFUNDED":
      return "환불이 완료되었습니다."
    case "REFUND_FAILED":
      return "환불 처리에 실패했습니다. 관리자 확인 또는 재처리가 필요합니다."
    case "EXPIRED":
      return "결제 가능 시간이 만료되어 접수가 취소되었습니다."
    case "CANCELED":
      return "결제 전 취소된 접수입니다. 실제 결제 금액은 발생하지 않았습니다."
    default:
      return null
  }
}

function getPaymentTextColor(status: string | null) {
  switch (status) {
    case "READY":
      return "text-amber-700"
    case "DONE":
      return "text-emerald-700"
    case "REFUND_REQUESTED":
    case "REFUND_PROCESSING":
      return "text-sky-700"
    case "REFUNDED":
      return "text-blue-700"
    case "REFUND_FAILED":
    case "FAILED":
      return "text-red-700"
    case "EXPIRED":
    case "CANCELED":
      return "text-slate-600"
    default:
      return "text-foreground"
  }
}

function RegistrationCard({
  item,
  filter,
  onCancel,
  onPay,
  isCancelling,
  isPaying,
}: {
  item: MyRegistrationItem
  filter: RegistrationFilter
  onCancel: (registrationId: number) => void
  onPay: (item: MyRegistrationItem) => void
  isCancelling: boolean
  isPaying: boolean
}) {
  const isActive = filter === "ACTIVE"
  const canPay =
    isActive &&
    item.registrationId !== null &&
    item.courseId !== null &&
    item.canPay &&
    item.orderId &&
    item.amount &&
    item.amount > 0
  const isPendingPayment = item.status === "PENDING_PAYMENT"
  const paymentMetaRows = getPaymentMetaRows(item)
  const paymentGuide = getPaymentGuide(item)

  return (
    <Card
      className={cn(
        "h-full rounded-2xl border bg-card shadow-sm",
        isActive ? (isPendingPayment ? "border-amber-200 bg-amber-50/20" : "border-slate-200") : "border-rose-200 bg-rose-50/30"
      )}
    >
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-3xl font-bold", isActive ? "text-primary" : "text-rose-500")}>
              {formatCourseDistance(item.courseType)}
            </p>
            <h3 className="mt-4 text-2xl font-bold text-foreground">{item.marathonTitle ?? "대회 정보 없음"}</h3>
          </div>
          <span
            className={cn(
              "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
              !isActive
                ? "bg-rose-500 text-white"
                : isPendingPayment
                  ? "bg-amber-500 text-white"
                  : "bg-primary text-primary-foreground"
            )}
          >
            {formatRegistrationStatus(item, filter)}
          </span>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium text-foreground/80">대회일</span>
            <span>{formatDate(item.eventDate)}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4" />
            <span className="font-medium text-foreground/80">배송지</span>
            <span className="line-clamp-2">{[item.snapAddress, item.snapDetail].filter(Boolean).join(" ") || "주소 정보 없음"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shirt className="h-4 w-4" />
            <span className="font-medium text-foreground/80">티셔츠</span>
            <span>{item.tSize ?? "사이즈 정보 없음"}</span>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-4 w-4" />
            <span className="font-medium text-foreground/80">결제</span>
            <span className="flex flex-col gap-1">
              <span className={cn("font-medium", getPaymentTextColor(item.paymentStatus))}>{formatPaymentStatus(item.paymentStatus)}</span>
              {paymentMetaRows.map((row) => (
                <span key={row.label} className="text-xs text-muted-foreground">
                  {row.label}: {row.value}
                </span>
              ))}
              {paymentGuide && <span className="text-xs text-muted-foreground">{paymentGuide}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Ticket className="h-4 w-4" />
            <span className="font-medium text-foreground/80">신청일</span>
            <span>{formatDateTime(item.appliedAt)}</span>
          </div>
          {!isActive && (
            <div className="flex items-center gap-3 text-rose-500">
              <CircleX className="h-4 w-4" />
              <span className="font-medium">취소일</span>
              <span>{formatDateTime(item.canceledAt)}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">가격</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatPrice(item.price)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canPay && (
              <Button className="rounded-lg px-6" onClick={() => onPay(item)} disabled={isPaying || isCancelling}>
                {isPaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    결제창 여는 중
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    결제하기
                  </>
                )}
              </Button>
            )}

            {isActive ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("rounded-lg px-6 transition-all duration-200", "hover:border-red-300 hover:bg-red-100 hover:text-red-700")}
                    disabled={isCancelling || isPaying || item.registrationId === null}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        취소 중
                      </>
                    ) : (
                      "취소하기"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>접수 취소</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4 text-sm text-muted-foreground">
                        <p>
                          정말 <span className="font-medium text-foreground">&quot;{item.marathonTitle ?? "선택한 대회"}&quot;</span> 접수를 취소하시겠습니까?
                        </p>
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                          <p className="font-semibold">취소 전 필독 사항</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                            <li>취소가 완료되면 복구가 불가능합니다.</li>
                            <li>취소 후 대회 참가를 원할 경우 재접수가 필요합니다.</li>
                            <li>취소된 접수 내역은 취소 목록에서 확인할 수 있습니다.</li>
                          </ul>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>닫기</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (item.registrationId === null) return
                        onCancel(item.registrationId)
                      }}
                      className="border border-red-600 bg-red-600 text-white transition-colors duration-200 hover:border-red-700 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      접수 취소
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="secondary" disabled className="rounded-lg px-6">
                취소됨
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PaginationBar({ pageRes, onChange }: { pageRes: PageRes; onChange: (page: number) => void }) {
  const current = pageRes.page + 1
  const total = Math.max(pageRes.totalPages, 1)

  const pages = useMemo(() => {
    const result: number[] = []
    const start = Math.max(1, current - 1)
    const end = Math.min(total, current + 1)

    for (let page = start; page <= end; page += 1) result.push(page)
    if (!result.includes(1)) result.unshift(1)
    if (!result.includes(total)) result.push(total)

    return [...new Set(result)]
  }, [current, total])

  if (total <= 1) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, index) => {
        const previous = pages[index - 1]
        const showEllipsis = previous && page - previous > 1

        return (
          <div key={page} className="flex items-center gap-2">
            {showEllipsis && <span className="px-2 text-muted-foreground">…</span>}
            <Button variant={page === current ? "default" : "outline"} className="min-w-10" onClick={() => onChange(page)}>
              {page}
            </Button>
          </div>
        )
      })}

      <Button variant="outline" size="icon" disabled={current === total} onClick={() => onChange(current + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function MyRegistrationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<RegistrationFilter>("ACTIVE")
  const [page, setPage] = useState(0)
  const [items, setItems] = useState<MyRegistrationItem[]>([])
  const [pageRes, setPageRes] = useState<PageRes>({ page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [isTossReady, setIsTossReady] = useState(false)

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchMyRegistrations({ status: filter, page, size: PAGE_SIZE })
      setItems(result.content)
      setPageRes(result.pageRes)
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0

      if (status === 401) {
        router.replace("/login?redirect=/mypage/registrations")
        return
      }

      setError(error instanceof Error ? error.message : "내 접수 내역을 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [filter, page, router])

  const handleCancel = useCallback(
    async (registrationId: number) => {
      setCancellingId(registrationId)
      setError(null)

      try {
        await cancelMyRegistration(registrationId)
        await loadRegistrations()
      } catch (error) {
        const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0

        if (status === 401) {
          router.replace("/login?redirect=/mypage/registrations")
          return
        }

        if (status === 403) {
          setError("본인의 접수 건만 취소할 수 있습니다.")
          return
        }

        setError(error instanceof Error ? error.message : "접수 취소에 실패했습니다.")
      } finally {
        setCancellingId(null)
      }
    },
    [loadRegistrations, router]
  )

  const handlePay = useCallback(async (item: MyRegistrationItem) => {
    if (item.registrationId === null || item.courseId === null || !item.orderId || !item.amount || item.amount <= 0) {
      setError("결제 가능한 주문 정보가 없습니다.")
      return
    }

    setPayingId(item.registrationId)
    setError(null)

    try {
      localStorage.setItem(
        "lastRegistration",
        JSON.stringify({
          registrationId: item.registrationId ?? 0,
          marathonId: item.marathonId,
          marathonTitle: item.marathonTitle ?? "",
          courseId: item.courseId ?? 0,
          courseType: item.courseType ?? "",
          status: item.status,
          paymentStatus: item.paymentStatus,
          orderId: item.orderId,
          amount: item.amount,
          paymentDueAt: item.paymentDueAt,
          approvedAt: item.approvedAt,
          refundedAt: item.refundedAt,
          refundReason: item.refundReason,
          failCode: item.failCode,
          failMessage: item.failMessage,
          appliedAt: item.appliedAt ?? "",
        })
      )

      if (!isTossReady || !window.TossPayments) {
        throw new Error("결제 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.")
      }

      await requestTossCardPayment({
        orderId: item.orderId,
        amount: item.amount,
        orderName: `${item.marathonTitle ?? "마라톤"} ${formatCourseDistance(item.courseType)}`,
        marathonId: item.marathonId,
        courseId: item.courseId,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "결제창을 열지 못했습니다.")
      setPayingId(null)
    }
  }, [isTossReady])

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  useEffect(() => {
    setPage(0)
  }, [filter])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Script
        src={TOSS_PAYMENTS_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => setIsTossReady(true)}
        onReady={() => setIsTossReady(true)}
      />
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <Link href="/mypage" className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
                <ChevronLeft className="mr-1 h-4 w-4" />
                마이페이지로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">내 접수 내역</h1>
              <p className="mt-3 text-base text-muted-foreground">신청한 대회의 접수, 결제, 취소 상태를 확인하세요.</p>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <Button variant={filter === "ACTIVE" ? "default" : "outline"} onClick={() => setFilter("ACTIVE")}>
                접수됨
              </Button>
              <Button variant={filter === "CANCELED" ? "default" : "outline"} onClick={() => setFilter("CANCELED")}>
                취소됨
              </Button>
            </div>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>내 접수 내역을 불러오는 중입니다.</span>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
            ) : (
              <>
                <p className="mb-5 text-sm font-semibold text-muted-foreground">총 {pageRes.totalElements.toLocaleString("ko-KR")}건</p>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-muted-foreground">
                    표시할 접수 내역이 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <RegistrationCard
                        key={item.registrationId ?? item.historyId ?? `${item.marathonId}-${item.appliedAt}`}
                        item={item}
                        filter={filter}
                        onCancel={handleCancel}
                        onPay={handlePay}
                        isCancelling={cancellingId === item.registrationId}
                        isPaying={payingId === item.registrationId}
                      />
                    ))}
                  </div>
                )}

                <PaginationBar pageRes={pageRes} onChange={(nextPage) => setPage(nextPage - 1)} />
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
