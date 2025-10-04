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
        let errorMessage = 'Failed to create invoice';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const result = await response.json();
      toast.success('Invoice created successfully');

      // Redirect to payment form for immediate payment processing
      router.push(`/invoices/${result.invoice.id}/payment`);
    } catch (error: unknown) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/invoices');
  };

  return <InvoiceForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />;
}
