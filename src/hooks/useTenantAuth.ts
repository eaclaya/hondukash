'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TenantUser {
  id: number;
  email: string;
  name: string;
  role: string;
  tenantId: number;
  domain: string;
  token: string;
  expiresAt: string;
}

export function useTenantAuth() {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const sessionData = localStorage.getItem('tenant-session');
      
      if (!sessionData) {
        setIsLoading(false);
        return;
      }

      const session = JSON.parse(sessionData);
      
      // Check if token is expired
      if (new Date(session.expiresAt) <= new Date()) {
        logout();
        return;
      }

      setUser(session);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (sessionData: TenantUser) => {
    localStorage.setItem('tenant-session', JSON.stringify(sessionData));
    setUser(sessionData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('tenant-session');
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const getAuthHeaders = () => {
    if (!user?.token) return {};
    
    return {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json'
    };
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const hasRole = (requiredRole: string) => {
    return user?.role === requiredRole || user?.role === 'admin';
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getAuthHeaders,
    isAdmin,
    hasRole,
    checkAuth
  };
}