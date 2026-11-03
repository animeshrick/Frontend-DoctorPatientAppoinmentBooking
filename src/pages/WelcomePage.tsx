import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const LIME = '#B8F05C'

/** Heights for the sample availability chart; lime bars are the "open" slots. */
const BARS = [34, 52, 70, 96, 110, 84, 60, 44, 76, 104, 118, 92, 66, 48, 58, 82, 100, 72, 54, 40, 62, 88, 50, 36]
const OPEN = new Set([3, 4, 9, 10, 11, 15, 16, 17, 21])

const tag = 'font-mono-tech text-[12px] font-bold tracking-[0.14em] uppercase'
const panel = 'rounded-[28px] border border-[#B8F05C]/20 bg-[#0E2018]/70 p-7 backdrop-blur'

/** Public landing page shown at "/" to anyone who isn't signed in yet. */
export default function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06100C] text-[#E6FFF1]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-56 h-[1100px] w-[1100px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(184,240,92,0.16) 0%, rgba(31,157,99,0.10) 35%, rgba(6,16,12,0) 68%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Nav */}
        <nav className="mx-auto mt-6 flex max-w-3xl items-center gap-4 rounded-full border border-[#B8F05C]/20 bg-[#0E2018]/75 py-2.5 pl-5 pr-2.5 backdrop-blur">
          <Link to="/" className="flex flex-1 items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-bold tracking-tight">Daktar Dada</span>
          </Link>
          <Link to="/login" className="hidden text-sm font-medium hover:text-[#B8F05C] sm:block">
            Log in
          </Link>
          <Link
            to="/register?role=USER"
            className="inline-flex min-h-11 items-center rounded-full bg-[#B8F05C] px-5 text-sm font-bold text-[#06100C] transition hover:brightness-110"
          >
            Get started
          </Link>
        </nav>

        {/* Hero */}
        <header className="flex flex-col items-center gap-7 pb-10 pt-16 text-center sm:pt-20">
          <span className={tag + ' rounded-full border border-[#B8F05C]/35 px-3.5 py-2 text-[#B8F05C]'}>
            Next-gen care / built on nature
          </span>
          <h1 className="font-display max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
            Healthcare, booked at the <span style={{ color: LIME }}>speed of thought.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[#9DBFAE] sm:text-xl">
            Tell Compounder what you need. It finds the right doctor, checks who is free, and books the slot while you
            sip your tea.
          </p>

          <Orb />

          <Link
            to="/register?role=USER"
            className="flex w-full max-w-2xl items-center gap-3 rounded-[22px] border border-[#B8F05C]/35 bg-[#0E2018]/80 py-2.5 pl-6 pr-2.5 text-left transition hover:border-[#B8F05C]/70"
          >
            <span className="flex-1 truncate text-base text-[#E6FFF1] sm:text-lg">
              Who is free on 2 Dec for a heart check-up?
            </span>
            <span className="inline-flex min-h-12 items-center rounded-2xl bg-[#B8F05C] px-6 text-base font-bold text-[#06100C]">
              Ask
            </span>
          </Link>
          <p className="text-sm text-[#8FB3A2]">Sign up as a patient to chat with Compounder.</p>
        </header>

        {/* Bento */}
        <section aria-label="Highlights" className="grid gap-4 py-12 sm:grid-cols-6">
          <div className={panel + ' flex flex-col gap-5 sm:col-span-4'}>
            <div className="flex items-center gap-3">
              <span className={tag} style={{ color: LIME }}>Live availability</span>
              <span className="h-2 w-2 rounded-full" style={{ background: LIME }} />
            </div>
            <p className="font-display text-3xl font-bold leading-tight tracking-tight">
              See open slots across every doctor, in real time.
            </p>
            <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Sample chart of open appointment slots">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-md"
                  style={{ height: h, background: OPEN.has(i) ? LIME : '#1D4A39' }}
                />
              ))}
            </div>
            <div className="font-mono-tech flex justify-between text-xs text-[#8FB3A2]">
              <span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-[28px] p-7 text-[#06100C] sm:col-span-2" style={{ background: LIME }}>
            <span className={tag}>One-tap booking</span>
            <p className="font-display text-3xl font-bold leading-[1.05] tracking-tight">Confirmed in under a minute.</p>
            <p className="text-base">No calls. No waiting on hold.</p>
          </div>

          <div className={panel + ' flex flex-col gap-4 sm:col-span-2'}>
            <span className={tag} style={{ color: LIME }}>Health timeline</span>
            <svg viewBox="0 0 260 90" className="h-[90px] w-full" role="img" aria-label="Sample trend line">
              <path d="M0 70 L40 58 L80 64 L120 38 L160 46 L200 22 L260 28" fill="none" stroke={LIME} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="200" cy="22" r="6" fill={LIME} />
            </svg>
            <p className="text-[17px] leading-normal text-[#C5E3D3]">Every visit and note in one calm place.</p>
          </div>

          <div className={panel + ' flex flex-col gap-4 sm:col-span-2'}>
            <span className={tag} style={{ color: LIME }}>Verified doctors</span>
            <div className="flex">
              {['bg-[#14523E]', 'bg-[#1F6B4F]', 'bg-[#B8F05C] !text-[#06100C]'].map((c, i) => (
                <div
                  key={c}
                  className={'flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#06100C] font-bold ' + c + (i ? ' -ml-3' : '')}
                >
                  {['AS', 'RM', 'SB'][i]}
                </div>
              ))}
            </div>
            <p className="text-[17px] leading-normal text-[#C5E3D3]">Profiles you can trust, with fees upfront.</p>
          </div>

          <div className={panel + ' flex flex-col gap-4 sm:col-span-2'}>
            <span className={tag} style={{ color: LIME }}>Remembers you</span>
            <div className="rounded-2xl rounded-bl-sm bg-[#B8F05C]/10 px-3.5 py-3 text-[15px]">Same doctor as last time?</div>
            <p className="text-[17px] leading-normal text-[#C5E3D3]">Compounder keeps your recent chats ready.</p>
          </div>
        </section>

        {/* Role entry points */}
        <section aria-labelledby="who" className="py-10">
          <h2 id="who" className="font-display mb-8 text-center text-4xl font-bold tracking-tight sm:text-5xl">
            Who are you?
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <RoleCard
              role="USER"
              title="I'm a Patient"
              description="Search doctors, book for yourself or your family, and keep track of every visit."
              bullets={['Book & reschedule appointments', 'Manage profiles for your whole family', 'Chat with Compounder anytime']}
              icon={<PatientIcon />}
              primary
            />
            <RoleCard
              role="DOCTOR"
              title="I'm a Doctor"
              description="Set up your profile, manage availability, and keep on top of every appointment."
              bullets={['Build your public profile', 'Set your availability & holidays', 'Manage appointments in one view']}
              icon={<DoctorIcon />}
            />
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-[#B8F05C]/15 py-6 text-sm text-[#8FB3A2]">
          <span className="flex-1 font-bold text-[#E6FFF1]">Daktar Dada</span>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </footer>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" role="img" aria-label="Daktar Dada logo">
      <circle cx="20" cy="20" r="19" fill="none" stroke={LIME} strokeWidth="2" />
      <path d="M20 9c6 2 9 7 8 13-5 1-10-1-12-6-1-3 1-6 4-7z" fill={LIME} />
      <path d="M14 25h12" stroke={LIME} strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Orb() {
  return (
    <div className="relative mt-2 h-[300px] w-[300px] sm:h-[360px] sm:w-[360px]" aria-hidden="true">
      <svg viewBox="0 0 360 360" className="ring-spin absolute inset-0 h-full w-full">
        <circle cx="180" cy="180" r="172" fill="none" stroke="rgba(184,240,92,0.30)" strokeWidth="1" strokeDasharray="3 9" />
        <circle cx="180" cy="180" r="140" fill="none" stroke="rgba(126,224,168,0.25)" strokeWidth="1" />
        <circle cx="180" cy="8" r="6" fill={LIME} />
        <circle cx="320" cy="180" r="4" fill="#7EE0A8" />
      </svg>
      <div
        className="orb-pulse absolute inset-[19%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 34% 30%, #E9FFB8 0%, #B8F05C 22%, #1F9D63 62%, #0A3A29 100%)',
          boxShadow: '0 0 120px rgba(184,240,92,0.45), inset 0 0 40px rgba(6,16,12,0.5)',
        }}
      />
      <svg viewBox="0 0 24 24" fill="none" stroke="#06100C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2">
        <rect x="4" y="8" width="16" height="11" rx="3" />
        <path d="M12 8V4M9 13h.01M15 13h.01" />
      </svg>
    </div>
  )
}

function RoleCard({
  role,
  title,
  description,
  bullets,
  icon,
  primary = false,
}: {
  role: 'USER' | 'DOCTOR'
  title: string
  description: string
  bullets: string[]
  icon: ReactNode
  primary?: boolean
}) {
  return (
    <div className={panel + ' group flex flex-col transition duration-200 hover:-translate-y-1 hover:border-[#B8F05C]/60'}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B8F05C]/12 text-[#B8F05C]">{icon}</div>
      <h3 className="font-display mt-4 text-2xl font-bold">{title}</h3>
      <p className="mt-1.5 text-[15px] text-[#9DBFAE]">{description}</p>
      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[15px] text-[#C5E3D3]">
            <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B8F05C]" aria-hidden="true">
              <path d="M4 10.5 8 14.5 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex gap-3">
        <Link
          to={`/register?role=${role}`}
          className={
            'inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-bold transition hover:brightness-110 ' +
            (primary ? 'bg-[#B8F05C] text-[#06100C]' : 'border border-[#B8F05C]/60 text-[#B8F05C]')
          }
        >
          Sign up
        </Link>
        <Link
          to={`/login?role=${role}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#E6FFF1]/25 px-4 text-sm font-medium transition hover:bg-[#E6FFF1]/10"
        >
          Log in
        </Link>
      </div>
    </div>
  )
}

function PatientIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.1C.5 8.3 2.3 5 5.6 5c1.9 0 3.3 1 4.4 2.4C11.1 6 12.5 5 14.4 5 17.7 5 19.5 8.3 22 11.9 19.5 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7 12h2.3l1.4-2.6 1.8 4.6 1.3-2h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DoctorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path d="M9 3v3.5a3 3 0 0 0 6 0V3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 3v5.5a6 6 0 0 0 12 0V3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 14.5v2.3a3.7 3.7 0 1 0 3.7 3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18.3" cy="19" r="1.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}
