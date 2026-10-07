import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Button, Card, Field, PageHeader, inputClass } from '../../components/ui'
import { parseId } from '../../lib/ids'
import { DoctorSummary } from './DoctorSummary'
import { useDoctor } from './useDoctor'

export default function FindDoctorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const doctorId = parseId(searchParams.get('id'))
  const [input, setInput] = useState(doctorId ? String(doctorId) : '')
  const [inputError, setInputError] = useState<string | null>(null)
  const { profile } = useDoctor(doctorId)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const id = parseId(input.trim())
    if (id === null) {
      setInputError('Enter a doctor ID (a whole number above 0).')
      return
    }
    setInputError(null)
    setSearchParams({ id: String(id) })
  }

  return (
    <>
      <PageHeader title="Find a doctor" subtitle="Look up a doctor by their doctor ID." />

      <div className="mb-4">
        <Alert kind="info">
          The backend does not have a doctor list or search yet, so a doctor can only be opened by ID. Doctors can
          see their ID on their profile page.
        </Alert>
      </div>

      <Card className="mb-6">
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Field label="Doctor ID" error={inputError ?? undefined}>
              <input
                className={inputClass}
                inputMode="numeric"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </Field>
          </div>
          <Button type="submit">Look up</Button>
        </form>
      </Card>

      {doctorId !== null && (
        <>
          <DoctorSummary doctorId={doctorId} />
          {profile.isSuccess && (
            <div className="mt-4">
              <Link
                to={`/patient/book?doctor_id=${doctorId}`}
                className="inline-flex rounded-md bg-teal-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Book an appointment with this doctor
              </Link>
            </div>
          )}
        </>
      )}
    </>
  )
}
