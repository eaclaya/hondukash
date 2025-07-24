'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { tenant } = useTenant();
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tenant/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          domain: tenant?.domain || window.location.hostname.split(':')[0]
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Use AuthContext to handle login
        login({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          tenantId: tenant?.id,
          domain: tenant?.domain,
          storeId: data.user.storeId || 1, // Default to store 1 if not specified
          token: data.token,
          expiresAt: data.expiresAt
        });

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">No Tenant Found</h2>
            <p className="mt-2 text-gray-600">This domain is not associated with any tenant.</p>
            <Button className="mt-4" onClick={() => (window.location.href = '/')}>
              Go to Main Site
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        {/* Login Card */}
        <div className="card-modern p-8">
        <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="text-2xl font-bold text-white">H</div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-600">Sign in to {tenant.name}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full btn-primary-modern h-12">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">
              Default password: <code className="bg-slate-100 px-2 py-1 rounded-lg font-mono text-xs">Pa$$w0rd!</code>
            </p>
            <p className="text-xs text-slate-500">Please change your password after first login</p>
          </div>
        </form>
        </div>
        
        {/* Footer Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-400">Domain: {tenant.domain}</p>
          {tenant.databaseContext?.hasConnection && (
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-green-600 font-medium">Database connected</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
