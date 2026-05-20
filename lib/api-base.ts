export const API_BASE_URL = "http://localhost:8080"

export interface ApiResponse<T> {
  status?: number
  code: string
  message?: string
  data?: T
}

export function isApiResponse<T = unknown>(value: unknown): value is ApiResponse<T> {
  return typeof value === "object" && value !== null && "code" in value
}

export function apiError(message: string, status: number) {
  return Object.assign(new Error(message), { status })
}

let reissuePromise: Promise<boolean> | null = null

async function reissueToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reissue`, {
      method: "POST",
      credentials: "include",
    })

    return response.ok
  } catch {
    return false
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`
  const headers = new Headers(options.headers)
  const isFormDataRequest = options.body instanceof FormData

  if (isFormDataRequest) {
    headers.delete("Content-Type")
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const requestOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers,
  }

  let response = await fetch(fullUrl, requestOptions)

  if (response.status === 401) {
    if (!reissuePromise) {
      reissuePromise = reissueToken().finally(() => {
        reissuePromise = null
      })
    }

    const reissued = await reissuePromise
    if (reissued) {
      response = await fetch(fullUrl, requestOptions)
    }
  }

  return response
}

export async function readJson<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "")
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function unwrapApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = await readJson<unknown>(response)

  if (!response.ok) {
    const message = isApiResponse(json) && json.message ? json.message : fallbackMessage
    throw apiError(message, response.status)
  }

  if (isApiResponse<T>(json)) {
    if (json.code !== "SUCCESS") {
      throw apiError(json.message ?? fallbackMessage, response.status)
    }

    if (json.data === undefined || json.data === null) {
      throw apiError("응답 데이터가 없습니다.", response.status)
    }

    return json.data
  }

  if (json === null || json === undefined) {
    throw apiError("응답 데이터가 없습니다.", response.status)
  }

  return json as T
}

export async function parseResponse<T>(response: Response): Promise<{
  ok: boolean
  status: number
  data: T | null
  message: string
}> {
  const json = await readJson<unknown>(response)

  if (isApiResponse<T>(json)) {
    return {
      ok: response.ok && json.code === "SUCCESS",
      status: response.status,
      data: json.data ?? null,
      message: json.message ?? "",
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data: (json as T) ?? null,
    message: "",
  }
}

export function normalizeAssetUrl(url?: string | null): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`
  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`
}
