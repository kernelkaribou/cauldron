import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/lib/theme';

interface Props {
  onClose: () => void;
}

export function MobileNav({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-deep/80" onClick={onClose} />
      <nav className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 flex flex-col gap-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent-bg text-accent-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-accent-bg/50'
              }`
            }
          >
            <span className="mr-2">{item.glyph}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
