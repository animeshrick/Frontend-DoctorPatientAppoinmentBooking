import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
      const from = (location.state as { from?: string } | null)?.from
      // Only go back to the earlier page if it belongs to this user's role.
      const rolePrefix = me.role === 'USER' ? '/patient' : me.role === 'DOCTOR' ? '/doctor' : '/account'
      const target = from && (from.startsWith(rolePrefix) || from.startsWith('/account')) ? from : homePathFor(me.role)
      navigate(target, { replace: true })
    } catch (error) {
      // The backend answers 409 for a wrong phone number or password.
      setServerError(
        getErrorStatus(error) === 409 ? 'Incorrect phone number or password.' : getErrorMessage(error),
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-slate-600">Doctor Patient Appointment Booking</p>

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

        <p className="mt-4 text-sm text-slate-600">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-teal-700 hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  )
}
