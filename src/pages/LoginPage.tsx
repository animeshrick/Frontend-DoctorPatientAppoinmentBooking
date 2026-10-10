import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage, getErrorStatus } from '../api/client'
import { homePathFor, useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, inputClass } from '../components/ui'

const schema = z.object({
  phone: z.string().trim().min(1, 'Enter your phone number'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const roleParam = searchParams.get('role')
  const role = roleParam === 'USER' || roleParam === 'DOCTOR' ? roleParam : null
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: '', password: '' } })

  if (!loading && user) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const me = await login(values.phone, values.password)
      if (me.role === 'ADMIN') {
        logout()
        setServerError('Admin accounts sign in at the admin login page, not here.')
        return
      }
      const from = (location.state as { from?: string } | null)?.from
      // Only go back to the earlier page if it belongs to this user's role.
      const rolePrefix = me.role === 'USER' ? '/patient' : '/doctor'
      const target = from && from.startsWith(rolePrefix) ? from : homePathFor(me.role)
      navigate(target, { replace: true })
    } catch (error) {
      // The backend answers 409 for a wrong phone number or password.
      setServerError(
        getErrorStatus(error) === 409 ? 'Incorrect phone number or password.' : getErrorMessage(error),
      )
    }
  }

  const heading = role === 'USER' ? 'Patient login' : role === 'DOCTOR' ? 'Doctor login' : 'Log in'
  const registerHref = role ? `/register?role=${role}` : '/register'

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400">
          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path d="M12 15 7 10l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <h1 className="text-xl font-semibold">{heading}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Doctor Patient Appointment Booking</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
          {serverError && <Alert kind="error">{serverError}</Alert>}
          <Field label="Phone number" error={errors.phone?.message}>
            <input className={inputClass} type="tel" autoComplete="tel" {...register('phone')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input className={inputClass} type="password" autoComplete="current-password" {...register('password')} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          No account yet?{' '}
          <Link to={registerHref} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
            Register
          </Link>
        </p>
      </Card>
    </div>
  )
}
