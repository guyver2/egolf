import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await api.get<User>('/auth/me')
    } catch {
      // Token expired or invalid
      logout()
    }
  }

  async function login(username: string, password: string) {
    const res = await api.post<{ access_token: string }>('/auth/login', {
      username,
      password
    })
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    await fetchMe()
  }

  async function signup(username: string, email: string, password: string) {
    await api.post('/auth/signup', { username, email, password })
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  // Auto-fetch user on store init if token exists
  if (token.value) {
    fetchMe()
  }

  return { token, user, isLoggedIn, login, signup, logout, fetchMe }
})
