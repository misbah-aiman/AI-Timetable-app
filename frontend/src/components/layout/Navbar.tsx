import { Home, Clock, BarChart2, Settings, Moon, Sun, LogOut, Sparkles, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const tabs = [
  { to: '/dashboard', label: 'Home',    icon: Home },
  { to: '/tracker',   label: 'Tracker', icon: Clock },
  { to: '/tasks',     label: 'Tasks',   icon: ListTodo },
  { to: '/analytics', label: 'Stats',   icon: BarChart2 },
  { to: '/settings',  label: 'More',    icon: Settings },
];

// ─── Desktop top navigation ───────────────────────────────────

const TopNav = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="hidden md:block sticky top-0 z-40 bg-surface-100/90 dark:bg-[#010f0f]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.09]"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-[60px]">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group" aria-label="AI Timetable home">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-700 rounded-[10px] flex items-center justify-center shadow-glow-primary-sm group-hover:shadow-glow-primary transition-shadow duration-200">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">
            AI Timetable
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5" role="list">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                role="listitem"
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.07]'
                }`}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-black/[0.10] dark:border-white/[0.10]">
              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-[11px] font-bold shadow-glow-primary-sm"
                aria-hidden="true"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/25 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// ─── Mobile bottom tab bar (true iOS HIG style) ───────────────
// iOS HIG: 49pt tall, active state = tinted icon+label only (no pill/badge background)

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      aria-label="Main navigation"
    >
      <div className="bg-white/94 dark:bg-[#010f0f]/94 backdrop-blur-xl border-t border-black/[0.09] dark:border-white/[0.10] safe-pb">
        <div className="flex h-[49px]" role="list">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                role="listitem"
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-opacity duration-100 active:opacity-40"
              >
                <Icon
                  size={23}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }
                />
                <span
                  className={`text-[9.5px] leading-none tracking-[0.02em] ${
                    active
                      ? 'font-semibold text-primary-600 dark:text-primary-400'
                      : 'font-medium text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export const Navbar = () => (
  <>
    <TopNav />
    <BottomNav />
  </>
);
