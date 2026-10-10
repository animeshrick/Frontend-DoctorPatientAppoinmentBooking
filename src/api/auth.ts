import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
  AdminRegisterRequest,
  ApiEnvelope,
  DeleteAccountResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from './types'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(ENDPOINTS.auth.login, body)
  return res.data
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>(ENDPOINTS.auth.register, body)
  return res.data
}

/** Login for admin accounts only - the backend rejects non-admin credentials with a 403. */
export async function adminLogin(body: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(ENDPOINTS.auth.adminLogin, body)
  return res.data
}

/** Create another admin account. Requires the caller to already be signed in as an admin. */
export async function adminRegister(body: AdminRegisterRequest): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>(ENDPOINTS.auth.adminRegister, body)
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiEnvelope<User>>(ENDPOINTS.user.me)
  return res.data.data
}

export async function deleteMyAccount(phone: string, reason: string): Promise<DeleteAccountResponse> {
  const res = await api.post<DeleteAccountResponse>(ENDPOINTS.user.deleteAccount, { phone, reason })
  return res.data
}
