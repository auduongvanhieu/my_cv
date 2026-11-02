import type { Resume } from '../types'
import { ContactList, Photo, SectionBody, sectionTitle, visibleSections } from './shared'

/** Lots of whitespace, small accent headings, dates in a slim left column. */
export default function Minimal({ r }: { r: Resume }) {
  const { accent, margin } = r.design
  const sections = visibleSections(r)
  return (
    <div style={{ padding: `${margin}mm ${margin * 1.2}mm` }}>
      <header className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <h1 className="font-bold leading-none" style={{ fontSize: '2.4em' }}>{r.profile.fullName}</h1>
          {r.profile.title && <div className="mt-2 font-medium" style={{ fontSize: '1.15em', color: accent }}>{r.profile.title}</div>}
          <ContactList r={r} className="flex flex-wrap gap-x-4 gap-y-1 mt-3 opacity-75" />
        </div>
        <Photo r={r} size={88} />
      </header>
      {sections.map((s) => (
        <section key={s.key + (s.customId || '')} className="mb-5">
          <h2 className="font-bold uppercase mb-2" style={{ fontSize: '0.85em', letterSpacing: '.2em', color: accent }}>{sectionTitle(r, s)}</h2>
          <SectionBody r={r} s={s} accent={accent} variant="inline" />
        </section>
      ))}
    </div>
  )
}
