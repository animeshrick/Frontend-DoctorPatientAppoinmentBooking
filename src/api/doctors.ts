import { api, getErrorStatus } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  ApiEnvelope,
  Availability,
  AvailabilityRequest,
  DoctorProfile,
  DoctorProfileRequest,
  DoctorPublicProfile,
  Holiday,
  HolidayCreateRequest,
  HolidayList,
  HolidayUpdateRequest,
  ImageUploadResult,
} from './types'

/** The logged-in doctor's own full profile. Returns null if it has not been created yet. */
export async function getMyDoctorProfile(): Promise<DoctorProfile | null> {
  try {
    const res = await api.get<ApiEnvelope<DoctorProfile>>(ENDPOINTS.doctors.profile)
    return res.data.data
  } catch (error) {
    if (getErrorStatus(error) === 404) return null
    throw error
  }
}

/** Public view of any doctor, looked up by doctor ID. */
export async function getDoctorPublicProfile(doctorId: number): Promise<DoctorPublicProfile> {
  const res = await api.get<ApiEnvelope<DoctorPublicProfile>>(ENDPOINTS.doctors.profile, {
    params: { doctor_id: doctorId },
  })
  return res.data.data
}

export async function saveDoctorProfile(body: DoctorProfileRequest): Promise<DoctorProfile> {
  const res = await api.post<ApiEnvelope<DoctorProfile>>(ENDPOINTS.doctors.completeProfile, body)
  return res.data.data
}

export async function uploadDoctorImage(file: File): Promise<ImageUploadResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<ApiEnvelope<ImageUploadResult>>(ENDPOINTS.doctors.uploadImage, form)
  return res.data.data
}

export async function deleteDoctorImage(): Promise<void> {
  await api.delete(ENDPOINTS.doctors.deleteImage)
}

export async function getMyAvailability(): Promise<Availability[]> {
  const res = await api.get<ApiEnvelope<Availability[]>>(ENDPOINTS.doctors.myAvailability)
  return res.data.data
}

export async function setMyAvailability(body: AvailabilityRequest): Promise<Availability> {
  const res = await api.post<ApiEnvelope<Availability>>(ENDPOINTS.doctors.myAvailability, body)
  return res.data.data
}

export async function getDoctorAvailability(doctorId: number): Promise<Availability[]> {
  const res = await api.get<ApiEnvelope<Availability[]>>(ENDPOINTS.doctors.availability(doctorId))
  return res.data.data
}

export interface HolidayQuery {
  from_date?: string
  to_date?: string
  skip?: number
  limit?: number
}

export async function getMyHolidays(params: HolidayQuery): Promise<HolidayList> {
  const res = await api.get<ApiEnvelope<HolidayList>>(ENDPOINTS.doctors.myHolidays, { params })
  return res.data.data
}

export async function createHoliday(body: HolidayCreateRequest): Promise<Holiday> {
  const res = await api.post<ApiEnvelope<Holiday>>(ENDPOINTS.doctors.myHolidays, body)
  return res.data.data
}

export async function getHoliday(holidayId: number): Promise<Holiday> {
  const res = await api.get<ApiEnvelope<Holiday>>(ENDPOINTS.doctors.holiday(holidayId))
  return res.data.data
}

export async function updateHoliday(holidayId: number, body: HolidayUpdateRequest): Promise<Holiday> {
  const res = await api.put<ApiEnvelope<Holiday>>(ENDPOINTS.doctors.holiday(holidayId), body)
  return res.data.data
}

export async function deleteHoliday(holidayId: number): Promise<void> {
  await api.delete(ENDPOINTS.doctors.holiday(holidayId))
}
