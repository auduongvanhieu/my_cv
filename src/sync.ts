import { api } from './api'
import { useStore } from './store'
import type { Resume } from './types'

/** id -> updatedAt last confirmed on the server */
export const synced = new Map<string, number>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()
let pending = 0

function setSync(state: 'idle' | 'saving' | 'saved' | 'error') {
  useStore.getState().setSync(state)
}

function track(p: Promise<unknown>) {
  pending++
  setSync('saving')
  p.then(() => { if (--pending === 0) setSync('saved') }).catch((e) => { pending--; console.error('sync failed', e); setSync('error') })
}

export function pushResume(r: Resume) {
  const t = timers.get(r.id)
  if (t) clearTimeout(t)
  timers.set(r.id, setTimeout(() => {
    timers.delete(r.id)
    const latest = useStore.getState().resumes.find((x) => x.id === r.id)
    if (!latest || !useStore.getState().user) return
    track(api.putResume(latest).then(() => { synced.set(latest.id, latest.updatedAt) }))
  }, 800))
}

/** Subscribe once: mirror every local change of a signed-in user to the server. */
export function startSync() {
  useStore.subscribe((s, prev) => {
    if (!s.user || s.resumes === prev.resumes) return
    const ids = new Set<string>()
    for (const r of s.resumes) {
      ids.add(r.id)
      if (synced.get(r.id) !== r.updatedAt) pushResume(r)
    }
    for (const id of [...synced.keys()]) {
      if (!ids.has(id)) {
        synced.delete(id)
        const t = timers.get(id)
        if (t) { clearTimeout(t); timers.delete(id) }
        track(api.deleteResume(id))
      }
    }
  })
}
