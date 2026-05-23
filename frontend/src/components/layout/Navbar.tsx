import { Home, Clock, BarChart2, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/tracker', label: 'Tracker', icon: Clock },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-primary-100 dark:border-gray-800 safe-pb">
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
                  active
                    ? 'bg-primary-100 dark:bg-primary-900/40'
                    : ''
                }`}>
                  <Icon
                    size={20}
                    className={active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-400 dark:text-gray-500'
                    }
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span className={`text-[10px] font-medium tracking-wide ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
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
