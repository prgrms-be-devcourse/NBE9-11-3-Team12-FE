// hooks/use-auth-guard.ts
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-base"

interface MeRes {
    id: number
    email: string
    name: string
    role: string
    profileCompleted: boolean
}

/**
 * @param requireAuth - 로그인이 필수인지 여부 (기본값: true)
 * @param requireFullProfile - 프로필 완성까지 필수인지 여부 (기본값: false)
 */
export function useAuthGuard(requireAuth: boolean = true, requireFullProfile: boolean = false) {
    const router = useRouter()
    const [user, setUser] = useState<MeRes | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
                    method: "GET",
                    credentials: "include",
                })

                if (!res.ok) {
                    if (requireAuth) {
                        router.replace("/login")
                    } else {
                        setUser(null)
                        setIsLoading(false)
                    }
                    return
                }

                const json = await res.json()
                const me = json.data

                if (me) {
                    if (requireFullProfile && !me.profileCompleted) {
                        router.replace("/complete-profile")
                        return
                    }
                    setUser(me)
                }
            } catch (e) {
                if (requireAuth) router.replace("/login")
            } finally {
                setIsLoading(false)
            }
        }

        void checkAuth()
    }, [router, requireAuth, requireFullProfile])

    return { user, isLoading }
}