import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Trash2, LogOut, ChevronRight,
  Save, RefreshCw, X, CheckCircle,
  Dumbbell, Briefcase, BookOpen,
} from 'lucide-react';
import { userApi, timetableApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/localStorage';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ClassEntry } from '../types';

// ── Constants ────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HOBBY_OPTIONS = [
  'Reading', 'Gaming', 'Music', 'Sports',
  'Cooking', 'Art', 'Gym', 'Meditation', 'Walking', 'Coding',
];

// ── Sub-components ───────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-2 px-1">
    {children}
  </p>
);

const Divider = () => (
  <div className="border-t border-black/[0.06] dark:border-white/[0.06] ml-0" />
);

const OptionPill = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 ${
      selected
        ? 'bg-primary-500 text-white shadow-soft'
        : 'bg-black/[0.05] dark:bg-white/[0.07] text-gray-600 dark:text-gray-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.10]'
    }`}
  >
    {label}
  </button>
);

const IOSToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-300 focus:outline-none ${
      value ? 'bg-[#34C759]' : 'bg-black/[0.12] dark:bg-white/[0.15]'
    }`}
    role="switch"
    aria-checked={value}
  >
    <span className={`
      absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-card
      transition-transform duration-300 ease-in-out
      ${value ? 'translate-x-5' : 'translate-x-0'}
    `} />
  </button>
);

// ── Routine state ────────────────────────────────────────

interface RoutineForm {
  sleepTime: string; wakeTime: string; sleepHours: number;
  chronotype: string; studyGoalHours: number; studyStyle: string;
  screenTimeLimitHours: number; exerciseEnabled: boolean;
  exerciseTime: string; exerciseDuration: number;
  workEnabled: boolean; workDays: string[]; workStartTime: string; workEndTime: string;
  hobbies: string[]; classes: ClassEntry[];
}

// ── Routine Editor ───────────────────────────────────────

const RoutineEditor = ({
  initial, onSave,
}: { initial: RoutineForm; onSave: (data: RoutineForm, regenerate: boolean) => Promise<void> }) => {
  const [r, setR] = useState<RoutineForm>(initial);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [customHobby, setCustomHobby] = useState('');
  const [newClass, setNewClass] = useState<ClassEntry>({ name: '', day: 'Monday', startTime: '09:00', endTime: '10:00' });
  const [classError, setClassError] = useState('');
  const [workError, setWorkError] = useState('');

  const set = <K extends keyof RoutineForm>(k: K, v: RoutineForm[K]) => setR(prev => ({ ...prev, [k]: v }));

  const toggleHobby = (h: string) =>
    set('hobbies', r.hobbies.includes(h) ? r.hobbies.filter(x => x !== h) : [...r.hobbies, h]);
  const toggleWorkDay = (d: string) =>
    set('workDays', r.workDays.includes(d) ? r.workDays.filter(x => x !== d) : [...r.workDays, d]);

  const addHobby = () => {
    const val = customHobby.trim();
    if (val && !r.hobbies.includes(val)) toggleHobby(val);
    setCustomHobby('');
  };

  const addClass = () => {
    if (!newClass.name.trim()) { setClassError('Enter a class name.'); return; }
    if (newClass.endTime <= newClass.startTime) { setClassError('End time must be after start time.'); return; }
    setClassError('');
    set('classes', [...r.classes, { ...newClass, name: newClass.name.trim() }]);
    setNewClass({ name: '', day: 'Monday', startTime: '09:00', endTime: '10:00' });
  };

  const validate = () => {
    if (r.workEnabled) {
      if (r.workDays.length === 0) { setWorkError('Select at least one work day.'); return false; }
      if (r.workEndTime <= r.workStartTime) { setWorkError('End time must be after start time.'); return false; }
    }
    return true;
  };

  const handleSave = async (regenerate: boolean) => {
    if (!validate()) return;
    regenerate ? setRegenerating(true) : setSaving(true);
    await onSave(r, regenerate);
    setSaving(false); setRegenerating(false);
  };

  return (
    <div className="overflow-y-auto max-h-[70vh] scrollbar-hide">
      <div className="space-y-6 pb-2">

        {/* Sleep */}
        <div className="space-y-4">
          <SectionLabel>Sleep</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bedtime"  type="time" value={r.sleepTime} onChange={e => set('sleepTime', e.target.value)} />
            <Input label="Wake-up"  type="time" value={r.wakeTime}  onChange={e => set('wakeTime',  e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[14px] text-gray-700 dark:text-gray-300">Sleep goal</span>
              <span className="text-[14px] font-bold text-primary-500">{r.sleepHours}h</span>
            </div>
            <input type="range" min={4} max={12} value={r.sleepHours}
              onChange={e => set('sleepHours', Number(e.target.value))}
              className="w-full accent-primary-500" style={{ accentColor: '#008080' }}
            />
          </div>
        </div>

        <Divider />

        {/* Peak Hours */}
        <div className="space-y-3">
          <SectionLabel>Peak Focus Hours</SectionLabel>
          <div className="flex gap-2">
            <OptionPill selected={r.chronotype === 'morning'}   onClick={() => set('chronotype', 'morning')}   label="Morning" />
            <OptionPill selected={r.chronotype === 'afternoon'} onClick={() => set('chronotype', 'afternoon')} label="Afternoon" />
            <OptionPill selected={r.chronotype === 'evening'}   onClick={() => set('chronotype', 'evening')}   label="Evening" />
          </div>
        </div>

        <Divider />

        {/* Study */}
        <div className="space-y-4">
          <SectionLabel>Study</SectionLabel>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[14px] text-gray-700 dark:text-gray-300">Daily goal</span>
              <span className="text-[14px] font-bold text-primary-500">{r.studyGoalHours}h</span>
            </div>
            <input type="range" min={1} max={12} value={r.studyGoalHours}
              onChange={e => set('studyGoalHours', Number(e.target.value))}
              style={{ accentColor: '#008080' }} className="w-full"
            />
          </div>
          <div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">Study style</p>
            <div className="flex gap-2">
              <OptionPill selected={r.studyStyle === 'pomodoro'} onClick={() => set('studyStyle', 'pomodoro')} label="Pomodoro" />
              <OptionPill selected={r.studyStyle === 'medium'}   onClick={() => set('studyStyle', 'medium')}   label="Medium" />
              <OptionPill selected={r.studyStyle === 'long'}     onClick={() => set('studyStyle', 'long')}     label="Deep work" />
            </div>
          </div>
        </div>

        <Divider />

        {/* Screen Time */}
        <div className="space-y-3">
          <SectionLabel>Screen Time Limit</SectionLabel>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[14px] text-gray-700 dark:text-gray-300">Daily limit</span>
              <span className="text-[14px] font-bold text-orange-500">
                {r.screenTimeLimitHours === 0 ? 'No limit' : `${r.screenTimeLimitHours}h`}
              </span>
            </div>
            <input type="range" min={0} max={8} value={r.screenTimeLimitHours}
              onChange={e => set('screenTimeLimitHours', Number(e.target.value))}
              style={{ accentColor: '#f97316' }} className="w-full"
            />
          </div>
        </div>

        <Divider />

        {/* Exercise */}
        <div className="space-y-3">
          <SectionLabel>Exercise</SectionLabel>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-gray-800 dark:text-white">Enable exercise blocks</span>
            <IOSToggle value={r.exerciseEnabled} onChange={v => set('exerciseEnabled', v)} />
          </div>
          {r.exerciseEnabled && (
            <>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">When</p>
                <div className="flex gap-2">
                  <OptionPill selected={r.exerciseTime === 'morning'} onClick={() => set('exerciseTime', 'morning')} label="Morning" />
                  <OptionPill selected={r.exerciseTime === 'evening'} onClick={() => set('exerciseTime', 'evening')} label="Evening" />
                </div>
              </div>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">Duration</p>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map(m => (
                    <OptionPill key={m} selected={r.exerciseDuration === m} onClick={() => set('exerciseDuration', m)} label={`${m}m`} />
                  ))}
                </div>
              </div>
            </>
          )}
          {!r.exerciseEnabled && (
            <div className="flex items-center gap-2.5 p-3 bg-black/[0.04] dark:bg-white/[0.05] rounded-2xl">
              <Dumbbell size={15} className="text-gray-300 dark:text-gray-600 shrink-0" />
              <p className="text-[13px] text-gray-400">No exercise blocks will be scheduled.</p>
            </div>
          )}
        </div>

        <Divider />

        {/* Work */}
        <div className="space-y-3">
          <SectionLabel>Work Schedule</SectionLabel>
          <div className="flex items-center justify-between">
            <span className="text-[15px] text-gray-800 dark:text-white">Enable work hours</span>
            <IOSToggle value={r.workEnabled} onChange={v => { set('workEnabled', v); setWorkError(''); }} />
          </div>
          {r.workEnabled && (
            <>
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">Work days</p>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map(d => (
                    <button key={d} onClick={() => { toggleWorkDay(d); setWorkError(''); }}
                      className={`py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95 ${
                        r.workDays.includes(d)
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-black/[0.05] dark:bg-white/[0.07] text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start time" type="time" value={r.workStartTime}
                  onChange={e => { set('workStartTime', e.target.value); setWorkError(''); }} />
                <Input label="End time"   type="time" value={r.workEndTime}
                  onChange={e => { set('workEndTime',   e.target.value); setWorkError(''); }} />
              </div>
              {workError && <p className="text-[12px] text-red-500">{workError}</p>}
            </>
          )}
          {!r.workEnabled && (
            <div className="flex items-center gap-2.5 p-3 bg-black/[0.04] dark:bg-white/[0.05] rounded-2xl">
              <Briefcase size={15} className="text-gray-300 dark:text-gray-600 shrink-0" />
              <p className="text-[13px] text-gray-400">No work hours will be blocked.</p>
            </div>
          )}
        </div>

        <Divider />

        {/* Hobbies */}
        <div className="space-y-3">
          <SectionLabel>Hobbies</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {HOBBY_OPTIONS.map(h => {
              const sel = r.hobbies.includes(h);
              return (
                <button key={h} onClick={() => toggleHobby(h)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all active:scale-95 ${
                    sel
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400/60 text-primary-700 dark:text-primary-300'
                      : 'border-black/[0.08] dark:border-white/[0.09] text-gray-700 dark:text-gray-300 bg-black/[0.03] dark:bg-white/[0.04]'
                  }`}
                >
                  {h}
                  {sel && <CheckCircle size={13} className="text-primary-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          {r.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {r.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).map(h => (
                <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 border border-primary-300/60 dark:border-primary-700/60 text-primary-700 dark:text-primary-300 text-[12px] font-medium rounded-full">
                  {h}
                  <button onClick={() => toggleHobby(h)} className="text-primary-400 hover:text-red-500 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom hobby…"
              value={customHobby}
              onChange={e => setCustomHobby(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHobby(); } }}
              className="flex-1 px-3 py-2.5 text-[14px] rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.04] dark:bg-white/[0.06] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-400/60 transition-all"
            />
            <button onClick={addHobby} disabled={!customHobby.trim() || r.hobbies.includes(customHobby.trim())}
              className="px-4 py-2.5 text-[13px] font-semibold rounded-xl bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <Divider />

        {/* Classes */}
        <div className="space-y-3">
          <SectionLabel>Classes</SectionLabel>
          {r.classes.length > 0 && (
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {r.classes.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">{c.day} · {c.startTime}–{c.endTime}</p>
                  </div>
                  <button onClick={() => set('classes', r.classes.filter((_, idx) => idx !== i))}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2.5">
            <Input label="Class name" placeholder="e.g. Physics, Maths" value={newClass.name}
              onChange={e => { setNewClass(c => ({ ...c, name: e.target.value })); setClassError(''); }}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
                <select value={newClass.day} onChange={e => setNewClass(c => ({ ...c, day: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[14px] rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.04] dark:bg-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:border-primary-400/60"
                >
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">Start</label>
                <input type="time" value={newClass.startTime}
                  onChange={e => setNewClass(c => ({ ...c, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[14px] rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.04] dark:bg-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:border-primary-400/60"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">End</label>
                <input type="time" value={newClass.endTime}
                  onChange={e => setNewClass(c => ({ ...c, endTime: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[14px] rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.04] dark:bg-white/[0.06] text-gray-900 dark:text-white focus:outline-none focus:border-primary-400/60"
                />
              </div>
            </div>
            {classError && <p className="text-[12px] text-red-500">{classError}</p>}
            <button onClick={addClass}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold border-2 border-dashed border-black/[0.10] dark:border-white/[0.12] text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all active:scale-[0.98]"
            >
              + Add Class
            </button>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 pt-4 pb-1 bg-white dark:bg-[#011515] border-t border-black/[0.06] dark:border-white/[0.06] mt-4">
        <div className="flex gap-2.5">
          <Button onClick={() => handleSave(false)} loading={saving} className="flex-1" size="lg">
            <Save size={14} /> Save
          </Button>
          <Button onClick={() => handleSave(true)} loading={regenerating} variant="secondary" size="lg" className="flex-1">
            <RefreshCw size={14} /> Save & Regen
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── iOS Settings Row ─────────────────────────────────────

const SettingsRow = ({
  icon, iconBg, label, value, onPress, last = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) => (
  <>
    <button
      onClick={onPress}
      disabled={!onPress}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors active:bg-black/[0.06] dark:active:bg-white/[0.08] text-left disabled:cursor-default"
    >
      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <span className="flex-1 text-[15px] text-gray-900 dark:text-white tracking-tight">{label}</span>
      {value && <span className="text-[14px] text-gray-400 dark:text-gray-500 tracking-tight shrink-0">{value}</span>}
      {onPress && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={2.5} />}
    </button>
    {!last && <div className="border-t border-black/[0.06] dark:border-white/[0.06] ml-[56px]" />}
  </>
);

// ── Page ─────────────────────────────────────────────────

export const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const ob = user?.onboarding;

  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [routineModal, setRoutineModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const initialRoutine: RoutineForm = {
    sleepTime:            ob?.sleepTime            || '22:00',
    wakeTime:             ob?.wakeTime             || '06:30',
    sleepHours:           ob?.sleepHours           ?? 8,
    chronotype:           ob?.chronotype           || 'morning',
    studyGoalHours:       ob?.studyGoalHours       ?? 4,
    studyStyle:           ob?.studyStyle           || 'medium',
    screenTimeLimitHours: ob?.screenTimeLimitHours ?? 2,
    exerciseEnabled:      ob?.exerciseEnabled      ?? false,
    exerciseTime:         ob?.exerciseTime         || 'morning',
    exerciseDuration:     ob?.exerciseDuration     ?? 30,
    workEnabled:          ob?.workEnabled          ?? false,
    workDays:             ob?.workDays             || [],
    workStartTime:        ob?.workStartTime        || '09:00',
    workEndTime:          ob?.workEndTime          || '17:00',
    hobbies:              ob?.hobbies              || [],
    classes:              ob?.classes              || [],
  };

  const handleSaveName = async () => {
    setNameSaving(true); setError(''); setSuccessMsg('');
    try {
      const res = await userApi.updateSettings({ name });
      if (user) updateUser({ ...user, name: res.data.user.name, onboarding: res.data.user.onboarding });
      setSuccessMsg('Name updated!');
    } catch { setError('Failed to save name.'); }
    finally { setNameSaving(false); }
  };

  const handleSaveRoutine = async (data: RoutineForm, regenerate: boolean) => {
    setError(''); setSuccessMsg('');
    try {
      const res = await userApi.updateSettings(data);
      if (user) updateUser({ ...user, onboarding: res.data.user.onboarding });
      if (regenerate) {
        const ttRes = await timetableApi.generate();
        storage.setTimetable(ttRes.data.timetable);
        setSuccessMsg('Routine saved and timetable regenerated!');
      } else {
        setSuccessMsg('Routine saved!');
      }
      setRoutineModal(false);
    } catch { setError('Failed to save routine.'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      logout();
      navigate('/login');
    } catch {
      setError('Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <Layout>
      {/* Inline header — consistent with all other pages */}
      <div className="mb-6 animate-slide-up">
        <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.10em] mb-1">
          Account
        </p>
        <h1 className="text-[28px] md:text-[32px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
          Settings
        </h1>
      </div>

      <div className="max-w-xl space-y-8">

        {/* Profile hero card */}
        <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.07] dark:border-white/[0.11] shadow-card overflow-hidden">
          <div className="flex items-center gap-4 p-5">
            <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-[20px] font-bold shrink-0 shadow-soft">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[17px] text-gray-900 dark:text-white tracking-tight truncate">{user?.name}</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
            </div>
            <button onClick={logout}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-90"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>

          {/* Name edit */}
          <div className="border-t border-black/[0.08] dark:border-white/[0.10] px-5 py-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.08em] mb-3">Display Name</p>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <Button size="sm" onClick={handleSaveName} loading={nameSaving} className="mt-0 self-end mb-[1px]">
                <Save size={13} /> Save
              </Button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.05] dark:border-white/[0.11] shadow-card overflow-hidden">
            <SettingsRow
              icon={<BookOpen size={16} className="text-white" />}
              iconBg="bg-primary-700"
              label="Routine"
              value="Edit"
              onPress={() => setRoutineModal(true)}
            />
            {/* Dark mode row: onPress on the row itself so the whole row is the
                click target. The value is a purely visual toggle (no onClick) —
                a nested <button> inside SettingsRow's outer <button> is invalid
                HTML and browsers auto-close the outer button, breaking the handler. */}
            <SettingsRow
              icon={theme === 'dark' ? <Sun size={16} className="text-white" /> : <Moon size={16} className="text-white" />}
              iconBg={theme === 'dark' ? 'bg-amber-500' : 'bg-indigo-500'}
              label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              onPress={toggleTheme}
              value={
                <div
                  aria-hidden="true"
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-[#34C759]' : 'bg-black/[0.18] dark:bg-white/[0.20]'
                  }`}
                >
                  <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-card transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              }
              last
            />
          </div>
        </div>

        {/* Feedback */}
        {successMsg && (
          <div className="px-4 py-3 bg-green-50 dark:bg-green-900/25 text-green-800 dark:text-green-300 text-[14px] rounded-2xl font-medium tracking-tight border border-green-200 dark:border-green-800">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-[14px] rounded-2xl tracking-tight border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Danger */}
        <div>
          <SectionLabel>Danger Zone</SectionLabel>
          <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.05] dark:border-white/[0.11] shadow-card overflow-hidden">
            <button onClick={() => setDeleteModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors active:bg-red-50 text-left"
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 bg-red-500">
                <Trash2 size={15} className="text-white" />
              </div>
              <span className="flex-1 text-[15px] text-red-500 tracking-tight">Delete Account</span>
              <ChevronRight size={14} className="text-red-300 shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="pb-4" />
      </div>

      <Modal isOpen={routineModal} onClose={() => setRoutineModal(false)} title="Edit Routine">
        <RoutineEditor initial={initialRoutine} onSave={handleSaveRoutine} />
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <div className="flex flex-col items-center text-center gap-4 pt-2 pb-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">Are you sure?</p>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1.5 tracking-tight leading-relaxed">
              This permanently deletes your account, timetable, and all session data. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="w-full" size="lg">
            Delete Everything
          </Button>
          <Button variant="secondary" onClick={() => setDeleteModal(false)} className="w-full" size="lg">
            Cancel
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
