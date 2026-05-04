import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export function AdminSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadUsers() {
    try {
      const data = await apiFetch<{ users: User[] }>('/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function toggleRole(userId: number, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await apiFetch(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
      setMessage(`Role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update role');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Admin Settings</h1>
      {message && <p className="text-sm text-green-400 mb-4">{message}</p>}
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium text-text-secondary">Users</h2>
        </div>
        <div className="divide-y divide-border">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-text-primary">{user.name}</p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs ${user.role === 'admin' ? 'bg-accent-bg text-accent-light' : 'bg-page text-text-muted'}`}>{user.role}</span>
                <button onClick={() => toggleRole(user.id, user.role)} className="text-xs text-text-muted hover:text-accent transition-colors">
                  {user.role === 'admin' ? 'Demote' : 'Promote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
