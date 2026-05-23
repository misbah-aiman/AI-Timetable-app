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
    label: 'Study', icon: <BookOpen size={18} />, color: '#8b5cf6',
    examples: ['Mathematics', 'Physics', 'English', 'Coding'],
  },
  sleep: {
    label: 'Sleep', icon: <Moon size={18} />, color: '#a78bfa',
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
    <div
      className="flex flex-col gap-3 p-4 rounded-3xl border border-primary-50 dark:border-primary-900/20 bg-white dark:bg-[#1e1b2e] shadow-card"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}>
          {cfg.icon}
        </div>
        <span className="font-bold text-gray-800 dark:text-white text-sm flex-1">{cfg.label}</span>
        {isRunning && (
          <span className="text-sm font-mono font-bold" style={{ color: cfg.color }}>
            {formatted}
          </span>
        )}
      </div>

      {!isRunning && (
        <select
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="text-sm px-3 py-2 border border-primary-100 dark:border-primary-900/30 rounded-2xl bg-surface-50 dark:bg-[#16141f] dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
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
          <Square size={13} /> Stop
        </Button>
      ) : (
        <button
          onClick={() => onStart(type, label)}
          className="flex items-center justify-center gap-2 py-2 rounded-2xl text-white text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: cfg.color }}
        >
          <Play size={13} fill="currentColor" /> Start
        </button>
      )}
    </div>
  );
};

const SessionSummary = ({ sessions }: { sessions: Session[] }) => {
  const byType = (type: SessionType) =>
    sessions.filter(s => s.type === type && !s.isActive).reduce((a, s) => a + (s.durationMinutes || 0), 0);

  return (
    <div className="grid grid-cols-5 gap-2">
      {(Object.keys(SESSION_CONFIG) as SessionType[]).map(type => {
        const mins = byType(type);
        const cfg = SESSION_CONFIG[type];
        return (
          <div key={type} className="text-center p-2 rounded-2xl bg-surface-100 dark:bg-[#1e1b2e]">
            <div className="text-sm font-bold" style={{ color: cfg.color }}>
              {mins >= 60 ? `${Math.floor(mins / 60)}h` : `${mins}m`}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cfg.label.split(' ')[0]}</div>
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

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">Loading tracker...</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

      <Card padding="sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Today's Total</h3>
        <SessionSummary sessions={todaySessions} />
      </Card>
    </div>
  );
};
