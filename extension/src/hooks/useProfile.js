import { useState } from 'react'
import { updateProfile } from '../services/api'
import { getToken } from '../services/storage'

export function useProfile(initial = null) {
  const [profile, setProfile] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveProfile = async (updates) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const merged = { ...(profile || {}), ...updates }
      const updated = await updateProfile(merged, token)
      setProfile(updated)
      return updated
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save profile.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }

  return { profile, setProfile, saveProfile, loading, error, setError }
}
