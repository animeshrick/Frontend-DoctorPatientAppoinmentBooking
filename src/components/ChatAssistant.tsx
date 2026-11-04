import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { getMyChat, saveChatMessage } from '../api/chats'
import { API_BASE_URL, tokenStore } from '../api/client'

/** The chat goes through our own API (which checks the login token and talks to n8n
 * on the server). The browser never sees the n8n address. */
const CHAT_URL = `${API_BASE_URL}/chats/stream`

/** @n8n/chat keeps its session id in localStorage under this key. */
const SESSION_STORAGE_KEY = 'n8n-chat/sessionId'

const WELCOME = [
  'Hi! I am Compounder. I can help you find doctors and see who is available on a date.',
  'Try: "Which doctors are available on 2nd Dec?" or "Find a cardiologist".',
]

const FRIENDLY_ERROR = 'Something went wrong, please try after some time'
/** n8n error texts that must never be shown to a patient. */
const ERROR_PATTERN = /max iterations|could not complete the task|^\s*error[:\s]|workflow execution|n8n/i

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
}

/** How many past question/answer pairs are shown when the chat opens. */
const SHOW_LATEST = 10

/** Loads the patient's latest saved pairs from the database. Never throws. */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  Object.defineProperty(headers, 'Authorization', {
    enumerable: true,
    get: () => `Bearer ${tokenStore.get() ?? ''}`,
  })
  return headers
}

async function loadHistory(): Promise<ChatMessage[]> {
  try {
    const saved = await getMyChat(SHOW_LATEST)
    const out: ChatMessage[] = []
    saved.messages.forEach((pair, i) => {
      if (pair.query) out.push({ id: `q${i}`, text: pair.query, sender: 'user' })
      if (pair.response) out.push({ id: `a${i}`, text: pair.response, sender: 'bot' })
    })
    return out
  } catch (err) {
    console.warn('Could not load chat history', err)
    return []
  }
}

/**
 * Floating doctor assistant.
 * - Patients (role USER): live chat, one chat session per user id, so the same
 *   patient always gets the same conversation back after logging in again.
 * - Doctors: always a "Coming soon" card, no chat.
 * - Admins: nothing.
 */
export default function ChatAssistant() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'USER') return <PatientChat userId={user.id} />
  if (user.role === 'DOCTOR') return <DoctorComingSoon />
  return null
}

function PatientChat({ userId }: { userId: number }) {
  useEffect(() => {
    let cancelled = false
    let app: { unmount: () => void } | undefined
    let saver: ReturnType<typeof setInterval> | undefined
    let guard: ReturnType<typeof setInterval> | undefined
    const sessionId = `patient_${userId}`

    void (async () => {
      const [{ createChat }] = await Promise.all([
        import('@n8n/chat'),
        import('@n8n/chat/style.css'),
      ])
      const history = await loadHistory()
      if (cancelled) return

      // History is kept in this browser, per patient. (n8n's own history endpoint
      // streams and never finishes, which blocks the widget.)
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
      } catch {
        /* storage blocked: the widget falls back to a fresh session */
      }

      const instance = createChat({
        webhookUrl: CHAT_URL,
        mode: 'window',
        showWelcomeScreen: false,
        loadPreviousSession: false,
        // The n8n trigger streams its reply; without this the raw stream text is shown.
        enableStreaming: true,
        // The server works out who you are from your login token; nothing about
        // the user is sent from here. The token is read on every message, so a
        // fresh login is picked up without recreating the chat.
        webhookConfig: {
          method: 'POST',
          headers: authHeaders(),
        },
        initialMessages: WELCOME,
        i18n: {
          en: {
            title: 'Compounder',
            subtitle: 'Find doctors and availability',
            footer: '',
            getStarted: 'New conversation',
            inputPlaceholder: 'Ask about doctors or a date...',
            closeButtonTooltip: 'Close',
          },
        },
      })
      app = instance

      // After the widget has mounted, pin the per-patient session id and show history.
      await new Promise((r) => setTimeout(r, 100))
      if (cancelled) return
      const chat = (
        instance as unknown as {
          config?: {
            globalProperties?: {
              $chat?: {
                currentSessionId: { value: string | null }
                messages: { value: ChatMessage[] }
                waitingForResponse?: { value: boolean }
              }
            }
          }
        }
      ).config?.globalProperties?.$chat
      if (chat) {
        chat.currentSessionId.value = sessionId
        // Show the latest saved pairs; older ones stay in the database.
        if (history.length > 0) chat.messages.value = history
        // Messages loaded from the database must not be saved again. (The welcome lines
        // are shown separately by the widget and are not part of this list.)
        const preloaded = history.length

        // Replace raw n8n error messages with a friendly one.
        guard = setInterval(() => {
          for (const m of chat.messages.value) {
            if (m.sender === 'bot' && m.text !== FRIENDLY_ERROR && ERROR_PATTERN.test(m.text)) {
              m.text = FRIENDLY_ERROR
            }
          }
        }, 200)

        // Save each question + finished answer to the database, once.
        let savedPairs = 0
        let lastSnapshot = ''
        let stableTicks = 0
        saver = setInterval(() => {
          const fresh = chat.messages.value.slice(preloaded)
          const snapshot = JSON.stringify(fresh.map((m) => [m.sender, m.text]))
          stableTicks = snapshot === lastSnapshot ? stableTicks + 1 : 0
          lastSnapshot = snapshot
          // The answer counts as finished when the widget stopped waiting and the text
          // has not changed for about 2 seconds (streaming has ended).
          if (chat.waitingForResponse?.value || stableTicks < 2) return

          // Walk fresh messages as [user, bot] pairs.
          let pairIndex = 0
          for (let k = 0; k + 1 < fresh.length; k++) {
            if (fresh[k].sender === 'user' && fresh[k + 1].sender === 'bot') {
              if (pairIndex >= savedPairs) {
                const q = fresh[k].text.trim()
                const a = fresh[k + 1].text.trim()
                savedPairs = pairIndex + 1
                if (q && a && a !== FRIENDLY_ERROR) {
                  void saveChatMessage(q, a).catch((err) => console.warn('Could not save chat message', err))
                }
              }
              pairIndex++
              k++
            }
          }
        }, 1000)
      }
    })()

    return () => {
      cancelled = true
      if (saver) clearInterval(saver)
      if (guard) clearInterval(guard)
      app?.unmount()
    }
  }, [userId])

  return <WelcomePopup userId={userId} />
}

const POPUP_SEEN_PREFIX = 'doctor-chat/welcome-seen/'

/** One-time speech bubble next to the chat button. Clicking it opens the chat. */
function WelcomePopup({ userId }: { userId: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = POPUP_SEEN_PREFIX + userId
    let seen = false
    try {
      seen = localStorage.getItem(key) === '1'
    } catch {
      /* storage blocked: show it each visit */
    }
    if (seen) return

    const markSeen = () => {
      try {
        localStorage.setItem(key, '1')
      } catch {
        /* ignore */
      }
    }
    const show = setTimeout(() => setVisible(true), 1500)
    const hide = setTimeout(() => {
      setVisible(false)
      markSeen()
    }, 14000)
    // Opening the chat by its own button also dismisses the popup.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.chat-window-toggle')) {
        setVisible(false)
        markSeen()
      }
    }
    document.addEventListener('click', onClick)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      document.removeEventListener('click', onClick)
    }
  }, [userId])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(POPUP_SEEN_PREFIX + userId, '1')
    } catch {
      /* ignore */
    }
  }
  const openChat = () => {
    dismiss()
    document.querySelector<HTMLElement>('.chat-window-toggle')?.click()
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9998] w-72 animate-[chatpop_0.35s_ease-out] sm:right-6">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 pr-8 shadow-xl dark:border-slate-600 dark:bg-slate-800">
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
        <button type="button" onClick={openChat} className="flex w-full items-start gap-3 text-left">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-teal-600 text-white">
            <BotIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">Compounder</span>
            <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">
              Hi! I am Compounder. I can help you find doctors and see who is available on a date.
            </span>
            <span className="mt-1 block text-xs font-medium text-teal-600 dark:text-teal-400">Tap to chat</span>
          </span>
        </button>
        <span className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function BotIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}

function DoctorComingSoon() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-72 rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white"><BotIcon className="h-5 w-5 text-teal-600" />Compounder</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Coming soon</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Compounder"
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white shadow-lg transition-colors hover:bg-teal-700"
      >
        <BotIcon className="h-7 w-7" />
      </button>
    </div>
  )
}
