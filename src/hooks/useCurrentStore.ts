'use client';

import { useState, useEffect } from 'react';
import { useTenantAuth } from '@/hooks/useTenantAuth';

interface Store {
  id: number;
  name: string;
  code?: string;
  role: string;
}

export function useCurrentStore() {
  const { user } = useTenantAuth();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.stores) {
      // Get current store ID from localStorage or use first store as default
      const savedStoreId = localStorage.getItem('currentStoreId');
      let storeId: number;

      if (savedStoreId) {
        storeId = parseInt(savedStoreId);
      } else if (user.stores.length > 0) {
        storeId = user.stores[0].id;
        localStorage.setItem('currentStoreId', storeId.toString());
      } else {
        return;
      }

      const store = user.stores.find(s => s.id === storeId);
      if (store) {
        setCurrentStore(store);
        setCurrentStoreId(storeId);
      }
    }
  }, [user]);

  return {
    currentStore,
    currentStoreId,
    stores: user?.stores || []
  };
}

// Utility function to get current store ID (works in both client and server components)
export function getCurrentStoreId(): number | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, can't access localStorage
  }

  const savedStoreId = localStorage.getItem('currentStoreId');
  return savedStoreId ? parseInt(savedStoreId) : null;
}