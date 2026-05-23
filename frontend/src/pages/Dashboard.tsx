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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white leading-tight">
            {getGreeting()},<br />
            <span className="text-primary-500">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRegenerate} loading={regenerating} className="mt-1">
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button size="sm" onClick={() => navigate('/onboarding')}>
            <Sparkles size={13} /> Fix
          </Button>
        </div>
      )}

      {/* Timetable */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">Weekly Schedule</h2>
        </div>

        {timetable ? (
          <TimetableView timetable={timetable} />
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-primary-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 text-center">
              No timetable yet — let AI plan your week
            </p>
            <Button onClick={handleRegenerate} loading={regenerating} size="lg">
              <Sparkles size={16} /> Generate Timetable
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
