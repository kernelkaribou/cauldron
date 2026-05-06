import { useState, useRef, useEffect } from 'react';

export interface SearchDropdownItem {
  id: number;
  label: string;
  sublabel?: string;
}

interface SearchDropdownProps {
  placeholder?: string;
  items: SearchDropdownItem[];
  onSelect: (item: SearchDropdownItem) => void;
  onSearchChange?: (search: string) => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Reusable search dropdown for selecting from a filtered list.
 * Used as the base search UI in entity pickers (Technique, Supply, Craft).
 */
export function SearchDropdown({
  placeholder = 'Search...',
  items,
  onSelect,
  onSearchChange,
  emptyMessage = 'No results found.',
  className = '',
}: SearchDropdownProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setSearch(value);
    setOpen(true);
    onSearchChange?.(value);
  }

  function handleSelect(item: SearchDropdownItem) {
    onSelect(item);
    setSearch('');
    setOpen(false);
    onSearchChange?.('');
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        value={search}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
      />
      {open && search && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-2.5 text-xs text-text-muted">{emptyMessage}</p>
          ) : (
            items.slice(0, 10).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-left text-sm text-text-primary transition-all hover:bg-page"
              >
                {item.label}
                {item.sublabel && <span className="text-text-muted ml-1 text-xs">({item.sublabel})</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
