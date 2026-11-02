import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Design, ListKey, Locale, Profile, Resume, SectionItem } from './types'
import { blankResume, defaultDesign, defaultSections } from './data/defaults'
import { uid } from './utils'
import type { User } from './api'

interface State {
  resumes: Resume[]
  currentId: string | null
  uiLang: Locale
  zoom: number
  panel: 'content' | 'design'
  user: User | null
  authReady: boolean
  googleClientId: string
  aiParse: boolean
  sync: 'idle' | 'saving' | 'saved' | 'error'

  setUser: (user: User | null, resumes: Resume[]) => void
  setAuthReady: (v: boolean) => void
  setGoogleClientId: (id: string) => void
  setAiParse: (v: boolean) => void
  setSync: (s: 'idle' | 'saving' | 'saved' | 'error') => void

  setUiLang: (l: Locale) => void
  setZoom: (z: number) => void
  setPanel: (p: 'content' | 'design') => void

  createResume: () => string
  createFromParsed: (data: unknown, name: string) => string
  importResume: (data: unknown) => string | null
  duplicateResume: (id: string) => void
  deleteResume: (id: string) => void
  renameResume: (id: string, name: string) => void
  selectResume: (id: string | null) => void

  update: (patch: Partial<Resume>) => void
  updateProfile: (patch: Partial<Profile>) => void
  updateDesign: (patch: Partial<Design>) => void
  setSections: (sections: SectionItem[]) => void
  toggleSection: (index: number) => void
  setSectionTitle: (index: number, title: string) => void
  addCustomSection: () => void
  removeCustomSection: (customId: string) => void

  addItem: <K extends ListKey>(key: K, item: Resume[K][number]) => void
  updateItem: <K extends ListKey>(key: K, id: string, patch: Partial<Resume[K][number]>) => void
  removeItem: (key: ListKey, id: string) => void
  moveItem: (key: ListKey, from: number, to: number) => void
}

function normalize(input: Partial<Resume>): Resume {
  const base = blankResume(input.name || 'CV')
  const r: Resume = { ...base, ...input, id: input.id || base.id }
  r.profile = { ...base.profile, ...(input.profile || {}) }
  r.design = { ...defaultDesign(), ...(input.design || {}) }
  const lists: ListKey[] = ['experience', 'education', 'skillGroups', 'projects', 'certificates', 'languages', 'activities', 'awards', 'references', 'customSections']
  for (const k of lists) if (!Array.isArray(r[k])) (r as unknown as Record<string, unknown>)[k] = []
  if (!Array.isArray(r.sections) || r.sections.length === 0) r.sections = defaultSections()
  // make sure every custom section has a section entry and every default key exists
  const def = defaultSections()
  for (const d of def) if (!r.sections.some((s) => s.key === d.key)) r.sections.push({ ...d, visible: false })
  for (const c of r.customSections) if (!r.sections.some((s) => s.key === 'custom' && s.customId === c.id)) r.sections.push({ key: 'custom', customId: c.id, title: '', visible: true })
  r.sections = r.sections.filter((s) => s.key !== 'custom' || r.customSections.some((c) => c.id === s.customId))
  return r
}

/** Builds a Resume from the AI extraction result (same shape as Resume minus ids/design). */
export function resumeFromParsed(data: unknown, name: string): Resume {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const r = blankResume(name)
  const strOf = (v: unknown) => (typeof v === 'string' ? v : '')
  const list = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : [])
  const p = (d.profile || {}) as Record<string, unknown>
  for (const k of Object.keys(r.profile) as (keyof Profile)[]) if (k !== 'photo') r.profile[k] = strOf(p[k])
  r.summary = strOf(d.summary)
  r.experience = list(d.experience).map((e) => ({ id: uid(), company: strOf(e.company), position: strOf(e.position), start: strOf(e.start), end: strOf(e.end), current: !!e.current, description: strOf(e.description) }))
  r.education = list(d.education).map((e) => ({ id: uid(), school: strOf(e.school), degree: strOf(e.degree), major: strOf(e.major), start: strOf(e.start), end: strOf(e.end), description: strOf(e.description) }))
  r.skillGroups = list(d.skillGroups).map((g) => ({ id: uid(), name: strOf(g.name), skills: list(g.skills).map((k) => ({ id: uid(), name: strOf(k.name), level: Math.max(0, Math.min(5, Number(k.level) || 0)), years: strOf(k.years) })) })).filter((g) => g.skills.length)
  r.projects = list(d.projects).map((x) => ({ id: uid(), name: strOf(x.name), company: strOf(x.company), role: strOf(x.role), start: strOf(x.start), end: strOf(x.end), link: strOf(x.link), description: strOf(x.description) }))
  r.certificates = list(d.certificates).map((x) => ({ id: uid(), name: strOf(x.name), issuer: strOf(x.issuer), date: strOf(x.date), link: strOf(x.link) }))
  r.languages = list(d.languages).map((x) => ({ id: uid(), name: strOf(x.name), level: strOf(x.level) }))
  r.activities = list(d.activities).map((x) => ({ id: uid(), title: strOf(x.title), organization: strOf(x.organization), start: strOf(x.start), end: strOf(x.end), description: strOf(x.description) }))
  r.awards = list(d.awards).map((x) => ({ id: uid(), title: strOf(x.title), issuer: strOf(x.issuer), date: strOf(x.date), description: strOf(x.description) }))
  if (r.profile.title && !name) r.name = `CV ${r.profile.fullName || ''} – ${r.profile.title}`.trim()
  return r
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const mutate = (fn: (r: Resume) => void) =>
        set((s) => ({
          resumes: s.resumes.map((r) => {
            if (r.id !== s.currentId) return r
            const copy = structuredClone(r)
            fn(copy)
            copy.updatedAt = Date.now()
            return copy
          }),
        }))

      return {
        resumes: [],
        currentId: null,
        uiLang: 'vi',
        zoom: 1,
        panel: 'content',
        user: null,
        authReady: false,
        googleClientId: '',
        aiParse: false,
        sync: 'idle',

        setUser: (user, resumes) => set({ user, resumes: resumes.map((r) => normalize(r)), currentId: null, sync: 'idle' }),
        setAuthReady: (authReady) => set({ authReady }),
        setGoogleClientId: (googleClientId) => set({ googleClientId }),
        setAiParse: (aiParse) => set({ aiParse }),
        setSync: (sync) => set({ sync }),

        setUiLang: (uiLang) => set({ uiLang }),
        setZoom: (zoom) => set({ zoom }),
        setPanel: (panel) => set({ panel }),

        createResume: () => {
          const r = blankResume(get().uiLang === 'vi' ? 'CV mới' : 'New CV')
          set((s) => ({ resumes: [r, ...s.resumes], currentId: r.id }))
          return r.id
        },
        createFromParsed: (data, name) => {
          const r = resumeFromParsed(data, name)
          set((s) => ({ resumes: [r, ...s.resumes], currentId: r.id }))
          return r.id
        },
        importResume: (data) => {
          if (!data || typeof data !== 'object') return null
          const r = normalize(data as Partial<Resume>)
          r.id = uid()
          r.updatedAt = Date.now()
          set((s) => ({ resumes: [r, ...s.resumes], currentId: r.id }))
          return r.id
        },
        duplicateResume: (id) => {
          const src = get().resumes.find((r) => r.id === id)
          if (!src) return
          const copy = structuredClone(src)
          copy.id = uid()
          copy.name = src.name + ' (copy)'
          copy.createdAt = copy.updatedAt = Date.now()
          set((s) => ({ resumes: [copy, ...s.resumes] }))
        },
        deleteResume: (id) =>
          set((s) => ({ resumes: s.resumes.filter((r) => r.id !== id), currentId: s.currentId === id ? null : s.currentId })),
        renameResume: (id, name) =>
          set((s) => ({ resumes: s.resumes.map((r) => (r.id === id ? { ...r, name, updatedAt: Date.now() } : r)) })),
        selectResume: (currentId) => set({ currentId }),

        update: (patch) => mutate((r) => Object.assign(r, patch)),
        updateProfile: (patch) => mutate((r) => Object.assign(r.profile, patch)),
        updateDesign: (patch) => mutate((r) => Object.assign(r.design, patch)),
        setSections: (sections) => mutate((r) => (r.sections = sections)),
        toggleSection: (i) => mutate((r) => (r.sections[i].visible = !r.sections[i].visible)),
        setSectionTitle: (i, title) => mutate((r) => (r.sections[i].title = title)),
        addCustomSection: () =>
          mutate((r) => {
            const c = { id: uid(), title: get().uiLang === 'vi' ? 'Mục mới' : 'New section', content: '' }
            r.customSections.push(c)
            r.sections.push({ key: 'custom', customId: c.id, title: '', visible: true })
          }),
        removeCustomSection: (customId) =>
          mutate((r) => {
            r.customSections = r.customSections.filter((c) => c.id !== customId)
            r.sections = r.sections.filter((s) => !(s.key === 'custom' && s.customId === customId))
          }),

        addItem: (key, item) => mutate((r) => (r[key] as unknown[]).push(item)),
        updateItem: (key, id, patch) =>
          mutate((r) => {
            const list = r[key] as { id: string }[]
            const idx = list.findIndex((x) => x.id === id)
            if (idx >= 0) Object.assign(list[idx], patch)
          }),
        removeItem: (key, id) => mutate((r) => ((r as unknown as Record<string, { id: string }[]>)[key] = (r[key] as { id: string }[]).filter((x) => x.id !== id))),
        moveItem: (key, from, to) =>
          mutate((r) => {
            const list = r[key] as unknown[]
            if (to < 0 || to >= list.length) return
            const [it] = list.splice(from, 1)
            list.splice(to, 0, it)
          }),
      }
    },
    {
      name: 'mycv-store-v1',
      partialize: (s) => ({ resumes: s.resumes, currentId: s.currentId, uiLang: s.uiLang, zoom: s.zoom }),
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<State>
        return { ...current, ...p, resumes: (p.resumes || []).map((r) => normalize(r)) }
      },
    },
  ),
)

export const useCurrent = () => useStore((s) => s.resumes.find((r) => r.id === s.currentId) || null)
