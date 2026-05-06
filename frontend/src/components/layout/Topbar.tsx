import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { NAV_ITEMS } from '@/lib/theme';
import { MobileNav } from './MobileNav';
import { GlobalSearch } from '@/components/shared/GlobalSearch';

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 fixed inset-y-0 left-0 bg-card border-r border-border z-40">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-border-subtle">
          <Link to="/" className="text-accent-light font-serif text-xl font-semibold tracking-wide">
            Cauldron
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-accent-bg text-accent-light shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-elevated'
                }`
              }
            >
              <span className="text-base">{item.glyph}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border-subtle p-3 space-y-1">
          <Link to="/settings/profile" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-card-elevated transition-all">
            <span className="text-base">○</span>
            {user?.name}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/settings/admin" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-card-elevated transition-all">
              <span className="text-base">⚙</span>
              Settings
            </Link>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-terracotta hover:bg-terracotta-bg transition-all text-left"
          >
            <span className="text-base">↗</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4">
        <Link to="/" className="text-accent-light font-serif font-semibold text-lg">
          Cauldron
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <GlobalSearch />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-xl text-text-secondary"
            aria-label="Toggle menu"
          >
            &#9776;
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}

      {/* Content area */}
      <div className="flex-1 md:ml-56 relative z-10">
        {/* Desktop header bar */}
        <header className="hidden md:flex items-center h-16 px-8 border-b border-border-subtle bg-page/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex-1">
            <GlobalSearch />
          </div>
        </header>

        {/* Main content */}
        <main className="px-6 md:px-8 py-6 pt-16 md:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
