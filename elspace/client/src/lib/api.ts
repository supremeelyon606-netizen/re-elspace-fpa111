import { getSession } from 'next-auth/react'

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiError extends Error {
  public readonly status: number
  public readonly data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Fetch wrapper for API calls with automatic error handling
 * @param endpoint - API endpoint (e.g., '/api/users')
 * @param options - RequestInit options + skipAuth flag
 * @returns Parsed response
 */
export async function api<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`

  if (!skipAuth) {
    const session = await getSession()
    if (!session?.user?.email) {
      throw new ApiError('Unauthorized', 401)
    }

    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${session.accessToken}`,
    }
  }

  fetchOptions.headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  try {
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new ApiError(
        data?.message || `API Error: ${response.status}`,
        response.status,
        data
      )
    }

    if (response.status === 204) {
      return null as T
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      0
    )
  }
}

/**
 * GET request helper
 */
export function apiGet<T = any>(endpoint: string, options?: ApiRequestOptions) {
  return api<T>(endpoint, { ...options, method: 'GET' })
}

/**
 * POST request helper
 */
export function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: ApiRequestOptions
) {
  return api<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PUT request helper
 */
export function apiPut<T = any>(
  endpoint: string,
  body?: any,
  options?: ApiRequestOptions
) {
  return api<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * PATCH request helper
 */
export function apiPatch<T = any>(
  endpoint: string,
  body?: any,
  options?: ApiRequestOptions
) {
  return api<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * DELETE request helper
 */
export function apiDelete<T = any>(endpoint: string, options?: ApiRequestOptions) {
  return api<T>(endpoint, { ...options, method: 'DELETE' })
}

export { ApiError }
