import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles, Layers, Route, MessageSquare, Users, Shield,
  ArrowRight, Zap, CheckCircle2, Globe, Hash, Bell,
  Star, Trophy, Gift, TrendingUp, Award, Crown,
  Heart, Search, UserPlus, MessageCircle, Rocket,
} from 'lucide-react'

const GOOGLE_ICON = (
  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
)

export default function Landing() {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-topbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              CommSolve
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden md:inline text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hidden md:inline text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#roadmap" className="hidden md:inline text-sm text-gray-400 hover:text-white transition-colors">Roadmap</a>
            <button onClick={handleLogin} className="btn-primary text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 badge badge-purple mb-6 text-sm px-4 py-2">
            <Sparkles className="w-4 h-4" /> AI + Community Powered
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Get Help Building<br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Anything Online
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            CommSolve connects non-technical people with AI assistance and local community experts.
            From your first website to automating your business — get guided help at every level.
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
            Ask a question, get an instant AI answer, earn rewards for helping others, join community groups, and grow your skills — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleLogin} className="btn-primary text-base px-8 py-3.5 rounded-2xl">
              {GOOGLE_ICON} Sign in with Google
            </button>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5 rounded-2xl">
              Explore Features <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-14 flex items-center justify-center gap-8 md:gap-14">
            {[
              { value: 'AI-First', label: 'Instant Answers' },
              { value: '10+', label: 'Features' },
              { value: 'Free', label: 'To Get Started' },
              { value: 'Open', label: 'Community' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg md:text-xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Help Ladder ═══ */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider text-center mb-2">The Help Ladder</h2>
          <p className="text-center text-gray-400 text-sm mb-8 max-w-lg mx-auto">Four escalating levels of help — from instant templates to community-powered expertise</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { level: 0, title: 'Templates', desc: 'Launch in minutes with ready-made solutions for portfolios, stores, and more', icon: Zap, color: 'from-emerald-500 to-green-500' },
              { level: 1, title: 'Build Paths', desc: 'Follow step-by-step guided recipes with progress tracking', icon: Route, color: 'from-blue-500 to-cyan-500' },
              { level: 2, title: 'AI + Community', desc: 'Get instant AI answers plus verified community help', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
              { level: 3, title: 'Knowledge Reuse', desc: 'Every answer becomes part of a searchable knowledge base', icon: Globe, color: 'from-amber-500 to-orange-500' },
            ].map(({ level, title, desc, icon: Icon, color }) => (
              <div key={level} className="glass-card p-5 text-center group hover:border-white/15 transition-all">
                <div className="text-3xl font-bold text-purple-400/30 mb-2">L{level}</div>
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-[11px] text-gray-500 mt-2 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Core Features ═══ */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed Online</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A complete platform to build, fix, learn, connect, and grow — powered by AI and real people who care.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Sparkles, title: 'AI-Powered Answers', desc: 'Every question gets an instant AI response. No waiting. Our AI analyzes your problem, structures it, and gives actionable solutions.', color: 'from-purple-500 to-pink-500' },
              { icon: Shield, title: 'AI Spam Verification', desc: 'Community answers are analyzed by AI before publishing. No spam, no low-effort replies — only helpful, verified responses.', color: 'from-red-500 to-rose-500' },
              { icon: Layers, title: 'Ready-Made Templates', desc: 'Launch portfolios, online stores, landing pages, and more in minutes. Browse by category, difficulty, and tech stack.', color: 'from-emerald-500 to-green-500' },
              { icon: Route, title: 'Guided Build Paths', desc: 'Interactive step-by-step guides with checkboxes. Track your progress, pick up where you left off, and never get lost.', color: 'from-blue-500 to-cyan-500' },
              { icon: MessageSquare, title: 'Community Q&A', desc: 'Ask questions, get AI + community answers, accept the best one. Questions are auto-structured for clarity.', color: 'from-pink-500 to-rose-500' },
              { icon: Hash, title: 'Group Channels', desc: 'Telegram-style community groups. Join channels by topic, chat in real-time, share knowledge, and collaborate.', color: 'from-cyan-500 to-teal-500' },
              { icon: UserPlus, title: 'Connect & Network', desc: 'Send connection requests, build your professional network, and DM other members directly — like LinkedIn.', color: 'from-indigo-500 to-purple-500' },
              { icon: Bell, title: 'Smart Notifications', desc: 'Get notified when someone answers your question, accepts your connection, or messages you. Never miss a thing.', color: 'from-amber-500 to-orange-500' },
              { icon: Search, title: 'Global Search', desc: 'Search across templates, build paths, questions, and groups all at once. Find answers fast from the topbar.', color: 'from-gray-400 to-gray-600' },
              { icon: Users, title: 'User Profiles', desc: 'Showcase your domains, skills, and expertise. Mark yourself as technical or non-technical. Add social links.', color: 'from-blue-500 to-indigo-500' },
              { icon: Shield, title: 'Admin Dashboard', desc: 'Community admins manage members, moderate Q&A, review analytics, and keep the community healthy.', color: 'from-violet-500 to-purple-500' },
              { icon: MessageCircle, title: 'Real-Time Chat', desc: 'Message connected users directly. Conversations update in real-time with typing indicators and read status.', color: 'from-green-500 to-emerald-500' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6 group hover:border-white/15 transition-all">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How CommSolve Works</h2>
            <p className="text-gray-400">Three simple steps to get from stuck to solved</p>
          </div>
          <div className="space-y-6">
            {[
              { num: '01', title: 'Sign In & Set Up Your Profile', desc: 'Login with Google in one click. Your profile is auto-created with your name and photo. Add your domains, skills, and whether you\'re technical or non-technical.', icon: Users },
              { num: '02', title: 'Ask, Build, or Browse', desc: 'Ask a question and get an instant AI answer. Browse templates and build paths. Join groups and connect with experts in your area of interest.', icon: Sparkles },
              { num: '03', title: 'Help Others & Earn Rewards', desc: 'Answer community questions (verified by AI for quality). Your accepted answers earn reputation. Top helpers get badges, profile boosts, and community recognition.', icon: Trophy },
            ].map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="glass-card p-6 flex items-start gap-5 group hover:border-white/15 transition-all">
                <div className="text-3xl font-black text-purple-500/20 shrink-0 w-12">{num}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1.5 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-purple-400" /> {title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Reply Perks & Rewards ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 badge badge-amber mb-4 text-sm px-4 py-2">
              <Trophy className="w-4 h-4" /> Rewards System
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Help Others. Earn Rewards.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Every helpful reply earns you points. Use them to boost your profile, unlock perks, and stand out in the community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {/* Reply Perks */}
            <div className="glass-card p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reply Perks</h3>
                  <p className="text-xs text-gray-500">Earn rewards just by being helpful</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Star, text: '+10 Reputation for every helpful answer' },
                  { icon: CheckCircle2, text: '+25 Bonus when your answer is accepted' },
                  { icon: Award, text: '+50 for AI-verified "Excellent" quality answers' },
                  { icon: TrendingUp, text: 'Streak bonuses for answering daily' },
                  { icon: Heart, text: 'Community upvotes multiply your earnings' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <p.icon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-gray-300">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reward Uses */}
            <div className="glass-card p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Use Your Rewards</h3>
                  <p className="text-xs text-gray-500">Spend reputation to unlock advantages</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: TrendingUp, text: 'Boost your profile to the top of search results' },
                  { icon: Star, text: 'Unlock "Expert" and "Top Helper" badges' },
                  { icon: Crown, text: 'Get a gold border on your profile and answers' },
                  { icon: Sparkles, text: 'Priority AI responses with faster processing' },
                  { icon: Rocket, text: 'Feature your templates on the homepage' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <p.icon className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-gray-300">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reward tiers */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-center mb-5">Reputation Tiers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tier: 'Newcomer', range: '0 - 49', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Users },
                { tier: 'Helper', range: '50 - 199', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Heart },
                { tier: 'Expert', range: '200 - 499', color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Award },
                { tier: 'Champion', range: '500+', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Crown },
              ].map(t => (
                <div key={t.tier} className={`rounded-xl p-4 text-center ${t.bg} border border-white/5`}>
                  <t.icon className={`w-6 h-6 mx-auto mb-2 ${t.color}`} />
                  <div className={`font-bold text-sm ${t.color}`}>{t.tier}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{t.range} points</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Future Roadmap ═══ */}
      <section id="roadmap" className="py-20 px-6 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 badge badge-blue mb-4 text-sm px-4 py-2">
              <Rocket className="w-4 h-4" /> Coming Soon
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What's Next for CommSolve</h2>
            <p className="text-gray-400 max-w-xl mx-auto">We're constantly improving. Here's what's coming in future updates.</p>
          </div>

          <div className="relative ml-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 via-blue-500 to-emerald-500" />
            {[
              { phase: 'Phase 1', title: 'Reward System & Leaderboard', desc: 'Full reputation system with points, badges, streak bonuses, and a community leaderboard showing top helpers.', color: 'text-purple-400', dot: 'bg-purple-500' },
              { phase: 'Phase 2', title: 'Profile Boosts & Premium Perks', desc: 'Spend reputation to boost your profile visibility, highlight your answers, and unlock a verified expert badge.', color: 'text-blue-400', dot: 'bg-blue-500' },
              { phase: 'Phase 3', title: 'Mentorship & 1-on-1 Sessions', desc: 'Top-rated experts can offer mentorship sessions. Request 1-on-1 guidance on your project from community leaders.', color: 'text-cyan-400', dot: 'bg-cyan-500' },
              { phase: 'Phase 4', title: 'Marketplace & Paid Templates', desc: 'Creators can sell premium templates and build paths. Earn real income from your knowledge and expertise.', color: 'text-amber-400', dot: 'bg-amber-500' },
              { phase: 'Phase 5', title: 'Mobile App & Offline Access', desc: 'Native mobile app for iOS and Android. Access templates and saved build paths offline. Push notifications.', color: 'text-emerald-400', dot: 'bg-emerald-500' },
              { phase: 'Phase 6', title: 'AI Tutor & Learning Paths', desc: 'Personalized AI tutor that adapts to your skill level. Custom learning paths based on your goals and domains.', color: 'text-pink-400', dot: 'bg-pink-500' },
            ].map((item, i) => (
              <div key={i} className="relative pl-8 pb-8 last:pb-0">
                <div className={`absolute left-0 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${item.dot} border-2 border-[#0a0a12]`} />
                <div className="glass-card p-5 hover:border-white/15 transition-all">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${item.color} mb-1`}>{item.phase}</div>
                  <h3 className="font-semibold mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Tech Stack ═══ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Built With Modern Tech</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['React 18', 'FastAPI', 'Turso (Edge DB)', 'TailwindCSS', 'OpenRouter AI', 'Google OAuth', 'Vite', 'Pydantic'].map(t => (
              <span key={t} className="px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/10 text-gray-400">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto glass-card p-10 text-center bg-gradient-to-r from-purple-600/20 via-pink-500/10 to-blue-500/20 border-purple-500/20">
          <h2 className="text-3xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-3">Join the community and start building, learning, and earning today.</p>
          <p className="text-sm text-gray-500 mb-8">Free to use. No credit card required. Sign in with Google in one click.</p>
          <button onClick={handleLogin} className="btn-primary text-base px-8 py-3.5 rounded-2xl">
            {GOOGLE_ICON} Sign in with Google
          </button>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">CommSolve</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">AI-powered community problem solver. Bridging the digital divide with a structured Help Ladder approach.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Platform</h4>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div>Templates & Build Paths</div>
                <div>AI-Powered Q&A</div>
                <div>Community Groups</div>
                <div>User Profiles & Networking</div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Coming Soon</h4>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div>Reward System & Leaderboard</div>
                <div>Profile Boosts & Badges</div>
                <div>Mentorship & 1-on-1 Sessions</div>
                <div>Template Marketplace</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <span>CommSolve &copy; 2026. Built for the Agentic Hackathon.</span>
            <span>Built with AI + Community Love</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
