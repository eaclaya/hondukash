'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, Client, ProductWithInventory, TaxRate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Tags } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EntityTagManager } from '@/components/tags';
import SimpleTagSelector from '@/components/tags/SimpleTagSelector';
import { toast } from 'sonner';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface InvoiceItemForm {
  productId: number | null;
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

export default function InvoiceForm({ invoice, onSubmit, onCancel, loading = false }: InvoiceFormProps) {
  const { getAuthHeaders } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [productResults, setProductResults] = useState<ProductWithInventory[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);
  const [clientSearchTimeout, setClientSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [productSearchTimeout, setProductSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    clientId: invoice?.clientId ? parseInt(invoice.clientId) : null,
    clientName: invoice?.clientName || '',
    invoiceDate: invoice?.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || '',
    notes: invoice?.notes || '',
    terms: invoice?.terms || '',
    status: invoice?.status || 'draft' as const,
    tags: invoice?.tags || ''
  });

  // Parse existing tags
  const parseTagsFromString = (tagsString: string): string[] => {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  };

  const [selectedTags, setSelectedTags] = useState<string[]>(
    invoice ? parseTagsFromString(invoice.tags || '') : []
  );

  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState<TaxRate | null>(null);
  const [globalTaxRate, setGlobalTaxRate] = useState(0.15); // 15% default global tax rate
  const [useGlobalTax, setUseGlobalTax] = useState(false); // Enable/disable global tax

  useEffect(() => {
    // Auto-focus client search on component mount
    const clientInput = document.getElementById('client-search') as HTMLInputElement;
    if (clientInput) {
      clientInput.focus();
    }

    // Fetch tax rates
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      const response = await fetch('/api/tenant/tax-rates', {
        headers: await getAuthHeaders()
      });
      if (response.ok) {
        const taxRatesData = await response.json();
        setTaxRates(taxRatesData);
        const defaultRate = taxRatesData.find((rate: TaxRate) => rate.isDefault);
        if (defaultRate) {
          setDefaultTaxRate(defaultRate);
          setGlobalTaxRate(defaultRate.rate / 100);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tax rates:', error);
    }
  };

  // Helper function to calculate tax for an item
  const calculateItemTotals = (quantity: number, unitPrice: number, taxRate: number) => {
    const lineTotal = quantity * unitPrice;
    const taxAmount = lineTotal * taxRate;
    const total = lineTotal + taxAmount;
    return { lineTotal, taxAmount, total };
  };

  // Helper function to get default tax rate for a product
  const getProductTaxRate = (product: ProductWithInventory): number => {
    if (useGlobalTax) {
      return globalTaxRate;
    }
    if (product.taxRate !== undefined) {
      return product.taxRate / 100; // Convert percentage to decimal
    }
    return globalTaxRate; // Use global rate as fallback
  };

  // Function to update all item taxes when global tax changes
  const updateAllItemTaxes = (newGlobalTax: number) => {
    if (!useGlobalTax) return;

    const updatedItems = items.map(item => {
      const { lineTotal, taxAmount, total } = calculateItemTotals(
        item.quantity,
        item.unitPrice,
        newGlobalTax
      );

      return {
        ...item,
        taxRate: newGlobalTax,
        taxAmount,
        lineTotal,
        total
      };
    });

    setItems(updatedItems);
  };

  // Function to toggle global tax and update all items
  const handleGlobalTaxToggle = (enabled: boolean) => {
    setUseGlobalTax(enabled);

    if (enabled) {
      // Apply global tax to all items
      updateAllItemTaxes(globalTaxRate);
    } else {
      // Revert to individual product tax rates
      const updatedItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const taxRate = product?.taxRate !== undefined ? product.taxRate / 100 : (defaultTaxRate?.rate ? defaultTaxRate.rate / 100 : globalTaxRate);

        const { lineTotal, taxAmount, total } = calculateItemTotals(
          item.quantity,
          item.unitPrice,
          taxRate
        );

        return {
          ...item,
          taxRate,
          taxAmount,
          lineTotal,
          total
        };
      });

      setItems(updatedItems);
    }
  };

  // Function to handle global tax rate change
  const handleGlobalTaxChange = (newRate: number) => {
    setGlobalTaxRate(newRate);
    if (useGlobalTax) {
      updateAllItemTaxes(newRate);
    }
  };

  // Set initial selected client if editing
  useEffect(() => {
    if (invoice && formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client) {
        setSelectedClient(client);
        setClientSearch(client.name);
      }
    }
  }, [invoice, formData.clientId, clients]);

  const searchClients = async (searchTerm: string) => {
    if (searchTerm.trim() === '') {
      setClientResults([]);
      setShowClientDropdown(false);
      return;
    }

    try {
      setLoadingClients(true);
      const response = await fetch(`/api/clients?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClientResults(data.data || []);
        setShowClientDropdown(true);
        setSelectedClientIndex(-1);
      }
    } catch (error) {
      console.error('Failed to search clients:', error);
      setClientResults([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const searchProducts = async (searchTerm: string) => {
    if (searchTerm.trim() === '') {
      setProductResults([]);
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProductResults(data.data || []);
      }
    } catch (error) {
      console.error('Failed to search products:', error);
      setProductResults([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Debounced client search
  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);

    if (clientSearchTimeout) {
      clearTimeout(clientSearchTimeout);
    }

    const timeout = setTimeout(() => {
      searchClients(value);
    }, 300);

    setClientSearchTimeout(timeout);
  };

  // Debounced product search
  const handleProductSearchChange = (value: string) => {
    setProductSearch(value);

    if (productSearchTimeout) {
      clearTimeout(productSearchTimeout);
    }

    const timeout = setTimeout(() => {
      searchProducts(value);
    }, 300);

    setProductSearchTimeout(timeout);
  };

  // Client keyboard navigation
  const handleClientKeyDown = (e: React.KeyboardEvent) => {
    if (!showClientDropdown || clientResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedClientIndex(prev =>
          prev < clientResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedClientIndex(prev =>
          prev > 0 ? prev - 1 : clientResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedClientIndex >= 0) {
          selectClient(clientResults[selectedClientIndex]);
        }
        break;
      case 'Escape':
        setShowClientDropdown(false);
        setSelectedClientIndex(-1);
        break;
    }
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setShowClientDropdown(false);
    setSelectedClientIndex(-1);

    // Move focus to product search
    setTimeout(() => {
      const productInput = document.getElementById('product-search') as HTMLInputElement;
      if (productInput) {
        productInput.focus();
      }
    }, 100);
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate totals when quantity, unit price, or tax rate changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = newItems[index];
      const { lineTotal, taxAmount, total } = calculateItemTotals(
        item.quantity,
        item.unitPrice,
        item.taxRate
      );

      newItems[index].lineTotal = lineTotal;
      newItems[index].taxAmount = taxAmount;
      newItems[index].total = total;
    }

    // Auto-fill product details when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value as string));
      if (product) {
        const unitPrice = product.inventory?.price || product.price;
        const taxRate = getProductTaxRate(product);
        const { lineTotal, taxAmount, total } = calculateItemTotals(
          newItems[index].quantity,
          unitPrice,
          taxRate
        );

        newItems[index].productName = product.name;
        newItems[index].unitPrice = unitPrice;
        newItems[index].taxRateId = product.taxRateId;
        newItems[index].taxRate = taxRate;
        newItems[index].taxAmount = taxAmount;
        newItems[index].lineTotal = lineTotal;
        newItems[index].total = total;
      }
    }

    setItems(newItems);
  };

  const handleQuickProductAdd = (productId: number, sku: string, quantity: number = 1) => {
    const product = productResults.find(p => p.id === productId);
    if (!product) return;

    const unitPrice = product.inventory?.price || product.price;
    const taxRate = getProductTaxRate(product);
    const { lineTotal, taxAmount, total } = calculateItemTotals(quantity, unitPrice, taxRate);

    const newItem: InvoiceItemForm = {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: quantity,
      unitPrice: unitPrice,
      taxRateId: product.taxRateId,
      taxRate: taxRate,
      taxAmount: taxAmount,
      lineTotal: lineTotal,
      total: total
    };

    // Check if product already exists in items
    const existingIndex = items.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      setItems(newItems);
    } else {
      // Add new item
      setItems([...items, newItem]);
    }

    // Clear product search
    setProductSearch('');
    setProductResults([]);
  };

  const addItem = () => {
    const emptyItem: InvoiceItemForm = {
      productId: null,
      sku: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      taxRateId: defaultTaxRate?.id,
      taxRate: useGlobalTax ? globalTaxRate : (defaultTaxRate?.rate ? defaultTaxRate.rate / 100 : globalTaxRate),
      taxAmount: 0,
      lineTotal: 0,
      total: 0
    };
    setItems([...items, emptyItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
      discount: 0 // Can be added later
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error('Please select a client');
      return;
    }

    if (items.length === 0 || items.every(item => !item.productName)) {
      toast.error('Please add at least one item');
      return;
    }

    const totals = calculateTotals();

    const submitData = {
      ...(invoice?.id && { id: parseInt(invoice.id) }),
      clientId: formData.clientId,
      clientName: selectedClient?.name,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate || undefined,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      status: formData.status,
      items: items.filter(item => item.productName).map(item => ({
        productId: item.productId || 0,
        sku: item.sku,
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      tags: JSON.stringify(selectedTags),
      storeId: 1 // Will be set by API from auth headers
    };

    await onSubmit(submitData);
  };

  const totals = calculateTotals();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto relative pb-16">
      <div className="flex items-center justify-end fixed bottom-0 left-0 right-0 bg-white p-4 z-50 shadow-inner">
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary-modern">
            {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Basic Information */}
        <Card className="col-span-2">
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="client-search">Client *</Label>
                <Input
                  id="client-search"
                  value={clientSearch}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onKeyDown={handleClientKeyDown}
                  onFocus={() => {
                    if (clientResults.length > 0) {
                      setShowClientDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow clicking on items
                    setTimeout(() => setShowClientDropdown(false), 200);
                  }}
                  placeholder="Search clients..."
                  autoComplete="off"
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
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {loadingClients && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg top-full">
                    <div className="px-3 py-2 text-gray-500">Searching clients...</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="useGlobalTax"
                    checked={useGlobalTax}
                    onCheckedChange={handleGlobalTaxToggle}
                  />
                  <Label htmlFor="useGlobalTax" className="text-sm font-medium">
                    Global tax
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  {/* <Label htmlFor="globalTaxRate" className="text-sm">Global Tax (%):</Label> */}
                  <NumericInput
                    id="globalTaxRate"
                    value={(globalTaxRate * 100).toString()}
                    onValueChange={(value) => handleGlobalTaxChange((value || 0) / 100)}
                    allowDecimals={true}
                    maxDecimals={2}
                    allowNegative={false}
                    className="w-20"
                    disabled={!useGlobalTax}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className='py-4 gap-2'>

          <CardContent>
            <div className="space-y-4">
              <div className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (per item):</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>{formatCurrency(totals.discount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Product Entry */}
        <Card className="col-span-3 gap-3">
          <CardHeader>
            <QuickProductEntry
              products={productResults}
              loading={loadingProducts}
              onProductAdd={handleQuickProductAdd}
              onSearchChange={handleProductSearchChange}
              searchValue={productSearch}
            />
          </CardHeader>
          {/* Line Items */}
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="min-w-0">
                        <div className="space-y-1">
                          <Input
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                            placeholder="Product name / description"
                            className="font-medium"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <NumericInput
                          value={item.quantity.toString()}
                          onValueChange={(value) => handleItemChange(index, 'quantity', value || 0)}
                          allowDecimals={true}
                          maxDecimals={2}
                          allowNegative={false}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <NumericInput
                          value={item.unitPrice.toString()}
                          onValueChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
                          allowDecimals={true}
                          maxDecimals={2}
                          allowNegative={false}
                          className="w-24 disabled:opacity-100"
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm ">
                          {formatCurrency(item.taxAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(item.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>

        </Card>


        {/* Notes and Terms */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Internal notes (not visible to client)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Payment terms and conditions"
                rows={3}
              />
            </div>


            <div className="space-y-2">
                <SimpleTagSelector
                  selectedTagNames={selectedTags}
                  onTagsChange={setSelectedTags}
                  categoryFilter={['invoice', 'general', 'client']}
                  label="Tags"
                  placeholder="Select tags for this invoice..."
                />
              </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

interface QuickProductEntryProps {
  products: ProductWithInventory[];
  loading: boolean;
  onProductAdd: (productId: number, sku: string, quantity: number) => void;
  onSearchChange: (search: string) => void;
  searchValue: string;
}

function QuickProductEntry({ products, loading, onProductAdd, onSearchChange, searchValue }: QuickProductEntryProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (products.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = selectedProductIndex < products.length - 1 ? selectedProductIndex + 1 : 0;
        setSelectedProductIndex(nextIndex);
        setSelectedProductId(products[nextIndex].id);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = selectedProductIndex > 0 ? selectedProductIndex - 1 : products.length - 1;
        setSelectedProductIndex(prevIndex);
        setSelectedProductId(products[prevIndex].id);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedProductId) {
          const product = products.find(p => p.id === selectedProductId);
          if (!product) return;
          onProductAdd(selectedProductId, product.sku, quantity);
          setSelectedProductId(null);
          setSelectedProductIndex(-1);
          setQuantity(1);
          onSearchChange(''); // Clear search
        }
        break;
      case 'Escape':
        setSelectedProductId(null);
        setSelectedProductIndex(-1);
        break;
    }
  };

  // Reset selection when products change
  React.useEffect(() => {
    if (products.length === 0) {
      setSelectedProductId(null);
      setSelectedProductIndex(-1);
    } else if (selectedProductIndex >= products.length) {
      setSelectedProductIndex(0);
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductIndex]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            id="product-search"
            placeholder="Search products by name or SKU..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <div className="w-24">
          <NumericInput
            placeholder="Qty"
            value={quantity.toString()}
            onValueChange={(value) => setQuantity(Math.floor(value || 1))}
            allowDecimals={false}
            allowNegative={false}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            if (selectedProductId) {
              const product = products.find(p => p.id === selectedProductId);
              if (!product) return;
              onProductAdd(selectedProductId, product.sku, quantity);
              setSelectedProductId(null);
              setQuantity(1);
              onSearchChange('');
            }
          }}
          disabled={!selectedProductId}
          size="sm"
        >
          Add
        </Button>
      </div>

      {searchValue && (
        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No products found</div>
          ) : (
            <div className="divide-y">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    index === selectedProductIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedProductIndex(index);
                    setSelectedProductId(product.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.sku && (
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.inventory?.price || product.price)}</div>
                      {product.inventory && (
                        <div className="text-sm text-muted-foreground">
                          Stock: {product.inventory.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}