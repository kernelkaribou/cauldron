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
    <div className="min-h-screen bg-page">
      {/* Desktop Topbar */}
      <header className="hidden md:flex items-center h-14 px-6 bg-card border-b border-border sticky top-0 z-50">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 mr-8 shrink-0">
          <img src="/icon-64.webp" alt="Cauldron" className="w-9 h-9 rounded-lg" />
          <span className="text-accent-light font-serif text-lg font-semibold tracking-wide">Cauldron</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-accent-bg text-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card-elevated'
                }`
              }
            >
              <span className="text-sm">{item.glyph}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side: search + user */}
        <div className="ml-auto flex items-center gap-4">
          <GlobalSearch />
          <Link to="/settings/profile" className="text-sm text-text-secondary hover:text-text-primary transition-all">
            {user?.name}
          </Link>
          {user?.role === 'admin' && (
            <Link to="/settings/admin" className="text-sm text-text-muted hover:text-text-primary transition-all" title="Settings">
              ⚙
            </Link>
          )}
          <button
            onClick={() => logout()}
            className="text-sm text-text-muted hover:text-terracotta transition-all"
            title="Logout"
          >
            ↗
          </button>
        </div>
      </header>

      {/* Mobile Topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-64.webp" alt="Cauldron" className="w-7 h-7 rounded-lg" />
          <span className="text-accent-light font-serif font-semibold text-lg">Cauldron</span>
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

      {/* Main content */}
      <main className="px-6 md:px-8 py-6 pt-16 md:pt-6 max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
