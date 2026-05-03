import { useState, useEffect } from 'react'
import {
  User, Mail, MapPin, Globe, Github, Linkedin, Save, Edit3, X,
  Shield, Code, BookOpen, MessageSquare, Award, Users, Star, Plus, Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../api'

const DOMAIN_OPTIONS = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science',
  'Machine Learning', 'Cloud Computing', 'DevOps', 'Cybersecurity',
  'Blockchain', 'Digital Marketing', 'Content Creation', 'SEO',
  'E-Commerce', 'Social Media', 'Business Strategy', 'Project Management',
  'Community Building', 'No-Code/Low-Code', 'WordPress', 'Shopify',
]

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getProfile(String(user.id))
      .then(p => {
        const data = {
          ...p,
          name: p.name || user.name || '',
          email: p.email || user.email || '',
          picture: p.picture || user.picture || '',
        }
        setProfile(data)
        setForm(data)
      })
      .catch(() => {
        const fallback = {
          user_id: String(user.id), name: user.name || '', email: user.email || '',
          picture: user.picture || '', bio: '', is_technical: false,
          domains: [], skills: [], location: '', website: '', github: '', linkedin: '',
          questions_count: 0, answers_count: 0, reputation: 0, groups: [],
        }
        setProfile(fallback)
        setForm(fallback)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(String(user.id), form)
      setProfile(form)
      setEditing(false)
    } catch { /* */ }
    setSaving(false)
  }

  const toggleDomain = (d) => {
    setForm(f => ({
      ...f,
      domains: f.domains.includes(d) ? f.domains.filter(x => x !== d) : [...f.domains, d],
    }))
  }

  const addSkill = () => {
    if (!skillInput.trim()) return
    if (!form.skills.includes(skillInput.trim())) {
      setForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }))
    }
    setSkillInput('')
  }

  const removeSkill = (s) => {
    setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-8 h-8" /></div>
  if (!profile) return null

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Card */}
      <div className="glass-card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-blue-500/40" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-[#0a0a12] overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              {profile.picture ? (
                <img src={profile.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold">{(profile.name || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{profile.name || 'Anonymous'}</h2>
                {profile.is_technical ? (
                  <span className="badge badge-purple text-[10px]"><Code className="w-3 h-3" /> Technical</span>
                ) : (
                  <span className="badge badge-blue text-[10px]"><BookOpen className="w-3 h-3" /> Non-Technical</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{profile.email}</p>
              {profile.bio && <p className="text-sm text-gray-300 mt-2">{profile.bio}</p>}
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-ghost shrink-0">
              {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/5">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{profile.questions_count}</div>
              <div className="text-[10px] text-gray-500">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{profile.answers_count}</div>
              <div className="text-[10px] text-gray-500">Answers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{profile.reputation}</div>
              <div className="text-[10px] text-gray-500">Reputation</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{profile.groups?.length || 0}</div>
              <div className="text-[10px] text-gray-500">Groups</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-card p-6 space-y-5 border border-purple-500/20">
          <h3 className="font-semibold flex items-center gap-2"><Edit3 className="w-4 h-4 text-purple-400" /> Edit Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
              <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. San Francisco, CA" className="glass-input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Bio</label>
              <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself…" className="glass-input w-full h-20" />
            </div>
          </div>

          {/* Tech/Non-tech toggle */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Are you a technical person?</label>
            <div className="flex gap-2">
              <button onClick={() => setForm(f => ({ ...f, is_technical: true }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.is_technical ? 'bg-purple-600/30 text-white border border-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-white/10'}`}>
                <Code className="w-3.5 h-3.5 inline mr-1" /> Yes, Technical
              </button>
              <button onClick={() => setForm(f => ({ ...f, is_technical: false }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!form.is_technical ? 'bg-blue-600/30 text-white border border-blue-500/30' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-white/10'}`}>
                <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Non-Technical
              </button>
            </div>
          </div>

          {/* Domains */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Domains / Expertise</label>
            <div className="flex flex-wrap gap-1.5">
              {DOMAIN_OPTIONS.map(d => (
                <button key={d} onClick={() => toggleDomain(d)} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${form.domains?.includes(d) ? 'bg-purple-600/30 text-white border border-purple-500/30' : 'text-gray-500 hover:text-white bg-white/[0.03] border border-white/10'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Skills</label>
            <div className="flex gap-2 mb-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill…" className="glass-input flex-1 text-sm" />
              <button onClick={addSkill} className="btn-ghost"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(form.skills || []).map(s => (
                <span key={s} className="badge text-[10px] flex items-center gap-1">
                  {s} <button onClick={() => removeSkill(s)}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
              <input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</label>
              <input value={form.github || ''} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="username" className="glass-input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</label>
              <input value={form.linkedin || ''} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="username" className="glass-input w-full" />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><div className="spinner w-4 h-4" /> Saving…</> : <><Save className="w-4 h-4" /> Save Profile</>}
          </button>
        </div>
      )}

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Domains */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Domains & Expertise</h3>
          {(profile.domains || []).length === 0 ? (
            <p className="text-xs text-gray-600">No domains set. Edit your profile to add expertise areas.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.domains.map(d => (
                <span key={d} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-purple-600/15 text-purple-300 border border-purple-500/20">{d}</span>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-blue-400" /> Skills</h3>
          {(profile.skills || []).length === 0 ? (
            <p className="text-xs text-gray-600">No skills added yet. Edit your profile to showcase your abilities.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map(s => (
                <span key={s} className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-600/15 text-blue-300 border border-blue-500/20">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      {(profile.website || profile.github || profile.linkedin || profile.location) && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Links & Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4 text-gray-500" /> {profile.location}</div>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"><Globe className="w-4 h-4" /> {profile.website}</a>
            )}
            {profile.github && (
              <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><Github className="w-4 h-4" /> {profile.github}</a>
            )}
            {profile.linkedin && (
              <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"><Linkedin className="w-4 h-4" /> {profile.linkedin}</a>
            )}
          </div>
        </div>
      )}

      {/* Groups */}
      {(profile.groups || []).length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Groups</h3>
          <div className="flex flex-wrap gap-2">
            {profile.groups.map(g => (
              <span key={g.id} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/15 text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
                <span>{g.icon}</span> {g.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
