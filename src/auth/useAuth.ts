import { createContext, useContext } from 'react'
import type { RegisterRequest, User, UserRole } from '../api/types'

export interface AuthContextValue {
  user: User | null
  /** True while the saved token is being checked on page load. */
  loading: boolean
  login: (phone: string, password: string) => Promise<User>
  /** Dedicated admin sign-in - calls /auth/admin/login, which rejects non-admin accounts itself. */
  adminLogin: (phone: string, password: string) => Promise<User>
  register: (body: RegisterRequest) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** First page to show after login, by role. */
export function homePathFor(role: UserRole): string {
  if (role === 'USER') return '/patient/appointments'
  if (role === 'DOCTOR') return '/doctor/profile'
  return '/admin/dashboard'
}
