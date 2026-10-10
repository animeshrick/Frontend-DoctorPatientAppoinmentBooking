import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  AdminAppointmentItem,
  AdminAppointmentListResponse,
  AdminAppointmentQuery,
  AdminDashboardSummary,
  AdminDeletionRequestItem,
  AdminDeletionRequestListResponse,
  AdminDeletionRequestQuery,
  AdminDoctorItem,
  AdminDoctorListResponse,
  AdminDoctorQuery,
  AdminDoctorUpdateRequest,
  AdminPatientItem,
  AdminPatientListResponse,
  AdminPatientQuery,
  AdminPatientUpdateRequest,
  AdminRejectDeletionRequest,
  AdminUserListResponse,
  AdminUserQuery,
  ApiEnvelope,
  Appointment,
  Availability,
  AvailabilityRequest,
  Holiday,
  HolidayCreateRequest,
  HolidayList,
  HolidayUpdateRequest,
} from './types'

export interface ApiResult<T> {
  data: T
  message: string
}

export async function getAdminDashboard(): Promise<AdminDashboardSummary> {
  const res = await api.get<ApiEnvelope<AdminDashboardSummary>>(ENDPOINTS.admin.dashboard)
  return res.data.data
}

export async function getAdminUsers(params: AdminUserQuery): Promise<AdminUserListResponse> {
  const res = await api.get<ApiEnvelope<AdminUserListResponse>>(ENDPOINTS.admin.users, { params })
  return res.data.data
}

export async function getAdminPatients(params: AdminPatientQuery): Promise<AdminPatientListResponse> {
  const res = await api.get<ApiEnvelope<AdminPatientListResponse>>(ENDPOINTS.admin.patients, { params })
  return res.data.data
}

export async function getAdminDoctors(params: AdminDoctorQuery): Promise<AdminDoctorListResponse> {
  const res = await api.get<ApiEnvelope<AdminDoctorListResponse>>(ENDPOINTS.admin.doctors, { params })
  return res.data.data
}

export async function getAdminAppointments(params: AdminAppointmentQuery): Promise<AdminAppointmentListResponse> {
  const res = await api.get<ApiEnvelope<AdminAppointmentListResponse>>(ENDPOINTS.admin.appointments, { params })
  return res.data.data
}

/** The response message can carry a late-cancellation warning, so it is returned too. */
export async function adminCancelAppointment(
  appointmentId: number,
  cancellationReason: string | null,
): Promise<ApiResult<Appointment>> {
  const res = await api.put<ApiEnvelope<Appointment>>(ENDPOINTS.admin.cancelAppointment(appointmentId), {
    cancellation_reason: cancellationReason,
  })
  return { data: res.data.data, message: res.data.message }
}

export async function adminRescheduleAppointment(appointmentId: number, newDate: string): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>(ENDPOINTS.admin.rescheduleAppointment(appointmentId), {
    new_date: newDate,
  })
  return res.data.data
}

export async function adminUpdateAppointmentNotes(appointmentId: number, notes: string): Promise<Appointment> {
  const res = await api.put<ApiEnvelope<Appointment>>(ENDPOINTS.admin.appointmentNotes(appointmentId), { notes })
  return res.data.data
}

export async function adminCompleteAppointment(appointmentId: number): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>(ENDPOINTS.admin.completeAppointment(appointmentId))
  return res.data.data
}

export async function adminMarkAppointmentNoShow(appointmentId: number): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>(ENDPOINTS.admin.noShowAppointment(appointmentId))
  return res.data.data
}

export async function adminUpdatePatient(
  patientId: number,
  body: AdminPatientUpdateRequest,
): Promise<AdminPatientItem> {
  const res = await api.put<ApiEnvelope<AdminPatientItem>>(ENDPOINTS.admin.patient(patientId), body)
  return res.data.data
}

export async function adminUpdateDoctor(
  doctorId: number,
  body: AdminDoctorUpdateRequest,
): Promise<AdminDoctorItem> {
  const res = await api.put<ApiEnvelope<AdminDoctorItem>>(ENDPOINTS.admin.doctor(doctorId), body)
  return res.data.data
}

export async function adminVerifyDoctor(doctorId: number): Promise<AdminDoctorItem> {
  const res = await api.post<ApiEnvelope<AdminDoctorItem>>(ENDPOINTS.admin.verifyDoctor(doctorId))
  return res.data.data
}

export async function getAdminDeletionRequests(
  params: AdminDeletionRequestQuery,
): Promise<AdminDeletionRequestListResponse> {
  const res = await api.get<ApiEnvelope<AdminDeletionRequestListResponse>>(ENDPOINTS.admin.deletionRequests, {
    params,
  })
  return res.data.data
}

export async function adminApproveDeletionRequest(requestId: number): Promise<AdminDeletionRequestItem> {
  const res = await api.post<ApiEnvelope<AdminDeletionRequestItem>>(ENDPOINTS.admin.approveDeletionRequest(requestId))
  return res.data.data
}

export async function adminRejectDeletionRequest(
  requestId: number,
  body: AdminRejectDeletionRequest,
): Promise<AdminDeletionRequestItem> {
  const res = await api.post<ApiEnvelope<AdminDeletionRequestItem>>(
    ENDPOINTS.admin.rejectDeletionRequest(requestId),
    body,
  )
  return res.data.data
}

/** Every weekly slot for a doctor, active and inactive - unlike the
 * doctor's own GET, which only returns active slots. */
export async function getAdminDoctorAvailability(doctorId: number): Promise<Availability[]> {
  const res = await api.get<ApiEnvelope<Availability[]>>(ENDPOINTS.admin.doctorAvailability(doctorId))
  return res.data.data
}

export async function adminSetDoctorAvailability(
  doctorId: number,
  body: AvailabilityRequest,
): Promise<Availability> {
  const res = await api.put<ApiEnvelope<Availability>>(ENDPOINTS.admin.doctorAvailability(doctorId), body)
  return res.data.data
}

/** Capability doctors don't even have for themselves - their own API has no
 * delete for availability, only an upsert. */
export async function adminDeleteDoctorAvailability(doctorId: number, availabilityId: number): Promise<void> {
  await api.delete(ENDPOINTS.admin.doctorAvailabilityItem(doctorId, availabilityId))
}

export async function getAdminDoctorHolidays(doctorId: number): Promise<HolidayList> {
  const res = await api.get<ApiEnvelope<HolidayList>>(ENDPOINTS.admin.doctorHolidays(doctorId))
  return res.data.data
}

export async function adminCreateDoctorHoliday(doctorId: number, body: HolidayCreateRequest): Promise<Holiday> {
  const res = await api.post<ApiEnvelope<Holiday>>(ENDPOINTS.admin.doctorHolidays(doctorId), body)
  return res.data.data
}

export async function adminUpdateDoctorHoliday(
  doctorId: number,
  holidayId: number,
  body: HolidayUpdateRequest,
): Promise<Holiday> {
  const res = await api.put<ApiEnvelope<Holiday>>(ENDPOINTS.admin.doctorHoliday(doctorId, holidayId), body)
  return res.data.data
}

export async function adminDeleteDoctorHoliday(doctorId: number, holidayId: number): Promise<void> {
  await api.delete(ENDPOINTS.admin.doctorHoliday(doctorId, holidayId))
}

// Re-exported so page components only need one import for the row type.
export type { AdminAppointmentItem }
