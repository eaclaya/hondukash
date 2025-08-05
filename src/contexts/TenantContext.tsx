'use client';

import { abort } from 'process';
import { createContext, useContext, useEffect, useState } from 'react';

interface TenantDatabaseContext {
  url?: string;
  hasConnection: boolean;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  database: string;
  isActive: boolean;
  meta?: unknown;
  databaseContext: TenantDatabaseContext;
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
  connectToTenantDb: () => Promise<unknown>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to connect to tenant database
  const connectToTenantDb = async () => {
    if (!tenant?.domain) {
      throw new Error('No tenant domain available');
    }

    try {
      // This would be used by other parts of the app to get a database connection
      const response = await fetch('/api/tenant/db-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: tenant.domain })
      });

      if (!response.ok) {
        throw new Error('Failed to get database connection');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to connect to tenant database:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Get tenant from headers or local detection
    const detectTenant = async () => {
      const startTime = Date.now();
      const minLoadingTime = 500; // Minimum 500ms loading time

      try {
        // Only detect tenant if we're on a subdomain, not on main domain or www
        const hostname = window.location.hostname;
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
        
        // Check if this is the naked domain or www subdomain
        const isMainDomain = hostname === appDomain || hostname === `www.${appDomain}` || 
                           hostname.includes('localhost') || hostname.includes('127.0.0.1');

        // Check if this is a tenant subdomain (excluding www)
        const isTenantSubdomain = hostname.endsWith(`.${appDomain}`) && 
                                 hostname !== appDomain && 
                                 hostname !== `www.${appDomain}`;

        // Skip tenant detection for specific routes
        const skipTenantRoutes = ['/not-found', '/admin'];
        const shouldSkipTenant = isMainDomain || 
                                !isTenantSubdomain || 
                                skipTenantRoutes.some(route => window.location.pathname.startsWith(route));

        if (shouldSkipTenant) {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsed);
          setTimeout(() => setIsLoading(false), remainingTime);
          return;
        }

        const response = await fetch('/api/tenant/current');

        if (response.ok) {
          const tenantData = await response.json();
          setTenant(tenantData);
        } else {
          // window.location.href = '/not-found';
        }
      } catch (error) {
        console.error('Failed to detect tenant:', error);
      } finally {
        // Ensure minimum loading time has passed
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    detectTenant();
  }, []);

  return <TenantContext.Provider value={{ tenant, setTenant, isLoading, connectToTenantDb }}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
