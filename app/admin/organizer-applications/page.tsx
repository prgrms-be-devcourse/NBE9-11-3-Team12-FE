"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { fetchWithAuth } from "@/lib/api-base"

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED"
type StatusFilter = "ALL" | ApplicationStatus
type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unauthorized"

interface ApiResponse<T> {
  status: number
  code: string
  message: string
  data: T | null
}

interface OrganizerApplicationItem {
  applicationId: number
  userId: number
  userName: string
  userEmail: string
  businessRegistrationNumber: string
  status: ApplicationStatus
  rejectReason: string | null
  requestedAt: string
}

interface PageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

interface OrganizerApplicationListRes {
  content: OrganizerApplicationItem[]
  page: PageInfo
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "거절" },
]

function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "거절",
  }
  return labels[status]
}

function getStatusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100"
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    case "REJECTED":
      return "bg-rose-100 text-rose-800 hover:bg-rose-100"
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getErrorMessage(json: unknown, fallback: string): string {
  if (
    typeof json === "object" &&
    json !== null &&
    "message" in json &&
    typeof (json as { message?: unknown }).message === "string"
  ) {
    return (json as { message: string }).message
  }

  return fallback
}

function getUserRole(json: unknown): string | undefined {
  if (
    typeof json === "object" &&
    json !== null &&
    "data" in json &&
    typeof (json as { data?: unknown }).data === "object" &&
    (json as { data?: unknown }).data !== null &&
    "role" in ((json as { data: Record<string, unknown> }).data) &&
    typeof (json as { data: { role?: unknown } }).data.role === "string"
  ) {
    return (json as { data: { role: string } }).data.role
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "role" in json &&
    typeof (json as { role?: unknown }).role === "string"
  ) {
    return (json as { role: string }).role
  }

  return undefined
}

export default function AdminOrganizerApplicationsPage() {
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [applications, setApplications] = useState<OrganizerApplicationItem[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<OrganizerApplicationItem | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const pendingCount = useMemo(
    () => applications.filter((application) => application.status === "PENDING").length,
    [applications],
  )

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/v1/users/me", { method: "GET" })

      if (res.status === 401) {
        setAuthStatus("unauthenticated")
        return
      }

      const json: unknown = await res.json().catch(() => ({}))

      if (!res.ok) {
        setAuthStatus("unauthenticated")
        return
      }

      const role = getUserRole(json)

      if (role !== "ADMIN") {
        setAuthStatus("unauthorized")
        return
      }

      setAuthStatus("authenticated")
    } catch {
      setAuthStatus("unauthenticated")
    }
  }, [])

  const loadApplications = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageInfo.size),
      })

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter)
      }

      const res = await fetchWithAuth(
        `/api/v1/admin/organizer-applications?${params.toString()}`,
        { method: "GET" },
      )

      if (res.status === 401) {
        router.replace("/login")
        return
      }

      if (res.status === 403) {
        setAuthStatus("unauthorized")
        return
      }

      const json: ApiResponse<OrganizerApplicationListRes> = await res.json().catch(() => ({
        status: res.status,
        code: "ERROR",
        message: "응답을 읽지 못했습니다.",
        data: null,
      }))

      if (!res.ok || json.code !== "SUCCESS" || !json.data) {
        throw new Error(json.message || "주최자 권한 신청 목록을 불러오지 못했습니다.")
      }

      setApplications(json.data.content)
      setPageInfo(json.data.page)
    } catch (error) {
      setApplications([])
      setErrorMessage(
        error instanceof Error ? error.message : "주최자 권한 신청 목록을 불러오지 못했습니다.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [page, pageInfo.size, router, statusFilter])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authStatus === "authenticated") {
      void loadApplications()
    }
  }, [authStatus, loadApplications])

  const handleStatusFilterChange = (nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus)
    setPage(0)
    setSuccessMessage("")
    setErrorMessage("")
  }

  const handleApprove = async (applicationId: number) => {
    if (processingId !== null) return

    setProcessingId(applicationId)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const res = await fetchWithAuth(
        `/api/v1/admin/organizer-applications/${applicationId}/approve`,
        { method: "PATCH" },
      )
      const json: unknown = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(getErrorMessage(json, "승인 처리에 실패했습니다."))
      }

      setSuccessMessage("주최자 권한 신청을 승인했습니다. 승인받은 사용자는 권한 반영을 위해 다시 로그인해야 합니다.")
      await loadApplications()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "승인 처리에 실패했습니다.")
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (application: OrganizerApplicationItem) => {
    setRejectTarget(application)
    setRejectReason("")
    setErrorMessage("")
    setSuccessMessage("")
  }

  const closeRejectDialog = () => {
    if (processingId !== null) return
    setRejectTarget(null)
    setRejectReason("")
  }

  const handleReject = async () => {
    if (!rejectTarget || processingId !== null) return

    const trimmedReason = rejectReason.trim()
    if (!trimmedReason) {
      setErrorMessage("거절 사유를 입력해주세요.")
      return
    }

    setProcessingId(rejectTarget.applicationId)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const res = await fetchWithAuth(
        `/api/v1/admin/organizer-applications/${rejectTarget.applicationId}/reject`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectReason: trimmedReason }),
        },
      )
      const json: unknown = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(getErrorMessage(json, "거절 처리에 실패했습니다."))
      }

      setSuccessMessage("주최자 권한 신청을 거절했습니다.")
      setRejectTarget(null)
      setRejectReason("")
      await loadApplications()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "거절 처리에 실패했습니다.")
    } finally {
      setProcessingId(null)
    }
  }

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>로그인이 필요합니다</CardTitle>
              <CardDescription>관리자 페이지는 로그인 후 이용할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/login")} className="w-full">
                로그인으로 이동
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>관리자 권한이 필요합니다</CardTitle>
              <CardDescription>주최자 권한 신청 관리는 관리자만 사용할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                홈으로 이동
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" />
                관리자
              </div>
              <h1 className="text-2xl font-bold text-foreground">주최자 권한 신청 관리</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                신청 내역을 상태별로 확인하고 승인 또는 거절할 수 있습니다.
              </p>
            </div>

            <Button variant="outline" onClick={() => loadApplications()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>

          <section className="mb-4 grid gap-3 sm:grid-cols-4">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleStatusFilterChange(filter.value)}
                className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  statusFilter === filter.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                <span className="block font-semibold">{filter.label}</span>
                <span
                  className={`mt-1 block text-xs ${
                    statusFilter === filter.value ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                >
                  {filter.value === "ALL" ? "전체 신청" : `${filter.label} 상태`}
                </span>
              </button>
            ))}
          </section>

          {successMessage && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>신청 목록</CardTitle>
                <CardDescription>
                  총 {pageInfo.totalElements.toLocaleString()}건
                  {statusFilter === "PENDING" && ` · 현재 페이지 대기 ${pendingCount}건`}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : applications.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  조회된 신청 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">신청자</th>
                        <th className="px-4 py-3 font-medium">이메일</th>
                        <th className="px-4 py-3 font-medium">사업자등록번호</th>
                        <th className="px-4 py-3 font-medium">상태</th>
                        <th className="px-4 py-3 font-medium">신청일</th>
                        <th className="px-4 py-3 text-right font-medium">처리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((application) => (
                        <tr key={application.applicationId} className="border-b last:border-0">
                          <td className="px-4 py-4">
                            <div className="font-medium text-foreground">{application.userName}</div>
                            <div className="text-xs text-muted-foreground">ID {application.userId}</div>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">{application.userEmail}</td>
                          <td className="px-4 py-4 font-medium">{application.businessRegistrationNumber}</td>
                          <td className="px-4 py-4">
                            <Badge className={getStatusBadgeClass(application.status)}>
                              {getStatusLabel(application.status)}
                            </Badge>
                            {application.rejectReason && (
                              <div className="mt-2 max-w-xs text-xs text-muted-foreground">
                                {application.rejectReason}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {formatDateTime(application.requestedAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(application.applicationId)}
                                disabled={application.status !== "PENDING" || processingId !== null}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(application)}
                                disabled={application.status !== "PENDING" || processingId !== null}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                거절
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {pageInfo.totalPages === 0 ? "0 / 0 페이지" : `${pageInfo.page + 1} / ${pageInfo.totalPages} 페이지`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={isLoading || pageInfo.page <= 0}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isLoading || pageInfo.totalPages === 0 || pageInfo.page >= pageInfo.totalPages - 1}
                  >
                    다음
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && closeRejectDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주최자 권한 신청 거절</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget?.userName}님의 신청을 거절합니다. 거절 사유를 입력해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="예: 사업자등록번호 확인이 필요합니다."
            disabled={processingId !== null}
            className="min-h-28"
          />

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void handleReject()
              }}
              disabled={processingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingId === rejectTarget?.applicationId ? "처리 중..." : "거절하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
