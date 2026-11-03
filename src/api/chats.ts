import { api } from './client'
import { ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from './types'

export interface SavedChatPair {
  query: string
  response: string
  at?: string
}

export interface SavedChat {
  total: number
  messages: SavedChatPair[]
}

/** Latest saved question/answer pairs for the logged-in patient (oldest first). */
export async function getMyChat(limit = 10): Promise<SavedChat> {
  const res = await api.get<ApiEnvelope<SavedChat>>(ENDPOINTS.chats.mine, { params: { limit } })
  return res.data.data
}

/** Save one question and its answer to the logged-in patient's chat. */
export async function saveChatMessage(query: string, response: string): Promise<void> {
  await api.post(ENDPOINTS.chats.save, { query, response })
}
