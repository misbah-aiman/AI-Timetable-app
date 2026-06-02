import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Sparkles } from 'lucide-react';
import { timetableApi } from '../services/api';
import { Timetable } from '../types';
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

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [timetable, setTimetable] = useState<Timetable | null>(storage.getTimetable());
  const [loading, setLoading]     = useState(!timetable);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError]         = useState('');

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);

  useEffect(() => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    setError('');
    try {
      const res = await timetableApi.generate();
      setTimetable(res.data.timetable);
      storage.setTimetable(res.data.timetable);
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
            <span className="hidden sm:inline">Regen</span>
          </Button>
        }
      />

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-3xl border border-red-200 dark:border-red-800 flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            <Sparkles size={13} /> Fix
          </Button>
        </div>
      )}

      {/* Timetable */}
      <Card className="animate-slide-up delay-100">
        {timetable ? (
          <TimetableView timetable={timetable} />
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
