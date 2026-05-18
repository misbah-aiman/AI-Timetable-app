import { useEffect, useState } from 'react';
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

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState<Timetable | null>(storage.getTimetable());
  const [loading, setLoading] = useState(!timetable);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const ttRes = await timetableApi.get();
      setTimetable(ttRes.data.timetable);
      storage.setTimetable(ttRes.data.timetable);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        storage.clearAll();
        navigate('/login?reason=session_expired');
        return;
      }
      if (status !== 404) setError('Could not load timetable.');
    } finally {
      setLoading(false);
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

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
