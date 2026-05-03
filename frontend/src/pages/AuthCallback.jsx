import { useEffect } from 'react'
import { Sparkles } from 'lucide-react'

export default function AuthCallback() {
  useEffect(() => {
    // This page exists so Google can redirect here with ?code=
    // The parent popup window will detect the code and close this page
    // If opened directly (not as popup), just show a message
    const params = new URLSearchParams(window.location.search)
    if (params.get('code') && window.opener) {
      // Parent will pick it up via polling
    }
  }, [])

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="spinner w-8 h-8 mb-4" />
      <div className="flex items-center gap-2 text-gray-400">
        <Sparkles className="w-4 h-4 text-purple-400" />
        Completing sign in…
      </div>
    </div>
  )
}
