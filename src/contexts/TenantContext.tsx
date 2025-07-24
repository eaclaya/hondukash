'use client';

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
  meta?: any;
  databaseContext: TenantDatabaseContext;
}

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
  connectToTenantDb: () => Promise<any>;
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
      try {
        // Only detect tenant if we're on a subdomain, not on main domain
        const hostname = window.location.hostname;
        const isSubdomain = hostname.split('.').length > 2 || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));

        // Skip tenant detection for main domain/admin
        if (!isSubdomain || window.location.pathname.startsWith('/admin')) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/tenant/current');
        if (response.ok) {
          const tenantData = await response.json();
          setTenant(tenantData);
        }
      } catch (error) {
        console.error('Failed to detect tenant:', error);
      } finally {
        setIsLoading(false);
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
