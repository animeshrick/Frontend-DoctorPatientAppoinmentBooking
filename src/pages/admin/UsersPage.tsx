import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAdminUsers } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { UserRole } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'
import { RELATIONSHIPS, labelOf } from '../../lib/labels'

const PAGE_SIZE = 20

const ROLE_TONES: Record<UserRole, 'green' | 'red' | 'gray' | 'amber' | 'blue'> = {
  USER: 'blue',
  DOCTOR: 'green',
  ADMIN: 'amber',
}

const ROLE_OPTIONS: { value: '' | UserRole; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'USER', label: 'Patient account (USER)' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'ADMIN', label: 'Admin' },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [role, setRole] = useState<'' | UserRole>('')
  const [page, setPage] = useState(0)

  const query = useQuery({
    queryKey: ['admin', 'users', applied, role, page],
    queryFn: () =>
      getAdminUsers({
        search: applied || undefined,
        role: role || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
  })
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const submit = () => {
    setPage(0)
    setApplied(search.trim())
  }

  return (
    <>
      <PageHeader
        title="All users"
        subtitle="Every account in the system - patients, doctors and admins - with each account's patient profiles (family members) shown underneath."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem] flex-1">
            <Field label="Search by name, phone or email">
              <input
                className={inputClass}
                value={search}
                placeholder="e.g. Asha or 98765..."
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </Field>
          </div>
          <div className="w-56">
            <Field label="Role">
              <select
                className={inputClass}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as '' | UserRole)
                  setPage(0)
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
      {query.isSuccess && items.length === 0 && <Alert kind="info">No users found.</Alert>}

      <div className="space-y-3">
        {items.map((u) => (
          <Card key={u.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900 dark:text-white">{u.full_name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {u.phone}
                  {u.email ? ` · ${u.email}` : ''}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                  User ID {u.id} · DOB {formatDate(u.dob)} · Joined {formatDate(u.created_at)} · Updated{' '}
                  {formatDate(u.updated_at)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={ROLE_TONES[u.role]}>{u.role}</Badge>
                {!u.is_active && <Badge tone="red">Inactive</Badge>}
              </div>
            </div>

            {u.role === 'USER' && (
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Patient members ({u.patient_members.length})
                </div>
                {u.patient_members.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    No patient profiles created under this account yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {u.patient_members.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{m.relation_name || u.full_name}</span>
                          <span className="text-slate-400">·</span>
                          <span>{labelOf(RELATIONSHIPS, m.relation_type)}</span>
                          {m.age && <span className="text-slate-500">· {m.age} yrs</span>}
                          {m.gender && <span className="text-slate-500">· {m.gender}</span>}
                          {m.is_primary && <Badge tone="blue">Primary</Badge>}
                          {m.image && <Badge tone="gray">Has photo</Badge>}
                          <span className="ml-auto text-xs text-slate-400">Patient ID {m.id}</span>
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                          <span>
                            Address: {[m.address, m.city, m.state, m.pincode].filter(Boolean).join(', ') || '-'}
                          </span>
                          <span>
                            Emergency contact: {m.emergency_contact_name || '-'}
                            {m.emergency_contact_phone ? ` (${m.emergency_contact_phone})` : ''}
                          </span>
                          <span>Preferred language: {m.preferred_language}</span>
                          <span>
                            Notifications: Email {m.notification_preference_email ? 'on' : 'off'}, SMS{' '}
                            {m.notification_preference_sms ? 'on' : 'off'}
                          </span>
                          <span>Created: {formatDate(m.created_at)}</span>
                          <span>Updated: {formatDate(m.updated_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

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
