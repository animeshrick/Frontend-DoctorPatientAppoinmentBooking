import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage, getErrorStatus } from '../../api/client'
import { getMyAvailability, setMyAvailability } from '../../api/doctors'
import type { Availability } from '../../api/types'
import { Alert, Badge, Button, Card, PageHeader, Spinner, inputClass } from '../../components/ui'
import { WEEK_DAYS } from '../../lib/dates'

export default function AvailabilityPage() {
  const query = useQuery({ queryKey: ['my-availability'], queryFn: getMyAvailability })

  return (
    <>
      <PageHeader
        title="Weekly availability"
        subtitle="Set your working hours for each day of the week. Saving a day again replaces its hours."
      />
      {query.isPending && <Spinner />}
      {query.isError && (
        <Alert kind="error">
          {getErrorStatus(query.error) === 404
            ? 'Create your doctor profile first (My profile), then set your availability.'
            : getErrorMessage(query.error)}
        </Alert>
      )}
      {query.isSuccess && (
        <Card>
          <div className="divide-y divide-slate-200">
            {WEEK_DAYS.map((dayName, dayIndex) => (
              <DayRow
                key={dayName}
                dayName={dayName}
                dayIndex={dayIndex}
                current={query.data.find((slot) => slot.day_of_week === dayIndex)}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            The backend has no endpoint to remove a day yet, so a saved day can be changed but not cleared.
          </p>
        </Card>
      )}
    </>
  )
}

function DayRow({ dayName, dayIndex, current }: { dayName: string; dayIndex: number; current?: Availability }) {
  const queryClient = useQueryClient()
  // Times are "HH:MM" strings, which is what the backend stores.
  const [start, setStart] = useState(current?.start_time.slice(0, 5) ?? '')
  const [end, setEnd] = useState(current?.end_time.slice(0, 5) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => setMyAvailability({ day_of_week: dayIndex, start_time: start, end_time: end }),
    onSuccess: async () => {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: ['my-availability'] })
    },
    onError: (err: unknown) => setError(getErrorMessage(err)),
  })

  const save = () => {
    setSaved(false)
    if (start === '' || end === '') return setError('Choose both a start and an end time.')
    if (start >= end) return setError('Start time must be before end time.')
    setError(null)
    mutation.mutate()
  }

  const unchanged = current !== undefined && current.start_time.slice(0, 5) === start && current.end_time.slice(0, 5) === end

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-28 text-sm font-medium">{dayName}</div>
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
        <span className="text-sm text-slate-500">to</span>
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
        <Button variant="secondary" loading={mutation.isPending} disabled={unchanged} onClick={save}>
          Save
        </Button>
        {current ? <Badge tone="green">Working day</Badge> : <Badge>Not set</Badge>}
        {saved && <span className="text-sm text-emerald-700">Saved</span>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
