import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Templates ────────────────────────────────────────
export const getTemplates = (category) =>
  api.get('/templates/', { params: category ? { category } : {} }).then(r => r.data)

export const getTemplate = (id) =>
  api.get(`/templates/${id}`).then(r => r.data)

export const createTemplate = (data) =>
  api.post('/templates/', data).then(r => r.data)

// ─── Build Paths ──────────────────────────────────────
export const getBuildPaths = (category) =>
  api.get('/build-paths/', { params: category ? { category } : {} }).then(r => r.data)

export const getBuildPath = (id) =>
  api.get(`/build-paths/${id}`).then(r => r.data)

// ─── Questions & Answers ──────────────────────────────
export const getQuestions = (category) =>
  api.get('/questions/', { params: category ? { category } : {} }).then(r => r.data)

export const getQuestion = (id) =>
  api.get(`/questions/${id}`).then(r => r.data)

export const createQuestion = (data) =>
  api.post('/questions/', data).then(r => r.data)

export const getAnswers = (questionId) =>
  api.get(`/questions/${questionId}/answers`).then(r => r.data)

export const createAnswer = (questionId, data) =>
  api.post(`/questions/${questionId}/answers`, data).then(r => r.data)

export const acceptAnswer = (answerId) =>
  api.put(`/questions/answers/${answerId}/accept`).then(r => r.data)

// ─── AI ───────────────────────────────────────────────
export const analyzeIntent = (input) =>
  api.post('/ai/analyze', { input }).then(r => r.data)

export const askAI = (question, context = '') =>
  api.post('/ai/ask-ai', { question, context }).then(r => r.data)

export const structureQuestion = (input) =>
  api.post('/ai/structure-question', { input }).then(r => r.data)

// ─── Community / Connections ─────────────────────────
export const sendConnection = (data) =>
  api.post('/community/connect', data).then(r => r.data)

export const acceptConnection = (id) =>
  api.put(`/community/connect/${id}/accept`).then(r => r.data)

export const removeConnection = (id) =>
  api.delete(`/community/connect/${id}`).then(r => r.data)

export const getConnections = (userId) =>
  api.get(`/community/connections/${userId}`).then(r => r.data)

export const getCommunityMembers = (userId) =>
  api.get(`/community/people/${userId}`).then(r => r.data)

// ─── Messages (Chat) ────────────────────────────────
export const sendMessage = (data) =>
  api.post('/community/messages', data).then(r => r.data)

export const getMessages = (userId, otherId) =>
  api.get(`/community/messages/${userId}/${otherId}`).then(r => r.data)

// ─── Profiles ────────────────────────────────────────
export const getProfile = (userId) =>
  api.get(`/profiles/${userId}`).then(r => r.data)

export const updateProfile = (userId, data) =>
  api.put(`/profiles/${userId}`, data).then(r => r.data)

// ─── Groups ──────────────────────────────────────────
export const getGroups = (userId) =>
  api.get('/groups/', { params: userId ? { user_id: userId } : {} }).then(r => r.data)

export const createGroup = (data) =>
  api.post('/groups/', data).then(r => r.data)

export const getGroup = (id) =>
  api.get(`/groups/${id}`).then(r => r.data)

export const joinGroup = (groupId, userId, userName = '', userPicture = '') =>
  api.post(`/groups/${groupId}/join?user_id=${userId}&user_name=${encodeURIComponent(userName)}&user_picture=${encodeURIComponent(userPicture)}`).then(r => r.data)

export const leaveGroup = (groupId, userId) =>
  api.delete(`/groups/${groupId}/leave/${userId}`).then(r => r.data)

export const getGroupMessages = (groupId) =>
  api.get(`/groups/${groupId}/messages`).then(r => r.data)

export const sendGroupMessage = (groupId, data) =>
  api.post(`/groups/${groupId}/messages`, data).then(r => r.data)

// ─── Notifications ───────────────────────────────────
export const getNotifications = (userId) =>
  api.get(`/notifications/${userId}`).then(r => r.data)

export const getUnreadCount = (userId) =>
  api.get(`/notifications/${userId}/unread-count`).then(r => r.data)

export const markAllRead = (userId) =>
  api.put(`/notifications/${userId}/read-all`).then(r => r.data)

export const markNotifRead = (id) =>
  api.put(`/notifications/${id}/read`).then(r => r.data)

// ─── Admin ───────────────────────────────────────────
export const verifyAdmin = (password) =>
  api.post('/auth/admin/verify', { password }).then(r => r.data)

export const getAdminStats = () =>
  api.get('/auth/admin/stats').then(r => r.data)

// ─── Search ──────────────────────────────────────────
export const searchAll = async (query) => {
  const [templates, buildPaths, questions, groups] = await Promise.all([
    getTemplates().catch(() => []),
    getBuildPaths().catch(() => []),
    getQuestions().catch(() => []),
    getGroups().catch(() => []),
  ])
  const q = query.toLowerCase()
  return {
    templates: templates.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)),
    buildPaths: buildPaths.filter(b => b.title.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)),
    questions: questions.filter(x => x.title.toLowerCase().includes(q) || x.description?.toLowerCase().includes(q)),
    groups: groups.filter(g => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)),
  }
}

export default api
