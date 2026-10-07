import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { getErrorMessage } from '../../api/client'
import { deleteDoctorImage, getMyDoctorProfile, saveDoctorProfile, uploadDoctorImage } from '../../api/doctors'
import type { DoctorProfile, DoctorProfileRequest, DoctorProfileStatus } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'

const STATUS_TONES: Record<DoctorProfileStatus, 'green' | 'red' | 'gray' | 'amber'> = {
  APPROVED: 'green',
  PENDING_REVIEW: 'amber',
  DRAFT: 'gray',
  REJECTED: 'red',
  SUSPENDED: 'red',
}

// Limits match the backend's database columns.
const schema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(50, 'At most 50 characters'),
  email: z.email('Enter a valid email address'),
  dob: z.string().min(1, 'Select your date of birth'),
  registration_number: z.string().trim().max(50, 'At most 50 characters'),
  license_authority: z.string().trim().max(50, 'At most 50 characters'),
  license_expiry_date: z.string(),
  years_of_experience: z.string().trim().regex(/^([0-9]{1,2})?$/, 'Enter a whole number from 0 to 99'),
  specialization: z.string().trim().max(100, 'At most 100 characters'),
  bio: z.string().trim().max(2000, 'At most 2000 characters'),
  consultation_fee: z
    .string()
    .trim()
    .regex(/^([0-9]{1,8}(\.[0-9]{1,2})?)?$/, 'Enter an amount such as 500 or 499.50'),
  is_accepting_appointments: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function toRequest(values: FormValues): DoctorProfileRequest {
  const text = (value: string) => (value === '' ? null : value)
  return {
    full_name: values.full_name,
    email: values.email,
    dob: values.dob,
    registration_number: text(values.registration_number),
    license_authority: text(values.license_authority),
    license_expiry_date: text(values.license_expiry_date),
    years_of_experience: values.years_of_experience === '' ? null : Number(values.years_of_experience),
    specialization: text(values.specialization),
    bio: text(values.bio),
    consultation_fee: text(values.consultation_fee),
    is_accepting_appointments: values.is_accepting_appointments,
  }
}

export default function DoctorProfilePage() {
  const profileQuery = useQuery({ queryKey: ['doctor-profile'], queryFn: getMyDoctorProfile })

  return (
    <>
      <PageHeader title="My profile" subtitle="Patients see your name, specialization, experience, fee and bio." />
      {profileQuery.isPending && <Spinner />}
      {profileQuery.isError && <Alert kind="error">{getErrorMessage(profileQuery.error)}</Alert>}
      {profileQuery.isSuccess && (
        <ProfileForm profile={profileQuery.data} />
      )}
    </>
  )
}

function ProfileForm({ profile }: { profile: DoctorProfile | null }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? user?.full_name ?? '',
      email: profile?.email ?? user?.email ?? '',
      dob: profile?.dob ?? user?.dob ?? '',
      registration_number: profile?.registration_number ?? '',
      license_authority: profile?.license_authority ?? '',
      license_expiry_date: profile?.license_expiry_date ?? '',
      years_of_experience: profile?.years_of_experience != null ? String(profile.years_of_experience) : '',
      specialization: profile?.specialization ?? '',
      bio: profile?.bio ?? '',
      consultation_fee: profile?.consultation_fee != null ? String(profile.consultation_fee) : '',
      is_accepting_appointments: profile?.is_accepting_appointments ?? true,
    },
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => saveDoctorProfile(toRequest(values)),
    onMutate: () => setSaved(false),
    onSuccess: (data) => {
      queryClient.setQueryData(['doctor-profile'], data)
      setSaved(true)
    },
  })

  const imageOptions = {
    onMutate: () => setImageError(null),
    onSuccess: refresh,
    onError: (error: unknown) => setImageError(getErrorMessage(error)),
  }
  const uploadMutation = useMutation({ mutationFn: uploadDoctorImage, ...imageOptions })
  const deleteImageMutation = useMutation({ mutationFn: deleteDoctorImage, ...imageOptions })
  const imageBusy = uploadMutation.isPending || deleteImageMutation.isPending

  return (
    <div className="space-y-6">
      {profile === null ? (
        <Alert kind="info">
          You have not created your doctor profile yet. Fill in the form and save it so patients can book with you.
        </Alert>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-slate-500">Your doctor ID:</span>{' '}
              <span className="text-base font-semibold">{profile.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              <Badge tone={STATUS_TONES[profile.status] ?? 'gray'}>{profile.status.replace('_', ' ')}</Badge>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Share your doctor ID with patients. They need it to find you and book an appointment.
          </p>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4" noValidate>
          {saveMutation.isError && <Alert kind="error">{getErrorMessage(saveMutation.error)}</Alert>}
          {saved && <Alert kind="success">Profile saved.</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.full_name?.message}>
              <input className={inputClass} {...register('full_name')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input className={inputClass} type="email" {...register('email')} />
            </Field>
            <Field label="Date of birth" error={errors.dob?.message}>
              <input className={inputClass} type="date" {...register('dob')} />
            </Field>
            <Field label="Specialization" error={errors.specialization?.message}>
              <input className={inputClass} placeholder="e.g. Cardiology" {...register('specialization')} />
            </Field>
            <Field label="Years of experience" error={errors.years_of_experience?.message}>
              <input className={inputClass} inputMode="numeric" maxLength={2} {...register('years_of_experience')} />
            </Field>
            <Field label="Consultation fee (Rs)" error={errors.consultation_fee?.message}>
              <input className={inputClass} inputMode="decimal" {...register('consultation_fee')} />
            </Field>
            <Field label="Registration number" error={errors.registration_number?.message}>
              <input className={inputClass} {...register('registration_number')} />
            </Field>
            <Field label="License authority" error={errors.license_authority?.message}>
              <input className={inputClass} {...register('license_authority')} />
            </Field>
            <Field label="License expiry date" error={errors.license_expiry_date?.message}>
              <input className={inputClass} type="date" {...register('license_expiry_date')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio" error={errors.bio?.message}>
                <textarea className={inputClass} rows={4} {...register('bio')} />
              </Field>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_accepting_appointments')} /> I am accepting appointments
          </label>

          <Button type="submit" loading={saveMutation.isPending}>
            {profile === null ? 'Create profile' : 'Save changes'}
          </Button>
        </form>
      </Card>

      {profile !== null && (
        <Card>
          <h2 className="text-base font-semibold">Profile photo</h2>
          <p className="mt-1 text-sm text-slate-600">
            {profile.image ? 'A photo is uploaded.' : 'No photo uploaded.'} Allowed: JPG, PNG or WEBP, up to 5 MB.
          </p>
          {imageError && (
            <div className="mt-3">
              <Alert kind="error">{imageError}</Alert>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <label
              className={
                'inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 ' +
                'text-sm font-medium text-slate-700 hover:bg-slate-100 ' +
                (imageBusy ? 'pointer-events-none opacity-60' : '')
              }
            >
              {uploadMutation.isPending ? 'Uploading...' : profile.image ? 'Replace photo' : 'Upload photo'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
            </label>
            {profile.image && (
              <Button variant="secondary" disabled={imageBusy} onClick={() => deleteImageMutation.mutate()}>
                Remove photo
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
