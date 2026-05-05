import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSupplyProfile } from '@/hooks/useSupplyProfiles';
import { ApiError } from '@/lib/api';
import { ProfileForm } from './ProfileForm';

export function ProfileNew() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSupplyProfile = useCreateSupplyProfile();
  const navigate = useNavigate();

  async function handleSubmit(data: { name: string; schema: string }) {
    setErrors({});

    try {
      await createSupplyProfile.mutateAsync(data);
      navigate('/supplies/profiles');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ schema: err instanceof Error ? err.message : 'Failed to create supply profile' });
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">New Supply Profile</h1>
        <p className="text-sm text-text-secondary mt-1">Build a reusable schema for supply-specific attributes.</p>
      </div>
      <ProfileForm
        submitLabel="Create Profile"
        isSubmitting={createSupplyProfile.isPending}
        errors={errors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/supplies/profiles')}
      />
    </div>
  );
}
