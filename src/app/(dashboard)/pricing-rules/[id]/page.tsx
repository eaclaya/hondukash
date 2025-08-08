'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Calendar, Target, Settings, BarChart3, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';

// Types
interface PricingRule {
  id: number;
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
  createdAt: string;
  updatedAt: string;
  conditions: Array<{
    id: number;
    conditionType: string;
    operator: string;
    valueText?: string;
    valueNumber?: number;
    logicalOperator: string;
    conditionGroup: number;
  }>;
  targets: Array<{
    id: number;
    targetType: string;
    targetIds?: string;
    targetTags?: string;
  }>;
  quantityTiers: Array<{
    id: number;
    minQuantity: number;
    maxQuantity?: number;
    tierPrice?: number;
    tierDiscountPercentage?: number;
    tierDiscountAmount?: number;
  }>;
  usage: Array<{
    id: number;
    discountAmount: number;
    originalAmount: number;
    finalAmount: number;
    createdAt: string;
  }>;
}

interface PricingRuleDetailPageProps {
  params: {
    id: string;
  };
}

export default function PricingRuleDetailPage({ params }: PricingRuleDetailPageProps) {
  const router = useRouter();
  const [rule, setRule] = useState<PricingRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuth();

  const ruleId = params.id;

  useEffect(() => {
    fetchRule();
  }, [ruleId]);

  const fetchRule = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rule || !confirm('Are you sure you want to delete this pricing rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing-rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pricing rule');
      }

      router.push('/pricing-rules');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete pricing rule');
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    const labels: Record<string, string> = {
      percentage_discount: 'Percentage Discount',
      fixed_amount_discount: 'Fixed Amount Off',
      fixed_price: 'Fixed Price',
      buy_x_get_y: 'Buy X Get Y',
      quantity_discount: 'Quantity Discount'
    };
    return labels[ruleType] || ruleType;
  };

  const getRuleTypeColor = (ruleType: string) => {
    const colors: Record<string, string> = {
      percentage_discount: 'bg-blue-100 text-blue-800',
      fixed_amount_discount: 'bg-green-100 text-green-800',
      fixed_price: 'bg-purple-100 text-purple-800',
      buy_x_get_y: 'bg-orange-100 text-orange-800',
      quantity_discount: 'bg-yellow-100 text-yellow-800'
    };
    return colors[ruleType] || 'bg-gray-100 text-gray-800';
  };

  const getRuleValue = (rule: PricingRule) => {
    switch (rule.ruleType) {
      case 'percentage_discount':
        return `${rule.discountPercentage}% off`;
      case 'fixed_amount_discount':
        return `L ${rule.discountAmount} off`;
      case 'fixed_price':
        return `L ${rule.fixedPrice}`;
      case 'buy_x_get_y':
        return `Buy ${rule.buyQuantity}, Get ${rule.getQuantity} (${rule.getDiscountPercentage}% off)`;
      case 'quantity_discount':
        return 'Tiered pricing';
      default:
        return '—';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-HN');
  };

  const isRuleExpired = (rule: PricingRule) => {
    if (!rule.endDate) return false;
    return new Date(rule.endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/pricing-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing Rules
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/pricing-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing Rules
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Pricing rule not found</div>
        </div>
      </div>
    );
  }

  const isExpired = isRuleExpired(rule);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/pricing-rules')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{rule.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className={getRuleTypeColor(rule.ruleType)}>
                {getRuleTypeLabel(rule.ruleType)}
              </Badge>
              <Badge
                variant={rule.isActive && !isExpired ? 'default' : 'secondary'}
                className={
                  rule.isActive && !isExpired 
                    ? 'bg-green-100 text-green-800' 
                    : isExpired
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {isExpired ? 'Expired' : rule.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {rule.ruleCode && (
                <Badge variant="outline">{rule.ruleCode}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/pricing-rules/${rule.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Rule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Rule Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRuleValue(rule)}
            </div>
            <p className="text-sm text-muted-foreground">
              Priority: {rule.priority}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {rule.startDate ? (
                <div>
                  <span className="text-muted-foreground">Start: </span>
                  {formatDate(rule.startDate)}
                </div>
              ) : (
                <div className="text-muted-foreground">No start date</div>
              )}
              {rule.endDate ? (
                <div className={isExpired ? 'text-red-600' : ''}>
                  <span className="text-muted-foreground">End: </span>
                  {formatDate(rule.endDate)}
                </div>
              ) : (
                <div className="text-muted-foreground">No end date</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Times used: </span>
                <span className="font-medium">{rule.usageCount}</span>
                {rule.usageLimit && (
                  <span className="text-muted-foreground"> / {rule.usageLimit}</span>
                )}
              </div>
              {rule.usageLimitPerCustomer && (
                <div>
                  <span className="text-muted-foreground">Per customer limit: </span>
                  <span className="font-medium">{rule.usageLimitPerCustomer}</span>
                </div>
              )}
              {rule.usage.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Total savings: </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(rule.usage.reduce((sum, u) => sum + u.discountAmount, 0))}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule Description */}
      {rule.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{rule.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Quantity Tiers (for quantity_discount rules) */}
      {rule.ruleType === 'quantity_discount' && rule.quantityTiers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quantity Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Quantity</TableHead>
                    <TableHead>Max Quantity</TableHead>
                    <TableHead>Tier Price</TableHead>
                    <TableHead>Discount %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rule.quantityTiers.map((tier, index) => (
                    <TableRow key={index}>
                      <TableCell>{tier.minQuantity}</TableCell>
                      <TableCell>{tier.maxQuantity || 'Unlimited'}</TableCell>
                      <TableCell>
                        {tier.tierPrice ? formatCurrency(tier.tierPrice) : '—'}
                      </TableCell>
                      <TableCell>
                        {tier.tierDiscountPercentage ? `${tier.tierDiscountPercentage}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditions */}
      {rule.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Conditions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rule.conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center space-x-2 text-sm">
                  <Badge variant="outline">Condition {index + 1}</Badge>
                  <span className="capitalize">{condition.conditionType.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">{condition.operator.replace('_', ' ')}</span>
                  <span className="font-medium">
                    {condition.valueText || condition.valueNumber || '—'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Targets */}
      {rule.targets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Targets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rule.targets.map((target, index) => (
                <div key={target.id} className="flex items-center space-x-2 text-sm">
                  <Badge variant="outline">Target {index + 1}</Badge>
                  <span className="capitalize">{target.targetType.replace('_', ' ')}</span>
                  {(target.targetIds || target.targetTags) && (
                    <>
                      <span className="text-muted-foreground">:</span>
                      <span className="font-medium">{target.targetIds || target.targetTags}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Usage */}
      {rule.usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Original Amount</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rule.usage.slice(0, 10).map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{formatDateTime(usage.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(usage.originalAmount)}</TableCell>
                      <TableCell className="text-green-600">
                        -{formatCurrency(usage.discountAmount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(usage.finalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rule.usage.length > 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing 10 most recent uses of {rule.usage.length} total
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}