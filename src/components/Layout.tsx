import type { ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import { Link, Outlet, useLocation } from 'react-router-dom'
import ChatAssistant from './ChatAssistant'

type IconKey =
  | 'home' | 'calendar' | 'search' | 'users' | 'settings' | 'user'
  | 'clock' | 'sun' | 'chart' | 'steth' | 'trash' | 'logout'

const ICONS: Record<IconKey, ReactNode> = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  users: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /><path d="M16 3.1a4 4 0 0 1 0 7.8M22 21v-2a4 4 0 0 0-3-3.9" /></>,
  settings: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
  steth: <><path d="M11 2v2M5 2v2" /><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" /><path d="M8 15a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" /></>,
}

function Icon({ name }: { name: IconKey }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

const SHORT: Record<string, string> = {
  'My Appointments': 'Visits',
  'Find Doctor': 'Find',
  'Patient Profiles': 'Profiles',
  Appointments: 'Visits',
  Availability: 'Hours',
  'Deletion Requests': 'Requests',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'U'
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname === href || location.pathname.startsWith(href + '/')

  const getNavItems = (): { path: string; label: string; icon: IconKey }[] => {
    if (!user) return []

    const commonItems: { path: string; label: string; icon: IconKey }[] = [
      { path: 'account', label: 'Account', icon: 'settings' },
    ]

    const roleItems: Record<string, { path: string; label: string; icon: IconKey }[]> = {
      USER: [
        { path: 'appointments', label: 'My Appointments', icon: 'calendar' },
        { path: 'find-doctor', label: 'Find Doctor', icon: 'search' },
        { path: 'profiles', label: 'Patient Profiles', icon: 'users' },
      ],
      DOCTOR: [
        { path: 'profile', label: 'Profile', icon: 'user' },
        { path: 'appointments', label: 'My Appointments', icon: 'calendar' },
        { path: 'availability', label: 'Availability', icon: 'clock' },
        { path: 'holidays', label: 'Holidays', icon: 'sun' },
      ],
      ADMIN: [
        { path: 'dashboard', label: 'Dashboard', icon: 'chart' },
        { path: 'users', label: 'Users', icon: 'users' },
        { path: 'patients', label: 'Patients', icon: 'user' },
        { path: 'doctors', label: 'Doctors', icon: 'steth' },
        { path: 'appointments', label: 'Appointments', icon: 'calendar' },
        { path: 'deletion-requests', label: 'Deletion Requests', icon: 'trash' },
      ],
    }

    return [...(roleItems[user.role] || []), ...commonItems]
  }

  const navItems = getNavItems()
  const baseRoute = user?.role === 'DOCTOR' ? '/doctor' : user?.role === 'ADMIN' ? '/admin' : '/patient'
  const displayName = user?.full_name || user?.phone || ''
  const roleLabel = user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Admin' : 'Patient'

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#06100C] text-[#E6FFF1]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-72 h-[900px] w-[900px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,240,92,0.12) 0%, rgba(31,157,99,0.07) 38%, rgba(6,16,12,0) 68%)' }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#B8F05C]/15 bg-[#0A1812]/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to={user ? baseRoute : '/'} className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 40 40" role="img" aria-label="Daktar Dada logo">
              <circle cx="20" cy="20" r="19" fill="none" stroke="#B8F05C" strokeWidth="2" />
              <path d="M20 9c6 2 9 7 8 13-5 1-10-1-12-6-1-3 1-6 4-7z" fill="#B8F05C" />
              <path d="M14 25h12" stroke="#B8F05C" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            </svg>
            <span className="font-display text-lg font-bold tracking-tight sm:text-xl">Daktar Dada</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-[#B8F05C] text-sm font-bold text-[#06100C] sm:h-10 sm:w-10">
                  {initials(displayName)}
                </div>
                <div className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-[180px] truncate text-sm font-medium">{displayName}</span>
                  <span className="font-mono-tech text-[11px] font-bold uppercase tracking-[0.12em] text-[#B8F05C]">{roleLabel}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Logout"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6FFF1]/25 px-3 text-sm font-medium transition hover:bg-[#E6FFF1]/10 sm:px-4"
              >
                <Icon name="logout" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col md:flex-row">
        {/* Navigation: side rail on desktop */}
        {user && (
          <aside className="hidden border-r border-[#B8F05C]/15 bg-[#0A1812]/60 p-5 md:block md:w-64 md:flex-shrink-0">
            <nav aria-label="Main" className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const href = `${baseRoute}${item.path === '/' ? '' : '/' + item.path}`
                const active = isActive(item.path === '/' ? '/' : href)
                return (
                  <Link
                    key={item.path}
                    to={href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      'flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ' +
                      (active
                        ? 'bg-[#B8F05C]/12 text-[#B8F05C] shadow-[inset_3px_0_0_#B8F05C]'
                        : 'text-[#B7D3C4] hover:bg-[#E6FFF1]/8 hover:text-[#E6FFF1]')
                    }
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-10 md:pt-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-[#B8F05C]/20 bg-[#0A1812]/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur md:hidden"
        >
          {navItems.map((item) => {
            const href = `${baseRoute}${item.path === '/' ? '' : '/' + item.path}`
            const active = isActive(item.path === '/' ? '/' : href)
            return (
              <Link
                key={item.path}
                to={href}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex min-h-14 min-w-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition ' +
                  (active ? 'text-[#B8F05C]' : 'text-[#9DBFAE]')
                }
              >
                <span className={'flex h-7 w-12 items-center justify-center rounded-full transition ' + (active ? 'bg-[#B8F05C]/15' : '')}>
                  <Icon name={item.icon} />
                </span>
                {SHORT[item.label] ?? item.label}
              </Link>
            )
          })}
        </nav>
      )}

      <ChatAssistant />
    </div>
  )
}
