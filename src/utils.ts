import type { Locale } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formats "YYYY-MM" or "YYYY" into "MM/YYYY" (vi) or "Mon YYYY" (en). Free text is returned as-is. */
export function fmtMonth(v: string, locale: Locale): string {
  if (!v) return ''
  const m = /^(\d{4})-(\d{2})$/.exec(v)
  if (m) {
    return locale === 'vi' ? `${m[2]}/${m[1]}` : `${MONTHS_EN[Number(m[2]) - 1]} ${m[1]}`
  }
  const y = /^(\d{4})$/.exec(v)
  if (y) return y[1]
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (d) return locale === 'vi' ? `${d[3]}/${d[2]}/${d[1]}` : `${d[3]} ${MONTHS_EN[Number(d[2]) - 1]} ${d[1]}`
  return v
}

export function fmtRange(start: string, end: string, current: boolean, locale: Locale): string {
  const s = fmtMonth(start, locale)
  const e = current ? (locale === 'vi' ? 'Hiện tại' : 'Present') : fmtMonth(end, locale)
  if (!s && !e) return ''
  if (!s) return e
  if (!e) return s
  return `${s} – ${e}`
}

export function fmtDate(v: string, locale: Locale): string {
  if (!v) return ''
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (d) return locale === 'vi' ? `${d[3]}/${d[2]}/${d[1]}` : `${d[3]} ${MONTHS_EN[Number(d[2]) - 1]} ${d[1]}`
  return fmtMonth(v, locale)
}

export function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Resize an image data URL to fit within max px (keeps aspect), returns JPEG data URL. */
export function resizeImage(dataUrl: string, max = 600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function isDark(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

export function alpha(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
