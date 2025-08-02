'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateQuoteRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quote');
      }

      const result = await response.json();
      
      // Redirect to quote list
      router.push('/quotes');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/quotes');
  };

  return (
    <QuoteForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}