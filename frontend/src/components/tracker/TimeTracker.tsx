import { useEffect, useState } from 'react';
import { Play, Square, BookOpen, Moon, Smartphone, Dumbbell, Heart } from 'lucide-react';
import { sessionsApi } from '../../services/api';
import { Session } from '../../types';
import { useTimer } from '../../hooks/useTimer';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type SessionType = 'study' | 'sleep' | 'screen' | 'exercise' | 'hobby';

const SESSION_CONFIG: Record<SessionType, { label: string; icon: React.ReactNode; color: string; examples: string[] }> = {
  study: {
    label: 'Study', icon: <BookOpen size={18} />, color: '#6366f1',
    examples: ['Mathematics', 'Physics', 'English', 'Coding'],
  },
  sleep: {
    label: 'Sleep', icon: <Moon size={18} />, color: '#8b5cf6',
    examples: ['Night sleep', 'Nap'],
  },
  screen: {
    label: 'Screen Time', icon: <Smartphone size={18} />, color: '#f97316',
    examples: ['YouTube', 'Instagram', 'Netflix', 'Gaming'],
  },
  exercise: {
    label: 'Exercise', icon: <Dumbbell size={18} />, color: '#10b981',
    examples: ['Gym', 'Running', 'Yoga', 'Walk'],
  },
  hobby: {
    label: 'Hobby', icon: <Heart size={18} />, color: '#ec4899',
    examples: ['Reading', 'Music', 'Art', 'Cooking'],
  },
};

// Single tracker panel for one session type
const TrackerPanel = ({
  type,
  activeSession,
  onStart,
  onStop,
}: {
  type: SessionType;
  activeSession: Session | null;
  onStart: (type: SessionType, label: string) => void;
  onStop: (id: string) => void;
}) => {
  const cfg = SESSION_CONFIG[type];
  const isRunning = !!activeSession;
  const { formatted } = useTimer(activeSession?.startTime || null, isRunning);
  const [label, setLabel] = useState(cfg.examples[0]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
          {cfg.icon}
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-sm">{cfg.label}</span>
        {isRunning && (
          <span className="ml-auto text-sm font-mono font-bold" style={{ color: cfg.color }}>
            {formatted}
          </span>
        )}
      </div>

      {!isRunning && (
        <select
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="text-sm px-2 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {cfg.examples.map(ex => <option key={ex}>{ex}</option>)}
        </select>
      )}

      {isRunning ? (
        <Button
          variant="danger"
          size="sm"
          onClick={() => activeSession && onStop(activeSession._id)}
        >
          <Square size={14} /> Stop
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => onStart(type, label)}
          style={{ backgroundColor: cfg.color, borderColor: cfg.color }}
        >
          <Play size={14} /> Start
        </Button>
      )}
    </div>
  );
};

// Today's completed sessions summary
const SessionSummary = ({ sessions }: { sessions: Session[] }) => {
  const byType = (type: SessionType) =>
    sessions.filter(s => s.type === type && !s.isActive).reduce((a, s) => a + (s.durationMinutes || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
      {(Object.keys(SESSION_CONFIG) as SessionType[]).map(type => {
        const mins = byType(type);
        const cfg = SESSION_CONFIG[type];
        return (
          <div key={type} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="text-lg font-bold" style={{ color: cfg.color }}>
              {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const TimeTracker = () => {
  const [activeSessions, setActiveSessions] = useState<Record<string, Session>>({});
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [activeRes, todayRes] = await Promise.all([
        sessionsApi.getActive(),
        sessionsApi.getToday(),
      ]);
      const active: Record<string, Session> = {};
      activeRes.data.sessions.forEach((s: Session) => { active[s.type] = s; });
      setActiveSessions(active);
      setTodaySessions(todayRes.data.sessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart = async (type: SessionType, label: string) => {
    try {
      const res = await sessionsApi.start({ type, label });
      setActiveSessions(prev => ({ ...prev, [type]: res.data.session }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async (id: string) => {
    try {
      const res = await sessionsApi.stop(id);
      const stopped: Session = res.data.session;
      setActiveSessions(prev => {
        const next = { ...prev };
        delete next[stopped.type];
        return next;
      });
      setTodaySessions(prev => [...prev.filter(s => s._id !== stopped._id), stopped]);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading tracker...</div>;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Tracker</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.keys(SESSION_CONFIG) as SessionType[]).map(type => (
          <TrackerPanel
            key={type}
            type={type}
            activeSession={activeSessions[type] || null}
            onStart={handleStart}
            onStop={handleStop}
          />
        ))}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Today's Total</h3>
        <SessionSummary sessions={todaySessions} />
      </div>
    </Card>
  );
};
