'use client';

import { useState, useEffect } from 'react';
import { Store, CreateStoreRequest, UpdateStoreRequest, InvoiceSequence } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, Receipt, Settings } from 'lucide-react';
import Link from 'next/link';

interface StoreFormProps {
  store?: Store;
  onSubmit: (data: CreateStoreRequest | UpdateStoreRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function StoreForm({ store, onSubmit, onCancel, loading = false }: StoreFormProps) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    description: store?.description || '',
    location: store?.location || '',
    address: store?.address || '',
    city: store?.city || '',
    state: store?.state || '',
    country: store?.country || 'Honduras',
    postalCode: store?.postalCode || '',
    phone: store?.phone || '',
    email: store?.email || '',
    managerName: store?.managerName || '',
    currency: store?.currency || 'HNL',
    taxRate: store?.taxRate || 0.15,
    invoicePrefix: store?.invoicePrefix || 'INV',
    quotePrefix: store?.quotePrefix || 'QUO'
  });

  // Invoice Sequence Feature (separate state for JSON structure)
  const [invoiceSequence, setInvoiceSequence] = useState<InvoiceSequence>({
    enabled: store?.invoiceSequence?.enabled || false,
    hash: store?.invoiceSequence?.hash || '',
    sequence_start: store?.invoiceSequence?.sequence_start || '',
    sequence_end: store?.invoiceSequence?.sequence_end || '',
    limit_date: store?.invoiceSequence?.limit_date || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.taxRate < 0 || formData.taxRate > 1) {
      newErrors.taxRate = 'Tax rate must be between 0 and 1';
    }

    if (!formData.invoicePrefix.trim()) {
      newErrors.invoicePrefix = 'Invoice prefix is required';
    }

    // Validate invoice sequence fields when feature is enabled
    if (invoiceSequence.enabled) {
      const validCharPattern = /^[a-zA-Z0-9\-._]+$/;

      if (!invoiceSequence.hash.trim()) {
        newErrors.sequenceHash = 'Sequence hash is required when using invoice sequence';
      } else if (!validCharPattern.test(invoiceSequence.hash)) {
        newErrors.sequenceHash = 'Hash can only contain letters, numbers, dashes, dots, and underscores';
      }

      if (!invoiceSequence.sequence_start.trim()) {
        newErrors.sequenceStart = 'Sequence start is required when using invoice sequence';
      } else if (!validCharPattern.test(invoiceSequence.sequence_start)) {
        newErrors.sequenceStart = 'Sequence start can only contain letters, numbers, dashes, dots, and underscores';
      } else if (!/\d+$/.test(invoiceSequence.sequence_start)) {
        newErrors.sequenceStart = 'Sequence start must end with numbers (e.g., INV-001)';
      }

      if (!invoiceSequence.sequence_end.trim()) {
        newErrors.sequenceEnd = 'Sequence end is required when using invoice sequence';
      } else if (!validCharPattern.test(invoiceSequence.sequence_end)) {
        newErrors.sequenceEnd = 'Sequence end can only contain letters, numbers, dashes, dots, and underscores';
      } else if (!/\d+$/.test(invoiceSequence.sequence_end)) {
        newErrors.sequenceEnd = 'Sequence end must end with numbers (e.g., INV-999)';
      }

      // Validate that start and end have same prefix pattern
      if (invoiceSequence.sequence_start && invoiceSequence.sequence_end) {
        const startPrefix = invoiceSequence.sequence_start.replace(/\d+$/, '');
        const endPrefix = invoiceSequence.sequence_end.replace(/\d+$/, '');
        if (startPrefix !== endPrefix) {
          newErrors.sequenceEnd = 'Sequence start and end must have the same prefix pattern';
        }

        const startMatch = invoiceSequence.sequence_start.match(/(\d+)$/);
        const endMatch = invoiceSequence.sequence_end.match(/(\d+)$/);
        if (startMatch && endMatch) {
          const startNum = parseInt(startMatch[1]);
          const endNum = parseInt(endMatch[1]);
          if (startNum >= endNum) {
            newErrors.sequenceEnd = 'Sequence end number must be greater than start number';
          }
        }
      }

      if (invoiceSequence.limit_date) {
        const limitDate = new Date(invoiceSequence.limit_date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        limitDate.setHours(0, 0, 0, 0);

        if (limitDate <= currentDate) {
          newErrors.sequenceLimitDate = 'Sequence limit date must be in the future';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = store ? ({
        ...formData,
        id: store.id,
        invoiceSequence: invoiceSequence.enabled ? invoiceSequence : undefined
      } as UpdateStoreRequest) : ({
        ...formData,
        invoiceSequence: invoiceSequence.enabled ? invoiceSequence : undefined
      } as CreateStoreRequest);

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSequenceChange = (field: keyof InvoiceSequence, value: string | number | boolean) => {
    setInvoiceSequence((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{store ? 'Edit Store' : 'Create New Store'}</h1>
          <p className="text-muted-foreground">
            {store ? 'Update store information and settings' : 'Add a new store location to your system'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Basic Information</span>
            </TabsTrigger>
            <TabsTrigger value="sequence" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Invoice Sequence</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Invoice Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter store name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Store description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Main Location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerName">Manager Name</Label>
                    <Input
                      id="managerName"
                      type="text"
                      value={formData.managerName}
                      onChange={(e) => handleChange('managerName', e.target.value)}
                      placeholder="Store manager name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Tegucigalpa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="Francisco Morazán"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="11101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+504 2234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="store@company.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Sequence Tab */}
          <TabsContent value="sequence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Sequence Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useInvoiceSequence"
                    checked={invoiceSequence.enabled}
                    onCheckedChange={(checked) => handleSequenceChange('enabled', checked)}
                  />
                  <Label htmlFor="useInvoiceSequence" className="text-sm font-medium">
                    Enable Invoice Sequence Feature
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, invoices will use a sequential numbering system instead of the prefix + counter.
                </p>

                {invoiceSequence.enabled && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="sequenceHash">Sequence Hash *</Label>
                      <Input
                        id="sequenceHash"
                        value={invoiceSequence.hash}
                        onChange={(e) => handleSequenceChange('hash', e.target.value)}
                        placeholder="e.g., SEQ2024-001"
                        className={errors.sequenceHash ? 'border-red-500' : ''}
                      />
                      {errors.sequenceHash && <p className="text-red-500 text-sm mt-1">{errors.sequenceHash}</p>}
                      <p className="text-xs text-muted-foreground">Unique identifier for this sequence</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sequenceStart">Sequence Start *</Label>
                        <Input
                          id="sequenceStart"
                          value={invoiceSequence.sequence_start}
                          onChange={(e) => handleSequenceChange('sequence_start', e.target.value)}
                          placeholder="e.g., A-001"
                          className={errors.sequenceStart ? 'border-red-500' : ''}
                        />
                        {errors.sequenceStart && <p className="text-red-500 text-sm mt-1">{errors.sequenceStart}</p>}
                        <p className="text-xs text-muted-foreground">Starting pattern for the sequence</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sequenceEnd">Sequence End *</Label>
                        <Input
                          id="sequenceEnd"
                          value={invoiceSequence.sequence_end}
                          onChange={(e) => handleSequenceChange('sequence_end', e.target.value)}
                          placeholder="e.g., A-999"
                          className={errors.sequenceEnd ? 'border-red-500' : ''}
                        />
                        {errors.sequenceEnd && <p className="text-red-500 text-sm mt-1">{errors.sequenceEnd}</p>}
                        <p className="text-xs text-muted-foreground">Ending pattern for the sequence</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sequenceLimitDate">Sequence Limit Date</Label>
                      <Input
                        id="sequenceLimitDate"
                        type="date"
                        value={invoiceSequence.limit_date}
                        onChange={(e) => handleSequenceChange('limit_date', e.target.value)}
                        className={errors.sequenceLimitDate ? 'border-red-500' : ''}
                      />
                      {errors.sequenceLimitDate && <p className="text-red-500 text-sm mt-1">{errors.sequenceLimitDate}</p>}
                      <p className="text-xs text-muted-foreground">Optional expiration date for this sequence</p>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HNL">HNL - Honduran Lempira</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate</Label>
                    <NumericInput
                      id="taxRate"
                      value={formData.taxRate.toString()}
                      onValueChange={(value) => handleChange('taxRate', value || 0)}
                      placeholder="0.15"
                      allowDecimals={true}
                      maxDecimals={2}
                      allowNegative={false}
                      className={errors.taxRate ? 'border-red-500' : ''}
                    />
                    {errors.taxRate && <p className="text-red-500 text-sm mt-1">{errors.taxRate}</p>}
                    <p className="text-xs text-muted-foreground">Enter as decimal (0.15 = 15%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Prefixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix *</Label>
                    <Input
                      id="invoicePrefix"
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="INV"
                      className={errors.invoicePrefix ? 'border-red-500' : ''}
                      disabled={invoiceSequence.enabled}
                    />
                    {errors.invoicePrefix && <p className="text-red-500 text-sm mt-1">{errors.invoicePrefix}</p>}
                    {invoiceSequence.enabled && (
                      <p className="text-xs text-yellow-600">Disabled while Invoice Sequence is enabled</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quotePrefix">Quote Prefix</Label>
                    <Input
                      id="quotePrefix"
                      type="text"
                      value={formData.quotePrefix}
                      onChange={(e) => handleChange('quotePrefix', e.target.value.toUpperCase())}
                      placeholder="QUO"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6">
          <Link href="/stores">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
          </Button>
        </div>
      </form>
    </div>
  );
}
