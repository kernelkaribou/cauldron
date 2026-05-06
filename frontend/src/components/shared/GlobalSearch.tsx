import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import type { SearchResult } from '@/lib/types';

const TYPE_PATHS: Record<string, string> = {
  craft: '/crafts',
  technique: '/techniques',
  project: '/projects',
  supply: '/supplies',
  curiosity: '/curiosities',
};

const TYPE_GLYPHS: Record<string, string> = {
  craft: '◉',
  technique: '✦',
  project: '▦',
  supply: '◈',
  curiosity: '★',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.results);
        setSelectedIndex(0);
      } catch { setResults([]); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSelect(result: SearchResult) {
    navigate(`${TYPE_PATHS[result.type]}/${result.id}`);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search... (⌘K)"
          className="w-48 md:w-64 px-4 py-2 bg-card border border-border rounded-xl text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:w-80 transition-all"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition-all ${i === selectedIndex ? 'bg-accent/10 text-accent' : 'text-text-primary hover:bg-page'}`}
            >
              <span className="text-text-muted">{TYPE_GLYPHS[result.type] || '•'}</span>
              <span className="flex-1 truncate">{result.title}</span>
              <span className="text-xs text-text-muted">{result.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
