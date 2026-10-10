import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminDoctors } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { DoctorProfileStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'

const PAGE_SIZE = 20

const STATUS_TONES: Record<DoctorProfileStatus, 'green' | 'red' | 'gray' | 'amber' | 'blue'> = {
  DRAFT: 'gray',
  PENDING_REVIEW: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'red',
}

const STATUS_LABELS: Record<DoctorProfileStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
}

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)

  const query = useQuery({
    queryKey: ['admin', 'doctors', applied, page],
    queryFn: () => getAdminDoctors({ search: applied || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
  })
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const submit = () => {
    setPage(0)
    setApplied(search.trim())
  }

  return (
    <>
      <PageHeader title="All doctor profiles" subtitle="Every doctor registered in the system, with verification status." />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <Field label="Search by name, phone, email or specialization">
              <input
                className={inputClass}
                value={search}
                placeholder="e.g. Mehta or Cardiology"
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </Field>
          </div>
          <Button onClick={submit}>Search</Button>
          {applied && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setApplied('')
                setPage(0)
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {query.isPending && <Spinner />}
      {query.isError && <Alert kind="error">{getErrorMessage(query.error)}</Alert>}
      {query.isSuccess && items.length === 0 && <Alert kind="info">No doctor profiles found.</Alert>}

      {items.length > 0 && (
        <Card noPadding className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Accepting</th>
                <th className="px-4 py-3">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{d.owner_full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ID {d.id} · {d.owner_phone}
                      {d.owner_email ? ` · ${d.owner_email}` : ''}
                    </div>
                    {d.registration_number && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">Reg #{d.registration_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{d.specialization || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONES[d.status]}>{STATUS_LABELS[d.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">{d.years_of_experience ?? '-'} yrs</td>
                  <td className="px-4 py-3">{d.consultation_fee ? `₹${d.consultation_fee}` : '-'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.is_accepting_appointments ? 'green' : 'gray'}>
                      {d.is_accepting_appointments ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{d.verified_at ? formatDate(d.verified_at) : 'Not verified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {query.isSuccess && total > 0 && (
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
