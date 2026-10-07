import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../api/types'
import { Spinner } from '../components/ui'
import { homePathFor, useAuth } from './useAuth'

/** Lets the nested pages render only for a logged-in user with an allowed role. */
export function RequireAuth({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}
