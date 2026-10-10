// Types that mirror the backend's Pydantic schemas and enums.

export type UserRole = 'DOCTOR' | 'USER' | 'ADMIN'
export type DeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type DoctorProfileStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type Language = 'en' | 'hi' | 'bn'
export type Gender = 'male' | 'female' | 'other'
export type Relationship = 'self' | 'mother' | 'father' | 'spouse' | 'child' | 'other'
export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled'

/** Most endpoints wrap their result like this. */
export interface ApiEnvelope<T> {
  status_code: number
  message: string
  data: T
}

// ---------- Auth / user ----------
export interface LoginRequest {
  phone: string
  password: string
  email?: string | null
}
export interface LoginResponse {
  access_token: string
  token_type: string
}
export interface RegisterRequest {
  phone: string
  password: string
  full_name: string
  email: string
  dob: string
  role: Exclude<UserRole, 'ADMIN'>
}
/** Used by /auth/admin/register - no role field, it is always ADMIN. */
export interface AdminRegisterRequest {
  phone: string
  password: string
  full_name: string
  email: string
  dob: string
}

export interface RegisterResponse {
  id: number
  phone: string
  msg: string
  access_token: string
  token_type: string
  role: UserRole
}
export interface User {
  id: number
  email: string
  phone: string
  dob: string
  full_name: string
  is_active: boolean
  role: UserRole
}
export interface DeleteAccountResponse {
  deleted_count: number
  message: string
  /** True when a non-admin's request was filed for admin review instead of
   * being deleted immediately. */
  pending_approval: boolean
  request_id: number | null
}

// ---------- Doctors ----------
export interface DoctorProfileRequest {
  email?: string | null
  dob?: string | null
  full_name?: string | null
  registration_number?: string | null
  license_authority?: string | null
  license_expiry_date?: string | null
  years_of_experience?: number | null
  specialization?: string | null
  bio?: string | null
  consultation_fee?: string | null
  is_accepting_appointments: boolean
}
export interface DoctorProfile {
  id: number
  user_id: number
  full_name: string | null
  email: string | null
  dob: string | null
  image: string | null
  status: DoctorProfileStatus
  registration_number: string | null
  license_authority: string | null
  license_expiry_date: string | null
  years_of_experience: number | null
  specialization: string | null
  bio: string | null
  consultation_fee: string | number | null
  is_accepting_appointments: boolean
  verified_at: string | null
  verified_by_user_id: number | null
  created_at: string
  updated_at: string
}
export interface DoctorPublicProfile {
  id: number
  full_name: string
  years_of_experience: number | null
  bio: string | null
  specialization: string | null
  image: string | null
  consultation_fee: string | number | null
  is_accepting_appointments: boolean
  verified_at: string | null
}
export interface DoctorSearchResponse {
  total: number
  skip: number
  limit: number
  items: DoctorPublicProfile[]
}
export interface AvailabilityRequest {
  /** 0 = Monday ... 6 = Sunday */
  day_of_week: number
  /** "HH:MM" */
  start_time: string
  end_time: string
}
export interface Availability extends AvailabilityRequest {
  id: number
  doctor_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface HolidayCreateRequest {
  from_date: string
  to_date: string
  reason?: string | null
}
export interface HolidayUpdateRequest {
  from_date?: string
  to_date?: string
  reason?: string | null
  is_active?: boolean
}
export interface Holiday {
  id: number
  doctor_id: number
  from_date: string
  to_date: string
  reason: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface HolidayList {
  data: Holiday[]
  total_count: number
  from_date: string | null
  to_date: string | null
}
export interface ImageUploadResult {
  success: boolean
  image_key: string
  image_url: string
}

// ---------- Patients ----------
export interface PatientFields {
  age?: string | null
  gender?: Gender | null
  address?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  relation_name?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
}
export interface PatientCreateRequest extends PatientFields {
  relation_type: Relationship
  is_primary: boolean
  preferred_language: Language
  notification_preference_email: boolean
  notification_preference_sms: boolean
}
export interface PatientUpdateRequest extends PatientFields {
  relation_type?: Relationship
  preferred_language?: Language
  notification_preference_email?: boolean
  notification_preference_sms?: boolean
}
export interface PatientProfile {
  id: number
  user_id: number
  relation_type: Relationship
  relation_name: string | null
  is_primary: boolean
  age: string | null
  gender: Gender | null
  address: string | null
  city: string | null
  pincode: string | null
  state: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  image: string | null
  preferred_language: Language
  notification_preference_email: boolean
  notification_preference_sms: boolean
}
export interface PatientDeleteResult {
  deleted_patient_id: number
  deleted_patient_ids: number[]
  deleted_count: number
  family_members_deleted: boolean
}

// ---------- Appointments ----------
export interface AppointmentCreateRequest {
  doctor_id: number
  patient_id?: number
  appointment_date: string
  consultation_type: string
  notes?: string | null
}
export interface Appointment {
  id: number
  patient_id: number
  doctor_id: number
  appointment_date: string
  consultation_type: string
  notes: string | null
  status: AppointmentStatus
  cancellation_reason: string | null
  cancellation_category: string | null
  cancelled_by_user_id: number | null
  cancellation_time: string | null
  no_show_flagged: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface AppointmentList {
  total: number
  skip: number
  limit: number
  items: Appointment[]
}
export interface AppointmentFilters {
  skip?: number
  limit?: number
  status_filter?: AppointmentStatus
  doctor_id?: number
  patient_id?: number
  from_date?: string
  to_date?: string
}

// ---------- Admin ----------
export interface AdminPatientItem {
  id: number
  user_id: number
  owner_full_name: string
  owner_phone: string
  relation_type: Relationship
  relation_name: string | null
  is_primary: boolean
  age: string | null
  gender: Gender | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  image: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  preferred_language: Language
  notification_preference_email: boolean
  notification_preference_sms: boolean
  created_at: string
  updated_at: string
}
export interface AdminPatientListResponse {
  total: number
  skip: number
  limit: number
  items: AdminPatientItem[]
}
export interface AdminPatientQuery {
  search?: string
  skip?: number
  limit?: number
}

/** All fields optional - only what's set is changed. Mirrors the patient's own update schema. */
export interface AdminPatientUpdateRequest {
  relation_type?: Relationship
  relation_name?: string | null
  age?: string | null
  gender?: Gender | null
  address?: string | null
  city?: string | null
  pincode?: string | null
  state?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  preferred_language?: Language
  notification_preference_email?: boolean
  notification_preference_sms?: boolean
}

export interface AdminDoctorItem {
  id: number
  user_id: number
  owner_full_name: string
  owner_phone: string
  owner_email: string | null
  status: DoctorProfileStatus
  registration_number: string | null
  license_authority: string | null
  license_expiry_date: string | null
  image: string | null
  specialization: string | null
  years_of_experience: number | null
  bio: string | null
  consultation_fee: string | null
  is_accepting_appointments: boolean
  verified_at: string | null
  verified_by_user_id: number | null
  verified_by_name: string | null
  created_at: string
  updated_at: string
}
export interface AdminDoctorListResponse {
  total: number
  skip: number
  limit: number
  items: AdminDoctorItem[]
}
export interface AdminDoctorQuery {
  search?: string
  skip?: number
  limit?: number
}

/** All fields optional - only what's set is changed. To approve with a verification
 *  stamp, call adminVerifyDoctor() instead of setting status here directly. */
export interface AdminDoctorUpdateRequest {
  specialization?: string | null
  years_of_experience?: number | null
  bio?: string | null
  consultation_fee?: string | null
  is_accepting_appointments?: boolean
  registration_number?: string | null
  license_authority?: string | null
  license_expiry_date?: string | null
  status?: DoctorProfileStatus
}

export interface AdminAppointmentItem {
  id: number
  patient_id: number
  patient_name: string
  doctor_id: number
  doctor_name: string
  appointment_date: string
  consultation_type: string
  notes: string | null
  status: AppointmentStatus
  cancellation_reason: string | null
  cancellation_category: string | null
  cancelled_by_user_id: number | null
  cancellation_time: string | null
  no_show_flagged: boolean
  created_at: string
  updated_at: string
}
export interface AdminAppointmentListResponse {
  total: number
  skip: number
  limit: number
  items: AdminAppointmentItem[]
}
export interface AdminAppointmentQuery {
  status_filter?: AppointmentStatus
  doctor_id?: number
  patient_id?: number
  from_date?: string
  to_date?: string
  skip?: number
  limit?: number
}

export interface AdminUpdateAppointmentNotesRequest {
  notes: string
}

/** One patient profile (family member) nested under its owning user account. */
export interface AdminUserPatientMember {
  id: number
  relation_type: Relationship
  relation_name: string | null
  is_primary: boolean
  age: string | null
  gender: Gender | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  image: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  preferred_language: Language
  notification_preference_email: boolean
  notification_preference_sms: boolean
  created_at: string
  updated_at: string
}

export interface AdminUserItem {
  id: number
  full_name: string
  phone: string
  email: string | null
  dob: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  patient_members: AdminUserPatientMember[]
}

export interface AdminUserListResponse {
  total: number
  skip: number
  limit: number
  items: AdminUserItem[]
}

export interface AdminUserQuery {
  search?: string
  role?: UserRole
  skip?: number
  limit?: number
}


export interface AdminDeletionRequestItem {
  id: number
  user_id: number | null
  user_phone: string
  user_full_name: string
  user_role: UserRole
  reason: string
  status: DeletionRequestStatus
  admin_note: string | null
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  created_at: string
}

export interface AdminDeletionRequestListResponse {
  total: number
  skip: number
  limit: number
  items: AdminDeletionRequestItem[]
}

export interface AdminDeletionRequestQuery {
  status?: DeletionRequestStatus
  skip?: number
  limit?: number
}

export interface AdminRejectDeletionRequest {
  admin_note?: string | null
}

export interface AdminDashboardSummary {
  total_patients: number
  total_doctors: number
  doctors_pending_verification: number
  pending_deletion_requests: number
  total_appointments: number
  confirmed_appointments: number
  cancelled_appointments: number
  completed_appointments: number
  appointments_today: number
}
