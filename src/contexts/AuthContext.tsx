'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  storeId?: number;
}

interface TenantSession {
  userId: number;
  email: string;
  name: string;
  role: string;
  tenantId?: number;
  domain?: string;
  storeId?: number;
  token: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  session: TenantSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: TenantSession) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<TenantSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const storedSession = localStorage.getItem('tenant-session');
        if (storedSession) {
          const sessionData: TenantSession = JSON.parse(storedSession);
          
          // Check if session is still valid
          const now = new Date();
          const expiresAt = new Date(sessionData.expiresAt);
          
          if (expiresAt > now) {
            setSession(sessionData);
            setUser({
              id: sessionData.userId,
              email: sessionData.email,
              name: sessionData.name,
              role: sessionData.role,
              storeId: sessionData.storeId
            });
          } else {
            // Session expired, clear it
            localStorage.removeItem('tenant-session');
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('tenant-session');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = (sessionData: TenantSession) => {
    setSession(sessionData);
    setUser({
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name,
      role: sessionData.role,
      storeId: sessionData.storeId
    });

    // Store session in localStorage
    localStorage.setItem('tenant-session', JSON.stringify(sessionData));
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('tenant-session');
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }

    if (session?.storeId) {
      headers['X-Store-ID'] = session.storeId.toString();
    }

    return headers;
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}