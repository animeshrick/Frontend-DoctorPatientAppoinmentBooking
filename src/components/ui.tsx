import { cloneElement, useId } from 'react'
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

export const inputClass =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm ' +
  'placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 ' +
  'disabled:bg-slate-100 disabled:text-slate-500'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={
        'inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition-colors ' +
        'disabled:cursor-not-allowed disabled:opacity-60 ' +
        buttonVariants[variant] +
        ' ' +
        className
      }
      {...rest}
    >
      {loading ? 'Please wait...' : children}
    </button>
  )
}

/**
 * A labelled form control. Pass exactly one <input>, <select> or <textarea> as the child;
 * the label is linked to it automatically.
 */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactElement<{ id?: string }>
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {cloneElement(children, { id })}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'rounded-lg border border-slate-200 bg-white p-5 shadow-sm ' + className}>{children}</div>
}

type AlertKind = 'error' | 'success' | 'info' | 'warning'

const alertKinds: Record<AlertKind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

export function Alert({ kind = 'info', children }: { kind?: AlertKind; children: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={'rounded-md border px-4 py-3 text-sm ' + alertKinds[kind]}>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
      Loading...
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type BadgeTone = 'green' | 'red' | 'gray' | 'amber' | 'blue'

const badgeTones: Record<BadgeTone, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
}

export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ' + badgeTones[tone]}>
      {children}
    </span>
  )
}
