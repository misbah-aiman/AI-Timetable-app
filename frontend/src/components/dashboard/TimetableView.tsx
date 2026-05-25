import { useState } from 'react';
import { Timetable, TimeSlot } from '../../types';
import { Clock } from 'lucide-react';

interface TimetableViewProps {
  timetable: Timetable;
}

const categoryLabel: Record<string, string> = {
  study: 'Study', sleep: 'Sleep', hobby: 'Hobby', class: 'Class',
  break: 'Break', exercise: 'Exercise', meal: 'Meal', screen: 'Screen', other: 'Other',
};

const SlotCard = ({ slot }: { slot: TimeSlot }) => (
  <div
    className="flex items-center gap-3 p-3 rounded-2xl"
    style={{ backgroundColor: `${slot.color || '#8b5cf6'}0d` }}
  >
    <div
      className="w-1 self-stretch rounded-full shrink-0"
      style={{ backgroundColor: slot.color || '#8b5cf6' }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{slot.activity}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {slot.startTime} – {slot.endTime}
      </p>
    </div>
    <span
      className="text-xs px-2.5 py-1 rounded-xl font-semibold shrink-0"
      style={{ backgroundColor: `${slot.color || '#8b5cf6'}1a`, color: slot.color || '#8b5cf6' }}
    >
      {categoryLabel[slot.category] || slot.category}
    </span>
  </div>
);

export const TimetableView = ({ timetable }: TimetableViewProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const [activeDay, setActiveDay] = useState(todayName);

  const daySchedule = timetable.schedule.find(d => d.day === activeDay);

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {days.map(day => {
          const isToday = day === todayName;
          const isActive = day === activeDay;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-soft'
                  : isToday
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 bg-surface-100 dark:bg-[#1e1b2e] hover:bg-surface-200 dark:hover:bg-primary-900/20'
              }`}
            >
              {day.slice(0, 3)}
              {isToday && !isActive && <span className="ml-1 w-1 h-1 rounded-full bg-primary-400 inline-block align-middle" />}
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {daySchedule && daySchedule.slots.length > 0 ? (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {daySchedule.slots.map((slot, i) => (
            <SlotCard key={i} slot={slot} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-[#1e1b2e] flex items-center justify-center mb-3">
            <Clock size={24} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm">No schedule for {activeDay}</p>
        </div>
      )}
    </div>
  );
};
