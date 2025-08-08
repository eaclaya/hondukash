'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Percent, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';

// Types for pricing rules
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
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Simple debounce function
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export default function PricingRulesPage() {
  const router = useRouter();
  const [rulesData, setRulesData] = useState<PaginatedResponse<PricingRule> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { getAuthHeaders } = useAuth();

  // Debounce search input
  const debouncedSetSearch = useCallback(
    debounce((search: string) => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when searching
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  useEffect(() => {
    fetchRules();
  }, [currentPage, debouncedSearch]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const response = await fetch(`/api/pricing-rules?${searchParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing rules');
      }

      const data = await response.json();
      setRulesData(data);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) {
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

      // Refresh the rules list
      fetchRules();
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
        return `Buy ${rule.buyQuantity}, Get ${rule.getQuantity}`;
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

  const isRuleExpired = (rule: PricingRule) => {
    if (!rule.endDate) return false;
    return new Date(rule.endDate) < new Date();
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pricing Rules</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (loading && !rulesData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Pricing Rules</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoaderSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Rules</h1>
          <p className="text-muted-foreground">Manage discounts and pricing rules for your store</p>
        </div>
        <Button onClick={() => router.push('/pricing-rules/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search pricing rules by name, code, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {rulesData && rulesData.data.length === 0 && rulesData.pagination.total > 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No pricing rules found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms.</p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        </div>
      ) : !rulesData || rulesData.pagination.total === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Percent className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No pricing rules found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first pricing rule.</p>
          <Button onClick={() => router.push('/pricing-rules/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Pricing Rule
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesData?.data.map((rule) => {
                  const isExpired = isRuleExpired(rule);
                  
                  return (
                    <TableRow key={rule.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/pricing-rules/${rule.id}`)}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium hover:text-blue-600">{rule.name}</div>
                          {rule.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">{rule.description}</div>
                          )}
                          {rule.ruleCode && (
                            <div className="text-xs text-muted-foreground">Code: {rule.ruleCode}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getRuleTypeColor(rule.ruleType)}>
                          {getRuleTypeLabel(rule.ruleType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {getRuleValue(rule)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {rule.priority}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {rule.startDate && (
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(rule.startDate)}
                            </div>
                          )}
                          {rule.endDate && (
                            <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                              Until: {formatDate(rule.endDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.usageLimit ? (
                            <div>
                              <div className="font-medium">{rule.usageCount}/{rule.usageLimit}</div>
                              {rule.usageLimitPerCustomer && (
                                <div className="text-xs text-muted-foreground">
                                  {rule.usageLimitPerCustomer}/customer
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              {rule.usageCount > 0 ? `${rule.usageCount} times` : 'Unlimited'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
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
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/pricing-rules/${rule.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden grid gap-4">
            {rulesData?.data.map((rule) => {
              const isExpired = isRuleExpired(rule);
              
              return (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => router.push(`/pricing-rules/${rule.id}`)}
                    >
                      <h3 className="font-semibold hover:text-blue-600 line-clamp-2">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
                      )}
                      {rule.ruleCode && (
                        <p className="text-xs text-muted-foreground">Code: {rule.ruleCode}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/pricing-rules/${rule.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <Badge variant="secondary" className={getRuleTypeColor(rule.ruleType)}>
                        {getRuleTypeLabel(rule.ruleType)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Value</div>
                      <div className="font-medium">
                        {getRuleValue(rule)}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-sm">
                      <div className="text-muted-foreground">Priority: {rule.priority}</div>
                      {rule.usageLimit && (
                        <div className="text-xs text-muted-foreground">
                          Used: {rule.usageCount}/{rule.usageLimit}
                        </div>
                      )}
                    </div>
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {rulesData && rulesData.pagination.totalPages > 1 && (
            <Pagination
              currentPage={rulesData.pagination.page}
              totalPages={rulesData.pagination.totalPages}
              totalItems={rulesData.pagination.total}
              itemsPerPage={rulesData.pagination.limit}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}