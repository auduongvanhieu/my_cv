import type { Design, Resume, SectionItem, SectionKey } from '../types'
import { uid } from '../utils'

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'education',
  'skills',
  'experience',
  'projects',
  'certificates',
  'languages',
  'activities',
  'awards',
  'interests',
  'references',
]

export const FONTS = [
  { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Source Sans 3', label: 'Source Sans 3' },
  { id: 'Lora', label: 'Lora (serif)' },
  { id: 'Merriweather', label: 'Merriweather (serif)' },
]

export const ACCENTS = [
  '#1f2937', '#1d4ed8', '#0f766e', '#7c3aed', '#be123c', '#c2410c', '#0369a1', '#374151', '#15803d', '#b45309',
]

export const defaultDesign = (): Design => ({
  template: 'itviec',
  accent: '#1f2937',
  font: 'Be Vietnam Pro',
  fontSize: 11,
  lineHeight: 1.5,
  margin: 14,
  locale: 'vi',
  showPhoto: true,
  photoShape: 'rounded',
  skillStyle: 'tags',
})

export const defaultSections = (): SectionItem[] =>
  DEFAULT_SECTION_ORDER.map((key) => ({ key, title: '', visible: key !== 'references' && key !== 'interests' }))

export const blankResume = (name: string): Resume => {
  const now = Date.now()
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    profile: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      birthday: '',
      address: '',
      website: '',
      linkedin: '',
      github: '',
      photo: '',
    },
    summary: '',
    experience: [],
    education: [],
    skillGroups: [],
    projects: [],
    certificates: [],
    languages: [],
    activities: [],
    awards: [],
    references: [],
    interests: '',
    customSections: [],
    sections: defaultSections(),
    design: defaultDesign(),
  }
}
