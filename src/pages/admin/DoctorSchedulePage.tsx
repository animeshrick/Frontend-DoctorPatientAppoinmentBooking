import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  adminCreateDoctorHoliday,
  adminDeleteDoctorAvailability,
  adminDeleteDoctorHoliday,
  adminSetDoctorAvailability,
  adminUpdateDoctorHoliday,
  getAdminDoctorAvailability,
  getAdminDoctorHolidays,
  getAdminDoctors,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { Availability, Holiday, HolidayUpdateRequest } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { addDays, formatDate, todayString, WEEK_DAYS } from '../../lib/dates'

const MAX_DAYS = 90

/** Returns an error message, or null when the range is fine. */
function checkRange(from: string, to: string): string | null {
  if (from === '' || to === '') return 'Choose both a start and an end date.'
  if (to < from) return 'End date must be the same as or after the start date.'
  if (to > addDays(from, MAX_DAYS)) return `The range cannot be longer than ${MAX_DAYS} days.`
  return null
}

/** Admin-only view of one doctor's schedule - lets an admin set weekly
 * availability and manage holidays on a doctor's behalf, including
 * deleting an availability slot entirely, which doctors cannot do for
 * themselves. */
export default function AdminDoctorSchedulePage() {
  const { doctorId: doctorIdParam } = useParams<{ doctorId: string }>()
  const doctorId = Number(doctorIdParam)

  // The doctor's name/specialization aren't on the availability/holiday
  // endpoints, so pull them from the doctors list for the page header.
  const doctorQuery = useQuery({
    queryKey: ['admin', 'doctors', 'byId', doctorId],
    queryFn: () => getAdminDoctors({ limit: 1000 }),
  })
  const doctor = doctorQuery.data?.items.find((d) => d.id === doctorId)

  return (
    <>
      <PageHeader
        title={doctor ? `${doctor.owner_full_name}'s schedule` : 'Doctor schedule'}
        subtitle={
          doctor
            ? `${doctor.specialization || 'No specialization set'} · ID ${doctor.id} · ${doctor.owner_phone}`
            : 'Manage this doctor’s weekly availability and holidays.'
        }
      />
      <div className="mb-6">
        <Link to="/admin/doctors" className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400">
          &larr; Back to all doctors
        </Link>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Weekly availability</h2>
        <AvailabilitySection doctorId={doctorId} />
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Holidays</h2>
        <HolidaysSection doctorId={doctorId} />
      </Card>
    </>
  )
}

function AvailabilitySection({ doctorId }: { doctorId: number }) {
  const query = useQuery({
    queryKey: ['admin', 'doctor-availability', doctorId],
    queryFn: () => getAdminDoctorAvailability(doctorId),
  })

  if (query.isPending) return <Spinner />
  if (query.isError) return <Alert kind="error">{getErrorMessage(query.error)}</Alert>

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {WEEK_DAYS.map((dayName, dayIndex) => (
        <DayRow
          key={dayName}
          doctorId={doctorId}
          dayName={dayName}
          dayIndex={dayIndex}
          current={query.data?.find((slot) => slot.day_of_week === dayIndex)}
        />
      ))}
    </div>
  )
}

function DayRow({
  doctorId,
  dayName,
  dayIndex,
  current,
}: {
  doctorId: number
  dayName: string
  dayIndex: number
  current?: Availability
}) {
  const queryClient = useQueryClient()
  const [start, setStart] = useState(current?.start_time.slice(0, 5) ?? '')
  const [end, setEnd] = useState(current?.end_time.slice(0, 5) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'doctor-availability', doctorId] })

  const saveMutation = useMutation({
    mutationFn: () => adminSetDoctorAvailability(doctorId, { day_of_week: dayIndex, start_time: start, end_time: end }),
    onSuccess: async () => {
      setSaved(true)
      await refresh()
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => adminDeleteDoctorAvailability(doctorId, current!.id),
    onSuccess: async () => {
      setStart('')
      setEnd('')
      await refresh()
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  const save = () => {
    setSaved(false)
    if (start === '' || end === '') return setError('Choose both a start and an end time.')
    if (start >= end) return setError('Start time must be before end time.')
    setError(null)
    saveMutation.mutate()
  }

  const unchanged =
    current !== undefined && current.start_time.slice(0, 5) === start && current.end_time.slice(0, 5) === end

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-28 text-sm font-medium text-slate-900 dark:text-white">{dayName}</div>
        <input
          aria-label={`${dayName} start time`}
          type="time"
          className={inputClass}
          style={{ width: '8rem' }}
          value={start}
          onChange={(e) => {
            setStart(e.target.value)
            setSaved(false)
          }}
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">to</span>
        <input
          aria-label={`${dayName} end time`}
          type="time"
          className={inputClass}
          style={{ width: '8rem' }}
          value={end}
          onChange={(e) => {
            setEnd(e.target.value)
            setSaved(false)
          }}
        />
        <Button variant="secondary" loading={saveMutation.isPending} disabled={unchanged} onClick={save}>
          Save
        </Button>
        {current && (
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Clear ${dayName}'s availability entirely?`)) deleteMutation.mutate()
            }}
          >
            Clear day
          </Button>
        )}
        {current ? <Badge tone="green">Working day</Badge> : <Badge>Not set</Badge>}
        {saved && <span className="text-sm text-emerald-700 dark:text-emerald-400">Saved</span>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function HolidaysSection({ doctorId }: { doctorId: number }) {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'doctor-holidays', doctorId],
    queryFn: () => getAdminDoctorHolidays(doctorId),
  })
  const holidays = query.data?.data ?? []
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'doctor-holidays', doctorId] })

  const [editingId, setEditingId] = useState<number | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (holidayId: number) => adminDeleteDoctorHoliday(doctorId, holidayId),
    onMutate: () => setActionError(null),
    onSuccess: refresh,
    onError: (error: unknown) => setActionError(getErrorMessage(error)),
  })

  return (
    <div>
      <div className="mb-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Add a holiday</h3>
        <HolidayForm doctorId={doctorId} onSaved={refresh} />
      </div>

      {actionError && (
        <div className="mb-4">
          <Alert kind="error">{actionError}</Alert>
        </div>
      )}

      {query.isPending && <Spinner />}
      {query.isError && <Alert kind="error">{getErrorMessage(query.error)}</Alert>}
      {query.isSuccess && holidays.length === 0 && <Alert kind="info">No holidays on file for this doctor.</Alert>}

      <div className="space-y-3">
        {holidays.map((holiday) => (
          <Card key={holiday.id}>
            {editingId === holiday.id ? (
              <HolidayForm
                doctorId={doctorId}
                holiday={holiday}
                onSaved={async () => {
                  setEditingId(null)
                  await refresh()
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {holiday.from_date === holiday.to_date
                      ? formatDate(holiday.from_date)
                      : `${formatDate(holiday.from_date)} to ${formatDate(holiday.to_date)}`}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{holiday.reason || 'No reason given'}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditingId(holiday.id)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Delete this holiday?')) deleteMutation.mutate(holiday.id)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

interface HolidayFormProps {
  doctorId: number
  holiday?: Holiday
  onSaved: () => void | Promise<unknown>
  onCancel?: () => void
}

function HolidayForm({ doctorId, holiday, onSaved, onCancel }: HolidayFormProps) {
  const today = todayString()
  const [from, setFrom] = useState(holiday?.from_date ?? '')
  const [to, setTo] = useState(holiday?.to_date ?? '')
  const [reason, setReason] = useState(holiday?.reason ?? '')
  const [error, setError] = useState<string | null>(null)

  const datesChanged = holiday === undefined || from !== holiday.from_date || to !== holiday.to_date

  const mutation = useMutation({
    mutationFn: () => {
      const trimmedReason = reason.trim()
      if (holiday === undefined) {
        return adminCreateDoctorHoliday(doctorId, {
          from_date: from,
          to_date: to,
          reason: trimmedReason === '' ? null : trimmedReason,
        })
      }
      const body: HolidayUpdateRequest = { reason: trimmedReason }
      if (datesChanged) {
        body.from_date = from
        body.to_date = to
      }
      return adminUpdateDoctorHoliday(doctorId, holiday.id, body)
    },
    onSuccess: async () => {
      if (holiday === undefined) {
        setFrom('')
        setTo('')
        setReason('')
      }
      await onSaved()
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  const submit = () => {
    const rangeError = checkRange(from, to)
    if (rangeError) return setError(rangeError)
    if (datesChanged && from < today) return setError('Holiday dates cannot be in the past.')
    if (reason.trim().length > 500) return setError('Reason can be at most 500 characters.')
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="space-y-3">
      {error && <Alert kind="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="From">
          <input className={inputClass} type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input
            className={inputClass}
            type="date"
            min={from || today}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Field label="Reason (optional)">
          <input className={inputClass} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-3">
        <Button loading={mutation.isPending} onClick={submit}>
          {holiday === undefined ? 'Add holiday' : 'Save changes'}
        </Button>
        {onCancel && (
          <Button variant="secondary" disabled={mutation.isPending} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
