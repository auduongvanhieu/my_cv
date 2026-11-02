import { useEffect, useRef } from 'react'
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react'
import { useStore } from '../store'
import { ui } from '../i18n'
import { loadGis, loginWithCredential, logout } from '../auth'

/** Google sign-in button, or the signed-in user with a sign-out action. */
export default function AuthBox({ compact = false }: { compact?: boolean }) {
  const { user, googleClientId, authReady, uiLang } = useStore()
  const t = ui(uiLang)
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user || !googleClientId || !btnRef.current) return
    let cancelled = false
    const el = btnRef.current
    loadGis().then(() => {
      if (cancelled || !window.google) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => loginWithCredential(res.credential).catch((e) => { console.error(e); alert(t.loginFailed) }),
      })
      el.innerHTML = ''
      window.google.accounts.id.renderButton(el, { theme: 'outline', size: compact ? 'medium' : 'large', text: 'signin_with', shape: 'pill', locale: uiLang })
    }).catch((e) => console.warn(e))
    return () => { cancelled = true }
  }, [user, googleClientId, uiLang, compact, t.loginFailed])

  if (!authReady || !googleClientId) return null

  if (!user) return <div ref={btnRef} className="min-h-8" />

  return (
    <div className="flex items-center gap-2">
      {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-7 w-7 rounded-full" /> : <div className="h-7 w-7 rounded-full bg-blue-100" />}
      {!compact && <div className="leading-tight hidden sm:block"><div className="text-sm font-medium">{user.name || user.email}</div><div className="text-[11px] text-gray-500">{user.email}</div></div>}
      <button className="icon-btn" title={t.logout} onClick={() => confirm(t.confirmLogout) && void logout()}><LogOut size={15} /></button>
    </div>
  )
}

/** Small status line: saved to account / saving / local-only. */
export function SyncStatus() {
  const { user, sync, uiLang, googleClientId } = useStore()
  const t = ui(uiLang)
  if (!user) return <span className="inline-flex items-center gap-1 text-[11px] text-gray-400"><CloudOff size={12} />{googleClientId ? t.localOnly : t.autosaved}</span>
  if (sync === 'saving') return <span className="inline-flex items-center gap-1 text-[11px] text-gray-500"><RefreshCw size={12} className="animate-spin" />{t.syncSaving}</span>
  if (sync === 'error') return <span className="inline-flex items-center gap-1 text-[11px] text-red-600"><CloudOff size={12} />{t.syncError}</span>
  return <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><Cloud size={12} />{t.syncSaved}</span>
}
