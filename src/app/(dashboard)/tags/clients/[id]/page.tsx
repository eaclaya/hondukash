'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Tags } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EntityTagManager } from '@/components/tags';
import { Client } from '@/lib/types';
import { toast } from 'sonner';

export default function ClientTagsPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clientId = parseInt(params.id as string);
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
      } else {
        toast.error('Failed to load client');
        router.push('/clients');
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Error loading client');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">Client not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/clients/${clientId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Client</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Tags className="h-6 w-6" />
              <span>Client Tags</span>
            </h1>
            <p className="text-slate-600">
              Manage tags for {client.name}
            </p>
          </div>
        </div>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Client Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <p className="text-slate-600">{client.clientType === 'company' ? 'Company' : 'Individual'}</p>
              {client.email && (
                <p className="text-sm text-slate-500">{client.email}</p>
              )}
            </div>
            <div className="text-right">
              {client.phone && (
                <p className="text-sm">{client.phone}</p>
              )}
              {client.city && client.country && (
                <p className="text-sm text-slate-500">{client.city}, {client.country}</p>
              )}
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
            entityType="client"
            entityId={clientId}
            entityName={client.name}
            storeId={client.storeId}
            tags={client.tags || []}
            onTagsChanged={(updatedTags) => {
              // Update local client state when tags change
              setClient(prev => prev ? { ...prev, tags: updatedTags } : null);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}