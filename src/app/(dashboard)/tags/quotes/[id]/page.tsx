'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Tags, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EntityTagManager } from '@/components/tags';
import { Quote } from '@/lib/types';
import { toast } from 'sonner';

export default function QuoteTagsPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quoteId = parseInt(params.id as string);
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/${quoteId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const quoteData = await response.json();
        setQuote(quoteData);
      } else {
        toast.error('Failed to load quote');
        router.push('/quotes');
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      toast.error('Error loading quote');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const parseTagsFromString = (tagsString: string): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading quote...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">Quote not found</div>
      </div>
    );
  }

  const currentTags = parseTagsFromString(quote.tags || '');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/quotes/${quoteId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Quote</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Tags className="h-6 w-6" />
              <span>Quote Tags</span>
            </h1>
            <p className="text-slate-600">
              Manage tags for Quote #{quote.quoteNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Quote Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quote Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg">Quote #{quote.quoteNumber}</h3>
              <p className="text-slate-600 mt-1">Client: {quote.clientName}</p>
              <div className="flex items-center space-x-4 mt-3">
                <Badge 
                  variant={
                    quote.status === 'accepted' ? 'default' :
                    quote.status === 'sent' ? 'secondary' :
                    quote.status === 'declined' ? 'destructive' :
                    'outline'
                  }
                >
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </Badge>
                <span className="text-sm text-slate-500">
                  Created: {new Date(quote.quoteDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total:</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{formatCurrency(quote.total)}</span>
                </div>
              </div>
              
              {quote.validUntil && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="font-medium">
                    {new Date(quote.validUntil).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Items:</span>
                <span className="font-medium">{quote.items?.length || 0} items</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tags className="h-5 w-5" />
            <span>Tag Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EntityTagManager
            entityType="quote"
            entityId={quoteId}
            entityName={`Quote #${quote.quoteNumber} for ${quote.clientName}`}
            storeId={1} // TODO: Get actual store ID from context/props
            tags={currentTags}
            onTagsChanged={(updatedTags) => {
              // Update local quote state when tags change
              setQuote(prev => prev ? { ...prev, tags: JSON.stringify(updatedTags) } : null);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}