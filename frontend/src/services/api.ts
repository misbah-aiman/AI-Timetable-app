import axios from 'axios';
import { storage } from '../utils/localStorage';

// In dev: Vite proxy forwards /api → localhost:5000
// In prod: VITE_API_URL must be set to the deployed backend URL (e.g. https://your-backend.railway.app)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Only redirect to login when the session-validation call itself returns 401.
// All other 401s are handled locally by the component (show error, not page redirect).
api.interceptors.response.use(
  res => res,
  err => {
    const isAuthCheck = err.config?.url === '/auth/me';
    if (err.response?.status === 401 && isAuthCheck) {
      storage.clearAll();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  checkEmail: (email: string) => api.post<{ exists: boolean }>('/auth/check-email', { email }),
  sendOtp: (email: string) => api.post('/auth/send-otp', { email }),
  verifyOtp: (data: { email: string; otp: string }) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
};

// ─── User / Onboarding ───────────────────────────────────
export const userApi = {
  saveOnboarding: (data: object) => api.post('/user/onboarding', data),
  updateSettings: (data: object) => api.put('/user/settings', data),
  deleteAccount: () => api.delete('/user/account'),
};

// ─── Timetable ───────────────────────────────────────────
export const timetableApi = {
  generate: () => api.post('/timetable/generate'),
  get: () => api.get('/timetable'),
  getToday: () => api.get('/timetable/today'),
  toggleSlot: (day: string, startTime: string) =>
    api.patch<{ completedSlots: string[] }>('/timetable/slot', { day, startTime }),
  scanImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    // Do NOT set Content-Type manually — browser must set it with the boundary
    return api.post('/timetable/scan-image', form);
  },
};

// ─── Sessions ────────────────────────────────────────────
export const sessionsApi = {
  start: (data: { type: string; label: string }) => api.post('/sessions/start', data),
  stop: (id: string) => api.put(`/sessions/${id}/stop`),
  getActive: () => api.get('/sessions/active'),
  getToday: () => api.get('/sessions/today'),
};

// ─── Tasks ───────────────────────────────────────────────
export const tasksApi = {
  getAll: () => api.get('/tasks'),
  create: (data: { title: string; subject: string; dueDate: string; estimatedHours: number; priority: string }) =>
    api.post('/tasks', data),
  update: (id: string, data: Partial<{ title: string; subject: string; dueDate: string; estimatedHours: number; priority: string; status: string }>) =>
    api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// ─── Analytics ───────────────────────────────────────────
export const analyticsApi = {
  getWeekly: () => api.get('/analytics/weekly'),
  getStats: () => api.get('/analytics/stats'),
};

export default api;
