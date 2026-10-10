import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApproveDeletionRequest, adminRejectDeletionRequest, getAdminDeletionRequests } from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { AdminDeletionRequestItem, DeletionRequestStatus } from '../../api/types'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import { formatDate } from '../../lib/dates'

const PAGE_SIZE = 20

const STATUS_TONES: Record<DeletionRequestStatus, 'green' | 'red' | 'gray' | 'amber' | 'blue'> = {
  PENDING: 'amber',
  APPROVED: 'red',
  REJECTED: 'gray',
}

const STATUS_OPTIONS: { value: '' | DeletionRequestStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved (account deleted)' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
]

export default function AdminDeletionRequestsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'' | DeletionRequestStatus>('PENDING')
  const [page, setPage] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'deletion-requests', status, page],
    queryFn: () =>
      getAdminDeletionRequests({ status: status || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
  })
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  const afterChange = async (message: string) => {
    setNotice(message)
    await queryClient.invalidateQueries({ queryKey: ['admin', 'deletion-requests'] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  return (
    <>
      <PageHeader
        title="Account deletion requests"
        subtitle="A user's own request to delete their account - nothing is deleted until you approve it here."
      />

      <Card className="mb-6">
        <div className="w-56">
          <Field label="Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | DeletionRequestStatus)
                setPage(0)
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {notice && (
        <div className="mb-4">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}

      {query.isPending && <Spinner />}
      {query.isError && <Alert kind="error">{getErrorMessage(query.error)}</Alert>}
      {query.isSuccess && items.length === 0 && <Alert kind="info">No deletion requests found.</Alert>}

      <div className="space-y-3">
        {items.map((r) => (
          <RequestRow key={r.id} request={r} onChanged={afterChange} />
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

function RequestRow({
  request,
  onChanged,
}: {
  request: AdminDeletionRequestItem
  onChanged: (message: string) => Promise<void>
}) {
  const [showReject, setShowReject] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const approveMutation = useMutation({
    mutationFn: () => adminApproveDeletionRequest(request.id),
    onSuccess: () => onChanged(`${request.user_full_name}'s account was deleted.`),
  })
  const rejectMutation = useMutation({
    mutationFn: () => adminRejectDeletionRequest(request.id, { admin_note: adminNote.trim() || null }),
    onSuccess: () => onChanged(`Deletion request from ${request.user_full_name} was rejected.`),
  })

  const isPending = request.status === 'PENDING'

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-900 dark:text-white">{request.user_full_name}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {request.user_phone} · {request.user_role === 'USER' ? 'Patient' : 'Doctor'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Requested {formatDate(request.created_at)}
            {request.user_id === null && ' · account no longer exists'}
          </div>
        </div>
        <Badge tone={STATUS_TONES[request.status]}>{request.status}</Badge>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <span className="font-medium text-slate-500 dark:text-slate-400">Reason: </span>
        {request.reason}
      </div>

      {request.admin_note && (
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium">Admin note: </span>
          {request.admin_note}
        </div>
      )}

      {isPending && (
        <>
          {(approveMutation.isError || rejectMutation.isError) && (
            <div className="mt-3">
              <Alert kind="error">{getErrorMessage(approveMutation.error ?? rejectMutation.error)}</Alert>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="danger"
              loading={approveMutation.isPending}
              onClick={() => {
                if (window.confirm(`Permanently delete ${request.user_full_name}'s account? This cannot be undone.`)) {
                  approveMutation.mutate()
                }
              }}
            >
              Approve & delete account
            </Button>
            <Button variant="secondary" onClick={() => setShowReject((v) => !v)}>
              {showReject ? 'Cancel' : 'Reject'}
            </Button>
          </div>

          {showReject && (
            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <Field label="Note to keep with this request (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  maxLength={500}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </Field>
              <Button variant="secondary" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
                Confirm rejection
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
