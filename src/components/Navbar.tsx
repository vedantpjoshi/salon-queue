import { Link, useLocation } from 'react-router-dom';
import { Scissors, Home, Users, Monitor, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Menu', icon: Home },
  { path: '/stylist', label: 'Stylist', icon: Users },
  { path: '/display', label: 'Display', icon: Monitor },
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 text-violet-600 font-bold text-lg">
            <Scissors className="w-5 h-5" />
            <span className="hidden sm:inline">Glamour Queue</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-violet-50 text-violet-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
