"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
  Users,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  fetchRegistrationOverview,
  fetchRegistrationParticipantDetail,
  fetchRegistrationParticipants,
  PageRes,
  RegistrationOverviewRes,
  RegistrationParticipantDetailRes,
  RegistrationParticipantItem,
} from "@/lib/registration-query"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatCourseType(courseType: string) {
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

function formatRegistrationStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "접수완료"
    case "CANCELED":
      return "취소됨"
    default:
      return status
  }
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode
  label: string
  value: string
  description: string
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-primary">
          {icon}
        </div>
        <p className="text-lg font-semibold text-foreground">{label}</p>
        <p className="mt-6 text-5xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-4 text-base text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function CourseCard({
  title,
  current,
  capacity,
  remaining,
  rate,
}: {
  title: string
  current: number
  capacity: number
  remaining: number
  rate: number
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
        <p className="mt-8 text-5xl font-bold tracking-tight text-foreground">
          {current.toLocaleString("ko-KR")}
          <span className="text-3xl text-muted-foreground"> / {capacity.toLocaleString("ko-KR")}명</span>
        </p>

        <div className="mt-8 flex items-center gap-4">
          <Progress value={rate} className="h-3 flex-1" />
          <span className="min-w-12 text-right text-2xl font-semibold text-muted-foreground">{rate}%</span>
        </div>

        <p className="mt-6 text-xl text-muted-foreground">잔여 {remaining.toLocaleString("ko-KR")}명</p>
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
    <div className="mt-8 flex items-center justify-center gap-2">
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

function ParticipantDetailDialog({
  marathonId,
  participant,
  open,
  onOpenChange,
}: {
  marathonId: string
  participant: RegistrationParticipantItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [detail, setDetail] = useState<RegistrationParticipantDetailRes | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      if (!open || !participant) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchRegistrationParticipantDetail(marathonId, participant.registrationId)
        setDetail(result)
      } catch (error) {
        setError(error instanceof Error ? error.message : "상세 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDetail()
  }, [marathonId, open, participant])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>참가자 상세</DialogTitle>
          <DialogDescription>신청자 정보와 배송지 스냅샷을 확인합니다.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>상세 정보를 불러오는 중입니다.</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
        ) : detail ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">이름</p>
              <p className="mt-1 font-semibold">{detail.snapName}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">연락처</p>
              <p className="mt-1 font-semibold">{detail.snapPhoneNumber}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">코스</p>
              <p className="mt-1 font-semibold">{formatCourseType(detail.courseType)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">티셔츠 사이즈</p>
              <p className="mt-1 font-semibold">{detail.tSize}</p>
            </div>
            <div className="rounded-xl border p-4 sm:col-span-2">
              <p className="text-sm text-muted-foreground">주소</p>
              <p className="mt-1 font-semibold">[{detail.snapZipCode}] {detail.snapAddress} {detail.snapDetail}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">동의 여부</p>
              <p className="mt-1 font-semibold">{detail.agreedTerms ? "동의" : "미동의"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">신청일</p>
              <p className="mt-1 font-semibold">{formatDateTime(detail.appliedAt)}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function OrganizerRegistrationDashboard() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const marathonId = params.id

  const [overview, setOverview] = useState<RegistrationOverviewRes | null>(null)
  const [participants, setParticipants] = useState<RegistrationParticipantItem[]>([])
  const [pageRes, setPageRes] = useState<PageRes>({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  const [nameInput, setNameInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<RegistrationParticipantItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [overviewResult, participantsResult] = await Promise.all([
        fetchRegistrationOverview(marathonId),
        fetchRegistrationParticipants({
          marathonId,
          page,
          size: pageSize,
          courseId: courseFilter,
          name: keyword,
        }),
      ])

      setOverview(overviewResult)
      setParticipants(participantsResult.content)
      setPageRes(participantsResult.pageRes)
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0

      if (status === 401) {
        router.replace(`/login?redirect=/organizer/marathons/${marathonId}/registrations`)
        return
      }

      if (status === 403) {
        setError("해당 대회의 접수 현황을 조회할 권한이 없습니다.")
      } else {
        setError(error instanceof Error ? error.message : "접수 현황을 불러오지 못했습니다.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [courseFilter, keyword, marathonId, page, pageSize, router])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    setPage(0)
  }, [courseFilter, keyword, pageSize])

  const totalApplied = overview?.marathon.totalCurrentCount ?? 0
  const totalCapacity = overview?.marathon.totalCapacity ?? 0
  const totalRemaining = overview?.marathon.totalRemainingCount ?? 0
  const totalRate = overview?.marathon.totalRecruitmentRate ?? 0

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link href="/marathons/myMarathons" className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  내 대회 목록으로 돌아가기
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  {overview?.marathon.marathonTitle ?? "접수 현황"}
                </h1>
                <p className="mt-3 text-base text-muted-foreground">대회별 참가 신청 현황과 참가자 정보를 확인하세요.</p>
              </div>
              {overview && (
                <div className="rounded-2xl bg-slate-50 px-5 py-4 text-right text-sm text-muted-foreground">
                  <p className="font-semibold">대회일 {formatDate(overview.marathon.eventDate)}</p>
                  <p className="mt-1">모집률 {overview.marathon.totalRecruitmentRate}%</p>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>접수 현황을 불러오는 중입니다.</span>
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
            ) : overview ? (
              <>
                <div className="mt-10 grid gap-5 xl:grid-cols-4 md:grid-cols-2">
                  <StatCard icon={<Users className="h-6 w-6" />} label="총 신청자" value={`${totalApplied.toLocaleString("ko-KR")}명`} description="현재 신청 완료 기준" />
                  <StatCard icon={<ClipboardList className="h-6 w-6" />} label="모집 정원" value={`${totalCapacity.toLocaleString("ko-KR")}명`} description="전체 정원 기준" />
                  <StatCard icon={<CalendarDays className="h-6 w-6" />} label="잔여 인원" value={`${totalRemaining.toLocaleString("ko-KR")}명`} description="아직 신청 가능" />
                  <StatCard icon={<CheckCircle2 className="h-6 w-6" />} label="접수율" value={`${totalRate}%`} description="현재 진행률" />
                </div>

                <div className="mt-14">
                  <h2 className="text-2xl font-bold text-foreground">코스별 접수 현황</h2>
                  <div className="mt-6 grid gap-5 xl:grid-cols-4 md:grid-cols-2">
                    {overview.courseStatuses.map((course) => (
                      <CourseCard
                        key={course.courseId}
                        title={formatCourseType(course.courseType)}
                        current={course.currentCount}
                        capacity={course.capacity}
                        remaining={course.remainingCount}
                        rate={course.recruitmentRate}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-14">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-2xl font-bold text-foreground">참가자 목록</h2>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative min-w-[260px]">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setKeyword(nameInput.trim())
                            }
                          }}
                          placeholder="이름 검색..."
                          className="pl-9"
                        />
                      </div>

                      <Button variant="outline" onClick={() => setKeyword(nameInput.trim())}>검색</Button>

                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="min-w-[180px]">
                          <SelectValue placeholder="전체 코스" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">전체 코스</SelectItem>
                          {overview.courseStatuses.map((course) => (
                            <SelectItem key={course.courseId} value={String(course.courseId)}>
                              {formatCourseType(course.courseType)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                        <SelectTrigger className="min-w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={String(size)}>{size}개씩</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="px-5">신청일</TableHead>
                          <TableHead>이름</TableHead>
                          <TableHead>코스</TableHead>
                          <TableHead>연락처</TableHead>
                          <TableHead>티셔츠 사이즈</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead className="pr-5 text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                              조건에 맞는 참가자가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          participants.map((participant) => (
                            <TableRow key={participant.registrationId}>
                              <TableCell className="px-5">{formatDateTime(participant.appliedAt)}</TableCell>
                              <TableCell>{participant.name}</TableCell>
                              <TableCell>{formatCourseType(participant.courseType)}</TableCell>
                              <TableCell>{participant.phoneNumber}</TableCell>
                              <TableCell>{participant.tSize}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="rounded-md px-2 py-1">{formatRegistrationStatus(participant.status)}</Badge>
                              </TableCell>
                              <TableCell className="pr-5 text-right">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedParticipant(participant)
                                    setDetailOpen(true)
                                  }}
                                >
                                  상세
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationBar pageRes={pageRes} onChange={(nextPage) => setPage(nextPage - 1)} />
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />

      <ParticipantDetailDialog
        marathonId={marathonId}
        participant={selectedParticipant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
