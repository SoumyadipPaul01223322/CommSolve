import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Copy, Check, RotateCcw, Lightbulb, Layers, Route } from 'lucide-react'
import { analyzeIntent, askAI, structureQuestion } from '../api'
import MarkdownRenderer from '../components/MarkdownRenderer'

export default function AskAI() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const addMsg = (role, content, meta) =>
    setMessages(prev => [...prev, { id: Date.now(), role, content, meta, ts: new Date() }])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    addMsg('user', text)
    setLoading(true)

    try {
      const [analysis, answer] = await Promise.all([
        analyzeIntent(text),
        askAI(text),
      ])
      addMsg('ai', answer.answer, { confidence: answer.confidence, analysis })
    } catch {
      addMsg('ai', 'Sorry, something went wrong. Please try again.', { error: true })
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const clearChat = () => { setMessages([]); setInput('') }

  const quickPrompts = [
    { icon: Lightbulb, text: 'I want to create a portfolio website' },
    { icon: Layers, text: 'Help me set up an online store' },
    { icon: Route, text: 'How do I automate my email workflow?' },
  ]

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">AI Assistant</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-md">
              Describe your problem or goal in plain language. I'll analyze it and give you actionable steps.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
              {quickPrompts.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => { setInput(text); }}
                  className="glass-card p-4 text-left text-sm hover:border-purple-500/30 group"
                >
                  <Icon className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-300">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'user' ? (
                <div className="bg-purple-600/30 border border-purple-500/20 rounded-2xl rounded-tr-sm px-4 py-3">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Analysis card */}
                  {msg.meta?.analysis && !msg.meta.error && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intent Analysis</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] text-gray-500 mb-1">Goal</div>
                          <div className="text-gray-300">{msg.meta.analysis.goal}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 mb-1">Category</div>
                          <span className="badge badge-purple">{msg.meta.analysis.category}</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 mb-1">Difficulty</div>
                          <span className="badge badge-blue">{msg.meta.analysis.difficulty}</span>
                        </div>
                      </div>
                      {msg.meta.analysis.suggestions?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="text-[10px] text-gray-500 mb-2">Suggestions</div>
                          <ul className="space-y-1">
                            {msg.meta.analysis.suggestions.map((s, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5">&#8226;</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI answer */}
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">AI Answer</span>
                        {msg.meta?.confidence != null && (
                          <span className="badge badge-green text-[10px]">
                            {Math.round(msg.meta.confidence * 100)}% confident
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyText(msg.id, msg.content)}
                        className="btn-ghost text-xs"
                      >
                        {copied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied === msg.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="spinner w-5 h-5" />
              <span className="text-sm text-gray-400">AI is thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="pt-4 border-t border-white/5">
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <button onClick={clearChat} className="btn-ghost text-xs"><RotateCcw className="w-3 h-3" /> Clear chat</button>
          </div>
        )}
        <div className="glass-card p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your problem or goal…"
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500 px-3 py-2 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="btn-primary py-2 px-3 shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">AI responses are generated — always verify important information</p>
      </div>
    </div>
  )
}
