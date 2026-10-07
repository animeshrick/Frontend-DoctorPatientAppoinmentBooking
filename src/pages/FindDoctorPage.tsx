import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Field, PageHeader, Spinner, inputClass, EmptyState } from '../components/ui'
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

  // For name/specialization search - this would call a backend endpoint
  // For now, we'll show the search UI and assume the backend will support it
  const [mockSearchResults, setMockSearchResults] = useState<any[]>([])

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
      // TODO: Call backend search endpoint
      // For now, this is a placeholder
    } else if (searchBy === 'specialization') {
      if (!trimmedInput) {
        setInputError('Select a specialization.')
        return
      }
      setInputError(null)
      setSearchParams({ type: 'specialization', q: trimmedInput })
      // TODO: Call backend search endpoint
      // For now, this is a placeholder
    }
  }

  const handleSearchTypeChange = (type: 'id' | 'name' | 'specialization') => {
    setSearchBy(type)
    setInput('')
    setInputError(null)
    setSearchParams({})
    setMockSearchResults([])
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
                  setMockSearchResults([])
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

      {searchBy === 'name' && searchParams.get('q') && (
        <Alert kind="info">
          Doctor search by name is coming soon. For now, please use the Doctor ID search. Doctors can find their ID on their profile page.
        </Alert>
      )}

      {searchBy === 'specialization' && searchParams.get('q') && (
        <Alert kind="info">
          Doctor search by specialization is coming soon. For now, please use the Doctor ID search. Doctors can find their ID on their profile page.
        </Alert>
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
