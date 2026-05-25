import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Trash2, LogOut, ChevronRight,
  Save, RefreshCw, X, CheckCircle,
  Dumbbell, Briefcase,
} from 'lucide-react';
import { userApi, timetableApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/localStorage';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ClassEntry } from '../types';

// ── Constants ────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HOBBY_OPTIONS = [
  'Reading', 'Gaming', 'Music', 'Sports',
  'Cooking', 'Art', 'Gym', 'Meditation', 'Walking', 'Coding',
];

// ── Local sub-components ─────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
);

const Divider = () => (
  <div className="border-t border-surface-100 dark:border-primary-900/20" />
);

const OptionPill = ({
  selected, onClick, label,
}: { selected: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
      selected
        ? 'bg-primary-500 text-white shadow-soft'
        : 'bg-surface-100 dark:bg-[#261f15] text-gray-500 hover:bg-surface-200 dark:hover:bg-primary-900/20'
    }`}
  >
    {label}
  </button>
);

const Toggle = ({
  value, onChange,
}: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex gap-3">
    {([true, false] as const).map(v => (
      <button
        key={String(v)}
        onClick={() => onChange(v)}
        className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
          value === v
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-200'
        }`}
      >
        {v ? 'Yes' : 'No'}
      </button>
    ))}
  </div>
);

// ── Routine state type ───────────────────────────────────

interface RoutineForm {
  sleepTime: string;
  wakeTime: string;
  sleepHours: number;
  chronotype: string;
  studyGoalHours: number;
  studyStyle: string;
  screenTimeLimitHours: number;
  exerciseEnabled: boolean;
  exerciseTime: string;
  exerciseDuration: number;
  workEnabled: boolean;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
  hobbies: string[];
  classes: ClassEntry[];
}

// ── Routine Editor Modal ─────────────────────────────────

const RoutineEditor = ({
  initial,
  onSave,
}: {
  initial: RoutineForm;
  onSave: (data: RoutineForm, regenerate: boolean) => Promise<void>;
}) => {
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
    setSaving(false);
    setRegenerating(false);
  };

  return (
    <div className="overflow-y-auto max-h-[72vh] -mx-1 px-1">
      <div className="space-y-6 pb-2">

        {/* Sleep */}
        <div className="space-y-4">
          <SectionLabel>Sleep</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bedtime" type="time" value={r.sleepTime} onChange={e => set('sleepTime', e.target.value)} />
            <Input label="Wake-up" type="time" value={r.wakeTime} onChange={e => set('wakeTime', e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sleep goal</span>
              <span className="text-sm font-bold text-primary-500">{r.sleepHours}h</span>
            </div>
            <input type="range" min={4} max={12} value={r.sleepHours}
              onChange={e => set('sleepHours', Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>
        </div>

        <Divider />

        {/* Peak Hours */}
        <div className="space-y-3">
          <SectionLabel>Peak Focus Hours</SectionLabel>
          <div className="flex gap-2">
            <OptionPill selected={r.chronotype === 'morning'} onClick={() => set('chronotype', 'morning')} label="Morning" />
            <OptionPill selected={r.chronotype === 'afternoon'} onClick={() => set('chronotype', 'afternoon')} label="Afternoon" />
            <OptionPill selected={r.chronotype === 'evening'} onClick={() => set('chronotype', 'evening')} label="Evening" />
          </div>
        </div>

        <Divider />

        {/* Study */}
        <div className="space-y-4">
          <SectionLabel>Study</SectionLabel>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-600 dark:text-gray-300">Daily goal</span>
              <span className="text-sm font-bold text-primary-500">{r.studyGoalHours}h</span>
            </div>
            <input type="range" min={1} max={12} value={r.studyGoalHours}
              onChange={e => set('studyGoalHours', Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Study style</p>
            <div className="flex gap-2">
              <OptionPill selected={r.studyStyle === 'pomodoro'} onClick={() => set('studyStyle', 'pomodoro')} label="Pomodoro" />
              <OptionPill selected={r.studyStyle === 'medium'} onClick={() => set('studyStyle', 'medium')} label="Medium" />
              <OptionPill selected={r.studyStyle === 'long'} onClick={() => set('studyStyle', 'long')} label="Deep work" />
            </div>
          </div>
        </div>

        <Divider />

        {/* Screen Time */}
        <div className="space-y-3">
          <SectionLabel>Screen Time Limit</SectionLabel>
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-600 dark:text-gray-300">Daily limit</span>
              <span className="text-sm font-bold text-orange-500">
                {r.screenTimeLimitHours === 0 ? 'No limit' : `${r.screenTimeLimitHours}h`}
              </span>
            </div>
            <input type="range" min={0} max={8} value={r.screenTimeLimitHours}
              onChange={e => set('screenTimeLimitHours', Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        <Divider />

        {/* Exercise */}
        <div className="space-y-3">
          <SectionLabel>Exercise</SectionLabel>
          <Toggle value={r.exerciseEnabled} onChange={v => set('exerciseEnabled', v)} />
          {r.exerciseEnabled && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">When</p>
                <div className="flex gap-2">
                  <OptionPill selected={r.exerciseTime === 'morning'} onClick={() => set('exerciseTime', 'morning')} label="Morning" />
                  <OptionPill selected={r.exerciseTime === 'evening'} onClick={() => set('exerciseTime', 'evening')} label="Evening" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Duration</p>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map(m => (
                    <OptionPill key={m} selected={r.exerciseDuration === m} onClick={() => set('exerciseDuration', m)} label={`${m}m`} />
                  ))}
                </div>
              </div>
            </>
          )}
          {!r.exerciseEnabled && (
            <div className="flex items-center gap-2.5 p-3 bg-surface-100 dark:bg-[#261f15] rounded-2xl">
              <Dumbbell size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
              <p className="text-xs text-gray-400">No exercise blocks will be scheduled.</p>
            </div>
          )}
        </div>

        <Divider />

        {/* Work */}
        <div className="space-y-3">
          <SectionLabel>Work Schedule</SectionLabel>
          <Toggle value={r.workEnabled} onChange={v => { set('workEnabled', v); setWorkError(''); }} />
          {r.workEnabled && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Work days</p>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => { toggleWorkDay(d); setWorkError(''); }}
                      className={`py-2 rounded-2xl text-xs font-semibold transition-all ${
                        r.workDays.includes(d)
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-surface-100 dark:bg-[#261f15] text-gray-500 hover:bg-surface-200 dark:hover:bg-primary-900/20'
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
                <Input label="End time" type="time" value={r.workEndTime}
                  onChange={e => { set('workEndTime', e.target.value); setWorkError(''); }} />
              </div>
              {workError && <p className="text-xs text-red-500">{workError}</p>}
            </>
          )}
          {!r.workEnabled && (
            <div className="flex items-center gap-2.5 p-3 bg-surface-100 dark:bg-[#261f15] rounded-2xl">
              <Briefcase size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
              <p className="text-xs text-gray-400">No work hours will be blocked.</p>
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium border-2 transition-all ${
                    sel
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-200 dark:hover:border-primary-800'
                  }`}
                >
                  {h}
                  {sel && <CheckCircle size={13} className="text-primary-500 shrink-0" />}
                </button>
              );
            })}
          </div>
          {r.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {r.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).map(h => (
                <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-2xl">
                  {h}
                  <button onClick={() => toggleHobby(h)} className="text-primary-400 hover:text-red-500 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a hobby..."
              value={customHobby}
              onChange={e => setCustomHobby(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHobby(); } }}
              className="flex-1 px-3 py-2 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
            <button
              onClick={addHobby}
              disabled={!customHobby.trim() || r.hobbies.includes(customHobby.trim())}
              className="px-4 py-2 text-sm font-semibold rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-40"
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
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {r.classes.map((c, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-surface-100 dark:bg-[#16141f] rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.day} · {c.startTime}–{c.endTime}</p>
                  </div>
                  <button
                    onClick={() => set('classes', r.classes.filter((_, idx) => idx !== i))}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Add class form */}
          <div className="space-y-2.5 pt-1">
            <Input label="Class name" placeholder="e.g. Physics, Maths" value={newClass.name}
              onChange={e => { setNewClass(c => ({ ...c, name: e.target.value })); setClassError(''); }}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
                <select value={newClass.day} onChange={e => setNewClass(c => ({ ...c, day: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Start</label>
                <input type="time" value={newClass.startTime}
                  onChange={e => setNewClass(c => ({ ...c, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">End</label>
                <input type="time" value={newClass.endTime}
                  onChange={e => setNewClass(c => ({ ...c, endTime: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
            {classError && <p className="text-xs text-red-500">{classError}</p>}
            <button
              onClick={addClass}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all"
            >
              + Add Class
            </button>
          </div>
        </div>

      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 pt-4 pb-1 bg-white dark:bg-[#1e2030] border-t border-surface-100 dark:border-primary-900/20 mt-4 -mx-1 px-1">
        <div className="flex gap-2.5">
          <Button onClick={() => handleSave(false)} loading={saving} className="flex-1" size="lg">
            <Save size={15} /> Save
          </Button>
          <Button onClick={() => handleSave(true)} loading={regenerating} variant="secondary" size="lg" className="flex-1">
            <RefreshCw size={15} /> Save & Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
};

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
    } catch {
      setError('Failed to save name.');
    } finally {
      setNameSaving(false);
    }
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
    } catch {
      setError('Failed to save routine.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      logout();
      navigate('/signup');
    } catch {
      setError('Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <PageHeader eyebrow="Account" title="Settings" />

      <div className="max-w-2xl space-y-4">

        {/* Profile hero */}
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-soft">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button onClick={logout}
            className="p-2.5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </Card>

        {/* Profile name */}
        <Card>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Profile</h2>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <Input label="Display Name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="pt-6">
              <Button size="sm" onClick={handleSaveName} loading={nameSaving}>
                <Save size={14} /> Save
              </Button>
            </div>
          </div>
        </Card>

        {/* Routine — single clickable row */}
        <Card>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Routine</h2>
          <button
            onClick={() => setRoutineModal(true)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface-100 dark:bg-[#261f15] hover:bg-surface-200 dark:hover:bg-primary-900/20 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Edit Routine</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 shrink-0" />
          </button>
        </Card>

        {/* Appearance */}
        <Card>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Sun size={17} className="text-yellow-400" /> : <Moon size={17} className="text-primary-400" />}
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                theme === 'dark' ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </Card>

        {/* Feedback */}
        {successMsg && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-3xl font-medium">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-3xl">
            {error}
          </div>
        )}

        {/* Danger zone */}
        <div className="pt-2">
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={15} /> Delete account
          </button>
        </div>
      </div>

      {/* Routine editor modal */}
      <Modal isOpen={routineModal} onClose={() => setRoutineModal(false)} title="Edit Routine">
        <RoutineEditor
          initial={initialRoutine}
          onSave={handleSaveRoutine}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          This will permanently delete your account, timetable, and all session data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Delete Everything</Button>
        </div>
      </Modal>
    </Layout>
  );
};
