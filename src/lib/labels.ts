import type { AppointmentStatus, Gender, Language, PatientProfile, Relationship } from '../api/types'

export const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'self', label: 'Self' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
]

export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'bn', label: 'Bengali' },
]

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No show' },
  { value: 'rescheduled', label: 'Rescheduled' },
]

export const CONSULTATION_TYPES: { value: string; label: string }[] = [
  { value: 'in_person', label: 'In person' },
  { value: 'video', label: 'Video' },
  { value: 'phone', label: 'Phone' },
]

export function labelOf<T extends string>(options: { value: T; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value
}

/** Short display name for a patient profile, e.g. "Asha (Mother)". */
export function patientLabel(patient: PatientProfile): string {
  const relation = labelOf(RELATIONSHIPS, patient.relation_type)
  return patient.relation_name ? `${patient.relation_name} (${relation})` : relation
}
