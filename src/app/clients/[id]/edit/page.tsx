'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Client, UpdateClientRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import ClientForm from '@/components/clients/ClientForm';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setPageLoading(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const data = await response.json();
      setClient(data.client);
    } catch (error: any) {
      alert(error.message);
      router.push('/clients');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateClientRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      // Redirect to clients list
      router.push('/clients');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/clients');
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Client not found</div>
      </div>
    );
  }

  return (
    <ClientForm
      client={client}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}