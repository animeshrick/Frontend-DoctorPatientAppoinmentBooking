import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, Field, PageHeader, Spinner, inputClass, EmptyState } from '../components/ui'
import { getErrorMessage, getErrorStatus } from '../api/client'
import { searchDoctors } from '../api/doctors'
import { parseId } from '../lib/ids'
import { DoctorSummary } from './patient/DoctorSummary'
import { useDoctor } from './patient/useDoctor'

// Mock specializations - can be fetched from backend if needed
const SPECIALIZATIONS = [
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedist',
  'Psychiatrist',
  'General Practitioner',
  'Pediatrician',
  'Dentist',
]

export default function FindDoctorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchBy, setSearchBy] = useState<'id' | 'name' | 'specialization'>(
    searchParams.get('type') === 'name' || searchParams.get('type') === 'specialization' ? (searchParams.get('type') as any) : 'name'
  )
  const [input, setInput] = useState(searchParams.get('q') || '')
  const [inputError, setInputError] = useState<string | null>(null)

  // For ID search
  const doctorIdParam = searchBy === 'id' ? parseId(searchParams.get('q')) : null
  const { profile: doctorProfile } = useDoctor(doctorIdParam)

  // For name/specialization search
  const searchType = searchParams.get('type')
  const searchQuery = searchParams.get('q')
  const nameQuery = searchType === 'name' ? searchQuery : null
  const specializationQuery = searchType === 'specialization' ? searchQuery : null

  const doctorsQuery = useQuery({
    queryKey: ['doctor-search', nameQuery, specializationQuery],
    queryFn: () =>
      searchDoctors({
        name: nameQuery ?? undefined,
        specialization: specializationQuery ?? undefined,
        skip: 0,
        limit: 20,
      }),
    enabled: nameQuery !== null || specializationQuery !== null,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()

    if (searchBy === 'id') {
      const id = parseId(trimmedInput)
      if (id === null) {
        setInputError('Enter a doctor ID (a whole number above 0).')
        return
      }
      setInputError(null)
      setSearchParams({ type: 'id', q: String(id) })
    } else if (searchBy === 'name') {
      if (trimmedInput.length < 2) {
        setInputError('Enter at least 2 characters.')
        return
      }
      setInputError(null)
      setSearchParams({ type: 'name', q: trimmedInput })
    } else if (searchBy === 'specialization') {
      if (!trimmedInput) {
        setInputError('Select a specialization.')
        return
      }
      setInputError(null)
      setSearchParams({ type: 'specialization', q: trimmedInput })
    }
  }

  const handleSearchTypeChange = (type: 'id' | 'name' | 'specialization') => {
    setSearchBy(type)
    setInput('')
    setInputError(null)
    setSearchParams({})
  }

  return (
    <>
      <PageHeader title="Find a doctor" subtitle="Search for doctors by ID, name, or specialization." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {['id', 'name', 'specialization'].map((type) => (
          <button
            key={type}
            onClick={() => handleSearchTypeChange(type as any)}
            className={`rounded-lg border-2 px-4 py-3 text-left font-medium transition-all ${
              searchBy === type
                ? 'border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-400 dark:bg-teal-900/20 dark:text-teal-200'
                : 'border-slate-300 bg-white text-slate-700 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-600'
            }`}
          >
            {type === 'id' && '🔢 Search by ID'}
            {type === 'name' && '👤 Search by Name'}
            {type === 'specialization' && '⚕️ Search by Specialization'}
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {searchBy === 'id' && (
            <Field label="Doctor ID" error={inputError ?? undefined} hint="Enter your doctor's unique ID number">
              <input
                className={inputClass}
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 1, 2, 3"
              />
            </Field>
          )}

          {searchBy === 'name' && (
            <Field label="Doctor Name" error={inputError ?? undefined} hint="Search by first or last name">
              <input
                className={inputClass}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., D Chatterjee, John Smith"
              />
            </Field>
          )}

          {searchBy === 'specialization' && (
            <Field label="Specialization" error={inputError ?? undefined} hint="Select a medical specialization">
              <select className={inputClass} value={input} onChange={(e) => setInput(e.target.value)}>
                <option value="">-- Select a specialization --</option>
                {SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit">Search</Button>
            {searchParams.size > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setInput('')
                  setSearchParams({})
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        </form>
      </Card>

      {searchBy === 'id' && doctorIdParam !== null && (
        <>
          {doctorProfile.isPending && <Spinner />}
          {doctorProfile.isError && <Alert kind="error">Doctor not found or an error occurred.</Alert>}
          {doctorProfile.isSuccess && (
            <>
              <DoctorSummary doctorId={doctorIdParam} />
              {doctorProfile.data && (
                <div className="mt-5 flex gap-3">
                  <Link
                    to={`/patient/book?doctor_id=${doctorIdParam}`}
                    className="inline-flex rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
                  >
                    Book an appointment with this doctor
                  </Link>
                </div>
              )}
            </>
          )}
        </>
      )}

      {(searchBy === 'name' || searchBy === 'specialization') && (nameQuery !== null || specializationQuery !== null) && (
        <>
          {doctorsQuery.isPending && <Spinner />}

          {doctorsQuery.isError && (
            <Alert kind="error">
              {getErrorStatus(doctorsQuery.error) === 422
                ? 'Enter a name or specialization to search by.'
                : getErrorMessage(doctorsQuery.error)}
            </Alert>
          )}

          {doctorsQuery.isSuccess && doctorsQuery.data.items.length === 0 && (
            <EmptyState
              title="No doctors found"
              description={
                searchBy === 'name'
                  ? `No doctors matched "${searchQuery}". Try a different spelling or search by specialization.`
                  : `No doctors found for "${searchQuery}".`
              }
            />
          )}

          {doctorsQuery.isSuccess && doctorsQuery.data.items.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found {doctorsQuery.data.total} doctor{doctorsQuery.data.total !== 1 ? 's' : ''}.
              </p>
              {doctorsQuery.data.items.map((doctor) => (
                <Card key={doctor.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{doctor.full_name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {doctor.specialization || 'Specialization not provided'} · Doctor ID {doctor.id}
                        {doctor.years_of_experience !== null && ` · ${doctor.years_of_experience} years experience`}
                      </p>
                      {doctor.consultation_fee !== null && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          Consultation fee: Rs {doctor.consultation_fee}
                        </p>
                      )}
                    </div>
                    {doctor.is_accepting_appointments ? (
                      <Badge tone="green">Accepting appointments</Badge>
                    ) : (
                      <Badge tone="red">Not accepting appointments</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/patient/find-doctor?type=id&q=${doctor.id}`}
                      className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      View details
                    </Link>
                    <Link
                      to={`/patient/book?doctor_id=${doctor.id}`}
                      className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
                    >
                      Book an appointment
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!searchParams.get('q') && (
        <EmptyState
          title="No search performed yet"
          description={
            searchBy === 'id'
              ? 'Enter a doctor ID to look up their profile and availability.'
              : searchBy === 'name'
                ? 'Enter a doctor name to search.'
                : 'Select a specialization to find doctors.'
          }
        />
      )}
    </>
  )
}
