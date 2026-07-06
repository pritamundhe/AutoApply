import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const http = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = (name, email, password) =>
  http.post('/auth/register', { name, email, password }).then(r => r.data)

export const login = (email, password) =>
  http.post('/auth/login', { email, password }).then(r => r.data)

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = (token) =>
  http.get('/profile', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)

export const updateProfile = (data, token) =>
  http.put('/profile', data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)

export const chatUpdateProfile = (message, currentProfile, token) =>
  http.post('/profile/chat-update', { message, currentProfile }, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)

export const parseResume = async (file, token) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}/profile/parse-resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
  if (!res.ok) throw new Error('Failed to parse resume')
  return res.json()
}

export const saveMemory = (fields, token) =>
  http.post('/profile/memory', { fields }, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data)

// ─── AI ───────────────────────────────────────────────────────────────────────

export const mapFields = (fields, profile, token, pageContext = null) =>
  http
    .post('/ai/map-fields', { fields, profile, pageContext }, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.data)
