import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getNotifications, getUnreadCount, markAllRead, searchAll } from '../api'
import {
  LayoutDashboard, Layers, Route, MessageSquare, Users, Hash, User,
  Sparkles, Search, Bell, ChevronLeft, ChevronRight, Shield, LogOut,
  X, UserPlus, MessageCircle, CheckCircle2, ArrowRight,
} from 'lucide-react'

/* ── Sidebar ──────────────────────────────────────────── */

const NAV = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/templates',   label: 'Templates',   icon: Layers },
  { to: '/build-paths', label: 'Build Paths', icon: Route },
  { to: '/questions',   label: 'Q & A',       icon: MessageSquare },
  { to: '/ask-ai',      label: 'AI Assistant', icon: Sparkles },
  { to: '/community',   label: 'Community',    icon: Users },
  { to: '/groups',       label: 'Groups',       icon: Hash },
  { to: '/profile',      label: 'My Profile',   icon: User },
  { to: '/admin',       label: 'Admin',        icon: Shield, adminOnly: true },
]

export function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const links = NAV.filter(n => !n.adminOnly || isAdmin)

  return (
    <aside
      className={`glass-sidebar fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent whitespace-nowrap">
            CommSolve
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/40 to-pink-500/30 text-white border border-purple-500/30'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + Collapse */}
      <div className="px-2 pb-3 space-y-2 border-t border-white/5 pt-3">
        <UserBadge collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="btn-ghost w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

function UserBadge({ collapsed }) {
  const { user, logout } = useAuth()
  if (!user) return null

  const initial = (user.name || user.email || 'U')[0].toUpperCase()
  const photo = user.picture

  return (
    <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.06] transition-colors ${collapsed ? 'justify-center' : ''}`}>
      {photo ? (
        <img src={photo} alt="" className="w-8 h-8 rounded-full shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
          {initial}
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{user.name || 'User'}</div>
          <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
        </div>
      )}
      {!collapsed && (
        <button onClick={logout} className="btn-ghost p-1" title="Sign out">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── Top Bar ──────────────────────────────────────────── */

const NOTIF_ICONS = {
  connection_request: UserPlus,
  connection_accepted: CheckCircle2,
  new_answer: MessageCircle,
  default: Bell,
}

export function Topbar({ title }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const initial = (user?.name || user?.email || 'U')[0].toUpperCase()

  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  // Notifications
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)

  // Poll unread count
  useEffect(() => {
    if (!user?.id) return
    const fetch = () => getUnreadCount(String(user.id)).then(r => setUnread(r.count)).catch(() => {})
    fetch()
    const iv = setInterval(fetch, 10000)
    return () => clearInterval(iv)
  }, [user?.id])

  const openNotifs = async () => {
    setShowNotifs(!showNotifs)
    setResults(null)
    if (!showNotifs && user?.id) {
      try {
        const n = await getNotifications(String(user.id))
        setNotifs(n)
      } catch { setNotifs([]) }
    }
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    await markAllRead(String(user.id))
    setUnread(0)
    setNotifs(n => n.map(x => ({ ...x, is_read: 1 })))
  }

  // Search
  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await searchAll(query)
        setResults(r)
      } catch { setResults(null) }
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setResults(null); setQuery('') }
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goTo = (path) => { navigate(path); setResults(null); setQuery(''); setShowNotifs(false) }

  const totalResults = results ? results.templates.length + results.buildPaths.length + results.questions.length + results.groups.length : 0

  return (
    <header className="glass-topbar sticky top-0 z-30 h-16 px-6 flex items-center justify-between gap-4">
      <h1 className="text-lg font-semibold truncate">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center gap-2 glass-input py-2 px-3 w-64">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search anything…"
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500"
            />
            {query && <button onClick={() => { setQuery(''); setResults(null) }}><X className="w-3 h-3 text-gray-500" /></button>}
          </div>

          {/* Search Results Dropdown */}
          {results && (
            <div className="absolute top-full right-0 mt-2 w-80 glass-card border border-white/10 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-50">
              {totalResults === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No results for "{query}"</div>
              ) : (
                <div className="py-2">
                  {results.templates.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Templates ({results.templates.length})</div>
                      {results.templates.slice(0, 3).map(t => (
                        <button key={`t-${t.id}`} onClick={() => goTo('/templates')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-sm truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.buildPaths.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Build Paths ({results.buildPaths.length})</div>
                      {results.buildPaths.slice(0, 3).map(b => (
                        <button key={`b-${b.id}`} onClick={() => goTo('/build-paths')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                          <Route className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-sm truncate">{b.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.questions.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Questions ({results.questions.length})</div>
                      {results.questions.slice(0, 3).map(q => (
                        <button key={`q-${q.id}`} onClick={() => goTo('/questions')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-sm truncate">{q.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.groups.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase">Groups ({results.groups.length})</div>
                      {results.groups.slice(0, 3).map(g => (
                        <button key={`g-${g.id}`} onClick={() => goTo('/groups')} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-sm truncate">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={openNotifs} className="btn-ghost relative">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-pink-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute top-full right-0 mt-2 w-80 glass-card border border-white/10 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-50">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold">Notifications</span>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[10px] text-purple-400 hover:text-purple-300">Mark all read</button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
              ) : (
                notifs.map(n => {
                  const Icon = NOTIF_ICONS[n.type] || NOTIF_ICONS.default
                  return (
                    <button
                      key={n.id}
                      onClick={() => { if (n.link) goTo(n.link) }}
                      className={`w-full text-left p-3 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/[0.03] ${!n.is_read ? 'bg-purple-500/5' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${!n.is_read ? 'text-white' : 'text-gray-400'}`}>{n.title}</div>
                        {n.message && <div className="text-[10px] text-gray-500 mt-0.5 truncate">{n.message}</div>}
                        <div className="text-[9px] text-gray-600 mt-1">{n.created_at?.slice(0, 16).replace('T', ' ') || ''}</div>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1" />}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        {user?.picture ? (
          <img src={user.picture} alt="" className="w-8 h-8 rounded-full cursor-pointer" onClick={() => navigate('/profile')} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {initial}
          </div>
        )}
      </div>
    </header>
  )
}

export default Sidebar
