import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Sparkles, BookOpen, ListTodo, CalendarDays } from 'lucide-react';
import { timetableApi, analyticsApi, tasksApi } from '../services/api';
import { Timetable, DashboardStats } from '../types';
import { storage } from '../utils/localStorage';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { TimetableView } from '../components/dashboard/TimetableView';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageHeader } from '../components/ui/PageHeader';

const getGreeting = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (mins: number) => {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// ─── Quick Stat Chip ─────────────────────────────────────────

const QuickStat = ({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) => (
  <div className="flex-1 flex flex-col gap-2.5 bg-white dark:bg-[#021a1a] rounded-2xl border border-black/[0.07] dark:border-white/[0.10] shadow-card p-3.5 min-w-0">
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
    <div>
      <p className="text-[22px] font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium tracking-tight leading-none">
        {label}
      </p>
    </div>
  </div>
);

// ─── Skeleton strip ───────────────────────────────────────────

const StatsSkeleton = () => (
  <div className="flex gap-3 mb-5">
    {[0, 1, 2].map(i => (
      <div key={i} className="flex-1 h-[88px] skeleton rounded-2xl" />
    ))}
  </div>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [timetable, setTimetable] = useState<Timetable | null>(storage.getTimetable());
  const timetableRef = useRef(timetable);
  const [loading, setLoading]     = useState(!timetable);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError]         = useState('');

  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);

  // Keep ref current so callbacks never capture stale state
  useEffect(() => { timetableRef.current = timetable; }, [timetable]);

  // Sync state + localStorage in one call
  const applyTimetable = useCallback((t: Timetable | null) => {
    setTimetable(t);
    if (t) storage.setTimetable(t);
  }, []);

  // Timetable fetch
  useEffect(() => {
    timetableApi.get()
      .then(res => { applyTimetable(res.data.timetable); })
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats + tasks (non-blocking)
  useEffect(() => {
    analyticsApi.getStats().then(r => setStats(r.data.stats)).catch(() => {});
    tasksApi.getAll().then(r => {
      const pending = (r.data.tasks as { status: string }[]).filter(t => t.status === 'pending').length;
      setPendingCount(pending);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const todaySlotCount = useMemo(() => {
    if (!timetable) return null;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetable.schedule.find(d => d.day === dayName)?.slots.length ?? null;
  }, [timetable]);

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setError('');
    try {
      const res = await timetableApi.generate();
      applyTimetable(res.data.timetable);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg    = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 401) {
        storage.clearAll();
        navigate('/login?reason=session_expired');
        return;
      }
      setError(msg || 'Failed to generate. Check your OpenAI key.');
    } finally {
      setRegenerating(false);
    }
  }, [navigate]);

  const handleToggleSlot = useCallback(async (day: string, startTime: string) => {
    const current = timetableRef.current;
    if (!current) return;
    const key = `${day}|${startTime}`;
    const prev = current.completedSlots ?? [];
    const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    applyTimetable({ ...current, completedSlots: next });
    try {
      const res = await timetableApi.toggleSlot(day, startTime);
      applyTimetable({ ...timetableRef.current!, completedSlots: res.data.completedSlots });
    } catch {
      applyTimetable(timetableRef.current!);
    }
  }, [applyTimetable]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading your dashboard…" />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        title={<>{greeting}, {user?.name?.split(' ')[0]}</>}
        action={
          <Button variant="secondary" size="sm" onClick={handleRegenerate} loading={regenerating}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        }
      />

      {/* ── Quick stats strip ── */}
      {stats === null && pendingCount === null ? (
        <StatsSkeleton />
      ) : (
        <div className="flex gap-3 mb-5 animate-slide-up delay-50">
          <QuickStat
            icon={<BookOpen size={17} />}
            label="Study today"
            value={stats ? fmt(stats.todayStudyMinutes) : '—'}
            color="#008080"
          />
          <QuickStat
            icon={<ListTodo size={17} />}
            label="Pending tasks"
            value={pendingCount !== null ? String(pendingCount) : '—'}
            color="#6366F1"
          />
          <QuickStat
            icon={<CalendarDays size={17} />}
            label="Slots today"
            value={todaySlotCount !== null ? String(todaySlotCount) : '—'}
            color="#059669"
          />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800 flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            <Sparkles size={13} /> Fix
          </Button>
        </div>
      )}

      {/* ── Timetable ── */}
      <Card className="animate-slide-up delay-100">
        {timetable ? (
          <TimetableView
            timetable={timetable}
            completedSlots={timetable.completedSlots ?? []}
            onToggleSlot={handleToggleSlot}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 gap-4">
            <div className="w-14 h-14 rounded-3xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <Sparkles size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center tracking-tight">
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
