import type { ReactNode } from 'react'
import { Cake, Code, Globe, Link, Mail, MapPin, Phone } from 'lucide-react'
import type { Resume, SectionItem, SectionKey } from '../types'
import { SECTION_TITLES } from '../i18n'
import { fmtDate, fmtMonth, fmtRange } from '../utils'

/* ------------------------------------------------------------------ */
/* rich text: "- " bullets, **bold**                                   */
/* ------------------------------------------------------------------ */
function inline(s: string, key: number): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span key={key}>
      {parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </span>
  )
}

export function RichText({ text, className = '' }: { text: string; className?: string }) {
  if (!text || !text.trim()) return null
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={blocks.length} className="rich rich-block">
          {bullets.map((b, i) => <li key={i}>{inline(b, i)}</li>)}
        </ul>,
      )
      bullets = []
    }
  }
  for (const raw of lines) {
    const line = raw.trim()
    const m = /^[-•*]\s+(.*)$/.exec(line)
    if (m) { bullets.push(m[1]); continue }
    flush()
    if (line) blocks.push(<p key={blocks.length} className="rich rich-block">{inline(line, 0)}</p>)
  }
  flush()
  return <div className={className}>{blocks}</div>
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
export const SIDE_KEYS: SectionKey[] = ['skills', 'languages', 'certificates', 'interests']

export function sectionTitle(r: Resume, s: SectionItem) {
  if (s.title) return s.title
  if (s.key === 'custom') return r.customSections.find((c) => c.id === s.customId)?.title || ''
  return SECTION_TITLES[r.design.locale][s.key]
}

export function hasContent(r: Resume, s: SectionItem): boolean {
  switch (s.key) {
    case 'summary': return !!r.summary.trim()
    case 'interests': return !!r.interests.trim()
    case 'experience': return r.experience.length > 0
    case 'education': return r.education.length > 0
    case 'skills': return r.skillGroups.some((g) => g.skills.some((k) => k.name.trim()))
    case 'projects': return r.projects.length > 0
    case 'certificates': return r.certificates.length > 0
    case 'languages': return r.languages.length > 0
    case 'activities': return r.activities.length > 0
    case 'awards': return r.awards.length > 0
    case 'references': return r.references.length > 0
    case 'custom': return !!r.customSections.find((c) => c.id === s.customId)?.content.trim()
  }
}

export const visibleSections = (r: Resume) => r.sections.filter((s) => s.visible && hasContent(r, s))

export function Photo({ r, size, className = '' }: { r: Resume; size: number; className?: string }) {
  if (!r.design.showPhoto || !r.profile.photo) return null
  const radius = r.design.photoShape === 'circle' ? '50%' : r.design.photoShape === 'rounded' ? '8px' : '0'
  return <img src={r.profile.photo} alt="" className={`object-cover shrink-0 ${className}`} style={{ width: size, height: size, borderRadius: radius }} />
}

export function contactItems(r: Resume) {
  const p = r.profile
  const loc = r.design.locale
  const items: { icon: ReactNode; text: string; href?: string }[] = []
  if (p.phone) items.push({ icon: <Phone size="1em" />, text: p.phone, href: `tel:${p.phone}` })
  if (p.email) items.push({ icon: <Mail size="1em" />, text: p.email, href: `mailto:${p.email}` })
  if (p.birthday) items.push({ icon: <Cake size="1em" />, text: fmtDate(p.birthday, loc) })
  if (p.address) items.push({ icon: <MapPin size="1em" />, text: p.address })
  if (p.website) items.push({ icon: <Globe size="1em" />, text: p.website.replace(/^https?:\/\//, ''), href: p.website })
  if (p.linkedin) items.push({ icon: <Link size="1em" />, text: p.linkedin.replace(/^https?:\/\//, ''), href: p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}` })
  if (p.github) items.push({ icon: <Code size="1em" />, text: p.github.replace(/^https?:\/\//, ''), href: p.github.startsWith('http') ? p.github : `https://${p.github}` })
  return items
}

export function ContactList({ r, className = '', itemClass = '' }: { r: Resume; className?: string; itemClass?: string }) {
  return (
    <div className={className}>
      {contactItems(r).map((c, i) => (
        <div key={i} className={`flex items-center gap-1.5 ${itemClass}`}>
          <span className="opacity-80 shrink-0 flex">{c.icon}</span>
          {c.href ? <a href={c.href}>{c.text}</a> : <span>{c.text}</span>}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* section bodies                                                      */
/* ------------------------------------------------------------------ */
export type Variant = 'stack' | 'inline'

/** Date on the left column, content on the right. Used by several templates. */
function DatedItem({ date, children, variant, dateClass = '' }: { date: string; children: ReactNode; variant: Variant; dateClass?: string }) {
  if (variant === 'inline')
    return (
      <div className="avoid-break grid gap-3" style={{ gridTemplateColumns: '9.5em 1fr' }}>
        <div className={`opacity-70 ${dateClass}`} style={{ fontSize: '0.92em' }}>{date}</div>
        <div className="min-w-0">{children}</div>
      </div>
    )
  return (
    <div className="avoid-break">
      {date && <div className={`opacity-70 ${dateClass}`} style={{ fontSize: '0.92em' }}>{date}</div>}
      {children}
    </div>
  )
}

export function ExperienceBody({ r, variant = 'stack', accent }: { r: Resume; variant?: Variant; accent?: string }) {
  const loc = r.design.locale
  return (
    <div className="space-y-2.5">
      {r.experience.map((e) => (
        <DatedItem key={e.id} date={fmtRange(e.start, e.end, e.current, loc)} variant={variant}>
          <div className="font-bold uppercase tracking-wide" style={{ color: accent }}>
            {e.position}
            {e.company && <span className="font-normal normal-case tracking-normal opacity-50 mx-2">|</span>}
            {e.company && <span className="font-semibold normal-case tracking-normal" style={{ color: 'inherit' }}>{e.company}</span>}
          </div>
          <RichText text={e.description} className="mt-0.5" />
        </DatedItem>
      ))}
    </div>
  )
}

export function EducationBody({ r, variant = 'stack' }: { r: Resume; variant?: Variant }) {
  const loc = r.design.locale
  return (
    <div className="space-y-2.5">
      {r.education.map((e) => (
        <div key={e.id} className="avoid-break">
          <div className="font-bold">{e.school}</div>
          {variant === 'inline' ? (
            <div className="flex flex-wrap gap-x-3" style={{ fontSize: '0.95em' }}>
              <span className="opacity-70">{fmtRange(e.start, e.end, false, loc)}</span>
              {(e.degree || e.major) && <span className="opacity-40">|</span>}
              <span>{[e.degree, e.major].filter(Boolean).join(' - ')}</span>
            </div>
          ) : (
            <>
              <div>{[e.degree, e.major].filter(Boolean).join(' - ')}</div>
              <div className="opacity-70" style={{ fontSize: '0.92em' }}>{fmtRange(e.start, e.end, false, loc)}</div>
            </>
          )}
          <RichText text={e.description} className="mt-0.5" />
        </div>
      ))}
    </div>
  )
}

export function SkillsBody({ r, accent, onDark = false }: { r: Resume; accent: string; onDark?: boolean }) {
  const style = r.design.skillStyle
  const groups = r.skillGroups.filter((g) => g.skills.some((s) => s.name.trim()))
  const multi = groups.length > 1 || !!groups[0]?.name
  return (
    <div className="space-y-2">
      {groups.map((g) => (
        <div key={g.id} className="avoid-break">
          {multi && g.name && <div className="font-bold mb-1">{g.name}</div>}
          {style === 'tags' && (
            <div className="flex flex-wrap gap-1.5">
              {g.skills.filter((s) => s.name.trim()).map((s) => (
                <span key={s.id} className="rounded px-2 py-0.5" style={{ background: onDark ? 'rgba(255,255,255,.15)' : '#f3f4f6', fontSize: '0.95em' }}>
                  <span className="font-semibold">{s.name}</span>{s.years && <span className="opacity-70"> ({s.years})</span>}
                </span>
              ))}
            </div>
          )}
          {style === 'list' && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {g.skills.filter((s) => s.name.trim()).map((s, i, arr) => (
                <span key={s.id}><span className="font-medium">{s.name}</span>{s.years && <span className="opacity-70"> ({s.years})</span>}{i < arr.length - 1 && <span className="opacity-40 ml-2">·</span>}</span>
              ))}
            </div>
          )}
          {style === 'bars' && (
            <div className="space-y-1">
              {g.skills.filter((s) => s.name.trim()).map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between" style={{ fontSize: '0.95em' }}>
                    <span className="font-medium">{s.name}</span><span className="opacity-70">{s.years}</span>
                  </div>
                  {s.level > 0 && (
                    <div className="h-1.5 rounded-full mt-0.5" style={{ background: onDark ? 'rgba(255,255,255,.25)' : '#e5e7eb' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.level / 5) * 100}%`, background: onDark ? '#fff' : accent }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {style === 'dots' && (
            <div className="space-y-0.5">
              {g.skills.filter((s) => s.name.trim()).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <span><span className="font-medium">{s.name}</span>{s.years && <span className="opacity-70" style={{ fontSize: '0.9em' }}> ({s.years})</span>}</span>
                  {s.level > 0 && (
                    <span className="flex gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => <span key={n} className="inline-block h-2 w-2 rounded-full" style={{ background: n <= s.level ? (onDark ? '#fff' : accent) : onDark ? 'rgba(255,255,255,.3)' : '#e5e7eb' }} />)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function ProjectsBody({ r, variant = 'stack', accent }: { r: Resume; variant?: Variant; accent?: string }) {
  const loc = r.design.locale
  return (
    <div className="space-y-2.5">
      {r.projects.map((p) => (
        <DatedItem key={p.id} date={fmtRange(p.start, p.end, false, loc)} variant={variant}>
          <div className="font-bold" style={{ color: accent }}>
            {p.link ? <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`}>{p.name}</a> : p.name}
          </div>
          {(p.company || p.role) && (
            <div style={{ fontSize: '0.95em' }}>
              {p.company && <span><span className="opacity-70">{loc === 'vi' ? 'Công ty' : 'Company'}:</span> {p.company}</span>}
              {p.company && p.role && <br />}
              {p.role && <span><span className="opacity-70">{loc === 'vi' ? 'Vai trò' : 'Role'}:</span> {p.role}</span>}
            </div>
          )}
          <RichText text={p.description} className="mt-0.5" />
        </DatedItem>
      ))}
    </div>
  )
}

export function CertificatesBody({ r }: { r: Resume }) {
  const loc = r.design.locale
  return (
    <div className="space-y-1">
      {r.certificates.map((c) => (
        <div key={c.id} className="avoid-break">
          <span className="font-semibold">{c.link ? <a href={c.link}>{c.name}</a> : c.name}</span>
          {(c.issuer || c.date) && <span className="opacity-70" style={{ fontSize: '0.95em' }}> — {[c.issuer, fmtMonth(c.date, loc)].filter(Boolean).join(', ')}</span>}
        </div>
      ))}
    </div>
  )
}

export function LanguagesBody({ r }: { r: Resume }) {
  return (
    <div className="space-y-0.5">
      {r.languages.map((l) => (
        <div key={l.id} className="flex justify-between gap-2"><span className="font-medium">{l.name}</span><span className="opacity-70">{l.level}</span></div>
      ))}
    </div>
  )
}

export function ActivitiesBody({ r, variant = 'stack' }: { r: Resume; variant?: Variant }) {
  const loc = r.design.locale
  return (
    <div className="space-y-2">
      {r.activities.map((a) => (
        <DatedItem key={a.id} date={fmtRange(a.start, a.end, false, loc)} variant={variant}>
          <div className="font-bold">{a.title}{a.organization && <span className="font-normal opacity-80"> · {a.organization}</span>}</div>
          <RichText text={a.description} />
        </DatedItem>
      ))}
    </div>
  )
}

export function AwardsBody({ r }: { r: Resume }) {
  const loc = r.design.locale
  return (
    <div className="space-y-1.5">
      {r.awards.map((a) => (
        <div key={a.id} className="avoid-break">
          <div><span className="font-semibold">{a.title}</span>{(a.issuer || a.date) && <span className="opacity-70" style={{ fontSize: '0.95em' }}> — {[a.issuer, fmtMonth(a.date, loc)].filter(Boolean).join(', ')}</span>}</div>
          <RichText text={a.description} />
        </div>
      ))}
    </div>
  )
}

export function ReferencesBody({ r }: { r: Resume }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {r.references.map((x) => (
        <div key={x.id} className="avoid-break">
          <div className="font-semibold">{x.name}</div>
          <div style={{ fontSize: '0.95em' }}>{[x.position, x.company].filter(Boolean).join(' · ')}</div>
          <div className="opacity-70" style={{ fontSize: '0.95em' }}>{[x.phone, x.email].filter(Boolean).join(' · ')}</div>
        </div>
      ))}
    </div>
  )
}

export function SectionBody({ r, s, variant = 'stack', accent, onDark }: { r: Resume; s: SectionItem; variant?: Variant; accent: string; onDark?: boolean }) {
  switch (s.key) {
    case 'summary': return <RichText text={r.summary} />
    case 'interests': return <RichText text={r.interests} />
    case 'experience': return <ExperienceBody r={r} variant={variant} />
    case 'education': return <EducationBody r={r} variant={variant} />
    case 'skills': return <SkillsBody r={r} accent={accent} onDark={onDark} />
    case 'projects': return <ProjectsBody r={r} variant={variant} />
    case 'certificates': return <CertificatesBody r={r} />
    case 'languages': return <LanguagesBody r={r} />
    case 'activities': return <ActivitiesBody r={r} variant={variant} />
    case 'awards': return <AwardsBody r={r} />
    case 'references': return <ReferencesBody r={r} />
    case 'custom': return <RichText text={r.customSections.find((c) => c.id === s.customId)?.content || ''} />
  }
}
