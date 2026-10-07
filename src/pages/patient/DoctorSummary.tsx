import { getErrorMessage, getErrorStatus } from '../../api/client'
import { Alert, Badge, Card, Spinner } from '../../components/ui'
import { WEEK_DAYS } from '../../lib/dates'
import { useDoctor } from './useDoctor'

/** Public profile and weekly hours of one doctor. */
export function DoctorSummary({ doctorId }: { doctorId: number }) {
  const { profile, availability } = useDoctor(doctorId)

  if (profile.isPending) return <Spinner />
  if (profile.isError) {
    return (
      <Alert kind="error">
        {getErrorStatus(profile.error) === 404
          ? `No doctor found with ID ${doctorId}.`
          : getErrorMessage(profile.error)}
      </Alert>
    )
  }

  const doctor = profile.data
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{doctor.full_name}</h3>
          <p className="text-sm text-slate-600">
            {doctor.specialization || 'Specialization not provided'} · Doctor ID {doctor.id}
          </p>
        </div>
        {doctor.is_accepting_appointments ? (
          <Badge tone="green">Accepting appointments</Badge>
        ) : (
          <Badge tone="red">Not accepting appointments</Badge>
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Experience</dt>
          <dd>{doctor.years_of_experience !== null ? `${doctor.years_of_experience} years` : '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Consultation fee</dt>
          <dd>{doctor.consultation_fee !== null ? `Rs ${doctor.consultation_fee}` : '-'}</dd>
        </div>
        {doctor.bio && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">About</dt>
            <dd className="whitespace-pre-line">{doctor.bio}</dd>
          </div>
        )}
      </dl>

      <h4 className="mt-5 text-sm font-semibold">Weekly hours</h4>
      {availability.isPending && <Spinner />}
      {availability.isError && <Alert kind="error">{getErrorMessage(availability.error)}</Alert>}
      {availability.isSuccess && availability.data.length === 0 && (
        <p className="mt-1 text-sm text-slate-600">This doctor has not set any working hours yet.</p>
      )}
      {availability.isSuccess && availability.data.length > 0 && (
        <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
          {availability.data.map((slot) => (
            <li key={slot.id}>
              <span className="font-medium">{WEEK_DAYS[slot.day_of_week] ?? `Day ${slot.day_of_week}`}:</span>{' '}
              {slot.start_time} to {slot.end_time}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
