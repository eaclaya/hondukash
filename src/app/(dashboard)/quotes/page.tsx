'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quote, PaginatedResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations } from '@/contexts/LocaleContext';

export default function QuotesPage() {
  const router = useRouter();
  const t = useTranslations('quotes');
  const tCommon = useTranslations('common');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [converting, setConverting] = useState(false);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchQuotes();
  }, [currentPage, searchTerm]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchQuotes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/quotes?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(t('failedToFetchQuotes'));
      }

      const data: PaginatedResponse<Quote> = await response.json();
      setQuotes(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quoteId: string) => {
    if (!confirm(t('confirmDeleteQuote'))) {
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failedToDeleteQuote'));
      }

      // Refresh the quotes list
      fetchQuotes();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('failedToDeleteQuote'));
    }
  };

  const openConvertDialog = (quote: Quote) => {
    setConvertingQuote(quote);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setConvertDialogOpen(true);
  };

  const handleConvertToInvoice = async () => {
    if (!convertingQuote) return;

    try {
      setConverting(true);
      const response = await fetch(`/api/quotes/${convertingQuote.id}/convert`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          invoiceDate: invoiceDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failedToConvertQuote'));
      }

      const result = await response.json();
      toast.success(t('quoteSuccessfullyConverted', { invoiceNumber: result.invoiceNumber }));
      
      // Close dialog and refresh the quotes list
      setConvertDialogOpen(false);
      setConvertingQuote(null);
      fetchQuotes();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('failedToConvertQuote'));
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: t('draft') },
      sent: { variant: 'default' as const, label: t('sent') },
      accepted: { variant: 'success' as const, label: t('accepted') },
      declined: { variant: 'destructive' as const, label: t('declined') },
      expired: { variant: 'outline' as const, label: t('expired') },
      converted: { variant: 'success' as const, label: t('converted') }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('quotes')}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading quotes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quotes</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">Manage your price quotes and proposals</p>
        </div>
        <Link href="/quotes/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Quote
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search quotes by number, client, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {quotes.length === 0 && !loading && searchTerm ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms.</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
      ) : quotes.length === 0 && !loading ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first quote.</p>
          <Link href="/quotes/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('quoteNumber')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('validUntil')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/quotes/${quote.id}`)}>
                    <TableCell>
                      <div className="font-medium">{quote.number}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.client?.name || quote.clientName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(quote.quoteDate)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {quote.validUntil ? formatDate(quote.validUntil) : '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(quote.total)}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {quote.status === 'accepted' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConvertDialog(quote)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/quotes/${quote.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quote.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid gap-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/quotes/${quote.id}`)}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{quote.number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {quote.client?.name || quote.clientName}
                    </p>
                  </div>
                  <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    {quote.status === 'accepted' && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => openConvertDialog(quote)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Link href={`/quotes/${quote.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quote.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('date')}:</span>
                    <div>{formatDate(quote.quoteDate)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('validUntil')}:</span>
                    <div>{quote.validUntil ? formatDate(quote.validUntil) : '—'}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="font-medium">
                    {formatCurrency(quote.total)}
                  </div>
                  {getStatusBadge(quote.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      )}

      {/* Convert Quote to Invoice Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('convertQuoteToInvoice')}</DialogTitle>
            <DialogDescription>
              {t('convertQuoteDescription', { quoteNumber: convertingQuote?.number })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-date">{t('invoiceDate')}</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            {convertingQuote && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('client')}:</span>
                  <span className="text-sm font-medium">
                    {convertingQuote.client?.name || convertingQuote.clientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('quoteAmount')}:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(convertingQuote.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('quoteDate')}:</span>
                  <span className="text-sm font-medium">
                    {formatDate(convertingQuote.quoteDate)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
              disabled={converting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleConvertToInvoice}
              disabled={converting || !invoiceDate}
              className="bg-green-600 hover:bg-green-700"
            >
              {converting ? t('converting') : t('convertToInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}