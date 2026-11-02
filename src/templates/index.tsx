import type { Resume } from '../types'
import ITviec from './ITviec'
import Modern from './Modern'
import Classic from './Classic'
import Minimal from './Minimal'
import Creative from './Creative'

export function renderTemplate(r: Resume) {
  switch (r.design.template) {
    case 'modern': return <Modern r={r} />
    case 'classic': return <Classic r={r} />
    case 'minimal': return <Minimal r={r} />
    case 'creative': return <Creative r={r} />
    default: return <ITviec r={r} />
  }
}
