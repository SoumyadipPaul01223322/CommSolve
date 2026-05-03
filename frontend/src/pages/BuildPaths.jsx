import { useState, useEffect } from 'react'
import { ChevronDown, Clock, CheckCircle, Sparkles, Route, Trophy, Flame } from 'lucide-react'
import { getBuildPaths } from '../api'
import { useAuth } from '../context/AuthContext'

const CATS = ['All', 'Online Presence', 'Sell Something', 'Organize Community', 'Automate Something']

export default function BuildPaths() {
  const { user } = useAuth()
  const [paths, setPaths] = useState([])
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [doneSteps, setDoneSteps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bp_progress') || '{}') } catch { return {} }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getBuildPaths(filter === 'All' ? undefined : filter)
      .then(setPaths)
      .catch(() => setPaths([]))
      .finally(() => setLoading(false))
  }, [filter])

  const toggleDone = (pathId, stepIdx) => {
    setDoneSteps(prev => {
      const key = `${pathId}-${stepIdx}`
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('bp_progress', JSON.stringify(next))
      return next
    })
  }

  const totalSteps = paths.reduce((a, p) => a + (p.steps?.length || 0), 0)
  const totalDone = Object.values(doneSteps).filter(Boolean).length
  const completedPaths = paths.filter(p => {
    const steps = p.steps || []
    return steps.length > 0 && steps.every((_, i) => doneSteps[`${p.id}-${i}`])
  }).length

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="glass-card p-5 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border-blue-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Build Paths</h2>
              <p className="text-xs text-gray-400">Step-by-step guided recipes to reach your goals</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{paths.length}</div>
              <div className="text-[10px] text-gray-500">Paths</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{completedPaths}</div>
              <div className="text-[10px] text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{totalDone}/{totalSteps}</div>
              <div className="text-[10px] text-gray-500">Steps Done</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${c === filter ? 'bg-blue-600/30 text-white border border-blue-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>
      ) : paths.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-500">No build paths in this category.</div>
      ) : (
        <div className="space-y-4">
          {paths.map(p => {
            const isOpen = expanded === p.id
            const steps = p.steps || []
            const completed = steps.filter((_, i) => doneSteps[`${p.id}-${i}`]).length
            const isComplete = steps.length > 0 && completed === steps.length
            const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0

            return (
              <div key={p.id} className={`glass-card overflow-hidden transition-all ${isComplete ? 'border-emerald-500/30' : ''}`}>
                {/* Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full p-5 flex items-start gap-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold mb-1">{p.title}</h3>
                      {isComplete && <Trophy className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="badge badge-blue text-[10px]">{p.category}</span>
                      <span className="text-xs text-gray-500">{steps.length} steps</span>
                      <span className={`badge text-[10px] ${isComplete ? 'badge-green' : completed > 0 ? 'badge-amber' : ''}`}>
                        {isComplete ? 'Completed!' : `${pct}%`}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Progress bar */}
                {steps.length > 0 && (
                  <div className="h-1.5 bg-white/5">
                    <div
                      className={`h-full transition-all duration-500 ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* Steps accordion */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-3 border-t border-white/5">
                    {isComplete && (
                      <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-emerald-300 font-medium">Congratulations! You've completed this build path.</span>
                      </div>
                    )}
                    <div className="relative ml-4">
                      {/* Vertical line */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />

                      {steps.map((step, idx) => {
                        const done = doneSteps[`${p.id}-${idx}`]
                        return (
                          <div key={idx} className="relative pl-8 pb-6 last:pb-0">
                            {/* Circle */}
                            <button
                              onClick={() => toggleDone(p.id, idx)}
                              className={`absolute left-0 top-0 -translate-x-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                done
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'bg-white/5 border-white/20 hover:border-blue-400'
                              }`}
                            >
                              {done
                                ? <CheckCircle className="w-4 h-4" />
                                : <span className="text-xs font-bold text-gray-400">{idx + 1}</span>}
                            </button>

                            <div className={done ? 'opacity-60' : ''}>
                              <h4 className={`font-medium text-sm ${done ? 'line-through text-gray-500' : ''}`}>{step.title}</h4>
                              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                              {step.time && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 mt-2">
                                  <Clock className="w-3 h-3" /> {step.time}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* AI help prompt */}
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/15 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Stuck on a step? AI can help you through it.</span>
                      </div>
                      <a href="/ask-ai" className="btn-ghost text-[10px] text-purple-400">Ask AI</a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
