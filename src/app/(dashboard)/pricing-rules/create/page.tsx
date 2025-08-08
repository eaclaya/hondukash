'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PricingRuleForm from '@/components/pricing-rules/PricingRuleForm';
import { toast } from 'sonner';

// Import the form data interface
interface PricingRuleFormData {
  name: string;
  description?: string;
  ruleCode?: string;
  ruleType: 'percentage_discount' | 'fixed_amount_discount' | 'fixed_price' | 'buy_x_get_y' | 'quantity_discount';
  priority: number;
  discountPercentage?: number;
  discountAmount?: number;
  fixedPrice?: number;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountPercentage?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer?: number;
  conditions: Array<{
    conditionType: string;
    operator: string;
    valueText?: string;
    valueNumber?: number;
    valueArray?: string;
    valueStart?: number;
    valueEnd?: number;
    logicalOperator: 'AND' | 'OR';
    conditionGroup: number;
  }>;
  targets: Array<{
    targetType: string;
    targetIds?: string;
    targetTags?: string;
  }>;
  quantityTiers: Array<{
    minQuantity: number;
    maxQuantity?: number;
    tierPrice?: number;
    tierDiscountPercentage?: number;
    tierDiscountAmount?: number;
  }>;
}

export default function CreatePricingRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (data: PricingRuleFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing-rules', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pricing rule');
      }

      // Redirect to pricing rules list
      toast.success('Pricing rule created successfully');
      router.push('/pricing-rules');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create pricing rule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/pricing-rules');
  };

  return (
    <PricingRuleForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}