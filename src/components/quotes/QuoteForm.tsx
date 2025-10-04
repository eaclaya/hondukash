'use client';

import React, { useState, useEffect } from 'react';
import { Quote, CreateQuoteRequest, UpdateQuoteRequest, Client, ProductWithInventory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Calculator, Tags, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SimpleTagSelector from '@/components/tags/SimpleTagSelector';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from '@/contexts/LocaleContext';
import { usePricingRules } from '@/hooks/usePricingRules';
import { DiscountCalculator, DiscountCalculationContext, DiscountCalculationResult } from '@/lib/services/discountCalculator';

interface QuoteFormProps {
  quote?: Quote;
  onSubmit: (data: CreateQuoteRequest | UpdateQuoteRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface QuoteItemForm {
  productId: number | null;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function QuoteForm({ quote, onSubmit, onCancel, loading = false }: QuoteFormProps) {
  const { getAuthHeaders } = useAuth();
  const t = useTranslations('quotes');
  const tCommon = useTranslations('common');
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
    clientId: quote?.clientId ? parseInt(quote.clientId) : null,
    clientName: quote?.clientName || '',
    quoteDate: quote?.quoteDate || new Date().toISOString().split('T')[0],
    validUntil: quote?.validUntil || '',
    notes: quote?.notes || '',
    terms: quote?.terms || '',
    status: quote?.status || 'draft' as const,
    tags: quote?.tags || ''
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
    quote ? parseTagsFromString(quote.tags || '') : []
  );

  const [items, setItems] = useState<QuoteItemForm[]>([]);

  const [taxRate, setTaxRate] = useState(0.15); // 15% default tax rate

  // Pricing rules and discounts
  const { pricingRules, loading: loadingPricingRules, error: pricingRulesError } = usePricingRules();
  const [discountResult, setDiscountResult] = useState<DiscountCalculationResult | null>(null);
  const [applyDiscounts, setApplyDiscounts] = useState(true);


  useEffect(() => {
    // Auto-focus client search on component mount
    const clientInput = document.getElementById('client-search') as HTMLInputElement;
    if (clientInput) {
      clientInput.focus();
    }
  }, []);

  // Set initial selected client if editing
  useEffect(() => {
    if (quote && formData.clientId) {
      const client = clients.find(c => c.id === formData.clientId);
      if (client) {
        setSelectedClient(client);
        setClientSearch(client.name);
      }
    }
  }, [quote, formData.clientId, clients]);

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

  const handleItemChange = (index: number, field: keyof QuoteItemForm, value: unknown) => {
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

  const handleQuickProductAdd = (productId: number, sku: string, quantity: number = 1) => {
    const product = productResults.find(p => p.id === productId);
    if (!product) return;

    const newItem: QuoteItemForm = {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.inventory?.price || product.price,
      total: quantity * (product.inventory?.price || product.price)
    };

    let updatedItems;
    // Check if product already exists in items
    const existingIndex = items.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      // Update quantity of existing item
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice;
      setItems(newItems);
      updatedItems = newItems;
    } else {
      // Add new item
      updatedItems = [...items, newItem];
      setItems(updatedItems);
    }


    // Clear product search
    setProductSearch('');
    setProductResults([]);
  };

  const addItem = () => {
    setItems([...items, { productId: null, sku: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate discounts when items, client, or pricing rules change
  const calculateDiscounts = () => {
    if (!applyDiscounts || !selectedClient || items.length === 0 || pricingRules.length === 0) {
      setDiscountResult(null);
      return;
    }

    const context: DiscountCalculationContext = {
      items: items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.total,
        tags: [], // TODO: Add product tags when available
        categoryId: undefined // TODO: Add category when available
      })),
      clientId: selectedClient.id,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
      clientTags: selectedClient.tags || []
    };

    const result = DiscountCalculator.calculateDiscounts(context, pricingRules);
    setDiscountResult(result);
  };

  // Recalculate discounts when relevant data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateDiscounts();
    }, 300); // Debounce to avoid excessive calculations

    return () => clearTimeout(timeoutId);
  }, [items, selectedClient, pricingRules, applyDiscounts, selectedTags]);

  const calculateTotals = () => {
    const originalSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discountResult?.totalDiscountAmount || 0;
    const subtotal = originalSubtotal - discountAmount;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      originalSubtotal,
      discountAmount,
      subtotal,
      tax,
      total
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error(t('pleaseSelectClient'));
      return;
    }

    if (items.length === 0 || items.every(item => !item.productName || !item.productId || item.productId === 0)) {
      toast.error(t('pleaseAddAtLeastOneItem'));
      return;
    }

    const totals = calculateTotals();

    const submitData = {
      ...(quote?.id && { id: parseInt(quote.id) }),
      clientId: formData.clientId,
      clientName: formData.clientName || undefined,
      quoteDate: formData.quoteDate,
      validUntil: formData.validUntil || undefined,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined,
      status: formData.status,
      items: items.filter(item => item.productName && item.productId && item.productId > 0).map(item => ({
        productId: item.productId || 0,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        description: item.productName
      })),
      subtotal: totals.subtotal,
      tax: totals.tax,
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
            {quote ? t('editQuote') : t('createNewQuote')}
          </h1>
          <p className="text-slate-600">
            {quote ? t('updateQuoteDetails') : t('createNewQuoteForClient')}
          </p>
        </div>
        <div className="flex space-x-3">
          {quote?.id && (
            <Link href={`/tags/quotes/${quote.id}`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Tags className="h-4 w-4" />
                <span>{t('manageTags')}</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary-modern">
            {loading ? tCommon('saving') : quote ? t('updateQuote') : t('createQuote')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="client-search">{t('client')} *</Label>
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
                  placeholder={t('searchClients')}
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
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quoteDate">Quote Date *</Label>
                <Input
                  id="quoteDate"
                  type="date"
                  value={formData.quoteDate}
                  onChange={(e) => handleInputChange('quoteDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
              />
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Product Entry */}
        <Card>
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
                          maxDecimals={4}
                          allowNegative={false}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <NumericInput
                          value={item.unitPrice.toString()}
                          onValueChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
                          allowDecimals={true}
                          maxDecimals={4}
                          allowNegative={false}
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Quote Summary</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applyDiscounts"
                  checked={applyDiscounts}
                  onCheckedChange={setApplyDiscounts}
                />
                <Label htmlFor="applyDiscounts" className="text-xs">Apply discounts</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <NumericInput
                    id="taxRate"
                    value={(taxRate * 100).toString()}
                    onValueChange={(value) => setTaxRate((value || 0) / 100)}
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  {applyDiscounts && discountResult && discountResult.totalDiscountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Original Subtotal:</span>
                        <span>{formatCurrency(totals.originalSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discountResult.appliedDiscounts.length} rule{discountResult.appliedDiscounts.length !== 1 ? 's' : ''}):</span>
                        <span>-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                    <span>{formatCurrency(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Discount Details */}
              {applyDiscounts && discountResult && discountResult.appliedDiscounts.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Applied Discounts:</h4>
                  {discountResult.appliedDiscounts.map((discount, index) => (
                    <div key={index} className="text-xs text-green-600 flex justify-between">
                      <span>{discount.ruleName}</span>
                      <span>-{formatCurrency(discount.discountAmount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing Rules Status */}
              {loadingPricingRules && (
                <div className="text-xs text-muted-foreground">Loading pricing rules...</div>
              )}
              {pricingRulesError && (
                <div className="text-xs text-red-600">Error loading pricing rules: {pricingRulesError}</div>
              )}
              {!loadingPricingRules && pricingRules.length === 0 && applyDiscounts && (
                <div className="text-xs text-muted-foreground">No active pricing rules found</div>
              )}
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
                placeholder="Quote terms and conditions"
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

      <div className="text-sm text-muted-foreground">
        💡 Tip: Search for a product, use arrow keys to navigate, enter quantity, and press Enter to add to quote
      </div>
    </div>
  );
}