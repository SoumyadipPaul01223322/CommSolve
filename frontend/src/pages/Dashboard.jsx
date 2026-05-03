import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Route, MessageSquare, Sparkles, ArrowRight,
  Zap, Users, BookOpen, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react'
import { getTemplates, getQuestions, getBuildPaths } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ templates: 0, buildPaths: 0, questions: 0, solved: 0, myQuestions: 0 })
  const [recentQuestions, setRecentQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTemplates(), getBuildPaths(), getQuestions()])
      .then(([t, bp, q]) => {
        setStats({
          templates: t.length,
          buildPaths: bp.length,
          questions: q.length,
          solved: q.filter(x => x.status === 'solved').length,
          myQuestions: q.filter(x => x.user_id?.toString() === user?.id?.toString()).length,
        })
        setRecentQuestions(q.slice(0, 5))
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Templates', value: stats.templates, icon: Layers, color: 'from-emerald-500 to-green-600', link: '/templates' },
    { label: 'Build Paths', value: stats.buildPaths, icon: Route, color: 'from-blue-500 to-cyan-500', link: '/build-paths' },
    { label: 'Questions', value: stats.questions, icon: MessageSquare, color: 'from-purple-500 to-pink-500', link: '/questions' },
    { label: 'Solved', value: stats.solved, icon: CheckCircle2, color: 'from-amber-500 to-orange-500', link: '/questions' },
  ]

  const quickActions = [
    { label: 'Ask AI', desc: 'Get instant AI help', icon: Sparkles, to: '/ask-ai', color: 'from-purple-600 to-pink-500' },
    { label: 'Browse Templates', desc: 'Ready-made solutions', icon: Layers, to: '/templates', color: 'from-emerald-500 to-green-600' },
    { label: 'Post a Question', desc: 'Get community help', icon: MessageSquare, to: '/questions', color: 'from-blue-500 to-cyan-500' },
  ]

  const helpLadder = [
    { level: 0, title: 'Instant Solutions', desc: 'Launch in minutes with ready templates', icon: Zap, color: 'from-green-400 to-emerald-500' },
    { level: 1, title: 'Guided Build Paths', desc: 'Step-by-step recipes for your goal', icon: BookOpen, color: 'from-blue-400 to-cyan-500' },
    { level: 2, title: 'AI + Community Help', desc: 'Ask AI first, then the community', icon: Sparkles, color: 'from-purple-400 to-pink-500' },
    { level: 3, title: 'Knowledge Reuse', desc: 'Every answer helps the next person', icon: Users, color: 'from-orange-400 to-red-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome */}
      <div className="glass-card p-6 bg-gradient-to-r from-purple-600/20 to-pink-500/10 border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h2>
            <p className="text-gray-400">Here's what's happening in your community today</p>
          </div>
          <Link to="/ask-ai" className="btn-primary shrink-0">
            <Sparkles className="w-4 h-4" /> Get Started
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="stat-card group">
            <div className={`stat-icon bg-gradient-to-br ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label flex items-center gap-1">
              {label}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
          {quickActions.map(({ label, desc, icon: Icon, to, color }) => (
            <Link key={to} to={to} className="glass-card p-4 flex items-center gap-4 group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent Questions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Questions</h3>
            <Link to="/questions" className="btn-ghost text-xs">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="glass-card divide-y divide-white/5">
            {recentQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No questions yet. Be the first to ask!</div>
            ) : (
              recentQuestions.map(q => (
                <div key={q.id} className="p-4 flex items-start gap-3 hover:bg-white/[0.03] transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${q.status === 'solved' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{q.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                      <span className="badge text-[10px]">{q.category}</span>
                      {q.status === 'solved' && <span className="badge-green badge text-[10px]"><CheckCircle2 className="w-3 h-3" /> Solved</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Help Ladder */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">The Help Ladder</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {helpLadder.map(({ level, title, desc, icon: Icon, color }) => (
            <div key={level} className="glass-card p-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-xs text-gray-500 mb-1">Level {level}</div>
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-sm text-gray-400">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
