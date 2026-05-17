import { useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Upload, X, ImageIcon, ScanLine, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { userApi, timetableApi } from '../../services/api';
import { storage } from '../../utils/localStorage';
import { ClassEntry } from '../../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOBBY_OPTIONS = ['Reading', 'Gaming', 'Music', 'Sports', 'Cooking', 'Art', 'Gym', 'Meditation', 'Walking', 'Coding'];

const initialState = {
  sleepTime: '22:00',
  wakeTime: '06:30',
  sleepHours: 8,
  studyGoalHours: 4,
  subjects: [] as string[],
  subjectInput: '',
  hobbies: [] as string[],
  screenTimeLimitHours: 2,
  classes: [] as ClassEntry[],
  newClass: { name: '', day: 'Monday', startTime: '09:00', endTime: '10:00' } as ClassEntry,
};

type Step = 'sleep' | 'study' | 'hobbies' | 'screen' | 'classes' | 'generating';
type ScanState = 'idle' | 'scanning' | 'done' | 'error';

export const OnboardingWizard = () => {
  const [step, setStep] = useState<Step>('sleep');
  const [data, setData] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Image scan state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState('');
  const [scanCount, setScanCount] = useState(0);   // how many classes were extracted
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ['sleep', 'study', 'hobbies', 'screen', 'classes'];
  const stepIndex = steps.indexOf(step);
  const progress = step === 'generating' ? 100 : ((stepIndex + 1) / steps.length) * 100;

  const update = (field: string, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const addSubject = () => {
    const s = data.subjectInput.trim();
    if (s && !data.subjects.includes(s)) {
      update('subjects', [...data.subjects, s]);
      update('subjectInput', '');
    }
  };

  const removeSubject = (s: string) => update('subjects', data.subjects.filter(x => x !== s));

  const toggleHobby = (h: string) =>
    update('hobbies', data.hobbies.includes(h) ? data.hobbies.filter(x => x !== h) : [...data.hobbies, h]);

  const addClass = () => {
    if (!data.newClass.name.trim()) return;
    update('classes', [...data.classes, { ...data.newClass }]);
    update('newClass', { name: '', day: 'Monday', startTime: '09:00', endTime: '10:00' });
  };

  const removeClass = (i: number) =>
    update('classes', data.classes.filter((_, idx) => idx !== i));

  // ── Image upload helpers ──────────────────────────────────
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setScanError('Image must be under 8 MB.');
      return;
    }
    setScanError('');
    setScanState('idle');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setScanState('idle');
    setScanError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setScanState('scanning');
    setScanError('');
    try {
      const res = await timetableApi.scanImage(imageFile);
      const extracted: ClassEntry[] = res.data.classes || [];

      if (extracted.length === 0) {
        setScanError('No classes found in the image. Try a clearer photo or add manually.');
        setScanState('error');
        return;
      }

      // Merge with existing classes (avoid exact duplicates)
      const existing = data.classes;
      const merged = [...existing];
      let added = 0;
      for (const cls of extracted) {
        const isDup = existing.some(
          e => e.name === cls.name && e.day === cls.day && e.startTime === cls.startTime
        );
        if (!isDup) { merged.push(cls); added++; }
      }

      update('classes', merged);
      setScanCount(added);
      setScanState('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to scan image.';
      setScanError(msg);
      setScanState('error');
    }
  };

  // ── Navigation ───────────────────────────────────────────
  const next = () => {
    const order: Step[] = ['sleep', 'study', 'hobbies', 'screen', 'classes'];
    const idx = order.indexOf(step as Step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const back = () => {
    const order: Step[] = ['sleep', 'study', 'hobbies', 'screen', 'classes'];
    const idx = order.indexOf(step as Step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const handleFinish = async () => {
    setStep('generating');
    setLoading(true);
    setError('');
    try {
      const payload = {
        sleepTime: data.sleepTime,
        wakeTime: data.wakeTime,
        sleepHours: data.sleepHours,
        studyGoalHours: data.studyGoalHours,
        subjects: data.subjects,
        hobbies: data.hobbies,
        screenTimeLimitHours: data.screenTimeLimitHours,
        classes: data.classes,
      };
      await userApi.saveOnboarding(payload);
      const res = await timetableApi.generate();
      storage.setTimetable(res.data.timetable);
      storage.removeOnboardingDraft();
      // Full page replace: AuthProvider re-fetches the user from the server on mount,
      // which returns onboardingCompleted:true (saved above), so OnboardedRoute lets
      // the dashboard render without any React state timing issues.
      window.location.replace('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Something went wrong');

      if (status === 401) {
        storage.clearAll();
        window.location.replace('/login?reason=session_expired');
        return;
      }

      setError(msg);
      setStep('classes');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Record<Step, string> = {
    sleep: 'Sleep Schedule', study: 'Study Goals', hobbies: 'Hobbies',
    screen: 'Screen Time', classes: 'Classes & Schedule', generating: 'Generating...',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set Up Your Routine</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Step {Math.min(stepIndex + 1, 5)} of 5 — {stepLabels[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 bg-gray-200 dark:bg-gray-800 rounded-full h-2">
          <div
            className="h-2 bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card>
          {/* ── Step: Sleep ───────────────────────────────── */}
          {step === 'sleep' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">When do you sleep?</h2>
              <Input label="Bedtime" type="time" value={data.sleepTime}
                onChange={e => update('sleepTime', e.target.value)} />
              <Input label="Wake-up Time" type="time" value={data.wakeTime}
                onChange={e => update('wakeTime', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target sleep hours: <span className="text-primary-600 font-bold">{data.sleepHours}h</span>
                </label>
                <input type="range" min={4} max={12} value={data.sleepHours}
                  onChange={e => update('sleepHours', Number(e.target.value))}
                  className="w-full accent-primary-600" />
              </div>
            </div>
          )}

          {/* ── Step: Study ───────────────────────────────── */}
          {step === 'study' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Study goals</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily study goal: <span className="text-primary-600 font-bold">{data.studyGoalHours}h</span>
                </label>
                <input type="range" min={1} max={12} value={data.studyGoalHours}
                  onChange={e => update('studyGoalHours', Number(e.target.value))}
                  className="w-full accent-primary-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects to study</label>
                <div className="flex gap-2">
                  <input value={data.subjectInput}
                    onChange={e => update('subjectInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubject()}
                    placeholder="e.g. Mathematics"
                    className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button onClick={addSubject} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.subjects.map(s => (
                    <span key={s} className="flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                      {s}
                      <button onClick={() => removeSubject(s)} className="hover:text-red-500 ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Hobbies ─────────────────────────────── */}
          {step === 'hobbies' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">What are your hobbies?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Select all that apply — we'll schedule time for them.</p>
              <div className="grid grid-cols-2 gap-2">
                {HOBBY_OPTIONS.map(h => (
                  <button key={h} onClick={() => toggleHobby(h)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      data.hobbies.includes(h)
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                    }`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Screen time ─────────────────────────── */}
          {step === 'screen' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Screen time limit</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">How many hours of social media / scrolling per day is acceptable?</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limit: <span className="text-primary-600 font-bold">{data.screenTimeLimitHours}h / day</span>
                </label>
                <input type="range" min={0} max={8} value={data.screenTimeLimitHours}
                  onChange={e => update('screenTimeLimitHours', Number(e.target.value))}
                  className="w-full accent-primary-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0h (none)</span><span>8h</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Classes (with image scan) ───────────── */}
          {step === 'classes' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Classes & Schedule</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload a photo of your timetable and AI will extract your classes automatically.
                </p>
              </div>

              {/* ── Image upload zone ──────────────────────── */}
              {!imagePreview ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 p-6
                    rounded-xl border-2 border-dashed cursor-pointer transition-all
                    ${dragOver
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <ImageIcon size={24} className="text-primary-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drop your timetable photo here
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">or click to browse · JPG, PNG, WEBP · max 8 MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </div>
              ) : (
                /* ── Image preview + scan controls ──────────── */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <img
                      src={imagePreview}
                      alt="Schedule preview"
                      className="w-full max-h-52 object-contain"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Scan button / status */}
                  {scanState === 'idle' && (
                    <Button onClick={handleScan} className="w-full">
                      <ScanLine size={16} /> Scan with AI
                    </Button>
                  )}

                  {scanState === 'scanning' && (
                    <div className="flex items-center justify-center gap-3 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                      <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                      <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                        AI is reading your schedule...
                      </span>
                    </div>
                  )}

                  {scanState === 'done' && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <CheckCircle size={18} className="text-green-500 shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        {scanCount} class{scanCount !== 1 ? 'es' : ''} extracted and added below
                      </span>
                      <button
                        onClick={() => { clearImage(); setScanState('idle'); }}
                        className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Scan another
                      </button>
                    </div>
                  )}

                  {scanState === 'error' && (
                    <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
                      <button onClick={handleScan} className="text-xs text-primary-600 underline mt-1">Try again</button>
                    </div>
                  )}
                </div>
              )}

              {scanError && scanState !== 'error' && (
                <p className="text-xs text-red-500">{scanError}</p>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">or add manually</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Manual add form */}
              <div className="space-y-2">
                <Input
                  placeholder="Class name (e.g. Physics)"
                  value={data.newClass.name}
                  onChange={e => update('newClass', { ...data.newClass, name: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={data.newClass.day}
                    onChange={e => update('newClass', { ...data.newClass, day: e.target.value })}
                    className="px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <input type="time" value={data.newClass.startTime}
                    onChange={e => update('newClass', { ...data.newClass, startTime: e.target.value })}
                    className="px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input type="time" value={data.newClass.endTime}
                    onChange={e => update('newClass', { ...data.newClass, endTime: e.target.value })}
                    className="px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button onClick={addClass} variant="secondary" size="sm">
                  <Upload size={14} /> Add Class
                </Button>
              </div>

              {/* Classes list */}
              {data.classes.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {data.classes.length} class{data.classes.length !== 1 ? 'es' : ''} added
                  </p>
                  {data.classes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm group">
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{c.name}</span>
                      <span className="text-gray-400 text-xs mx-2 shrink-0">{c.day} · {c.startTime}–{c.endTime}</span>
                      <button
                        onClick={() => removeClass(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Generating step ───────────────────────────── */}
          {step === 'generating' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-primary-600" />
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium text-center">
                AI is building your personalized timetable...
              </p>
              <p className="text-sm text-gray-400 text-center">
                {data.classes.length > 0
                  ? `Scheduling around ${data.classes.length} class${data.classes.length !== 1 ? 'es' : ''} you added`
                  : 'This may take a moment'}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Navigation */}
          {step !== 'generating' && (
            <div className="flex justify-between mt-8">
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
      </div>
    </div>
  );
};
