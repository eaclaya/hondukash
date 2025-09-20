import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PricingRule {
  id: number;
  name: string;
  description?: string;
  ruleCode?: string;
  ruleType: 'percentage_discount' | 'fixed_amount_discount' | 'fixed_price' | 'buy_x_get_y' | 'quantity_discount';
  priority: number;
  discountPercentage: number;
  discountAmount: number;
  fixedPrice: number;
  buyQuantity: number;
  getQuantity: number;
  getDiscountPercentage: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount: number;
  usageLimitPerCustomer?: number;
  conditions: RuleCondition[];
  targets: RuleTarget[];
  quantityTiers: QuantityTier[];
}

export interface RuleCondition {
  id: number;
  pricingRuleId: number;
  conditionType: string;
  operator: string;
  valueText?: string;
  valueNumber?: number;
  valueArray?: string;
  valueStart?: number;
  valueEnd?: number;
  logicalOperator: 'AND' | 'OR';
  conditionGroup: number;
}

export interface RuleTarget {
  id: number;
  pricingRuleId: number;
  targetType: string;
  targetIds?: string;
  targetTags?: string;
}

export interface QuantityTier {
  id: number;
  pricingRuleId: number;
  minQuantity: number;
  maxQuantity?: number;
  tierPrice?: number;
  tierDiscountPercentage?: number;
  tierDiscountAmount?: number;
}

export interface UsePricingRulesResult {
  pricingRules: PricingRule[];
  loading: boolean;
  error: string | null;
  refreshRules: () => Promise<void>;
}

export function usePricingRules(): UsePricingRulesResult {
  const { getAuthHeaders } = useAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pricing-rules/active', {
        headers: await getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pricing rules');
      }

      const data = await response.json();
      setPricingRules(data.data || []);
    } catch (err) {
      console.error('Failed to fetch pricing rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing rules');
      setPricingRules([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshRules = async () => {
    await fetchPricingRules();
  };

  useEffect(() => {
    fetchPricingRules();
  }, []);

  return {
    pricingRules,
    loading,
    error,
    refreshRules
  };
}