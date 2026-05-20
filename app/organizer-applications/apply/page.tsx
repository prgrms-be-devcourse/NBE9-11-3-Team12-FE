"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchWithAuth } from "@/lib/api-base"

interface ApiResponse<T> {
  status: number
  code: string
  message: string
  data: T | null
}

interface OrganizerApplicationCreateRes {
  id: number
  userId: number
  businessRegistrationNumber: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  requestedAt: string
}

export default function OrganizerApplicationApplyPage() {
  const router = useRouter()

  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedBusinessRegistrationNumber = businessRegistrationNumber.trim()

    if (!trimmedBusinessRegistrationNumber) {
      setErrorMessage("사업자등록번호를 입력해주세요.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage("")
      setSuccessMessage("")

      const res = await fetchWithAuth("/api/v1/organizer-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessRegistrationNumber: trimmedBusinessRegistrationNumber,
        }),
      })

      const json: ApiResponse<OrganizerApplicationCreateRes> = await res.json()

      if (!res.ok) {
        setErrorMessage(json.message || "주최자 권한 신청에 실패했습니다.")
        return
      }

      setSuccessMessage("주최자 권한 신청이 완료되었습니다.")
      setBusinessRegistrationNumber("")

      setTimeout(() => {
        router.push("/mypage")
      }, 800)
    } catch (error) {
      console.error("Organizer application failed", error)
      setErrorMessage("요청 처리 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mypage">
              <ArrowLeft className="mr-2 h-4 w-4" />
              마이페이지
            </Link>
          </Button>
        </div>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">주최자 권한 신청</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              마라톤 대회를 등록하고 관리하려면 주최자 권한 승인이 필요합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="businessRegistrationNumber"
                className="text-sm font-medium text-foreground"
              >
                사업자등록번호
              </label>
              <input
                id="businessRegistrationNumber"
                type="text"
                value={businessRegistrationNumber}
                onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                placeholder="예: 123-45-67890"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                {successMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href="/mypage">취소</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "신청 중..." : "신청하기"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
