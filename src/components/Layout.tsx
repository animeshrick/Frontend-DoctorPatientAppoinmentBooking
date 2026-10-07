import { useAuth } from '../auth/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { Button, Divider } from './ui'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.includes(path)

  const getNavItems = () => {
    if (!user) return []

    const commonItems = [
      { path: 'account', label: 'Account', icon: '⚙️' },
    ]

    const roleItems = {
      USER: [
        { path: 'find-doctor', label: 'Find Doctor', icon: '🔍' },
        { path: '/', label: 'Home', icon: '🏠' },
      ],
      DOCTOR: [
        { path: 'profile', label: 'Profile', icon: '👤' },
        { path: 'appointments', label: 'My Appointments', icon: '📅' },
        { path: '/', label: 'Home', icon: '🏠' },
      ],
      ADMIN: [
        { path: '/', label: 'Home', icon: '🏠' },
      ],
    }

    return [...(roleItems[user.role] || []), ...commonItems]
  }

  const navItems = getNavItems()
  const baseRoute = user?.role === 'DOCTOR' ? '/doctor' : user?.role === 'ADMIN' ? '/admin' : '/patient'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Doctor Appointment Booking</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {user.full_name || user.phone}
              </span>
              <Button variant="secondary" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        {user && (
          <aside className="w-64 border-r border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={`${baseRoute}${item.path === '/' ? '' : '/' + item.path}`}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-teal-100 text-teal-900 dark:bg-teal-900/30 dark:text-teal-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  )
}
