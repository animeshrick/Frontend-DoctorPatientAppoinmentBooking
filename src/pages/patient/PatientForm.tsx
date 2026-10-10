import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../api/client'
import { createPatientProfile, updatePatientProfile } from '../../api/patients'
import type { PatientCreateRequest, PatientFields, PatientProfile, User } from '../../api/types'
import { Alert, Button, Field, inputClass } from '../../components/ui'
import { ageFromDob } from '../../lib/dates'
import { GENDERS, LANGUAGES, RELATIONSHIPS } from '../../lib/labels'

// Limits match the backend's PatientProfileFields schema.
const schema = z.object({
  relation_type: z.enum(['self', 'mother', 'father', 'spouse', 'child', 'other']),
  relation_name: z.string().trim().max(100, 'At most 100 characters'),
  age: z.string().trim().regex(/^([0-9]{1,2})?$/, 'Age must be a number from 0 to 99'),
  gender: z.enum(['', 'male', 'female', 'other']),
  address: z.string().trim().max(255, 'At most 255 characters'),
  city: z.string().trim().max(100, 'At most 100 characters'),
  state: z.string().trim().max(100, 'At most 100 characters'),
  pincode: z.string().trim().max(20, 'At most 20 characters'),
  emergency_contact_name: z.string().trim().max(255, 'At most 255 characters'),
  emergency_contact_phone: z.string().trim().max(20, 'At most 20 characters'),
  preferred_language: z.enum(['en', 'hi', 'bn']),
  notification_preference_email: z.boolean(),
  notification_preference_sms: z.boolean(),
  is_primary: z.boolean(),
})
type FormValues = z.infer<typeof schema>

/** On a brand-new "Self" profile there's no patient data yet to default from,
 * so prefill name/age straight from the signed-in account instead of leaving
 * them blank - the useEffect below keeps this in sync if relation is changed
 * after the form is already open. */
function toDefaults(patient: PatientProfile | undefined, user: User | null): FormValues {
  const prefillFromAccount = !patient
  const accountAge = prefillFromAccount ? ageFromDob(user?.dob) : null
  return {
    relation_type: patient?.relation_type ?? 'self',
    relation_name: patient?.relation_name ?? (prefillFromAccount ? user?.full_name ?? '' : ''),
    age: patient?.age ?? (accountAge !== null ? String(accountAge) : ''),
    gender: patient?.gender ?? '',
    address: patient?.address ?? '',
    city: patient?.city ?? '',
    state: patient?.state ?? '',
    pincode: patient?.pincode ?? '',
    emergency_contact_name: patient?.emergency_contact_name ?? '',
    emergency_contact_phone: patient?.emergency_contact_phone ?? '',
    preferred_language: patient?.preferred_language ?? 'en',
    notification_preference_email: patient?.notification_preference_email ?? true,
    notification_preference_sms: patient?.notification_preference_sms ?? true,
    is_primary: patient?.is_primary ?? false,
  }
}

/** Optional text fields: an empty box is sent as null. */
function optionalFields(values: FormValues): Required<PatientFields> {
  const text = (value: string) => (value === '' ? null : value)
  return {
    relation_name: text(values.relation_name),
    age: text(values.age),
    gender: values.gender === '' ? null : values.gender,
    address: text(values.address),
    city: text(values.city),
    state: text(values.state),
    pincode: text(values.pincode),
    emergency_contact_name: text(values.emergency_contact_name),
    emergency_contact_phone: text(values.emergency_contact_phone),
  }
}

interface Props {
  /** Pass a profile to edit it; leave empty to create a new one. */
  patient?: PatientProfile
  /** True when the account has no profile yet (the first one is always primary). */
  isFirstProfile?: boolean
  onDone: () => void
  onCancel: () => void
}

export function PatientForm({ patient, isFirstProfile = false, onDone, onCancel }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = patient !== undefined
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(patient, user) })
  const isSelf = watch('relation_type') === 'self'
  // "Self" always means the account holder, so on a new profile their name and
  // age come straight from the account instead of being typed twice.
  const lockNameAndAge = isSelf && !isEdit

  useEffect(() => {
    if (!lockNameAndAge || !user) return
    setValue('relation_name', user.full_name, { shouldValidate: true })
    const age = ageFromDob(user.dob)
    if (age !== null) setValue('age', String(age), { shouldValidate: true })
  }, [lockNameAndAge, user, setValue])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const shared = {
        relation_type: values.relation_type,
        preferred_language: values.preferred_language,
        notification_preference_email: values.notification_preference_email,
        notification_preference_sms: values.notification_preference_sms,
      }
      if (isEdit) {
        // is_primary is not part of the update endpoint (use "Set as primary").
        return updatePatientProfile(patient.id, { ...optionalFields(values), ...shared })
      }
      // On create, leave out the empty optional fields.
      const filled = Object.fromEntries(
        Object.entries(optionalFields(values)).filter(([, value]) => value !== null),
      ) as PatientFields
      const body: PatientCreateRequest = { ...filled, ...shared, is_primary: values.is_primary }
      return createPatientProfile(body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patient-profiles'] })
      onDone()
    },
  })

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Relation"
          error={errors.relation_type?.message}
          hint="Only one profile can be 'Self'."
        >
          <select className={inputClass} {...register('relation_type')}>
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Name"
          error={errors.relation_name?.message}
          hint={lockNameAndAge ? 'Taken from your account.' : 'Name of the person this profile is for.'}
        >
          <input className={inputClass} disabled={lockNameAndAge} {...register('relation_name')} />
        </Field>
        <Field label="Age" error={errors.age?.message} hint={lockNameAndAge ? 'Taken from your date of birth.' : undefined}>
          <input className={inputClass} inputMode="numeric" maxLength={2} disabled={lockNameAndAge} {...register('age')} />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <select className={inputClass} {...register('gender')}>
            <option value="">Not specified</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" error={errors.address?.message}>
            <input className={inputClass} {...register('address')} />
          </Field>
        </div>
        <Field label="City" error={errors.city?.message}>
          <input className={inputClass} {...register('city')} />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <input className={inputClass} {...register('state')} />
        </Field>
        <Field label="Pincode" error={errors.pincode?.message}>
          <input className={inputClass} {...register('pincode')} />
        </Field>
        <Field label="Preferred language" error={errors.preferred_language?.message}>
          <select className={inputClass} {...register('preferred_language')}>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Emergency contact name" error={errors.emergency_contact_name?.message}>
          <input className={inputClass} {...register('emergency_contact_name')} />
        </Field>
        <Field label="Emergency contact phone" error={errors.emergency_contact_phone?.message}>
          <input className={inputClass} type="tel" {...register('emergency_contact_phone')} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('notification_preference_email')} /> Email notifications
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('notification_preference_sms')} /> SMS notifications
        </label>
        {!isEdit && !isFirstProfile && (
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_primary')} /> Make this the primary profile
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Create profile'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={mutation.isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
