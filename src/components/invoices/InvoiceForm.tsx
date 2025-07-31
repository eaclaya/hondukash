'use client';

import { useState, useEffect } from 'react';
import { Invoice, CreateInvoiceRequest, UpdateInvoiceRequest, Client, ProductWithInventory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface InvoiceItemForm {
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
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
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithInventory[]>([]);

  const [formData, setFormData] = useState({
    clientId: invoice?.clientId ? parseInt(invoice.clientId) : null,
    contactName: invoice?.contactName || '',
    contactEmail: invoice?.contactEmail || '',
    contactPhone: invoice?.contactPhone || '',
    invoiceDate: invoice?.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || '',
    notes: invoice?.notes || '',
    terms: invoice?.terms || '',
    status: invoice?.status || 'draft' as const
  });

  const [items, setItems] = useState<InvoiceItemForm[]>(
    invoice?.items.map(item => ({
      productId: item.productId ? parseInt(item.productId) : null,
      productName: item.productName || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    })) || [{ productId: null, productName: '', quantity: 1, unitPrice: 0, total: 0 }]
  );

  const [taxRate, setTaxRate] = useState(0.15); // 15% default tax rate

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  // Filter clients based on search
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setFilteredClients(clients.slice(0, 10)); // Show first 10 clients
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase())
      );
      setFilteredClients(filtered.slice(0, 10));
    }
  }, [clients, clientSearch]);

  // Filter products based on search
  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(products.slice(0, 10)); // Show first 10 products
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered.slice(0, 10));
    }
  }, [products, productSearch]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/clients?limit=100', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products?limit=100', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate total when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    // Auto-fill product details when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.inventory?.price || product.price;
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
      }
    }

    setItems(newItems);
  };

  const handleQuickProductAdd = (productId: number, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItem: InvoiceItemForm = {
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.inventory?.price || product.price,
      total: quantity * (product.inventory?.price || product.price)
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
  };

  const addItem = () => {
    setItems([...items, { productId: null, productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
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
      alert('Please select a client');
      return;
    }

    if (items.length === 0 || items.every(item => !item.productName)) {
      alert('Please add at least one item');
      return;
    }

    const totals = calculateTotals();

    const submitData = {
      ...(invoice?.id && { id: parseInt(invoice.id) }),
      clientId: formData.clientId,
      contactName: formData.contactName || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate || undefined,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      status: formData.status,
      items: items.filter(item => item.productName).map(item => ({
        productId: item.productId || 0,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
          <p className="text-slate-600">
            {invoice ? 'Update invoice details and line items' : 'Create a new invoice for your client'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary-modern">
            {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Combobox
                  options={filteredClients.map(client => ({
                    value: client.id.toString(),
                    label: `${client.name}${client.email ? ` (${client.email})` : ''}`
                  }))}
                  value={formData.clientId ? formData.clientId.toString() : ""}
                  onValueChange={(value) => {
                    handleInputChange('clientId', value ? parseInt(value) : null);
                    setClientSearch('');
                  }}
                  onSearchChange={setClientSearch}
                  placeholder="Select a client"
                  searchPlaceholder="Search clients..."
                  emptyText="No clients found. Try searching..."
                  loading={loadingClients}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
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
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Product Entry */}
        <Card>
          <CardContent>
            <QuickProductEntry
              products={filteredProducts}
              loading={loadingProducts}
              onProductAdd={handleQuickProductAdd}
              onSearchChange={setProductSearch}
              searchValue={productSearch}
            />
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Line Items</span>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.productId?.toString() || ''}
                          onValueChange={(value) => handleItemChange(index, 'productId', value ? parseInt(value) : null)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingProducts ? (
                              <SelectItem value="loading-products" disabled>Loading products...</SelectItem>
                            ) : (
                              products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - {formatCurrency(product.inventory?.price || product.price)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-24"
                        />
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
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Invoice Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate * 100}
                    onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-24"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
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

        {/* Notes and Terms */}
        <Card>
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

interface QuickProductEntryProps {
  products: ProductWithInventory[];
  loading: boolean;
  onProductAdd: (productId: number, quantity: number) => void;
  onSearchChange: (search: string) => void;
  searchValue: string;
}

function QuickProductEntry({ products, loading, onProductAdd, onSearchChange, searchValue }: QuickProductEntryProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedProductId) {
      e.preventDefault();
      onProductAdd(selectedProductId, quantity);
      setSelectedProductId(null);
      setQuantity(1);
      onSearchChange(''); // Clear search
    }
  };

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
            placeholder="Search products by name or SKU..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <div className="w-24">
          <Input
            type="number"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            if (selectedProductId) {
              onProductAdd(selectedProductId, quantity);
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
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedProductId === product.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedProductId(product.id)}
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

      <div className="text-sm text-muted-foreground">
        💡 Tip: Search for a product, select it, enter quantity, and press Enter to add to invoice
      </div>
    </div>
  );
}