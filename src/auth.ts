import { api, type User } from './api'
import { useStore } from './store'
import { synced } from './sync'
import type { Resume } from './types'

let gisLoading: Promise<void> | null = null

export function loadGis(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gisLoading) {
    gisLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('cannot load Google Identity Services'))
      document.head.appendChild(s)
    })
  }
  return gisLoading
}

/** Called on app start: discover config and restore the session. */
export async function initAuth() {
  const st = useStore.getState()
  try {
    const [cfg, me] = await Promise.all([api.config(), api.me()])
    st.setGoogleClientId(cfg.googleClientId || '')
    st.setAiParse(!!cfg.aiParse)
    if (me.user) await afterLogin(me.user)
  } catch (e) {
    // API not reachable (e.g. static-only deployment): stay in guest mode
    console.warn('auth init skipped', e)
  } finally {
    useStore.getState().setAuthReady(true)
  }
}

export async function loginWithCredential(credential: string) {
  const { user } = await api.loginGoogle(credential)
  await afterLogin(user)
}

/** Load the account's resumes and merge any guest resumes created on this device into the account. */
async function afterLogin(user: User) {
  const serverList = await api.listResumes()
  const serverIds = new Set(serverList.map((r) => r.id))
  const local = useStore.getState().resumes
  const localOnly = local.filter((r) => !serverIds.has(r.id))
  for (const r of localOnly) {
    try { await api.putResume(r); synced.set(r.id, r.updatedAt) } catch (e) { console.error('upload failed', e) }
  }
  for (const r of serverList) synced.set(r.id, r.updatedAt)
  const merged: Resume[] = [...serverList, ...localOnly].sort((a, b) => b.updatedAt - a.updatedAt)
  useStore.getState().setUser(user, merged)
}

export async function logout() {
  try { await api.logout() } catch { /* ignore */ }
  synced.clear()
  window.google?.accounts?.id?.disableAutoSelect?.()
  useStore.getState().setUser(null, [])
}
