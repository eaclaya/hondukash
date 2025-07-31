'use client';

import { useState, useEffect } from 'react';
import { useTenantAuth } from '@/hooks/useTenantAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Store, Check } from 'lucide-react';

interface Store {
  id: number;
  name: string;
  code?: string;
  role: string;
}

export default function StoreSwitcher() {
  const { user } = useTenantAuth();
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    console.log('user', user)
    if (user?.stores) {
      setStores(user.stores);

      // Get current store ID from localStorage or use first store as default
      const savedStoreId = localStorage.getItem('currentStoreId');
      if (savedStoreId) {
        setCurrentStoreId(parseInt(savedStoreId));
      } else if (user.stores.length > 0) {
        const firstStoreId = user.stores[0].id;
        setCurrentStoreId(firstStoreId);
        localStorage.setItem('currentStoreId', firstStoreId.toString());
      }
    }
  }, [user]);

  const handleStoreSwitch = (storeId: number) => {
    setCurrentStoreId(storeId);
    localStorage.setItem('currentStoreId', storeId.toString());

    // Reload the page to refresh data with new store context
    window.location.reload();
  };

  const currentStore = stores.find(store => store.id === currentStoreId);

  if (!stores.length) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>No stores available</span>
      </div>
    );
  }

  if (stores.length === 1) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Store className="h-4 w-4" />
        <span>{currentStore?.name || stores[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Store className="h-4 w-4" />
          <span className="hidden md:inline">{currentStore?.name || 'Select Store'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onClick={() => handleStoreSwitch(store.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{store.name}</span>
            </div>
            {currentStoreId === store.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}