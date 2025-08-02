'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quote, UpdateQuoteRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import QuoteForm from '@/components/quotes/QuoteForm';

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const quoteId = params.id as string;

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }

      const data = await response.json();
      setQuote(data.quote);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateQuoteRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quote');
      }

      await response.json();
      
      // Redirect to quote list
      router.push('/quotes');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/quotes');
  };

  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading quote...</div>
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

  if (!quote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Quote not found</div>
        </div>
      </div>
    );
  }

  return (
    <QuoteForm
      quote={quote}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}