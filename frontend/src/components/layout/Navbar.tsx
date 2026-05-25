import { Home, Clock, BarChart2, Settings, Moon, Sun, LogOut, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/tracker', label: 'Tracker', icon: Clock },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

// Desktop top navigation
const TopNav = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-white/80 dark:bg-[#16141f]/80 backdrop-blur-md border-b border-primary-100 dark:border-primary-900/20">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-2xl flex items-center justify-center shadow-soft">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-800 dark:text-white text-base">AI Timetable</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-primary-900/20'
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-surface-100 dark:hover:bg-primary-900/20 transition-colors"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-primary-100 dark:border-primary-900/30 ml-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-soft">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name.split(' ')[0]}</span>
              <button
                onClick={logout}
                className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Mobile bottom tab bar
const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/90 dark:bg-[#16141f]/90 backdrop-blur-xl border-t border-primary-100 dark:border-primary-900/30 safe-pb">
        <div className="flex">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 transition-colors"
              >
                <div className={`w-10 h-7 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                  active ? 'bg-primary-100 dark:bg-primary-900/40' : ''
                }`}>
                  <Icon
                    size={20}
                    className={active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${
                  active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
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
