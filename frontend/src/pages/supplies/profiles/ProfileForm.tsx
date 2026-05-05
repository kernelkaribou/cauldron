import { useEffect, useState } from 'react';
import type { SupplyProfile, SupplyProfileField } from '@/lib/types';

const fieldInputClassName = 'w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none';
const secondaryButtonClassName = 'px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm disabled:opacity-50';
const fieldTypes: Array<{ value: SupplyProfileField['type']; label: string; description: string; examples: string }> = [
  { value: 'text', label: 'Text', description: 'A short text value', examples: 'Color, Material, Finish' },
  { value: 'number', label: 'Number', description: 'A numeric value with optional unit', examples: 'Weight, Length, Resistance' },
  { value: 'select', label: 'Dropdown', description: 'Pick one option from a list', examples: 'Gauge, Size, Grade' },
  { value: 'multiselect', label: 'Multiple Choice', description: 'Pick one or more options', examples: 'Suitable For, Colors Available' },
  { value: 'boolean', label: 'Yes / No', description: 'A simple on/off toggle', examples: 'Washable, Food Safe, Lead Free' },
];

interface EditableField extends Omit<SupplyProfileField, 'min' | 'max'> {
  localId: string;
  min: string;
  max: string;
}

interface FieldErrorState {
  label?: string;
  options?: string;
  min?: string;
  max?: string;
}

interface ProfileFormProps {
  initialProfile?: SupplyProfile;
  submitLabel: string;
  isSubmitting: boolean;
  errors?: Record<string, string>;
  onSubmit: (data: { name: string; schema: string }) => Promise<void> | void;
  onCancel: () => void;
}

let nextFieldId = 0;

function createFieldId() {
  nextFieldId += 1;
  return `supply-profile-field-${nextFieldId}`;
}

function labelToKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
}

function createEmptyField(): EditableField {
  return {
    localId: createFieldId(),
    label: '',
    key: '',
    type: 'text',
    required: false,
    distinguishing: false,
    options: undefined,
    unit: undefined,
    integer: false,
    min: '',
    max: '',
    placeholder: '',
  };
}

function toEditableField(field: SupplyProfileField): EditableField {
  return {
    localId: createFieldId(),
    label: field.label || '',
    key: field.key || labelToKey(field.label || ''),
    type: field.type,
    options: field.options,
    required: !!field.required,
    distinguishing: !!field.distinguishing,
    unit: field.unit || '',
    integer: !!field.integer,
    min: field.min !== undefined ? String(field.min) : '',
    max: field.max !== undefined ? String(field.max) : '',
    placeholder: field.placeholder || '',
  };
}

function parseInitialFields(initialProfile?: SupplyProfile): { fields: EditableField[]; schemaError?: string } {
  if (!initialProfile?.schema) return { fields: [] };

  try {
    const parsed = JSON.parse(initialProfile.schema);
    if (!Array.isArray(parsed)) {
      return { fields: [], schemaError: 'The saved profile has an issue. Please re-add your fields and save again.' };
    }

    return { fields: parsed.map(field => toEditableField(field as SupplyProfileField)) };
  } catch {
    return { fields: [], schemaError: 'The saved profile has an issue. Please re-add your fields and save again.' };
  }
}

function serializeField(field: EditableField): SupplyProfileField {
  const serialized: SupplyProfileField = {
    key: field.key.trim() || labelToKey(field.label),
    label: field.label.trim(),
    type: field.type,
  };

  if (field.required) serialized.required = true;
  if (field.distinguishing) serialized.distinguishing = true;
  if (field.placeholder?.trim()) serialized.placeholder = field.placeholder.trim();

  if (field.type === 'number') {
    if (field.unit?.trim()) serialized.unit = field.unit.trim();
    if (field.integer) serialized.integer = true;
    if (field.min.trim()) serialized.min = Number(field.min);
    if (field.max.trim()) serialized.max = Number(field.max);
  }

  if (field.type === 'select' || field.type === 'multiselect') {
    const options = (field.options || []).map(option => option.trim()).filter(Boolean);
    if (options.length > 0) serialized.options = options;
  }

  return serialized;
}

export function ProfileForm({ initialProfile, submitLabel, isSubmitting, errors, onSubmit, onCancel }: ProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name || '');
  const [fields, setFields] = useState<EditableField[]>([]);
  const [nameError, setNameError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorState>>({});
  const [schemaError, setSchemaError] = useState<string | undefined>();

  useEffect(() => {
    const parsed = parseInitialFields(initialProfile);
    setName(initialProfile?.name || '');
    setFields(parsed.fields);
    setNameError(undefined);
    setFieldErrors({});
    setSchemaError(parsed.schemaError);
  }, [initialProfile]);

  function updateField(localId: string, updater: (field: EditableField) => EditableField) {
    setFields(currentFields => currentFields.map(field => (field.localId === localId ? updater(field) : field)));
  }

  function handleLabelChange(localId: string, label: string) {
    updateField(localId, field => ({
      ...field,
      label,
      key: labelToKey(label),
    }));
  }

  function handleTypeChange(localId: string, type: SupplyProfileField['type']) {
    updateField(localId, field => ({
      ...field,
      type,
      options: (type === 'select' || type === 'multiselect') ? (field.options || []) : undefined,
      unit: type === 'number' ? (field.unit || '') : '',
      integer: type === 'number' ? field.integer : false,
      min: type === 'number' ? field.min : '',
      max: type === 'number' ? field.max : '',
    }));
  }

  function addField() {
    setFields(currentFields => [...currentFields, createEmptyField()]);
  }

  function removeField(localId: string) {
    setFields(currentFields => currentFields.filter(field => field.localId !== localId));
    setFieldErrors(currentErrors => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[localId];
      return nextErrors;
    });
  }

  function moveField(localId: string, direction: -1 | 1) {
    setFields(currentFields => {
      const currentIndex = currentFields.findIndex(field => field.localId === localId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentFields.length) return currentFields;
      const reorderedFields = [...currentFields];
      const [field] = reorderedFields.splice(currentIndex, 1);
      reorderedFields.splice(nextIndex, 0, field);
      return reorderedFields;
    });
  }

  function validateForm() {
    const nextFieldErrors: Record<string, FieldErrorState> = {};
    const usedLabels = new Set<string>();
    let hasErrors = false;

    if (!name.trim()) {
      setNameError('Give your profile a name');
      hasErrors = true;
    } else {
      setNameError(undefined);
    }

    for (const field of fields) {
      const currentFieldErrors: FieldErrorState = {};
      const trimmedLabel = field.label.trim().toLowerCase();

      if (!field.label.trim()) {
        currentFieldErrors.label = 'Give this field a name';
      } else if (usedLabels.has(trimmedLabel)) {
        currentFieldErrors.label = 'Each field needs a unique name';
      } else {
        usedLabels.add(trimmedLabel);
      }

      if (field.type === 'select' || field.type === 'multiselect') {
        const options = (field.options || []).map(option => option.trim()).filter(Boolean);
        if (options.length === 0) currentFieldErrors.options = 'Add at least one choice';
      }

      if (field.type === 'number') {
        if (field.min.trim() && Number.isNaN(Number(field.min))) currentFieldErrors.min = 'Enter a valid number';
        if (field.max.trim() && Number.isNaN(Number(field.max))) currentFieldErrors.max = 'Enter a valid number';
        if (field.min.trim() && field.max.trim() && !Number.isNaN(Number(field.min)) && !Number.isNaN(Number(field.max)) && Number(field.min) > Number(field.max)) {
          currentFieldErrors.max = 'Max must be greater than min';
        }
      }

      if (Object.keys(currentFieldErrors).length > 0) {
        nextFieldErrors[field.localId] = currentFieldErrors;
        hasErrors = true;
      }
    }

    setFieldErrors(nextFieldErrors);
    return !hasErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSchemaError(undefined);
    await onSubmit({
      name: name.trim(),
      schema: JSON.stringify(fields.map(field => serializeField(field))),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="p-5 bg-card border border-border rounded-xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Profile Name</label>
          <input
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (nameError) setNameError(undefined);
            }}
            required
            className={fieldInputClassName}
            placeholder="e.g. Yarn, Fabric, Wood"
          />
          <p className="text-xs text-text-muted mt-1">A short name for this type of supply.</p>
          {(nameError || errors?.name) && <p className="text-xs text-error mt-1">{nameError || errors?.name}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <div>
            <h2 className="text-sm font-medium text-text-primary">Custom Fields</h2>
            <p className="text-xs text-text-muted mt-1">Define what details you want to track for this type of supply.</p>
          </div>
          <button type="button" onClick={addField} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">
            Add Field
          </button>
        </div>

        {(schemaError || errors?.schema) && <p className="text-sm text-error">{schemaError || errors?.schema}</p>}

        <div className="space-y-4">
          {fields.length === 0 && (
            <div className="p-6 border border-dashed border-border rounded-xl text-sm text-text-muted text-center">
              No custom fields yet. Click "Add Field" to start defining what you want to track.
            </div>
          )}

          {fields.map((field, index) => {
            const currentErrors = fieldErrors[field.localId] || {};
            const optionsValue = (field.options || []).join(', ');
            const isNumberField = field.type === 'number';
            const hasOptions = field.type === 'select' || field.type === 'multiselect';

            return (
              <div key={field.localId} className="p-4 bg-page border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {field.label || `Field ${index + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveField(field.localId, -1)} disabled={index === 0} className={secondaryButtonClassName} aria-label="Move up">
                      ↑
                    </button>
                    <button type="button" onClick={() => moveField(field.localId, 1)} disabled={index === fields.length - 1} className={secondaryButtonClassName} aria-label="Move down">
                      ↓
                    </button>
                    <button type="button" onClick={() => removeField(field.localId)} className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-red-500 hover:text-red-400 transition-colors text-sm" aria-label="Remove">
                      ×
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Name</label>
                    <input value={field.label} onChange={e => handleLabelChange(field.localId, e.target.value)} className={fieldInputClassName} />
                    {currentErrors.label && <p className="text-xs text-error mt-1">{currentErrors.label}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Type</label>
                    <select value={field.type} onChange={e => handleTypeChange(field.localId, e.target.value as SupplyProfileField['type'])} className={fieldInputClassName}>
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isNumberField && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Unit (optional)</label>
                      <input value={field.unit || ''} onChange={e => updateField(field.localId, f => ({ ...f, unit: e.target.value }))} className={fieldInputClassName} placeholder="e.g. oz, mm, Ω" />
                      <p className="text-xs text-text-muted mt-1">Shown after the number when filling in this field.</p>
                    </div>
                    <details className="group">
                      <summary className="text-xs text-text-muted cursor-pointer hover:text-accent transition-colors select-none">Advanced options</summary>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 pt-2 border-t border-border">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Min</label>
                          <input type="number" value={field.min} onChange={e => updateField(field.localId, f => ({ ...f, min: e.target.value }))} className={fieldInputClassName} />
                          {currentErrors.min && <p className="text-xs text-error mt-1">{currentErrors.min}</p>}
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">Max</label>
                          <input type="number" value={field.max} onChange={e => updateField(field.localId, f => ({ ...f, max: e.target.value }))} className={fieldInputClassName} />
                          {currentErrors.max && <p className="text-xs text-error mt-1">{currentErrors.max}</p>}
                        </div>
                        <label className="flex items-center gap-2 text-xs text-text-muted self-end pb-2">
                          <input type="checkbox" checked={!!field.integer} onChange={e => updateField(field.localId, f => ({ ...f, integer: e.target.checked }))} className="rounded" />
                          Whole numbers only
                        </label>
                      </div>
                    </details>
                  </div>
                )}

                {hasOptions && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Choices (separate with commas)</label>
                    <input
                      value={optionsValue}
                      onChange={e => updateField(field.localId, f => ({
                        ...f,
                        options: e.target.value.split(',').map(option => option.trim()).filter(Boolean),
                      }))}
                      className={fieldInputClassName}
                      placeholder="e.g. Lace, DK, Worsted, Bulky"
                    />
                    {currentErrors.options && <p className="text-xs text-error mt-1">{currentErrors.options}</p>}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    <input type="checkbox" checked={!!field.required} onChange={e => updateField(field.localId, f => ({ ...f, required: e.target.checked }))} className="rounded" />
                    Required
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    <input type="checkbox" checked={!!field.distinguishing} onChange={e => updateField(field.localId, f => ({ ...f, distinguishing: e.target.checked }))} className="rounded" />
                    Distinguishing
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">
          Cancel
        </button>
      </div>
    </form>

    <aside className="hidden lg:block p-4 bg-card border border-border rounded-xl sticky top-6 space-y-5">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Field Types</h3>
        <dl className="space-y-3 text-xs">
          {fieldTypes.map(type => (
            <div key={type.value}>
              <dt className="font-medium text-text-primary">{type.label}</dt>
              <dd className="text-text-muted">{type.description}</dd>
              <dd className="text-text-muted italic mt-0.5">e.g. {type.examples}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="pt-3 border-t border-border">
        <h3 className="text-sm font-medium text-text-primary mb-2">Options</h3>
        <dl className="space-y-2 text-xs">
          <div>
            <dt className="font-medium text-text-primary">Required</dt>
            <dd className="text-text-muted">Must be filled in when adding a supply</dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Distinguishing</dt>
            <dd className="text-text-muted">Shown next to the supply name in lists and pickers to tell similar items apart</dd>
          </div>
        </dl>
      </div>
    </aside>
    </div>
  );
}
