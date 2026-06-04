import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../UI/Button'
import { BsPerson as User, BsExclamationCircle as AlertCircle } from 'react-icons/bs'

export default function Login({ onSuccess, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loginUser, loading, error } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = await loginUser(email, password)
      onSuccess(data.user, data.token)
    } catch (_) {}
  }

  return (
    <div className="flex flex-col min-h-[580px] bg-[#0d0d1a]">
      {/* Logo Header */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center mb-6 shadow-lg">
            <User className="text-white" size={28} strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#0d0d1a]" />
        </div>
        <h1 className="text-2xl font-extrabold gradient-text tracking-tight">AutoApply</h1>
        <p className="text-slate-500 text-xs mt-1 tracking-wide uppercase font-medium">AI Job Application Assistant</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-5 pb-5">
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-white mb-0.5">Welcome back</h2>
          <p className="text-slate-500 text-xs mb-5">Sign in to continue where you left off</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>

            <Button
              id="login-submit"
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        {/* Divider + Register link */}
        <div className="flex items-center gap-3 my-4 px-1">
          <div className="flex-1 h-px bg-[#1e1e3a]" />
          <span className="text-slate-600 text-xs">or</span>
          <div className="flex-1 h-px bg-[#1e1e3a]" />
        </div>

        <Button
          id="go-register"
          variant="secondary"
          fullWidth
          size="md"
          onClick={onRegister}
        >
          Create new account
        </Button>

        <p className="text-center text-slate-600 text-xs mt-4">
          Your data is encrypted and stored securely.
        </p>
      </div>
    </div>
  )
}
