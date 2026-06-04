/**
 * Chrome storage service with localStorage fallback for non-extension environments.
 * Tokens persist indefinitely in chrome.storage.local.
 */

const IS_EXT = typeof chrome !== 'undefined' && !!chrome?.storage?.local

const chromeGet = (key) =>
  new Promise((resolve) => chrome.storage.local.get(key, (r) => resolve(r[key] ?? null)))

const chromeSet = (key, value) =>
  new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve))

const chromeRemove = (keys) =>
  new Promise((resolve) => chrome.storage.local.remove(keys, resolve))

// ─── Token ────────────────────────────────────────────────────────────────────

export const getToken = () =>
  IS_EXT ? chromeGet('aa_token') : Promise.resolve(localStorage.getItem('aa_token'))

export const setToken = (token) =>
  IS_EXT ? chromeSet('aa_token', token) : Promise.resolve(localStorage.setItem('aa_token', token))

// ─── User ─────────────────────────────────────────────────────────────────────

export const getUser = async () => {
  if (IS_EXT) {
    const raw = await chromeGet('aa_user')
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  }
  const raw = localStorage.getItem('aa_user')
  return raw ? JSON.parse(raw) : null
}

export const setUser = (user) => {
  const serialized = JSON.stringify(user)
  return IS_EXT
    ? chromeSet('aa_user', serialized)
    : Promise.resolve(localStorage.setItem('aa_user', serialized))
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export const getResume = async () => {
  if (IS_EXT) {
    const raw = await chromeGet('aa_resume')
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
  }
  const raw = localStorage.getItem('aa_resume')
  return raw ? JSON.parse(raw) : null
}

export const setResume = (resumeData) => {
  const serialized = JSON.stringify(resumeData)
  return IS_EXT
    ? chromeSet('aa_resume', serialized)
    : Promise.resolve(localStorage.setItem('aa_resume', serialized))
}

export const clearResume = () =>
  IS_EXT
    ? chromeRemove('aa_resume')
    : Promise.resolve(localStorage.removeItem('aa_resume'))

// ─── Clear (Logout) ───────────────────────────────────────────────────────────

export const clearAuth = () =>
  IS_EXT
    ? chromeRemove(['aa_token', 'aa_user', 'aa_resume'])
    : Promise.resolve((() => {
        localStorage.removeItem('aa_token')
        localStorage.removeItem('aa_user')
        localStorage.removeItem('aa_resume')
      })())
