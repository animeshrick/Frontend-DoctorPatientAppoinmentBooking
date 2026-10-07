import axios from 'axios'

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api'

const TOKEN_KEY = 'dpab_access_token'
export const AUTH_EXPIRED_EVENT = 'dpab:auth-expired'

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({ baseURL: API_BASE_URL })

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The backend token lasts 30 minutes and there is no refresh endpoint,
// so a 401 means "log in again".
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear()
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

/** Turn any error (FastAPI detail, validation list, network failure) into one readable line. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check that the backend is running.'
    }
    const data: unknown = error.response.data
    if (data && typeof data === 'object') {
      const detail = (data as { detail?: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) {
        const lines = detail.map((item: unknown) => {
          if (item && typeof item === 'object') {
            const { loc, msg } = item as { loc?: unknown[]; msg?: string }
            const field = Array.isArray(loc) ? loc.filter((p) => p !== 'body' && p !== 'query').join('.') : ''
            return field ? `${field}: ${msg ?? 'invalid'}` : (msg ?? 'invalid')
          }
          return String(item)
        })
        return lines.join('; ')
      }
      const message = (data as { message?: unknown }).message
      if (typeof message === 'string') return message
    }
    const status = error.response.status
    if (status >= 500) return `Server error (${status}). Check the backend terminal for the cause.`
    return `Request failed (${status}).`
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
