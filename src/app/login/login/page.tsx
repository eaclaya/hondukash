'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Button } from '@/components/ui/button';

export default function TenantLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { tenant } = useTenant();
  const { login } = useTenantAuth();
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
        // Use the authentication hook to handle login
        login({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          tenantId: data.tenant.id,
          domain: data.tenant.domain,
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

  if (tenant) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-blue-600">HonduKash ERP</h1>
          </div>
          <h2 className="text-3xl font-bold">Sign in to {tenant.name}</h2>
          <p className="mt-2 text-gray-600">Access your ERP dashboard</p>
          {tenant.meta?.plan && <p className="text-sm text-gray-500 capitalize">{tenant.meta.plan} Plan</p>}
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

          <div className="text-center">
            <p className="text-xs text-gray-400">Domain: {tenant.domain}</p>
            {tenant.databaseContext?.hasConnection && <p className="text-xs text-green-600">✓ Database connected</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
