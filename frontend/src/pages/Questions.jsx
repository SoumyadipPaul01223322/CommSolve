import { useState, useEffect } from 'react'
import {
  Search, Plus, Send, CheckCircle2, Sparkles, X,
  MessageSquare, ThumbsUp, Clock, User, Filter, ArrowRight,
} from 'lucide-react'
import { getQuestions, getAnswers, createQuestion, createAnswer, acceptAnswer } from '../api'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { useAuth } from '../context/AuthContext'

const CATS = ['All', 'Online Presence', 'Sell Something', 'Organize Community', 'Automate Something', 'Fix Something']

export default function Questions() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Fix Something' })
  const [view, setView] = useState('all') // 'all' | 'mine'

  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [answerText, setAnswerText] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerSubmitting, setAnswerSubmitting] = useState(false)
  const [answerError, setAnswerError] = useState('')

  const load = () => {
    setLoading(true)
    getQuestions(filter === 'All' ? undefined : filter)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const openQuestion = (q) => {
    setSelected(q)
    setAnswerLoading(true)
    getAnswers(q.id)
      .then(setAnswers)
      .catch(() => setAnswers([]))
      .finally(() => setAnswerLoading(false))
  }

  const submitQuestion = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createQuestion({ ...form, user_id: String(user?.id || '1') })
      setShowForm(false)
      setForm({ title: '', description: '', category: 'Fix Something' })
      load()
    } catch { /* */ }
    setSubmitting(false)
  }

  const submitAnswer = async (e) => {
    e.preventDefault()
    if (!answerText.trim() || !selected) return
    setAnswerSubmitting(true)
    setAnswerError('')
    try {
      await createAnswer(selected.id, { content: answerText, user_id: String(user?.id || '1') })
      setAnswerText('')
      const a = await getAnswers(selected.id)
      setAnswers(a)
    } catch (err) {
      const msg = err?.response?.data?.detail
      setAnswerError(typeof msg === 'string' ? msg : 'Failed to submit answer. Please try again.')
      console.error('Failed to submit answer:', err)
    }
    setAnswerSubmitting(false)
  }

  const handleAccept = async (answerId) => {
    try {
      await acceptAnswer(answerId)
      const a = await getAnswers(selected.id)
      setAnswers(a)
      load()
    } catch { /* */ }
  }

  const isMyQuestion = (q) => q.user_id?.toString() === user?.id?.toString()

  let filtered = questions.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase())
  )
  if (view === 'mine') filtered = filtered.filter(isMyQuestion)

  const openCount = questions.filter(q => q.status !== 'solved').length
  const solvedCount = questions.filter(q => q.status === 'solved').length

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-sm">Ask your community or get instant AI answers</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500"><span className="text-purple-400 font-bold">{openCount}</span> open</span>
            <span className="text-xs text-gray-500"><span className="text-emerald-400 font-bold">{solvedCount}</span> solved</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 glass-input py-2 px-3 w-full sm:w-56">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" className="bg-transparent outline-none text-sm flex-1 text-white placeholder-gray-500" />
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> New Question
          </button>
        </div>
      </div>

      {/* New question form */}
      {showForm && (
        <form onSubmit={submitQuestion} className="glass-card p-6 space-y-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Ask the Community
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you need help with?" className="glass-input w-full" required minLength={5} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input w-full">
              {CATS.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your problem in detail — what are you trying to do? What have you tried?" className="glass-input w-full h-32" required minLength={10} />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <><div className="spinner w-4 h-4" /> Posting…</> : <><Send className="w-4 h-4" /> Post Question</>}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <span className="text-[10px] text-gray-600 ml-auto"><Sparkles className="w-3 h-3 inline text-purple-400" /> AI will auto-answer instantly</span>
          </div>
        </form>
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* View toggle */}
        <div className="flex gap-1 p-1 glass rounded-xl">
          <button onClick={() => setView('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'all' ? 'bg-purple-600/40 text-white' : 'text-gray-400 hover:text-white'}`}>
            All Questions
          </button>
          <button onClick={() => setView('mine')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'mine' ? 'bg-purple-600/40 text-white' : 'text-gray-400 hover:text-white'}`}>
            My Questions
          </button>
        </div>
        <div className="h-5 w-px bg-white/10 hidden sm:block" />
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATS.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${c === filter ? 'bg-purple-600/30 text-white border border-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Question list */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500 text-sm mb-3">{view === 'mine' ? "You haven't asked any questions yet" : 'No questions found'}</p>
              <button onClick={() => setShowForm(true)} className="btn-primary text-xs"><Plus className="w-3 h-3" /> Ask a Question</button>
            </div>
          ) : (
            filtered.map(q => (
              <button
                key={q.id}
                onClick={() => openQuestion(q)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                  selected?.id === q.id
                    ? 'bg-purple-500/15 border border-purple-500/30 shadow-lg shadow-purple-500/5'
                    : 'glass-card hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${q.status === 'solved' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm leading-tight">{q.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{q.category}</span>
                      {q.status === 'solved' && <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Solved</span>}
                      {isMyQuestion(q) && <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">You</span>}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-1" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-400 mb-1">No question selected</h3>
              <p className="text-xs text-gray-600 max-w-xs">Click on a question from the list to view details and answers from the community</p>
            </div>
          ) : (
            <div className="glass-card flex flex-col min-h-[500px] max-h-[calc(100vh-20rem)]">
              {/* Question header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="badge badge-purple text-[10px]">{selected.category}</span>
                      {selected.status === 'solved'
                        ? <span className="badge badge-green text-[10px]"><CheckCircle2 className="w-3 h-3" /> Solved</span>
                        : <span className="badge badge-amber text-[10px]"><Clock className="w-3 h-3" /> Open</span>}
                      {isMyQuestion(selected) && <span className="text-[10px] text-purple-400">Asked by you</span>}
                    </div>
                    <h3 className="font-semibold text-lg leading-snug">{selected.title}</h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">{selected.description}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="btn-ghost shrink-0"><X className="w-4 h-4" /></button>
                </div>

                {selected.structured_goal && (
                  <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500 block mb-0.5">Goal</span><span className="text-gray-300">{selected.structured_goal}</span></div>
                    {selected.structured_attempted && <div><span className="text-gray-500 block mb-0.5">Tried</span><span className="text-gray-300">{selected.structured_attempted}</span></div>}
                    {selected.structured_error && <div><span className="text-gray-500 block mb-0.5">Error</span><span className="text-gray-300">{selected.structured_error}</span></div>}
                  </div>
                )}
              </div>

              {/* Answers */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                  </h4>
                </div>

                {answerLoading ? (
                  <div className="flex justify-center py-8"><div className="spinner" /></div>
                ) : answers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm mb-1">No answers yet</p>
                    <p className="text-gray-600 text-xs">Be the first to help!</p>
                  </div>
                ) : (
                  answers.map(a => (
                    <div key={a.id} className={`p-4 rounded-xl text-sm transition-all ${
                      a.is_accepted
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : a.is_ai_generated
                          ? 'bg-purple-500/10 border border-purple-500/20'
                          : 'bg-white/[0.03] border border-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {a.is_ai_generated ? (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-gray-400">
                            {a.is_ai_generated ? 'AI Assistant' : 'Community Member'}
                          </span>
                          {a.is_ai_generated && <span className="badge badge-purple text-[9px]">AI</span>}
                          {!a.is_ai_generated && <span className="badge text-[9px]" style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.3)'}}>✓ AI Verified</span>}
                          {a.is_accepted && <span className="badge badge-green text-[9px]"><CheckCircle2 className="w-2.5 h-2.5" /> Accepted</span>}
                        </div>
                        {!a.is_accepted && selected.status !== 'solved' && isMyQuestion(selected) && (
                          <button onClick={() => handleAccept(a.id)} className="btn-ghost text-[10px] text-emerald-400 hover:text-emerald-300">
                            <ThumbsUp className="w-3 h-3" /> Accept Answer
                          </button>
                        )}
                      </div>
                      <MarkdownRenderer content={a.content} />
                    </div>
                  ))
                )}
              </div>

              {/* Community reply box */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500">Answering as <span className="text-white">{user?.name || 'Anonymous'}</span></span>
                </div>
                {answerError && <p className="text-red-400 text-xs mb-2">{answerError}</p>}
                <form onSubmit={submitAnswer} className="flex gap-2">
                  <input
                    value={answerText}
                    onChange={e => { setAnswerText(e.target.value); setAnswerError('') }}
                    placeholder="Write your answer to help the community…"
                    className="glass-input flex-1 py-2.5 text-sm"
                    disabled={answerSubmitting}
                  />
                  <button type="submit" disabled={!answerText.trim() || answerSubmitting} className="btn-primary py-2.5 px-4 disabled:opacity-40">
                    {answerSubmitting ? <div className="spinner w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
