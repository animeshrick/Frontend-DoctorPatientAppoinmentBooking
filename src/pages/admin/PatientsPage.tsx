import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminUpdatePatient, getAdminPatients } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { AdminPatientItem, AdminPatientUpdateRequest, Gender } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'
import { GENDERS, LANGUAGES, RELATIONSHIPS, labelOf } from '../../lib/labels'

const PAGE_SIZE = 20
const COLUMN_COUNT = 9

export default function AdminPatientsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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

  const afterSave = async () => {
    setEditingId(null)
    setNotice('Patient profile updated.')
    await queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] })
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

      {notice && (
        <div className="mb-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}

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
                <th className="px-4 py-3">Emergency contact</th>
                <th className="px-4 py-3">Notifications</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  editing={editingId === p.id}
                  onEdit={() => {
                    setNotice(null)
                    setEditingId(editingId === p.id ? null : p.id)
                  }}
                  onSaved={afterSave}
                />
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

function PatientRow({
  patient: p,
  editing,
  onEdit,
  onSaved,
}: {
  patient: AdminPatientItem
  editing: boolean
  onEdit: () => void
  onSaved: () => Promise<void>
}) {
  return (
    <>
      <tr>
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
          <div>{[p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ') || '-'}</div>
          {p.image && <div className="text-xs text-slate-500 dark:text-slate-400">Has photo</div>}
        </td>
        <td className="px-4 py-3">
          {p.emergency_contact_name || p.emergency_contact_phone ? (
            <>
              <div>{p.emergency_contact_name || '-'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{p.emergency_contact_phone || '-'}</div>
            </>
          ) : (
            '-'
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <Badge tone={p.notification_preference_email ? 'green' : 'gray'}>
              Email {p.notification_preference_email ? 'on' : 'off'}
            </Badge>
            <Badge tone={p.notification_preference_sms ? 'green' : 'gray'}>
              SMS {p.notification_preference_sms ? 'on' : 'off'}
            </Badge>
          </div>
        </td>
        <td className="px-4 py-3">{p.preferred_language}</td>
        <td className="px-4 py-3">
          <div>{formatDate(p.created_at)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Updated {formatDate(p.updated_at)}</div>
        </td>
        <td className="px-4 py-3">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={COLUMN_COUNT} className="bg-slate-50 px-4 py-4 dark:bg-slate-900/40">
            <PatientEditForm patient={p} onClose={onEdit} onSaved={onSaved} />
          </td>
        </tr>
      )}
    </>
  )
}

function PatientEditForm({
  patient,
  onClose,
  onSaved,
}: {
  patient: AdminPatientItem
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState({
    relation_name: patient.relation_name ?? '',
    age: patient.age ?? '',
    gender: patient.gender ?? '',
    address: patient.address ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    pincode: patient.pincode ?? '',
    emergency_contact_name: patient.emergency_contact_name ?? '',
    emergency_contact_phone: patient.emergency_contact_phone ?? '',
    preferred_language: patient.preferred_language,
    notification_preference_email: patient.notification_preference_email,
    notification_preference_sms: patient.notification_preference_sms,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const body: AdminPatientUpdateRequest = {
        relation_name: form.relation_name.trim() === '' ? null : form.relation_name.trim(),
        age: form.age.trim() === '' ? null : form.age.trim(),
        gender: (form.gender === '' ? null : form.gender) as Gender | null,
        address: form.address.trim() === '' ? null : form.address.trim(),
        city: form.city.trim() === '' ? null : form.city.trim(),
        state: form.state.trim() === '' ? null : form.state.trim(),
        pincode: form.pincode.trim() === '' ? null : form.pincode.trim(),
        emergency_contact_name: form.emergency_contact_name.trim() === '' ? null : form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.trim() === '' ? null : form.emergency_contact_phone.trim(),
        preferred_language: form.preferred_language,
        notification_preference_email: form.notification_preference_email,
        notification_preference_sms: form.notification_preference_sms,
      }
      return adminUpdatePatient(patient.id, body)
    },
    onSuccess: onSaved,
  })

  return (
    <div className="space-y-3">
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Relation name">
          <input
            className={inputClass}
            value={form.relation_name}
            onChange={(e) => setForm({ ...form, relation_name: e.target.value })}
          />
        </Field>
        <Field label="Age">
          <input className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </Field>
        <Field label="Gender">
          <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="">Unspecified</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferred language">
          <select
            className={inputClass}
            value={form.preferred_language}
            onChange={(e) => setForm({ ...form, preferred_language: e.target.value as typeof form.preferred_language })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="State">
          <input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </Field>
        <Field label="Pincode">
          <input
            className={inputClass}
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          />
        </Field>
        <Field label="Address">
          <input
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <Field label="Emergency contact name">
          <input
            className={inputClass}
            value={form.emergency_contact_name}
            onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
          />
        </Field>
        <Field label="Emergency contact phone">
          <input
            className={inputClass}
            value={form.emergency_contact_phone}
            onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.notification_preference_email}
            onChange={(e) => setForm({ ...form, notification_preference_email: e.target.checked })}
          />
          Email notifications
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.notification_preference_sms}
            onChange={(e) => setForm({ ...form, notification_preference_sms: e.target.checked })}
          />
          SMS notifications
        </label>
      </div>
      <div className="flex gap-3">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Save changes
        </Button>
        <Button variant="secondary" disabled={mutation.isPending} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
