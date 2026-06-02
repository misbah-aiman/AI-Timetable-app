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
// FIX: backdrop-blur-2xl (40px) was excessive and degraded text legibility underneath.
//      Reduced to backdrop-blur-md (12px) — matches iOS standard (~20px).
//      Background opacity stays at 90% so content underneath is rarely visible anyway.

const TopNav = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-surface-100/90 dark:bg-[#010f0f]/90 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.09]">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-[60px]">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-700 rounded-[10px] flex items-center justify-center shadow-glow-primary-sm group-hover:shadow-glow-primary transition-shadow duration-200">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">
            AI Timetable
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07]'
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
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-black/[0.10] dark:border-white/[0.10]">
              <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-[11px] font-bold shadow-soft">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/25 transition-colors"
                aria-label="Sign out"
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

// ─── Mobile bottom navigation ─────────────────────────────────
// FIX: backdrop-blur-2xl (40px) reduced to backdrop-blur-md (12px).
// FIX: Active icon was dark:text-primary-400 (#26A6A6) on dark pill = ~3.5:1.
//      Changed to dark:text-primary-300 (#4DB8B8) for better contrast on dark surfaces.
// FIX: Active pill in dark was dark:bg-primary-900/50 (very dark = invisible pill).
//      Changed to dark:bg-primary-800/50 (slightly lighter teal).

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="bg-white/92 dark:bg-[#010f0f]/92 backdrop-blur-md border-t border-black/[0.09] dark:border-white/[0.10] safe-pb">
        <div className="flex h-[58px]">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-90 active:opacity-70"
              >
                {/* Pill container — visible in both modes */}
                <div
                  className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-primary-100 dark:bg-primary-800/50'
                      : ''
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={
                      active
                        ? 'text-primary-700 dark:text-primary-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  />
                </div>
                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active
                      ? 'font-semibold text-primary-700 dark:text-primary-300'
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
