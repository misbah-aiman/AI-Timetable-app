import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone } from 'lucide-react';
import { sessionsApi } from '../../services/api';
import { Session } from '../../types';
import { useTimer } from '../../hooks/useTimer';

type ActivityType = 'study' | 'sleep' | 'screen';

const ACTIVITIES: Record<ActivityType, {
  label: string; sublabel: string; icon: React.ReactNode;
  color: string; track: string; goalMins: number;
}> = {
  study: {
    label: 'Study', sublabel: 'Focus session',
    icon: <BookOpen size={20} />, color: '#750608', track: '#FFD6D7', goalMins: 4 * 60,
  },
  sleep: {
    label: 'Sleep', sublabel: 'Rest & recovery',
    icon: <Moon size={20} />, color: '#5856D6', track: '#E8E8FF', goalMins: 8 * 60,
  },
  screen: {
    label: 'Scroll', sublabel: 'Screen time',
    icon: <Smartphone size={20} />, color: '#FF453A', track: '#FFE5E5', goalMins: 2 * 60,
  },
};

const CircleTimer = ({
  elapsed, goalMins, color, track, isRunning, label, sublabel, icon,
}: {
  elapsed: number; goalMins: number; color: string; track: string;
  isRunning: boolean; label: string; sublabel: string; icon: React.ReactNode;
}) => {
  const size = 270;
  const cx = size / 2;
  const cy = size / 2;
  const r  = 112;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(elapsed / (goalMins * 60), 1);
  const offset   = circumference * (1 - progress);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const timeStr = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  const pct = Math.round(progress * 100);

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={track}
          strokeWidth={12} className="dark:opacity-25" />
        {/* Progress */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {/* Glow head */}
        {isRunning && progress > 0.01 && (
          <circle
            cx={cx + r * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
            cy={cy + r * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
            r={6} fill={color} className="rotate-90"
            style={{ filter: `drop-shadow(0 0 8px ${color}cc)` }}
          />
        )}
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-3" style={{ color: isRunning ? color : '#9ca3af' }}>
          {icon}
          <span className="text-[13px] font-semibold tracking-tight">{label}</span>
        </div>

        <div
          className="font-bold leading-none tracking-tighter tabular-nums"
          style={{
            fontSize: h > 0 ? '2.6rem' : '3.2rem',
            color: isRunning ? color : '#9ca3af',
          }}
        >
          {isRunning ? timeStr : (h > 0 ? '00:00:00' : '00:00')}
        </div>

        <div className="text-[12px] text-gray-400 dark:text-gray-500 mt-2.5 tracking-tight">
          {isRunning ? `${pct}% of goal` : sublabel}
        </div>
      </div>
    </div>
  );
};

export const TimeTracker = () => {
  const [selected, setSelected] = useState<ActivityType>('study');
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isRunning  = !!activeSession;
  const activeType = (activeSession?.type as ActivityType) || selected;
  const cfg        = ACTIVITIES[activeType];

  const { elapsed } = useTimer(activeSession?.startTime || null, isRunning);

  useEffect(() => {
    sessionsApi.getActive()
      .then(res => {
        const sessions: Session[] = res.data.sessions;
        const relevant = sessions.find(s => ['study', 'sleep', 'screen'].includes(s.type));
        setActiveSession(relevant || null);
        if (relevant) setSelected(relevant.type as ActivityType);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await sessionsApi.start({ type: selected, label: ACTIVITIES[selected].label });
      setActiveSession(res.data.session);
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    setActionLoading(true);
    try {
      await sessionsApi.stop(activeSession._id);
      setActiveSession(null);
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-[3px] border-black/[0.06] dark:border-white/[0.08]" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary-700 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto md:max-w-md">

      {/* Ring timer */}
      <CircleTimer
        elapsed={elapsed} goalMins={cfg.goalMins}
        color={cfg.color} track={cfg.track} isRunning={isRunning}
        label={cfg.label} sublabel={cfg.sublabel} icon={cfg.icon}
      />

      {/* Activity selector */}
      <div className="flex gap-2.5 w-full">
        {(Object.entries(ACTIVITIES) as [ActivityType, typeof ACTIVITIES[ActivityType]][]).map(([type, a]) => {
          const active = isRunning ? activeType === type : selected === type;
          return (
            <button
              key={type}
              disabled={isRunning}
              onClick={() => setSelected(type)}
              className={`
                flex-1 flex flex-col items-center gap-2 py-4 rounded-3xl
                border-2 transition-all duration-200
                ${isRunning ? 'cursor-not-allowed' : 'hover:opacity-95 active:scale-[0.96]'}
                ${active ? 'border-transparent' : 'border-transparent bg-black/[0.04] dark:bg-white/[0.05] opacity-55'}
              `}
              style={active ? { backgroundColor: `${a.color}14`, borderColor: `${a.color}38` } : {}}
            >
              <span style={{ color: active ? a.color : '#9ca3af' }}>{a.icon}</span>
              <span className={`text-[12px] font-bold tracking-tight ${active ? '' : 'text-gray-400'}`}
                style={active ? { color: a.color } : {}}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Start / Stop */}
      <button
        onClick={isRunning ? handleStop : handleStart}
        disabled={actionLoading}
        className={`
          w-full py-4 rounded-3xl text-white text-[17px] font-bold tracking-tight
          transition-all duration-200 active:scale-[0.97] active:opacity-90
          shadow-soft disabled:opacity-50 focus:outline-none
          ${isRunning ? 'bg-red-500 hover:bg-red-600' : ''}
        `}
        style={!isRunning ? { backgroundColor: ACTIVITIES[selected].color } : {}}
      >
        {actionLoading ? '…' : isRunning ? 'Stop Session' : `Start ${ACTIVITIES[selected].label}`}
      </button>

    </div>
  );
};
