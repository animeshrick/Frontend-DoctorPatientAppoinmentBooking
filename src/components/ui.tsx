import { cloneElement, useId } from 'react'
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

// Enhanced input styles with better colors and focus states
export const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm ' +
  'placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-0 ' +
  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ' +
  'dark:focus:border-teal-400 dark:focus:ring-teal-400 ' +
  'disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 ' +
  'transition-all duration-200'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600',
  outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-slate-800',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ' +
        'disabled:cursor-not-allowed disabled:opacity-60 ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ' +
        sizeClasses[size] + ' ' +
        buttonVariants[variant] + ' ' +
        className
      }
      {...rest}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Please wait...
        </>
      ) : (
        children
      )}
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
  required,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactElement<{ id?: string }>
  required?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-600 dark:text-red-400">*</span>}
      </label>
      {cloneElement(children, { id })}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function Card({ children, className = '', noPadding = false }: { children: ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <div
      className={
        'rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 ' +
        (noPadding ? '' : 'p-6 ') +
        'shadow-sm dark:shadow-lg ' +
        className
      }
    >
      {children}
    </div>
  )
}

type AlertKind = 'error' | 'success' | 'info' | 'warning'

const alertKinds: Record<AlertKind, string> = {
  error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  info: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

export function Alert({ kind = 'info', children }: { kind?: AlertKind; children: ReactNode }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={'rounded-lg border px-4 py-3 text-sm ' + alertKinds[kind]}>
      {children}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-600 dark:border-t-teal-400" />
      Loading...
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  )
}

type BadgeTone = 'green' | 'red' | 'gray' | 'amber' | 'blue' | 'purple' | 'cyan'

const badgeTones: Record<BadgeTone, string> = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  gray: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  blue: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
}

export function Badge({ tone = 'gray', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ' + badgeTones[tone] + ' ' + className}>
      {children}
    </span>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-600 dark:bg-slate-800/50">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Divider() {
  return <div className="border-t border-slate-200 dark:border-slate-700" />
}

export function SkeletonLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      ))}
    </div>
  )
}
