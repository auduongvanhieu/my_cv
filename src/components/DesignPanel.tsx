import { Check } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import { ACCENTS, FONTS } from '../data/defaults'
import type { Design, Locale, TemplateId } from '../types'
import { Thumb } from './Dashboard'

const TEMPLATES: TemplateId[] = ['itviec', 'modern', 'classic', 'minimal', 'creative']

export default function DesignPanel() {
  const r = useCurrent()!
  const { uiLang, updateDesign } = useStore()
  const t = ui(uiLang)
  const d = r.design

  return (
    <div className="space-y-5">
      <Group title={t.template}>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((id) => (
            <button key={id} onClick={() => updateDesign({ template: id })}
              className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition text-left ${d.template === id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="h-28 bg-gray-100 relative"><Thumb accent={d.accent} template={id} /></div>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-white">{t.templates[id]}</div>
              {d.template === id && <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check size={12} /></span>}
            </button>
          ))}
        </div>
      </Group>

      <Group title={t.accent}>
        <div className="flex flex-wrap items-center gap-2">
          {ACCENTS.map((c) => (
            <button key={c} onClick={() => updateDesign({ accent: c })} style={{ background: c }}
              className={`h-7 w-7 rounded-full cursor-pointer border-2 ${d.accent === c ? 'border-white ring-2 ring-gray-800' : 'border-white ring-1 ring-gray-200'}`} />
          ))}
          <label className="h-7 w-7 rounded-full overflow-hidden cursor-pointer ring-1 ring-gray-200 relative" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} title="Custom">
            <input type="color" value={d.accent} onChange={(e) => updateDesign({ accent: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
      </Group>

      <Group title={t.font}>
        <select className="input" value={d.font} onChange={(e) => updateDesign({ font: e.target.value })}>
          {FONTS.map((f) => <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.label}</option>)}
        </select>
      </Group>

      <div className="grid grid-cols-3 gap-3">
        <Slider label={t.fontSize} value={d.fontSize} min={9} max={14} step={0.5} unit="px" onChange={(v) => updateDesign({ fontSize: v })} />
        <Slider label={t.lineHeight} value={d.lineHeight} min={1.2} max={1.9} step={0.05} onChange={(v) => updateDesign({ lineHeight: v })} />
        <Slider label={t.margin} value={d.margin} min={8} max={25} step={1} unit="mm" onChange={(v) => updateDesign({ margin: v })} />
      </div>

      <Group title={t.cvLanguage}>
        <Seg value={d.locale} options={[['vi', 'Tiếng Việt'], ['en', 'English']]} onChange={(v) => updateDesign({ locale: v as Locale })} />
      </Group>

      <Group title={t.skillStyle}>
        <Seg value={d.skillStyle} options={[['tags', t.tags], ['bars', t.bars], ['dots', t.dots], ['list', t.list]]} onChange={(v) => updateDesign({ skillStyle: v as Design['skillStyle'] })} />
      </Group>

      <Group title={t.photo}>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={d.showPhoto} onChange={(e) => updateDesign({ showPhoto: e.target.checked })} />{t.showPhoto}</label>
          <Seg value={d.photoShape} options={[['circle', t.circle], ['rounded', t.rounded], ['square', t.square]]} onChange={(v) => updateDesign({ photoShape: v as Design['photoShape'] })} />
        </div>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="field-label">{title}</div>{children}</div>
}

function Seg({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden bg-white">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={`px-3 py-1.5 text-xs font-medium cursor-pointer border-r last:border-r-0 border-gray-200 ${value === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{label}</button>
      ))}
    </div>
  )
}

function Slider({ label, value, min, max, step, unit = '', onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="field-label flex justify-between"><span>{label}</span><span className="text-gray-700 normal-case">{value}{unit}</span></div>
      <input type="range" className="w-full accent-blue-600" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}
