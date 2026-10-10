import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminUpdateDoctor, adminVerifyDoctor, getAdminDoctors } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { AdminDoctorItem, AdminDoctorUpdateRequest, DoctorProfileStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'

const PAGE_SIZE = 20
const COLUMN_COUNT = 8

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

const STATUS_OPTIONS: DoctorProfileStatus[] = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED']

export default function AdminDoctorsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState('')
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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

  const afterChange = async (message: string) => {
    setEditingId(null)
    setNotice(message)
    await queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
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

      {notice && (
        <div className="mb-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}

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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((d) => (
                <DoctorRow
                  key={d.id}
                  doctor={d}
                  editing={editingId === d.id}
                  onEdit={() => {
                    setNotice(null)
                    setEditingId(editingId === d.id ? null : d.id)
                  }}
                  onChanged={afterChange}
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

function DoctorRow({
  doctor: d,
  editing,
  onEdit,
  onChanged,
}: {
  doctor: AdminDoctorItem
  editing: boolean
  onEdit: () => void
  onChanged: (message: string) => Promise<void>
}) {
  // status is the source of truth for "verified" - a doctor profile is auto-created
  // as APPROVED, and verified_at is only ever stamped by an explicit verify action,
  // so basing this on verified_at alone would show every doctor as unverified.
  const isVerified = d.status === 'APPROVED'

  const verifyMutation = useMutation({
    mutationFn: () => adminVerifyDoctor(d.id),
    onSuccess: () => onChanged(`${d.owner_full_name} marked as verified.`),
  })

  return (
    <>
      <tr>
        <td className="px-4 py-3">
          <div className="font-medium text-slate-900 dark:text-white">{d.owner_full_name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            ID {d.id} · {d.owner_phone}
            {d.owner_email ? ` · ${d.owner_email}` : ''}
          </div>
          {d.registration_number && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Reg #{d.registration_number}
              {d.license_authority ? ` (${d.license_authority})` : ''}
            </div>
          )}
          {d.license_expiry_date && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              License expires {formatDate(d.license_expiry_date)}
            </div>
          )}
          {d.bio && (
            <div className="mt-1 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400" title={d.bio}>
              {d.bio}
            </div>
          )}
          {d.image && <div className="text-xs text-slate-500 dark:text-slate-400">Has photo</div>}
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
        <td className="px-4 py-3">
          <Badge tone={isVerified ? 'green' : 'amber'}>{isVerified ? 'Verified' : 'Not verified'}</Badge>
          {d.verified_at && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(d.verified_at)}</div>}
          {d.verified_by_name && (
            <div className="text-xs text-slate-500 dark:text-slate-400">by {d.verified_by_name}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
            <Link
              to={`/admin/doctors/${d.id}/schedule`}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Schedule
            </Link>
            {!isVerified && (
              <Button size="sm" loading={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
                Verify
              </Button>
            )}
          </div>
        </td>
      </tr>
      {verifyMutation.isError && (
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-4 pb-3">
            <Alert kind="error">{getErrorMessage(verifyMutation.error)}</Alert>
          </td>
        </tr>
      )}
      {editing && (
        <tr>
          <td colSpan={COLUMN_COUNT} className="bg-slate-50 px-4 py-4 dark:bg-slate-900/40">
            <DoctorEditForm doctor={d} onClose={onEdit} onChanged={onChanged} />
          </td>
        </tr>
      )}
    </>
  )
}

function DoctorEditForm({
  doctor,
  onClose,
  onChanged,
}: {
  doctor: AdminDoctorItem
  onClose: () => void
  onChanged: (message: string) => Promise<void>
}) {
  const [form, setForm] = useState({
    specialization: doctor.specialization ?? '',
    years_of_experience: doctor.years_of_experience?.toString() ?? '',
    consultation_fee: doctor.consultation_fee ?? '',
    is_accepting_appointments: doctor.is_accepting_appointments,
    status: doctor.status,
    registration_number: doctor.registration_number ?? '',
    license_authority: doctor.license_authority ?? '',
    license_expiry_date: doctor.license_expiry_date ?? '',
    bio: doctor.bio ?? '',
  })

  const mutation = useMutation({
    mutationFn: () => {
      const body: AdminDoctorUpdateRequest = {
        specialization: form.specialization.trim() === '' ? null : form.specialization.trim(),
        years_of_experience: form.years_of_experience.trim() === '' ? null : Number(form.years_of_experience),
        consultation_fee: form.consultation_fee.trim() === '' ? null : form.consultation_fee.trim(),
        is_accepting_appointments: form.is_accepting_appointments,
        status: form.status,
        registration_number: form.registration_number.trim() === '' ? null : form.registration_number.trim(),
        license_authority: form.license_authority.trim() === '' ? null : form.license_authority.trim(),
        license_expiry_date: form.license_expiry_date.trim() === '' ? null : form.license_expiry_date.trim(),
        bio: form.bio.trim() === '' ? null : form.bio.trim(),
      }
      return adminUpdateDoctor(doctor.id, body)
    },
    onSuccess: () => onChanged('Doctor profile updated.'),
  })

  return (
    <div className="space-y-3">
      {mutation.isError && <Alert kind="error">{getErrorMessage(mutation.error)}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Specialization">
          <input
            className={inputClass}
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
          />
        </Field>
        <Field label="Years of experience">
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.years_of_experience}
            onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
          />
        </Field>
        <Field label="Consultation fee">
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.consultation_fee}
            onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Accepting appointments">
          <select
            className={inputClass}
            value={form.is_accepting_appointments ? 'yes' : 'no'}
            onChange={(e) => setForm({ ...form, is_accepting_appointments: e.target.value === 'yes' })}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <Field label="Registration number">
          <input
            className={inputClass}
            value={form.registration_number}
            onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
          />
        </Field>
        <Field label="License authority">
          <input
            className={inputClass}
            value={form.license_authority}
            onChange={(e) => setForm({ ...form, license_authority: e.target.value })}
          />
        </Field>
        <Field label="License expiry date">
          <input
            className={inputClass}
            type="date"
            value={form.license_expiry_date}
            onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Bio">
        <textarea
          className={inputClass}
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </Field>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Setting status to Approved here does not stamp a verification date - use the Verify button for that.
      </p>
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
