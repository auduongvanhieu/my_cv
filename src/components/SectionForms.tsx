import { Plus } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import type { SectionItem } from '../types'
import { Hint, Input, ItemCard, MonthInput, Row, TextArea } from './fields'
import { uid } from '../utils'

export default function SectionForm({ section }: { section: SectionItem }) {
  const r = useCurrent()!
  const s = useStore()
  const t = ui(s.uiLang)
  const mv = { moveUp: t.moveUp, moveDown: t.moveDown, remove: t.remove }

  switch (section.key) {
    case 'summary':
      return (
        <div className="space-y-2">
          <Hint>{t.summaryHint}</Hint>
          <TextArea label={t.description} rows={7} value={r.summary} onChange={(v) => s.update({ summary: v })} placeholder={t.contentPlaceholder} hint={t.richHint} />
        </div>
      )
    case 'interests':
      return <TextArea label={t.description} rows={4} value={r.interests} onChange={(v) => s.update({ interests: v })} placeholder={t.contentPlaceholder} hint={t.richHint} />

    case 'experience':
      return (
        <div className="space-y-3">
          <Hint>{t.experienceHint}</Hint>
          {r.experience.map((e, i) => (
            <ItemCard key={e.id} t={mv} title={[e.position, e.company].filter(Boolean).join(' · ')} index={i} total={r.experience.length}
              onMove={(to) => s.moveItem('experience', i, to)} onRemove={() => s.removeItem('experience', e.id)}>
              <Row>
                <Input label={t.position} value={e.position} onChange={(v) => s.updateItem('experience', e.id, { position: v })} />
                <Input label={t.company} value={e.company} onChange={(v) => s.updateItem('experience', e.id, { company: v })} />
              </Row>
              <Row cols={3}>
                <MonthInput label={t.start} value={e.start} onChange={(v) => s.updateItem('experience', e.id, { start: v })} />
                <MonthInput label={t.end} value={e.end} disabled={e.current} onChange={(v) => s.updateItem('experience', e.id, { end: v })} />
                <label className="flex items-end gap-2 pb-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={e.current} onChange={(ev) => s.updateItem('experience', e.id, { current: ev.target.checked })} />{t.current}
                </label>
              </Row>
              <TextArea label={t.description} value={e.description} onChange={(v) => s.updateItem('experience', e.id, { description: v })} placeholder={t.contentPlaceholder} />
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('experience', { id: uid(), company: '', position: '', start: '', end: '', current: false, description: '' })} />
        </div>
      )

    case 'education':
      return (
        <div className="space-y-3">
          {r.education.map((e, i) => (
            <ItemCard key={e.id} t={mv} title={e.school} index={i} total={r.education.length}
              onMove={(to) => s.moveItem('education', i, to)} onRemove={() => s.removeItem('education', e.id)}>
              <Input label={t.school} value={e.school} onChange={(v) => s.updateItem('education', e.id, { school: v })} />
              <Row>
                <Input label={t.degree} value={e.degree} onChange={(v) => s.updateItem('education', e.id, { degree: v })} placeholder="Cử nhân / Bachelor" />
                <Input label={t.major} value={e.major} onChange={(v) => s.updateItem('education', e.id, { major: v })} />
              </Row>
              <Row>
                <MonthInput label={t.start} value={e.start} onChange={(v) => s.updateItem('education', e.id, { start: v })} />
                <MonthInput label={t.end} value={e.end} onChange={(v) => s.updateItem('education', e.id, { end: v })} />
              </Row>
              <TextArea label={t.description} rows={2} value={e.description} onChange={(v) => s.updateItem('education', e.id, { description: v })} placeholder="GPA, thành tích..." />
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('education', { id: uid(), school: '', degree: '', major: '', start: '', end: '', description: '' })} />
        </div>
      )

    case 'skills':
      return (
        <div className="space-y-3">
          <Hint>{t.skillsHint}</Hint>
          {r.skillGroups.map((g, gi) => (
            <ItemCard key={g.id} t={mv} title={g.name} index={gi} total={r.skillGroups.length}
              onMove={(to) => s.moveItem('skillGroups', gi, to)} onRemove={() => s.removeItem('skillGroups', g.id)}>
              <Input label={t.groupName} value={g.name} onChange={(v) => s.updateItem('skillGroups', g.id, { name: v })} placeholder="Core skills / Backend / Mobile" />
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_72px_96px_28px] gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <span>{t.skillName}</span><span>{t.level}</span><span>{t.years}</span><span />
                </div>
                {g.skills.map((sk, si) => (
                  <div key={sk.id} className="grid grid-cols-[1fr_72px_96px_28px] gap-1.5 items-center">
                    <input className="input !py-1" value={sk.name} onChange={(e) => updateSkill(g.id, si, { name: e.target.value })} />
                    <select className="input !py-1 !px-1" value={sk.level} onChange={(e) => updateSkill(g.id, si, { level: Number(e.target.value) })}>
                      {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? '—' : `${n}/5`}</option>)}
                    </select>
                    <input className="input !py-1" value={sk.years} onChange={(e) => updateSkill(g.id, si, { years: e.target.value })} placeholder="3 năm" />
                    <button className="icon-btn hover:!text-red-600" onClick={() => s.updateItem('skillGroups', g.id, { skills: g.skills.filter((x) => x.id !== sk.id) })}>×</button>
                  </div>
                ))}
                <button className="btn-ghost !py-1 !text-xs" onClick={() => s.updateItem('skillGroups', g.id, { skills: [...g.skills, { id: uid(), name: '', level: 0, years: '' }] })}><Plus size={14} />{t.addSkill}</button>
              </div>
            </ItemCard>
          ))}
          <AddBtn label={t.addGroup} onClick={() => s.addItem('skillGroups', { id: uid(), name: '', skills: [{ id: uid(), name: '', level: 0, years: '' }] })} />
        </div>
      )

    case 'projects':
      return (
        <div className="space-y-3">
          <Hint>{t.projectsHint}</Hint>
          {r.projects.map((p, i) => (
            <ItemCard key={p.id} t={mv} title={p.name} index={i} total={r.projects.length}
              onMove={(to) => s.moveItem('projects', i, to)} onRemove={() => s.removeItem('projects', p.id)}>
              <Row>
                <Input label={t.projectName} value={p.name} onChange={(v) => s.updateItem('projects', p.id, { name: v })} />
                <Input label={t.company} value={p.company} onChange={(v) => s.updateItem('projects', p.id, { company: v })} />
              </Row>
              <Input label={t.role} value={p.role} onChange={(v) => s.updateItem('projects', p.id, { role: v })} />
              <Row cols={3}>
                <MonthInput label={t.start} value={p.start} onChange={(v) => s.updateItem('projects', p.id, { start: v })} />
                <MonthInput label={t.end} value={p.end} onChange={(v) => s.updateItem('projects', p.id, { end: v })} />
                <Input label={t.link} value={p.link} onChange={(v) => s.updateItem('projects', p.id, { link: v })} placeholder="https://" />
              </Row>
              <TextArea label={t.description} rows={5} value={p.description} onChange={(v) => s.updateItem('projects', p.id, { description: v })} placeholder={t.contentPlaceholder} />
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('projects', { id: uid(), name: '', company: '', role: '', start: '', end: '', link: '', description: '' })} />
        </div>
      )

    case 'certificates':
      return (
        <div className="space-y-3">
          {r.certificates.map((c, i) => (
            <ItemCard key={c.id} t={mv} title={c.name} index={i} total={r.certificates.length}
              onMove={(to) => s.moveItem('certificates', i, to)} onRemove={() => s.removeItem('certificates', c.id)}>
              <Input label={t.certName} value={c.name} onChange={(v) => s.updateItem('certificates', c.id, { name: v })} />
              <Row cols={3}>
                <Input label={t.issuer} value={c.issuer} onChange={(v) => s.updateItem('certificates', c.id, { issuer: v })} />
                <MonthInput label={t.date} value={c.date} onChange={(v) => s.updateItem('certificates', c.id, { date: v })} />
                <Input label={t.link} value={c.link} onChange={(v) => s.updateItem('certificates', c.id, { link: v })} />
              </Row>
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('certificates', { id: uid(), name: '', issuer: '', date: '', link: '' })} />
        </div>
      )

    case 'languages':
      return (
        <div className="space-y-3">
          {r.languages.map((l, i) => (
            <ItemCard key={l.id} t={mv} title={l.name} index={i} total={r.languages.length}
              onMove={(to) => s.moveItem('languages', i, to)} onRemove={() => s.removeItem('languages', l.id)}>
              <Row>
                <Input label={t.language} value={l.name} onChange={(v) => s.updateItem('languages', l.id, { name: v })} />
                <Input label={t.proficiency} value={l.level} onChange={(v) => s.updateItem('languages', l.id, { level: v })} placeholder="IELTS 6.5 / Fluent" />
              </Row>
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('languages', { id: uid(), name: '', level: '' })} />
        </div>
      )

    case 'activities':
      return (
        <div className="space-y-3">
          {r.activities.map((a, i) => (
            <ItemCard key={a.id} t={mv} title={a.title} index={i} total={r.activities.length}
              onMove={(to) => s.moveItem('activities', i, to)} onRemove={() => s.removeItem('activities', a.id)}>
              <Row>
                <Input label={t.activityTitle} value={a.title} onChange={(v) => s.updateItem('activities', a.id, { title: v })} />
                <Input label={t.organization} value={a.organization} onChange={(v) => s.updateItem('activities', a.id, { organization: v })} />
              </Row>
              <Row>
                <MonthInput label={t.start} value={a.start} onChange={(v) => s.updateItem('activities', a.id, { start: v })} />
                <MonthInput label={t.end} value={a.end} onChange={(v) => s.updateItem('activities', a.id, { end: v })} />
              </Row>
              <TextArea label={t.description} rows={3} value={a.description} onChange={(v) => s.updateItem('activities', a.id, { description: v })} />
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('activities', { id: uid(), title: '', organization: '', start: '', end: '', description: '' })} />
        </div>
      )

    case 'awards':
      return (
        <div className="space-y-3">
          {r.awards.map((a, i) => (
            <ItemCard key={a.id} t={mv} title={a.title} index={i} total={r.awards.length}
              onMove={(to) => s.moveItem('awards', i, to)} onRemove={() => s.removeItem('awards', a.id)}>
              <Input label={t.awardTitle} value={a.title} onChange={(v) => s.updateItem('awards', a.id, { title: v })} />
              <Row>
                <Input label={t.issuer} value={a.issuer} onChange={(v) => s.updateItem('awards', a.id, { issuer: v })} />
                <MonthInput label={t.date} value={a.date} onChange={(v) => s.updateItem('awards', a.id, { date: v })} />
              </Row>
              <TextArea label={t.description} rows={2} value={a.description} onChange={(v) => s.updateItem('awards', a.id, { description: v })} />
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('awards', { id: uid(), title: '', issuer: '', date: '', description: '' })} />
        </div>
      )

    case 'references':
      return (
        <div className="space-y-3">
          {r.references.map((x, i) => (
            <ItemCard key={x.id} t={mv} title={x.name} index={i} total={r.references.length}
              onMove={(to) => s.moveItem('references', i, to)} onRemove={() => s.removeItem('references', x.id)}>
              <Row>
                <Input label={t.refName} value={x.name} onChange={(v) => s.updateItem('references', x.id, { name: v })} />
                <Input label={t.position} value={x.position} onChange={(v) => s.updateItem('references', x.id, { position: v })} />
              </Row>
              <Row cols={3}>
                <Input label={t.company} value={x.company} onChange={(v) => s.updateItem('references', x.id, { company: v })} />
                <Input label={t.phone} value={x.phone} onChange={(v) => s.updateItem('references', x.id, { phone: v })} />
                <Input label={t.email} value={x.email} onChange={(v) => s.updateItem('references', x.id, { email: v })} />
              </Row>
            </ItemCard>
          ))}
          <AddBtn label={t.add} onClick={() => s.addItem('references', { id: uid(), name: '', position: '', company: '', phone: '', email: '' })} />
        </div>
      )

    case 'custom': {
      const c = r.customSections.find((x) => x.id === section.customId)
      if (!c) return null
      return (
        <div className="space-y-3">
          <Input label={t.sectionTitle} value={c.title} onChange={(v) => s.updateItem('customSections', c.id, { title: v })} />
          <TextArea label={t.description} rows={5} value={c.content} onChange={(v) => s.updateItem('customSections', c.id, { content: v })} placeholder={t.contentPlaceholder} hint={t.richHint} />
          <button className="btn-danger !text-xs" onClick={() => s.removeCustomSection(c.id)}>{t.remove}</button>
        </div>
      )
    }
  }

  function updateSkill(groupId: string, idx: number, patch: Partial<{ name: string; level: number; years: string }>) {
    const g = r.skillGroups.find((x) => x.id === groupId)!
    const skills = g.skills.map((x, i) => (i === idx ? { ...x, ...patch } : x))
    s.updateItem('skillGroups', groupId, { skills })
  }
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 cursor-pointer transition flex items-center justify-center gap-1" onClick={onClick}>
      <Plus size={15} />{label}
    </button>
  )
}
