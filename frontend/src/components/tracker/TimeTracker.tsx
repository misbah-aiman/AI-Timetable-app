import { useEffect, useState } from 'react';
import { BookOpen, Moon, Smartphone } from 'lucide-react';
import { sessionsApi } from '../../services/api';
import { Session } from '../../types';
import { useTimer } from '../../hooks/useTimer';

type ActivityType = 'study' | 'sleep' | 'screen';

const ACTIVITIES: Record<ActivityType, {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  track: string;
  goalMins: number;
}> = {
  study: {
    label: 'Study',
    sublabel: 'Focus session',
    icon: <BookOpen size={22} />,
    color: '#A76D60',
    track: '#eed9d1',
    goalMins: 4 * 60,
  },
  sleep: {
    label: 'Sleep',
    sublabel: 'Rest & recovery',
    icon: <Moon size={22} />,
    color: '#b8967a',
    track: '#f3ede5',
    goalMins: 8 * 60,
  },
  screen: {
    label: 'Scroll',
    sublabel: 'Screen time',
    icon: <Smartphone size={22} />,
    color: '#f97316',
    track: '#ffedd5',
    goalMins: 2 * 60,
  },
};

// SVG circular progress ring
const CircleTimer = ({
  elapsed,
  goalMins,
  color,
  track,
  isRunning,
  label,
  sublabel,
  icon,
}: {
  elapsed: number;
  goalMins: number;
  color: string;
  track: string;
  isRunning: boolean;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}) => {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 118;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(elapsed / (goalMins * 60), 1);
  const offset = circumference * (1 - progress);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const timeStr = h > 0
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={track}
          strokeWidth={14}
          className="dark:opacity-20"
        />
        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        {/* Subtle glow dot at progress head */}
        {isRunning && progress > 0 && (
          <circle
            cx={cx + r * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
            cy={cy + r * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
            r={7}
            fill={color}
            className="rotate-90"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-2" style={{ color }}>
          {icon}
          <span className="text-sm font-semibold">{label}</span>
        </div>

        <div
          className="font-mono font-bold leading-none tracking-tight"
          style={{
            fontSize: h > 0 ? '2.8rem' : '3.5rem',
            color: isRunning ? color : '#9ca3af',
          }}
        >
          {isRunning ? timeStr : (h > 0 ? '00:00:00' : '00:00')}
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {isRunning
            ? `${Math.round((elapsed / (goalMins * 60)) * 100)}% of goal`
            : sublabel
          }
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

  const isRunning = !!activeSession;
  const activeType = (activeSession?.type as ActivityType) || selected;
  const cfg = ACTIVITIES[activeType];

  const { elapsed } = useTimer(activeSession?.startTime || null, isRunning);

  const fetchData = async () => {
    try {
      const activeRes = await sessionsApi.getActive();
      const sessions: Session[] = activeRes.data.sessions;
      const relevant = sessions.find(s => ['study', 'sleep', 'screen'].includes(s.type));
      setActiveSession(relevant || null);
      if (relevant) setSelected(relevant.type as ActivityType);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto md:max-w-md">

      {/* Circle timer */}
      <CircleTimer
        elapsed={elapsed}
        goalMins={cfg.goalMins}
        color={cfg.color}
        track={cfg.track}
        isRunning={isRunning}
        label={cfg.label}
        sublabel={cfg.sublabel}
        icon={cfg.icon}
      />

      {/* Activity selector — disabled while running */}
      <div className="flex gap-2.5 w-full">
        {(Object.entries(ACTIVITIES) as [ActivityType, typeof ACTIVITIES[ActivityType]][]).map(([type, a]) => {
          const active = isRunning ? activeType === type : selected === type;
          return (
            <button
              key={type}
              disabled={isRunning}
              onClick={() => setSelected(type)}
              className={`flex-1 flex flex-col items-center gap-2 py-3.5 rounded-3xl border-2 transition-all duration-200 ${
                active
                  ? 'border-transparent shadow-soft'
                  : 'border-transparent bg-surface-100 dark:bg-[#261f15] opacity-60'
              } ${isRunning ? 'cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.97]'}`}
              style={active ? { backgroundColor: `${a.color}15`, borderColor: `${a.color}40` } : {}}
            >
              <span style={{ color: active ? a.color : '#9ca3af' }}>{a.icon}</span>
              <span
                className={`text-xs font-bold tracking-wide ${active ? '' : 'text-gray-400'}`}
                style={active ? { color: a.color } : {}}
              >
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Start / Stop button */}
      <button
        onClick={isRunning ? handleStop : handleStart}
        disabled={actionLoading}
        className={`w-full py-4 rounded-3xl text-white text-base font-bold tracking-wide transition-all duration-200 active:scale-[0.97] shadow-soft disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 ${
          isRunning ? 'bg-red-500 hover:bg-red-600' : ''
        }`}
        style={!isRunning ? { backgroundColor: ACTIVITIES[selected].color } : {}}
      >
        {actionLoading ? '…' : isRunning ? 'Stop Session' : `Start ${ACTIVITIES[selected].label}`}
      </button>

    </div>
  );
};
