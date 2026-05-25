import { useEffect, useState } from 'react';
import { Timetable, TimeSlot } from '../../types';
import { Clock } from 'lucide-react';

interface TimetableViewProps {
  timetable: Timetable;
}

const categoryLabel: Record<string, string> = {
  study: 'Study', sleep: 'Sleep', hobby: 'Hobby', class: 'Class',
  break: 'Break', exercise: 'Exercise', meal: 'Meal', screen: 'Screen', other: 'Other',
};

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const getNowMins = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getTodayName = () =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

const SlotCard = ({ slot, status }: { slot: TimeSlot; status: 'past' | 'active' | 'next' | 'future' }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
    status === 'active'
      ? 'bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-300 dark:ring-primary-700/60'
      : status === 'past'
      ? 'bg-surface-50 dark:bg-[#1c1910] opacity-50'
      : 'bg-surface-100 dark:bg-[#2c2619]'
  }`}>
    <div className={`w-0.5 self-stretch rounded-full shrink-0 ${
      status === 'active' ? 'bg-primary-500' : 'bg-primary-300 dark:bg-primary-600'
    }`} />
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold truncate ${
        status === 'past' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
      }`}>
        {slot.activity}
      </p>
      <p className={`text-xs mt-0.5 ${
        status === 'past' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-200'
      }`}>
        {slot.startTime} – {slot.endTime}
      </p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {status === 'active' && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300">
          Now
        </span>
      )}
      {status === 'next' && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-200 dark:bg-[#352e1e] text-gray-700 dark:text-white">
          Next
        </span>
      )}
      <span className="text-[11px] px-2 py-0.5 rounded-lg font-medium text-gray-700 dark:text-white bg-surface-200 dark:bg-[#352e1e]">
        {categoryLabel[slot.category] || slot.category}
      </span>
    </div>
  </div>
);

export const TimetableView = ({ timetable }: TimetableViewProps) => {
  const [nowMins, setNowMins] = useState(getNowMins);
  const [todayName, setTodayName] = useState(getTodayName);

  // Update every minute — auto-switches at midnight
  useEffect(() => {
    const tick = () => {
      setNowMins(getNowMins());
      setTodayName(getTodayName());
    };
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const daySchedule = timetable.schedule.find(d => d.day === todayName);
  const slots = daySchedule?.slots ?? [];

  // Find active and next slot indices
  const activeIdx = slots.findIndex(s => nowMins >= toMins(s.startTime) && nowMins < toMins(s.endTime));
  const nextIdx = activeIdx >= 0 ? activeIdx + 1 : slots.findIndex(s => toMins(s.startTime) > nowMins);

  const getStatus = (i: number): 'past' | 'active' | 'next' | 'future' => {
    if (i === activeIdx) return 'active';
    if (i === nextIdx) return 'next';
    if (toMins(slots[i].endTime) <= nowMins) return 'past';
    return 'future';
  };

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-[#221e15] flex items-center justify-center mb-3">
          <Clock size={24} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm">No schedule for {todayName}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{todayName}</p>
      <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
        {slots.map((slot, i) => (
          <SlotCard key={i} slot={slot} status={getStatus(i)} />
        ))}
      </div>
    </div>
  );
};
