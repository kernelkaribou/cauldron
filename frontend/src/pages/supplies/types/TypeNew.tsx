import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSupplyType } from '@/hooks/useSupplyTypes';
import { ApiError } from '@/lib/api';
import { TypeForm } from './TypeForm';

export function TypeNew() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSupplyType = useCreateSupplyType();
  const navigate = useNavigate();

  async function handleSubmit(data: { name: string; schema: string }) {
    setErrors({});

    try {
      await createSupplyType.mutateAsync(data);
      navigate('/supplies/types');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ schema: err instanceof Error ? err.message : 'Failed to create supply type' });
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">New Supply Type</h1>
        <p className="text-sm text-text-secondary mt-1">Build a reusable schema for supply-specific attributes.</p>
      </div>
      <TypeForm
        submitLabel="Create Type"
        isSubmitting={createSupplyType.isPending}
        errors={errors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/supplies/types')}
      />
    </div>
  );
}
