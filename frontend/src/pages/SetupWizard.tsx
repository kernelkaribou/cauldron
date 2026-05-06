import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, ApiError } from '@/lib/api';

export function SetupWizard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/auth/setup-status')
      .then((data) => {
        if (!(data as { needsSetup: boolean }).needsSetup) navigate('/login', { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  if (checking) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/auth/setup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          setError(Object.values(err.details).join(', '));
        } else {
          setError(err.message);
        }
      } else {
        setError('Setup failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-page relative z-10">
      <div className="w-full max-w-md p-10 bg-card rounded-2xl border border-border shadow-lg">
        <h1 className="font-serif text-3xl font-semibold text-accent-light mb-2 text-center">Welcome to Cauldron</h1>
        <p className="text-sm text-text-muted mb-8 text-center">Create your admin account to get started.</p>
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-terracotta-bg text-terracotta text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-text-muted mt-1">Minimum 8 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
