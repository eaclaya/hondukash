'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Tags, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EntityTagManager } from '@/components/tags';
import { ProductWithInventory } from '@/lib/types';
import { toast } from 'sonner';

export default function ProductTagsPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  
  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
      } else {
        toast.error('Failed to load product');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Error loading product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-red-600">Product not found</div>
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
            onClick={() => router.push(`/products`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Tags className="h-6 w-6" />
              <span>Product Tags</span>
            </h1>
            <p className="text-slate-600">
              Manage tags for {product.name}
            </p>
          </div>
        </div>
      </div>

      {/* Product Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              {product.description && (
                <p className="text-slate-600 mt-1">{product.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-3">
                {product.sku && (
                  <Badge variant="outline">SKU: {product.sku}</Badge>
                )}
                {product.barcode && (
                  <Badge variant="outline">Barcode: {product.barcode}</Badge>
                )}
                <Badge variant="secondary">{product.unit}</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Price:</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{formatCurrency(product.price)}</span>
                </div>
              </div>
              
              {product.trackInventory && product.inventory && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Stock:</span>
                  <span className={`font-semibold ${
                    product.inventory.quantity > 10 ? 'text-green-600' : 
                    product.inventory.quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {product.inventory.quantity} {product.unit}
                  </span>
                </div>
              )}
              
              {product.inventory?.location && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium">{product.inventory.location}</span>
                </div>
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
            entityType="product"
            entityId={productId}
            entityName={product.name}
            storeId={1} // TODO: Get actual store ID from context/props
            tags={product.tags || []}
            onTagsChanged={(updatedTags) => {
              // Update local product state when tags change
              setProduct(prev => prev ? { ...prev, tags: updatedTags } : null);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}