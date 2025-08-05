'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LoaderSpinner from '@/components/shared/loader-spinner';

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
        // Save default store ID to localStorage for store switching
        if (data.defaultStoreId) {
          localStorage.setItem('currentStoreId', data.defaultStoreId.toString());
        }

        // Use AuthContext to handle login
        login({
          userId: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          stores: data.user.stores,
          tenantId: tenant?.id,
          domain: tenant?.domain,
          storeId: data.defaultStoreId || 1, // Use default store ID from API
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
        <LoaderSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to {tenant.name}</h2>
          <p className="mt-2 text-gray-600">Access your ERP dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Default password: <code className="bg-gray-100 px-1 rounded">Pa$$w0rd!</code>
            </p>
            <p className="text-xs text-gray-500 mt-1">Please change your password after first login</p>
          </div>
        </form>
      </div>
    </div>
  );
}
