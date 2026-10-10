import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminCancelAppointment,
  adminCompleteAppointment,
  adminMarkAppointmentNoShow,
  adminRescheduleAppointment,
  adminUpdateAppointmentNotes,
  getAdminAppointments,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { AdminAppointmentItem, AdminAppointmentQuery, AppointmentStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { addDays, formatDate, todayString } from '../../lib/dates'
import { parseId } from '../../lib/ids'
import { APPOINTMENT_STATUSES, CONSULTATION_TYPES, labelOf } from '../../lib/labels'

const PAGE_SIZE = 15

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

type Panel = { id: number; kind: 'cancel' | 'reschedule' | 'notes' }

export default function AdminAppointmentsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FilterForm>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<FilterForm>(EMPTY_FILTERS)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const filters: AdminAppointmentQuery = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
  if (applied.status !== '') filters.status_filter = applied.status
  const patientFilter = parseId(applied.patientId)
  if (patientFilter !== null) filters.patient_id = patientFilter
  const doctorFilter = parseId(applied.doctorId)
  if (doctorFilter !== null) filters.doctor_id = doctorFilter
  if (applied.fromDate !== '') filters.from_date = applied.fromDate
  if (applied.toDate !== '') filters.to_date = applied.toDate

  const listQuery = useQuery({
    queryKey: ['admin', 'appointments', filters],
    queryFn: () => getAdminAppointments(filters),
  })
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0

  const applyFilters = () => {
    if (form.doctorId.trim() !== '' && parseId(form.doctorId.trim()) === null) {
      setFilterError('Doctor ID must be a whole number above 0.')
      return
    }
    if (form.patientId.trim() !== '' && parseId(form.patientId.trim()) === null) {
      setFilterError('Patient ID must be a whole number above 0.')
      return
    }
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      setFilterError('"From" date cannot be after "To" date.')
      return
    }
    setFilterError(null)
    setPage(0)
    setPanel(null)
    setApplied({ ...form, doctorId: form.doctorId.trim(), patientId: form.patientId.trim() })
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
    await queryClient.invalidateQueries({ queryKey: ['admin', 'appointments'] })
  }

  return (
    <>
      <PageHeader title="All appointments" subtitle="Every appointment across every patient and doctor." />

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
          <Field label="Patient ID">
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            />
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
        {filterError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{filterError}</p>}
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
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            Showing {page * PAGE_SIZE + 1} to {page * PAGE_SIZE + items.length} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

interface RowProps {
  appointment: AdminAppointmentItem
  panel: Panel['kind'] | null
  onPanel: (kind: Panel['kind'] | null) => void
  onChanged: (message: string) => Promise<void>
}

function AppointmentRow({ appointment, panel, onPanel, onChanged }: RowProps) {
  const today = todayString()
  const canChange = appointment.status === 'confirmed' && appointment.appointment_date >= today
  const canMarkOutcome = appointment.status === 'confirmed'
  const toggle = (kind: Panel['kind']) => onPanel(panel === kind ? null : kind)

  const completeMutation = useMutation({
    mutationFn: () => adminCompleteAppointment(appointment.id),
    onSuccess: () => onChanged('Appointment marked as completed.'),
  })
  const noShowMutation = useMutation({
    mutationFn: () => adminMarkAppointmentNoShow(appointment.id),
    onSuccess: () => onChanged('Appointment marked as a no-show.'),
  })

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{formatDate(appointment.appointment_date)}</div>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {appointment.doctor_name} <span className="text-slate-400">(Doctor ID {appointment.doctor_id})</span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            For {appointment.patient_name} <span className="text-slate-400">(Patient ID {appointment.patient_id})</span>{' '}
            · {labelOf(CONSULTATION_TYPES, appointment.consultation_type)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">Appointment ID {appointment.id}</div>
        </div>
        <Badge tone={STATUS_TONES[appointment.status] ?? 'gray'}>
          {labelOf(APPOINTMENT_STATUSES, appointment.status)}
        </Badge>
      </div>

      {appointment.notes && (
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Notes: {appointment.notes}</div>
      )}

      {appointment.status === 'cancelled' && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          Cancelled on {formatDate(appointment.cancellation_time)}
          {appointment.cancellation_reason ? ` — ${appointment.cancellation_reason}` : ''}
        </div>
      )}

      {(completeMutation.isError || noShowMutation.isError) && (
        <div className="mt-2">
          <Alert kind="error">{getErrorMessage(completeMutation.error ?? noShowMutation.error)}</Alert>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => toggle('notes')}>
          {panel === 'notes' ? 'Hide notes' : 'Edit notes'}
        </Button>
        {canMarkOutcome && (
          <>
            <Button variant="secondary" loading={completeMutation.isPending} onClick={() => completeMutation.mutate()}>
              Mark completed
            </Button>
            <Button variant="secondary" loading={noShowMutation.isPending} onClick={() => noShowMutation.mutate()}>
              Mark no-show
            </Button>
          </>
        )}
        {canChange && (
          <>
            <Button variant="secondary" onClick={() => toggle('reschedule')}>
              Reschedule
            </Button>
            <Button variant="danger" onClick={() => toggle('cancel')}>
              Cancel appointment
            </Button>
          </>
        )}
      </div>

      {panel === 'notes' && (
        <NotesPanel appointment={appointment} onClose={() => onPanel(null)} onChanged={onChanged} />
      )}
      {panel === 'cancel' && (
        <CancelPanel appointmentId={appointment.id} onClose={() => onPanel(null)} onChanged={onChanged} />
      )}
      {panel === 'reschedule' && (
        <ReschedulePanel appointment={appointment} onClose={() => onPanel(null)} onChanged={onChanged} />
      )}
    </Card>
  )
}

function NotesPanel({
  appointment,
  onClose,
  onChanged,
}: {
  appointment: AdminAppointmentItem
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const mutation = useMutation({
    mutationFn: () => adminUpdateAppointmentNotes(appointment.id, notes.trim()),
    onSuccess: () => onChanged('Appointment notes updated.'),
  })

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}
      <Field label="Notes">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="flex gap-3">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Save notes
        </Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
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
    mutationFn: () => adminCancelAppointment(appointmentId, reason.trim() === '' ? null : reason.trim()),
    onSuccess: (result) => onChanged(result.message),
  })

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
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
  appointment: AdminAppointmentItem
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}) {
  const today = todayString()
  const [newDate, setNewDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () => adminRescheduleAppointment(appointment.id, newDate),
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
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
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
