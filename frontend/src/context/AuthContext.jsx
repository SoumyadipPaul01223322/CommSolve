import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)
const STORAGE_KEY = 'commsolve_user'

// Emails that get the admin role — add yours here
const ADMIN_EMAILS = ['admin@commsolve.app']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { /* corrupt */ }
    }
    setLoading(false)
  }, [])

  // Persist user whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  /**
   * Start Google OAuth flow:
   * 1. Ask backend for Google consent URL
   * 2. Open popup window to that URL
   * 3. Listen for redirect back with ?code=
   * 4. Send code to backend to exchange for user info
   */
  const loginWithGoogle = () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get the Google OAuth URL from backend
        const callbackUri = window.location.origin + '/auth/callback'
        const { data } = await axios.get('/api/auth/google/url', {
          params: { redirect_uri: callbackUri },
        })
        const authUrl = data.url

        // Open popup
        const width = 500, height = 600
        const left = window.screenX + (window.innerWidth - width) / 2
        const top = window.screenY + (window.innerHeight - height) / 2
        const popup = window.open(
          authUrl,
          'google-login',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Poll popup for the redirect with ?code=
        const interval = setInterval(async () => {
          try {
            if (!popup || popup.closed) {
              clearInterval(interval)
              reject(new Error('Login cancelled'))
              return
            }
            const url = popup.location.href
            if (url.includes('code=')) {
              clearInterval(interval)
              popup.close()

              const urlParams = new URL(url).searchParams
              const code = urlParams.get('code')

              // Exchange code for user info via backend
              const { data: result } = await axios.post('/api/auth/google/callback', {
                code,
                redirect_uri: window.location.origin + '/auth/callback',
              })

              const u = {
                ...result.user,
                role: ADMIN_EMAILS.includes(result.user.email) ? 'admin' : 'member',
              }
              setUser(u)
              resolve(u)
            }
          } catch {
            // Cross-origin — popup hasn't redirected yet, keep polling
          }
        }, 500)
      } catch (err) {
        reject(err)
      }
    })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
