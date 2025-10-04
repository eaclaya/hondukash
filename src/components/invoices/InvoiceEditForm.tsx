'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, Client, Product, UpdateInvoiceRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import SimpleTagSelector from '@/components/tags/SimpleTagSelector';

interface InvoiceItemForm {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  total: number;
}

interface InvoiceEditFormProps {
  invoice: Invoice;
  onSubmit: (data: UpdateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export default function InvoiceEditForm({ invoice, onSubmit, onCancel, loading }: InvoiceEditFormProps) {
  const { getAuthHeaders } = useAuth();
  const [selectedClient, setSelectedClient] = useState<Client | null>(invoice.client || null);
  const [clientSearch, setClientSearch] = useState(invoice.client?.name || '');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);

  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(invoice.tags || []);

  const [formData, setFormData] = useState({
    notes: invoice.notes || '',
    terms: invoice.terms || ''
  });

  // Convert invoice items to form items
  useEffect(() => {
    if (invoice.items && invoice.items.length > 0) {
      const convertedItems: InvoiceItemForm[] = invoice.items.map((item) => ({
        productId: parseInt(item.productId) || 0,
        sku: '', // Will be populated when we fetch product details
        productName: item.productName || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        taxRateId: item.taxRateId,
        taxRate: item.taxRate || 0,
        taxAmount: item.taxAmount || 0,
        lineTotal: item.lineTotal || 0,
        total: item.total || 0
      }));
      setItems(convertedItems);
    }
  }, [invoice]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  // Client search functionality
  const handleClientSearchChange = async (value: string) => {
    setClientSearch(value);
    setSelectedClientIndex(-1);

    if (value.length < 2) {
      setClientResults([]);
      setShowClientDropdown(false);
      return;
    }

    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(value)}&limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // The API returns paginated data structure
        setClientResults(data.data || []);
        setShowClientDropdown(true);
      } else {
        console.error('Client search failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Client search error:', error);
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientDropdown(false);
    setClientResults([]);
  };

  // Product search for new items
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=20`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProductResults(data.products || []);
      }
    } catch (error) {
      console.error('Product search error:', error);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const tax = items.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItemForm = {
      productId: 0,
      sku: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 15, // Default 15% (stored as percentage)
      taxAmount: 0,
      lineTotal: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  // Remove item with confirmation and API call
  const removeItem = async (index: number) => {
    const item = items[index];
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.productName}" from this invoice?`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      // Create updated items list without the deleted item
      const updatedItems = items.filter((_, i) => i !== index);
      
      // Calculate new totals
      const subtotal = updatedItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
      const tax = updatedItems.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
      const total = subtotal + tax;

      // Prepare the update request
      const submitData: UpdateInvoiceRequest = {
        id: parseInt(invoice.id),
        clientId: selectedClient?.id || parseInt(invoice.clientId),
        clientName: selectedClient?.name || invoice.clientName || '',
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        items: updatedItems
          .filter((item) => item.productName)
          .map((item) => ({
            productId: item.productId || 0,
            sku: item.sku,
            description: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          })),
        subtotal,
        tax,
        total,
        tags: selectedTags
      };

      // Make API call to update invoice
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete item');
      }

      // Update local state on success
      setItems(updatedItems);
      toast.success('Item deleted successfully');

    } catch (error: unknown) {
      console.error('Delete item error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      toast.error(errorMessage);
    }
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate totals for this item
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = newItems[index];
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;

      const lineTotal = quantity * unitPrice;
      const taxAmount = lineTotal * (taxRate / 100);
      const total = lineTotal + taxAmount;

      newItems[index] = {
        ...newItems[index],
        lineTotal,
        taxAmount,
        total
      };
    }

    setItems(newItems);
  };

  // Handle product selection for an item
  const selectProductForItem = (index: number, product: Product) => {
    updateItem(index, 'productId', product.id);
    updateItem(index, 'sku', product.sku || '');
    updateItem(index, 'productName', product.name);
    updateItem(index, 'unitPrice', product.price);
    // Tax rate will be recalculated automatically
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (items.length === 0 || items.every((item) => !item.productName)) {
      toast.error('Please add at least one item');
      return;
    }

    const totals = calculateTotals();

    const submitData: UpdateInvoiceRequest = {
      id: parseInt(invoice.id),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      items: items
        .filter((item) => item.productName)
        .map((item) => ({
          productId: item.productId || 0,
          sku: item.sku,
          description: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      tags: selectedTags
    };

    await onSubmit(submitData);
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onCancel} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Edit Invoice {invoice.number}</h1>
            <p className="text-slate-600">Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString('es-HN')}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={true} className="opacity-50 cursor-not-allowed">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="client-search">Client *</Label>
                <Input
                  id="client-search"
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onFocus={() => {
                    if (clientResults.length > 0) {
                      setShowClientDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowClientDropdown(false), 200);
                  }}
                  placeholder="Search clients..."
                  autoComplete="off"
                  disabled={true}
                  className="bg-gray-50"
                />
                {showClientDropdown && clientResults.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto top-full">
                    {clientResults.map((client, index) => (
                      <div
                        key={client.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                          index === selectedClientIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => selectClient(client)}
                      >
                        <div className="font-medium">{client.name}</div>
                        {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm" disabled={true} className="opacity-50 cursor-not-allowed">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        placeholder="Product name"
                        disabled={true}
                        className="bg-gray-50"
                      />
                    </TableCell>
                    <TableCell>
                      <NumericInput
                        value={item.quantity.toString()}
                        onValueChange={(value) => updateItem(index, 'quantity', value || 0)}
                        allowDecimals={true}
                        maxDecimals={4}
                        allowNegative={false}
                        className="w-20 bg-gray-50"
                        disabled={true}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericInput
                        value={item.unitPrice.toString()}
                        onValueChange={(value) => updateItem(index, 'unitPrice', value || 0)}
                        allowDecimals={true}
                        maxDecimals={4}
                        allowNegative={false}
                        className="w-24 bg-gray-50"
                        disabled={true}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericInput
                        value={((item.taxRate || 0) * 100).toString()}
                        onValueChange={(value) => updateItem(index, 'taxRate', value || 0)}
                        allowDecimals={true}
                        maxDecimals={4}
                        allowNegative={false}
                        className="w-20 bg-gray-50"
                        placeholder="15"
                        disabled={true}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{formatCurrency(item.total || 0)}</span>
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Invoice notes..."
                rows={3}
                disabled={true}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData((prev) => ({ ...prev, terms: e.target.value }))}
                placeholder="Payment terms and conditions..."
                rows={3}
                disabled={true}
                className="bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTagSelector entityType="invoice" selectedTags={selectedTags} onTagsChange={setSelectedTags} />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
