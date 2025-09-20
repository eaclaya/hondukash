'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Percent, DollarSign, Settings, Target, Users, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Types
interface PricingRule {
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
}

interface QuantityTier {
  minQuantity: number;
  maxQuantity?: number;
  tierPrice?: number;
  tierDiscountPercentage?: number;
  tierDiscountAmount?: number;
}

interface RuleCondition {
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

interface RuleTarget {
  targetType: string;
  targetIds?: string;
  targetTags?: string;
}

interface PricingRuleFormData extends PricingRule {
  conditions: RuleCondition[];
  targets: RuleTarget[];
  quantityTiers: QuantityTier[];
}

interface PricingRuleFormProps {
  rule?: PricingRuleFormData;
  onSubmit: (data: PricingRuleFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function PricingRuleForm({ rule, onSubmit, onCancel, loading = false }: PricingRuleFormProps) {
  const [formData, setFormData] = useState<PricingRuleFormData>({
    name: rule?.name || '',
    description: rule?.description || '',
    ruleCode: rule?.ruleCode || '',
    ruleType: rule?.ruleType || 'percentage_discount',
    priority: rule?.priority || 0,
    discountPercentage: rule?.discountPercentage || 0,
    discountAmount: rule?.discountAmount || 0,
    fixedPrice: rule?.fixedPrice || 0,
    buyQuantity: rule?.buyQuantity || 0,
    getQuantity: rule?.getQuantity || 0,
    getDiscountPercentage: rule?.getDiscountPercentage || 0,
    isActive: rule?.isActive ?? true,
    startDate: rule?.startDate || '',
    endDate: rule?.endDate || '',
    usageLimit: rule?.usageLimit || undefined,
    usageCount: rule?.usageCount || 0,
    usageLimitPerCustomer: rule?.usageLimitPerCustomer || undefined,
    conditions: rule?.conditions || [],
    targets: rule?.targets || [{ targetType: 'all_products' }],
    quantityTiers: rule?.quantityTiers || [{ minQuantity: 1, tierDiscountPercentage: 0 }]
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConditionChange = (index: number, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        conditionType: 'cart_subtotal',
        operator: 'greater_than',
        logicalOperator: 'AND',
        conditionGroup: 1
      }]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleTargetChange = (index: number, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.map((target, i) => 
        i === index ? { ...target, [field]: value } : target
      )
    }));
  };

  const addTarget = () => {
    setFormData(prev => ({
      ...prev,
      targets: [...prev.targets, { targetType: 'all_products' }]
    }));
  };

  const removeTarget = (index: number) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.filter((_, i) => i !== index)
    }));
  };

  const handleTierChange = (index: number, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      quantityTiers: prev.quantityTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const addTier = () => {
    setFormData(prev => ({
      ...prev,
      quantityTiers: [...prev.quantityTiers, {
        minQuantity: prev.quantityTiers[prev.quantityTiers.length - 1]?.minQuantity + 1 || 1,
        tierDiscountPercentage: 0
      }]
    }));
  };

  const removeTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quantityTiers: prev.quantityTiers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getRuleTypeDescription = (ruleType: string) => {
    const descriptions = {
      percentage_discount: 'Apply a percentage discount to matching items',
      fixed_amount_discount: 'Apply a fixed amount discount to matching items',
      fixed_price: 'Set a specific price for matching items',
      buy_x_get_y: 'Buy X items, get Y items free or discounted',
      quantity_discount: 'Apply tiered pricing based on quantity ranges'
    };
    return descriptions[ruleType as keyof typeof descriptions] || '';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {rule ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}
          </h1>
          <p className="text-slate-600">
            {rule ? 'Update pricing rule configuration' : 'Add a new pricing rule to your store'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="btn-primary-modern">
            {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5" />
                  <span>Rule Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter rule name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ruleCode">Rule Code</Label>
                    <Input
                      id="ruleCode"
                      value={formData.ruleCode}
                      onChange={(e) => handleInputChange('ruleCode', e.target.value)}
                      placeholder="e.g., SUMMER20, BUY2GET1"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe when and how this rule applies"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ruleType">Rule Type *</Label>
                    <Select
                      value={formData.ruleType}
                      onValueChange={(value) => handleInputChange('ruleType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                        <SelectItem value="fixed_amount_discount">Fixed Amount Discount</SelectItem>
                        <SelectItem value="fixed_price">Fixed Price</SelectItem>
                        <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                        <SelectItem value="quantity_discount">Quantity Discount</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getRuleTypeDescription(formData.ruleType)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <NumericInput
                      id="priority"
                      value={formData.priority.toString()}
                      onValueChange={(value) => handleInputChange('priority', value || 0)}
                      placeholder="0"
                      allowDecimals={false}
                      allowNegative={false}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher numbers have higher priority
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Rule Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.ruleType === 'percentage_discount' && (
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                    <NumericInput
                      id="discountPercentage"
                      value={formData.discountPercentage?.toString() || '0'}
                      onValueChange={(value) => handleInputChange('discountPercentage', value || 0)}
                      placeholder="0"
                      allowDecimals={true}
                      maxDecimals={2}
                      allowNegative={false}
                    />
                  </div>
                )}

                {formData.ruleType === 'fixed_amount_discount' && (
                  <div className="space-y-2">
                    <Label htmlFor="discountAmount">Discount Amount (L)</Label>
                    <NumericInput
                      id="discountAmount"
                      value={formData.discountAmount?.toString() || '0'}
                      onValueChange={(value) => handleInputChange('discountAmount', value || 0)}
                      placeholder="0.00"
                      allowDecimals={true}
                      maxDecimals={2}
                      allowNegative={false}
                    />
                  </div>
                )}

                {formData.ruleType === 'fixed_price' && (
                  <div className="space-y-2">
                    <Label htmlFor="fixedPrice">Fixed Price (L)</Label>
                    <NumericInput
                      id="fixedPrice"
                      value={formData.fixedPrice?.toString() || '0'}
                      onValueChange={(value) => handleInputChange('fixedPrice', value || 0)}
                      placeholder="0.00"
                      allowDecimals={true}
                      maxDecimals={2}
                      allowNegative={false}
                    />
                  </div>
                )}

                {formData.ruleType === 'buy_x_get_y' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyQuantity">Buy Quantity</Label>
                      <NumericInput
                        id="buyQuantity"
                        value={formData.buyQuantity?.toString() || '0'}
                        onValueChange={(value) => handleInputChange('buyQuantity', value || 0)}
                        placeholder="0"
                        allowDecimals={false}
                        allowNegative={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getQuantity">Get Quantity</Label>
                      <NumericInput
                        id="getQuantity"
                        value={formData.getQuantity?.toString() || '0'}
                        onValueChange={(value) => handleInputChange('getQuantity', value || 0)}
                        placeholder="0"
                        allowDecimals={false}
                        allowNegative={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="getDiscountPercentage">Get Discount (%)</Label>
                      <NumericInput
                        id="getDiscountPercentage"
                        value={formData.getDiscountPercentage?.toString() || '0'}
                        onValueChange={(value) => handleInputChange('getDiscountPercentage', value || 0)}
                        placeholder="100 for free"
                        allowDecimals={true}
                        maxDecimals={2}
                        allowNegative={false}
                      />
                    </div>
                  </div>
                )}

                {formData.ruleType === 'quantity_discount' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Quantity Tiers</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTier}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tier
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.quantityTiers.map((tier, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Tier {index + 1}</Badge>
                            {formData.quantityTiers.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTier(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label>Min Quantity</Label>
                              <NumericInput
                                value={tier.minQuantity?.toString() || '1'}
                                onValueChange={(value) => handleTierChange(index, 'minQuantity', value || 1)}
                                allowDecimals={false}
                                allowNegative={false}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Quantity</Label>
                              <NumericInput
                                value={tier.maxQuantity?.toString() || ''}
                                onValueChange={(value) => handleTierChange(index, 'maxQuantity', value)}
                                placeholder="Unlimited"
                                allowDecimals={false}
                                allowNegative={false}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Tier Price (L)</Label>
                              <NumericInput
                                value={tier.tierPrice?.toString() || ''}
                                onValueChange={(value) => handleTierChange(index, 'tierPrice', value)}
                                placeholder="Fixed price"
                                allowDecimals={true}
                                maxDecimals={2}
                                allowNegative={false}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Discount (%)</Label>
                              <NumericInput
                                value={tier.tierDiscountPercentage?.toString() || '0'}
                                onValueChange={(value) => handleTierChange(index, 'tierDiscountPercentage', value || 0)}
                                allowDecimals={true}
                                maxDecimals={2}
                                allowNegative={false}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Rule Conditions</span>
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define when this pricing rule should be applied. Leave empty to apply to all eligible items.
                </p>
                
                {formData.conditions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No conditions set - applies to all eligible items</p>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Condition
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Condition {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <Label>Condition Type</Label>
                            <Select
                              value={condition.conditionType}
                              onValueChange={(value) => handleConditionChange(index, 'conditionType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cart_subtotal">Cart Subtotal</SelectItem>
                                <SelectItem value="cart_quantity">Cart Quantity</SelectItem>
                                <SelectItem value="product_quantity">Product Quantity</SelectItem>
                                <SelectItem value="client_has_tag">Client Has Tag</SelectItem>
                                <SelectItem value="product_has_tag">Product Has Tag</SelectItem>
                                <SelectItem value="product_category">Product Category</SelectItem>
                                <SelectItem value="invoice_has_tag">Invoice Has Tag</SelectItem>
                                <SelectItem value="day_of_week">Day of Week</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Operator</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) => handleConditionChange(index, 'operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="greater_equal">Greater or Equal</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                                <SelectItem value="less_equal">Less or Equal</SelectItem>
                                <SelectItem value="in">In</SelectItem>
                                <SelectItem value="not_in">Not In</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Value</Label>
                            {(['cart_subtotal', 'cart_quantity', 'product_quantity'].includes(condition.conditionType)) ? (
                              <NumericInput
                                value={condition.valueNumber?.toString() || ''}
                                onValueChange={(value) => handleConditionChange(index, 'valueNumber', value)}
                                placeholder="Enter value"
                                allowDecimals={condition.conditionType === 'cart_subtotal'}
                                allowNegative={false}
                              />
                            ) : (
                              <Input
                                value={condition.valueText || ''}
                                onChange={(e) => handleConditionChange(index, 'valueText', e.target.value)}
                                placeholder="Enter value"
                              />
                            )}
                          </div>

                          {index > 0 && (
                            <div className="space-y-2">
                              <Label>Logic with Previous</Label>
                              <Select
                                value={condition.logicalOperator}
                                onValueChange={(value) => handleConditionChange(index, 'logicalOperator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">AND</SelectItem>
                                  <SelectItem value="OR">OR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Rule Targets</span>
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addTarget}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Target
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define which products this pricing rule should target.
                </p>
                
                <div className="space-y-3">
                  {formData.targets.map((target, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Target {index + 1}</Badge>
                        {formData.targets.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTarget(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Target Type</Label>
                          <Select
                            value={target.targetType}
                            onValueChange={(value) => handleTargetChange(index, 'targetType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all_products">All Products</SelectItem>
                              <SelectItem value="specific_products">Specific Products</SelectItem>
                              <SelectItem value="products_with_tag">Products with Tag</SelectItem>
                              <SelectItem value="product_category">Product Category</SelectItem>
                              <SelectItem value="cheapest_item">Cheapest Item</SelectItem>
                              <SelectItem value="most_expensive_item">Most Expensive Item</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {target.targetType !== 'all_products' && target.targetType !== 'cheapest_item' && target.targetType !== 'most_expensive_item' && (
                          <div className="space-y-2">
                            <Label>Target Values</Label>
                            <Input
                              value={target.targetIds || target.targetTags || ''}
                              onChange={(e) => {
                                const field = target.targetType.includes('tag') ? 'targetTags' : 'targetIds';
                                handleTargetChange(index, field, e.target.value);
                              }}
                              placeholder={target.targetType.includes('tag') ? 'Enter tag names' : 'Enter IDs (comma-separated)'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Schedule & Limits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <NumericInput
                      id="usageLimit"
                      value={formData.usageLimit?.toString() || ''}
                      onValueChange={(value) => handleInputChange('usageLimit', value)}
                      placeholder="Unlimited"
                      allowDecimals={false}
                      allowNegative={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usageLimitPerCustomer">Usage Limit Per Customer</Label>
                    <NumericInput
                      id="usageLimitPerCustomer"
                      value={formData.usageLimitPerCustomer?.toString() || ''}
                      onValueChange={(value) => handleInputChange('usageLimitPerCustomer', value)}
                      placeholder="Unlimited"
                      allowDecimals={false}
                      allowNegative={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Rule Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Rule is active</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Inactive rules will not be applied to orders
                </p>
              </CardContent>
            </Card>

            {/* Rule Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rule Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Rule Type:</span>
                    <Badge className="capitalize">
                      {formData.ruleType.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {formData.ruleType === 'percentage_discount' && (
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>{formData.discountPercentage}% off</span>
                    </div>
                  )}
                  
                  {formData.ruleType === 'fixed_amount_discount' && (
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>{formatCurrency(formData.discountAmount || 0)} off</span>
                    </div>
                  )}
                  
                  {formData.ruleType === 'fixed_price' && (
                    <div className="flex justify-between text-sm">
                      <span>Fixed Price:</span>
                      <span>{formatCurrency(formData.fixedPrice || 0)}</span>
                    </div>
                  )}
                  
                  {formData.ruleType === 'buy_x_get_y' && (
                    <div className="flex justify-between text-sm">
                      <span>Offer:</span>
                      <span>Buy {formData.buyQuantity}, Get {formData.getQuantity} ({formData.getDiscountPercentage}% off)</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Priority:</span>
                    <span>{formData.priority}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Conditions:</span>
                    <span>{formData.conditions.length} condition(s)</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Targets:</span>
                    <span>{formData.targets.length} target(s)</span>
                  </div>
                  
                  {formData.ruleType === 'quantity_discount' && (
                    <div className="flex justify-between text-sm">
                      <span>Quantity Tiers:</span>
                      <span>{formData.quantityTiers.length} tier(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}