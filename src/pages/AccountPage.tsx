import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { deleteMyAccount } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, PageHeader, inputClass } from '../components/ui'
import { formatDate } from '../lib/dates'

const ROLE_LABELS = { USER: 'Patient', DOCTOR: 'Doctor', ADMIN: 'Admin' } as const

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmPhone, setConfirmPhone] = useState('')

  const deleteMutation = useMutation({
    mutationFn: (phone: string) => deleteMyAccount(phone),
    onSuccess: () => {
      logout()
      navigate('/login', { replace: true })
    },
  })

  if (!user) return null

  const rows: [string, string][] = [
    ['Name', user.full_name || '-'],
    ['Phone', user.phone || '-'],
    ['Email', user.email || '-'],
    ['Date of birth', /^\d{4}-\d{2}-\d{2}/.test(user.dob) ? formatDate(user.dob) : user.dob || '-'],
    ['Account type', ROLE_LABELS[user.role]],
    // Only show User ID to ADMIN users
    ...(user.role === 'ADMIN' ? ([['User ID', String(user.id)]] as [string, string][]) : []),
  ]

  return (
    <>
      <PageHeader title="Account" subtitle="Manage your account details and preferences." />

      {user.role === 'ADMIN' && (
        <div className="mb-4">
          <Alert kind="info">The backend has no admin screens yet, so only account details are shown here.</Alert>
        </div>
      )}

      <Card>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="mt-1.5 text-sm text-slate-900 dark:text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {user.role !== 'ADMIN' && (
        <Card className="mt-6 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Delete account</h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            This permanently deletes your account and cannot be undone. Type your phone number ({user.phone}) to
            confirm.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Field label="Phone number" required>
                <input
                  className={inputClass}
                  value={confirmPhone}
                  onChange={(e) => setConfirmPhone(e.target.value)}
                  placeholder={user.phone}
                />
              </Field>
            </div>
            <Button
              variant="danger"
              disabled={confirmPhone.trim() !== user.phone}
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(user.phone)}
            >
              Delete my account
            </Button>
          </div>
          {deleteMutation.isError && (
            <div className="mt-4">
              <Alert kind="error">{getErrorMessage(deleteMutation.error)}</Alert>
            </div>
          )}
        </Card>
      )}
    </>
  )
}
