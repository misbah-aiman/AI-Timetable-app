import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone, Zap } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';

const fmt = (mins: number) => {
  if (mins === 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const STAT_ITEMS = (
  studyGoalMins: number,
  sleepGoalMins: number,
  screenLimitMins: number,
  stats: DashboardStats,
) => [
  { label: 'Study',    value: stats.todayStudyMinutes,  goal: studyGoalMins,   color: '#008080', icon: <BookOpen   size={17} /> },
  { label: 'Sleep',    value: stats.todaySleepMinutes,  goal: sleepGoalMins,   color: '#6366F1', icon: <Moon       size={17} /> },
  { label: 'Scroll',   value: stats.todayScreenMinutes, goal: screenLimitMins, color: '#F59E0B', icon: <Smartphone size={17} /> },
  { label: 'Sessions', value: stats.sessionsToday,      goal: null as number | null, color: '#3EB489', icon: <Zap size={17} /> },
];

export const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([analyticsApi.getWeekly(), analyticsApi.getStats()])
      .then(([weeklyRes, statsRes]) => {
        setAnalytics(weeklyRes.data.analytics);
        setStats(statsRes.data.stats);
      })
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const ob = user?.onboarding;
  const studyGoalMins = (ob?.studyGoalHours || 4) * 60;
  const sleepGoalMins = (ob?.sleepHours || 8) * 60;
  const screenLimitMins = (ob?.screenTimeLimitHours || 2) * 60;

  return (
    <Layout>
      <PageHeader eyebrow="This week" title="Analytics" />

      {loading && <LoadingSpinner message="Loading..." />}
      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl text-sm">{error}</div>}

      {stats && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STAT_ITEMS(studyGoalMins, sleepGoalMins, screenLimitMins, stats).map(({ label, value, goal, color, icon }) => (
            <div key={label} className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.05] dark:border-white/[0.06] shadow-card p-4 flex flex-col gap-2.5">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18`, color }}>
                {icon}
              </div>
              <div>
                <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                  {goal !== null ? fmt(value) : String(value)}
                </p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mt-1">{label}</p>
              </div>
              {goal !== null && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}18` }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min((value / goal) * 100, 100)}%`, backgroundColor: color }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {analytics && !loading && <WeeklyReport analytics={analytics} />}
    </Layout>
  );
};
