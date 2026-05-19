"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { REGION_LABELS, COURSE_DISTANCE_LABELS } from "@/lib/marathon-labels"

// Types
interface Course {
    id?: number
    courseId?: number
    courseType: string
    price: number
    capacity: number
  }

interface MarathonDetail {
  id: number
  title: string
  region: string
  detailedAddress: string
  eventDate: string
  posterImageUrl: string | null
  registrationStartAt: string
  registrationEndAt: string
  status: string
  courses: Course[]
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

function normalizeCourseType(courseType?: string): string {
    if (!courseType) return ""
  
    const normalized = courseType.trim().toUpperCase()
  
    switch (normalized) {
      case "5K":
      case "5KM":
        return "5KM"
      case "10K":
      case "10KM":
        return "10KM"
      case "HALF":
      case "HALF_MARATHON":
        return "HALF"
      case "FULL":
      case "MARATHON":
      case "FULL_MARATHON":
        return "FULL"
      default:
        return normalized
    }
  }
// 날짜/시간 변환 헬퍼
function toDateInputValue(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toISOString().split("T")[0]
}

function toDateTimeLocalValue(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  // datetime-local 형식: YYYY-MM-DDTHH:mm
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toISOString(localDateTimeStr: string): string {
  if (!localDateTimeStr) return ""
  const date = new Date(localDateTimeStr)
  return date.toISOString()
}

// API Functions
async function fetchMarathonDetail(id: string): Promise<MarathonDetail> {
  const res = await fetchWithAuth(`/api/v1/marathons/${id}`, { method: "GET" })

  if (!res.ok) {
    throw new Error("마라톤 정보를 불러오지 못했습니다.")
  }

  const json: unknown = await res.json()

  if (isApiEnvelope(json)) {
    if (json.code !== "SUCCESS") {
      throw new Error(json.message ?? "마라톤 정보를 불러오지 못했습니다.")
    }
    return json.data as MarathonDetail
  }

  return json as MarathonDetail
}

async function updateMarathon(
  id: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const res = await fetchWithAuth(`/api/v1/marathons/${id}`, {
    method: "PATCH",
    body: formData,
  })

  const json: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      isApiEnvelope(json) && json.message
        ? json.message
        : "수정에 실패했습니다."
    return { success: false, message: msg }
  }

  return { success: true, message: "마라톤이 수정되었습니다." }
}

export default function EditMarathonPage() {
  const params = useParams()
  const router = useRouter()
  const marathonId = params.id as string

  // Auth state
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")

  // Form state
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form fields
  const [title, setTitle] = useState("")
  const [region, setRegion] = useState("")
  const [detailedAddress, setDetailedAddress] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [registrationStartAt, setRegistrationStartAt] = useState("")
  const [registrationEndAt, setRegistrationEndAt] = useState("")
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  // 사용자 인증 및 권한 확인
  const checkAuth = useCallback(async () => {
    try {
      const userStr = localStorage.getItem("user")
      if (!userStr) {
        setAuthStatus("unauthenticated")
        return
      }

      const user = JSON.parse(userStr) as { role?: string }

      const res = await fetchWithAuth("/api/v1/users/me", { method: "GET" })

      if (res.status === 401) {
        setAuthStatus("unauthenticated")
        return
      }

      if (!res.ok) {
        if (user.role !== "ORGANIZER") {
          setAuthStatus("unauthorized")
          return
        }
        setAuthStatus("authenticated")
        return
      }

      const json: unknown = await res.json()
      let role = user.role

      if (isApiEnvelope(json) && json.data) {
        const profileData = json.data as { role?: string }
        role = profileData.role
      } else if (typeof json === "object" && json !== null && "role" in json) {
        role = (json as { role?: string }).role
      }

      if (role !== "ORGANIZER") {
        setAuthStatus("unauthorized")
        return
      }

      setAuthStatus("authenticated")
    } catch {
      try {
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          setAuthStatus("unauthenticated")
          return
        }
        const user = JSON.parse(userStr) as { role?: string }
        if (user.role !== "ORGANIZER") {
          setAuthStatus("unauthorized")
          return
        }
        setAuthStatus("authenticated")
      } catch {
        setAuthStatus("unauthenticated")
      }
    }
  }, [])

  // 마라톤 데이터 로드
  const loadMarathonData = useCallback(async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      const data = await fetchMarathonDetail(marathonId)
    
      const normalizedPosterUrl =

      data.posterImageUrl && data.posterImageUrl.startsWith("/")
        ? `http://localhost:8080${data.posterImageUrl}`
        : data.posterImageUrl

      setTitle(data.title)
      setRegion(data.region)
      setDetailedAddress(data.detailedAddress)
      setEventDate(toDateInputValue(data.eventDate))
      setRegistrationStartAt(toDateTimeLocalValue(data.registrationStartAt))
      setRegistrationEndAt(toDateTimeLocalValue(data.registrationEndAt))
      setExistingPosterUrl(normalizedPosterUrl)
      setCourses(
        data.courses.length > 0
          ? data.courses.map((course) => ({
              id: course.id ?? course.courseId,
              courseType: normalizeCourseType(course.courseType),
              price: course.price ?? 0,
              capacity: course.capacity ?? 0,
            }))
          : [{ courseType: "", price: 0, capacity: 0 }]
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoadingData(false)
    }
  }, [marathonId])

  // 이미지 파일 선택 처리
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPosterFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPosterPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 코스 추가
  const addCourse = () => {
    setCourses([...courses, { courseType: "", price: 0, capacity: 0 }])
  }

  // 코스 삭제
  const removeCourse = (index: number) => {
    if (courses.length <= 1) return
    setCourses(courses.filter((_, i) => i !== index))
  }

  // 코스 필드 업데이트
  const updateCourse = (index: number, field: keyof Course, value: string | number) => {
    const updated = [...courses]
    if (field === "price" || field === "capacity") {
      updated[index][field] = typeof value === "string" ? parseInt(value) || 0 : value
    } else if (field === "courseType") {
      updated[index][field] = value as string
    }
    setCourses(updated)
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("region", region)
      formData.append("detailedAddress", detailedAddress)
      formData.append("eventDate", eventDate)
      formData.append("registrationStartAt", `${registrationStartAt}:00`)
      formData.append("registrationEndAt", `${registrationEndAt}:00`)

      if (posterFile) {
        formData.append("posterImage", posterFile)
      }

      // 코스 데이터 추가
      courses.forEach((course, index) => {
        if (course.id) {
          formData.append(`courses[${index}].id`, String(course.id))
        }
        formData.append(`courses[${index}].courseType`, course.courseType)
        formData.append(`courses[${index}].price`, String(course.price))
        formData.append(`courses[${index}].capacity`, String(course.capacity))
      })

      const result = await updateMarathon(marathonId, formData)

      if (result.success) {
        setSuccessMessage(result.message)
        setTimeout(() => {
          router.push("/marathons/myMarathons")
        }, 1500)
      } else {
        setError(result.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadMarathonData()
    }
  }, [authStatus, loadMarathonData])

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

  // 미로그인 상태
  if (authStatus === "unauthenticated") {
    router.replace(`/login?redirect=/myMarathons/${marathonId}/edit`)
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

  // 권한 없음
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
              <CardTitle className="text-2xl">접근 권한 없음</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                주최자만 접근할 수 있는 페이지입니다.
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <Link
              href="/myMarathons"
              className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              내 마라톤 목록으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-foreground">마라톤 수정</h1>
            <p className="mt-1 text-muted-foreground">
              마라톤 대회 정보를 수정합니다.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="mb-6 rounded-lg border border-primary/50 bg-primary/10 p-4 text-sm text-primary">
              {successMessage}
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoadingData ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">마라톤 정보를 불러오는 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* 기본 정보 카드 */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                  <CardDescription>
                    마라톤 대회의 기본 정보를 입력해 주세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 대회명 */}
                  <div className="space-y-2">
                    <Label htmlFor="title">대회명 *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 서울 야간 마라톤"
                      required
                    />
                  </div>

                  {/* 지역 & 상세주소 */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="region">지역 *</Label>
                      <Select value={region} onValueChange={setRegion} required>
                        <SelectTrigger id="region" className="w-full">
                          <SelectValue placeholder="지역 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(REGION_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="detailedAddress">상세 주소</Label>
                      <Input
                        id="detailedAddress"
                        value={detailedAddress}
                        onChange={(e) => setDetailedAddress(e.target.value)}
                        placeholder="예: 서울시 마포구 월드컵공원"
                      />
                    </div>
                  </div>

                  {/* 대회일 */}
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">대회일 *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* 접수 기간 */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="registrationStartAt">접수 시작일시 *</Label>
                      <Input
                        id="registrationStartAt"
                        type="datetime-local"
                        value={registrationStartAt}
                        onChange={(e) => setRegistrationStartAt(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationEndAt">접수 종료일시 *</Label>
                      <Input
                        id="registrationEndAt"
                        type="datetime-local"
                        value={registrationEndAt}
                        onChange={(e) => setRegistrationEndAt(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 포스터 이미지 카드 */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>포스터 이미지</CardTitle>
                  <CardDescription>
                    대회 포스터 이미지를 업로드해 주세요. (선택)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    {/* 기존 이미지 미리보기 */}
                    <div className="shrink-0">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">현재 이미지</p>
                      <div className="relative h-40 w-32 overflow-hidden rounded-lg border bg-muted">
                        {existingPosterUrl ? (
                          <Image
                            src={existingPosterUrl}
                            alt="현재 포스터"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 새 이미지 업로드 */}
                    <div className="flex-1">
                      <p className="mb-2 text-sm font-medium text-muted-foreground">새 이미지 업로드</p>
                      <Label
                        htmlFor="poster"
                        className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
                      >
                        {posterPreview ? (
                          <div className="relative h-full w-full">
                            <Image
                              src={posterPreview}
                              alt="새 포스터 미리보기"
                              fill
                              className="rounded-lg object-contain p-2"
                            />
                          </div>
                        ) : (
                          <>
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">클릭하여 이미지 선택</span>
                            <span className="mt-1 text-xs text-muted-foreground/70">PNG, JPG, WEBP (최대 5MB)</span>
                          </>
                        )}
                      </Label>
                      <Input
                        id="poster"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePosterChange}
                      />
                      {posterFile && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          선택된 파일: {posterFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 코스 정보 카드 */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>코스 정보</CardTitle>
                      <CardDescription>
                        대회에서 제공하는 코스를 설정해 주세요.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses.map((course, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg border bg-muted/30 p-4"
                    >
                      {/* 숨겨진 코스 ID */}
                      {course.id && (
                        <input type="hidden" value={course.id} />
                      )}

                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          코스 {index + 1}
                        </span>
                        {courses.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>코스 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 코스를 삭제하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeCourse(index)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`course-type-${index}`}>코스 타입 *</Label>
                          <Select
                            value={course.courseType ?? ""}
                            onValueChange={(value) => updateCourse(index, "courseType", value)}
                          >
                            <SelectTrigger id={`course-type-${index}`} className="w-full">
                              <SelectValue placeholder="코스 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(COURSE_DISTANCE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`course-price-${index}`}>참가비 (원) *</Label>
                          <Input
                            id={`course-price-${index}`}
                            type="number"
                            min="0"
                            value={course.price ?? ""}
                            onChange={(e) => updateCourse(index, "price", e.target.value)}
                            placeholder="10000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`course-capacity-${index}`}>정원 (명) *</Label>
                          <Input
                            id={`course-capacity-${index}`}
                            type="number"
                            min="1"
                            value={course.capacity ?? ""}
                            onChange={(e) => updateCourse(index, "capacity", e.target.value)}
                            placeholder="100"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 버튼 영역 */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/marathons/myMarathons")}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "수정 저장"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}