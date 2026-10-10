import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../api/types'
import { Spinner } from '../components/ui'
import { homePathFor, useAuth } from './useAuth'

/** Lets the nested pages render only for a logged-in user with an allowed role.
 * `loginPath` lets a route group (e.g. /admin) send a signed-out visitor to its
 * own login page instead of the general one. */
export function RequireAuth({ roles, loginPath = '/login' }: { roles?: UserRole[]; loginPath?: string }) {
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
    return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}
