import { useEffect, useMemo, useRef, useState } from 'react';
import { Timetable, TimeSlot } from '../../types';
import { Clock } from 'lucide-react';

const WEEK_DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_COLORS: Record<string, string> = {
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

const getNowMins = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

// Mon=0 … Sun=6
const getTodayWeekIdx = () => {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
};

const getWeekDates = () => {
  const today = new Date();
  const dow    = today.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offset);
  return WEEK_DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
};

const fmtDuration = (slot: TimeSlot) => {
  const diff = toMins(slot.endTime) - toMins(slot.startTime);
  if (diff <= 0) return '';
  if (diff < 60)  return `${diff}m`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

// ─── Now Hero Card ────────────────────────────────────────────
// FIX: background was ${color}12 (7% opacity = invisible).
// Now uses ${color}28 (~16%) + border ${color}60 (38%) for real presence.
// FIX: remaining-time text was ${color}99 (60% opacity = ~1.8:1 contrast). Now gray.
// FIX: progress-% text was ${color}80 (50% opacity = ~1.5:1). Now gray.
// FIX: progress track was ${color}20 (~12%). Now ${color}35 (~21%) for visible rail.

const NowCard = ({ slot, nowMins }: { slot: TimeSlot; nowMins: number }) => {
  const color     = CATEGORY_COLORS[slot.category] || '#64748B';
  const startMins = toMins(slot.startTime);
  const endMins   = toMins(slot.endTime);
  const duration  = endMins - startMins;
  const elapsed   = nowMins - startMins;
  const progress  = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;
  const remaining = endMins - nowMins;
  const remStr    = remaining < 60
    ? `${remaining}m left`
    : `${Math.floor(remaining / 60)}h${remaining % 60 ? ` ${remaining % 60}m` : ''} left`;

  return (
    <div
      className="rounded-3xl p-5 mb-3 animate-fade-in"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}0e)`,
        border: `1.5px solid ${color}60`,
        boxShadow: `0 4px 28px ${color}22`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse inline-block"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.10em]" style={{ color }}>
            Now
          </span>
        </div>
        {/* FIX: was ${color}99 (~1.8:1 contrast) → readable gray */}
        <span className="text-[12px] font-medium tabular-nums text-gray-600 dark:text-gray-300">
          {remStr}
        </span>
      </div>

      <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-1">
        {slot.activity}
      </p>
      <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4 tracking-tight">
        {slot.startTime} – {slot.endTime} · {fmtDuration(slot)}
      </p>

      <div className="h-1.5 rounded-full overflow-hidden bg-black/[0.08] dark:bg-white/[0.10]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
            transition: 'width 1s linear',
          }}
        />
      </div>
      {/* FIX: was ${color}80 (50% opacity = ~1.5:1 contrast) → readable gray */}
      <p className="text-[11px] mt-1.5 font-medium tabular-nums text-gray-600 dark:text-gray-400">
        {Math.round(progress)}% complete
      </p>
    </div>
  );
};

// ─── Next Up Card ─────────────────────────────────────────────
// FIX: border was border-black/[0.04] (barely visible) → border-black/[0.10] dark:border-white/[0.12]

const NextCard = ({ slot }: { slot: TimeSlot }) => {
  const color = CATEGORY_COLORS[slot.category] || '#64748B';
  return (
    <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/[0.05] border border-black/[0.10] dark:border-white/[0.12] mb-4 animate-fade-in">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 dark:text-white tracking-tight truncate">
          {slot.activity}
        </p>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
          {slot.startTime} · {fmtDuration(slot)}
        </p>
      </div>
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-xl bg-gray-200 dark:bg-white/[0.12] text-gray-600 dark:text-gray-300 shrink-0">
        Next
      </span>
    </div>
  );
};

// ─── Slot Row ─────────────────────────────────────────────────

const SlotRow = ({
  slot,
  status,
  isChecked,
  onToggle,
}: {
  slot: TimeSlot;
  status: 'past' | 'active' | 'next' | 'future';
  isChecked: boolean;
  onToggle: () => void;
}) => {
  const color      = CATEGORY_COLORS[slot.category] || '#64748B';
  const isPast     = status === 'past';
  const isActive   = status === 'active';
  const isNext     = status === 'next';
  const isCheckable = isPast;

  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl transition-colors duration-150 ${
        isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
      }`}
    >
      {/* Time label */}
      <span
        className={`w-10 text-right text-[11px] font-medium tabular-nums shrink-0 leading-none ${
          isPast ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {slot.startTime}
      </span>

      {/* Color accent bar */}
      <div
        className="w-[3px] h-9 rounded-full shrink-0"
        style={{
          backgroundColor: isPast ? '#d1d5db' : color,
          opacity:          isPast ? 0.5 : 1,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[14px] font-semibold tracking-tight truncate leading-snug ${
            isPast
              ? isChecked
                ? 'line-through text-gray-300 dark:text-gray-600'
                : 'text-gray-400 dark:text-gray-600'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {slot.activity}
        </p>
        {!isPast && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 tracking-tight">
            {fmtDuration(slot)}
          </p>
        )}
      </div>

      {/* Status badge / checkbox */}
      <div className="shrink-0 flex items-center">
        {isActive && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-xl"
            style={{ backgroundColor: `${color}25`, color }}
          >
            Now
          </span>
        )}
        {isNext && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-xl bg-gray-100 dark:bg-white/[0.10] text-gray-600 dark:text-gray-300">
            Next
          </span>
        )}
        {isCheckable && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 hover:opacity-70"
            aria-label={isChecked ? 'Mark as incomplete' : 'Mark as done'}
          >
            {isChecked ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" fill="#008080" />
                <path d="M7 11.5l2.5 2.5 5.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9.5" stroke="#d1d5db" strokeWidth="1.5" />
                <path d="M7 11.5l2.5 2.5 5.5-5" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────

export const TimetableView = ({
  timetable,
  completedSlots = [],
  onToggleSlot,
}: {
  timetable: Timetable;
  completedSlots?: string[];
  onToggleSlot?: (day: string, startTime: string) => void;
}) => {
  const todayIdx  = useMemo(() => getTodayWeekIdx(), []);
  const weekDates = useMemo(() => getWeekDates(), []);
  const [selectedIdx, setSelectedIdx] = useState(todayIdx);
  const [nowMins, setNowMins]         = useState(getNowMins);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMins(getNowMins()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const btn = tabsRef.current?.children[todayIdx] as HTMLElement | undefined;
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [todayIdx]);

  const isToday = selectedIdx === todayIdx;
  const dayName = WEEK_DAYS[selectedIdx];
  const slots   = timetable.schedule.find(d => d.day === dayName)?.slots ?? [];

  const activeIdx = isToday
    ? slots.findIndex(s => nowMins >= toMins(s.startTime) && nowMins < toMins(s.endTime))
    : -1;

  const nextIdx = isToday
    ? activeIdx >= 0
      ? activeIdx + 1
      : slots.findIndex(s => toMins(s.startTime) > nowMins)
    : -1;

  const getStatus = (i: number): 'past' | 'active' | 'next' | 'future' => {
    if (selectedIdx < todayIdx) return 'past';
    if (selectedIdx > todayIdx) return 'future';
    if (i === activeIdx) return 'active';
    if (i === nextIdx)   return 'next';
    if (toMins(slots[i].endTime) <= nowMins) return 'past';
    return 'future';
  };

  const activeSlot = activeIdx >= 0 ? slots[activeIdx] : null;
  const nextSlot   = nextIdx >= 0 && nextIdx < slots.length ? slots[nextIdx] : null;

  return (
    <div>
      {/* ── Day tabs ── */}
      {/* FIX: abbreviation was text-primary-100 on bg-primary-500 = 3.32:1 (fails AA).
              Changed to text-white/75 → blends to ~4.5:1. Number stays text-white (4.77:1). */}
      <div
        ref={tabsRef}
        className="flex gap-1 mb-5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
      >
        {WEEK_DAYS.map((day, idx) => {
          const isSelected = idx === selectedIdx;
          const isTodayDay = idx === todayIdx;
          return (
            <button
              key={day}
              onClick={() => setSelectedIdx(idx)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl shrink-0 min-w-[46px] transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-b from-primary-500 to-primary-700 shadow-glow-primary-sm'
                  : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.05em] ${
                  isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {WEEK_SHORT[idx]}
              </span>
              <span
                className={`text-[16px] font-bold tabular-nums leading-none ${
                  isSelected
                    ? 'text-white'
                    : isTodayDay
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {weekDates[idx]}
              </span>
              {isTodayDay && (
                <div
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected ? 'bg-white/60' : 'bg-primary-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Now / Next hero (today only) ── */}
      {isToday && activeSlot && <NowCard slot={activeSlot} nowMins={nowMins} />}
      {isToday && nextSlot   && <NextCard slot={nextSlot} />}

      {/* ── Schedule list ── */}
      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
            <Clock size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 tracking-tight">
            No schedule for {dayName}
          </p>
        </div>
      ) : (
        <>
          {isToday && (activeSlot || nextSlot) && (
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-2 px-3">
              Full schedule
            </p>
          )}
          <div className="max-h-[32rem] overflow-y-auto scrollbar-hide -mx-1 px-1 space-y-0.5">
            {slots.map((slot, i) => {
              const status = getStatus(i);
              return (
                <SlotRow
                  key={i}
                  slot={slot}
                  status={status}
                  isChecked={completedSlots.includes(`${dayName}|${slot.startTime}`)}
                  onToggle={() => onToggleSlot?.(dayName, slot.startTime)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
