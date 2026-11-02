export type Locale = 'vi' | 'en'

export type TemplateId = 'itviec' | 'modern' | 'classic' | 'minimal' | 'creative'

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certificates'
  | 'languages'
  | 'activities'
  | 'awards'
  | 'references'
  | 'interests'
  | 'custom'

export interface Profile {
  fullName: string
  title: string
  email: string
  phone: string
  birthday: string
  address: string
  website: string
  linkedin: string
  github: string
  photo: string
}

export interface Experience {
  id: string
  company: string
  position: string
  start: string
  end: string
  current: boolean
  description: string
}

export interface Education {
  id: string
  school: string
  degree: string
  major: string
  start: string
  end: string
  description: string
}

export interface Skill {
  id: string
  name: string
  level: number // 0..5, 0 = not shown
  years: string
}

export interface SkillGroup {
  id: string
  name: string
  skills: Skill[]
}

export interface Project {
  id: string
  name: string
  company: string
  role: string
  start: string
  end: string
  link: string
  description: string
}

export interface Certificate {
  id: string
  name: string
  issuer: string
  date: string
  link: string
}

export interface Language {
  id: string
  name: string
  level: string
}

export interface Activity {
  id: string
  title: string
  organization: string
  start: string
  end: string
  description: string
}

export interface Award {
  id: string
  title: string
  issuer: string
  date: string
  description: string
}

export interface Reference {
  id: string
  name: string
  position: string
  company: string
  phone: string
  email: string
}

export interface CustomSection {
  id: string
  title: string
  content: string
}

export interface SectionItem {
  key: SectionKey
  /** id of the custom section when key === 'custom' */
  customId?: string
  /** custom heading override, empty = default */
  title: string
  visible: boolean
}

export interface Design {
  template: TemplateId
  accent: string
  font: string
  fontSize: number // base px
  lineHeight: number
  margin: number // mm
  locale: Locale // language for section headings in the CV
  showPhoto: boolean
  photoShape: 'circle' | 'rounded' | 'square'
  skillStyle: 'tags' | 'bars' | 'dots' | 'list'
}

export interface Resume {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  profile: Profile
  summary: string
  experience: Experience[]
  education: Education[]
  skillGroups: SkillGroup[]
  projects: Project[]
  certificates: Certificate[]
  languages: Language[]
  activities: Activity[]
  awards: Award[]
  references: Reference[]
  interests: string
  customSections: CustomSection[]
  sections: SectionItem[]
  design: Design
}

export type ListKey =
  | 'experience'
  | 'education'
  | 'skillGroups'
  | 'projects'
  | 'certificates'
  | 'languages'
  | 'activities'
  | 'awards'
  | 'references'
  | 'customSections'
