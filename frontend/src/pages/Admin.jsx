import { useState, useEffect } from 'react'
import {
  Users, MessageSquare, Layers, Shield, TrendingUp,
  CheckCircle2, XCircle, Eye, Ban, UserPlus, BarChart3,
  Activity, Clock, Sparkles, AlertCircle, ArrowUpRight,
  Lock, LogIn, Hash, Bell, Link2, MessageCircle, Route,
} from 'lucide-react'
import { verifyAdmin, getAdminStats, getQuestions } from '../api'
import { useAuth } from '../context/AuthContext'

const ADMIN_SESSION_KEY = 'commsolve_admin_verified'

export default function Admin() {
  const { user } = useAuth()
  const [verified, setVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const [stats, setStats] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [moderated, setModerated] = useState({})

  // Check if already verified this session
  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') setVerified(true)
  }, [])

  // Load data after verified
  useEffect(() => {
    if (!verified) return
    Promise.all([getAdminStats(), getQuestions()])
      .then(([s, q]) => { setStats(s); setQuestions(q) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [verified])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setVerifying(true)
    try {
      await verifyAdmin(password)
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      setVerified(true)
    } catch {
      setError('Invalid admin password')
    }
    setVerifying(false)
  }

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setVerified(false)
    setPassword('')
  }

  // ── Password Gate ──
  if (!verified) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="glass-card p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-1">Admin Access Required</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the admin password to access the dashboard</p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="glass-input w-full pr-10 text-center tracking-widest"
                autoFocus
              />
              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs justify-center">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}
            <button
              type="submit"
              disabled={!password || verifying}
              className="btn-primary w-full"
            >
              {verifying ? <div className="spinner w-4 h-4" /> : <><LogIn className="w-4 h-4" /> Unlock Dashboard</>}
            </button>
          </form>
          <p className="text-[10px] text-gray-600 mt-4">Protected by server-side verification</p>
        </div>
      </div>
    )
  }

  if (loading || !stats) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'content', label: 'Moderation', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: TrendingUp },
  ]

  const handleModerate = (qId, action) => {
    setModerated(prev => ({ ...prev, [qId]: action }))
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Admin header */}
      <div className="glass-card p-5 bg-gradient-to-r from-indigo-600/20 to-purple-500/10 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Community Admin Dashboard</h2>
              <p className="text-xs text-gray-400">Welcome, {user?.name?.split(' ')[0] || 'Admin'} — manage your community, members, and content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-purple text-xs"><Lock className="w-3 h-3" /> Verified Admin</span>
            <button onClick={handleLogoutAdmin} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Lock</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl w-fit overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === id ? 'bg-purple-600/40 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Members', value: stats.profiles, icon: Users, color: 'from-blue-500 to-cyan-500', sub: `${stats.connections} connections` },
              { label: 'Questions', value: stats.questions, icon: MessageSquare, color: 'from-purple-500 to-pink-500', sub: `${stats.open} open · ${stats.solved} solved` },
              { label: 'Templates', value: stats.templates, icon: Layers, color: 'from-emerald-500 to-green-500', sub: `${stats.build_paths} build paths` },
              { label: 'Answers', value: stats.answers, icon: Sparkles, color: 'from-amber-500 to-orange-500', sub: `${stats.ai_answers} AI · ${stats.community_answers} community` },
            ].map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="stat-card">
                <div className={`stat-icon bg-gradient-to-br ${color}`}><Icon className="w-5 h-5" /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
                <div className="text-[10px] text-gray-500 mt-1">{sub}</div>
              </div>
            ))}
          </div>

          {/* Two columns: activity + category breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent activity */}
            <div className="lg:col-span-2 glass-card">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Recent Questions</h3>
                <span className="text-[10px] text-gray-500">{questions.length} total</span>
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {questions.slice(0, 8).map(q => (
                  <div key={q.id} className="p-3 px-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${q.status === 'solved' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{q.title}</div>
                      <div className="text-[10px] text-gray-500">{q.category}</div>
                    </div>
                    <span className={`badge text-[9px] ${q.status === 'solved' ? 'badge-green' : 'badge-amber'}`}>{q.status}</span>
                  </div>
                ))}
                {questions.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No activity yet</div>}
              </div>
            </div>

            {/* Category breakdown */}
            <div className="glass-card">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-semibold text-sm">Questions by Category</h3>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(stats.categories || {}).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">{cat}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${(count / Math.max(stats.questions, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(stats.categories || {}).length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-4">No data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Resolution Rate', value: `${stats.resolution_rate}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Groups', value: stats.groups, icon: Hash, color: 'text-cyan-400', bg: 'bg-cyan-500/10', sub: `${stats.group_memberships} memberships` },
              { label: 'Group Messages', value: stats.group_messages, icon: MessageCircle, color: 'text-pink-400', bg: 'bg-pink-500/10', sub: `${stats.direct_messages} DMs` },
              { label: 'Notifications', value: stats.notifications, icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: 'system-wide' },
            ].map(k => (
              <div key={k.label} className="glass-card p-4 text-center">
                <div className={`w-9 h-9 mx-auto mb-2 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                </div>
                <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-gray-500 mt-1">{k.label}</div>
                {k.sub && <div className="text-[10px] text-gray-600 mt-0.5">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Engagement Score */}
          <div className="glass-card p-5 bg-gradient-to-r from-blue-600/10 to-cyan-500/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-sm">Engagement Score</h4>
                <p className="text-[10px] text-gray-500">Members + Connections + Groups + Answers</p>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {stats.engagement_score}<span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${stats.engagement_score}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Members ── */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Community Members</h3>
              <p className="text-xs text-gray-500 mt-0.5">{stats.profiles} registered members</p>
            </div>
            <button className="btn-primary text-xs"><UserPlus className="w-3 h-3" /> Invite Member</button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bio</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats.members || []).map(m => (
                  <tr key={m.user_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {m.picture ? (
                          <img src={m.picture} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-purple-500 to-pink-500">
                            {(m.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{m.name || 'Unknown'}</div>
                          <div className="text-[10px] text-gray-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[9px] ${m.is_technical ? 'badge-blue' : 'badge-amber'}`}>
                        {m.is_technical ? 'Technical' : 'Non-Technical'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400 max-w-xs truncate">{m.bio || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-green text-[9px]"><CheckCircle2 className="w-2.5 h-2.5" /> Active</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn-ghost text-xs" title="View profile"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="btn-ghost text-xs text-red-400" title="Ban user"><Ban className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!stats.members || stats.members.length === 0) && (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500 text-sm">No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Content Moderation ── */}
      {tab === 'content' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Content Moderation</h3>
              <p className="text-xs text-gray-500 mt-0.5">Review and moderate community questions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-amber text-xs">{questions.filter(q => !moderated[q.id]).length} pending</span>
            </div>
          </div>
          <div className="glass-card divide-y divide-white/5">
            {questions.map(q => {
              const status = moderated[q.id]
              return (
                <div key={q.id} className={`p-4 transition-all ${status ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${q.status === 'solved' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{q.title}</span>
                        <span className="badge text-[9px]">{q.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{q.description}</p>
                      {status && (
                        <div className={`mt-2 text-xs font-medium ${status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {status === 'approved' ? '✓ Approved' : '✗ Removed'}
                        </div>
                      )}
                    </div>
                    {!status && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleModerate(q.id, 'approved')} className="btn-ghost text-emerald-400 text-xs hover:bg-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleModerate(q.id, 'removed')} className="btn-ghost text-red-400 text-xs hover:bg-red-500/10">
                          <XCircle className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {questions.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No content to moderate</div>
            )}
          </div>
        </div>
      )}

      {/* ── Analytics ── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="font-semibold">Community Analytics</h3>

          {/* Health score */}
          <div className="glass-card p-6 bg-gradient-to-r from-purple-600/10 to-pink-500/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-sm">Community Health Score</h4>
                <p className="text-xs text-gray-500 mt-0.5">Based on activity, resolution rate, and engagement</p>
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                {stats.engagement_score}
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                style={{ width: `${stats.engagement_score}%` }}
              />
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Avg. Response Time</div>
              <div className="text-xl font-bold text-white">&lt; 1s</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1"><Sparkles className="w-3 h-3" /> AI instant</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Resolution Rate</div>
              <div className="text-xl font-bold text-white">{stats.questions > 0 ? Math.round((stats.solved / stats.questions) * 100) : 0}%</div>
              <div className="text-[10px] text-gray-500 mt-1">{stats.solved} of {stats.questions}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Active Users</div>
              <div className="text-xl font-bold text-white">{stats.profiles}</div>
              <div className="text-[10px] text-blue-400 mt-1">{stats.connections} connections</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Resources Used</div>
              <div className="text-xl font-bold text-white">{stats.templates + stats.build_paths}</div>
              <div className="text-[10px] text-gray-500 mt-1">{stats.templates} templates · {stats.build_paths} paths</div>
            </div>
          </div>

          {/* Top categories bar chart */}
          <div className="glass-card p-5">
            <h4 className="font-semibold text-sm mb-4">Category Distribution</h4>
            <div className="space-y-3">
              {Object.entries(stats.categories || {}).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 truncate">{cat}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-end px-2 transition-all duration-500"
                      style={{ width: `${Math.max(20, (count / stats.questions) * 100)}%` }}
                    >
                      <span className="text-[10px] font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <h3 className="font-semibold">Community Settings</h3>
          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Community Name</label>
              <input defaultValue="My Local Community" className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
              <textarea defaultValue="A local community for non-technical people to get help building things online." className="glass-input w-full h-24" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Categories</label>
              <div className="flex flex-wrap gap-2">
                {['Online Presence', 'Sell Something', 'Organize Community', 'Automate Something', 'Fix Something'].map(c => (
                  <span key={c} className="badge badge-purple text-xs">{c}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-sm font-medium mb-3">Feature Toggles</h4>
              <div className="space-y-3">
                {[
                  { label: 'Auto AI Answers', desc: 'AI automatically answers new questions', on: true },
                  { label: 'Content Moderation', desc: 'Review posts before they go live', on: false },
                  { label: 'Expert Verification', desc: 'Verify expert members before granting badge', on: false },
                  { label: 'Email Notifications', desc: 'Send email when new questions are posted', on: true },
                ].map(({ label, desc, on }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-[10px] text-gray-500">{desc}</div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${on ? 'bg-purple-500' : 'bg-white/20'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${on ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-sm font-medium mb-3 text-red-400">Danger Zone</h4>
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Delete Community</div>
                  <div className="text-[10px] text-gray-500">This action cannot be undone</div>
                </div>
                <button className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                  Delete
                </button>
              </div>
            </div>

            <button className="btn-primary w-full">Save Settings</button>
          </div>
        </div>
      )}
    </div>
  )
}
