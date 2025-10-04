'use client';

import { useState, useEffect, useCallback } from 'react';
import { Invoice, PaginatedResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Edit, Trash2, FileText, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';
import { useTranslations } from '@/contexts/LocaleContext';

// Simple debounce function
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoicesData, setInvoicesData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { getAuthHeaders } = useAuth();
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');

  // Debounce search input
  const debouncedSetSearch = useCallback(
    debounce((search: string) => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, debouncedSearch]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const response = await fetch(`/api/invoices?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoicesData(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invoice');
      }

      // Refresh the invoices list
      fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (loading && !invoicesData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Invoices</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoaderSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Invoices</h1>
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
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and billing</p>
        </div>
        <Button onClick={() => router.push('/invoices/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search invoices by number, client, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {invoicesData && invoicesData.data.length === 0 && invoicesData.pagination.total > 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms.</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
      ) : !invoicesData || invoicesData.pagination.total === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first invoice.</p>
          <Button onClick={() => router.push('/invoices/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoice')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesData?.data.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium hover:text-blue-600">{invoice.number}</div>
                          {invoice.contactName && (
                            <div className="text-sm text-muted-foreground">
                              {t('contact')}: {invoice.contactName}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{invoice.client?.name || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(invoice.invoiceDate)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{formatCurrency(invoice.total)}</div>
                        {invoice.balanceDue > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {t('balance')}: {formatCurrency(invoice.balanceDue)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
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
            {invoicesData?.data.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 flex-1" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                    <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold hover:text-blue-600">{invoice.number}</h3>
                      <p className="text-sm text-muted-foreground">{invoice.client?.name || t('noClient')}</p>
                      {invoice.contactName && (
                        <p className="text-xs text-muted-foreground">
                          {t('contact')}: {invoice.contactName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('amount')}</div>
                    <div className="font-medium">{formatCurrency(invoice.total)}</div>
                    {invoice.balanceDue > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {t('balance')}: {formatCurrency(invoice.balanceDue)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('date')}</div>
                    <div className="font-medium">{formatDate(invoice.invoiceDate)}</div>
                    {invoice.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        {t('due')}: {formatDate(invoice.dueDate)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>{invoice.status}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {invoicesData && invoicesData.pagination.totalPages > 1 && (
            <Pagination
              currentPage={invoicesData.pagination.page}
              totalPages={invoicesData.pagination.totalPages}
              totalItems={invoicesData.pagination.total}
              itemsPerPage={invoicesData.pagination.limit}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
