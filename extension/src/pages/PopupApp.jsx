import React, { useState, useEffect } from 'react'
import Login from '../components/Auth/Login'
import Register from '../components/Auth/Register'
import ResumeUpload from '../components/Onboarding/ResumeUpload'
import ProfileChatEditor from '../components/Chat/ProfileChatEditor'
import Dashboard from './Dashboard'
import Spinner from '../components/UI/Spinner'
import { getToken, getUser } from '../services/storage'
import { getProfile } from '../services/api'
import { BsRobot as Bot } from 'react-icons/bs'

// Views: loading | login | register | chat | dashboard
export default function PopupApp() {
  const [view, setView] = useState('loading')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    initApp()
  }, [])

  const initApp = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([getToken(), getUser()])

      if (!storedToken || !storedUser) {
        setView('login')
        return
      }

      setToken(storedToken)
      setUser(storedUser)

      try {
        const profileData = await getProfile(storedToken)
        setProfile(profileData)

        if (profileData && profileData.completionStep >= 4) {
          setView('dashboard')
        } else {
          setView('chat')
        }
      } catch {
        // Profile fetch failed (token invalid or network error)
        setView('chat')
      }
    } catch {
      setView('login')
    }
  }

  // ─── Auth Success ──────────────────────────────────────────────────────────
  const handleAuthSuccess = async (userData, newToken) => {
    setUser(userData)
    setToken(newToken)

    try {
      const profileData = await getProfile(newToken)
      setProfile(profileData)

      if (profileData && profileData.completionStep >= 4) {
        setView('dashboard')
      } else {
        setView('chat')
      }
    } catch {
      setView('chat')
    }
  }

  // ─── Chat Complete ─────────────────────────────────────────────────────────
  const handleChatComplete = async (answers) => {
    // Refresh profile from backend
    try {
      const tok = token || (await getToken())
      const fresh = await getProfile(tok)
      setProfile(fresh)
    } catch {
      setProfile(prev => ({ ...prev, completionStep: 4 }))
    }
    setView('dashboard')
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setUser(null)
    setProfile(null)
    setToken(null)
    setView('login')
  }

  // ─── Edit Profile (re-enter chat) ─────────────────────────────────────────
  const handleEditProfile = () => {
    setView('edit-chat')
  }

  const handleEditProfileUpdated = (updatedProfile) => {
    setProfile(updatedProfile)
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div
        className="flex flex-col items-center justify-center bg-[#000000]"
        style={{ width: 400, height: 580 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center text-white shadow-xl mb-4 animate-pulse-glow">
          <Bot size={28} />
        </div>
        <Spinner size="md" />
        <p className="text-slate-500 text-xs mt-3">Loading AutoApply…</p>
      </div>
    )
  }

  if (view === 'login') {
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onRegister={() => setView('register')}
      />
    )
  }

  if (view === 'register') {
    return (
      <Register
        onSuccess={handleAuthSuccess}
        onLogin={() => setView('login')}
      />
    )
  }

  if (view === 'chat') {
    return (
      <ResumeUpload
        onComplete={handleChatComplete}
      />
    )
  }

  if (view === 'edit-chat') {
    return (
      <ProfileChatEditor
        profile={profile}
        onBack={() => setView('dashboard')}
        onProfileUpdated={handleEditProfileUpdated}
      />
    )
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        user={user}
        profile={profile}
        onLogout={handleLogout}
        onEditProfile={handleEditProfile}
      />
    )
  }

  return null
}
