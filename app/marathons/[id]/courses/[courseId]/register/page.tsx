'use client'

import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RegistrationForm } from '@/components/registration-form'
import { useAuthGuard } from '@/hooks/use-auth-guard'

export default function RegisterPage() {
  // 프로필 미완성 시 프로필 작성 페이지로 리다이렉트
  const { user, isLoading } = useAuthGuard(true, true)
  const params = useParams()
  const courseId = parseInt(params.courseId as string)
  const marathonId = parseInt(params.id as string)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">권한 확인 중...</span>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl py-8 px-4">
        {/* 헤더 */}
        <div className="mb-8 flex items-center gap-4">
          <Link href={`/marathons/${marathonId}`}>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">마라톤 접수</h1>
            <p className="text-sm text-muted-foreground mt-1">
              참가 정보를 입력하고 접수를 완료해주세요
            </p>
          </div>
        </div>

        {/* 접수 폼 */}
        <RegistrationForm courseId={courseId} />
      </div>
    </main>
  )
}
