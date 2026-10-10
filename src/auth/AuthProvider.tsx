import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { AUTH_EXPIRED_EVENT, tokenStore } from '../api/client'
import type { RegisterRequest, User } from '../api/types'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null)

  // On page load: if a token is saved, ask the backend who it belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    authApi
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        tokenStore.clear()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  // The API client fires this event when the backend answers 401 (token expired).
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [queryClient])

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await authApi.login({ phone, password })
      tokenStore.set(res.access_token)
      try {
        // The login response has no role, so fetch the user details.
        const me = await authApi.getMe()
        queryClient.clear()
        setUser(me)
        return me
      } catch (error) {
        tokenStore.clear()
        throw error
      }
    },
    [queryClient],
  )

  const adminLogin = useCallback(
    async (phone: string, password: string) => {
      const res = await authApi.adminLogin({ phone, password })
      tokenStore.set(res.access_token)
      try {
        const me = await authApi.getMe()
        queryClient.clear()
        setUser(me)
        return me
      } catch (error) {
        tokenStore.clear()
        throw error
      }
    },
    [queryClient],
  )

  const register = useCallback(
    async (body: RegisterRequest) => {
      const res = await authApi.register(body)
      tokenStore.set(res.access_token)
      queryClient.clear()
      let me: User
      try {
        me = await authApi.getMe()
      } catch {
        // Fall back to what we already know from the form and the response.
        me = {
          id: res.id,
          phone: res.phone,
          role: res.role,
          full_name: body.full_name,
          email: body.email,
          dob: body.dob,
          is_active: true,
        }
      }
      setUser(me)
      return me
    },
    [queryClient],
  )

  const value = useMemo(
    () => ({ user, loading, login, adminLogin, register, logout }),
    [user, loading, login, adminLogin, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
