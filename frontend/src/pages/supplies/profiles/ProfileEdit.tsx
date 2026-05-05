import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { useSupplyProfile, useUpdateSupplyProfile } from '@/hooks/useSupplyProfiles';
import { ApiError } from '@/lib/api';
import { ProfileForm } from './ProfileForm';

export function ProfileEdit() {
  const { id } = useParams();
  const profileId = Number(id);
  const { data: profile, isLoading, error, refetch } = useSupplyProfile(profileId);
  const updateSupplyProfile = useUpdateSupplyProfile();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!profile) return <p className="text-text-muted">Supply profile not found</p>;

  async function handleSubmit(data: { name: string; schema: string }) {
    setErrors({});

    try {
      await updateSupplyProfile.mutateAsync({ id: profileId, data });
      navigate('/supplies/profiles');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ schema: err instanceof Error ? err.message : 'Failed to update supply profile' });
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Edit Supply Profile</h1>
        <p className="text-sm text-text-secondary mt-1">Update the schema and save your changes.</p>
      </div>
      <ProfileForm
        initialProfile={profile}
        submitLabel="Save Changes"
        isSubmitting={updateSupplyProfile.isPending}
        errors={errors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/supplies/profiles')}
      />
    </div>
  );
}
