import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage, getErrorStatus } from '../../api/client'
import { createHoliday, deleteHoliday, getMyHolidays, updateHoliday } from '../../api/doctors'
import type { HolidayQuery } from '../../api/doctors'
import type { Holiday, HolidayUpdateRequest } from '../../api/types'
import { Alert, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { addDays, formatDate, todayString } from '../../lib/dates'

const PAGE_SIZE = 20
// The backend allows a holiday (and a search range) of at most 90 days.
const MAX_DAYS = 90

/** Returns an error message, or null when the range is fine. */
function checkRange(from: string, to: string): string | null {
  if (from === '' || to === '') return 'Choose both a start and an end date.'
  if (to < from) return 'End date must be the same as or after the start date.'
  if (to > addDays(from, MAX_DAYS)) return `The range cannot be longer than ${MAX_DAYS} days.`
  return null
}

export default function HolidaysPage() {
  const queryClient = useQueryClient()
  const [range, setRange] = useState({ from: '', to: '' })
  const [applied, setApplied] = useState({ from: '', to: '' })
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const params: HolidayQuery = { skip: page * PAGE_SIZE, limit: PAGE_SIZE }
  if (applied.from !== '' && applied.to !== '') {
    params.from_date = applied.from
    params.to_date = applied.to
  }

  const query = useQuery({ queryKey: ['my-holidays', params], queryFn: () => getMyHolidays(params) })
  const holidays = query.data?.data ?? []
  const total = query.data?.total_count ?? 0
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-holidays'] })

  const deleteMutation = useMutation({
    mutationFn: deleteHoliday,
    onMutate: () => setActionError(null),
    onSuccess: refresh,
    onError: (error: unknown) => setActionError(getErrorMessage(error)),
  })

  const applyRange = () => {
    const error = checkRange(range.from, range.to)
    if (error) return setRangeError(error)
    setRangeError(null)
    setPage(0)
    setApplied(range)
  }
  const clearRange = () => {
    setRangeError(null)
    setRange({ from: '', to: '' })
    setApplied({ from: '', to: '' })
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Holidays"
        subtitle="Patients cannot book you on holiday dates, even on your working days."
      />

      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold">Add a holiday</h2>
        <HolidayForm onSaved={refresh} />
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 text-base font-semibold">Filter by date range</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Field label="From">
              <input
                className={inputClass}
                type="date"
                value={range.from}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
              />
            </Field>
          </div>
          <div className="w-44">
            <Field label="To">
              <input
                className={inputClass}
                type="date"
                value={range.to}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
              />
            </Field>
          </div>
          <Button onClick={applyRange}>Apply</Button>
          <Button variant="secondary" onClick={clearRange}>
            Show all
          </Button>
        </div>
        {rangeError && <p className="mt-2 text-sm text-red-600">{rangeError}</p>}
      </Card>

      {actionError && (
        <div className="mb-4">
          <Alert kind="error">{actionError}</Alert>
        </div>
      )}

      {query.isPending && <Spinner />}
      {query.isError && (
        <Alert kind="error">
          {getErrorStatus(query.error) === 404
            ? 'Create your doctor profile first (My profile), then add holidays.'
            : getErrorMessage(query.error)}
        </Alert>
      )}
      {query.isSuccess && holidays.length === 0 && <Alert kind="info">No holidays found.</Alert>}

      <div className="space-y-3">
        {holidays.map((holiday) => (
          <Card key={holiday.id}>
            {editingId === holiday.id ? (
              <HolidayForm
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
                  <div className="text-sm font-semibold">
                    {holiday.from_date === holiday.to_date
                      ? formatDate(holiday.from_date)
                      : `${formatDate(holiday.from_date)} to ${formatDate(holiday.to_date)}`}
                  </div>
                  <div className="text-sm text-slate-600">{holiday.reason || 'No reason given'}</div>
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

      {query.isSuccess && total > PAGE_SIZE && (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {page * PAGE_SIZE + 1} to {page * PAGE_SIZE + holidays.length} of {total}
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

interface HolidayFormProps {
  /** Pass a holiday to edit it; leave empty to add a new one. */
  holiday?: Holiday
  onSaved: () => void | Promise<unknown>
  onCancel?: () => void
}

function HolidayForm({ holiday, onSaved, onCancel }: HolidayFormProps) {
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
        return createHoliday({ from_date: from, to_date: to, reason: trimmedReason === '' ? null : trimmedReason })
      }
      // Send the dates only when they changed: the backend re-checks
      // "not in the past" whenever dates are sent.
      const body: HolidayUpdateRequest = { reason: trimmedReason }
      if (datesChanged) {
        body.from_date = from
        body.to_date = to
      }
      return updateHoliday(holiday.id, body)
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
