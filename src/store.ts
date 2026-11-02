import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Design, ListKey, Locale, Profile, Resume, SectionItem } from './types'
import { blankResume, defaultDesign, defaultSections } from './data/defaults'
import { sampleResume } from './data/sample'
import { uid } from './utils'

interface State {
  resumes: Resume[]
  currentId: string | null
  uiLang: Locale
  zoom: number
  panel: 'content' | 'design'

  setUiLang: (l: Locale) => void
  setZoom: (z: number) => void
  setPanel: (p: 'content' | 'design') => void

  createResume: (kind: 'blank' | 'sample') => string
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

        setUiLang: (uiLang) => set({ uiLang }),
        setZoom: (zoom) => set({ zoom }),
        setPanel: (panel) => set({ panel }),

        createResume: (kind) => {
          const r = kind === 'sample' ? sampleResume() : blankResume(get().uiLang === 'vi' ? 'CV mới' : 'New CV')
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
