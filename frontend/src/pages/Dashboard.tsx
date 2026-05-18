import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Moon, Smartphone, Zap, RefreshCw, Sparkles } from 'lucide-react';
import { timetableApi, analyticsApi } from '../services/api';
import { Timetable, DashboardStats } from '../types';
import { storage } from '../utils/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { TimetableView } from '../components/dashboard/TimetableView';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState<Timetable | null>(storage.getTimetable());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(!timetable);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const statsRes = await analyticsApi.getStats();
      setStats(statsRes.data.stats);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        storage.clearAll();
        navigate('/login?reason=session_expired');
        return;
      }
    } finally {
      setLoading(false);
    }

    try {
      const ttRes = await timetableApi.get();
      setTimetable(ttRes.data.timetable);
      storage.setTimetable(ttRes.data.timetable);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) setError('Could not load timetable.');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');
    try {
      const res = await timetableApi.generate();
      setTimetable(res.data.timetable);
      storage.setTimetable(res.data.timetable);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 401) {
        storage.clearAll();
        navigate('/login?reason=session_expired');
        return;
      }
      setError(msg || 'Failed to generate. Check your OpenAI key.');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <Layout>
      <LoadingSpinner message="Loading your dashboard..." />
    </Layout>
  );

  const onboarding = user?.onboarding;
  const studyGoalMins = (onboarding?.studyGoalHours || 4) * 60;
  const sleepGoalMins = (onboarding?.sleepHours || 8) * 60;
  const screenLimitMins = (onboarding?.screenTimeLimitHours || 2) * 60;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRegenerate} loading={regenerating}>
          <RefreshCw size={14} /> Regenerate
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            <Sparkles size={13} /> Re-onboard
          </Button>
        </div>
      )}

      {/* Stats */}
      {stats && (
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

      {/* Timetable — full width */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Schedule</h2>
        </div>

        {timetable ? (
          <TimetableView timetable={timetable} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Sparkles size={32} className="mb-3 opacity-40" />
            <p className="text-sm mb-4">No timetable yet — generate one with AI</p>
            <Button onClick={handleRegenerate} loading={regenerating}>
              <Sparkles size={14} /> Generate Timetable
            </Button>
          </div>
        )}
      </Card>
    </Layout>
  );
};

const fmtTime = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
