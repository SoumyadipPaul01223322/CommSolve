import { useState, useEffect, useRef } from 'react'
import {
  Users, Plus, X, Send, Search, Hash, UserPlus, LogOut,
  MessageCircle, Crown, ChevronLeft, Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getGroups, createGroup, getGroup, joinGroup, leaveGroup,
  getGroupMessages, sendGroupMessage,
} from '../api'

const CATEGORIES = ['General', 'Tech Help', 'Design', 'Marketing', 'Business', 'No-Code', 'Beginners', 'Advanced']
const ICONS = ['💬', '🚀', '💡', '🎨', '📈', '🛠️', '🌐', '📱', '🤖', '🎯', '📚', '🔥']
const COLORS = ['purple', 'blue', 'emerald', 'amber', 'pink', 'cyan', 'red', 'orange']

const COLOR_MAP = {
  purple: 'from-purple-500 to-pink-500',
  blue: 'from-blue-500 to-cyan-500',
  emerald: 'from-emerald-500 to-green-500',
  amber: 'from-amber-500 to-orange-500',
  pink: 'from-pink-500 to-rose-500',
  cyan: 'from-cyan-500 to-teal-500',
  red: 'from-red-500 to-rose-600',
  orange: 'from-orange-500 to-amber-500',
}

export default function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')

  // Active channel
  const [activeGroup, setActiveGroup] = useState(null)
  const [activeDetail, setActiveDetail] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgText, setMsgText] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const chatEndRef = useRef(null)

  const [form, setForm] = useState({
    name: '', description: '', category: 'General', icon: '💬', color: 'purple',
  })

  const load = async () => {
    setLoading(true)
    try {
      const g = await getGroups(String(user?.id || ''))
      setGroups(g)
    } catch { setGroups([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  // Poll messages
  useEffect(() => {
    if (!activeGroup) return
    const iv = setInterval(async () => {
      try {
        const msgs = await getGroupMessages(activeGroup)
        setMessages(msgs)
      } catch { /* */ }
    }, 3000)
    return () => clearInterval(iv)
  }, [activeGroup])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openChannel = async (groupId) => {
    setActiveGroup(groupId)
    setMsgLoading(true)
    try {
      const [detail, msgs] = await Promise.all([
        getGroup(groupId),
        getGroupMessages(groupId),
      ])
      setActiveDetail(detail)
      setMessages(msgs)
    } catch { setMessages([]); setActiveDetail(null) }
    setMsgLoading(false)
  }

  const handleSendMsg = async (e) => {
    e.preventDefault()
    if (!msgText.trim() || !activeGroup) return
    try {
      await sendGroupMessage(activeGroup, {
        user_id: String(user.id),
        user_name: user.name || '',
        user_picture: user.picture || '',
        content: msgText,
      })
      setMsgText('')
      const msgs = await getGroupMessages(activeGroup)
      setMessages(msgs)
    } catch { /* */ }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await createGroup({
        ...form,
        creator_id: String(user.id),
        creator_name: user.name || '',
        creator_picture: user.picture || '',
      })
      setShowCreate(false)
      setForm({ name: '', description: '', category: 'General', icon: '💬', color: 'purple' })
      load()
    } catch { /* */ }
    setCreating(false)
  }

  const handleJoin = async (groupId) => {
    await joinGroup(groupId, String(user.id), user.name || '', user.picture || '')
    load()
    if (activeGroup === groupId) openChannel(groupId)
  }

  const handleLeave = async (groupId) => {
    await leaveGroup(groupId, String(user.id))
    if (activeGroup === groupId) { setActiveGroup(null); setActiveDetail(null) }
    load()
  }

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || g.category === catFilter
    return matchSearch && matchCat
  })

  const myGroups = filtered.filter(g => g.is_member)
  const discover = filtered.filter(g => !g.is_member)

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>

  // ── Channel view (Telegram style) ──
  if (activeGroup && activeDetail) {
    const isMember = groups.find(g => g.id === activeGroup)?.is_member
    return (
      <div className="max-w-5xl flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
        {/* Channel header */}
        <div className="glass-card p-4 flex items-center gap-3 rounded-b-none">
          <button onClick={() => { setActiveGroup(null); setActiveDetail(null) }} className="btn-ghost"><ChevronLeft className="w-5 h-5" /></button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[activeDetail.color] || COLOR_MAP.purple} flex items-center justify-center text-lg shrink-0`}>
            {activeDetail.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{activeDetail.name}</h3>
            <p className="text-[10px] text-gray-500">{activeDetail.member_count} members · {activeDetail.category}</p>
          </div>
          <div className="flex items-center gap-1">
            {/* Members avatars */}
            <div className="flex -space-x-2 mr-2">
              {(activeDetail.members || []).slice(0, 5).map((m, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#0a0a12] flex items-center justify-center text-[9px] font-bold overflow-hidden">
                  {m.user_picture ? <img src={m.user_picture} className="w-7 h-7 rounded-full" /> : (m.user_name || '?')[0]}
                </div>
              ))}
              {(activeDetail.members || []).length > 5 && (
                <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#0a0a12] flex items-center justify-center text-[9px]">
                  +{activeDetail.members.length - 5}
                </div>
              )}
            </div>
            {isMember ? (
              <button onClick={() => handleLeave(activeGroup)} className="btn-ghost text-xs text-red-400"><LogOut className="w-3.5 h-3.5" /></button>
            ) : (
              <button onClick={() => handleJoin(activeGroup)} className="btn-primary text-xs"><UserPlus className="w-3.5 h-3.5" /> Join</button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20 rounded-none">
          {msgLoading ? (
            <div className="flex justify-center py-10"><div className="spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map(m => {
              const isMe = m.user_id === String(user?.id)
              return (
                <div key={m.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                    {m.user_picture ? <img src={m.user_picture} className="w-8 h-8 rounded-full" /> : (m.user_name || '?')[0]}
                  </div>
                  <div className={`max-w-[65%] ${isMe ? 'text-right' : ''}`}>
                    <div className={`text-[10px] mb-0.5 ${isMe ? 'text-blue-400' : 'text-gray-500'}`}>
                      {isMe ? 'You' : m.user_name || 'Member'} · {m.created_at?.slice(11, 16) || ''}
                    </div>
                    <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                        : 'bg-white/[0.06] text-gray-200 rounded-bl-md'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {isMember ? (
          <form onSubmit={handleSendMsg} className="glass-card p-3 flex gap-2 rounded-t-none">
            <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message…" className="glass-input flex-1 py-2.5 text-sm" />
            <button type="submit" disabled={!msgText.trim()} className="btn-primary py-2.5 px-4 disabled:opacity-40"><Send className="w-4 h-4" /></button>
          </form>
        ) : (
          <div className="glass-card p-4 text-center rounded-t-none">
            <button onClick={() => handleJoin(activeGroup)} className="btn-primary"><UserPlus className="w-4 h-4" /> Join to send messages</button>
          </div>
        )}
      </div>
    )
  }

  // ── Groups list view ──
  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Community Groups</h2>
          <p className="text-xs text-gray-400">Join channels to discuss, learn, and collaborate — Telegram style</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 glass-input py-2 px-3 w-full md:w-56">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…" className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500" />
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary shrink-0 text-sm"><Plus className="w-4 h-4" /> Create</button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Hash className="w-4 h-4 text-purple-400" /> Create Group</h3>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Group Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Web Dev Beginners" className="glass-input w-full" required minLength={2} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this group about?" className="glass-input w-full h-16" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-purple-600/30 border border-purple-500/40 scale-110' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-9 h-9 rounded-lg bg-gradient-to-br ${COLOR_MAP[c]} transition-all ${form.color === c ? 'ring-2 ring-white/40 scale-110' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? <><div className="spinner w-4 h-4" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Group</>}
          </button>
        </form>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setCatFilter('All')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === 'All' ? 'bg-purple-600/30 text-white border border-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === c ? 'bg-purple-600/30 text-white border border-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>{c}</button>
        ))}
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Groups ({myGroups.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myGroups.map(g => (
              <button key={g.id} onClick={() => openChannel(g.id)} className="glass-card p-4 text-left hover:border-white/15 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[g.color] || COLOR_MAP.purple} flex items-center justify-center text-lg shrink-0`}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1.5">
                      {g.name}
                      <span className="badge badge-green text-[8px]">Joined</span>
                    </div>
                    <div className="text-[10px] text-gray-500">{g.member_count} members · {g.category}</div>
                  </div>
                </div>
                {g.description && <p className="text-xs text-gray-500 line-clamp-2">{g.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Discover */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">
          {myGroups.length > 0 ? 'Discover More Groups' : 'All Groups'} ({discover.length})
        </h3>
        {discover.length === 0 && myGroups.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Hash className="w-8 h-8 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500 text-sm mb-2">No groups yet. Be the first to create one!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-xs"><Plus className="w-3 h-3" /> Create Group</button>
          </div>
        ) : discover.length === 0 ? (
          <p className="text-xs text-gray-600">You've joined all available groups!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {discover.map(g => (
              <div key={g.id} className="glass-card p-4 hover:border-white/15 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[g.color] || COLOR_MAP.purple} flex items-center justify-center text-lg shrink-0`}>
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{g.name}</div>
                    <div className="text-[10px] text-gray-500">{g.member_count} members · {g.category}</div>
                  </div>
                </div>
                {g.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{g.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => openChannel(g.id)} className="btn-ghost text-xs flex-1">Preview</button>
                  <button onClick={() => handleJoin(g.id)} className="btn-primary text-xs flex-1"><UserPlus className="w-3 h-3" /> Join</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
