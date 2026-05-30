import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone, Zap, CheckCircle, XCircle } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// ─── Helpers ─────────────────────────────────────────────────

const fmt = (mins: number) => {
  if (mins === 0) return '0m';
  if (mins < 60)  return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// ─── Stat Card ────────────────────────────────────────────────
// FIX: Icon background was ${color}18 (9% opacity = barely visible tint).
//      Now uses a solid colored background with white icon.
// FIX: Progress track was ${color}18 → explicit gray rail for visibility.

interface StatCardDef {
  label: string;
  value: string;
  goal: number | null;
  progress: number | null;
  color: string;
  icon: React.ReactNode;
  goalMet?: boolean | null;
}

const StatCard = ({ label, value, progress, color, icon, goalMet }: StatCardDef) => (
  <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.07] dark:border-white/[0.10] shadow-card p-4 flex flex-col gap-3">
    {/* Icon row — FIX: solid colored background (opaque) ensures icon contrast */}
    <div className="flex items-center justify-between">
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      {goalMet !== undefined && goalMet !== null && (
        goalMet
          ? <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
          : <XCircle    size={16} className="text-red-500 dark:text-red-400 shrink-0" />
      )}
    </div>

    {/* Value + label */}
    <div>
      <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-[0.06em]">
        {label}
      </p>
    </div>

    {/* Progress bar — FIX: track was ${color}18 → explicit gray rail */}
    {progress !== null && progress !== undefined && (
      <div>
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 tabular-nums tracking-tight">
          {Math.min(Math.round(progress), 100)}% of goal
        </p>
      </div>
    )}
  </div>
);

// ─── Goal Status Card ─────────────────────────────────────────
// FIX: "not met" state was transparent bg + rgba(0,0,0,0.05) border = invisible in dark mode.
//      "met" state was ${color}0D (5% opacity) = invisible background.
//      Now both states use a solid white/dark card foundation.

const GoalCard = ({
  label, met, color,
}: {
  label: string; met: boolean; color: string;
}) => (
  <div
    className={`flex flex-col items-center gap-2 py-4 rounded-3xl border text-center ${
      met
        ? 'bg-white dark:bg-[#021a1a] border-black/[0.07] dark:border-white/[0.10]'
        : 'bg-white dark:bg-[#021a1a] border-black/[0.07] dark:border-white/[0.10]'
    }`}
    style={met ? { borderTopColor: color, borderTopWidth: '3px' } : {}}
  >
    {met ? (
      <CheckCircle size={22} style={{ color }} />
    ) : (
      <XCircle size={22} className="text-gray-400 dark:text-gray-500" />
    )}
    <p
      className={`text-[12px] font-semibold tracking-tight ${
        met ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {label}
    </p>
    <span
      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
        met
          ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40'
          : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.08]'
      }`}
    >
      {met ? 'Met ✓' : 'Not met'}
    </span>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────

export const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([analyticsApi.getWeekly(), analyticsApi.getStats()])
      .then(([weeklyRes, statsRes]) => {
        setAnalytics(weeklyRes.data.analytics);
        setStats(statsRes.data.stats);
      })
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const ob               = user?.onboarding;
  const studyGoalMins    = (ob?.studyGoalHours       || 4) * 60;
  const sleepGoalMins    = (ob?.sleepHours            || 8) * 60;
  const screenLimitMins  = (ob?.screenTimeLimitHours  || 2) * 60;

  const statCards: StatCardDef[] = stats
    ? [
        {
          label: 'Study',
          value: fmt(stats.todayStudyMinutes),
          goal: studyGoalMins,
          progress: (stats.todayStudyMinutes / studyGoalMins) * 100,
          color: '#008080',
          icon: <BookOpen size={16} />,
          goalMet: stats.todayStudyMinutes >= studyGoalMins ? true : null,
        },
        {
          label: 'Sleep',
          value: fmt(stats.todaySleepMinutes),
          goal: sleepGoalMins,
          progress: (stats.todaySleepMinutes / sleepGoalMins) * 100,
          color: '#6366F1',
          icon: <Moon size={16} />,
          goalMet: stats.todaySleepMinutes >= sleepGoalMins ? true : null,
        },
        {
          label: 'Scroll',
          value: fmt(stats.todayScreenMinutes),
          goal: screenLimitMins,
          progress: (stats.todayScreenMinutes / screenLimitMins) * 100,
          color: '#D97706',
          icon: <Smartphone size={16} />,
          goalMet: screenLimitMins > 0
            ? stats.todayScreenMinutes <= screenLimitMins
            : null,
        },
        {
          label: 'Sessions',
          value: String(stats.sessionsToday),
          goal: null,
          progress: null,
          color: '#059669',
          icon: <Zap size={16} />,
        },
      ]
    : [];

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 uppercase tracking-[0.08em] mb-1">
          This week
        </p>
        <h1 className="text-[28px] md:text-[32px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
          Analytics
        </h1>
      </div>

      {loading && <LoadingSpinner message="Loading analytics…" />}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800 text-sm mb-5">
          {error}
        </div>
      )}

      {/* ── Today stat cards ── */}
      {!loading && stats && (
        <>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-3">
            Today
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            {statCards.map(card => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </>
      )}

      {/* ── Weekly goals ── */}
      {!loading && analytics && (
        <>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-3">
            Weekly Goals
          </p>
          <div className="grid grid-cols-3 gap-3 mb-7">
            <GoalCard label="Study goal"   met={analytics.goals.studyGoalMet}   color="#008080" />
            <GoalCard label="Sleep goal"   met={analytics.goals.sleepGoalMet}   color="#6366F1" />
            <GoalCard label="Screen limit" met={analytics.goals.screenLimitMet} color="#D97706" />
          </div>
        </>
      )}

      {/* ── Weekly charts ── */}
      {analytics && !loading && (
        <>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-3">
            Breakdown
          </p>
          <WeeklyReport analytics={analytics} />
        </>
      )}
    </Layout>
  );
};
