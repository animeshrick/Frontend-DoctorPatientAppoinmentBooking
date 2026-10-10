// Every backend URL used by the app lives in this one file.
// Paths are relative to the API base URL (see src/api/client.ts).

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  user: {
    me: '/user/detailsV2',
    deleteAccount: '/user/delete_account',
  },
  doctors: {
    completeProfile: '/doctors/complete_profile',
    profile: '/doctors/doctor_profile',
    search: '/doctors/search',
    uploadImage: '/doctors/upload_image',
    deleteImage: '/doctors/delete_image',
    myAvailability: '/doctors/me/availability',
    availability: (doctorId: number) => `/doctors/${doctorId}/availability`,
    myHolidays: '/doctors/me/holidays',
    holiday: (holidayId: number) => `/doctors/holidays/${holidayId}`,
  },
  patient: {
    create: '/patient/create',
    profiles: '/patient/profiles',
    profile: (patientId: number) => `/patient/profiles/${patientId}`,
    primary: '/patient/primary',
    update: (patientId: number) => `/patient/update_patient_info/${patientId}`,
    setPrimary: (patientId: number) => `/patient/set_primary/${patientId}`,
    remove: (patientId: number) => `/patient/delete/${patientId}`,
    uploadImage: (patientId: number) => `/patient/upload_image/${patientId}`,
    deleteImage: (patientId: number) => `/patient/delete_image/${patientId}`,
  },
  appointments: {
    book: '/appointments/book',
    mine: '/appointments/my-appointments',
    byId: (appointmentId: number) => `/appointments/${appointmentId}`,
    cancel: (appointmentId: number) => `/appointments/${appointmentId}/cancel`,
    reschedule: (appointmentId: number) => `/appointments/${appointmentId}/reschedule`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    patients: '/admin/patients',
    doctors: '/admin/doctors',
    appointments: '/admin/appointments',
    cancelAppointment: (appointmentId: number) => `/admin/appointments/${appointmentId}/cancel`,
    rescheduleAppointment: (appointmentId: number) => `/admin/appointments/${appointmentId}/reschedule`,
  },
} as const