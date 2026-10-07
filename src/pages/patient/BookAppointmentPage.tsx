import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { bookAppointment } from '../../api/appointments'
import { getErrorMessage } from '../../api/client'
import { getPatientProfiles } from '../../api/patients'
import type { Appointment } from '../../api/types'
import { Alert, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { WEEK_DAYS, addDays, formatDate, todayString, weekdayIndex } from '../../lib/dates'
import { parseId } from '../../lib/ids'
import { CONSULTATION_TYPES, labelOf, patientLabel } from '../../lib/labels'
import { DoctorSummary } from './DoctorSummary'
import { useDoctor } from './useDoctor'

// The backend accepts dates from today up to 90 days ahead.
const MAX_DAYS_AHEAD = 90

const schema = z.object({
  doctor_id: z.string().trim().regex(/^[1-9][0-9]*$/, 'Enter a doctor ID (a whole number above 0)'),
  patient_id: z.string().min(1, 'Choose who the appointment is for'),
  appointment_date: z
    .string()
    .min(1, 'Choose a date')
    .refine((value) => value >= todayString(), 'The date cannot be in the past')
    .refine(
      (value) => value <= addDays(todayString(), MAX_DAYS_AHEAD),
      `The date must be within ${MAX_DAYS_AHEAD} days from today`,
    ),
  consultation_type: z.string().min(1, 'Choose a consultation type'),
  notes: z.string().trim().max(500, 'At most 500 characters'),
})
type FormValues = z.infer<typeof schema>

export default function BookAppointmentPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [booked, setBooked] = useState<Appointment | null>(null)

  const profilesQuery = useQuery({ queryKey: ['patient-profiles'], queryFn: getPatientProfiles })
  const profiles = profilesQuery.data ?? []

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      doctor_id: searchParams.get('doctor_id') ?? '',
      patient_id: '',
      appointment_date: '',
      consultation_type: 'in_person',
      notes: '',
    },
  })

  const doctorIdText = useWatch({ control, name: 'doctor_id' })
  const patientIdText = useWatch({ control, name: 'patient_id' })
  const dateText = useWatch({ control, name: 'appointment_date' })
  const doctorId = parseId(doctorIdText.trim())
  const { profile: doctorQuery, availability } = useDoctor(doctorId)

  // Pre-select the primary profile once the profiles have loaded.
  const loadedProfiles = profilesQuery.data
  useEffect(() => {
    if (patientIdText === '' && loadedProfiles && loadedProfiles.length > 0) {
      const primary = loadedProfiles.find((p) => p.is_primary) ?? loadedProfiles[0]
      setValue('patient_id', String(primary.id))
    }
  }, [patientIdText, loadedProfiles, setValue])

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      bookAppointment({
        doctor_id: Number(values.doctor_id),
        patient_id: Number(values.patient_id),
        appointment_date: values.appointment_date,
        consultation_type: values.consultation_type,
        notes: values.notes === '' ? null : values.notes,
      }),
    onSuccess: async (appointment) => {
      setBooked(appointment)
      await queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  // Soft warning only: the backend does not block days outside the weekly hours.
  const worksThatDay =
    dateText === '' || !availability.isSuccess || availability.data.length === 0
      ? true
      : availability.data.some((slot) => slot.day_of_week === weekdayIndex(dateText))

  if (booked) {
    const patient = profiles.find((p) => p.id === booked.patient_id)
    return (
      <>
        <PageHeader title="Appointment booked" />
        <Card>
          <Alert kind="success">Your appointment is confirmed.</Alert>
          <dl className="mt-4 space-y-1 text-sm">
            <div>Appointment ID: {booked.id}</div>
            <div>Date: {formatDate(booked.appointment_date)}</div>
            <div>
              Doctor: {doctorQuery.data?.id === booked.doctor_id ? doctorQuery.data.full_name : ''} (ID{' '}
              {booked.doctor_id})
            </div>
            <div>For: {patient ? patientLabel(patient) : `Profile ID ${booked.patient_id}`}</div>
            <div>Type: {labelOf(CONSULTATION_TYPES, booked.consultation_type)}</div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/patient/appointments"
              className="inline-flex rounded-md bg-teal-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              View my appointments
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setBooked(null)
                mutation.reset()
                reset({
                  doctor_id: String(booked.doctor_id),
                  patient_id: String(booked.patient_id),
                  appointment_date: '',
                  consultation_type: booked.consultation_type,
                  notes: '',
                })
              }}
            >
              Book another
            </Button>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Book an appointment" subtitle="Appointments are confirmed immediately." />

      {profilesQuery.isPending && <Spinner />}
      {profilesQuery.isError && <Alert kind="error">{getErrorMessage(profilesQuery.error)}</Alert>}

      {profilesQuery.isSuccess && profiles.length === 0 && (
        <Alert kind="warning">
          You need a patient profile before you can book.{' '}
          <Link to="/patient/profiles" className="font-medium underline">
            Create a profile
          </Link>
        </Alert>
      )}

      {profilesQuery.isSuccess && profiles.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4" noValidate>
              {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}

              <Field label="Doctor ID" error={errors.doctor_id?.message}>
                <input className={inputClass} inputMode="numeric" {...register('doctor_id')} />
              </Field>

              <Field label="Appointment for" error={errors.patient_id?.message}>
                <select className={inputClass} {...register('patient_id')}>
                  {profiles.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {patientLabel(p)}
                      {p.is_primary ? ' - primary' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date" error={errors.appointment_date?.message}>
                <input
                  className={inputClass}
                  type="date"
                  min={todayString()}
                  max={addDays(todayString(), MAX_DAYS_AHEAD)}
                  {...register('appointment_date')}
                />
              </Field>

              {!worksThatDay && (
                <Alert kind="warning">
                  {WEEK_DAYS[weekdayIndex(dateText)]} is not in this doctor's weekly hours. You can still book, but
                  check with the doctor.
                </Alert>
              )}

              <Field label="Consultation type" error={errors.consultation_type?.message}>
                <select className={inputClass} {...register('consultation_type')}>
                  {CONSULTATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Notes (optional)" error={errors.notes?.message}>
                <textarea className={inputClass} rows={3} maxLength={500} {...register('notes')} />
              </Field>

              <Button type="submit" loading={mutation.isPending}>
                Book appointment
              </Button>
            </form>
          </Card>

          <div>
            {doctorId === null ? (
              <Alert kind="info">
                Enter a doctor ID to see the doctor's details.{' '}
                <Link to="/patient/doctors" className="font-medium underline">
                  Find a doctor
                </Link>
              </Alert>
            ) : (
              <>
                <DoctorSummary doctorId={doctorId} />
                {doctorQuery.isSuccess && !doctorQuery.data.is_accepting_appointments && (
                  <div className="mt-3">
                    <Alert kind="warning">This doctor is not accepting appointments, so booking will be refused.</Alert>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
