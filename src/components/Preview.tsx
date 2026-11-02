import { useEffect, useRef, useState } from 'react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import { renderTemplate } from '../templates'

const PAGE_H_MM = 297

export default function Preview() {
  const r = useCurrent()!
  const { zoom, uiLang } = useStore()
  const t = ui(uiLang)
  const pageRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState(1)
  const [mmPx, setMmPx] = useState(3.78)

  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    const measure = () => {
      const pxPerMm = el.getBoundingClientRect().width / zoom / 210
      setMmPx(pxPerMm)
      // measure the natural content height, ignoring the min-height we impose for full pages
      const prev = el.style.minHeight
      el.style.minHeight = '0'
      const h = el.scrollHeight
      el.style.minHeight = prev
      setPages(Math.max(1, Math.ceil(h / (PAGE_H_MM * pxPerMm) - 0.002)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [zoom, r])

  return (
    <div className="preview-area h-full overflow-auto bg-gray-200/80 p-6">
      <div className="preview-scale origin-top mx-auto" style={{ transform: `scale(${zoom})`, width: '210mm', marginBottom: `calc(${PAGE_H_MM}mm * ${pages} * ${zoom - 1})` }}>
        <div ref={pageRef} className="cv-page mx-auto flex flex-col" style={{ minHeight: `${PAGE_H_MM * pages}mm`, fontFamily: `'${r.design.font}', sans-serif`, fontSize: r.design.fontSize + 'px', lineHeight: r.design.lineHeight }}>
          <div className="flex-1 flex flex-col [&>*]:flex-1">{renderTemplate(r)}</div>
          {Array.from({ length: pages - 1 }, (_, i) => (
            <div key={i} className="page-guide" style={{ top: `${(i + 1) * PAGE_H_MM * mmPx}px` }}><span>{t.page} {i + 2}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}
