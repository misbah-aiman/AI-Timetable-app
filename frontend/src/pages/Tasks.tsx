import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, Sparkles, AlertCircle, Calendar, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { tasksApi, timetableApi } from '../services/api';
import { Task } from '../types';
import { storage } from '../utils/localStorage';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

// ─── Helpers ─────────────────────────────────────────────

const daysDiff = (iso: string) => {
  const due = new Date(iso); due.setHours(0, 0, 0, 0);
  const today = new Date();  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
};

const formatDue = (iso: string) => {
  const d = daysDiff(iso);
  if (d < 0)  return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d <= 6)  return `In ${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PRIORITY_CONFIG = {
  high:   { label: 'High', color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/20',     dot: 'bg-red-500' },
  medium: { label: 'Med',  color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
  low:    { label: 'Low',  color: 'text-gray-400',   bg: 'bg-black/[0.05] dark:bg-white/[0.07]', dot: 'bg-gray-300' },
};

// ─── Task Card ────────────────────────────────────────────

const TaskCard = ({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) => {
  const d = daysDiff(task.dueDate);
  const isOverdue = d < 0 && task.status === 'pending';
  const isDone    = task.status === 'done';
  const p = PRIORITY_CONFIG[task.priority];

  return (
    <div className={`
      flex items-center gap-3.5 px-4 py-3.5 transition-all duration-200
      ${isDone ? 'opacity-40' : ''}
    `}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
          isDone
            ? 'bg-primary-500 border-primary-500'
            : 'border-black/[0.18] dark:border-white/[0.20] hover:border-primary-500'
        }`}
      >
        {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold tracking-tight truncate ${
          isDone ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'
        }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {task.subject && (
            <span className="text-[12px] text-gray-400 font-medium tracking-tight">{task.subject}</span>
          )}
          <span className={`text-[12px] font-medium flex items-center gap-1 tracking-tight ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            <Calendar size={10} />
            {formatDue(task.dueDate)}
          </span>
          <span className="text-[12px] text-gray-400 flex items-center gap-1 tracking-tight">
            <Clock size={10} />
            {task.estimatedHours}h
          </span>
        </div>
      </div>

      {/* Priority + Delete */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>
          {p.label}
        </span>
        <button onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-90"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Task Group ───────────────────────────────────────────

const TaskGroup = ({
  label, tasks, onToggle, onDelete, accentColor, collapsible,
}: {
  label: string; tasks: Task[];
  onToggle: (id: string) => void; onDelete: (id: string) => void;
  accentColor?: string; collapsible?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  if (tasks.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-2 mb-1 w-full text-left px-1 py-1"
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${accentColor || 'text-gray-400'}`}>
          {label}
        </span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
          accentColor ? 'bg-red-50 dark:bg-red-900/20 text-red-400' : 'bg-black/[0.05] dark:bg-white/[0.07] text-gray-400'
        }`}>
          {tasks.length}
        </span>
        {collapsible && (
          <span className="ml-auto text-gray-300 dark:text-gray-600">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </button>

      {open && (
        <div className="bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.05] dark:border-white/[0.06] shadow-card overflow-hidden divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {tasks.map(t => (
            <TaskCard key={t._id} task={t} onToggle={() => onToggle(t._id)} onDelete={() => onDelete(t._id)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Add Task Form ────────────────────────────────────────

const INITIAL_FORM = {
  title: '', subject: '', dueDate: '',
  estimatedHours: '2', priority: 'medium' as Task['priority'],
};

const AddTaskForm = ({ onAdd, onClose }: { onAdd: (task: Task) => void; onClose: () => void }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof INITIAL_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required'); return; }
    if (!form.dueDate)       { setError('Due date is required');   return; }
    const hrs = Number(form.estimatedHours);
    if (!hrs || hrs < 0.5 || hrs > 24) { setError('Estimated hours must be between 0.5 and 24'); return; }
    setError(''); setLoading(true);
    try {
      const res = await tasksApi.create({
        title: form.title.trim(), subject: form.subject.trim(),
        dueDate: form.dueDate, estimatedHours: hrs, priority: form.priority,
      });
      onAdd(res.data.task);
      onClose();
    } catch { setError('Failed to add task. Please try again.'); }
    finally  { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Task title" placeholder="e.g. Math Assignment" value={form.title}
        onChange={e => set('title', e.target.value)} autoFocus />
      <Input label="Subject (optional)" placeholder="e.g. Mathematics" value={form.subject}
        onChange={e => set('subject', e.target.value)} />
      <Input label="Due date" type="date" min={new Date().toISOString().split('T')[0]}
        value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />

      <div>
        <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-tight">
          Estimated hours
        </label>
        <div className="flex gap-2">
          {['1', '2', '3', '4', '6', '8'].map(h => (
            <button key={h} type="button" onClick={() => set('estimatedHours', h)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95 ${
                form.estimatedHours === h
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-black/[0.05] dark:bg-white/[0.07] text-gray-600 dark:text-gray-300'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-tight">
          Priority
        </label>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as Task['priority'][]).map(p => {
            const cfg = PRIORITY_CONFIG[p];
            const active = form.priority === p;
            return (
              <button key={p} type="button" onClick={() => set('priority', p)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all capitalize active:scale-95 ${
                  active ? `${cfg.bg} ${cfg.color}` : 'bg-black/[0.05] dark:bg-white/[0.07] text-gray-400'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-[13px] text-red-500">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Add Task
      </Button>
    </form>
  );
};

// ─── Page ─────────────────────────────────────────────────

export const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  useEffect(() => {
    tasksApi.getAll()
      .then(res => setTasks(res.data.tasks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
    try { await tasksApi.update(id, { status: newStatus }); }
    catch { setTasks(prev => prev.map(t => t._id === id ? { ...t, status: task.status } : t)); }
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    try { await tasksApi.delete(id); }
    catch { tasksApi.getAll().then(res => setTasks(res.data.tasks)).catch(() => {}); }
  };

  const handleSchedule = async () => {
    setScheduling(true); setScheduleMsg('');
    try {
      const res = await timetableApi.generate();
      storage.setTimetable(res.data.timetable);
      setScheduleMsg('Timetable updated! Tasks scheduled.');
    } catch { setScheduleMsg('Failed to generate. Check your OpenAI key.'); }
    finally  { setScheduling(false); }
  };

  const pending  = tasks.filter(t => t.status === 'pending');
  const done     = tasks.filter(t => t.status === 'done');
  const overdue  = pending.filter(t => daysDiff(t.dueDate) < 0);
  const today    = pending.filter(t => daysDiff(t.dueDate) === 0);
  const thisWeek = pending.filter(t => { const d = daysDiff(t.dueDate); return d > 0 && d <= 6; });
  const later    = pending.filter(t => daysDiff(t.dueDate) > 6);

  return (
    <Layout>
      <PageHeader
        eyebrow="Manage"
        title="Tasks"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add
          </Button>
        }
      />

      {/* AI Schedule banner */}
      {pending.length > 0 && (
        <div className="mb-5 bg-white dark:bg-[#021a1a] rounded-3xl border border-black/[0.05] dark:border-white/[0.06] shadow-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
                {pending.length} pending {pending.length === 1 ? 'task' : 'tasks'}
              </p>
              <p className="text-[13px] text-gray-400 mt-0.5 tracking-tight">
                Regenerate timetable to schedule them
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleSchedule} loading={scheduling}>
              <Sparkles size={13} /> Schedule
            </Button>
          </div>
          {scheduleMsg && (
            <p className={`text-[13px] mt-3 font-medium tracking-tight ${scheduleMsg.startsWith('Timetable') ? 'text-[#34C759]' : 'text-red-500'}`}>
              {scheduleMsg}{' '}
              {scheduleMsg.startsWith('Timetable') && (
                <button onClick={() => navigate('/dashboard')} className="underline">View</button>
              )}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="relative w-9 h-9">
            <div className="w-9 h-9 rounded-full border-[3px] border-black/[0.06] dark:border-white/[0.08]" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary-500 dark:border-t-primary-400 animate-spin" />
          </div>
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          <TaskGroup label="Overdue"    tasks={overdue}   onToggle={handleToggle} onDelete={handleDelete} accentColor="text-red-500" />
          <TaskGroup label="Today"      tasks={today}     onToggle={handleToggle} onDelete={handleDelete} accentColor="text-primary-700" />
          <TaskGroup label="This Week"  tasks={thisWeek}  onToggle={handleToggle} onDelete={handleDelete} />
          <TaskGroup label="Later"      tasks={later}     onToggle={handleToggle} onDelete={handleDelete} />
          <TaskGroup label="Completed"  tasks={done}      onToggle={handleToggle} onDelete={handleDelete} collapsible />

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Check size={28} className="text-primary-600" />
              </div>
              <p className="text-[15px] text-gray-400 dark:text-gray-500 text-center tracking-tight">
                No tasks yet — add one to get started
              </p>
              <Button onClick={() => setShowAdd(true)} size="lg">
                <Plus size={15} /> Add Task
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showAdd} title="New Task" onClose={() => setShowAdd(false)}>
        <AddTaskForm onAdd={t => setTasks(prev => [...prev, t])} onClose={() => setShowAdd(false)} />
      </Modal>
    </Layout>
  );
};
