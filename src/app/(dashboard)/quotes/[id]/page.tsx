'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Quote } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Edit, ArrowRight, FileText, Calendar, DollarSign, User, Building, Printer, Download } from 'lucide-react';
import Link from 'next/link';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const { getAuthHeaders } = useAuth();

  const quoteId = params.id as string;

  useEffect(() => {
    fetchQuote();
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote) return;

    if (!confirm('Are you sure you want to convert this quote to an invoice?')) {
      return;
    }

    try {
      setConverting(true);
      const response = await fetch(`/api/quotes/${quote.id}/convert`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          invoiceDate: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert quote');
      }

      const result = await response.json();
      alert(`Quote successfully converted to invoice ${result.invoiceNumber}`);
      
      // Refresh the quote to show updated status
      fetchQuote();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      sent: { variant: 'default' as const, label: 'Sent' },
      accepted: { variant: 'success' as const, label: 'Accepted' },
      declined: { variant: 'destructive' as const, label: 'Declined' },
      expired: { variant: 'outline' as const, label: 'Expired' },
      converted: { variant: 'success' as const, label: 'Converted' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN');
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote?.number || quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      alert('Error generating PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handlePrint = () => {
    window.open(`/quotes/${quoteId}/print`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading quote...</div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Error: {error || 'Quote not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Quote {quote.number}
          </h1>
          <p className="text-slate-600 mt-1">
            Quote details and line items
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {quote.status === 'accepted' && (
            <Button
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              {converting ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}
          <Link href={`/quotes/${quote.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Quote Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quote Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Client</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {quote.client?.name || quote.clientName}
                </p>
                {quote.client?.email && (
                  <p className="text-sm text-slate-600">{quote.client.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Quote Date</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {formatDate(quote.quoteDate)}
                </p>
                {quote.validUntil && (
                  <p className="text-sm text-slate-600">
                    Valid until: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <Building className="h-4 w-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <div>
                {getStatusBadge(quote.status)}
                {quote.convertedAt && (
                  <p className="text-sm text-slate-600 mt-2">
                    Converted: {formatDate(quote.convertedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        {item.productId && (
                          <p className="text-sm text-muted-foreground">
                            Product ID: {item.productId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quote Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Quote Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(quote.tax)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-{formatCurrency(quote.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(quote.notes || quote.terms) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quote.notes && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Notes</h4>
                <p className="text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Terms & Conditions</h4>
                <p className="text-slate-600 whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}