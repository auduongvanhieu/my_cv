import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Input({ label, value, onChange, type = 'text', placeholder, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string
}) {
  return (
    <Field label={label} className={className}>
      <input className="input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, hint, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; hint?: string; className?: string
}) {
  return (
    <Field label={label} className={className}>
      <textarea className="input" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </Field>
  )
}

/** Month picker that falls back gracefully to free text (e.g. "2024"). */
export function MonthInput({ label, value, onChange, disabled, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean; className?: string
}) {
  return (
    <Field label={label} className={className}>
      <input className="input" type="month" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function Row({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return <div className={`grid gap-3 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>{children}</div>
}

export function ItemCard({ title, index, total, onMove, onRemove, children, t }: {
  title: string; index: number; total: number; onMove: (to: number) => void; onRemove: () => void; children: ReactNode
  t: { moveUp: string; moveDown: string; remove: string }
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/60 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-700 truncate">{title || <span className="text-gray-400">#{index + 1}</span>}</div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button className="icon-btn" title={t.moveUp} disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp size={14} /></button>
          <button className="icon-btn" title={t.moveDown} disabled={index === total - 1} onClick={() => onMove(index + 1)}><ArrowDown size={14} /></button>
          <button className="icon-btn hover:!text-red-600" title={t.remove} onClick={onRemove}><Trash2 size={14} /></button>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[11.5px] leading-snug text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1.5">{children}</p>
}
