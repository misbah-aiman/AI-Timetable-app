import { useRef, useState } from 'react';
import {
  ChevronRight, ChevronLeft, Sparkles, X, ImageIcon, ScanLine,
  CheckCircle, RefreshCw, AlertCircle, Sun, Sunset, Moon,
  Zap, BookOpen, Brain, Dumbbell, Briefcase,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { userApi, timetableApi } from '../../services/api';
import { storage } from '../../utils/localStorage';
import { ClassEntry } from '../../types';

// ── Constants ─────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HOBBY_OPTIONS = [
  'Reading', 'Gaming', 'Music', 'Sports',
  'Cooking', 'Art', 'Gym', 'Meditation', 'Walking', 'Coding',
];

const STEPS = ['sleep', 'chronotype', 'studyStyle', 'study', 'exercise', 'work', 'hobbies', 'screen', 'classes'] as const;
type MainStep = typeof STEPS[number];
type Step = MainStep | 'generating';
type ScanState = 'idle' | 'scanning' | 'done' | 'error';

const STEP_LABELS: Record<MainStep, string> = {
  sleep:       'Sleep Schedule',
  chronotype:  'Peak Hours',
  studyStyle:  'Study Style',
  study:       'Study Goal',
  exercise:    'Exercise',
  work:        'Work Schedule',
  hobbies:     'Hobbies',
  screen:      'Screen Time',
  classes:     'Classes',
};

// ── Types ─────────────────────────────────────────────────

interface FormData {
  sleepTime: string;
  wakeTime: string;
  sleepHours: number;
  studyGoalHours: number;
  hobbies: string[];
  screenTimeLimitHours: number;
  classes: ClassEntry[];
  chronotype: 'morning' | 'afternoon' | 'evening';
  studyStyle: 'pomodoro' | 'medium' | 'long';
  exerciseEnabled: boolean;
  exerciseTime: 'morning' | 'evening';
  exerciseDuration: number;
  workEnabled: boolean;
  workDays: string[];
  workStartTime: string;
  workEndTime: string;
}

const computeSleepHours = (bedtime: string, wake: string): number => {
  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const diff = toMins(wake) - toMins(bedtime);
  return (diff > 0 ? diff : 1440 + diff) / 60;
};

// ── Shared components ────────────────────────────────────

const InlineError = ({ message }: { message: string }) => (
  <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-2xl">
    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
    <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
  </div>
);

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}
const OptionCard = ({ selected, onClick, icon, label, description }: OptionCardProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
      selected
        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30'
        : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-surface-100 dark:hover:bg-primary-900/10'
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
      selected ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-500' : 'bg-surface-100 dark:bg-[#1a1410] text-gray-400'
    }`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-sm font-semibold ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-white'}`}>
        {label}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    {selected && <CheckCircle size={16} className="text-primary-500 shrink-0 ml-auto" />}
  </button>
);

// ── Initial state ─────────────────────────────────────────

const INITIAL_FORM: FormData = {
  sleepTime: '22:00',
  wakeTime: '06:30',
  sleepHours: 8,
  studyGoalHours: 4,
  hobbies: [],
  screenTimeLimitHours: 2,
  classes: [],
  chronotype: 'morning',
  studyStyle: 'medium',
  exerciseEnabled: false,
  exerciseTime: 'morning',
  exerciseDuration: 30,
  workEnabled: false,
  workDays: [],
  workStartTime: '09:00',
  workEndTime: '17:00',
};

const INITIAL_CLASS: ClassEntry = { name: '', day: 'Monday', startTime: '09:00', endTime: '10:00' };

// ── Component ─────────────────────────────────────────────

export const OnboardingWizard = () => {
  const [step, setStep]           = useState<Step>('sleep');
  const [data, setData]           = useState<FormData>(INITIAL_FORM);
  const [newClass, setNewClass]   = useState<ClassEntry>(INITIAL_CLASS);
  const [stepError, setStepError]     = useState('');
  const [classError, setClassError]   = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading]     = useState(false);
  const [customHobby, setCustomHobby] = useState('');

  // Image scan
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanState, setScanState]       = useState<ScanState>('idle');
  const [scanError, setScanError]       = useState('');
  const [scanCount, setScanCount]       = useState(0);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.indexOf(step as MainStep);
  const isMainStep = step !== 'generating';

  // ── Form helpers ─────────────────────────────────────────

  const set = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
    setStepError('');
  };

  const toggleHobby = (h: string) =>
    set('hobbies', data.hobbies.includes(h)
      ? data.hobbies.filter(x => x !== h)
      : [...data.hobbies, h]);

  const toggleWorkDay = (d: string) =>
    set('workDays', data.workDays.includes(d)
      ? data.workDays.filter(x => x !== d)
      : [...data.workDays, d]);

  // ── Step validation ───────────────────────────────────────

  const validateStep = (): boolean => {
    if (step === 'sleep') {
      if (data.sleepTime === data.wakeTime) {
        setStepError('Wake-up time and bedtime cannot be the same.');
        return false;
      }
      if (computeSleepHours(data.sleepTime, data.wakeTime) < 1) {
        setStepError('Your schedule has less than 1 hour of sleep — please adjust your times.');
        return false;
      }
    }
    if (step === 'work' && data.workEnabled) {
      if (data.workDays.length === 0) {
        setStepError('Select at least one work day.');
        return false;
      }
      if (data.workEndTime <= data.workStartTime) {
        setStepError('Work end time must be after start time.');
        return false;
      }
    }
    return true;
  };

  // ── Class form ───────────────────────────────────────────

  const validateAndAddClass = () => {
    if (!newClass.name.trim()) { setClassError('Please enter a class name.'); return; }
    if (newClass.endTime <= newClass.startTime) { setClassError('End time must be after the start time.'); return; }
    setClassError('');
    set('classes', [...data.classes, { ...newClass, name: newClass.name.trim() }]);
    setNewClass(INITIAL_CLASS);
  };

  const removeClass = (i: number) => set('classes', data.classes.filter((_, idx) => idx !== i));

  // ── Image upload ─────────────────────────────────────────

  const handleImageSelect = (file: File) => {
    setScanError('');
    if (!file.type.startsWith('image/')) { setScanError('Only image files are supported (JPG, PNG, WEBP).'); return; }
    if (file.size > 8 * 1024 * 1024) { setScanError('Image must be under 8 MB.'); return; }
    setScanState('idle');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(null); setScanState('idle'); setScanError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setScanState('scanning'); setScanError('');
    try {
      const res = await timetableApi.scanImage(imageFile);
      const extracted: ClassEntry[] = res.data.classes ?? [];
      if (extracted.length === 0) {
        setScanState('error');
        setScanError('No classes found in this image. Make sure the text is readable, or add classes manually below.');
        return;
      }
      const merged = [...data.classes];
      let added = 0;
      for (const cls of extracted) {
        const isDup = data.classes.some(e => e.name === cls.name && e.day === cls.day && e.startTime === cls.startTime);
        if (!isDup) { merged.push(cls); added++; }
      }
      set('classes', merged); setScanCount(added); setScanState('done');
    } catch (err: unknown) {
      setScanState('error');
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setScanError(apiMsg ?? 'Scan failed. Please try again or add classes manually.');
    }
  };

  // ── Navigation ───────────────────────────────────────────

  const next = () => {
    if (!validateStep()) return;
    const idx = STEPS.indexOf(step as MainStep);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    setStepError('');
    const idx = STEPS.indexOf(step as MainStep);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // ── Submission ───────────────────────────────────────────

  const handleFinish = async () => {
    setStep('generating'); setLoading(true); setGlobalError('');
    try {
      await userApi.saveOnboarding({
        sleepTime: data.sleepTime,
        wakeTime: data.wakeTime,
        sleepHours: data.sleepHours,
        studyGoalHours: data.studyGoalHours,
        hobbies: data.hobbies,
        screenTimeLimitHours: data.screenTimeLimitHours,
        classes: data.classes,
        chronotype: data.chronotype,
        studyStyle: data.studyStyle,
        exerciseEnabled: data.exerciseEnabled,
        exerciseTime: data.exerciseTime,
        exerciseDuration: data.exerciseDuration,
        workEnabled: data.workEnabled,
        workDays: data.workDays,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
      });
      const res = await timetableApi.generate();
      storage.setTimetable(res.data.timetable);
      storage.removeOnboardingDraft();
      window.location.replace('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      if (status === 401) { storage.clearAll(); window.location.replace('/login?reason=session_expired'); return; }
      setGlobalError(msg);
      setStep('classes');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#1a1410] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 rounded-2xl mb-4 shadow-soft">
            <Sparkles className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set Up Your Routine</h1>
        </div>

        {/* Step dots */}
        {isMainStep && (
          <div className="flex items-center justify-center gap-1 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`rounded-full transition-all duration-300 ${
                  i < stepIndex  ? 'w-2 h-2 bg-primary-500' :
                  i === stepIndex ? 'w-3 h-3 bg-primary-500 ring-2 ring-primary-200 dark:ring-primary-900/50' :
                  'w-2 h-2 bg-gray-200 dark:bg-gray-700'
                }`} />
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-3 transition-colors duration-300 ${i < stepIndex ? 'bg-primary-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step label */}
        {isMainStep && (
          <div className="text-center mb-4">
            <p className="text-sm font-semibold text-primary-500">{STEP_LABELS[step as MainStep]}</p>
          </div>
        )}

        <Card>

          {/* ── Sleep ───────────────────────────────────── */}
          {step === 'sleep' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">When do you sleep?</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Bedtime" type="time" value={data.sleepTime} onChange={e => set('sleepTime', e.target.value)} />
                <Input label="Wake-up time" type="time" value={data.wakeTime} onChange={e => set('wakeTime', e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sleep goal</label>
                  <span className="text-sm font-bold text-primary-500">{data.sleepHours}h</span>
                </div>
                <input type="range" min={4} max={12} value={data.sleepHours}
                  onChange={e => set('sleepHours', Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>4h</span><span>8h</span><span>12h</span>
                </div>
              </div>
              {stepError && <InlineError message={stepError} />}
            </div>
          )}

          {/* ── Chronotype ──────────────────────────────── */}
          {step === 'chronotype' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">When are you most focused?</h2>
              <OptionCard
                selected={data.chronotype === 'morning'}
                onClick={() => set('chronotype', 'morning')}
                icon={<Sun size={18} />}
                label="Morning"
                description="Peak energy from 6am–12pm — early riser"
              />
              <OptionCard
                selected={data.chronotype === 'afternoon'}
                onClick={() => set('chronotype', 'afternoon')}
                icon={<Sunset size={18} />}
                label="Afternoon"
                description="Hit your stride after noon — 12pm–6pm"
              />
              <OptionCard
                selected={data.chronotype === 'evening'}
                onClick={() => set('chronotype', 'evening')}
                icon={<Moon size={18} />}
                label="Evening / Night"
                description="Best focus after 6pm — night owl"
              />
            </div>
          )}

          {/* ── Study Style ─────────────────────────────── */}
          {step === 'studyStyle' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">How do you prefer to study?</h2>
              <OptionCard
                selected={data.studyStyle === 'pomodoro'}
                onClick={() => set('studyStyle', 'pomodoro')}
                icon={<Zap size={18} />}
                label="Pomodoro"
                description="25 min focus + 5 min break, repeat"
              />
              <OptionCard
                selected={data.studyStyle === 'medium'}
                onClick={() => set('studyStyle', 'medium')}
                icon={<BookOpen size={18} />}
                label="Medium blocks"
                description="1–1.5 hour focused sessions with breaks"
              />
              <OptionCard
                selected={data.studyStyle === 'long'}
                onClick={() => set('studyStyle', 'long')}
                icon={<Brain size={18} />}
                label="Deep work"
                description="2+ hour uninterrupted sessions"
              />
            </div>
          )}

          {/* ── Study Goal ──────────────────────────────── */}
          {step === 'study' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daily Study Goal</h2>
              <div className="flex items-center justify-center py-6 bg-surface-50 dark:bg-[#1a1410] rounded-2xl">
                <div className="text-center">
                  <p className="text-7xl font-bold text-primary-500 leading-none tabular-nums">{data.studyGoalHours}</p>
                  <p className="text-sm text-gray-400 mt-2">hours per day</p>
                </div>
              </div>
              <div>
                <input type="range" min={1} max={12} value={data.studyGoalHours}
                  onChange={e => set('studyGoalHours', Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1h</span><span>4h</span><span>8h</span><span>12h</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Exercise ────────────────────────────────── */}
          {step === 'exercise' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Do you exercise?</h2>

              {/* Toggle */}
              <div className="flex gap-3">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    onClick={() => set('exerciseEnabled', val)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                      data.exerciseEnabled === val
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-200'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>

              {data.exerciseEnabled && (
                <>
                  {/* When */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">When do you exercise?</p>
                    <div className="flex gap-3">
                      {(['morning', 'evening'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => set('exerciseTime', t)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border-2 transition-all capitalize ${
                            data.exerciseTime === t
                              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-200'
                          }`}
                        >
                          {t === 'morning' ? <Sun size={15} /> : <Moon size={15} />}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">How long?</p>
                    <div className="flex gap-2">
                      {[30, 45, 60, 90].map(mins => (
                        <button
                          key={mins}
                          onClick={() => set('exerciseDuration', mins)}
                          className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                            data.exerciseDuration === mins
                              ? 'bg-primary-500 text-white shadow-soft'
                              : 'bg-surface-100 dark:bg-[#261f15] text-gray-500 hover:bg-surface-200 dark:hover:bg-primary-900/20'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!data.exerciseEnabled && (
                <div className="flex items-center gap-3 p-4 bg-surface-100 dark:bg-[#261f15] rounded-2xl">
                  <Dumbbell size={18} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  <p className="text-sm text-gray-400">No exercise blocks will be added to your timetable.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Work ────────────────────────────────────── */}
          {step === 'work' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Do you have a job or work hours?</h2>

              {/* Toggle */}
              <div className="flex gap-3">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    onClick={() => { set('workEnabled', val); setStepError(''); }}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                      data.workEnabled === val
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-primary-200'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>

              {data.workEnabled && (
                <>
                  {/* Work days */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Which days do you work?</p>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS.map(d => (
                        <button
                          key={d}
                          onClick={() => { toggleWorkDay(d); setStepError(''); }}
                          className={`py-2 rounded-2xl text-xs font-semibold transition-all ${
                            data.workDays.includes(d)
                              ? 'bg-primary-500 text-white shadow-soft'
                              : 'bg-surface-100 dark:bg-[#261f15] text-gray-500 hover:bg-surface-200 dark:hover:bg-primary-900/20'
                          }`}
                        >
                          {d.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Work hours */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start time" type="time" value={data.workStartTime}
                      onChange={e => { set('workStartTime', e.target.value); setStepError(''); }} />
                    <Input label="End time" type="time" value={data.workEndTime}
                      onChange={e => { set('workEndTime', e.target.value); setStepError(''); }} />
                  </div>
                </>
              )}

              {!data.workEnabled && (
                <div className="flex items-center gap-3 p-4 bg-surface-100 dark:bg-[#261f15] rounded-2xl">
                  <Briefcase size={18} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  <p className="text-sm text-gray-400">No work blocks will be reserved in your timetable.</p>
                </div>
              )}

              {stepError && <InlineError message={stepError} />}
            </div>
          )}

          {/* ── Hobbies ─────────────────────────────────── */}
          {step === 'hobbies' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Hobbies</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {HOBBY_OPTIONS.map(label => {
                  const selected = data.hobbies.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleHobby(label)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium border-2 transition-all ${
                        selected
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-400 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-surface-100 dark:hover:bg-primary-900/10'
                      }`}
                    >
                      <span>{label}</span>
                      {selected && <CheckCircle size={15} className="text-primary-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {data.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.hobbies.filter(h => !HOBBY_OPTIONS.includes(h)).map(h => (
                    <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-2xl">
                      {h}
                      <button onClick={() => toggleHobby(h)} className="text-primary-400 hover:text-red-500 transition-colors" aria-label={`Remove ${h}`}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add your own hobby..."
                  value={customHobby}
                  onChange={e => setCustomHobby(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customHobby.trim();
                      if (val && !data.hobbies.includes(val)) toggleHobby(val);
                      setCustomHobby('');
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
                <button
                  onClick={() => { const val = customHobby.trim(); if (val && !data.hobbies.includes(val)) toggleHobby(val); setCustomHobby(''); }}
                  disabled={!customHobby.trim() || data.hobbies.includes(customHobby.trim())}
                  className="px-4 py-2.5 text-sm font-semibold rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              {data.hobbies.length > 0 && (
                <p className="text-xs text-center text-gray-400">{data.hobbies.length} selected</p>
              )}
            </div>
          )}

          {/* ── Screen Time ─────────────────────────────── */}
          {step === 'screen' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Screen Time Limit</h2>
              <div className="flex items-center justify-center py-6 bg-surface-50 dark:bg-[#1a1410] rounded-2xl">
                <div className="text-center">
                  <p className="text-7xl font-bold text-orange-500 leading-none tabular-nums">{data.screenTimeLimitHours}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {data.screenTimeLimitHours === 0 ? 'no daily limit set' : 'hours per day'}
                  </p>
                </div>
              </div>
              <div>
                <input type="range" min={0} max={8} value={data.screenTimeLimitHours}
                  onChange={e => set('screenTimeLimitHours', Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0h</span><span>2h</span><span>4h</span><span>6h</span><span>8h</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Classes ─────────────────────────────────── */}
          {step === 'classes' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Classes & Schedule</h2>

              {/* Image upload */}
              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all select-none ${
                    dragOver
                      ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-surface-100 dark:hover:bg-primary-900/10'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <ImageIcon size={22} className="text-primary-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drop your timetable photo here</p>
                    <p className="text-xs text-gray-400 mt-0.5">or click to browse · JPG, PNG, WEBP · max 8 MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={imagePreview} alt="Timetable preview" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-900" />
                    <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/50 hover:bg-black/70 text-white transition-colors" aria-label="Remove image">
                      <X size={14} />
                    </button>
                  </div>
                  {scanState === 'idle' && <Button onClick={handleScan} className="w-full"><ScanLine size={16} /> Scan with AI</Button>}
                  {scanState === 'scanning' && (
                    <div className="flex items-center justify-center gap-3 py-3.5 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                      <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin shrink-0" />
                      <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">AI is reading your schedule...</span>
                    </div>
                  )}
                  {scanState === 'done' && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        {scanCount} class{scanCount !== 1 ? 'es' : ''} added from your photo
                      </span>
                      <button onClick={clearImage} className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline shrink-0">Scan another</button>
                    </div>
                  )}
                  {scanState === 'error' && (
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                      <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
                      <button onClick={handleScan} className="text-xs text-primary-500 hover:underline mt-1.5 flex items-center gap-1">
                        <RefreshCw size={11} /> Try scanning again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {scanError && !imagePreview && <InlineError message={scanError} />}

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 font-medium">or add manually</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="space-y-3">
                <Input label="Class name" placeholder="e.g. Physics, Maths, History" value={newClass.name}
                  onChange={e => { setNewClass(c => ({ ...c, name: e.target.value })); setClassError(''); }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
                    <select value={newClass.day} onChange={e => setNewClass(c => ({ ...c, day: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                    >
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Start time</label>
                    <input type="time" value={newClass.startTime}
                      onChange={e => { setNewClass(c => ({ ...c, startTime: e.target.value })); setClassError(''); }}
                      className="w-full px-3 py-2.5 text-sm rounded-2xl border border-primary-100 dark:border-primary-900/30 bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">End time</label>
                    <input type="time" value={newClass.endTime}
                      onChange={e => { setNewClass(c => ({ ...c, endTime: e.target.value })); setClassError(''); }}
                      className={`w-full px-3 py-2.5 text-sm rounded-2xl border bg-surface-50 dark:bg-[#261f15] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent ${
                        newClass.endTime && newClass.endTime <= newClass.startTime
                          ? 'border-red-400 focus:ring-red-300'
                          : 'border-primary-100 dark:border-primary-900/30 focus:ring-primary-300'
                      }`}
                    />
                  </div>
                </div>
                {classError && <InlineError message={classError} />}
                <Button onClick={validateAndAddClass} variant="secondary" className="w-full">+ Add Class</Button>
              </div>

              {data.classes.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {data.classes.length} class{data.classes.length !== 1 ? 'es' : ''} added
                  </p>
                  {data.classes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-surface-100 dark:bg-[#1a1410] rounded-2xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.day} · {c.startTime}–{c.endTime}</p>
                      </div>
                      <button onClick={() => removeClass(i)} className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0" aria-label={`Remove ${c.name}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {globalError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{globalError}</p>
                  <button onClick={handleFinish} className="mt-2 text-xs text-primary-500 hover:underline flex items-center gap-1">
                    <RefreshCw size={11} /> Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Generating ──────────────────────────────── */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-12 gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900/40 border-t-primary-500 rounded-full animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-primary-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-white">Building your timetable...</p>
                <p className="text-sm text-gray-400 mt-1.5">
                  {data.classes.length > 0
                    ? `Scheduling around ${data.classes.length} class${data.classes.length !== 1 ? 'es' : ''} you added`
                    : 'This takes just a moment'}
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────── */}
          {isMainStep && (
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-surface-100 dark:border-primary-900/20">
              <Button variant="ghost" onClick={back} disabled={step === 'sleep'}>
                <ChevronLeft size={16} /> Back
              </Button>
              {step === 'classes' ? (
                <Button onClick={handleFinish} loading={loading}>
                  <Sparkles size={16} /> Generate Timetable
                </Button>
              ) : (
                <Button onClick={next}>
                  Next <ChevronRight size={16} />
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Skip link */}
        {step === 'classes' && !loading && (
          <p className="text-center text-xs text-gray-400 mt-4">
            No classes to add?{' '}
            <button onClick={handleFinish} className="text-primary-500 hover:underline font-medium">
              Skip and generate anyway
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
