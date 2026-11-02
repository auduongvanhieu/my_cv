import type { Resume } from '../types'
import { ContactList, Photo, SectionBody, sectionTitle, visibleSections } from './shared'

/** Formal single-column layout: centered name, uppercase section headings with accent rule. */
export default function Classic({ r }: { r: Resume }) {
  const { accent, margin } = r.design
  const sections = visibleSections(r)
  return (
    <div style={{ padding: `${margin}mm` }}>
      <header className="flex items-center gap-5 pb-4 mb-4" style={{ borderBottom: `2px solid ${accent}` }}>
        <Photo r={r} size={96} />
        <div className="flex-1 text-center">
          <h1 className="font-bold uppercase" style={{ fontSize: '2.1em', letterSpacing: '.08em', color: accent }}>{r.profile.fullName}</h1>
          {r.profile.title && <div className="mt-1" style={{ fontSize: '1.15em' }}>{r.profile.title}</div>}
          <ContactList r={r} className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 opacity-80" />
        </div>
        {r.design.showPhoto && r.profile.photo && <div style={{ width: 96 }} />}
      </header>
      {sections.map((s) => (
        <section key={s.key + (s.customId || '')} className="mb-4">
          <h2 className="font-bold uppercase mb-2 pb-0.5" style={{ fontSize: '1.1em', letterSpacing: '.1em', borderBottom: '1px solid #d1d5db' }}>{sectionTitle(r, s)}</h2>
          <SectionBody r={r} s={s} accent={accent} variant="inline" />
        </section>
      ))}
    </div>
  )
}
