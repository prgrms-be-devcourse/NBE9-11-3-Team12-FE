"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, UserRound } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator"
import { fetchWithAuth } from "@/lib/api-base"
import { useAuthGuard } from "@/hooks/use-auth-guard"

interface MyProfileRes {
  id?: number
  email: string
  name: string
  phoneNumber: string
  role?: string
  gender?: string
  birth?: string
}

interface ApiEnvelope<T> {
  code: string
  message?: string
  data?: T
}

function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

function isApiEnvelope(v: unknown): v is ApiEnvelope<unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    "code" in v &&
    typeof (v as ApiEnvelope<unknown>).code === "string"
  )
}

function unwrapProfile(json: unknown): MyProfileRes {
  if (isApiEnvelope(json)) {
    if (json.code !== "SUCCESS") {
      throw new Error(json.message ?? "프로필을 불러오지 못했습니다.")
    }
    if (json.data === undefined || json.data === null) {
      throw new Error("응답에 프로필 데이터가 없습니다.")
    }
    return json.data as MyProfileRes
  }
  return json as MyProfileRes
}

function unwrapPatchResult(json: unknown): unknown {
  if (isApiEnvelope(json)) {
    if (json.code !== "SUCCESS") {
      throw new Error(json.message ?? "수정에 실패했습니다.")
    }
    return json.data
  }
  return json
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    ORGANIZER: "주최자",
    PARTICIPANT: "참가자",
    ADMIN: "관리자",
  }
  return roleMap[role] ?? role
}

function syncHeaderUserName(name: string) {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, unknown>
    localStorage.setItem("user", JSON.stringify({ ...parsed, name }))
  } catch {
    /* ignore */
  }
}

export default function MyPage() {
  // 프로필 미완성 상태여도 마이페이지 접근 가능
  const { user: guardUser, isLoading: guardLoading } = useAuthGuard(true, false)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<MyProfileRes | null>(null)
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [gender, setGender] = useState<string>("")
  const [birth, setBirth] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    phoneNumber?: string
  }>({})

  const loadProfile = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetchWithAuth("/api/v1/users/me", {
        method: "GET",
      })

      if (res.status === 401) {
        router.replace("/login")
        return
      }

      const json: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          isApiEnvelope(json) && json.message
            ? json.message
            : "내 정보를 불러오지 못했습니다."
        throw new Error(msg)
      }

      const data = unwrapProfile(json)
      setProfile(data)
      setName(data.name ?? "")
      setPhoneNumber(data.phoneNumber ?? "")
      setGender(data.gender ?? "")
      setBirth(data.birth ?? "")
    } catch (e) {
      setProfile(null)
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!guardLoading && guardUser) {
      void loadProfile()
    }
  }, [guardLoading, guardUser, loadProfile])

  if (guardLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const validate = (): boolean => {
    const next: typeof fieldErrors = {}
    const trimmedName = name.trim()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedName) {
      next.name = "이름을 입력해주세요"
    } else if (trimmedName.length < 2) {
      next.name = "이름은 2자 이상이어야 합니다"
    }

    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/
    if (!trimmedPhone) {
      next.phoneNumber = "전화번호를 입력해주세요"
    } else if (!phoneRegex.test(trimmedPhone)) {
      next.phoneNumber = "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    if (!validate()) return

    const trimmedName = name.trim()
    const trimmedPhone = phoneNumber.trim()

    setSaving(true)
    setError(null)
    try {
      const res = await fetchWithAuth("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phoneNumber: trimmedPhone,
          gender: gender || null,
          birth: birth || null,
        }),
      })

      if (res.status === 401) {
        router.replace("/login")
        return
      }

      const json: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          isApiEnvelope(json) && json.message
            ? json.message
            : "정보 수정에 실패했습니다."
        throw new Error(msg)
      }

      unwrapPatchResult(json)
      setSuccess("내 정보가 저장되었습니다.")
      setProfile((prev) =>
        prev
          ? { ...prev, name: trimmedName, phoneNumber: trimmedPhone }
          : prev
      )
      syncHeaderUserName(trimmedName)
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
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
                  <UserRound className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">마이페이지</CardTitle>
                  <CardDescription>
                    내 정보를 관리하고 프로필을 완성해주세요.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>불러오는 중…</span>
                </div>
              ) : profile ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input value={profile.email} readOnly className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      이메일은 이 화면에서 변경할 수 없습니다.
                    </p>
                  </div>

                  {(profile.role || profile.gender || profile.birth) && (
                    <>
                      <Separator />
                      <div className="grid gap-4 sm:grid-cols-3">
                        {profile.role && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">역할</Label>
                            <p className="text-sm font-medium">{formatRole(profile.role)}</p>
                          </div>
                        )}
                        {profile.gender && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">성별</Label>
                            <p className="text-sm font-medium">{profile.gender}</p>
                          </div>
                        )}
                        {profile.birth && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">생년월일</Label>
                            <p className="text-sm font-medium">{profile.birth}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      수정 가능한 정보
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={fieldErrors.name ? "border-destructive" : ""}
                        autoComplete="name"
                      />
                      {fieldErrors.name && (
                        <p className="text-sm text-destructive">{fieldErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">전화번호</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        maxLength={13}
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(formatPhoneNumber(e.target.value))
                        }
                        placeholder="010-1234-5678"
                        className={
                          fieldErrors.phoneNumber ? "border-destructive" : ""
                        }
                        autoComplete="tel"
                      />
                      {fieldErrors.phoneNumber && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gender">성별</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="성별을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">남성</SelectItem>
                            <SelectItem value="FEMALE">여성</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth">생년월일</Label>
                        <Input
                          id="birth"
                          type="date"
                          value={birth}
                          onChange={(e) => setBirth(e.target.value)}
                          autoComplete="bday"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중…
                      </>
                    ) : (
                      "저장"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4 py-4">
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button type="button" variant="outline" onClick={() => void loadProfile()}>
                    다시 시도
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
