import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  ApiEnvelope,
  ImageUploadResult,
  PatientCreateRequest,
  PatientDeleteResult,
  PatientProfile,
  PatientUpdateRequest,
} from './types'

export async function getPatientProfiles(): Promise<PatientProfile[]> {
  const res = await api.get<ApiEnvelope<PatientProfile[]>>(ENDPOINTS.patient.profiles, {
    params: { skip: 0, limit: 100 },
  })
  return res.data.data
}

export async function getPatientProfile(patientId: number): Promise<PatientProfile> {
  const res = await api.get<ApiEnvelope<PatientProfile>>(ENDPOINTS.patient.profile(patientId))
  return res.data.data
}

export async function getPrimaryPatient(): Promise<PatientProfile> {
  const res = await api.get<ApiEnvelope<PatientProfile>>(ENDPOINTS.patient.primary)
  return res.data.data
}

export async function createPatientProfile(body: PatientCreateRequest): Promise<PatientProfile> {
  const res = await api.post<ApiEnvelope<PatientProfile>>(ENDPOINTS.patient.create, body)
  return res.data.data
}

export async function updatePatientProfile(
  patientId: number,
  body: PatientUpdateRequest,
): Promise<PatientProfile> {
  const res = await api.put<ApiEnvelope<PatientProfile>>(ENDPOINTS.patient.update(patientId), body)
  return res.data.data
}

export async function setPrimaryPatient(patientId: number): Promise<PatientProfile> {
  const res = await api.post<ApiEnvelope<PatientProfile>>(ENDPOINTS.patient.setPrimary(patientId))
  return res.data.data
}

export async function deletePatientProfile(patientId: number): Promise<PatientDeleteResult> {
  const res = await api.delete<ApiEnvelope<PatientDeleteResult>>(ENDPOINTS.patient.remove(patientId))
  return res.data.data
}

export async function uploadPatientImage(patientId: number, file: File): Promise<ImageUploadResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<ApiEnvelope<ImageUploadResult>>(ENDPOINTS.patient.uploadImage(patientId), form)
  return res.data.data
}

export async function deletePatientImage(patientId: number): Promise<void> {
  await api.delete(ENDPOINTS.patient.deleteImage(patientId))
}
