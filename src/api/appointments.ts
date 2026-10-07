import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  ApiEnvelope,
  Appointment,
  AppointmentCreateRequest,
  AppointmentFilters,
  AppointmentList,
} from './types'

export interface ApiResult<T> {
  data: T
  message: string
}

export async function bookAppointment(body: AppointmentCreateRequest): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>(ENDPOINTS.appointments.book, body)
  return res.data.data
}

export async function getMyAppointments(filters: AppointmentFilters): Promise<AppointmentList> {
  const res = await api.get<ApiEnvelope<AppointmentList>>(ENDPOINTS.appointments.mine, { params: filters })
  return res.data.data
}

export async function getAppointment(appointmentId: number): Promise<Appointment> {
  const res = await api.get<ApiEnvelope<Appointment>>(ENDPOINTS.appointments.byId(appointmentId))
  return res.data.data
}

/** The response message can carry a late-cancellation warning, so it is returned too. */
export async function cancelAppointment(
  appointmentId: number,
  cancellationReason: string | null,
): Promise<ApiResult<Appointment>> {
  const res = await api.put<ApiEnvelope<Appointment>>(ENDPOINTS.appointments.cancel(appointmentId), {
    cancellation_reason: cancellationReason,
  })
  return { data: res.data.data, message: res.data.message }
}

export async function rescheduleAppointment(appointmentId: number, newDate: string): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>(ENDPOINTS.appointments.reschedule(appointmentId), {
    new_date: newDate,
  })
  return res.data.data
}
