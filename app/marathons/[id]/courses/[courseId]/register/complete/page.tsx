'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface RegistrationData {
  registrationId: number
  marathonId: number
  marathonTitle: string
  courseId: number
  courseType: string
  status: string
  appliedAt: string
}

export default function CompletePage() {
  const params = useParams()
  const router = useRouter()
  const marathonId = parseInt(params.id as string)

  const [registration, setRegistration] = useState<RegistrationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('lastRegistration')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setRegistration(data)
      } catch (error) {
        console.error('Failed to parse registration data:', error)
        router.push(`/marathons/${marathonId}`)
      }
    } else {
      router.push(`/marathons/${marathonId}`)
    }
    setIsLoading(false)
  }, [marathonId, router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">처리 중입니다...</p>
        </div>
      </main>
    )
  }

  if (!registration) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      COMPLETED: { label: '접수 완료', className: 'bg-green-100 text-green-800' },
      PENDING: { label: '접수 대기중', className: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: '접수 취소', className: 'bg-red-100 text-red-800' },
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  const statusBadge = getStatusBadge(registration.status)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl py-8 px-4">
        {/* 성공 메시지 */}
        <div className="mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-center text-2xl font-bold mb-2">접수가 완료되었습니다!</h1>
          <p className="text-center text-muted-foreground">
            마라톤 대회에 성공적으로 접수되었습니다. 아래 정보를 확인해주세요.
          </p>
        </div>

        {/* 접수 정보 */}
        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg">접수 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">접수 번호</p>
                <p className="text-lg font-bold text-foreground">
                  #{registration.registrationId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">상태</p>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">마라톤명</p>
                <p className="font-medium text-foreground">{registration.marathonTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">코스 타입</p>
                <p className="font-medium text-foreground">{registration.courseType}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">접수 일시</p>
              <p className="font-medium text-foreground">
                {formatDate(registration.appliedAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 안내 메시지 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">다음 단계</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="text-xl font-bold text-primary shrink-0">1</div>
              <div>
                <p className="font-medium text-sm">입력하신 주소로 참가 물품 배송</p>
                <p className="text-xs text-muted-foreground mt-1">
                  대회 1주일 전까지 입력하신 주소로 티셔츠 및 참가 물품이 배송됩니다.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-primary shrink-0">2</div>
              <div>
                <p className="font-medium text-sm">대회 당일 현장 등록</p>
                <p className="text-xs text-muted-foreground mt-1">
                  대회 당일 현장에서 접수 번호를 제시하고 최종 등록을 완료해주세요.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-primary shrink-0">3</div>
              <div>
                <p className="font-medium text-sm">즐거운 마라톤 참여</p>
                <p className="text-xs text-muted-foreground mt-1">
                  안전하고 건강하게 대회를 즐기시기 바랍니다!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const content = `접수 번호: #${registration.registrationId}\n마라톤명: ${registration.marathonTitle}\n코스 타입: ${registration.courseType}\n상태: ${statusBadge.label}\n접수 일시: ${formatDate(registration.appliedAt)}`
              navigator.clipboard.writeText(content)
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            접수 정보 복사
          </Button>
          <Link href={`/marathons/${marathonId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대회 상세 정보 보기
            </Button>
          </Link>
          <Link href="/mypage/registrations" className="flex-1">
            <Button className="w-full">
              내 접수 조회
            </Button>
          </Link>
        </div>

        {/* 하단 링크 */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
