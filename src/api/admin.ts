import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  AdminAppointmentItem,
  AdminAppointmentListResponse,
  AdminAppointmentQuery,
  AdminDashboardSummary,
  AdminDoctorListResponse,
  AdminDoctorQuery,
  AdminPatientListResponse,
  AdminPatientQuery,
  ApiEnvelope,
  Appointment,
} from './types'

export interface ApiResult<T> {
  data: T
  message: string
}

export async function getAdminDashboard(): Promise<AdminDashboardSummary> {
  const res = await api.get<ApiEnvelope<AdminDashboardSummary>>(ENDPOINTS.admin.dashboard)
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

// Re-exported so page components only need one import for the row type.
export type { AdminAppointmentItem }
