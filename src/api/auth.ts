import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type {
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

export async function getMe(): Promise<User> {
  const res = await api.get<ApiEnvelope<User>>(ENDPOINTS.user.me)
  return res.data.data
}

export async function deleteMyAccount(phone: string): Promise<DeleteAccountResponse> {
  const res = await api.post<DeleteAccountResponse>(ENDPOINTS.user.deleteAccount, { phone })
  return res.data
}
