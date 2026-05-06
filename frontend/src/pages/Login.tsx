import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-page relative z-10">
      <div className="w-full max-w-md p-10 bg-card rounded-2xl border border-border shadow-lg">
        <div className="flex justify-center mb-4">
          <img src="/icon-128.webp" alt="Cauldron" className="w-24 h-24 rounded-xl" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-accent-light mb-2 text-center">Cauldron</h1>
        <p className="text-sm text-text-muted text-center mb-8">Your creative atelier awaits</p>
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-terracotta-bg text-terracotta text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all disabled:opacity-40 shadow-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
