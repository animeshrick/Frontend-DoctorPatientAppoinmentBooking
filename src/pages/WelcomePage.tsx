import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Public landing page shown at "/" to anyone who isn't signed in yet. Lets the
 * visitor declare who they are up front so the rest of the flow (login/register)
 * can be tailored to that role instead of showing one generic form. */
export default function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-teal-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-200/50 blur-3xl dark:bg-teal-900/30" />
        <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-900/20" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-14 sm:py-20">
        {/* Hero */}
        <div className="flex max-w-2xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Doctor Patient Appointment Booking
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Care, booked the <span className="text-teal-600 dark:text-teal-400">simple</span> way
          </h1>
          <p className="mt-4 text-balance text-base text-slate-600 sm:text-lg dark:text-slate-400">
            Find the right doctor and book an appointment in minutes, or manage your practice and
            patients in one place. Tell us who you are to get started.
          </p>
        </div>

        {/* Entry points */}
        <div className="mt-12 grid w-full gap-6 sm:grid-cols-2">
          <RoleCard
            role="USER"
            title="I'm a Patient"
            description="Search doctors, book appointments for yourself or your family, and keep track of every visit."
            bullets={['Book & reschedule appointments', 'Manage profiles for your whole family', 'See your visit history anytime']}
            icon={<PatientIcon />}
            accent="teal"
          />
          <RoleCard
            role="DOCTOR"
            title="I'm a Doctor"
            description="Set up your profile, manage availability, and keep on top of every appointment."
            bullets={['Build your public profile', 'Set your availability & holidays', 'Manage appointments in one view']}
            icon={<DoctorIcon />}
            accent="sky"
          />
        </div>

        <p className="mt-10 text-sm text-slate-500 dark:text-slate-500">
          Already chose a side?{' '}
          <Link to="/login" className="font-medium text-teal-700 hover:underline dark:text-teal-400">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  )
}

type Accent = 'teal' | 'sky'

const accentClasses: Record<Accent, { ring: string; iconBg: string; iconText: string; cta: string; ctaHover: string }> = {
  teal: {
    ring: 'hover:ring-teal-300 dark:hover:ring-teal-700',
    iconBg: 'bg-teal-100 dark:bg-teal-900/50',
    iconText: 'text-teal-700 dark:text-teal-300',
    cta: 'bg-teal-600 dark:bg-teal-600',
    ctaHover: 'hover:bg-teal-700 dark:hover:bg-teal-500',
  },
  sky: {
    ring: 'hover:ring-sky-300 dark:hover:ring-sky-700',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
    iconText: 'text-sky-700 dark:text-sky-300',
    cta: 'bg-sky-600 dark:bg-sky-600',
    ctaHover: 'hover:bg-sky-700 dark:hover:bg-sky-500',
  },
}

function RoleCard({
  role,
  title,
  description,
  bullets,
  icon,
  accent,
}: {
  role: 'USER' | 'DOCTOR'
  title: string
  description: string
  bullets: string[]
  icon: ReactNode
  accent: Accent
}) {
  const tone = accentClasses[accent]
  return (
    <div
      className={
        'group flex flex-col rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm ring-1 ring-transparent ' +
        'backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/80 ' +
        tone.ring
      }
    >
      <div className={'flex h-12 w-12 items-center justify-center rounded-xl ' + tone.iconBg + ' ' + tone.iconText}>
        {icon}
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{description}</p>

      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <svg viewBox="0 0 20 20" fill="none" className={'mt-0.5 h-4 w-4 flex-shrink-0 ' + tone.iconText}>
              <path
                d="M4 10.5 8 14.5 16 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3">
        <Link
          to={`/register?role=${role}`}
          className={
            'flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors ' +
            tone.cta + ' ' + tone.ctaHover
          }
        >
          Sign up
        </Link>
        <Link
          to={`/login?role=${role}`}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}

function PatientIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M12 21s-7.5-4.6-10-9.1C.5 8.3 2.3 5 5.6 5c1.9 0 3.3 1 4.4 2.4C11.1 6 12.5 5 14.4 5 17.7 5 19.5 8.3 22 11.9 19.5 16.4 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7 12h2.3l1.4-2.6 1.8 4.6 1.3-2h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DoctorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M9 3v3.5a3 3 0 0 0 6 0V3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6 3v5.5a6 6 0 0 0 12 0V3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 14.5v2.3a3.7 3.7 0 1 0 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="18.3" cy="19" r="1.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}
