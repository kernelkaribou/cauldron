import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { useSupplyType, useUpdateSupplyType } from '@/hooks/useSupplyTypes';
import { ApiError } from '@/lib/api';
import { TypeForm } from './TypeForm';

export function TypeEdit() {
  const { id } = useParams();
  const typeId = Number(id);
  const { data: supplyType, isLoading, error, refetch } = useSupplyType(typeId);
  const updateSupplyType = useUpdateSupplyType();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!supplyType) return <p className="text-text-muted">Supply type not found</p>;

  async function handleSubmit(data: { name: string; schema: string }) {
    setErrors({});

    try {
      await updateSupplyType.mutateAsync({ id: typeId, data });
      navigate('/supplies/types');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ schema: err instanceof Error ? err.message : 'Failed to update supply type' });
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Edit Supply Type</h1>
        <p className="text-sm text-text-secondary mt-1">Update the schema and save your changes.</p>
      </div>
      <TypeForm
        initialType={supplyType}
        submitLabel="Save Changes"
        isSubmitting={updateSupplyType.isPending}
        errors={errors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/supplies/types')}
      />
    </div>
  );
}
