import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
  { to: '/contacts', label: 'Contacts', icon: '👥' },
  { to: '/sales', label: 'Sales', icon: '🛒' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/reports', label: 'Reports', icon: '📑' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
        <h1 className="font-display font-bold text-xl">Shop Manager</h1>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${isActive ? 'bg-primary-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 text-slate-400 text-sm">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[44px]"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex min-h-[100dvh]">
      {/* Overlay on mobile when sidebar open */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      {/* Sidebar - drawer on mobile, fixed on desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 ease-out lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <span className="text-xl">☰</span>
          </button>
          <h2 className="font-display font-semibold text-lg">Shop Manager</h2>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
