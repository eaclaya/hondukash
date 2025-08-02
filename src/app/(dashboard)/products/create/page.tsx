'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateProductRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import ProductForm from '@/components/products/ProductForm';

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: CreateProductRequest) => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
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

  return (
    <ProductForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}