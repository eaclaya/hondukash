'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateQuoteRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import QuoteForm from '@/components/quotes/QuoteForm';

export default function CreateQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: CreateQuoteRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create quote';
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

      toast.success('Quote created successfully');

      // Redirect to quote list
      router.push('/quotes');
    } catch (error: unknown) {
      console.error('Submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create quote';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/quotes');
  };

  return <QuoteForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />;
}
