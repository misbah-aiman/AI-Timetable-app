import { Home, Clock, BarChart2, Settings, Moon, Sun, LogOut, Sparkles, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const tabs = [
  { to: '/dashboard', label: 'Home',     icon: Home },
  { to: '/tracker',   label: 'Tracker',  icon: Clock },
  { to: '/tasks',     label: 'Tasks',    icon: ListTodo },
  { to: '/analytics', label: 'Stats',    icon: BarChart2 },
  { to: '/settings',  label: 'Settings', icon: Settings },
];

const TopNav = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-surface-100/80 dark:bg-[#010f0f]/80 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-[52px]">
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-primary-700 rounded-[10px] flex items-center justify-center shadow-soft">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">
            AI Timetable
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-black/[0.08] dark:border-white/[0.08]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-[11px] font-bold shadow-soft">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="bg-surface-100/80 dark:bg-[#010f0f]/85 backdrop-blur-2xl border-t border-black/[0.08] dark:border-white/[0.06] safe-pb">
        <div className="flex h-[50px]">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center justify-center gap-[3px] transition-all duration-150 active:scale-90 active:opacity-70 ${
                  active
                    ? 'text-primary-700 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className={`text-[10px] leading-none tracking-tight ${
                  active ? 'font-semibold' : 'font-medium'
                }`}>
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
