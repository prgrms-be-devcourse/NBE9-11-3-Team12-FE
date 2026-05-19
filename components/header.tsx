"use client"

import { API_BASE_URL } from "@/lib/api-base"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { User, LogOut, Menu, X, Trophy } from "lucide-react"
import { fetchWithAuth } from "@/lib/api-base"


interface UserInfo {
  id: number
  email: string
  name: string
  role: string
  profileCompleted: boolean // 프로필 완성 여부 추가
}

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isSyncing, setIsSyncing] = useState(true) // 로딩 상태 추가
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // 백엔드와 동기화
    const syncUser = async () => {
      try {
        const res = await fetchWithAuth("/api/v1/auth/me")
        const json = await res.json()

        if (res.ok && json.data) {
          setUser(json.data)
          localStorage.setItem("user", JSON.stringify(json.data))
        } else {
          // 쿠키가 만료되었거나 비로그인 상태면 클리어
          localStorage.removeItem("user")
          setUser(null)
        }
      } catch (e) {
        console.error("User sync failed", e)
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (e) {
      console.error("로그아웃 요청 실패", e)
    } finally {
      localStorage.removeItem("user")
      setUser(null)
      setIsMobileMenuOpen(false)
      router.push("/")
    }
  }

  // 로딩중일때 아무것도 안 보여주거나 스피너 보여줘서 버튼 깜빡임 방지
  if (isSyncing && !user) {
    return <header className="sticky top-0 z-50 h-16 w-full border-b bg-card/95" />
  }

  const isLoggedIn = !!user
  const isOrganizerOrAdmin = user?.role === "ORGANIZER" || user?.role === "ADMIN"
  const isParticipant = isLoggedIn && !isOrganizerOrAdmin

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">M</span>
          </div>
          <span className="text-xl font-bold text-foreground">달려라 마라톤</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            홈
          </Link>
          <Link href="/marathons" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            마라톤 일정
          </Link>

          {/* 주최자/어드민 전용 */}
          {isOrganizerOrAdmin && (
            <>
              <Link href="/marathons/create" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                대회 등록
              </Link>
              <Link href="/marathons/myMarathons" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                대회 목록
              </Link>
            </>
          )}

          {/* 참가자 전용 */}
          {isParticipant && (
            <Link href="/mypage/registrations" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              내 접수 조회
            </Link>
          )}
        </nav>

        {/* 데스크탑 인증 버튼 */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium text-foreground">
                {user?.name}님 환영합니다!
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/mypage">
                  <User className="mr-2 h-4 w-4" />
                  마이페이지
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-sm font-medium text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
              홈
            </Link>
            <Link href="/marathons" className="text-sm font-medium text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
              마라톤 일정
            </Link>

            {/* 주최자/어드민 전용 */}
            {isOrganizerOrAdmin && (
              <>
                <Link href="/marathons/create" className="text-sm font-medium text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                  대회 등록
                </Link>
                <Link href="/marathons/myMarathons" className="text-sm font-medium text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                  대회 목록
                </Link>
              </>
            )}

            {/* 참가자 전용 */}
            {isParticipant && (
              <Link href="/mypage/registrations" className="text-sm font-medium text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                내 접수 조회
              </Link>
            )}

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
              {isLoggedIn ? (
                <>
                  <span className="text-sm font-medium text-foreground px-2 py-1">
                    {user?.name}님 환영합니다!
                  </span>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      마이페이지
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      로그인
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="justify-start">
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      회원가입
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}