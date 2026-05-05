export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

export function getDistinguishingValues(attributes: string | null, schema: Array<{ key: string; label: string; distinguishing?: boolean; unit?: string }>): string[] {
  if (!attributes || !schema.length) return [];
  try {
    const attrs = JSON.parse(attributes);
    return schema
      .filter(f => f.distinguishing)
      .map(f => {
        const val = attrs[f.key];
        if (val === undefined || val === null || val === '') return null;
        if (Array.isArray(val)) return val.join(', ');
        if (typeof val === 'boolean') return val ? f.label : null;
        return f.unit ? `${val} ${f.unit}` : String(val);
      })
      .filter((v): v is string => v !== null);
  } catch {
    return [];
  }
}
