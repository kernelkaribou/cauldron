import type { SupplyTypeField } from '@/lib/types';

interface DynamicAttributeFormProps {
  schema: SupplyTypeField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function DynamicAttributeForm({ schema, values, onChange }: DynamicAttributeFormProps) {
  function updateValue(key: string, value: any) {
    onChange({ ...values, [key]: value });
  }

  if (schema.length === 0) return null;

  return (
    <div className="border border-border rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium text-text-secondary">Attributes</h3>
      {schema.map(field => (
        <FieldRenderer key={field.key} field={field} value={values[field.key]} onChange={(v) => updateValue(field.key, v)} />
      ))}
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: SupplyTypeField; value: any; onChange: (v: any) => void }) {
  const inputClass = "w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none text-sm";

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            {field.label}{field.required && <span className="text-error ml-0.5">*</span>}
          </label>
          <input
            value={value ?? ''}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            {field.label}{field.required && <span className="text-error ml-0.5">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value ?? ''}
              onChange={e => {
                const raw = e.target.value;
                if (raw === '') { onChange(undefined); return; }
                const num = field.integer ? parseInt(raw, 10) : parseFloat(raw);
                if (!isNaN(num)) onChange(num);
              }}
              step={field.integer ? '1' : 'any'}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              className={inputClass}
            />
            {field.unit && <span className="text-sm text-text-muted whitespace-nowrap">{field.unit}</span>}
          </div>
        </div>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="rounded"
          />
          {field.label}{field.required && <span className="text-error ml-0.5">*</span>}
        </label>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            {field.label}{field.required && <span className="text-error ml-0.5">*</span>}
          </label>
          <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );

    case 'multiselect':
      return <MultiselectField field={field} value={value} onChange={onChange} />;

    default:
      return null;
  }
}

function MultiselectField({ field, value, onChange }: { field: SupplyTypeField; value: any; onChange: (v: any) => void }) {
  const selected: string[] = Array.isArray(value) ? value : [];

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      const next = selected.filter(v => v !== opt);
      onChange(next.length > 0 ? next : undefined);
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">
        {field.label}{field.required && <span className="text-error ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {field.options?.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              selected.includes(opt)
                ? 'bg-accent text-white border-accent'
                : 'bg-page text-text-secondary border-border hover:border-accent'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
