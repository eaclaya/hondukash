'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProductWithInventory, UpdateProductRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import ProductForm from '@/components/products/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<ProductWithInventory | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/products/${productId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
      router.push('/products');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateProductRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      // Redirect to products list
      router.push('/products');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/products');
  };

  if (fetchLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Product not found</div>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      product={product}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}