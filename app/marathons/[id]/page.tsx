"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Users,
  X,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  type MarathonDetailRes,
  fetchMarathonDetail,
} from "@/lib/marathon-detail"
import {
  formatRegion,
  marathonStatusToUi,
} from "@/lib/marathon-labels"

function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d)
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

const statusBadgeClass: Record<ReturnType<typeof marathonStatusToUi>, string> = {
  접수중: "bg-primary text-primary-foreground",
  접수예정: "bg-accent text-accent-foreground",
  접수마감: "bg-muted text-muted-foreground",
}

export default function MarathonDetailPage() {
  const { user, isLoading } = useAuthGuard(false)
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""

  const [detail, setDetail] = useState<MarathonDetailRes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setError("잘못된 경로입니다.")
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const data = await fetchMarathonDetail(id)
      setDetail(data)
    } catch (e) {
      setDetail(null)
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const uiStatus = detail ? marathonStatusToUi(detail.status) : "접수예정"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="-ml-2" asChild>
              <Link href="/marathons">
                <ArrowLeft className="mr-2 h-4 w-4" />
                일정 목록
              </Link>
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">불러오는 중…</p>
            </div>
          )}

          {!loading && error && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">
                  마라톤을 표시할 수 없습니다
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void load()}>
                  다시 시도
                </Button>
                <Button onClick={() => router.push("/marathons")}>
                  목록으로
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && detail && (
            <div className="flex flex-col gap-8">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {detail.posterImageUrl ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="group relative block aspect-[21/9] min-h-[200px] w-full cursor-zoom-in bg-secondary"
                        aria-label="포스터 크게 보기"
                      >
                        <Image
                          src={detail.posterImageUrl}
                          alt={detail.title}
                          fill
                          className="object-contain"
                          sizes="(max-width: 896px) 100vw, 896px"
                          priority
                        />
                        <Badge
                          className={`pointer-events-none absolute right-4 top-4 ${statusBadgeClass[uiStatus]}`}
                        >
                          {uiStatus}
                        </Badge>
                      </button>
                    </DialogTrigger>
                    <DialogContent
                      showCloseButton={false}
                      className="w-auto max-w-none border-none bg-transparent p-0 shadow-none"
                    >
                      <DialogHeader className="sr-only">
                        <DialogTitle>{detail.title} 포스터 확대 보기</DialogTitle>
                        <DialogDescription>
                          대회 포스터 이미지를 크게 확인합니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="relative inline-flex items-start justify-center">
                        <DialogClose asChild>
                          <button
                            type="button"
                            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition hover:bg-black/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
                            aria-label="포스터 확대 보기 닫기"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </DialogClose>
                        <img
                          src={detail.posterImageUrl}
                          alt={detail.title}
                          className="block max-h-[88vh] max-w-[92vw] rounded-2xl border border-white/10 bg-neutral-950 object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="relative aspect-[21/9] min-h-[200px] w-full bg-secondary">
                    <div className="flex h-full min-h-[200px] items-center justify-center bg-primary/10">
                      <span className="text-4xl font-bold text-primary/30">
                        {detail.courses[0]?.courseType ?? "MARATHON"}
                      </span>
                    </div>
                    <Badge
                      className={`absolute right-4 top-4 ${statusBadgeClass[uiStatus]}`}
                    >
                      {uiStatus}
                    </Badge>
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {detail.title}
                  </h1>
                  <div className="mt-4 flex flex-col gap-3 text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span>{formatRegion(detail.region)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 shrink-0 text-primary" />
                      <span>대회일 {formatDate(detail.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 shrink-0 text-primary" />
                      <span>
                        접수 {formatDateTime(detail.registrationStartAt)} ~{" "}
                        {formatDateTime(detail.registrationEndAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    코스 안내
                  </CardTitle>
                  <CardDescription>
                    거리별 참가비와 정원입니다. 실제 접수는 백엔드 정책에 따릅니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {detail.courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      등록된 코스 정보가 없습니다.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {detail.courses.map((course, idx) => (
                        <li
                          key={course.id ?? idx}
                          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-foreground">
                              {course.courseType || "코스"}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {course.price != null && (
                                <span>
                                  참가비{" "}
                                  <span className="font-medium text-foreground">
                                    {course.price.toLocaleString("ko-KR")}원
                                  </span>
                                </span>
                              )}
                              {course.capacity != null && (
                                <span>
                                  정원{" "}
                                  <span className="font-medium text-foreground">
                                    {course.capacity.toLocaleString("ko-KR")}명
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          {uiStatus === "접수중" && course.id && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/marathons/${id}/courses/${course.id}/register`
                                )
                              }
                            >
                              접수하기
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
