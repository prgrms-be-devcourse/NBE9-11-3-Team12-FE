"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { fetchWithAuth } from "@/lib/api-base"
import { MapPin, Shirt, FileText, AlertCircle } from "lucide-react"

type KakaoPostcodeData = {
  zonecode: string
  address: string
  roadAddress: string
}

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: {
        oncomplete: (data: KakaoPostcodeData) => void
      }) => {
        open: () => void
      }
    }
  }
}

interface RegistrationFormProps {
  courseId: number
  courseName?: string
  marathonTitle?: string
}

const T_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const

type FormState = {
  snapZipCode: string
  snapAddress: string
  snapDetail: string
  tSize: string
  agreedTerms: boolean
}

type FormErrors = Partial<Record<keyof FormState, string>> & { general?: string }

export function RegistrationForm({ courseId, courseName, marathonTitle }: RegistrationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isPostcodeReady, setIsPostcodeReady] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const detailInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    snapZipCode: "",
    snapAddress: "",
    snapDetail: "",
    tSize: "",
    agreedTerms: false,
  })

  useEffect(() => {
    if (window.kakao?.Postcode) {
      setIsPostcodeReady(true)
      return
    }

    const timer = window.setInterval(() => {
      if (window.kakao?.Postcode) {
        setIsPostcodeReady(true)
        window.clearInterval(timer)
      }
    }, 200)

    return () => window.clearInterval(timer)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.snapZipCode.trim()) {
      newErrors.snapZipCode = "우편번호를 입력해주세요"
    } else if (!/^\d{5}$/.test(form.snapZipCode.trim())) {
      newErrors.snapZipCode = "우편번호는 5자리 숫자입니다"
    }

    if (!form.snapAddress.trim()) {
      newErrors.snapAddress = "주소를 입력해주세요"
    }

    if (!form.tSize) {
      newErrors.tSize = "티셔츠 사이즈를 선택해주세요"
    }

    if (!form.agreedTerms) {
      newErrors.agreedTerms = "이용약관에 동의해주세요"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddressSearch = () => {
    if (!window.kakao?.Postcode) {
      setErrors((prev) => ({
        ...prev,
        general: "주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
      }))
      return
    }

    new window.kakao.Postcode({
      oncomplete: (data) => {
        const baseAddress = data.roadAddress || data.address

        setForm((prev) => ({
          ...prev,
          snapZipCode: data.zonecode,
          snapAddress: baseAddress,
        }))

        setErrors((prev) => {
          const next = { ...prev }
          delete next.general
          delete next.snapZipCode
          delete next.snapAddress
          return next
        })

        window.setTimeout(() => {
          detailInputRef.current?.focus()
        }, 0)
      },
    }).open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const body = {
        courseId,
        snapZipCode: form.snapZipCode.trim(),
        snapAddress: form.snapAddress.trim(),
        snapDetail: form.snapDetail.trim(),
        tSize: form.tSize,
        agreedTerms: form.agreedTerms,
      }

      const response = await fetchWithAuth("/api/v1/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok || data.code !== "SUCCESS") {
        setErrors({
          general: data.message || "접수에 실패했습니다. 다시 시도해주세요.",
        })
        return
      }

      // 성공 응답 데이터 저장
      const registrationData = {
        registrationId: data.data.registrationId,
        marathonId: data.data.marathonId,
        marathonTitle: data.data.marathonTitle,
        courseId: data.data.courseId,
        courseType: data.data.courseType,
        status: data.data.status,
        appliedAt: data.data.appliedAt,
      }
      
      // localStorage에 저장 후 완료 페이지로 이동
      localStorage.setItem("lastRegistration", JSON.stringify(registrationData))
      router.push(`/marathons/${data.data.marathonId}/courses/${courseId}/register/complete`)
    } catch (error) {
      console.error("접수 에러:", error)
      setErrors({
        general: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setIsPostcodeReady(true)}
        onReady={() => setIsPostcodeReady(true)}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 일반 에러 */}
        {errors.general && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errors.general}</p>
          </div>
        )}

        {/* 대회 정보 */}
        {(marathonTitle || courseName) && (
          <Card className="bg-secondary/50">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base">접수 대회 정보</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-col gap-1">
                {marathonTitle && (
                  <p className="text-sm font-medium text-foreground">{marathonTitle}</p>
                )}
                {courseName && (
                  <p className="text-sm text-muted-foreground">코스: {courseName}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 배송지 정보 */}
        <Card>
          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">배송지 정보</CardTitle>
            </div>
            <CardDescription className="text-xs">
              대회 기념 티셔츠 및 참가 물품을 받으실 주소를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
          {/* 우편번호 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="snapZipCode">
              우편번호 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="snapZipCode"
                type="text"
                placeholder="우편번호"
                maxLength={5}
                value={form.snapZipCode}
                readOnly
                className={errors.snapZipCode ? "border-destructive" : ""}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddressSearch}
                disabled={!isPostcodeReady}
                className="shrink-0"
              >
                {form.snapAddress ? "주소 다시 검색" : "주소 검색"}
              </Button>
            </div>
            {errors.snapZipCode && (
              <p className="text-sm text-destructive">{errors.snapZipCode}</p>
            )}
            {!isPostcodeReady && (
              <p className="text-sm text-muted-foreground">
                주소 검색 서비스를 불러오는 중입니다.
              </p>
            )}
          </div>

          {/* 주소 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="snapAddress">
              주소 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="snapAddress"
              type="text"
              placeholder="기본 주소"
              value={form.snapAddress}
              readOnly
              className={errors.snapAddress ? "border-destructive" : ""}
            />
            {errors.snapAddress && (
              <p className="text-sm text-destructive">{errors.snapAddress}</p>
            )}
          </div>

          {/* 상세 주소 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="snapDetail">
              상세 주소
              <span className="ml-1 text-xs text-muted-foreground">(선택)</span>
            </Label>
            <Input
              id="snapDetail"
              type="text"
              placeholder="예: OO아파트 101동 1001호"
              ref={detailInputRef}
              value={form.snapDetail}
              onChange={(e) => setForm({ ...form, snapDetail: e.target.value })}
            />
          </div>
          </CardContent>
        </Card>

        {/* 티셔츠 사이즈 */}
        <Card>
          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">티셔츠 사이즈</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tSize">
                사이즈 선택 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.tSize}
                onValueChange={(value) => setForm({ ...form, tSize: value })}
              >
                <SelectTrigger
                  id="tSize"
                  className={errors.tSize ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="사이즈를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {T_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tSize && (
                <p className="text-sm text-destructive">{errors.tSize}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 이용약관 */}
        <Card>
          <CardHeader className="pb-3 pt-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">이용약관</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed max-h-40 overflow-y-auto">
              <p className="font-medium text-foreground mb-2">마라톤 대회 참가 약관</p>
              <p>
                본 대회에 참가하기 위해서는 아래의 약관에 동의하셔야 합니다.
              </p>
              <br />
              <p>
                1. 참가자는 대회 참가 전 충분한 준비 운동을 실시해야 합니다.
              </p>
              <p>
                2. 대회 중 발생하는 부상이나 사고에 대해 주최 측은 의료 지원을 제공하나, 참가자 본인의 건강 상태 관리에 대한 책임은 참가자에게 있습니다.
              </p>
              <p>
                3. 참가자는 대회 규정 및 스태프의 지시에 따라야 합니다.
              </p>
              <p>
                4. 접수된 참가비는 취소 및 환불 규정에 따라 처리됩니다.
              </p>
              <p>
                5. 대회 중 촬영된 사진 및 영상은 주최 측의 홍보 목적으로 사용될 수 있습니다.
              </p>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Checkbox
                id="agreedTerms"
                checked={form.agreedTerms}
                onCheckedChange={(checked) =>
                  setForm({ ...form, agreedTerms: checked === true })
                }
                className={errors.agreedTerms ? "border-destructive" : ""}
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="agreedTerms"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이용약관에 동의합니다 <span className="text-destructive">*</span>
                </label>
                {errors.agreedTerms && (
                  <p className="text-sm text-destructive">{errors.agreedTerms}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "접수 중..." : "접수하기"}
        </Button>
      </form>
    </>
  )
}
