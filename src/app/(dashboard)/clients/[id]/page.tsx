'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Client, ClientContact } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Globe,
  FileText,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchClient();
    fetchContacts();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client');
      }

      const data = await response.json();
      setClient(data.client);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch client');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
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

      router.push('/clients');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete client');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Client not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/clients')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Clients</span>
          </Button>
          <div className="flex items-center space-x-3">
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
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-slate-600 capitalize">
                {client.clientType === 'company' ? 'Company' : 'Individual'} Client
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.primaryContactName && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.primaryContactName}</p>
                      <p className="text-sm text-slate-600">Primary Contact</p>
                    </div>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.email}</p>
                      <p className="text-sm text-slate-600">Email</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.phone}</p>
                      <p className="text-sm text-slate-600">Phone</p>
                    </div>
                  </div>
                )}

                {client.mobile && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{client.mobile}</p>
                      <p className="text-sm text-slate-600">Mobile</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.address || client.city || client.country ? (
                  <div className="space-y-2">
                    {client.address && (
                      <p className="text-slate-900">{client.address}</p>
                    )}
                    <p className="text-slate-600">
                      {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                    </p>
                    {client.postalCode && (
                      <p className="text-slate-600">{client.postalCode}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No address information</p>
                )}
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Financial Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Credit Limit</span>
                  <span className="font-semibold">L {client.creditLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Payment Terms</span>
                  <span className="font-semibold">{client.paymentTerms} days</span>
                </div>
                {client.discountPercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Default Discount</span>
                    <span className="font-semibold text-blue-600">
                      {(client.discountPercentage * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    client.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Details */}
          {client.clientType === 'company' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {client.companyRegistrationNumber && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Registration Number</p>
                      <p className="font-medium text-slate-900">{client.companyRegistrationNumber}</p>
                    </div>
                  )}
                  {client.industry && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Industry</p>
                      <p className="font-medium text-slate-900">{client.industry}</p>
                    </div>
                  )}
                  {client.website && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Website</p>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Visit Website</span>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Record Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-slate-600 mb-1">Created</p>
                  <p className="font-medium text-slate-900">
                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Last Updated</p>
                  <p className="font-medium text-slate-900">
                    {new Date(client.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Store ID</p>
                  <p className="font-medium text-slate-900">{client.storeId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Client Contacts</span>
                </div>
                <Button size="sm" className="btn-primary-modern">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg">Loading contacts...</div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No contacts found</h3>
                  <p className="text-slate-600 mb-4">Add contacts to manage communication with this client.</p>
                  <Button className="btn-primary-modern">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{contact.contactName}</h4>
                            <p className="text-sm text-slate-600">{contact.jobTitle || contact.contactType}</p>
                          </div>
                          {contact.isPrimary && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        {contact.email && (
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.department && (
                          <div className="text-slate-600">
                            <strong>Department:</strong> {contact.department}
                          </div>
                        )}
                      </div>

                      {contact.canMakePurchases && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600">✓ Can make purchases</span>
                            {contact.purchaseLimit && (
                              <span className="text-slate-600">
                                Limit: L {contact.purchaseLimit.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No transactions found</h3>
                <p className="text-slate-600">Transaction history will appear here once invoices are created.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}