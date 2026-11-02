import { useRef, useState } from 'react'
import { Copy, FileText, Globe, Loader2, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { api } from '../api'
import { useStore } from '../store'
import { ui } from '../i18n'
import type { Locale } from '../types'
import AuthBox from './AuthBox'

export default function Dashboard() {
  const { resumes, uiLang, setUiLang, createResume, createFromParsed, duplicateResume, deleteResume, selectResume, importResume, user, googleClientId, aiParse } = useStore()
  const t = ui(uiLang)
  const fileRef = useRef<HTMLInputElement>(null)
  const cvRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const json = JSON.parse(await f.text())
      const id = importResume(json)
      if (!id) alert('Invalid file')
    } catch {
      alert('Invalid JSON file')
    }
  }

  const onUploadCv = async (f: File | undefined) => {
    if (!f) return
    if (!user) { alert(t.uploadCvLogin); return }
    setParsing(true)
    try {
      const data = await api.parseCV(f)
      createFromParsed(data, '')
    } catch (e) {
      alert(`${t.parseFailed}: ${e instanceof Error ? e.message : e}`)
    } finally {
      setParsing(false)
    }
  }

  const fmt = (ts: number) => new Date(ts).toLocaleString(uiLang === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="min-h-full">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><FileText size={18} /></div>
            <div>
              <div className="font-bold leading-tight">{t.appName}</div>
              <div className="text-[11px] text-gray-500 leading-tight">{t.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AuthBox />
            <LangSwitch value={uiLang} onChange={setUiLang} label={t.uiLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-bold">{t.myCvs}</h1>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={16} />{t.importJson}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = '' }} />
            {aiParse && (
              <>
                <button className="btn-secondary" disabled={parsing} onClick={() => (user ? cvRef.current?.click() : alert(t.uploadCvLogin))}>
                  {parsing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{parsing ? t.parsing : t.uploadCv}
                </button>
                <input ref={cvRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/*" className="hidden" onChange={(e) => { void onUploadCv(e.target.files?.[0]); e.target.value = '' }} />
              </>
            )}
            <button className="btn-primary" onClick={() => createResume()}><Plus size={16} />{t.newCv}</button>
          </div>
        </div>

        {!user && googleClientId && (
          <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">{t.loginHint}</div>
        )}
        {aiParse && (
          <div className="mb-5 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900 flex items-start gap-2"><Sparkles size={16} className="mt-0.5 shrink-0" /><span>{t.uploadCvHint}{!user && ` ${t.uploadCvLogin}`}</span></div>
        )}

        {resumes.length === 0 ? (
          <div className="card p-10 text-center text-gray-500">
            <FileText className="mx-auto mb-3 text-gray-300" size={40} />
            <p>{t.noCv}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <div key={r.id} className="card overflow-hidden group">
                <button className="block w-full text-left cursor-pointer" onClick={() => selectResume(r.id)}>
                  <div className="h-36 bg-gray-100 relative overflow-hidden">
                    <Thumb accent={r.design.accent} template={r.design.template} />
                  </div>
                  <div className="p-3">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-gray-500 truncate">{r.profile.fullName || '—'} · {r.profile.title || '—'}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{t.updated}: {fmt(r.updatedAt)}</div>
                  </div>
                </button>
                <div className="flex items-center justify-end gap-1 px-2 pb-2">
                  <button className="icon-btn" title={t.duplicate} onClick={() => duplicateResume(r.id)}><Copy size={15} /></button>
                  <button className="icon-btn hover:text-red-600" title={t.delete} onClick={() => confirm(t.confirmDelete) && deleteResume(r.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="mt-10 card p-5">
          <h2 className="font-semibold mb-2">{t.tips}</h2>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            {t.tipList.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      </main>
    </div>
  )
}

export function LangSwitch({ value, onChange, label }: { value: Locale; onChange: (l: Locale) => void; label?: string }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {label && <Globe size={14} className="text-gray-400" />}
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        {(['vi', 'en'] as Locale[]).map((l) => (
          <button key={l} onClick={() => onChange(l)} className={`px-2 py-1 text-xs font-semibold cursor-pointer ${value === l ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Tiny schematic thumbnail of a template. */
export function Thumb({ accent, template }: { accent: string; template: string }) {
  const bar = (w: string, extra = '') => <div className={`h-1.5 rounded bg-gray-300 ${extra}`} style={{ width: w }} />
  if (template === 'modern')
    return (
      <div className="absolute inset-3 bg-white shadow flex overflow-hidden">
        <div className="w-1/3 p-2 space-y-1.5" style={{ background: accent }}>
          <div className="h-8 w-8 rounded-full bg-white/80 mx-auto" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-1 rounded bg-white/60" />)}
        </div>
        <div className="flex-1 p-2 space-y-1.5">{bar('70%', 'h-2.5 !bg-gray-700')}{bar('40%')}{bar('90%')}{bar('85%')}{bar('60%')}{bar('88%')}</div>
      </div>
    )
  if (template === 'classic')
    return (
      <div className="absolute inset-3 bg-white shadow p-3 space-y-1.5">
        <div className="h-2.5 w-1/2 mx-auto rounded bg-gray-800" />
        <div className="h-1 w-1/3 mx-auto rounded bg-gray-400" />
        <div className="h-px my-2" style={{ background: accent }} />
        {bar('30%', '!bg-gray-700')}{bar('90%')}{bar('85%')}{bar('30%', '!bg-gray-700 mt-2')}{bar('80%')}
      </div>
    )
  if (template === 'minimal')
    return (
      <div className="absolute inset-3 bg-white shadow p-3 space-y-1.5">
        <div className="h-3 w-2/5 rounded bg-gray-800" />
        <div className="h-1 w-1/4 rounded" style={{ background: accent }} />
        {bar('90%', 'mt-2')}{bar('85%')}<div className="h-1 w-1/5 rounded mt-2" style={{ background: accent }} />{bar('80%')}{bar('70%')}
      </div>
    )
  if (template === 'creative')
    return (
      <div className="absolute inset-3 bg-white shadow overflow-hidden">
        <div className="h-9 p-2 flex items-center gap-2" style={{ background: accent }}>
          <div className="h-5 w-5 rounded-full bg-white/80" /><div className="h-2 w-1/2 rounded bg-white/80" />
        </div>
        <div className="flex p-2 gap-2">
          <div className="flex-[2] space-y-1.5">{bar('40%', '!bg-gray-700')}{bar('90%')}{bar('80%')}{bar('85%')}</div>
          <div className="flex-1 space-y-1.5">{bar('60%', '!bg-gray-700')}{bar('100%')}{bar('80%')}</div>
        </div>
      </div>
    )
  return (
    <div className="absolute inset-3 bg-white shadow overflow-hidden">
      <div className="h-9 p-2 flex items-center gap-2" style={{ background: accent }}>
        <div className="h-5 w-5 rounded bg-white/80" /><div className="space-y-1"><div className="h-2 w-16 rounded bg-white/80" /><div className="h-1 w-10 rounded bg-white/50" /></div>
      </div>
      <div className="p-2 space-y-1.5">
        <div className="flex gap-2">{bar('20%', '!bg-gray-700')}{bar('70%')}</div>
        <div className="flex gap-2">{bar('20%', '!bg-gray-700')}{bar('60%')}</div>
        <div className="flex gap-2">{bar('20%', '!bg-gray-700')}{bar('75%')}</div>
      </div>
    </div>
  )
}
