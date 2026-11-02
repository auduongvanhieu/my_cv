import type { Resume } from './types'

export interface User {
  id: number
  email: string
  name: string
  picture: string
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = `${res.status}`
    try { msg = (await res.json()).error || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export const api = {
  config: () => req<{ googleClientId: string; aiParse: boolean }>('GET', '/api/config'),
  me: () => req<{ user: User | null }>('GET', '/api/auth/me'),
  loginGoogle: (credential: string) => req<{ user: User }>('POST', '/api/auth/google', { credential }),
  logout: () => req<{ ok: boolean }>('POST', '/api/auth/logout'),
  listResumes: () => req<Resume[]>('GET', '/api/resumes'),
  putResume: (r: Resume) => req<{ ok: boolean }>('PUT', `/api/resumes/${encodeURIComponent(r.id)}`, r),
  parseCV: async (file: File): Promise<unknown> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/parse-cv', { method: 'POST', body: fd, credentials: 'same-origin' })
    if (!res.ok) {
      let msg = `${res.status}`
      try { msg = (await res.json()).error || msg } catch { /* ignore */ }
      throw new Error(msg)
    }
    return res.json()
  },
  deleteResume: (id: string) => req<{ ok: boolean }>('DELETE', `/api/resumes/${encodeURIComponent(id)}`),
}
