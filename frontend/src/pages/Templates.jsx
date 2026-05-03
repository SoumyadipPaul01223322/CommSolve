import { useState, useEffect } from 'react'
import { Search, ExternalLink, Flame, Plus, X, Send, CheckCircle2, Sparkles, Copy, Layers } from 'lucide-react'
import { getTemplates, createTemplate } from '../api'
import { useAuth } from '../context/AuthContext'

const CATS = ['All', 'Online Presence', 'Sell Something', 'Organize Community', 'Automate Something']
const DIFF_BADGE = {
  Beginner: 'badge-green',
  Intermediate: 'badge-amber',
  Advanced: 'badge-purple',
}

export default function Templates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', category: 'Online Presence', difficulty: 'Beginner', stack: '' })

  const load = () => {
    setLoading(true)
    getTemplates(filter === 'All' ? undefined : filter)
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.stack?.toLowerCase().includes(search.toLowerCase())
  )

  const handleUse = (t) => {
    setSelected(t)
    setCopied(null)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  const submitTemplate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTemplate({ ...form, author_id: 1 })
      setShowForm(false)
      setForm({ title: '', description: '', category: 'Online Presence', difficulty: 'Beginner', stack: '' })
      load()
    } catch { /* */ }
    setSubmitting(false)
  }

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-sm">Ready-made solutions you can launch in minutes</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500"><span className="text-emerald-400 font-bold">{templates.length}</span> templates available</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 glass-input py-2 px-3 w-full md:w-64">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500" />
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary shrink-0 text-sm">
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={submitTemplate} className="glass-card p-6 space-y-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-400" /> Share a Template</h3>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Portfolio Template" className="glass-input w-full" required minLength={3} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tech Stack</label>
              <input value={form.stack} onChange={e => setForm(f => ({ ...f, stack: e.target.value }))} placeholder="e.g. React + Tailwind" className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input w-full">
                {CATS.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="glass-input w-full">
                {['Beginner', 'Intermediate', 'Advanced'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this template does…" className="glass-input w-full h-24" required minLength={10} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <><div className="spinner w-4 h-4" /> Creating…</> : <><Send className="w-4 h-4" /> Publish Template</>}
          </button>
        </form>
      )}

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${c === filter ? 'bg-emerald-600/30 text-white border border-emerald-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">No templates match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t.id} className="glass-card p-5 flex flex-col hover:border-white/15 transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold leading-snug">{t.title}</h3>
                <span className={`badge ${DIFF_BADGE[t.difficulty] || ''} shrink-0 text-[10px]`}>{t.difficulty}</span>
              </div>

              <p className="text-sm text-gray-400 flex-1 line-clamp-3 mb-4">{t.description}</p>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="badge badge-purple text-[10px]">{t.category}</span>
                {t.stack && <span className="badge text-[10px]">{t.stack}</span>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {t.usage_count} uses
                </span>
                <button onClick={() => handleUse(t)} className="btn-primary text-xs py-1.5 px-4">
                  Use Template <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div className="glass-card p-6 max-w-lg w-full space-y-4 border border-purple-500/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{selected.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${DIFF_BADGE[selected.difficulty] || ''} text-[10px]`}>{selected.difficulty}</span>
                  <span className="badge badge-purple text-[10px]">{selected.category}</span>
                  {selected.stack && <span className="badge text-[10px]">{selected.stack}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{selected.description}</p>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Quick Start</span>
                <button onClick={() => handleCopy(`npx create-app ${selected.title.toLowerCase().replace(/\s+/g, '-')}`)} className="btn-ghost text-[10px]">
                  {copied ? <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <code className="text-xs text-purple-300 block">
                npx create-app {selected.title.toLowerCase().replace(/\s+/g, '-')}
              </code>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>AI will guide you through the setup if you need help</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(null); window.location.href = '/ask-ai' }} className="btn-primary flex-1">
                <Sparkles className="w-4 h-4" /> Get AI Setup Help
              </button>
              <button onClick={() => setSelected(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
