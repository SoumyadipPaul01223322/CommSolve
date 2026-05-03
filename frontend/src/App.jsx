import { useState } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Sidebar, Topbar } from './components/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import BuildPaths from './pages/BuildPaths'
import Questions from './pages/Questions'
import AskAI from './pages/AskAI'
import Admin from './pages/Admin'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Groups from './pages/Groups'
import AuthCallback from './pages/AuthCallback'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/templates': 'Templates',
  '/build-paths': 'Build Paths',
  '/questions': 'Q & A',
  '/ask-ai': 'AI Assistant',
  '/community': 'Community',
  '/profile': 'My Profile',
  '/groups': 'Groups',
  '/admin': 'Admin Panel',
}

function ProtectedLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'CommSolve'
  // Admin panel is password-protected internally, no role gating needed

  return (
    <div className="flex h-full">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-60'}`}>
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="templates" element={<Templates />} />
            <Route path="build-paths" element={<BuildPaths />} />
            <Route path="questions" element={<Questions />} />
            <Route path="ask-ai" element={<AskAI />} />
            <Route path="community" element={<Community />} />
            <Route path="profile" element={<Profile />} />
            <Route path="groups" element={<Groups />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="spinner w-10 h-10" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={user ? <ProtectedLayout /> : <Navigate to="/" replace />} />
    </Routes>
  )
}
