'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateInvoiceRequest, UpdateInvoiceRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: CreateInvoiceRequest | UpdateInvoiceRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const result = await response.json();
      
      // Redirect to invoice detail page
      router.push(`/invoices/${result.invoice.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/invoices');
  };

  return (
    <InvoiceForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}