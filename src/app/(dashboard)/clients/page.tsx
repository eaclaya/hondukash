'use client';

import { useState, useEffect, useCallback } from 'react';
import { Client, PaginatedResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Edit, Trash2, Building, User, Phone, Mail, MapPin, Users, Search } from 'lucide-react';
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

export default function ClientsPage() {
  const router = useRouter();
  const t = useTranslations('clients');
  const tCommon = useTranslations('common');
  const [clientsData, setClientsData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { getAuthHeaders } = useAuth();

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
    fetchClients();
  }, [currentPage, debouncedSearch]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const response = await fetch(`/api/clients?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(t('failedToFetchClients'));
      }

      const data = await response.json();
      setClientsData(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: number) => {
    if (!confirm(t('confirmDeleteClient'))) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('failedToDeleteClient'));
      }

      // Refresh the clients list
      fetchClients();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('failedToDeleteClient'));
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('clients')}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">{tCommon('error')}: {error}</div>
        </div>
      </div>
    );
  }

  if (loading && !clientsData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('clients')}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoaderSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('clients')}</h1>
          <p className="text-muted-foreground">{t('manageCustomersAndContacts')}</p>
        </div>
        <Button onClick={() => router.push('/clients/create')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addClient')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('searchClientsPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {clientsData && clientsData.data.length === 0 && clientsData.pagination.total > 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noClientsFound')}</h3>
          <p className="text-muted-foreground mb-4">{t('tryAdjustingSearchTerms')}</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            {tCommon('clearSearch')}
          </Button>
        </div>
      ) : !clientsData || clientsData.pagination.total === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noClientsFound')}</h3>
          <p className="text-muted-foreground mb-4">{t('getStartedAddingFirstClient')}</p>
          <Button onClick={() => router.push('/clients/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addClient')}
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('contact')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead>{t('creditLimit')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsData?.data.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/clients/${client.id}`)}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${client.clientType === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                        >
                          {client.clientType === 'company' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium hover:text-blue-600">{client.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{client.clientType}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.primaryContactName && (
                          <div className="text-sm">{client.primaryContactName}</div>
                        )}
                        {client.email && (
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        )}
                        {client.phone && (
                          <div className="text-sm text-muted-foreground">{client.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {[client.city, client.state, client.country].filter(Boolean).join(', ') || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">${client.creditLimit.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{client.paymentTerms} days</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {client.isActive ? t('active') : t('inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/clients/${client.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
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
            {clientsData?.data.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div
                    className="flex items-start space-x-3 flex-1"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <div
                      className={`p-2 rounded-full ${client.clientType === 'company' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}
                    >
                      {client.clientType === 'company' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-semibold hover:text-blue-600">{client.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{client.clientType}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/clients/${client.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {client.primaryContactName && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.primaryContactName}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {(client.city || client.country) && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{[client.city, client.state, client.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('credit')}: ${client.creditLimit.toLocaleString()}
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {client.isActive ? t('active') : t('inactive')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {clientsData && clientsData.pagination.totalPages > 1 && (
            <Pagination
              currentPage={clientsData.pagination.page}
              totalPages={clientsData.pagination.totalPages}
              totalItems={clientsData.pagination.total}
              itemsPerPage={clientsData.pagination.limit}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
