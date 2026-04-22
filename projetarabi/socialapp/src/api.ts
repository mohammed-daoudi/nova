const BASE = 'http://localhost:5000/api'

export const getToken = () => localStorage.getItem('token')
export const getUser  = (): any => {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}
export const setAuth = (token: string, user: unknown) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}
export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
export const updateStoredUser = (patch: object) => {
  const u = getUser()
  if (u) localStorage.setItem('user', JSON.stringify({ ...u, ...patch }))
}

async function api(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const authAPI = {
  login:    (email: string, password: string) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body: object) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
}

export const postsAPI = {
  feed:       () => api('/posts/feed'),
  userPosts:  (userId: number) => api(`/posts/user/${userId}`),
  create:     (formData: FormData) =>
    api('/posts', { method: 'POST', body: formData }),
  like:       (id: number) => api(`/posts/${id}/like`, { method: 'POST' }),
  comments:   (id: number) => api(`/posts/${id}/comments`),
  addComment: (id: number, content: string) =>
    api(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  delete:     (id: number) => api(`/posts/${id}`, { method: 'DELETE' }),
}

export const friendsAPI = {
  list:        () => api('/friends'),
  requests:    () => api('/friends/requests'),
  sendRequest: (userId: number) => api(`/friends/request/${userId}`, { method: 'POST' }),
  accept:      (friendshipId: number) => api(`/friends/accept/${friendshipId}`, { method: 'PUT' }),
  remove:      (userId: number) => api(`/friends/${userId}`, { method: 'DELETE' }),
}

export const usersAPI = {
  search:      (q: string) => api(`/users/search?q=${encodeURIComponent(q)}`),
  suggestions: () => api('/users/suggestions'),
}

export const messagesAPI = {
  conversations: () => api('/messages/conversations'),
  thread:        (userId: number) => api(`/messages/${userId}`),
  send:          (userId: number, content: string) =>
    api(`/messages/${userId}`, { method: 'POST', body: JSON.stringify({ content }) }),
}

export const profileAPI = {
  get:          (userId: number) => api(`/profile/${userId}`),
  updateInfo:   (data: { first_name: string; last_name: string; bio: string }) =>
    api('/profile/me/info', { method: 'PUT', body: JSON.stringify(data) }),
  updatePassword: (current_password: string, new_password: string) =>
    api('/profile/me/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
  updateAvatar: (formData: FormData) =>
    api('/profile/me/avatar', { method: 'PUT', body: formData }),
}

export const avatarUrl = (user: { avatar_url?: string; avatar_seed?: string; username?: string }) => {
  if (user?.avatar_url) return `http://localhost:5000${user.avatar_url}`
  const seed = user?.avatar_seed || user?.username || 'default'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=7c5cfc,fc5c9c,5cf0fc`
}
