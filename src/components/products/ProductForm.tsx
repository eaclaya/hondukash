'use client';

import { useState } from 'react';
import { ProductWithInventory, CreateProductRequest, UpdateProductRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Warehouse, Tag, DollarSign, Settings, Tags, ExternalLink } from 'lucide-react';
import TaxRateSelector from '@/components/ui/TaxRateSelector';
import SimpleTagSelector from '@/components/tags/SimpleTagSelector';
import Link from 'next/link';
import { useTranslations } from '@/contexts/LocaleContext';

interface ProductFormProps {
  product?: ProductWithInventory;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ product, onSubmit, onCancel, loading = false }: ProductFormProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const initialBasePrice = product?.basePrice || 0;
  const initialTaxRate = product?.taxRate || 0.15;
  const initialIsTaxable = product?.isTaxable ?? true;
  const calculatedPrice = initialIsTaxable ? initialBasePrice * (1 + initialTaxRate) : initialBasePrice;

  const [formData, setFormData] = useState<CreateProductRequest | UpdateProductRequest>({
    ...(product?.id && { id: product.id }),
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    categoryId: product?.categoryId || undefined,
    baseCost: product?.baseCost || 0,
    cost: product?.cost || 0,
    basePrice: initialBasePrice,
    price: calculatedPrice,
    minPrice: product?.minPrice || 0,
    isTaxable: initialIsTaxable,
    taxRateId: product?.taxRateId || undefined,
    taxRate: initialTaxRate,
    trackInventory: product?.trackInventory ?? true,
    unit: product?.unit || 'unit',
    imageUrl: product?.imageUrl || '',
    images: product?.images || [],
    // Inventory data
    quantity: product?.inventory?.quantity || 0,
    storePrice: product?.inventory?.price || calculatedPrice,
    location: product?.inventory?.location || '',
    tags: product?.tags || [],
  });


  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (!product || !product.tags) return [];
    
    // If tags is already an array, use it directly
    if (Array.isArray(product.tags)) {
      return product.tags;
    }
    
    // If tags is a string, try to parse it as JSON
    if (typeof product.tags === 'string') {
      try {
        const parsed = JSON.parse(product.tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // If JSON parsing fails, split by comma and clean up
        return (product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }
    
    return [];
  });

  const validateAlphanumericCode = (value: string): string => {
    // Allow only letters, numbers, dash, dot, underscore
    return value.replace(/[^a-zA-Z0-9\-\._]/g, '');
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Validate SKU and barcode fields
      if (field === 'sku' || field === 'barcode') {
        updated[field] = validateAlphanumericCode(value);
      }

      // Auto-calculate selling price when base price or tax rate changes
      if (field === 'basePrice' || field === 'taxRate' || field === 'isTaxable' || field === 'taxRateId') {
        const basePrice = field === 'basePrice' ? value : updated.basePrice || 0;
        const taxRate = field === 'taxRate' ? value : updated.taxRate || 0;
        const isTaxable = field === 'isTaxable' ? value : updated.isTaxable;

        updated.price = isTaxable ? basePrice * (1 + taxRate) : basePrice;
      }

      return updated;
    });
  };

  const handleTaxRateChange = (taxRateId: number | undefined, taxRate: number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        taxRateId,
        taxRate
      };

      // Recalculate selling price
      const basePrice = updated.basePrice || 0;
      const isTaxable = updated.isTaxable;
      updated.price = isTaxable ? basePrice * (1 + taxRate) : basePrice;

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      tags: selectedTags
    };
    await onSubmit(submitData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {product ? t('editProduct') : t('createNewProduct')}
          </h1>
          <p className="text-slate-600">
            {product ? t('updateProductInfo') : t('addNewProductToCatalog')}
          </p>
        </div>
        <div className="flex space-x-3">
          {product?.id && (
            <Link href={`/tags/products/${product.id}`}>
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
            {loading ? tCommon('saving') : product ? t('updateProduct') : t('createProduct')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="product" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="product">{t('productInformation')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('inventoryAndPricing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>{t('basicInformation')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('productName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('enterProductName')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">{t('sku')}</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder={t('skuPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only letters, numbers, dash (-), dot (.), and underscore (_) allowed
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('enterProductDescription')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('barcode')}</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder={t('barcodePlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only letters, numbers, dash (-), dot (.), and underscore (_) allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="lb">Pound</SelectItem>
                      <SelectItem value="liter">Liter</SelectItem>
                      <SelectItem value="gallon">Gallon</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="yard">Yard</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <SimpleTagSelector
                    selectedTagNames={selectedTags}
                    onTagsChange={setSelectedTags}
                    storeId={1} // TODO: Get actual store ID from context/props
                    categoryFilter={['product', 'general']}
                    label="Product Tags"
                    placeholder="Select tags for this product..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseCost">Base Cost (L)</Label>
                  <NumericInput
                    id="baseCost"
                    value={formData.baseCost.toString()}
                    onValueChange={(value) => handleInputChange('baseCost', value || 0)}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">Original purchase/manufacturing cost</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Current Cost (L)</Label>
                  <NumericInput
                    id="cost"
                    value={formData.cost.toString()}
                    onValueChange={(value) => handleInputChange('cost', value || 0)}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">Current replacement cost</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (L)</Label>
                  <NumericInput
                    id="basePrice"
                    value={formData.basePrice.toString()}
                    onValueChange={(value) => handleInputChange('basePrice', value || 0)}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">Suggested retail price</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (L) *</Label>
                  <NumericInput
                    id="price"
                    value={(formData.price || 0).toFixed(2)}
                    disabled
                    placeholder="0.00"
                    className="bg-muted"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.isTaxable
                      ? `Calculated: Base Price (${formatCurrency(formData.basePrice || 0)}) + Tax (${((formData.taxRate || 0) * 100).toFixed(1)}%)`
                      : 'Calculated: Base Price (no tax)'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPrice">Minimum Price (L)</Label>
                  <NumericInput
                    id="minPrice"
                    value={formData.minPrice.toString()}
                    onValueChange={(value) => handleInputChange('minPrice', value || 0)}
                    placeholder="0.00"
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">Minimum selling price allowed</p>
                </div>

                <div className="space-y-2">
                  <Label>Profit Margin</Label>
                  <div className="p-2 bg-muted rounded">
                    <span className="text-sm font-medium">
                      {formData.price && formData.cost
                        ? `${(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Calculated from selling price and cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Tax Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isTaxable"
                      checked={formData.isTaxable}
                      onChange={(e) => handleInputChange('isTaxable', e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="isTaxable">This product is taxable</Label>
                  </div>
                </div>

                {formData.isTaxable && (
                  <TaxRateSelector
                    value={formData.taxRateId}
                    onValueChange={handleTaxRateChange}
                    allowNone={true}
                    className="space-y-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Product Images</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Primary Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>

              {formData.imageUrl && (
                <div className="mt-4">
                  <Label>Preview</Label>
                  <div className="mt-2 w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={formData.imageUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs">Invalid URL</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card> */}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Warehouse className="h-5 w-5" />
                <span>Inventory Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="trackInventory"
                    checked={formData.trackInventory}
                    onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="trackInventory">Track inventory for this product</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable this to manage stock levels and receive low stock alerts
                </p>
              </div>

              {formData.trackInventory && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Stock Quantity</Label>
                    <NumericInput
                      id="quantity"
                      value={formData.quantity.toString()}
                      onValueChange={(value) => handleInputChange('quantity', value || 0)}
                      placeholder="0"
                      allowDecimals={true}
                      maxDecimals={4}
                      allowNegative={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Aisle A, Bin 5"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {formData.trackInventory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Store-Specific Pricing</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storePrice">Store Price Override (L)</Label>
                  <NumericInput
                    id="storePrice"
                    value={formData.storePrice.toString()}
                    onValueChange={(value) => handleInputChange('storePrice', value || 0)}
                    placeholder={formatCurrency(formData.price || 0)}
                    allowDecimals={true}
                    maxDecimals={4}
                    allowNegative={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use the default selling price ({formatCurrency(formData.price || 0)})
                  </p>
                </div>

                {(formData.storePrice || 0) !== (formData.price || 0) && (formData.storePrice || 0) > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Default Price:</span>
                      <span>{formatCurrency(formData.price || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Store Price:</span>
                      <span>{formatCurrency(formData.storePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Difference:</span>
                      <span>
                        {(formData.storePrice || 0) > (formData.price || 0) ? '+' : ''}
                        {formatCurrency((formData.storePrice || 0) - (formData.price || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {formData.trackInventory && (
            <Card>
              <CardHeader>
                <CardTitle>Stock Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formData.quantity || 0}
                    </div>
                    <div className="text-sm text-blue-600">Current Stock</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency((formData.storePrice || formData.price || 0) * (formData.quantity || 0))}
                    </div>
                    <div className="text-sm text-green-600">Stock Value</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(formData.storePrice || formData.price || 0)}
                    </div>
                    <div className="text-sm text-purple-600">Unit Price</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}