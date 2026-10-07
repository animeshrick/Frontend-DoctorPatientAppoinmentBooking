import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { UserRole } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { Button } from './ui'

const NAV_LINKS: Record<UserRole, { to: string; label: string }[]> = {
  USER: [
    { to: '/patient/appointments', label: 'My appointments' },
    { to: '/patient/book', label: 'Book' },
    { to: '/patient/doctors', label: 'Find doctor' },
    { to: '/patient/profiles', label: 'Family profiles' },
    { to: '/account', label: 'Account' },
  ],
  DOCTOR: [
    { to: '/doctor/profile', label: 'My profile' },
    { to: '/doctor/availability', label: 'Availability' },
    { to: '/doctor/holidays', label: 'Holidays' },
    { to: '/account', label: 'Account' },
  ],
  ADMIN: [{ to: '/account', label: 'Account' }],
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-base font-semibold text-teal-800">Appointment Booking</span>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV_LINKS[user.role].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  'rounded-md px-3 py-1.5 text-sm font-medium ' +
                  (isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.full_name || user.phone}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
