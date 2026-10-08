import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getMyAppointments } from '../../api/appointments'
import { getErrorMessage } from '../../api/client'
import { Badge, Card, Field, PageHeader, Spinner, Alert, EmptyState, inputClass } from '../../components/ui'
import { formatDate, todayString } from '../../lib/dates'
import { labelOf, APPOINTMENT_STATUSES } from '../../lib/labels'
import type { AppointmentStatus } from '../../api/types'

export default function DoctorAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fromDate, setFromDate] = useState(searchParams.get('from_date') || todayString())
  const [toDate, setToDate] = useState(searchParams.get('to_date') || '')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>(
    (searchParams.get('status') as AppointmentStatus | null) || '',
  )

  const appointmentsQuery = useQuery({
    queryKey: ['doctor-appointments', { from_date: fromDate, to_date: toDate, status: statusFilter }],
    queryFn: () =>
      getMyAppointments({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        status_filter: statusFilter || undefined,
      }),
  })

  const appointments = appointmentsQuery.data?.items || []
  const total = appointmentsQuery.data?.total || 0

  const handleApplyFilter = () => {
    const params = new URLSearchParams()
    if (fromDate) params.set('from_date', fromDate)
    if (toDate) params.set('to_date', toDate)
    if (statusFilter) params.set('status', statusFilter)
    setSearchParams(params)
  }

  const handleClearFilter = () => {
    setFromDate(todayString())
    setToDate('')
    setStatusFilter('')
    setSearchParams({})
  }

  const getToneFront = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'green'
      case 'cancelled':
        return 'red'
      case 'pending':
        return 'amber'
      default:
        return 'gray'
    }
  }

  return (
    <>
      <PageHeader
        title="My Appointments"
        subtitle={`You have ${total} appointment${total !== 1 ? 's' : ''} with your patients.`}
      />

      {/* Filters */}
      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Filters
        </h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="From date" hint="Start date (optional)">
              <input
                type="date"
                className={inputClass}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Field>

            <Field label="To date" hint="End date (optional)">
              <input type="date" className={inputClass} value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>

            <Field label="Status" hint="Filter by appointment status">
              <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}>
                <option value="">All statuses</option>
                {APPOINTMENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleApplyFilter}
              className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              Apply filters
            </button>
            {(fromDate !== todayString() || toDate || statusFilter) && (
              <button
                onClick={handleClearFilter}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Appointments list */}
      {appointmentsQuery.isPending && <Spinner />}

      {appointmentsQuery.isError && (
        <Alert kind="error">{getErrorMessage(appointmentsQuery.error)}</Alert>
      )}

      {appointmentsQuery.isSuccess && appointments.length === 0 && (
        <EmptyState
          title="No appointments found"
          description="You don't have any appointments matching the current filters."
        />
      )}

      {appointmentsQuery.isSuccess && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="p-4 sm:p-5">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Appointment #{apt.id}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(apt.appointment_date)} • {apt.consultation_type}
                    </p>
                  </div>
                  <Badge tone={getToneFront(apt.status)}>{labelOf(APPOINTMENT_STATUSES, apt.status)}</Badge>
                </div>

                {/* Patient info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Patient
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      Patient ID: {apt.patient_id}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Consultation
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-white">
                      {apt.consultation_type || 'Not specified'}
                    </p>
                    {apt.notes && <p className="text-xs text-slate-600 dark:text-slate-400">{apt.notes}</p>}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Booked:</span>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(apt.created_at)}
                      </p>
                    </div>
                    {apt.cancellation_time && (
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Cancelled:</span>
                        <p className="font-medium text-red-700 dark:text-red-400">
                          {formatDate(apt.cancellation_time)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
