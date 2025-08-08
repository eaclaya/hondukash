'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Invoice, UpdateInvoiceRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { toast } from 'sonner';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  const invoiceId = params.id as string;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch invoice');
      router.push('/invoices');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateInvoiceRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invoice');
      }

      // Redirect to invoice detail page
      router.push(`/invoices/${invoiceId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/invoices/${invoiceId}`);
  };

  if (fetchLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Invoice not found</div>
        </div>
      </div>
    );
  }

  return (
    <InvoiceForm
      invoice={invoice}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}