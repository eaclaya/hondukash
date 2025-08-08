'use client';

import { useState, useEffect } from 'react';
import { Store, PaginatedResponse } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Edit, Trash2, MapPin, Phone, Mail, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchStores();
  }, [currentPage, searchTerm]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchStores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/stores?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }

      const data: PaginatedResponse<Store> = await response.json();
      setStores(data.data || []);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId: number) => {
    if (!confirm('Are you sure you want to delete this store?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete store');
      }

      // Refresh the stores list
      fetchStores();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete store');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Stores</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading stores...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Stores</h1>
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
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-muted-foreground">Manage your store locations and settings</p>
        </div>
        <Link href="/stores/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search stores by name, code, location, manager, or currency..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {stores.length === 0 && !loading && searchTerm ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No stores found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms.</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
      ) : stores.length === 0 && !loading ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No stores found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first store location.</p>
          <Link href="/stores/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
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
                  <TableHead>Store</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Currency & Tax</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{store.name}</div>
                        {store.code && <div className="text-sm text-muted-foreground">Code: {store.code}</div>}
                        {store.description && <div className="text-sm text-muted-foreground">{store.description}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {store.managerName && (
                          <div className="text-sm">{store.managerName}</div>
                        )}
                        {store.email && (
                          <div className="text-sm text-muted-foreground">{store.email}</div>
                        )}
                        {store.phone && (
                          <div className="text-sm text-muted-foreground">{store.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {store.location || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{store.currency}</div>
                        <div className="text-xs text-muted-foreground">{(store.taxRate * 100).toFixed(1)}% tax</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex px-2 py-1 text-xs rounded-full ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {store.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/stores/${store.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(store.id)}
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
            {stores.map((store) => (
              <div key={store.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{store.name}</h3>
                    {store.code && <p className="text-sm text-muted-foreground">Code: {store.code}</p>}
                  </div>
                  <div className="flex space-x-1">
                    <Link href={`/stores/${store.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(store.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {store.description && <p className="text-sm text-muted-foreground">{store.description}</p>}

                <div className="space-y-2 text-sm">
                  {store.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{store.location}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{store.email}</span>
                    </div>
                  )}
                  {store.managerName && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{store.managerName}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    {store.currency} • {(store.taxRate * 100).toFixed(1)}% tax
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {store.isActive ? 'Active' : 'Inactive'}
                  </div>
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

    </div>
  );
}
