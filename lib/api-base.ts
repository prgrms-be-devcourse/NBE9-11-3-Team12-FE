export const API_BASE_URL = "http://localhost:8080"
let reissuePromise: Promise<boolean> | null = null

// 토큰 재발급 함수
async function reissueToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reissue`, {
      method: "POST",
      credentials: "include", // 쿠키 포함
    })

    if (!response.ok) {
      console.warn("재발급 실패:", response.status)
      return false
    }

    return true
  } catch (error) {
    console.error("토큰 재발급 에러:", error)
    return false
  }
}

// 인증 포함 fetch wrapper
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`
  const headers = new Headers(options.headers)
  const isFormDataRequest = options.body instanceof FormData

  if (isFormDataRequest) {
    headers.delete("Content-Type")
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include", // 쿠키 자동 포함
    headers,
  }

  let response = await fetch(fullUrl, defaultOptions)

  if (response.status === 401) {
    console.warn("Access Token 만료 → 재발급 시도")

    if (!reissuePromise) {
      reissuePromise = reissueToken().finally(() => {
        reissuePromise = null
      })
    }

    const reissued = await reissuePromise

    if (reissued) {
      console.log("토큰 재발급 성공 → 요청 재시도")

      response = await fetch(fullUrl, defaultOptions)
    } else {
      console.error("재발급 실패 → 로그인 페이지 이동")

      // if (typeof window !== "undefined") {
      //   window.location.href = "/login"
      // }
    }
  }

  return response
}

export async function parseResponse<T>(response: Response): Promise<{
  ok: boolean
  status: number
  data: T | null
  message: string
}> {
  let data: T | null = null
  let message = ""

  try {
    const text = await response.text()

    if (text) {
      const parsed = JSON.parse(text)

      // ApiResponse 구조 대응
      data = parsed.data ?? parsed
      message = parsed.message ?? ""
    }
  } catch (error) {
    console.warn("JSON 파싱 실패:", error)
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    message,
  }
}
