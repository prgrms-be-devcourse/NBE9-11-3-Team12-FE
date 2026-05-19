"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"
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
import { fetchWithAuth } from "@/lib/api-base"

function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

export default function CompleteProfilePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState({
        name: "",
        phoneNumber: "",
        gender: "",
        birth: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetchWithAuth("/api/v1/users/me/complete", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    phoneNumber: form.phoneNumber,
                    gender: form.gender,
                    birth: form.birth,
                }),
            })

            const json = await res.json().catch(() => ({}))

            if (res.ok && json.code === "SUCCESS") {
                alert("정보가 저장되었습니다. 이제 서비스를 이용하실 수 있습니다.")
                router.push("/")
                router.refresh()
            } else {
                setError(json.message || "정보 저장에 실패했습니다. 다시 시도해주세요.")
            }
        } catch (e) {
            console.error("Profile Complete Error:", e)
            setError("서버와 통신 중 문제가 발생했습니다.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
                {/* 안내 메시지 */}
                <div className="mb-6 w-full max-w-md rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary font-semibold mb-1">
                        <CheckCircle className="h-5 w-5" />
                        <span>반갑습니다! 로그인이 완료되었습니다.</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        대회 참가 신청을 위해 딱 한 번만 추가 정보를 입력해 주세요.
                    </p>
                </div>

                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">필수 정보 입력</CardTitle>
                        <CardDescription>
                            마라톤 참가 신청 시 사용되는 중요한 정보입니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {error && (
                                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive text-center">
                                    {error}
                                </div>
                            )}

                            {/* 이름 입력 */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">이름 (실명)</Label>
                                <Input
                                    id="name"
                                    placeholder="실명을 입력해주세요"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* 전화번호 입력 */}
                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber">휴대폰 번호</Label>
                                <Input
                                    id="phoneNumber"
                                    placeholder="010-1234-5678"
                                    value={form.phoneNumber}
                                    onChange={(e) =>
                                        setForm({ ...form, phoneNumber: formatPhoneNumber(e.target.value) })
                                    }
                                    required
                                />
                            </div>

                            {/* 성별 선택 */}
                            <div className="grid gap-2">
                                <Label htmlFor="gender">성별</Label>
                                <Select
                                    value={form.gender}
                                    onValueChange={(val) => setForm({ ...form, gender: val })}
                                    required
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="성별을 선택해주세요" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">남성</SelectItem>
                                        <SelectItem value="FEMALE">여성</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 생년월일 입력 */}
                            <div className="grid gap-2">
                                <Label htmlFor="birth">생년월일</Label>
                                <Input
                                    id="birth"
                                    type="date"
                                    value={form.birth}
                                    onChange={(e) => setForm({ ...form, birth: e.target.value })}
                                    required
                                />
                            </div>

                            <Button type="submit" className="mt-2 w-full h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        저장 중...
                                    </>
                                ) : (
                                    "저장하고 시작하기"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}