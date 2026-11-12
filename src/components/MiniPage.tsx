import { useEffect, useRef, useState } from 'react'
import type { Resume, TemplateId } from '../types'
import { renderTemplate } from '../templates'

/** CSS px width of an A4 page (210mm at 96dpi) */
export const PAGE_W_PX = (210 / 25.4) * 96

/**
 * Renders the first page of a resume scaled down to fit its container width.
 * Used for live template thumbnails: the user sees their own CV in every layout.
 */
export default function MiniPage({ r, template, className = '' }: { r: Resume; template?: TemplateId; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / PAGE_W_PX)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rr: Resume = template && template !== r.design.template ? { ...r, design: { ...r.design, template } } : r

  return (
    <div ref={ref} className={`relative w-full overflow-hidden bg-white ${className}`} style={{ aspectRatio: '210 / 297' }}>
      <div
        className="cv-page absolute top-0 left-0 origin-top-left flex flex-col pointer-events-none select-none !shadow-none"
        style={{ transform: `scale(${scale})`, height: '297mm', fontFamily: `'${rr.design.font}', sans-serif`, fontSize: rr.design.fontSize + 'px', lineHeight: rr.design.lineHeight }}
      >
        <div className="flex-1 flex flex-col [&>*]:flex-1">{renderTemplate(rr)}</div>
      </div>
    </div>
  )
}
