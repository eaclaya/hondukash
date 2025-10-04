'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Invoice } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';
import PaymentForm from '@/components/invoices/PaymentForm';

export default function InvoicePaymentPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  const invoiceId = params.id as string;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invoice');
      }

      const data = await response.json();
      const fetchedInvoice = data.invoice;
      
      // Check if invoice can accept payments
      if (fetchedInvoice.status === 'paid') {
        toast.error('This invoice has already been paid in full');
        router.push(`/invoices/${invoiceId}`);
        return;
      }
      
      if (fetchedInvoice.status === 'cancelled') {
        toast.error('Cannot process payment for cancelled invoice');
        router.push(`/invoices/${invoiceId}`);
        return;
      }

      if (fetchedInvoice.balanceDue <= 0) {
        toast.error('This invoice has no balance due');
        router.push(`/invoices/${invoiceId}`);
        return;
      }

      setInvoice(fetchedInvoice);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch invoice');
      router.push('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    toast.success('Payment processed successfully');
    router.push(`/invoices/${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg"><LoaderSpinner /></div>
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
    <PaymentForm 
      invoice={invoice} 
      onPaymentSuccess={handlePaymentSuccess}
    />
  );
}