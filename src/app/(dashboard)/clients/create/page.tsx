'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateClientRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ClientForm from '@/components/clients/ClientForm';

export default function CreateClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: CreateClientRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      // Redirect to clients list
      router.push('/clients');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/clients');
  };

  return (
    <ClientForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}