import { api } from './client'
import type { ApiEnvelope } from './types'

export interface PublicDoctor {
  id: number
  full_name: string
  years_of_experience: number | null
}

export interface PublicSpeciality {
  specialization: string
  doctor_count: number
  doctors: PublicDoctor[]
}

/** Specialities that have approved doctors (no login needed). */
export async function getPublicSpecialities(): Promise<PublicSpeciality[]> {
  const res = await api.get<ApiEnvelope<{ items: PublicSpeciality[] }>>('/public/specialities')
  return res.data.data.items
}
