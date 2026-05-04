import { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

export function ProfileSettings() {
  const { user, refresh } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) });
      await refresh();
      setMessage('Profile updated!');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update');
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Password changed!');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Profile Settings</h1>
      {message && <p className="text-sm text-green-400 mb-4">{message}</p>}
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      <form onSubmit={handleUpdateProfile} className="mb-8 p-4 bg-card border border-border rounded-xl space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">Profile</h2>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Email</label>
          <input value={user?.email || ''} disabled className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-muted" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-light disabled:opacity-50">Save Profile</button>
      </form>

      <form onSubmit={handleChangePassword} className="p-4 bg-card border border-border rounded-xl space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">Change Password</h2>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Current Password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-light disabled:opacity-50">Change Password</button>
      </form>
    </div>
  );
}
