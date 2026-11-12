import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Download, SlidersHorizontal } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import { ACCENTS } from '../data/defaults'
import type { Resume, TemplateId } from '../types'
import MiniPage, { PAGE_W_PX } from './MiniPage'
import Preview from './Preview'
import { printCv } from '../utils'

export const TEMPLATES: TemplateId[] = ['itviec', 'modern', 'classic', 'minimal', 'creative']

/**
 * ITviec-style full-screen template picker: a gallery of every layout rendered with the
 * user's own CV on the left, a large live preview on the right, "use this template" at the bottom.
 */
export default function TemplateGallery() {
  const r = useCurrent()!
  const { uiLang, updateDesign, setGallery, setPanel } = useStore()
  const t = ui(uiLang)
  const [sel, setSel] = useState<TemplateId>(r.design.template)
  const [accent, setAccent] = useState(r.design.accent)
  const previewRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.8)

  // fit the big preview to the available width
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const measure = () => setZoom(Math.min(1, Math.max(0.3, (el.clientWidth - 48) / PAGE_W_PX)))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setGallery(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setGallery])

  const styled: Resume = { ...r, design: { ...r.design, accent } }
  const preview: Resume = { ...styled, design: { ...styled.design, template: sel } }
  const changed = sel !== r.design.template || accent !== r.design.accent

  const apply = () => { updateDesign({ template: sel, accent }); setGallery(false) }
  const customize = () => { updateDesign({ template: sel, accent }); setPanel('design'); setGallery(false) }
  const download = () => { updateDesign({ template: sel, accent }); setTimeout(() => printCv(r), 150) }

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-gray-900 text-white">
      <header className="h-14 shrink-0 flex items-center px-3 gap-3 bg-gray-950/80 border-b border-white/10">
        <button className="btn text-white hover:bg-white/10" onClick={() => setGallery(false)}><ArrowLeft size={16} />{t.backToEdit}</button>
        <div className="flex-1 text-center font-bold text-lg tracking-wide">{t.template}</div>
        <div className="hidden sm:flex items-center gap-1.5 pr-1" title={t.accent}>
          {ACCENTS.map((c) => (
            <button key={c} onClick={() => setAccent(c)} style={{ background: c }}
              className={`h-5 w-5 rounded-full cursor-pointer border-2 ${accent === c ? 'border-white ring-2 ring-white/60' : 'border-transparent'}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <aside className="shrink-0 lg:w-[420px] xl:w-[480px] overflow-auto bg-gray-800 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="hidden lg:block px-4 pt-3 text-xs text-gray-400">{t.galleryHint}</div>
          <div className="flex lg:grid lg:grid-cols-2 gap-4 p-4">
            {TEMPLATES.map((id) => {
              const active = sel === id
              return (
                <button key={id} onClick={() => setSel(id)} className="group shrink-0 w-40 lg:w-auto text-left cursor-pointer">
                  <div className={`relative rounded-md overflow-hidden transition ring-offset-2 ring-offset-gray-800 ${active ? 'ring-3 ring-blue-500' : 'ring-1 ring-white/10 group-hover:ring-white/40'}`}>
                    <MiniPage r={styled} template={id} />
                    {active && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"><Check size={32} strokeWidth={3} /></span>
                      </div>
                    )}
                    {r.design.template === id && (
                      <span className="absolute top-2 left-2 rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{t.inUse}</span>
                    )}
                  </div>
                  <div className={`mt-2 text-center text-sm lg:text-base font-semibold ${active ? 'text-white' : 'text-gray-300'}`}>{t.templates[id]}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="flex-1 min-h-0 flex flex-col">
          <div ref={previewRef} className="flex-1 min-h-0 bg-gray-300">
            <Preview resume={preview} zoom={zoom} />
          </div>
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-gray-950/90 border-t border-white/10">
            <button className="btn border-2 border-dashed border-white/70 text-white hover:bg-white/10" onClick={customize} title={t.customize}><SlidersHorizontal size={16} /><span className="hidden sm:inline">{t.customize}</span></button>
            <div className="flex items-center gap-2">
              <button className="btn bg-red-600 text-white hover:bg-red-700 shadow !px-3 !py-2.5" onClick={download} title={t.exportPdf}><Download size={18} /></button>
              <button className={`btn text-white shadow px-5 py-2.5 text-base font-semibold ${changed ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600/80 hover:bg-red-600'}`} onClick={apply}>{t.useTemplate}</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
