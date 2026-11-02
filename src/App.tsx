import { useEffect } from 'react'
import { useStore } from './store'
import Dashboard from './components/Dashboard'
import Editor from './components/Editor'

export default function App() {
  const currentId = useStore((s) => s.currentId)
  const exists = useStore((s) => s.resumes.some((r) => r.id === s.currentId))
  const uiLang = useStore((s) => s.uiLang)

  useEffect(() => {
    document.documentElement.lang = uiLang
  }, [uiLang])

  if (currentId && exists) return <Editor />
  return <Dashboard />
}
