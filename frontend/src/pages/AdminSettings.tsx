import { useState, useEffect } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  has_password: boolean;
  created_at: string;
}

export function AdminSettings() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  async function loadUsers() {
    try {
      const data = await apiFetch<{ items: User[] }>('/admin/users');
      setUsers(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(userId: number, newRole: string) {
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
      setMessage(`Role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update role');
    }
  }

  async function deleteUser(userId: number) {
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('User deleted');
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user');
      setConfirmDelete(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Admin Settings</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          + Create User
        </button>
      </div>

      {message && (
        <div className="bg-green-900/20 border border-green-700 text-green-300 text-sm px-4 py-2 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="ml-2 text-green-400">✕</button>
        </div>
      )}
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 text-sm px-4 py-2 rounded-lg mb-4">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400">✕</button>
        </div>
      )}

      {showCreate && (
        <CreateUserForm
          onSuccess={() => { setShowCreate(false); setMessage('User created'); loadUsers(); }}
          onCancel={() => setShowCreate(false)}
          onError={setError}
        />
      )}

      {passwordUserId && (
        <SetPasswordForm
          userId={passwordUserId}
          userName={users.find(u => u.id === passwordUserId)?.name || ''}
          onSuccess={() => { setPasswordUserId(null); setMessage('Password updated'); loadUsers(); }}
          onCancel={() => setPasswordUserId(null)}
          onError={setError}
        />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium text-text-secondary">Users</h2>
        </div>
        <div className="divide-y divide-border">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">{user.name}</p>
                <p className="text-xs text-text-muted">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${user.role === 'admin' ? 'bg-accent-bg text-accent-light' : 'bg-page text-text-muted'}`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${user.has_password ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                    {user.has_password ? 'password' : 'proxy-only'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setPasswordUserId(user.id)}
                  className="text-xs px-2 py-1 rounded border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                >
                  Set Password
                </button>
                <button
                  onClick={() => changeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                  className="text-xs px-2 py-1 rounded border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
                  disabled={user.id === currentUser?.id}
                >
                  {user.role === 'admin' ? 'Demote' : 'Promote'}
                </button>
                {user.id !== currentUser?.id && (
                  confirmDelete === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-2 py-1 rounded border border-border text-text-muted hover:text-text-primary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className="text-xs px-2 py-1 rounded border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      Delete
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreateUserForm({ onSuccess, onCancel, onError }: {
  onSuccess: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(form) });
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">Create User</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          className="col-span-2 px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary"
        />
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          className="px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary"
        />
        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
          className="col-span-2 px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary"
        />
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SetPasswordForm({ userId, userName, onSuccess, onCancel, onError }: {
  userId: number;
  userName: string;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/admin/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
      onSuccess();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Failed to set password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <h3 className="text-sm font-medium text-text-primary mb-3">Set Password for {userName}</h3>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="flex-1 px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary"
        />
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Set Password'}
        </button>
      </form>
    </div>
  );
}
