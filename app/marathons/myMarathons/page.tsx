"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { fetchWithAuth } from "@/lib/api-base"
import { marathonStatusToUi, formatRegion } from "@/lib/marathon-labels"

interface OrganizerMarathon {
  id: number
  title: string
  region: string
  eventDate: string
  posterImageUrl: string | null
  registrationStartAt: string
  registrationEndAt: string
  status: string
}

interface ApiEnvelope<T> {
  code: string
  message?: string
  data?: T
}

function isApiEnvelope(v: unknown): v is ApiEnvelope<unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    "code" in v &&
    typeof (v as ApiEnvelope<unknown>).code === "string"
  )
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unauthorized"

function getStatusBadgeStyle(status: string): string {
  const uiStatus = marathonStatusToUi(status)
  switch (uiStatus) {
    case "접수중":
      return "bg-primary text-primary-foreground"
    case "접수예정":
      return "bg-accent text-accent-foreground"
    case "접수마감":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function MyMarathonsPage() {
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [marathons, setMarathons] = useState<OrganizerMarathon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // 사용자 인증 및 권한 확인
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/v1/users/me", { method: "GET" })

      if (res.status === 401) {
        setAuthStatus("unauthenticated")
        return
      }

      if (!res.ok) {
        setAuthStatus("unauthenticated")
        return
      }

      const json: unknown = await res.json()
      let role: string | undefined

      if (isApiEnvelope(json) && json.data) {
        role = (json.data as { role?: string }).role
      } else if (typeof json === "object" && json !== null && "role" in json) {
        role = (json as { role?: string }).role
      }

      if (role !== "ORGANIZER" && role !== "ADMIN") {
        setAuthStatus("unauthorized")
        return
      }

      setAuthStatus("authenticated")
    } catch {
      setAuthStatus("unauthenticated")
    }
  }, [])

  // 주최자의 마라톤 목록 불러오기
  const loadMarathons = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetchWithAuth("/api/v1/marathons/me", { method: "GET" })

      if (res.status === 401) {
        setAuthStatus("unauthenticated")
        return
      }

      if (!res.ok) {
        throw new Error("마라톤 목록을 불러오지 못했습니다.")
      }

      const json: unknown = await res.json()
      let data: OrganizerMarathon[] = []

      if (isApiEnvelope(json)) {
        if (json.code !== "SUCCESS") {
          throw new Error(json.message ?? "마라톤 목록을 불러오지 못했습니다.")
        }
        data = (json.data as OrganizerMarathon[]) ?? []
      } else if (Array.isArray(json)) {
        data = json as OrganizerMarathon[]
      }

      const normalizedData = data.map((marathon) => ({
        ...marathon,
        posterImageUrl:
          marathon.posterImageUrl && marathon.posterImageUrl.startsWith("/")
            ? `http://localhost:8080${marathon.posterImageUrl}`
            : marathon.posterImageUrl,
      }))

      setMarathons(normalizedData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 마라톤 삭제
  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      const res = await fetchWithAuth(`/api/v1/marathons/${id}/cancel`, {
        method: "PATCH",
      })

      if (res.status === 401) {
        router.push("/login")
        return
      }

      if (!res.ok) {
        const json: unknown = await res.json().catch(() => ({}))
        const msg = isApiEnvelope(json) && json.message
          ? json.message
          : "삭제에 실패했습니다."
        throw new Error(msg)
      }

      // 목록에서 제거
      setMarathons((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadMarathons()
    }
  }, [authStatus, loadMarathons])

  // 로딩 상태
  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>인증 확인 중...</span>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 미로그인 상태 -> 로그인 페이지로 리다이렉트
  if (authStatus === "unauthenticated") {
    router.replace("/login?redirect=/myMarathons")
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>로그인 페이지로 이동 중...</span>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 권한 없음 (ORGANIZER가 아님)
  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <svg
                  className="h-8 w-8 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">접근 권한 없음</h1>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                주최자만 접근할 수 있는 페이지입니다.
              </p>
              <p className="text-sm text-muted-foreground">
                마라톤 대회를 주최하시려면 주최자 계정으로 가입해 주세요.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  홈으로 돌아가기
                </Link>
              </Button>
            </CardFooter>
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 페이지 헤더 */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="mb-2 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                홈으로 돌아가기
              </Link>
              <h1 className="text-3xl font-bold text-foreground">내가 주최한 마라톤</h1>
              <p className="mt-1 text-muted-foreground">
                주최한 마라톤 대회를 관리하세요.
              </p>
            </div>
            <Button asChild>
              <Link href="/marathons/create">
                <Plus className="mr-2 h-4 w-4" />
                새 마라톤 등록
              </Link>
            </Button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-destructive underline"
                onClick={() => loadMarathons()}
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 animate-pulse bg-muted" />
                  <CardContent className="space-y-3 p-4">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </CardContent>
                  <CardFooter className="gap-2 p-4 pt-0">
                    <div className="h-9 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-9 flex-1 animate-pulse rounded bg-muted" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : marathons.length === 0 ? (
            /* 빈 상태 */
            <Card className="mx-auto max-w-md text-center">
              <CardContent className="py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  아직 주최한 마라톤이 없습니다
                </h2>
                <p className="mb-6 text-muted-foreground">
                  첫 번째 마라톤 대회를 등록해 보세요!
                </p>
                <Button asChild>
                  <Link href="/marathons/create">
                    <Plus className="mr-2 h-4 w-4" />
                    새 마라톤 등록
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* 마라톤 카드 목록 */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {marathons.map((marathon) => (
                <Card key={marathon.id} className="group overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="relative p-0">
                    <div className="relative h-48 overflow-hidden bg-secondary">
                      {marathon.posterImageUrl ? (
                        <Image
                          src={marathon.posterImageUrl}
                          alt={marathon.title}
                          fill
                          unoptimized
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-primary/10">
                          <span className="text-4xl font-bold text-primary/30">
                            {marathon.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      <Badge
                        className={`absolute right-3 top-3 ${getStatusBadgeStyle(marathon.status)}`}
                      >
                        {marathonStatusToUi(marathon.status)}
                      </Badge>
                      <Link
                        href={`/organizer/marathons/${marathon.id}/registrations`}
                        className="absolute right-3 top-10 mt-1"
                      >
                        <Badge className="bg-white/90 text-foreground hover:bg-white cursor-pointer shadow-sm">
                          접수 현황
                        </Badge>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary">
                      {marathon.title}
                    </h3>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{formatRegion(marathon.region)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>대회일: {formatDate(marathon.eventDate)}</span>
                      </div>
                      <div className="mt-1 rounded-md bg-muted/50 p-2 text-xs">
                        <span className="font-medium text-foreground">접수 기간</span>
                        <p className="mt-0.5">
                          {formatDateTime(marathon.registrationStartAt)} ~ {formatDateTime(marathon.registrationEndAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2 p-4 pt-0">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/marathons/myMarathons/${marathon.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        수정
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          disabled={deletingId === marathon.id}
                        >
                          {deletingId === marathon.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          삭제
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>마라톤 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말 &quot;{marathon.title}&quot; 마라톤을 삭제하시겠습니까?
                            <br />
                            이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(marathon.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}