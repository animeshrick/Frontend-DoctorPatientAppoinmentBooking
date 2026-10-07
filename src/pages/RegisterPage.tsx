import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage } from '../api/client'
import { homePathFor, useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, inputClass } from '../components/ui'
import { todayString } from '../lib/dates'

// Name, email and date of birth are optional in the backend's register schema, but the
// database needs name and date of birth, and the user-details response fails on an empty
// email, so all three are required here. The phone column holds at most 10 characters.
const schema = z.object({
  role: z.enum(['USER', 'DOCTOR']),
  full_name: z.string().trim().min(2, 'Enter your full name').max(50, 'At most 50 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Enter a 10-digit phone number (digits only)'),
  email: z.email('Enter a valid email address').max(255, 'Email is too long'),
  dob: z
    .string()
    .min(1, 'Select your date of birth')
    .refine((value) => value <= todayString(), 'Date of birth cannot be in the future'),
  password: z.string().min(6, 'Use at least 6 characters').max(72, 'Use at most 72 characters'),
})
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const { user, loading, register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'USER', full_name: '', phone: '', email: '', dob: '', password: '' },
  })

  if (!loading && user && !isSubmitting) {
    return <Navigate to={homePathFor(user.role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const me = await registerUser(values)
      // New patients need a patient profile before they can book.
      navigate(me.role === 'USER' ? '/patient/profiles' : homePathFor(me.role), { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold">Create an account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
          {serverError && <Alert kind="error">{serverError}</Alert>}

          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-slate-700">I am a</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" value="USER" {...register('role')} /> Patient
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="DOCTOR" {...register('role')} /> Doctor
              </label>
            </div>
          </fieldset>

          <Field label="Full name" error={errors.full_name?.message}>
            <input className={inputClass} autoComplete="name" {...register('full_name')} />
          </Field>
          <Field label="Phone number" error={errors.phone?.message} hint="You will log in with this number.">
            <input className={inputClass} type="tel" autoComplete="tel" maxLength={10} {...register('phone')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Date of birth" error={errors.dob?.message}>
            <input className={inputClass} type="date" max={todayString()} {...register('dob')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input className={inputClass} type="password" autoComplete="new-password" {...register('password')} />
          </Field>

          <Button type="submit" loading={isSubmitting} className="w-full">
            Register
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-teal-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  )
}
