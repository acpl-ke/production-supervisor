import type { RememberedLogin, Session } from '../types'

const sessionKey = 'igi.session'
const rememberKey = 'igi.remember'

function readJson<T>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function readSession(): Session | null {
  return readJson<Session>(localStorage, sessionKey) ?? readJson<Session>(sessionStorage, sessionKey)
}

export function writeSession(session: Session, remember: boolean, draft: RememberedLogin) {
  localStorage.removeItem(sessionKey)
  sessionStorage.removeItem(sessionKey)
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(sessionKey, JSON.stringify(session))
  if (remember) {
    localStorage.setItem(rememberKey, JSON.stringify(draft))
  } else {
    localStorage.removeItem(rememberKey)
  }
}

export function clearSession() {
  localStorage.removeItem(sessionKey)
  sessionStorage.removeItem(sessionKey)
}

export function readRemembered(): RememberedLogin | null {
  return readJson<RememberedLogin>(localStorage, rememberKey)
}
