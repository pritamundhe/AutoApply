import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../UI/Button'
import { BsPersonPlus as UserPlus, BsExclamationCircle as AlertCircle } from 'react-icons/bs'

export default function Register({ onSuccess, onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')
  const { registerUser, loading, error } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }

    try {
      const data = await registerUser(name, email, password)
      onSuccess(data.user, data.token)
    } catch (_) {}
  }

  const displayError = localError || error

  return (
    <div className="flex flex-col min-h-[580px] bg-[#0d0d1a]">
      {/* Logo Header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#262626] flex items-center justify-center mb-6 shadow-lg">
            <UserPlus className="text-white" size={28} strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-[#000000]" />
        </div>
        <h1 className="text-xl font-extrabold gradient-text">Create Account</h1>
        <p className="text-slate-500 text-xs mt-0.5">Join AutoApply and supercharge your applications</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pb-5">
        <div className="glass-card p-5">
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} /> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                className="input-field"
              />
            </div>

            <Button
              id="reg-submit"
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-1"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-3 my-3 px-1">
          <div className="flex-1 h-px bg-[#1e1e3a]" />
          <span className="text-slate-600 text-xs">already have an account?</span>
          <div className="flex-1 h-px bg-[#1e1e3a]" />
        </div>

        <Button id="go-login" variant="secondary" fullWidth size="md" onClick={onLogin}>
          Sign In Instead
        </Button>
      </div>
    </div>
  )
}
