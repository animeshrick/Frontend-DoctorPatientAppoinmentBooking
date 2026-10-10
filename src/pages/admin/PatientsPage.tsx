import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminPatients } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'
import { RELATIONSHIPS, labelOf } from '../../lib/labels'

const PAGE_SIZE = 20

export default function AdminPatientsPage() {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)

  const query = useQuery({
    queryKey: ['admin', 'patients', applied, page],
    queryFn: () => getAdminPatients({ search: applied || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
  })
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const submit = () => {
    setPage(0)
    setApplied(search.trim())
  }

  return (
    <>
      <PageHeader title="All patient profiles" subtitle="Every patient and family-member profile in the system." />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <Field label="Search by name or phone">
              <input
                className={inputClass}
                value={search}
                placeholder="e.g. Asha or 98765..."
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
      {query.isSuccess && items.length === 0 && <Alert kind="info">No patient profiles found.</Alert>}

      {items.length > 0 && (
        <Card noPadding className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Relation</th>
                <th className="px-4 py-3">Account owner</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {p.relation_name || p.owner_full_name}
                      {p.is_primary && (
                        <Badge tone="blue" className="ml-2">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ID {p.id} · {p.gender ?? 'Gender n/a'} · {p.age ?? 'Age n/a'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{labelOf(RELATIONSHIPS, p.relation_type)}</td>
                  <td className="px-4 py-3">
                    <div>{p.owner_full_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.owner_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {[p.city, p.state, p.pincode].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3">{p.preferred_language}</td>
                  <td className="px-4 py-3">{formatDate(p.created_at)}</td>
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
