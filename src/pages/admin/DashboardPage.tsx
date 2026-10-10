import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import { Alert, Card, PageHeader, Spinner } from '../../components/ui'

interface Tile {
  label: string
  value: number
  tone: 'teal' | 'amber' | 'red' | 'emerald' | 'slate'
  to?: string
}

const TONE_CLASSES: Record<Tile['tone'], string> = {
  teal: 'text-teal-700 dark:text-teal-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  slate: 'text-slate-700 dark:text-slate-300',
}

export default function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard })

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="System-wide overview of patients, doctors and appointments." />

      {query.isPending && <Spinner />}
      {query.isError && <Alert kind="error">{getErrorMessage(query.error)}</Alert>}

      {query.isSuccess && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              People
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tile
                tile={{ label: 'Total patients', value: query.data.total_patients, tone: 'teal' }}
                to="/admin/patients"
              />
              <Tile
                tile={{ label: 'Total doctors', value: query.data.total_doctors, tone: 'teal' }}
                to="/admin/doctors"
              />
              <Tile
                tile={{
                  label: 'Doctors pending verification',
                  value: query.data.doctors_pending_verification,
                  tone: 'amber',
                }}
                to="/admin/doctors"
              />
              <Tile
                tile={{
                  label: 'Pending deletion requests',
                  value: query.data.pending_deletion_requests,
                  tone: 'red',
                }}
                to="/admin/deletion-requests"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Appointments
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tile
                tile={{ label: 'Total appointments', value: query.data.total_appointments, tone: 'slate' }}
                to="/admin/appointments"
              />
              <Tile
                tile={{ label: 'Scheduled today', value: query.data.appointments_today, tone: 'teal' }}
                to="/admin/appointments"
              />
              <Tile
                tile={{ label: 'Confirmed', value: query.data.confirmed_appointments, tone: 'emerald' }}
                to="/admin/appointments"
              />
              <Tile
                tile={{ label: 'Completed', value: query.data.completed_appointments, tone: 'slate' }}
                to="/admin/appointments"
              />
              <Tile
                tile={{ label: 'Cancelled', value: query.data.cancelled_appointments, tone: 'red' }}
                to="/admin/appointments"
              />
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function Tile({ tile, to }: { tile: Tile; to?: string }) {
  const body = (
    <Card className="transition-shadow hover:shadow-md">
      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{tile.label}</div>
      <div className={'mt-1 text-3xl font-bold tabular-nums ' + TONE_CLASSES[tile.tone]}>{tile.value}</div>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}
