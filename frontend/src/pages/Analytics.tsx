import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone, Zap } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { StatsCard } from '../components/dashboard/StatsCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const fmtTime = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      analyticsApi.getWeekly(),
      analyticsApi.getStats(),
    ])
      .then(([weeklyRes, statsRes]) => {
        setAnalytics(weeklyRes.data.analytics);
        setStats(statsRes.data.stats);
      })
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const onboarding = user?.onboarding;
  const studyGoalMins = (onboarding?.studyGoalHours || 4) * 60;
  const sleepGoalMins = (onboarding?.sleepHours || 8) * 60;
  const screenLimitMins = (onboarding?.screenTimeLimitHours || 2) * 60;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
      </div>

      {loading && <LoadingSpinner message="Loading..." />}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {stats && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatsCard
            title="Study Today"
            value={fmtTime(stats.todayStudyMinutes)}
            subtitle={`Goal: ${fmtTime(studyGoalMins)}`}
            icon={<BookOpen size={18} />}
            color="#6366f1"
            progress={(stats.todayStudyMinutes / studyGoalMins) * 100}
          />
          <StatsCard
            title="Sleep"
            value={fmtTime(stats.todaySleepMinutes)}
            subtitle={`Goal: ${fmtTime(sleepGoalMins)}`}
            icon={<Moon size={18} />}
            color="#8b5cf6"
            progress={(stats.todaySleepMinutes / sleepGoalMins) * 100}
          />
          <StatsCard
            title="Screen Time"
            value={fmtTime(stats.todayScreenMinutes)}
            subtitle={`Limit: ${fmtTime(screenLimitMins)}`}
            icon={<Smartphone size={18} />}
            color="#f97316"
            progress={(stats.todayScreenMinutes / screenLimitMins) * 100}
          />
          <StatsCard
            title="Sessions"
            value={String(stats.sessionsToday)}
            subtitle="today"
            icon={<Zap size={18} />}
            color="#10b981"
          />
        </div>
      )}

      {analytics && !loading && <WeeklyReport analytics={analytics} />}
    </Layout>
  );
};
