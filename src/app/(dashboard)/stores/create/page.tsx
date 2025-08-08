'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateStoreRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StoreForm } from '@/components/stores/StoreForm';

export default function CreateStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: CreateStoreRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create store');
      }

      await response.json();
      
      // Redirect to store list
      router.push('/stores');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/stores');
  };

  return (
    <StoreForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}
