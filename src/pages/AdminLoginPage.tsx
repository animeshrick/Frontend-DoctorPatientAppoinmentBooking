import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage, getErrorStatus } from '../api/client'
import { homePathFor, useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, inputClass } from '../components/ui'

const schema = z.object({
  phone: z.string().trim().min(1, 'Enter your phone number'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

/** Separate login page for admin accounts, kept apart from the patient/doctor login. */
export default function AdminLoginPage() {
  const { user, loading, adminLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: '', password: '' } })

  // Already signed in: send admins to the admin area, and send anyone else
  // back to their own home page rather than letting them sit on this screen.
  if (!loading && user) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      // /auth/admin/login itself rejects non-admin credentials (403), so there is
      // no need to check the role client-side after signing in.
      await adminLogin(values.phone, values.password)
      const from = (location.state as { from?: string } | null)?.from
      const target = from && from.startsWith('/admin') ? from : '/admin/dashboard'
      navigate(target, { replace: true })
    } catch (error) {
      const status = getErrorStatus(error)
      if (status === 409) {
        setServerError('Incorrect phone number or password.')
      } else if (status === 403) {
        setServerError('This login is for admin accounts only. Use the regular login page instead.')
      } else {
        setServerError(getErrorMessage(error))
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-slate-600">Doctor Patient Appointment Booking — admin portal</p>

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
      </Card>
    </div>
  )
}
