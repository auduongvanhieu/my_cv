import type { Resume } from '../types'
import { isDark } from '../utils'
import { ContactList, Photo, SectionBody, sectionTitle, visibleSections } from './shared'

/** Two-column classic layout inspired by the ITviec CV export: dark header, label column on the left. */
export default function ITviec({ r }: { r: Resume }) {
  const { accent, margin } = r.design
  const dark = isDark(accent)
  const headerFg = dark ? '#fff' : '#111'
  const sections = visibleSections(r)
  const short = ['education', 'skills', 'certificates', 'languages', 'awards', 'references', 'interests']
  return (
    <div>
      <header style={{ background: accent, color: headerFg, padding: `${margin}mm ${margin}mm ${margin * 0.8}mm` }}>
        <div className="flex gap-5 items-start">
          <Photo r={r} size={92} />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold uppercase leading-tight" style={{ fontSize: '2em', letterSpacing: '.02em' }}>{r.profile.fullName}</h1>
            {r.profile.title && <div className="uppercase opacity-85 mt-0.5" style={{ fontSize: '1.15em', letterSpacing: '.18em' }}>{r.profile.title}</div>}
            <ContactList r={r} className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3" itemClass="opacity-90" />
          </div>
        </div>
      </header>
      <main style={{ padding: `${margin * 0.6}mm ${margin}mm ${margin}mm` }}>
        {sections.map((s, i) => (
          <section key={s.key + (s.customId || '')} className={`grid gap-5 py-3.5 ${short.includes(s.key) ? 'avoid-break' : ''}`} style={{ gridTemplateColumns: '9em 1fr', borderTop: i === 0 ? 'none' : '1px solid #e5e7eb' }}>
            <h2 className="font-bold" style={{ fontSize: '1.15em', lineHeight: 1.35 }}>{sectionTitle(r, s)}</h2>
            <div className="min-w-0"><SectionBody r={r} s={s} accent={accent} /></div>
          </section>
        ))}
      </main>
    </div>
  )
}
