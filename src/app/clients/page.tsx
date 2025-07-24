'use client';

import { useState, useEffect } from 'react';
import { Client, CreateClientRequest, UpdateClientRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Building, User, Phone, Mail, MapPin, Users, MoreVertical, CreditCard, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // Refresh the clients list
      fetchClients();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading clients...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Clients</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-600 mt-1">Manage your customers and their contacts</p>
        </div>
        <Button className="btn-primary-modern">
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        {/* Empty State */}
        <div className="card-modern p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No clients found</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">Get started by adding your first client to begin managing customer relationships.</p>
          <Button className="btn-primary-modern">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      ) : (
        {/* Clients Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <div key={client.id} className="card-modern p-6 space-y-4 group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                    client.clientType === 'company' 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-green-500 to-emerald-600'
                  }`}>
                    {client.clientType === 'company' ? (
                      <Building className="h-6 w-6 text-white" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500 capitalize font-medium">
                      {client.clientType === 'company' ? 'Company' : 'Individual'}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Client
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {client.primaryContactName && (
                <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="font-medium">{client.primaryContactName}</span>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{client.email}</span>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>{client.phone}</span>
                  </div>
                )}

                {(client.city || client.country) && (
                  <div className="flex items-center text-sm text-slate-600">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <span>
                      {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {client.clientType === 'company' && (
                <div className="space-y-2 text-sm bg-blue-50 p-3 rounded-xl">
                  {client.industry && (
                    <div className="text-slate-600">
                      <strong>Industry:</strong> {client.industry}
                    </div>
                  )}
                  {client.taxId && (
                    <div className="text-slate-600">
                      <strong>Tax ID:</strong> {client.taxId}
                    </div>
                  )}
                </div>
              )}

              {/* Business Information */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">L {client.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{client.paymentTerms} days</span>
                  </div>
                </div>
                <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                  client.isActive 
                    ? 'badge-success' 
                    : 'badge-error'
                }`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {client.discountPercentage > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                    Default discount: {(client.discountPercentage * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
                <span>Store ID: {client.storeId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}