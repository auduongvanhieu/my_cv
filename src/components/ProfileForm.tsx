import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useStore, useCurrent } from '../store'
import { ui } from '../i18n'
import { Input, Row } from './fields'
import { readFileAsDataURL, resizeImage } from '../utils'

export default function ProfileForm() {
  const r = useCurrent()!
  const { updateProfile, uiLang } = useStore()
  const t = ui(uiLang)
  const p = r.profile
  const fileRef = useRef<HTMLInputElement>(null)

  const onPhoto = async (f: File | undefined) => {
    if (!f) return
    const data = await readFileAsDataURL(f)
    updateProfile({ photo: await resizeImage(data, 600) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
          {p.photo ? <img src={p.photo} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="text-gray-300" />}
        </div>
        <div className="space-y-1.5">
          <div className="field-label">{t.photo}</div>
          <div className="flex gap-2">
            <button className="btn-secondary !py-1 !text-xs" onClick={() => fileRef.current?.click()}><ImagePlus size={14} />{t.uploadPhoto}</button>
            {p.photo && <button className="btn-danger !py-1 !text-xs" onClick={() => updateProfile({ photo: '' })}><X size={14} />{t.removePhoto}</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      </div>
      <Input label={t.fullName} value={p.fullName} onChange={(v) => updateProfile({ fullName: v })} placeholder="NGUYEN VAN A" />
      <Input label={t.jobTitle} value={p.title} onChange={(v) => updateProfile({ title: v })} placeholder="Full Stack Developer" />
      <Row>
        <Input label={t.email} value={p.email} onChange={(v) => updateProfile({ email: v })} type="email" />
        <Input label={t.phone} value={p.phone} onChange={(v) => updateProfile({ phone: v })} />
      </Row>
      <Row>
        <Input label={t.birthday} value={p.birthday} onChange={(v) => updateProfile({ birthday: v })} type="date" />
        <Input label={t.address} value={p.address} onChange={(v) => updateProfile({ address: v })} />
      </Row>
      <Input label={t.website} value={p.website} onChange={(v) => updateProfile({ website: v })} placeholder="https://" />
      <Row>
        <Input label={t.linkedin} value={p.linkedin} onChange={(v) => updateProfile({ linkedin: v })} placeholder="linkedin.com/in/..." />
        <Input label={t.github} value={p.github} onChange={(v) => updateProfile({ github: v })} placeholder="github.com/..." />
      </Row>
    </div>
  )
}
