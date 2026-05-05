import { useEffect, useState } from 'react';
import type { SupplyProfile, SupplyProfileField } from '@/lib/types';

const fieldInputClassName = 'w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none';
const secondaryButtonClassName = 'px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm disabled:opacity-50';
const fieldTypes: Array<{ value: SupplyProfileField['type']; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'boolean', label: 'Boolean' },
];

interface EditableField extends Omit<SupplyProfileField, 'min' | 'max'> {
  localId: string;
  keyDirty: boolean;
  min: string;
  max: string;
}

interface FieldErrorState {
  label?: string;
  key?: string;
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
    options: undefined,
    unit: undefined,
    integer: false,
    min: '',
    max: '',
    placeholder: '',
    keyDirty: false,
  };
}

function toEditableField(field: SupplyProfileField): EditableField {
  const generatedKey = labelToKey(field.label || '');
  const normalizedKey = field.key || generatedKey;

  return {
    localId: createFieldId(),
    label: field.label || '',
    key: normalizedKey,
    type: field.type,
    options: field.options,
    required: !!field.required,
    unit: field.unit || '',
    integer: !!field.integer,
    min: field.min !== undefined ? String(field.min) : '',
    max: field.max !== undefined ? String(field.max) : '',
    placeholder: field.placeholder || '',
    keyDirty: normalizedKey.trim() !== '' && normalizedKey !== generatedKey,
  };
}

function parseInitialFields(initialProfile?: SupplyProfile): { fields: EditableField[]; schemaError?: string } {
  if (!initialProfile?.schema) return { fields: [] };

  try {
    const parsed = JSON.parse(initialProfile.schema);
    if (!Array.isArray(parsed)) {
      return { fields: [], schemaError: 'The saved schema is invalid. Review and save it again.' };
    }

    return { fields: parsed.map(field => toEditableField(field as SupplyProfileField)) };
  } catch {
    return { fields: [], schemaError: 'The saved schema is invalid. Review and save it again.' };
  }
}

function serializeField(field: EditableField): SupplyProfileField {
  const serialized: SupplyProfileField = {
    key: field.key.trim(),
    label: field.label.trim(),
    type: field.type,
  };

  if (field.required) serialized.required = true;
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
      key: field.keyDirty ? field.key : labelToKey(label),
    }));
  }

  function handleKeyChange(localId: string, key: string) {
    updateField(localId, field => {
      const generatedKey = labelToKey(field.label);
      return {
        ...field,
        key,
        keyDirty: key.trim() !== '' && key !== generatedKey,
      };
    });
  }

  function handleTypeChange(localId: string, type: SupplyProfileField['type']) {
    updateField(localId, field => {
      if (type === 'number') {
        return {
          ...field,
          type,
          options: undefined,
        };
      }

      if (type === 'select' || type === 'multiselect') {
        return {
          ...field,
          type,
          unit: '',
          integer: false,
          min: '',
          max: '',
        };
      }

      return {
        ...field,
        type,
        options: undefined,
        unit: '',
        integer: false,
        min: '',
        max: '',
      };
    });
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
    const usedKeys = new Set<string>();
    let hasErrors = false;

    if (!name.trim()) {
      setNameError('Name is required');
      hasErrors = true;
    } else {
      setNameError(undefined);
    }

    for (const field of fields) {
      const currentFieldErrors: FieldErrorState = {};
      const trimmedKey = field.key.trim();

      if (!field.label.trim()) currentFieldErrors.label = 'Label is required';
      if (!trimmedKey) {
        currentFieldErrors.key = 'Key is required';
      } else if (!/^[a-z0-9_]+$/.test(trimmedKey)) {
        currentFieldErrors.key = 'Use lowercase letters, numbers, and underscores';
      } else if (usedKeys.has(trimmedKey)) {
        currentFieldErrors.key = 'Keys must be unique';
      } else {
        usedKeys.add(trimmedKey);
      }

      if (field.type === 'select' || field.type === 'multiselect') {
        const options = (field.options || []).map(option => option.trim()).filter(Boolean);
        if (options.length === 0) currentFieldErrors.options = 'Add at least one option';
      }

      if (field.type === 'number') {
        if (field.min.trim() && Number.isNaN(Number(field.min))) currentFieldErrors.min = 'Enter a valid number';
        if (field.max.trim() && Number.isNaN(Number(field.max))) currentFieldErrors.max = 'Enter a valid number';
        if (field.min.trim() && field.max.trim() && !Number.isNaN(Number(field.min)) && !Number.isNaN(Number(field.max)) && Number(field.min) > Number(field.max)) {
          currentFieldErrors.max = 'Max must be greater than or equal to min';
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="p-5 bg-card border border-border rounded-xl space-y-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Profile Name</label>
          <input
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (nameError) setNameError(undefined);
            }}
            required
            className={fieldInputClassName}
            placeholder="e.g., Fabric Inventory"
          />
          {(nameError || errors?.name) && <p className="text-xs text-error mt-1">{nameError || errors?.name}</p>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-text-primary">Schema Fields</h2>
            <p className="text-sm text-text-secondary mt-1">Add the fields that supplies using this profile should capture.</p>
          </div>
          <button type="button" onClick={addField} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">
            Add Field
          </button>
        </div>

        {(schemaError || errors?.schema) && <p className="text-sm text-error">{schemaError || errors?.schema}</p>}

        <div className="space-y-4">
          {fields.length === 0 && (
            <div className="p-6 border border-dashed border-border rounded-xl text-sm text-text-muted text-center">
              No fields yet. Add your first schema field to get started.
            </div>
          )}

          {fields.map((field, index) => {
            const currentErrors = fieldErrors[field.localId] || {};
            const optionsValue = (field.options || []).join(', ');
            const isNumberField = field.type === 'number';
            const hasOptions = field.type === 'select' || field.type === 'multiselect';

            return (
              <div key={field.localId} className="p-4 bg-page border border-border rounded-xl space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Field {index + 1}</p>
                    <p className="text-xs text-text-muted mt-1">Define the label, storage key, and input behavior.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => moveField(field.localId, -1)} disabled={index === 0} className={secondaryButtonClassName} aria-label={`Move ${field.label || `field ${index + 1}`} up`}>
                      ↑
                    </button>
                    <button type="button" onClick={() => moveField(field.localId, 1)} disabled={index === fields.length - 1} className={secondaryButtonClassName} aria-label={`Move ${field.label || `field ${index + 1}`} down`}>
                      ↓
                    </button>
                    <button type="button" onClick={() => removeField(field.localId)} className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-red-500 hover:text-red-400 transition-colors text-sm" aria-label={`Remove ${field.label || `field ${index + 1}`}`}>
                      ×
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Label</label>
                    <input value={field.label} onChange={e => handleLabelChange(field.localId, e.target.value)} className={fieldInputClassName} placeholder="e.g., Width" />
                    {currentErrors.label && <p className="text-xs text-error mt-1">{currentErrors.label}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Key</label>
                    <input value={field.key} onChange={e => handleKeyChange(field.localId, e.target.value)} className={fieldInputClassName} placeholder="e.g., width" />
                    {currentErrors.key && <p className="text-xs text-error mt-1">{currentErrors.key}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Type</label>
                    <select value={field.type} onChange={e => handleTypeChange(field.localId, e.target.value as SupplyProfileField['type'])} className={fieldInputClassName}>
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Placeholder</label>
                    <input value={field.placeholder || ''} onChange={e => updateField(field.localId, currentField => ({ ...currentField, placeholder: e.target.value }))} className={fieldInputClassName} placeholder="Optional helper text" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-text-secondary pb-2">
                    <input type="checkbox" checked={!!field.required} onChange={e => updateField(field.localId, currentField => ({ ...currentField, required: e.target.checked }))} className="rounded" />
                    Required
                  </label>
                </div>

                {isNumberField && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Unit</label>
                      <input value={field.unit || ''} onChange={e => updateField(field.localId, currentField => ({ ...currentField, unit: e.target.value }))} className={fieldInputClassName} placeholder="e.g., mm" />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Minimum</label>
                      <input type="number" value={field.min} onChange={e => updateField(field.localId, currentField => ({ ...currentField, min: e.target.value }))} className={fieldInputClassName} placeholder="Optional" />
                      {currentErrors.min && <p className="text-xs text-error mt-1">{currentErrors.min}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1">Maximum</label>
                      <input type="number" value={field.max} onChange={e => updateField(field.localId, currentField => ({ ...currentField, max: e.target.value }))} className={fieldInputClassName} placeholder="Optional" />
                      {currentErrors.max && <p className="text-xs text-error mt-1">{currentErrors.max}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-text-secondary pt-8">
                      <input type="checkbox" checked={!!field.integer} onChange={e => updateField(field.localId, currentField => ({ ...currentField, integer: e.target.checked }))} className="rounded" />
                      Integer only
                    </label>
                  </div>
                )}

                {hasOptions && (
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Options</label>
                    <input
                      value={optionsValue}
                      onChange={e => updateField(field.localId, currentField => ({
                        ...currentField,
                        options: e.target.value.split(',').map(option => option.trim()).filter(Boolean),
                      }))}
                      className={fieldInputClassName}
                      placeholder="Comma-separated values"
                    />
                    {currentErrors.options && <p className="text-xs text-error mt-1">{currentErrors.options}</p>}
                  </div>
                )}
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
  );
}
