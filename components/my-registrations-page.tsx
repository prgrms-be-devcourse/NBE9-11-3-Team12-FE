"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleX,
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
import { fetchMyRegistrations, MyRegistrationItem, PageRes, cancelMyRegistration } from "@/lib/registration-query"
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

function formatCourseType(courseType: string | null) {
  if (!courseType) return "코스 미정"

  switch (courseType) {
    case "FULL":
      return "풀코스"
    case "HALF":
      return "하프"
    case "10K":
    case "10KM":
      return "10km"
    case "5K":
    case "5KM":
      return "5km"
    default:
      return courseType
  }
}

// function RegistrationCard({ item, filter }: { item: MyRegistrationItem; filter: RegistrationFilter }) {
//   const isActive = filter === "ACTIVE"

//   return (
//     <Card
//       className={cn(
//         "h-full rounded-2xl border bg-card shadow-sm",
//         isActive ? "border-slate-200" : "border-rose-200 bg-rose-50/30"
//       )}
//     >
//       <CardContent className="flex h-full flex-col gap-5 p-6">
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             <p className={cn("text-3xl font-bold", isActive ? "text-primary" : "text-rose-500")}>
//               {formatCourseType(item.courseType)}
//             </p>
//             <h3 className="mt-4 text-2xl font-bold text-foreground">{item.marathonTitle ?? "대회 정보 없음"}</h3>
//           </div>
//           <span
//             className={cn(
//               "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
//               isActive ? "bg-primary text-primary-foreground" : "bg-rose-500 text-white"
//             )}
//           >
//             {isActive ? "접수 완료" : "취소됨"}
//           </span>
//         </div>

//         <div className="space-y-3 text-sm text-muted-foreground">
//           <div className="flex items-center gap-3">
//             <CalendarDays className="h-4 w-4" />
//             <span className="font-medium text-foreground/80">대회일</span>
//             <span>{formatDate(item.eventDate)}</span>
//           </div>
//           <div className="flex items-start gap-3">
//             <MapPin className="mt-0.5 h-4 w-4" />
//             <span className="font-medium text-foreground/80">배송지</span>
//             <span className="line-clamp-2">{[item.snapAddress, item.snapDetail].filter(Boolean).join(" ") || "주소 정보 없음"}</span>
//           </div>
//           <div className="flex items-center gap-3">
//             <Ticket className="h-4 w-4" />
//             <span className="font-medium text-foreground/80">신청일</span>
//             <span>{formatDateTime(item.appliedAt)}</span>
//           </div>
//           {!isActive && (
//             <div className="flex items-center gap-3 text-rose-500">
//               <CircleX className="h-4 w-4" />
//               <span className="font-medium">취소일</span>
//               <span>{formatDateTime(item.canceledAt)}</span>
//             </div>
//           )}
//         </div>

//         <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
//           <div>
//             <p className="text-sm text-muted-foreground">가격</p>
//             <p className="mt-1 text-lg font-semibold text-foreground">{formatPrice(item.price)}</p>
//           </div>
//           <Button variant={isActive ? "outline" : "secondary"} disabled className="rounded-lg px-6">
//             {isActive ? "취소하기" : "취소됨"}
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
function RegistrationCard({
  item,
  filter,
  onCancel,
  isCancelling,
}: {
  item: MyRegistrationItem
  filter: RegistrationFilter
  onCancel: (registrationId: number) => void
  isCancelling: boolean
}) {
  const isActive = filter === "ACTIVE"

  return (
    <Card
      className={cn(
        "h-full rounded-2xl border bg-card shadow-sm",
        isActive ? "border-slate-200" : "border-rose-200 bg-rose-50/30"
      )}
    >
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-3xl font-bold", isActive ? "text-primary" : "text-rose-500")}>
              {formatCourseType(item.courseType)}
            </p>
            <h3 className="mt-4 text-2xl font-bold text-foreground">{item.marathonTitle ?? "대회 정보 없음"}</h3>
          </div>
          <span
            className={cn(
              "inline-flex rounded-md px-3 py-1 text-sm font-semibold",
              isActive ? "bg-primary text-primary-foreground" : "bg-rose-500 text-white"
            )}
          >
            {isActive ? "접수 완료" : "취소됨"}
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
            <span className="line-clamp-2">
              {[item.snapAddress, item.snapDetail].filter(Boolean).join(" ") || "주소 정보 없음"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Shirt className="h-4 w-4" />
            <span className="font-medium text-foreground/80">티셔츠</span>
            <span>{item.tSize ?? "사이즈 정보 없음"}</span>
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

        <div className="mt-auto flex items-center justify-between border-t border-border pt-5">
          <div>
            <p className="text-sm text-muted-foreground">가격</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{formatPrice(item.price)}</p>
          </div>

          {isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "rounded-lg px-6 transition-all duration-200",
                    "hover:bg-red-100 hover:text-red-700 hover:border-red-300"
                  )}
                  disabled={isCancelling || item.registrationId === null}
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
                        정말&nbsp;
                        <span className="font-medium text-foreground">
                          &quot;{item.marathonTitle ?? "선택한 대회"}&quot;
                        </span>{" "}
                        접수를 취소하시겠습니까?
                      </p>

                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                        <p className="font-semibold">취소 전 필독 사항</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          <li>취소가 완료되면 복구가 <b>불가능</b>합니다.</li>
                          <li>취소 후 대회 참가를 원할 경우 <b>재접수</b>가 필요합니다.</li>
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
                    className="
                      bg-red-600 text-white border border-red-600
                      transition-colors duration-200
                      hover:bg-red-700 hover:border-red-700
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300
                      disabled:opacity-50 disabled:pointer-events-none
                    "
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
      </CardContent>
    </Card>
  )
}

function PaginationBar({
  pageRes,
  onChange,
}: {
  pageRes: PageRes
  onChange: (page: number) => void
}) {
  const current = pageRes.page + 1
  const total = Math.max(pageRes.totalPages, 1)

  const pages = useMemo(() => {
    const result: number[] = []
    const start = Math.max(1, current - 1)
    const end = Math.min(total, current + 1)

    for (let page = start; page <= end; page += 1) {
      result.push(page)
    }

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
            <Button
              variant={page === current ? "default" : "outline"}
              className="min-w-10"
              onClick={() => onChange(page)}
            >
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

        setItems((prev) => prev.filter((item) => item.registrationId !== registrationId))
        setPageRes((prev) => ({
          ...prev,
          totalElements: Math.max(0, prev.totalElements - 1),
        }))
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
        void loadRegistrations()
      }
    },
    [loadRegistrations, router]
  )

  useEffect(() => {
    void loadRegistrations()
  }, [loadRegistrations])

  useEffect(() => {
    setPage(0)
  }, [filter])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
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
              <p className="mt-3 text-base text-muted-foreground">신청한 대회의 접수 상태와 일정을 확인하세요.</p>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <Button variant={filter === "ACTIVE" ? "default" : "outline"} onClick={() => setFilter("ACTIVE")}>
                접수 완료
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
                  <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2">
                    {items.map((item) => {
                      const key = item.registrationId ?? item.historyId ?? `${item.marathonId}-${item.appliedAt}`

                      return (
                        <RegistrationCard
                          key={key}
                          item={item}
                          filter={filter}
                          onCancel={handleCancel}
                          isCancelling={cancellingId === item.registrationId}
                        />
                      )
                    })}

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
