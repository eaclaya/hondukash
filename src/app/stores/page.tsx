'use client';

import { useState, useEffect } from 'react';
import { Store, CreateStoreRequest, UpdateStoreRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { StoreForm } from '@/components/stores/StoreForm';
import { Plus, Edit, Trash2, MapPin, Phone, Mail, User, Store as StoreIcon, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stores', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      
      const data = await response.json();
      setStores(data.stores || []);
    } catch (error: any) {
      setError(error.message);
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
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreateStore = () => {
    setEditingStore(null);
    setShowForm(true);
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateStoreRequest | UpdateStoreRequest) => {
    setFormLoading(true);
    
    try {
      const url = editingStore ? `/api/stores/${editingStore.id}` : '/api/stores';
      const method = editingStore ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save store');
      }

      // Close form and refresh list
      setShowForm(false);
      setEditingStore(null);
      fetchStores();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingStore(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stores</h1>
          <p className="text-slate-600 mt-1">Manage your store locations and settings</p>
        </div>
        <Button onClick={handleCreateStore} className="btn-primary-modern">
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </div>

      {stores.length === 0 ? (
        {/* Empty State */}
        <div className="card-modern p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <StoreIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No stores found</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">Get started by creating your first store location to begin managing your business operations.</p>
          <Button onClick={handleCreateStore} className="btn-primary-modern">
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </div>
      ) : (
        {/* Stores Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <div key={store.id} className="card-modern p-6 space-y-4 group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <StoreIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{store.name}</h3>
                    {store.code && (
                      <p className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md inline-block">
                        {store.code}
                      </p>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditStore(store)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Store
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(store.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Store
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {store.description && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{store.description}</p>
              )}

              {/* Store Details */}
              <div className="space-y-3">
                {store.location && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{store.location}</span>
                  </div>
                )}

                {store.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{store.phone}</span>
                  </div>
                )}

                {store.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{store.email}</span>
                  </div>
                )}

                {store.managerName && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{store.managerName}</span>
                  </div>
                )}
              </div>

              {/* Store Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-slate-600">{store.currency}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-slate-600">{(store.taxRate * 100).toFixed(1)}% tax</span>
                  </div>
                </div>
                <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                  store.isActive 
                    ? 'badge-success' 
                    : 'badge-error'
                }`}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Invoice Info */}
              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Next: {store.invoicePrefix}-{store.invoiceCounter.toString().padStart(4, '0')}</span>
                <span>Created: {new Date(store.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StoreForm
          store={editingStore || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}
    </div>
  );
}