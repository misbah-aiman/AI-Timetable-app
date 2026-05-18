import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Trash2, Save, RefreshCw } from 'lucide-react';
import { userApi, timetableApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { storage } from '../utils/localStorage';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const ob = user?.onboarding;
  const [form, setForm] = useState({
    name: user?.name || '',
    studyGoalHours: ob?.studyGoalHours || 4,
    sleepHours: ob?.sleepHours || 8,
    screenTimeLimitHours: ob?.screenTimeLimitHours || 2,
    sleepTime: ob?.sleepTime || '22:00',
    wakeTime: ob?.wakeTime || '06:30',
  });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await userApi.updateSettings(form);
      if (user) {
        updateUser({ ...user, name: res.data.user.name, onboarding: res.data.user.onboarding });
      }
      setSuccessMsg('Settings saved!');
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');
    try {
      await handleSave();
      const res = await timetableApi.generate();
      storage.setTimetable(res.data.timetable);
      setSuccessMsg('New timetable generated!');
    } catch {
      setError('Failed to regenerate timetable.');
    } finally {
      setRegenerating(false);
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

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })),
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <Input label="Display Name" {...field('name')} />
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
          </div>
        </Card>

        {/* Routine */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Routine Preferences</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bedtime" type="time" {...field('sleepTime')} />
              <Input label="Wake-up Time" type="time" {...field('wakeTime')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sleep Goal: <strong>{form.sleepHours}h</strong>
              </label>
              <input type="range" min={4} max={12} {...field('sleepHours')} className="w-full accent-primary-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Daily Study Goal: <strong>{form.studyGoalHours}h</strong>
              </label>
              <input type="range" min={1} max={12} {...field('studyGoalHours')} className="w-full accent-primary-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Screen Time Limit: <strong>{form.screenTimeLimitHours}h</strong>
              </label>
              <input type="range" min={0} max={8} {...field('screenTimeLimitHours')} className="w-full accent-primary-600" />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-500" />}
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </p>
              <p className="text-xs text-gray-500">Currently: {theme} mode</p>
            </div>
          </button>
        </Card>

        {/* Feedback messages */}
        {successMsg && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} /> Save Changes
          </Button>
          <Button onClick={handleRegenerate} loading={regenerating} variant="secondary">
            <RefreshCw size={16} /> Save & Regenerate Timetable
          </Button>
          <Button onClick={() => setDeleteModal(true)} variant="danger">
            <Trash2 size={16} /> Delete Account
          </Button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          This will permanently delete your account, timetable, and all session data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">
            Delete Everything
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
