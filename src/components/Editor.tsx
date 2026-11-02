import { useRef, useState } from 'react'
import { ArrowLeft, Download, FileJson, Palette, PenLine, Printer, Upload, ZoomIn, ZoomOut, Info, X } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import ContentPanel from './ContentPanel'
import DesignPanel from './DesignPanel'
import Preview from './Preview'
import { LangSwitch } from './Dashboard'
import AuthBox, { SyncStatus } from './AuthBox'
import { download, slugify } from '../utils'

export default function Editor() {
  const r = useCurrent()!
  const { uiLang, setUiLang, panel, setPanel, zoom, setZoom, selectResume, renameResume, importResume } = useStore()
  const t = ui(uiLang)
  const [showHint, setShowHint] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = () => download(`${slugify(r.name) || 'cv'}.json`, JSON.stringify(r, null, 2))
  const print = () => {
    const prev = document.title
    document.title = `${r.profile.fullName || 'CV'} - ${r.profile.title || r.name}`.trim()
    window.print()
    setTimeout(() => (document.title = prev), 500)
  }
  const onImport = async (f: File | undefined) => {
    if (!f) return
    try { importResume(JSON.parse(await f.text())) } catch { alert('Invalid JSON file') }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="no-print h-14 shrink-0 bg-white border-b border-gray-200 flex items-center gap-2 px-3">
        <button className="btn-ghost" onClick={() => selectResume(null)}><ArrowLeft size={16} />{t.back}</button>
        <input className="flex-1 min-w-0 max-w-sm rounded-md border border-transparent hover:border-gray-300 focus:border-blue-500 px-2 py-1 text-sm font-semibold outline-none" value={r.name} onChange={(e) => renameResume(r.id, e.target.value)} />
        <span className="hidden md:inline"><SyncStatus /></span>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1 mr-2">
          <button className="icon-btn" title={t.zoom} onClick={() => setZoom(Math.max(0.4, +(zoom - 0.1).toFixed(2)))}><ZoomOut size={16} /></button>
          <span className="text-xs w-10 text-center text-gray-600">{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" title={t.zoom} onClick={() => setZoom(Math.min(1.6, +(zoom + 0.1).toFixed(2)))}><ZoomIn size={16} /></button>
        </div>
        <LangSwitch value={uiLang} onChange={setUiLang} />
        <AuthBox compact />
        <button className="btn-secondary hidden sm:inline-flex" onClick={() => fileRef.current?.click()} title={t.importJson}><Upload size={16} /></button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = '' }} />
        <button className="btn-secondary hidden sm:inline-flex" onClick={exportJson} title={t.exportJson}><FileJson size={16} /><span className="hidden xl:inline">{t.exportJson}</span></button>
        <div className="relative">
          <button className="btn-primary" onClick={print}><Download size={16} />{t.exportPdf}</button>
        </div>
        <button className="icon-btn" onClick={() => setShowHint(!showHint)} title={t.pdfHint}><Info size={16} /></button>
      </header>

      {showHint && (
        <div className="no-print bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2 flex items-center gap-2">
          <Printer size={14} /><span className="flex-1">{t.pdfHint}</span>
          <button className="icon-btn !h-6 !w-6" onClick={() => setShowHint(false)}><X size={14} /></button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <aside className="no-print w-full lg:w-[440px] xl:w-[480px] shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col max-h-[45vh] lg:max-h-none">
          <div className="flex border-b border-gray-200 bg-white">
            <Tab active={panel === 'content'} onClick={() => setPanel('content')} icon={<PenLine size={15} />} label={t.content} />
            <Tab active={panel === 'design'} onClick={() => setPanel('design')} icon={<Palette size={15} />} label={t.design} />
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {panel === 'content' ? <ContentPanel /> : <DesignPanel />}
          </div>
        </aside>
        <main className="flex-1 min-h-0">
          <Preview />
        </main>
      </div>
    </div>
  )
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium cursor-pointer border-b-2 transition ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
      {icon}{label}
    </button>
  )
}
