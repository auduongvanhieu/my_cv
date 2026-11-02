import { useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, User } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { SECTION_TITLES, ui } from '../i18n'
import type { SectionItem } from '../types'
import ProfileForm from './ProfileForm'
import SectionForm from './SectionForms'

export function sectionLabel(sec: SectionItem, r: { customSections: { id: string; title: string }[] }, locale: 'vi' | 'en') {
  if (sec.title) return sec.title
  if (sec.key === 'custom') return r.customSections.find((c) => c.id === sec.customId)?.title || ''
  return SECTION_TITLES[locale][sec.key]
}

export default function ContentPanel() {
  const r = useCurrent()!
  const { uiLang, setSections, addCustomSection } = useStore()
  const t = ui(uiLang)
  const [open, setOpen] = useState<string | null>('profile')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const ids = r.sections.map((s) => s.key + (s.customId || ''))
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    setSections(arrayMove(r.sections, from, to))
  }

  return (
    <div className="space-y-2">
      <Accordion id="profile" icon={<User size={16} className="text-blue-600" />} title={t.personal} open={open === 'profile'} onToggle={() => setOpen(open === 'profile' ? null : 'profile')}>
        <ProfileForm />
      </Accordion>

      <div className="flex items-center justify-between pt-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t.sections} · <span className="normal-case font-normal">{t.dragHint}</span></div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {r.sections.map((sec, i) => (
            <SortableSection key={ids[i]} id={ids[i]} sec={sec} index={i} open={open === ids[i]} onToggle={() => setOpen(open === ids[i] ? null : ids[i])} />
          ))}
        </SortableContext>
      </DndContext>

      <button className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition flex items-center justify-center gap-1" onClick={addCustomSection}>
        <Plus size={15} />{t.addSection}
      </button>
    </div>
  )
}

function SortableSection({ id, sec, index, open, onToggle }: { id: string; sec: SectionItem; index: number; open: boolean; onToggle: () => void }) {
  const r = useCurrent()!
  const { uiLang, toggleSection, setSectionTitle } = useStore()
  const t = ui(uiLang)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }
  const label = sectionLabel(sec, r, r.design.locale)

  return (
    <div ref={setNodeRef} style={style} className={`card ${sec.visible ? '' : 'opacity-60'}`}>
      <div className="flex items-center gap-1 px-2 py-2">
        <button className="icon-btn cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}><GripVertical size={16} /></button>
        <button className="flex-1 flex items-center gap-2 text-left text-sm font-semibold text-gray-800 cursor-pointer min-w-0" onClick={onToggle}>
          <span className="truncate">{label || <span className="text-gray-400 font-normal">({t.sectionTitle})</span>}</span>
          {!sec.visible && <span className="text-[10px] font-normal text-gray-400 border border-gray-300 rounded px-1">{t.hidden}</span>}
          <ChevronDown size={15} className={`ml-auto text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
        </button>
        <button className="icon-btn" title={sec.visible ? t.hide : t.show} onClick={() => toggleSection(index)}>{sec.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
      </div>
      {open && (
        <div className="border-t border-gray-100 p-3 space-y-3">
          {sec.key !== 'custom' && (
            <label className="block">
              <span className="field-label">{t.sectionTitle}</span>
              <input className="input" value={sec.title} placeholder={`${SECTION_TITLES[r.design.locale][sec.key]} (${t.customTitlePlaceholder})`} onChange={(e) => setSectionTitle(index, e.target.value)} />
            </label>
          )}
          <SectionForm section={sec} />
        </div>
      )}
    </div>
  )
}

function Accordion({ icon, title, open, onToggle, children }: { id: string; icon: React.ReactNode; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="card">
      <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-800 cursor-pointer" onClick={onToggle}>
        {icon}<span>{title}</span><ChevronDown size={15} className={`ml-auto text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-gray-100 p-3">{children}</div>}
    </div>
  )
}
