import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone, Zap, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { WeeklyAnalytics, DashboardStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { WeeklyReport } from '../components/analytics/WeeklyReport';
import { PageHeader } from '../components/ui/PageHeader';

// ─── Helpers ─────────────────────────────────────────────────

const fmt = (mins: number) => {
  if (mins === 0) return '0m';
  if (mins < 60)  return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// ─── Skeleton ────────────────────────────────────────────────

const CardSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={`grid grid-cols-2 md:grid-cols-${count} gap-3 mb-7`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-[120px] skeleton rounded-3xl" />
    ))}
  </div>
);

// ─── Section Header ───────────────────────────────────────────

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.10em]">
      {children}
    </span>
    <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────

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
  <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.07] dark:border-white/[0.10] shadow-card p-4 flex flex-col gap-3 overflow-hidden">
    <div className="flex items-center justify-between">
      <div
        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white"
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
      >
        {icon}
      </div>
      {goalMet !== undefined && goalMet !== null && (
        goalMet
          ? <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
          : <XCircle    size={16} className="text-red-500 dark:text-red-400 shrink-0" />
      )}
    </div>

    <div>
      <p className="text-[28px] font-extrabold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-[0.07em]">
        {label}
      </p>
    </div>

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

const GoalCard = ({ label, met, color }: { label: string; met: boolean; color: string }) => (
  <div
    className={`
      flex flex-col items-center gap-2.5 py-4 px-3 rounded-3xl border text-center transition-colors
      ${met
        ? 'border-transparent shadow-card'
        : 'bg-white dark:bg-[#021a1a] border-black/[0.07] dark:border-white/[0.10] shadow-card'
      }
    `}
    style={met ? {
      background: `linear-gradient(145deg, ${color}12, ${color}08)`,
      borderColor: `${color}40`,
      borderWidth: '1.5px',
    } : {}}
  >
    {met ? (
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
      >
        <CheckCircle size={20} />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.07]">
        <XCircle size={20} className="text-gray-400 dark:text-gray-500" />
      </div>
    )}

    <p className={`text-[12px] font-semibold tracking-tight leading-tight ${
      met ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
    }`}>
      {label}
    </p>

    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
      met
        ? 'text-white'
        : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.08]'
    }`}
      style={met ? { background: color } : {}}
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
      <PageHeader eyebrow="This week" title="Analytics" />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800 text-sm mb-5">
          {error}
        </div>
      )}

      {/* ── Today stat cards ── */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : stats && (
        <>
          <SectionHeader>Today</SectionHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            {statCards.map(card => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </>
      )}

      {/* ── Weekly goals ── */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : analytics && (
        <>
          <SectionHeader>Weekly Goals</SectionHeader>
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
          <SectionHeader>
            <TrendingUp size={11} className="inline mr-1 -mt-0.5" />
            Breakdown
          </SectionHeader>
          <WeeklyReport analytics={analytics} />
        </>
      )}
    </Layout>
  );
};
