import { useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { cancelAppointment, getAppointment, getMyAppointments, rescheduleAppointment } from '../../api/appointments'
import { getErrorMessage } from '../../api/client'
import { getDoctorPublicProfile } from '../../api/doctors'
import { getPatientProfiles } from '../../api/patients'
import type { Appointment, AppointmentFilters, AppointmentStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { addDays, formatDate, todayString } from '../../lib/dates'
import { parseId } from '../../lib/ids'
import { APPOINTMENT_STATUSES, CONSULTATION_TYPES, labelOf, patientLabel } from '../../lib/labels'

const PAGE_SIZE = 10

const STATUS_TONES: Record<AppointmentStatus, 'green' | 'red' | 'gray' | 'amber' | 'blue'> = {
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
  no_show: 'amber',
  rescheduled: 'gray',
}

interface FilterForm {
  status: '' | AppointmentStatus
  patientId: string
  doctorId: string
  fromDate: string
  toDate: string
}

const EMPTY_FILTERS: FilterForm = { status: '', patientId: '', doctorId: '', fromDate: '', toDate: '' }

type Panel = { id: number; kind: 'details' | 'cancel' | 'reschedule' }

export default function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FilterForm>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<FilterForm>(EMPTY_FILTERS)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const profilesQuery = useQuery({ queryKey: ['patient-profiles'], queryFn: getPatientProfiles })
  const profiles = profilesQuery.data ?? []
  const hasProfiles = profilesQuery.isSuccess && profiles.length > 0

  // Note: the backend's query parameter for status is "status_filter".
  const filters: AppointmentFilters = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
  if (applied.status !== '') filters.status_filter = applied.status
  const patientFilter = parseId(applied.patientId)
  if (patientFilter !== null) filters.patient_id = patientFilter
  const doctorFilter = parseId(applied.doctorId)
  if (doctorFilter !== null) filters.doctor_id = doctorFilter
  if (applied.fromDate !== '') filters.from_date = applied.fromDate
  if (applied.toDate !== '') filters.to_date = applied.toDate

  const listQuery = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => getMyAppointments(filters),
    // The backend answers 404 when the account has no patient profile.
    enabled: hasProfiles,
  })
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  // Appointments only carry doctor_id, so look up each doctor's name once.
  const doctorIds = [...new Set(items.map((a) => a.doctor_id))]
  const doctorQueries = useQueries({
    queries: doctorIds.map((id) => ({
      queryKey: ['doctor-public', id],
      queryFn: () => getDoctorPublicProfile(id),
      staleTime: 5 * 60_000,
    })),
  })
  const doctorName = (id: number): string => {
    const name = doctorQueries[doctorIds.indexOf(id)]?.data?.full_name
    return name ? `${name} (ID ${id})` : `Doctor ID ${id}`
  }
  const patientName = (id: number): string => {
    const patient = profiles.find((p) => p.id === id)
    return patient ? patientLabel(patient) : `Profile ID ${id}`
  }

  const applyFilters = () => {
    if (form.doctorId.trim() !== '' && parseId(form.doctorId.trim()) === null) {
      setFilterError('Doctor ID must be a whole number above 0.')
      return
    }
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      setFilterError('"From" date cannot be after "To" date.')
      return
    }
    setFilterError(null)
    setPage(0)
    setPanel(null)
    setApplied({ ...form, doctorId: form.doctorId.trim() })
  }

  const clearFilters = () => {
    setFilterError(null)
    setForm(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(0)
    setPanel(null)
  }

  const afterChange = async (message: string) => {
    setPanel(null)
    setNotice(message)
    await queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  return (
    <>
      <PageHeader
        title="My appointments"
        subtitle="Appointments for you and your family members."
        action={
          <Link
            to="/patient/book"
            className="inline-flex rounded-md bg-teal-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Book appointment
          </Link>
        }
      />

      {profilesQuery.isPending && <Spinner />}
      {profilesQuery.isError && <Alert kind="error">{getErrorMessage(profilesQuery.error)}</Alert>}
      {profilesQuery.isSuccess && profiles.length === 0 && (
        <Alert kind="info">
          You have no patient profile yet.{' '}
          <Link to="/patient/profiles" className="font-medium underline">
            Create a profile
          </Link>{' '}
          to start booking.
        </Alert>
      )}

      {hasProfiles && (
        <>
          <Card className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FilterForm['status'] })}
                >
                  <option value="">All</option>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Patient">
                <select
                  className={inputClass}
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                >
                  <option value="">Everyone</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {patientLabel(p)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor ID">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                />
              </Field>
              <Field label="From">
                <input
                  className={inputClass}
                  type="date"
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                />
              </Field>
              <Field label="To">
                <input
                  className={inputClass}
                  type="date"
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </Field>
            </div>
            {filterError && <p className="mt-3 text-sm text-red-600">{filterError}</p>}
            <div className="mt-4 flex gap-3">
              <Button onClick={applyFilters}>Apply filters</Button>
              <Button variant="secondary" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </Card>

          {notice && (
            <div className="mb-4">
              <Alert kind="success">{notice}</Alert>
            </div>
          )}

          {listQuery.isPending && <Spinner />}
          {listQuery.isError && <Alert kind="error">{getErrorMessage(listQuery.error)}</Alert>}
          {listQuery.isSuccess && items.length === 0 && <Alert kind="info">No appointments found.</Alert>}

          <div className="space-y-3">
            {items.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                doctorName={doctorName(appointment.doctor_id)}
                patientName={patientName(appointment.patient_id)}
                panel={panel?.id === appointment.id ? panel.kind : null}
                onPanel={(kind) => {
                  setNotice(null)
                  setPanel(kind ? { id: appointment.id, kind } : null)
                }}
                onChanged={afterChange}
              />
            ))}
          </div>

          {listQuery.isSuccess && total > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing {page * PAGE_SIZE + 1} to {page * PAGE_SIZE + items.length} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={(page + 1) * PAGE_SIZE >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

interface RowProps {
  appointment: Appointment
  doctorName: string
  patientName: string
  panel: Panel['kind'] | null
  onPanel: (kind: Panel['kind'] | null) => void
  onChanged: (message: string) => Promise<void>
}

function AppointmentRow({ appointment, doctorName, patientName, panel, onPanel, onChanged }: RowProps) {
  const today = todayString()
  // Only upcoming, confirmed appointments can be cancelled or rescheduled.
  const canChange = appointment.status === 'confirmed' && appointment.appointment_date >= today
  const toggle = (kind: Panel['kind']) => onPanel(panel === kind ? null : kind)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{formatDate(appointment.appointment_date)}</div>
          <div className="text-sm text-slate-700">{doctorName}</div>
          <div className="text-sm text-slate-600">
            For {patientName} · {labelOf(CONSULTATION_TYPES, appointment.consultation_type)}
          </div>
        </div>
        <Badge tone={STATUS_TONES[appointment.status] ?? 'gray'}>
          {labelOf(APPOINTMENT_STATUSES, appointment.status)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => toggle('details')}>
          {panel === 'details' ? 'Hide details' : 'Details'}
        </Button>
        {canChange && (
          <>
            <Button variant="secondary" onClick={() => toggle('reschedule')}>
              Reschedule
            </Button>
            <Button variant="secondary" onClick={() => toggle('cancel')}>
              Cancel appointment
            </Button>
          </>
        )}
      </div>

      {panel === 'details' && <DetailsPanel appointmentId={appointment.id} />}
      {panel === 'cancel' && (
        <CancelPanel appointmentId={appointment.id} onClose={() => onPanel(null)} onChanged={onChanged} />
      )}
      {panel === 'reschedule' && (
        <ReschedulePanel appointment={appointment} onClose={() => onPanel(null)} onChanged={onChanged} />
      )}
    </Card>
  )
}

function DetailsPanel({ appointmentId }: { appointmentId: number }) {
  const query = useQuery({
    queryKey: ['appointments', 'detail', appointmentId],
    queryFn: () => getAppointment(appointmentId),
  })

  if (query.isPending) {
    return (
      <div className="mt-4">
        <Spinner />
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="mt-4">
        <Alert kind="error">{getErrorMessage(query.error)}</Alert>
      </div>
    )
  }
  const a = query.data
  return (
    <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
      <div>Appointment ID: {a.id}</div>
      <div>Booked on: {formatDate(a.created_at)}</div>
      <div className="sm:col-span-2">Notes: {a.notes || '-'}</div>
      {a.status === 'cancelled' && (
        <>
          <div>Cancelled on: {formatDate(a.cancellation_time)}</div>
          <div>Cancellation reason: {a.cancellation_reason || '-'}</div>
        </>
      )}
    </dl>
  )
}

function CancelPanel({
  appointmentId,
  onClose,
  onChanged,
}: {
  appointmentId: number
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const mutation = useMutation({
    mutationFn: () => cancelAppointment(appointmentId, reason.trim() === '' ? null : reason.trim()),
    // The backend message may include a late-cancellation warning.
    onSuccess: (result) => onChanged(result.message),
  })

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}
      <Field label="Reason for cancelling (optional)">
        <textarea
          className={inputClass}
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="flex gap-3">
        <Button variant="danger" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Confirm cancellation
        </Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>
          Keep appointment
        </Button>
      </div>
    </div>
  )
}

function ReschedulePanel({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: Appointment
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}) {
  const today = todayString()
  const [newDate, setNewDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () => rescheduleAppointment(appointment.id, newDate),
    onSuccess: (updated) => onChanged(`Appointment moved to ${formatDate(updated.appointment_date)}.`),
  })

  const submit = () => {
    if (newDate === '') return setDateError('Choose a new date.')
    if (newDate < today) return setDateError('The date cannot be in the past.')
    if (newDate > addDays(today, 90)) return setDateError('The date must be within 90 days from today.')
    if (newDate === appointment.appointment_date) return setDateError('Choose a different date.')
    setDateError(null)
    mutation.mutate()
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}
      <div className="w-56">
        <Field label="New date" error={dateError ?? undefined}>
          <input
            className={inputClass}
            type="date"
            min={today}
            max={addDays(today, 90)}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex gap-3">
        <Button loading={mutation.isPending} onClick={submit}>
          Confirm new date
        </Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
