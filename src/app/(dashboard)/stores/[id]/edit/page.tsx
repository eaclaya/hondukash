'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Store, UpdateStoreRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { StoreForm } from '@/components/stores/StoreForm';

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const storeId = params.id as string;

  useEffect(() => {
    fetchStore();
  }, [storeId]);

  const fetchStore = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/stores/${storeId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch store');
      }

      const data = await response.json();
      setStore(data.store);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateStoreRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update store');
      }

      const result = await response.json();
      
      // Redirect to store list
      router.push('/stores');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/stores');
  };

  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading store...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Store not found</div>
        </div>
      </div>
    );
  }

  return (
    <StoreForm
      store={store}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}