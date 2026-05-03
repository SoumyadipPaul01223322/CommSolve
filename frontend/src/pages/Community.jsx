import { useState, useEffect, useRef } from 'react'
import {
  Users, UserPlus, UserCheck, MessageCircle, Send, X, Search,
  ArrowRight, Check, Clock, Wifi,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getConnections, sendConnection, acceptConnection, removeConnection,
  getMessages, sendMessage, getCommunityMembers,
} from '../api'

export default function Community() {
  const { user } = useAuth()
  const [tab, setTab] = useState('connections')
  const [connections, setConnections] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatWith, setChatWith] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgText, setMsgText] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [search, setSearch] = useState('')
  const chatEndRef = useRef(null)

  const loadData = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [conns, ppl] = await Promise.all([
        getConnections(String(user.id)),
        getCommunityMembers(String(user.id)).catch(() => []),
      ])
      setConnections(conns)
      setMembers(ppl)
    } catch { /* */ }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user?.id])

  const accepted = connections.filter(c => c.status === 'accepted')
  const pendingIn = connections.filter(c => c.status === 'pending' && c.to_user_id === String(user?.id))
  const pendingSent = connections.filter(c => c.status === 'pending' && c.from_user_id === String(user?.id))

  const getOther = (c) => {
    const isFrom = c.from_user_id === String(user?.id)
    return {
      id: isFrom ? c.to_user_id : c.from_user_id,
      name: isFrom ? (c.to_user_name || `Member ${c.to_user_id.slice(0,6)}`) : (c.from_user_name || `Member ${c.from_user_id.slice(0,6)}`),
      picture: isFrom ? c.to_user_picture : c.from_user_picture,
    }
  }

  const handleConnect = async (memberId, memberName = '', memberPicture = '') => {
    try {
      await sendConnection({
        from_user_id: String(user.id),
        from_user_name: user.name || '',
        from_user_picture: user.picture || '',
        to_user_id: memberId,
        to_user_name: memberName,
        to_user_picture: memberPicture,
      })
      loadData()
    } catch { /* */ }
  }

  const handleAccept = async (connId) => {
    await acceptConnection(connId)
    loadData()
  }

  const handleRemove = async (connId) => {
    await removeConnection(connId)
    loadData()
  }

  const openChat = async (otherId, otherName, otherPicture) => {
    setChatWith({ id: otherId, name: otherName, picture: otherPicture })
    setMsgLoading(true)
    try {
      const msgs = await getMessages(String(user.id), otherId)
      setMessages(msgs)
    } catch { setMessages([]) }
    setMsgLoading(false)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages
  useEffect(() => {
    if (!chatWith) return
    const iv = setInterval(async () => {
      try {
        const msgs = await getMessages(String(user.id), chatWith.id)
        setMessages(msgs)
      } catch { /* */ }
    }, 3000)
    return () => clearInterval(iv)
  }, [chatWith?.id])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!msgText.trim() || !chatWith) return
    try {
      await sendMessage({
        sender_id: String(user.id),
        receiver_id: chatWith.id,
        content: msgText,
      })
      setMsgText('')
      const msgs = await getMessages(String(user.id), chatWith.id)
      setMessages(msgs)
    } catch { /* */ }
  }

  const isConnected = (memberId) => {
    return connections.some(c =>
      c.status === 'accepted' &&
      (c.from_user_id === memberId || c.to_user_id === memberId)
    )
  }

  const isPending = (memberId) => {
    return connections.some(c =>
      c.status === 'pending' &&
      (c.from_user_id === memberId || c.to_user_id === memberId)
    )
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="glass-card p-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Community Network</h2>
            <p className="text-xs text-gray-400">Connect with members, collaborate, and chat</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs text-gray-500"><span className="text-blue-400 font-bold">{accepted.length}</span> connections</span>
          <span className="text-xs text-gray-500"><span className="text-amber-400 font-bold">{pendingIn.length}</span> pending</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit">
        {[
          { id: 'connections', label: 'My Connections', icon: UserCheck },
          { id: 'discover', label: 'Discover People', icon: Search },
          { id: 'chat', label: 'Messages', icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-blue-600/40 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Connections Tab ── */}
      {tab === 'connections' && (
        <div className="space-y-4">
          {/* Pending requests */}
          {pendingIn.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Pending Requests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingIn.map(c => {
                  const other = getOther(c)
                  return (
                    <div key={c.id} className="glass-card p-4 flex items-center gap-3 border border-amber-500/20">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {other.picture ? <img src={other.picture} className="w-10 h-10 rounded-full" /> : other.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{other.name}</div>
                        <div className="text-[10px] text-gray-500">Wants to connect</div>
                      </div>
                      <button onClick={() => handleAccept(c.id)} className="btn-primary text-xs py-1.5"><Check className="w-3 h-3" /> Accept</button>
                      <button onClick={() => handleRemove(c.id)} className="btn-ghost text-xs text-red-400"><X className="w-3 h-3" /></button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accepted connections */}
          <h3 className="text-sm font-semibold text-gray-400">Your Connections ({accepted.length})</h3>
          {accepted.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500 text-sm mb-2">No connections yet</p>
              <button onClick={() => setTab('discover')} className="btn-primary text-xs"><Search className="w-3 h-3" /> Discover People</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {accepted.map(c => {
                const other = getOther(c)
                return (
                  <div key={c.id} className="glass-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                      {other.picture ? <img src={other.picture} className="w-10 h-10 rounded-full" /> : other.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{other.name}</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> Connected</div>
                    </div>
                    <button onClick={() => { openChat(other.id, other.name, other.picture); setTab('chat') }} className="btn-ghost text-xs"><MessageCircle className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleRemove(c.id)} className="btn-ghost text-xs text-red-400"><X className="w-3 h-3" /></button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Discover Tab ── */}
      {tab === 'discover' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 glass-input py-2 px-3 w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…" className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500" />
          </div>

          {members.length === 0 ? (
            <div className="glass-card p-10 text-center text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">No community members found yet. Members appear as people ask or answer questions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
                <div key={m.user_id} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                    {m.picture ? <img src={m.picture} className="w-10 h-10 rounded-full" /> : (m.name?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-[10px] text-gray-500">Community Member</div>
                  </div>
                  {isConnected(m.user_id) ? (
                    <span className="badge badge-green text-[9px]"><UserCheck className="w-2.5 h-2.5" /> Connected</span>
                  ) : isPending(m.user_id) ? (
                    <span className="badge badge-amber text-[9px]"><Clock className="w-2.5 h-2.5" /> Pending</span>
                  ) : (
                    <button onClick={() => handleConnect(m.user_id, m.name, m.picture)} className="btn-primary text-xs py-1.5">
                      <UserPlus className="w-3 h-3" /> Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {tab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: '500px' }}>
          {/* Contacts list */}
          <div className="space-y-2 overflow-y-auto max-h-[500px]">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Conversations</h4>
            {accepted.length === 0 ? (
              <div className="glass-card p-6 text-center text-gray-500 text-sm">Connect with members to start chatting</div>
            ) : (
              accepted.map(c => {
                const other = getOther(c)
                return (
                  <button
                    key={c.id}
                    onClick={() => openChat(other.id, other.name, other.picture)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      chatWith?.id === other.id ? 'bg-blue-500/15 border border-blue-500/30' : 'glass-card'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                      {other.picture ? <img src={other.picture} className="w-9 h-9 rounded-full" /> : other.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{other.name}</div>
                      <div className="text-[10px] text-gray-500">Click to chat</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                  </button>
                )
              })
            )}
          </div>

          {/* Chat panel */}
          <div className="lg:col-span-2">
            {!chatWith ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <MessageCircle className="w-10 h-10 text-gray-600 mb-3" />
                <h3 className="font-semibold text-gray-400 mb-1">No conversation selected</h3>
                <p className="text-xs text-gray-600">Select a connection to start chatting</p>
              </div>
            ) : (
              <div className="glass-card flex flex-col h-full min-h-[400px] max-h-[500px]">
                {/* Chat header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {chatWith.picture ? <img src={chatWith.picture} className="w-8 h-8 rounded-full" /> : chatWith.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{chatWith.name}</div>
                    <div className="text-[10px] text-emerald-400">Online</div>
                  </div>
                  <button onClick={() => setChatWith(null)} className="btn-ghost"><X className="w-4 h-4" /></button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex justify-center py-8"><div className="spinner" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">No messages yet. Say hello!</p>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_id === String(user?.id) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          m.sender_id === String(user?.id)
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-md'
                            : 'bg-white/[0.06] text-gray-200 rounded-bl-md'
                        }`}>
                          {m.content}
                          <div className={`text-[9px] mt-1 ${m.sender_id === String(user?.id) ? 'text-blue-200' : 'text-gray-500'}`}>
                            {m.created_at?.slice(11, 16) || ''}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={handleSend} className="p-3 border-t border-white/5 flex gap-2">
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="Type a message…"
                    className="glass-input flex-1 py-2.5 text-sm"
                  />
                  <button type="submit" disabled={!msgText.trim()} className="btn-primary py-2.5 px-4 disabled:opacity-40">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
