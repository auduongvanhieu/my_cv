import type { Resume } from '../types'
import { isDark } from '../utils'
import { ContactList, Photo, SIDE_KEYS, SectionBody, sectionTitle, visibleSections } from './shared'

/** Colored sidebar with photo + contact + short sections; main column for narrative sections. */
export default function Modern({ r }: { r: Resume }) {
  const { accent, margin } = r.design
  const dark = isDark(accent)
  const fg = dark ? '#fff' : '#111'
  const all = visibleSections(r)
  const side = all.filter((s) => SIDE_KEYS.includes(s.key))
  const main = all.filter((s) => !SIDE_KEYS.includes(s.key))
  return (
    <div className="flex min-h-[297mm]">
      <aside className="w-[34%] shrink-0" style={{ background: accent, color: fg, padding: `${margin}mm ${margin * 0.8}mm` }}>
        <div className="flex flex-col items-center text-center">
          <Photo r={r} size={110} className="mb-3 ring-4" />
          <h1 className="font-bold leading-tight" style={{ fontSize: '1.6em' }}>{r.profile.fullName}</h1>
          {r.profile.title && <div className="opacity-85 mt-1" style={{ fontSize: '1.05em' }}>{r.profile.title}</div>}
        </div>
        <ContactList r={r} className="mt-5 space-y-1.5" itemClass="opacity-90 break-all" />
        {side.map((s) => (
          <section key={s.key + (s.customId || '')} className="mt-5">
            <h2 className="font-bold uppercase tracking-wider pb-1 mb-2" style={{ fontSize: '0.95em', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)'}` }}>{sectionTitle(r, s)}</h2>
            <SectionBody r={r} s={s} accent={accent} onDark={dark} />
          </section>
        ))}
      </aside>
      <main className="flex-1 min-w-0" style={{ padding: `${margin}mm ${margin}mm` }}>
        {main.map((s) => (
          <section key={s.key + (s.customId || '')} className="mb-4">
            <h2 className="font-bold uppercase tracking-wider mb-2 flex items-center gap-2" style={{ fontSize: '1.1em', color: accent }}>
              <span>{sectionTitle(r, s)}</span><span className="flex-1 h-px" style={{ background: accent, opacity: .35 }} />
            </h2>
            <SectionBody r={r} s={s} accent={accent} variant="inline" />
          </section>
        ))}
      </main>
    </div>
  )
}
