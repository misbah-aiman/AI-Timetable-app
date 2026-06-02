// Typed helpers for localStorage so we never accidentally store the wrong shape

const PREFIX = 'ai_timetable_';

const keys = {
  token: `${PREFIX}token`,
  user: `${PREFIX}user`,
  timetable: `${PREFIX}timetable`,
  theme: `${PREFIX}theme`,
  activeSessions: `${PREFIX}active_sessions`,
  onboardingDraft: `${PREFIX}onboarding_draft`,
} as const;

export const storage = {
  // Auth
  getToken: (): string | null => localStorage.getItem(keys.token),
  setToken: (token: string) => localStorage.setItem(keys.token, token),
  removeToken: () => localStorage.removeItem(keys.token),

  // User
  getUser: () => {
    const raw = localStorage.getItem(keys.user);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: Record<string, unknown>) => localStorage.setItem(keys.user, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(keys.user),

  // Timetable cache (so dashboard loads instantly)
  getTimetable: () => {
    const raw = localStorage.getItem(keys.timetable);
    return raw ? JSON.parse(raw) : null;
  },
  setTimetable: (timetable: Record<string, unknown>) => localStorage.setItem(keys.timetable, JSON.stringify(timetable)),
  removeTimetable: () => localStorage.removeItem(keys.timetable),

  // Theme
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(keys.theme) as 'light' | 'dark') || 'light';
  },
  setTheme: (theme: 'light' | 'dark') => localStorage.setItem(keys.theme, theme),

  // Onboarding draft (preserve if user refreshes mid-onboarding)
  getOnboardingDraft: () => {
    const raw = localStorage.getItem(keys.onboardingDraft);
    return raw ? JSON.parse(raw) : null;
  },
  setOnboardingDraft: (data: Record<string, unknown>) => localStorage.setItem(keys.onboardingDraft, JSON.stringify(data)),
  removeOnboardingDraft: () => localStorage.removeItem(keys.onboardingDraft),

  // Full clear on logout
  clearAll: () => {
    Object.values(keys).forEach(k => localStorage.removeItem(k));
  },
};
