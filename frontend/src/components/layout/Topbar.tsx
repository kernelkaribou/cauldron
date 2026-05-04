import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { NAV_ITEMS } from '@/lib/theme';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4">
        {/* Brand */}
        <Link to="/" className="text-accent-light font-semibold text-lg mr-8">
          Cauldron
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-bg text-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-accent-bg/50'
                }`
              }
            >
              <span className="mr-1.5">{item.glyph}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          <Link to="/settings/profile" className="text-sm text-text-secondary hover:text-text-primary">
            {user?.name}
          </Link>
          <button
            onClick={() => logout()}
            className="text-sm text-text-muted hover:text-error transition-colors"
          >
            Logout
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-xl text-text-secondary"
            aria-label="Toggle menu"
          >
            &#9776;
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}

      {/* Content */}
      <main className="pt-14 max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
