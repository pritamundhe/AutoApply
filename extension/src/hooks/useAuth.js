import { useState } from 'react'
import { login as apiLogin, register as apiRegister } from '../services/api'
import { setToken, setUser, clearAuth } from '../services/storage'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loginUser = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiLogin(email.trim(), password)
      await setToken(data.token)
      await setUser(data.user)
      return data
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  const registerUser = async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRegister(name.trim(), email.trim(), password)
      await setToken(data.token)
      await setUser(data.user)
      return data
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await clearAuth()
  }

  return { loginUser, registerUser, logout, loading, error, setError }
}
