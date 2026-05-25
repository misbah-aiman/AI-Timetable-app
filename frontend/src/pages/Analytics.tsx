import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone, Zap } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Card } from '../components/ui/Card';
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
  { label: 'Study', value: stats.todayStudyMinutes, goal: studyGoalMins, color: '#8b5cf6', icon: <BookOpen size={18} /> },
  { label: 'Sleep', value: stats.todaySleepMinutes, goal: sleepGoalMins, color: '#6366f1', icon: <Moon size={18} /> },
  { label: 'Scroll', value: stats.todayScreenMinutes, goal: screenLimitMins, color: '#f97316', icon: <Smartphone size={18} /> },
  { label: 'Sessions', value: stats.sessionsToday, goal: null as number | null, color: '#10b981', icon: <Zap size={18} /> },
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
        <>
          {/* Quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {STAT_ITEMS(studyGoalMins, sleepGoalMins, screenLimitMins, stats).map(({ label, value, goal, color, icon }) => (
              <Card key={label} padding="sm">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}18`, color }}>
                  {icon}
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {goal !== null ? fmt(value) : String(value)}
                </p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
                {goal !== null && (
                  <div className="mt-2.5 h-1.5 bg-surface-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((value / goal) * 100, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>

        </>
      )}

      {analytics && !loading && <WeeklyReport analytics={analytics} />}
    </Layout>
  );
};
