import { useEffect, useState } from 'react';
import { Timetable, TimeSlot } from '../../types';
import { Clock } from 'lucide-react';

interface TimetableViewProps {
  timetable: Timetable;
}

const categoryColors: Record<string, string> = {
  study:    '#008080',
  sleep:    '#6366F1',
  hobby:    '#3EB489',
  class:    '#0EA5E9',
  break:    '#64748B',
  exercise: '#F97316',
  meal:     '#FBBF24',
  screen:   '#F59E0B',
  other:    '#64748B',
};

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const getNowMins  = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const getTodayName = () =>
  ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

const SlotRow = ({ slot, status }: { slot: TimeSlot; status: 'past'|'active'|'next'|'future' }) => {
  const color = categoryColors[slot.category] || '#636366';
  const isPast   = status === 'past';
  const isActive = status === 'active';

  return (
    <div className={`
      flex items-center gap-3.5 px-4 py-3 transition-all duration-200
      ${isActive ? 'bg-primary-50/80 dark:bg-primary-900/20' : ''}
      ${isPast   ? 'opacity-40' : ''}
    `}>
      {/* Colored dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: isPast ? '#d1d5db' : color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold tracking-tight truncate ${
          isPast ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'
        }`}>
          {slot.activity}
        </p>
        <p className={`text-[12px] mt-0.5 tracking-tight ${
          isPast ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {slot.startTime} – {slot.endTime}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isActive && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
            Now
          </span>
        )}
        {status === 'next' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] text-gray-600 dark:text-gray-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
};

export const TimetableView = ({ timetable }: TimetableViewProps) => {
  const [nowMins,   setNowMins]   = useState(getNowMins);
  const [todayName, setTodayName] = useState(getTodayName);

  useEffect(() => {
    const tick = () => { setNowMins(getNowMins()); setTodayName(getTodayName()); };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const daySchedule = timetable.schedule.find(d => d.day === todayName);
  const slots = daySchedule?.slots ?? [];

  const activeIdx = slots.findIndex(s => nowMins >= toMins(s.startTime) && nowMins < toMins(s.endTime));
  const nextIdx   = activeIdx >= 0
    ? activeIdx + 1
    : slots.findIndex(s => toMins(s.startTime) > nowMins);

  const getStatus = (i: number): 'past'|'active'|'next'|'future' => {
    if (i === activeIdx) return 'active';
    if (i === nextIdx)   return 'next';
    if (toMins(slots[i].endTime) <= nowMins) return 'past';
    return 'future';
  };

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
        <div className="w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center">
          <Clock size={22} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-[14px] tracking-tight">No schedule for {todayName}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em] mb-3 px-1">
        {todayName}
      </p>
      <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05] max-h-[34rem] overflow-y-auto scrollbar-hide -mx-1 rounded-2xl">
        {slots.map((slot, i) => (
          <SlotRow key={i} slot={slot} status={getStatus(i)} />
        ))}
      </div>
    </div>
  );
};
