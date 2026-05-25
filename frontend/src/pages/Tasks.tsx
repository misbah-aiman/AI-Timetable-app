import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check, Sparkles, AlertCircle, Calendar, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { tasksApi, timetableApi } from '../services/api';
import { Task } from '../types';
import { storage } from '../utils/localStorage';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

// ─── Helpers ─────────────────────────────────────────────

const daysDiff = (iso: string) => {
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDue = (iso: string) => {
  const d = daysDiff(iso);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d <= 6) return `Due in ${d}d`;
  return `Due ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  medium: { label: 'Med', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  low: { label: 'Low', color: 'text-gray-400', bg: 'bg-surface-100 dark:bg-[#261f15]' },
};

// ─── Task Card ────────────────────────────────────────────

const TaskCard = ({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) => {
  const d = daysDiff(task.dueDate);
  const isOverdue = d < 0 && task.status === 'pending';
  const isDone = task.status === 'done';
  const p = PRIORITY_CONFIG[task.priority];

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
      isDone ? 'opacity-50' : 'bg-white dark:bg-[#261f15]'
    } ${!isDone ? 'shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-none border border-surface-200 dark:border-primary-900/20' : ''}`}>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
          isDone
            ? 'bg-primary-500 border-primary-500'
            : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
        }`}
      >
        {isDone && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-gray-800 dark:text-white truncate ${isDone ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          {task.subject && (
            <span className="text-[11px] text-gray-400 font-medium">{task.subject}</span>
          )}
          <span className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            <Calendar size={10} />
            {formatDue(task.dueDate)}
          </span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Clock size={10} />
            {task.estimatedHours}h
          </span>
        </div>
      </div>

      {/* Priority + Delete */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>
          {p.label}
        </span>
        <button
          onClick={onDelete}
          className="p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Task Group ───────────────────────────────────────────

const TaskGroup = ({
  label,
  tasks,
  onToggle,
  onDelete,
  accent,
  collapsible,
}: {
  label: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  accent?: string;
  collapsible?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  if (tasks.length === 0) return null;

  return (
    <div className="mb-5">
      <button
        className="flex items-center gap-2 mb-2.5 w-full text-left"
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <span className={`text-xs font-bold uppercase tracking-widest ${accent || 'text-gray-400'}`}>
          {label}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${accent ? 'bg-red-50 dark:bg-red-900/20 text-red-400' : 'bg-surface-100 dark:bg-[#261f15] text-gray-400'}`}>
          {tasks.length}
        </span>
        {collapsible && (
          <span className="ml-auto text-gray-300">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-2">
          {tasks.map(t => (
            <TaskCard key={t._id} task={t} onToggle={() => onToggle(t._id)} onDelete={() => onDelete(t._id)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Add Task Modal ───────────────────────────────────────

const INITIAL_FORM = {
  title: '',
  subject: '',
  dueDate: '',
  estimatedHours: '2',
  priority: 'medium' as Task['priority'],
};

const AddTaskForm = ({
  onAdd,
  onClose,
}: {
  onAdd: (task: Task) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof INITIAL_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required'); return; }
    if (!form.dueDate) { setError('Due date is required'); return; }
    const hrs = Number(form.estimatedHours);
    if (!hrs || hrs < 0.5 || hrs > 24) { setError('Estimated hours must be between 0.5 and 24'); return; }
    setError(''); setLoading(true);
    try {
      const res = await tasksApi.create({
        title: form.title.trim(),
        subject: form.subject.trim(),
        dueDate: form.dueDate,
        estimatedHours: hrs,
        priority: form.priority,
      });
      onAdd(res.data.task);
      onClose();
    } catch {
      setError('Failed to add task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task title"
          placeholder="e.g. Math Assignment"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          autoFocus
        />
        <Input
          label="Subject (optional)"
          placeholder="e.g. Mathematics"
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
        />
        <Input
          label="Due date"
          type="date"
          min={minDate}
          value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)}
        />
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Estimated hours
          </label>
          <div className="flex gap-2">
            {['1', '2', '3', '4', '6', '8'].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => set('estimatedHours', h)}
                className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition-all ${
                  form.estimatedHours === h
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-surface-100 dark:bg-[#261f15] text-gray-500 hover:bg-surface-200 dark:hover:bg-primary-900/25'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Priority
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as Task['priority'][]).map(p => {
              const cfg = PRIORITY_CONFIG[p];
              const active = form.priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition-all capitalize ${
                    active ? `${cfg.bg} ${cfg.color}` : 'bg-surface-100 dark:bg-[#261f15] text-gray-400'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-sm text-red-500">
            <AlertCircle size={15} className="shrink-0" />
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
    try {
      await tasksApi.update(id, { status: newStatus });
    } catch {
      setTasks(prev => prev.map(t => t._id === id ? { ...t, status: task.status } : t));
    }
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    try {
      await tasksApi.delete(id);
    } catch {
      tasksApi.getAll().then(res => setTasks(res.data.tasks)).catch(() => {});
    }
  };

  const handleSchedule = async () => {
    setScheduling(true);
    setScheduleMsg('');
    try {
      const res = await timetableApi.generate();
      storage.setTimetable(res.data.timetable);
      setScheduleMsg('Timetable updated! Your tasks have been scheduled.');
    } catch {
      setScheduleMsg('Failed to generate. Check your OpenAI key in Settings.');
    } finally {
      setScheduling(false);
    }
  };

  // Group tasks
  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'done');

  const overdue = pending.filter(t => daysDiff(t.dueDate) < 0);
  const today = pending.filter(t => daysDiff(t.dueDate) === 0);
  const thisWeek = pending.filter(t => { const d = daysDiff(t.dueDate); return d > 0 && d <= 6; });
  const later = pending.filter(t => daysDiff(t.dueDate) > 6);

  return (
    <Layout>
      <PageHeader
        eyebrow="Manage"
        title="Tasks"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Task
          </Button>
        }
      />

      {/* AI Schedule banner */}
      {pending.length > 0 && (
        <Card className="mb-6 !p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {pending.length} pending task{pending.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Regenerate timetable to schedule them automatically
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleSchedule} loading={scheduling}>
              <Sparkles size={13} /> Schedule
            </Button>
          </div>
          {scheduleMsg && (
            <p className={`text-xs mt-3 font-medium ${scheduleMsg.startsWith('Timetable') ? 'text-green-500' : 'text-red-500'}`}>
              {scheduleMsg}{' '}
              {scheduleMsg.startsWith('Timetable') && (
                <button onClick={() => navigate('/dashboard')} className="underline">View timetable</button>
              )}
            </p>
          )}
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Task groups */}
      {!loading && (
        <>
          <TaskGroup label="Overdue" tasks={overdue} onToggle={handleToggle} onDelete={handleDelete} accent="text-red-500" />
          <TaskGroup label="Today" tasks={today} onToggle={handleToggle} onDelete={handleDelete} accent="text-primary-500" />
          <TaskGroup label="This Week" tasks={thisWeek} onToggle={handleToggle} onDelete={handleDelete} />
          <TaskGroup label="Later" tasks={later} onToggle={handleToggle} onDelete={handleDelete} />
          <TaskGroup label="Completed" tasks={done} onToggle={handleToggle} onDelete={handleDelete} collapsible />

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Check size={24} className="text-primary-400" />
              </div>
              <p className="text-sm text-gray-400 text-center">No tasks yet — add one to get started</p>
              <Button onClick={() => setShowAdd(true)}>
                <Plus size={15} /> Add Task
              </Button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showAdd} title="Add Task" onClose={() => setShowAdd(false)}>
        <AddTaskForm onAdd={t => setTasks(prev => [...prev, t])} onClose={() => setShowAdd(false)} />
      </Modal>
    </Layout>
  );
};
