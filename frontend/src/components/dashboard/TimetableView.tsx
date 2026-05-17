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
    className="flex items-start gap-3 p-3 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-900/50"
    style={{ borderLeftColor: slot.color || '#6366f1' }}
  >
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{slot.activity}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {slot.startTime} – {slot.endTime}
      </p>
    </div>
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ backgroundColor: `${slot.color}20`, color: slot.color || '#6366f1' }}
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
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {days.map(day => {
          const isToday = day === todayName;
          const isActive = day === activeDay;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : isToday
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {day.slice(0, 3)}
              {isToday && <span className="ml-1 text-xs opacity-70">Today</span>}
            </button>
          );
        })}
      </div>

      {/* Slots */}
      {daySchedule && daySchedule.slots.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {daySchedule.slots.map((slot, i) => (
            <SlotCard key={i} slot={slot} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Clock size={36} className="mb-2 opacity-40" />
          <p className="text-sm">No schedule for {activeDay}</p>
        </div>
      )}
    </div>
  );
};
