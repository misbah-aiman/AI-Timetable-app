import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { timetableApi, analyticsApi } from '../services/api';
import { Timetable, DashboardStats } from '../types';
import { storage } from '../utils/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { TimetableView } from '../components/dashboard/TimetableView';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// ─── Helpers ─────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtMins = (mins: number) => {
  if (mins === 0) return '0m';
  if (mins < 60)  return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// ─── Stat Pill ────────────────────────────────────────────────

const StatPill = ({
  label, value, progress, color, icon,
}: {
  label: string;
  value: string;
  progress?: number;
  color: string;
  icon: ReactNode;
}) => (
  <div
    className="flex flex-col gap-2.5 p-4 rounded-3xl border"
    style={{ backgroundColor: `${color}0D`, borderColor: `${color}22` }}
  >
    <div className="flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.06em]"
        style={{ color }}
      >
        {label}
      </span>
    </div>
    <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">
      {value}
    </p>
    {progress !== undefined && (
      <>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[11px] tabular-nums" style={{ color: `${color}80` }}>
          {Math.min(Math.round(progress), 100)}% of goal
        </p>
      </>
    )}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState<Timetable | null>(storage.getTimetable());
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]     = useState(!timetable);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    // Fetch timetable (primary, may already be cached)
    timetableApi.get()
      .then(res => {
        setTimetable(res.data.timetable);
        storage.setTimetable(res.data.timetable);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          storage.clearAll();
          navigate('/login?reason=session_expired');
          return;
        }
        if (status !== 404) setError('Could not load timetable.');
      })
      .finally(() => setLoading(false));

    // Fetch today stats independently (non-blocking)
    analyticsApi.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your dashboard…" />
      </Layout>
    );
  }

  const ob = user?.onboarding;
  const studyGoalMins = (ob?.studyGoalHours || 4) * 60;

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.08em] mb-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRegenerate}
          loading={regenerating}
          className="mt-1.5 shrink-0"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Regen</span>
        </Button>
      </div>

      {/* ── Today stats ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatPill
            label="Study"
            value={fmtMins(stats.todayStudyMinutes)}
            progress={(stats.todayStudyMinutes / studyGoalMins) * 100}
            color="#008080"
            icon={<BookOpen size={14} />}
          />
          <StatPill
            label="Sessions"
            value={String(stats.sessionsToday)}
            color="#3EB489"
            icon={<Zap size={14} />}
          />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            <Sparkles size={13} /> Fix
          </Button>
        </div>
      )}

      {/* ── Timetable card ── */}
      <Card>
        {timetable ? (
          <TimetableView timetable={timetable} />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-14 h-14 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Sparkles size={24} className="text-primary-400" />
            </div>
            <p className="text-sm text-gray-400 text-center tracking-tight">
              No timetable yet — generate one to get started
            </p>
            <Button onClick={handleRegenerate} loading={regenerating} size="lg">
              <Sparkles size={16} /> Generate with AI
            </Button>
          </div>
        )}
      </Card>
    </Layout>
  );
};
