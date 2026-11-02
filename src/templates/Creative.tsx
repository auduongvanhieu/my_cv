import type { Resume } from '../types'
import { alpha, isDark } from '../utils'
import { ContactList, Photo, SIDE_KEYS, SectionBody, sectionTitle, visibleSections } from './shared'

/** Bold accent header band, two columns below with a tinted side column. */
export default function Creative({ r }: { r: Resume }) {
  const { accent, margin } = r.design
  const dark = isDark(accent)
  const fg = dark ? '#fff' : '#111'
  const all = visibleSections(r)
  const side = all.filter((s) => SIDE_KEYS.includes(s.key))
  const main = all.filter((s) => !SIDE_KEYS.includes(s.key))
  return (
    <div className="min-h-[297mm] flex flex-col">
      <header style={{ background: accent, color: fg, padding: `${margin}mm ${margin}mm` }} className="flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-bold leading-none" style={{ fontSize: '2.4em' }}>{r.profile.fullName}</h1>
          {r.profile.title && <div className="mt-2 opacity-90 uppercase" style={{ fontSize: '1.05em', letterSpacing: '.15em' }}>{r.profile.title}</div>}
          <ContactList r={r} className="flex flex-wrap gap-x-5 gap-y-1 mt-4 opacity-90" />
        </div>
        <Photo r={r} size={104} className="ring-4" />
      </header>
      <div className="flex flex-1">
        <main className="flex-1 min-w-0" style={{ padding: `${margin * 0.8}mm ${margin}mm ${margin}mm` }}>
          {main.map((s) => (
            <section key={s.key + (s.customId || '')} className="mb-4">
              <h2 className="font-bold uppercase mb-2 inline-block pb-0.5" style={{ fontSize: '1.05em', letterSpacing: '.08em', borderBottom: `3px solid ${accent}` }}>{sectionTitle(r, s)}</h2>
              <SectionBody r={r} s={s} accent={accent} />
            </section>
          ))}
        </main>
        <aside className="w-[33%] shrink-0" style={{ background: alpha(accent, 0.07), padding: `${margin * 0.8}mm ${margin * 0.8}mm ${margin}mm` }}>
          {side.map((s) => (
            <section key={s.key + (s.customId || '')} className="mb-4">
              <h2 className="font-bold uppercase mb-2" style={{ fontSize: '0.95em', letterSpacing: '.1em', color: accent }}>{sectionTitle(r, s)}</h2>
              <SectionBody r={r} s={s} accent={accent} />
            </section>
          ))}
        </aside>
      </div>
    </div>
  )
}
