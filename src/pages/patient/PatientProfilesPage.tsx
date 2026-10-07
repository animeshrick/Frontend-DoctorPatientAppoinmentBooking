import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../api/client'
import {
  deletePatientImage,
  deletePatientProfile,
  getPatientProfiles,
  setPrimaryPatient,
  uploadPatientImage,
} from '../../api/patients'
import type { PatientProfile } from '../../api/types'
import { Alert, Badge, Button, Card, PageHeader, Spinner } from '../../components/ui'
import { GENDERS, LANGUAGES, labelOf, patientLabel } from '../../lib/labels'
import { PatientForm } from './PatientForm'

export default function PatientProfilesPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create' | { editId: number }>('list')
  const [actionError, setActionError] = useState<string | null>(null)

  const profilesQuery = useQuery({ queryKey: ['patient-profiles'], queryFn: getPatientProfiles })
  const profiles = profilesQuery.data ?? []

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['patient-profiles'] })
  const mutationOptions = {
    onMutate: () => setActionError(null),
    onSuccess: refresh,
    onError: (error: unknown) => setActionError(getErrorMessage(error)),
  }

  const setPrimaryMutation = useMutation({ mutationFn: setPrimaryPatient, ...mutationOptions })
  const deleteMutation = useMutation({ mutationFn: deletePatientProfile, ...mutationOptions })
  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadPatientImage(id, file),
    ...mutationOptions,
  })
  const deleteImageMutation = useMutation({ mutationFn: deletePatientImage, ...mutationOptions })

  const busy =
    setPrimaryMutation.isPending ||
    deleteMutation.isPending ||
    uploadMutation.isPending ||
    deleteImageMutation.isPending

  const handleDelete = (patient: PatientProfile) => {
    const warning =
      patient.is_primary && profiles.length > 1
        ? 'This is the primary profile. Deleting it also deletes ALL family member profiles. Continue?'
        : `Delete the profile "${patientLabel(patient)}"?`
    if (window.confirm(warning)) deleteMutation.mutate(patient.id)
  }

  const editing = typeof mode === 'object' ? profiles.find((p) => p.id === mode.editId) : undefined

  return (
    <>
      <PageHeader
        title="Family profiles"
        subtitle="One account can hold a profile for you and for each family member."
        action={mode === 'list' && <Button onClick={() => setMode('create')}>Add profile</Button>}
      />

      {actionError && (
        <div className="mb-4">
          <Alert kind="error">{actionError}</Alert>
        </div>
      )}

      {mode === 'create' && (
        <Card className="mb-6">
          <h2 className="mb-4 text-base font-semibold">New profile</h2>
          <PatientForm
            isFirstProfile={profiles.length === 0}
            onDone={() => setMode('list')}
            onCancel={() => setMode('list')}
          />
        </Card>
      )}

      {editing && (
        <Card className="mb-6">
          <h2 className="mb-4 text-base font-semibold">Edit profile: {patientLabel(editing)}</h2>
          <PatientForm
            key={editing.id}
            patient={editing}
            onDone={() => setMode('list')}
            onCancel={() => setMode('list')}
          />
        </Card>
      )}

      {profilesQuery.isPending && <Spinner />}
      {profilesQuery.isError && <Alert kind="error">{getErrorMessage(profilesQuery.error)}</Alert>}

      {profilesQuery.isSuccess && profiles.length === 0 && mode === 'list' && (
        <Alert kind="info">
          You have no patient profile yet. Add one to start booking appointments. The first profile becomes your
          primary profile.
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((patient) => (
          <Card key={patient.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{patientLabel(patient)}</h3>
                <p className="text-xs text-slate-500">Profile ID {patient.id}</p>
              </div>
              {patient.is_primary && <Badge tone="green">Primary</Badge>}
            </div>

            <dl className="mt-3 space-y-1 text-sm text-slate-700">
              <div>Age: {patient.age ?? '-'}</div>
              <div>Gender: {patient.gender ? labelOf(GENDERS, patient.gender) : '-'}</div>
              <div>
                Address: {[patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ') || '-'}
              </div>
              <div>
                Emergency contact:{' '}
                {[patient.emergency_contact_name, patient.emergency_contact_phone].filter(Boolean).join(', ') || '-'}
              </div>
              <div>Language: {labelOf(LANGUAGES, patient.preferred_language)}</div>
              <div>Photo: {patient.image ? 'Uploaded' : 'None'}</div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" disabled={busy} onClick={() => setMode({ editId: patient.id })}>
                Edit
              </Button>
              {!patient.is_primary && (
                <Button variant="secondary" disabled={busy} onClick={() => setPrimaryMutation.mutate(patient.id)}>
                  Set as primary
                </Button>
              )}
              <label
                className={
                  'inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 ' +
                  'text-sm font-medium text-slate-700 hover:bg-slate-100 ' +
                  (busy ? 'pointer-events-none opacity-60' : '')
                }
              >
                {patient.image ? 'Replace photo' : 'Upload photo'}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadMutation.mutate({ id: patient.id, file })
                    e.target.value = ''
                  }}
                />
              </label>
              {patient.image && (
                <Button variant="secondary" disabled={busy} onClick={() => deleteImageMutation.mutate(patient.id)}>
                  Remove photo
                </Button>
              )}
              <Button variant="danger" disabled={busy} onClick={() => handleDelete(patient)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
