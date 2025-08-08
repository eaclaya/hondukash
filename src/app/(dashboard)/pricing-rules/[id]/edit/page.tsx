'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PricingRuleForm from '@/components/pricing-rules/PricingRuleForm';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';

// Import the form data interface
interface PricingRuleFormData {
  id?: number;
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

interface EditPricingRulePageProps {
  params: {
    id: string;
  };
}

export default function EditPricingRulePage({ params }: EditPricingRulePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [rule, setRule] = useState<PricingRuleFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const ruleId = params.id;

  useEffect(() => {
    fetchRule();
  }, [ruleId]);

  const fetchRule = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/pricing-rules/${ruleId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pricing rule');
      }

      const ruleData = await response.json();
      setRule(ruleData);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: PricingRuleFormData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pricing-rules/${ruleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pricing rule');
      }

      // Redirect to pricing rules list
      router.push('/pricing-rules');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update pricing rule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/pricing-rules');
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Pricing rule not found</div>
      </div>
    );
  }

  return (
    <PricingRuleForm
      rule={rule}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}