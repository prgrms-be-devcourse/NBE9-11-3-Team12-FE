"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

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

import { fetchWithAuth } from "@/lib/api-base"
import {
  ArrowLeft,
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Loader2,
  Upload,
  ImageIcon,
} from "lucide-react"

type Region =
  | "SEOUL"
  | "GYEONGGI"
  | "INCHEON"
  | "BUSAN"
  | "DAEGU"
  | "DAEJEON"
  | "GWANGJU"
  | "ULSAN"
  | "SEJONG"
  | "GANGWON"
  | "CHUNGBUK"
  | "CHUNGNAM"
  | "JEONBUK"
  | "JEONNAM"
  | "GYEONGBUK"
  | "GYEONGNAM"
  | "JEJU"

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unauthorized"

interface CourseType {
  distance: string
  price: number
  maxParticipants: number
}

interface MarathonForm {
  title: string
  region: Region | ""
  detailedAddress: string
  marathonDate: string
  registrationStart: string
  registrationEnd: string
  courses: CourseType[]
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

const REGIONS: { value: Region; label: string }[] = [
  { value: "SEOUL", label: "서울" },
  { value: "GYEONGGI", label: "경기" },
  { value: "INCHEON", label: "인천" },
  { value: "BUSAN", label: "부산" },
  { value: "DAEGU", label: "대구" },
  { value: "DAEJEON", label: "대전" },
  { value: "GWANGJU", label: "광주" },
  { value: "ULSAN", label: "울산" },
  { value: "SEJONG", label: "세종" },
  { value: "GANGWON", label: "강원" },
  { value: "CHUNGBUK", label: "충북" },
  { value: "CHUNGNAM", label: "충남" },
  { value: "JEONBUK", label: "전북" },
  { value: "JEONNAM", label: "전남" },
  { value: "GYEONGBUK", label: "경북" },
  { value: "GYEONGNAM", label: "경남" },
  { value: "JEJU", label: "제주" },
]

const COURSE_DISTANCES = [
  { value: "5K", label: "5km" },
  { value: "10K", label: "10km" },
  { value: "HALF", label: "하프 (21.0975km)" },
  { value: "FULL", label: "풀코스 (42.195km)" },
]

export default function CreateMarathonPage() {
  const router = useRouter()

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [posterFile, setPosterFile] = useState<File | null>(null)

  const [posterPreview, setPosterPreview] = useState<string | null>(null)

  const [form, setForm] = useState<MarathonForm>({
    title: "",
    region: "",
    detailedAddress: "",
    marathonDate: "",
    registrationStart: "",
    registrationEnd: "",
    courses: [{ distance: "", price: 0, maxParticipants: 0 }],
  })

  const checkAuth = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login?redirect=/marathons/create")
    }
  }, [authStatus, router])

  useEffect(() => {
    return () => {
      if (posterPreview) {
        URL.revokeObjectURL(posterPreview)
      }
    }
  }, [posterPreview])

  const addCourse = () => {
    if (form.courses.length >= 4) return

    setForm((prev) => ({
      ...prev,
      courses: [...prev.courses, { distance: "", price: 0, maxParticipants: 0 }],
    }))
  }

  const removeCourse = (index: number) => {
    if (form.courses.length <= 1) return

    setForm((prev) => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
    }))
  }

  const updateCourse = (
    index: number,
    field: keyof CourseType,
    value: string | number
  ) => {
    setForm((prev) => {
      const updatedCourses = [...prev.courses]
      updatedCourses[index] = {
        ...updatedCourses[index],
        [field]: value,
      }
      return { ...prev, courses: updatedCourses }
    })
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null

    if (posterPreview) {
      URL.revokeObjectURL(posterPreview)
    }

    setPosterFile(file)
    setPosterPreview(file ? URL.createObjectURL(file) : null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!form.title.trim()) {
      newErrors.title = "대회명을 입력해주세요"

    }

    if (!form.region) {
      newErrors.region = "지역을 선택해주세요"
    }

    if (!form.detailedAddress.trim()) {
      newErrors.detailedAddress = "상세 주소를 입력해주세요"
    }

    if (!form.marathonDate) {
      newErrors.marathonDate = "대회일을 선택해주세요"
    }

    if (!form.registrationStart) {
      newErrors.registrationStart = "접수 시작일을 선택해주세요"
    }

    if (!form.registrationEnd) {
      newErrors.registrationEnd = "접수 마감일을 선택해주세요"
    }

    if (form.registrationStart && form.registrationEnd) {
      if (new Date(form.registrationStart) >= new Date(form.registrationEnd)) {
        newErrors.registrationEnd = "접수 마감일은 시작일 이후여야 합니다"
      }
    }

    if (form.registrationEnd && form.marathonDate) {
      if (new Date(form.registrationEnd) >= new Date(form.marathonDate)) {
        newErrors.marathonDate = "대회일은 접수 마감일 이후여야 합니다"
      }
    }

    form.courses.forEach((course, index) => {
      if (!course.distance) {
        newErrors[`course_${index}_distance`] = "코스 거리를 선택해주세요"
      }
      if (course.price <= 0) {
        newErrors[`course_${index}_price`] = "참가비를 입력해주세요"
      }
      if (course.maxParticipants <= 0) {
        newErrors[`course_${index}_maxParticipants`] = "최대 참가자 수를 입력해주세요"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildFormData = () => {
    const fd = new FormData()

    fd.append("title", form.title)
    fd.append("region", form.region)
    fd.append("detailedAddress", form.detailedAddress)
    fd.append("eventDate", form.marathonDate)
    fd.append("registrationStartAt", `${form.registrationStart}T00:00:00`)
    fd.append("registrationEndAt", `${form.registrationEnd}T23:59:59`)

    if (posterFile) {
      fd.append("posterImage", posterFile)
    }

    form.courses.forEach((course, index) => {
      fd.append(`courses[${index}].courseType`, course.distance)
      fd.append(`courses[${index}].price`, String(course.price))
      fd.append(`courses[${index}].capacity`, String(course.maxParticipants))
    })

    return fd
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetchWithAuth("/api/v1/marathons", {
        method: "POST",
        body: buildFormData(),
      })

      const data: unknown = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          isApiEnvelope(data) && data.message
            ? data.message
            : "대회 등록에 실패했습니다. 다시 시도해주세요."

        setErrors({ general: message })

        setErrors({ general: message })
        return
      }

      if (isApiEnvelope(data) && data.code !== "SUCCESS") {
        setErrors({
          general: data.message || "대회 등록에 실패했습니다. 다시 시도해주세요.",
        })
        return
      }

      router.push("/marathons")
    } catch (error) {
      console.error("대회 등록 에러:", error)
      setErrors({
        general: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  if (authStatus === "unauthenticated") {
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

  if (authStatus === "unauthorized") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">접근 권한 없음</CardTitle>
              <CardDescription>
                주최자만 접근할 수 있는 페이지입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                마라톤 대회 등록은 주최자 계정만 사용할 수 있습니다.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
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
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Trophy className="h-6 w-6 text-primary-foreground" />
                </div>

                <div>
                  <CardTitle className="text-2xl">마라톤 대회 등록</CardTitle>
                  <CardDescription>새로운 마라톤 대회를 등록하세요</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {errors.general && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{errors.general}</p>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Trophy className="h-5 w-5 text-primary" />
                    기본 정보
                  </h3>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title">대회명</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="예: 2026 서울 벚꽃 마라톤"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    장소 정보
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="region">지역</Label>
                      <Select
                        value={form.region}
                        onValueChange={(value: Region) =>
                          setForm((prev) => ({ ...prev, region: value }))
                        }
                      >
                        <SelectTrigger className={errors.region ? "border-destructive" : ""}>
                          <SelectValue placeholder="지역 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.region && (
                        <p className="text-sm text-destructive">{errors.region}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="detailedAddress">상세 주소</Label>
                      <Input
                        id="detailedAddress"
                        type="text"
                        placeholder="예: 여의도 한강공원"
                        value={form.detailedAddress}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            detailedAddress: e.target.value,
                          }))
                        }
                        className={errors.detailedAddress ? "border-destructive" : ""}
                      />
                      {errors.detailedAddress && (
                        <p className="text-sm text-destructive">{errors.detailedAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Calendar className="h-5 w-5 text-primary" />
                    일정 정보
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="registrationStart">접수 시작일</Label>
                      <Input
                        id="registrationStart"
                        type="date"
                        value={form.registrationStart}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            registrationStart: e.target.value,
                          }))
                        }
                        className={errors.registrationStart ? "border-destructive" : ""}
                      />
                      {errors.registrationStart && (
                        <p className="text-sm text-destructive">{errors.registrationStart}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="registrationEnd">접수 마감일</Label>
                      <Input
                        id="registrationEnd"
                        type="date"
                        value={form.registrationEnd}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            registrationEnd: e.target.value,
                          }))
                        }
                        className={errors.registrationEnd ? "border-destructive" : ""}
                      />
                      {errors.registrationEnd && (
                        <p className="text-sm text-destructive">{errors.registrationEnd}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="marathonDate">대회일</Label>
                      <Input
                        id="marathonDate"
                        type="date"
                        value={form.marathonDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            marathonDate: e.target.value,
                          }))
                        }
                        className={errors.marathonDate ? "border-destructive" : ""}
                      />
                      {errors.marathonDate && (
                        <p className="text-sm text-destructive">{errors.marathonDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Upload className="h-5 w-5 text-primary" />
                    포스터 이미지
                  </h3>

                  <div className="flex flex-col gap-3">
                    <Label htmlFor="posterImage">포스터 업로드</Label>

                    <label
                      htmlFor="posterImage"
                      className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/50"
                    >
                      {posterPreview ? (
                        <div className="relative h-56 w-full overflow-hidden rounded-md">
                          <Image
                            src={posterPreview}
                            alt="포스터 미리보기"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-10 w-10" />
                          <p className="text-sm">클릭해서 포스터 이미지를 선택하세요</p>
                          <p className="text-xs">이미지는 선택사항입니다.</p>
                        </div>
                      )}
                    </label>

                    <Input
                      id="posterImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePosterChange}
                    />

                    {posterFile && (
                      <p className="text-sm text-muted-foreground">
                        선택된 파일: {posterFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      <Users className="h-5 w-5 text-primary" />
                      코스 정보
                    </h3>

                    {form.courses.length < 4 && (
                      <Button type="button" variant="outline" size="sm" onClick={addCourse}>
                        <Plus className="mr-1 h-4 w-4" />
                        코스 추가
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    {form.courses.map((course, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg border border-border bg-card p-4"
                      >
                        {form.courses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCourse(index)}
                            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="flex flex-col gap-2">
                            <Label>코스 거리</Label>
                            <Select
                              value={course.distance}
                              onValueChange={(value) =>
                                updateCourse(index, "distance", value)
                              }
                            >
                              <SelectTrigger
                                className={
                                  errors[`course_${index}_distance`]
                                    ? "border-destructive"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {COURSE_DISTANCES.map((dist) => (
                                  <SelectItem key={dist.value} value={dist.value}>
                                    {dist.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors[`course_${index}_distance`] && (
                              <p className="text-sm text-destructive">
                                {errors[`course_${index}_distance`]}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>참가비 (원)</Label>
                            <Input
                              type="number"
                              placeholder="30000"
                              value={course.price || ""}
                              onChange={(e) =>
                                updateCourse(index, "price", parseInt(e.target.value) || 0)
                              }
                              className={
                                errors[`course_${index}_price`] ? "border-destructive" : ""
                              }
                            />
                            {errors[`course_${index}_price`] && (
                              <p className="text-sm text-destructive">
                                {errors[`course_${index}_price`]}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label>최대 참가자 수</Label>
                            <Input
                              type="number"
                              placeholder="500"
                              value={course.maxParticipants || ""}
                              onChange={(e) =>
                                updateCourse(
                                  index,
                                  "maxParticipants",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className={
                                errors[`course_${index}_maxParticipants`]
                                  ? "border-destructive"
                                  : ""
                              }
                            />
                            {errors[`course_${index}_maxParticipants`] && (
                              <p className="text-sm text-destructive">
                                {errors[`course_${index}_maxParticipants`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.back()}
                  >
                    취소
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? "등록 중..." : "대회 등록"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}