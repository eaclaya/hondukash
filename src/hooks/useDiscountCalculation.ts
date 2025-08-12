import { useState, useEffect, useMemo, useCallback } from 'react';
import { Client, ProductWithInventory } from '@/lib/types';
import {
  DiscountCalculationContext,
  PricingRule,
  CartItem
} from '@/lib/types/discounts';
// import { DiscountEngine } from '@/lib/services/discountEngine'; // Temporarily unused due to async issues
import { useAuth } from '@/contexts/AuthContext';

interface UseDiscountCalculationProps {
  selectedClient: Client | null;
  items: Array<{
    productId: number | null;
    quantity: number;
    unitPrice: number;
    productName: string;
  }>;
  storeId: number;
}

interface DiscountSummary {
  originalSubtotal: number;
  discountAmount: number;
  finalSubtotal: number;
  appliedDiscounts: Array<{
    ruleName: string;
    ruleType: string;
    discountAmount: number;
    description: string;
  }>;
  hasDiscounts: boolean;
}

export function useDiscountCalculation({
  selectedClient,
  items,
  storeId
}: UseDiscountCalculationProps) {
  const { getAuthHeaders } = useAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fetch pricing rules on component mount
  useEffect(() => {
    const fetchPricingRules = async () => {
      console.log('fetchPricingRules');
      if (!storeId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Call the API endpoint instead of direct service
        const response = await fetch(`/api/pricing-rules?limit=100&storeId=${storeId}`, {
          headers: getAuthHeaders()
        });

        console.log('response', response);
        if (response.ok) {
          const result = await response.json();
          console.log('result', result);
          
          // Filter only active rules
          const activeRules = result.data ? result.data.filter((rule: any) => rule.isActive) : [];
          setPricingRules(activeRules);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Failed to fetch pricing rules');
        }
      } catch (err) {
        console.error('Error fetching pricing rules:', err);
        setError('Failed to fetch pricing rules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingRules();
  }, [storeId, getAuthHeaders]);

  // Create a stable key for items that only changes when relevant data changes
  const itemsCalculationKey = useMemo(() => {
    return items.map(item => 
      `${item.productId}-${item.quantity}-${item.unitPrice}-${item.productName}`
    ).join('|');
  }, [items]);

  // Calculate discounts only when client ID, item calculation key, or rules change
  const discountCalculation = useMemo(() => {
    console.log('=== DISCOUNT CALCULATION TRIGGERED ===');
    console.log('🔄 Recalculating due to changes in:', {
      clientId: selectedClient?.id,
      itemsKey: itemsCalculationKey,
      rulesCount: pricingRules.length
    });
    console.log('📊 Client:', selectedClient?.name);
    console.log('📊 Items:', items.length, 'Pricing Rules:', pricingRules.length);
    
    const originalSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    console.log('originalSubtotal:', originalSubtotal);

    if (!selectedClient || items.length === 0) {
      console.log('❌ Early exit: no client or no items');
      return {
        originalSubtotal,
        discountAmount: 0,
        finalSubtotal: originalSubtotal,
        appliedDiscounts: [],
        hasDiscounts: false,
        calculationResult: null
      };
    }

    console.log('✅ Proceeding with discount calculation');

    // Convert items to CartItem format for DiscountEngine
    const cartItems: CartItem[] = items
      .filter(item => item.productId && item.productId > 0)
      .map(item => ({
        productId: item.productId!.toString(),
        sku: '', // We'll need to get this from product data
        categoryId: undefined,
        productTags: [], // We'll need to get this from product data
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        product: {
          name: item.productName
        }
      }));

    if (cartItems.length === 0) {
      const originalSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      return {
        originalSubtotal,
        discountAmount: 0,
        finalSubtotal: originalSubtotal,
        appliedDiscounts: [],
        hasDiscounts: false,
        calculationResult: null
      };
    }

    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Safely parse client tags
    const clientTags: string[] = [];
    if (selectedClient.tags) {
      if (Array.isArray(selectedClient.tags)) {
        clientTags.push(...selectedClient.tags);
      } else if (typeof selectedClient.tags === 'string') {
        try {
          const parsed = JSON.parse(selectedClient.tags);
          if (Array.isArray(parsed)) {
            clientTags.push(...parsed);
          }
        } catch {
          // If parsing fails, split by comma
          clientTags.push(...(selectedClient.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0));
        }
      }
    }
    console.log('👤 Parsed client tags:', clientTags);

    try {
      console.log('🛒 Cart details:', {
        cartSubtotal,
        cartQuantity,
        clientTags,
        cartItems: cartItems.length
      });

      // Check for applicable pricing rules
      let bestDiscount = 0;
      let bestDiscountRule = null;
      
      console.log('🔍 Evaluating', pricingRules.length, 'pricing rules...');
      
      for (const rule of pricingRules) {
        console.log('📋 Checking rule:', rule.name, 'type:', rule.ruleType);
        
        // Simple rule evaluation - check common conditions
        let ruleApplies = true;
        
        // Check if rule has conditions
        if (rule.conditions && rule.conditions.length > 0) {
          console.log('  📝 Rule has', rule.conditions.length, 'conditions');
          
          for (const condition of rule.conditions) {
            console.log('  🔍 Checking condition:', condition.conditionType, condition.operator, condition.valueNumber || condition.valueText);
            
            switch (condition.conditionType) {
              case 'cart_subtotal':
                if (condition.operator === 'greater_equal' && cartSubtotal < (condition.valueNumber || 0)) {
                  console.log('    ❌ Cart subtotal too low:', cartSubtotal, '<', condition.valueNumber);
                  ruleApplies = false;
                }
                break;
              case 'cart_quantity':
                if (condition.operator === 'greater_equal' && cartQuantity < (condition.valueNumber || 0)) {
                  console.log('    ❌ Cart quantity too low:', cartQuantity, '<', condition.valueNumber);
                  ruleApplies = false;
                }
                break;
              case 'client_has_tag':
                if (condition.operator === 'equals' && !clientTags.includes(condition.valueText || '')) {
                  console.log('    ❌ Client does not have required tag:', condition.valueText);
                  ruleApplies = false;
                }
                break;
              case 'client_has_any_tags':
                if (condition.valueArray && !condition.valueArray.some(tag => clientTags.includes(tag))) {
                  console.log('    ❌ Client does not have any of required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              case 'client_has_all_tags':
                if (condition.valueArray && !condition.valueArray.every(tag => clientTags.includes(tag))) {
                  console.log('    ❌ Client does not have all required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              case 'product_has_tag':
                // Check if any product in cart has the required tag
                const hasProductWithTag = cartItems.some(item => {
                  const productTags = item.productTags || [];
                  return productTags.includes(condition.valueText || '');
                });
                if (!hasProductWithTag) {
                  console.log('    ❌ No product has required tag:', condition.valueText);
                  ruleApplies = false;
                }
                break;
              case 'product_has_any_tags':
                // Check if any product in cart has any of the required tags  
                const hasProductWithAnyTag = cartItems.some(item => {
                  const productTags = item.productTags || [];
                  return condition.valueArray ? condition.valueArray.some(tag => productTags.includes(tag)) : false;
                });
                if (!hasProductWithAnyTag) {
                  console.log('    ❌ No product has any of required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              default:
                console.log('    ⚠️ Unknown condition type:', condition.conditionType);
                ruleApplies = false;
                break;
            }
            
            if (!ruleApplies) break;
          }
        } else {
          console.log('  📝 Rule has no conditions - SKIPPING (rules must have conditions to apply)');
          ruleApplies = false;
        }
        
        if (ruleApplies) {
          console.log('  ✅ Rule applies! Calculating discount...');
          
          // Calculate discount based on rule type
          let ruleDiscount = 0;
          
          switch (rule.ruleType) {
            case 'percentage_discount':
              ruleDiscount = cartSubtotal * (rule.discountPercentage / 100);
              console.log('    💰 Percentage discount:', rule.discountPercentage + '%', '=', ruleDiscount);
              break;
            case 'fixed_amount_discount':
              ruleDiscount = rule.discountAmount;
              console.log('    💰 Fixed amount discount:', ruleDiscount);
              break;
            default:
              console.log('    ⚠️ Rule type not yet supported:', rule.ruleType);
          }
          
          if (ruleDiscount > bestDiscount) {
            bestDiscount = ruleDiscount;
            bestDiscountRule = rule;
            console.log('    🏆 New best discount!', ruleDiscount);
          }
        } else {
          console.log('  ❌ Rule does not apply');
        }
      }
      
      // No fallback to client discount since discount_percentage field has been removed
      const clientDiscount = 0;
      
      console.log('👤 Client discount: 0 (discount_percentage field removed)');
      
      // Use the better discount
      const finalDiscount = Math.max(bestDiscount, clientDiscount);
      const finalRule = bestDiscount > clientDiscount ? bestDiscountRule : null;
      
      console.log('🎯 Final discount:', finalDiscount, 'from', finalRule ? finalRule.name : 'client discount');

      const finalSubtotal = cartSubtotal - finalDiscount;

      const appliedDiscounts = finalDiscount > 0 ? [{
        ruleName: finalRule ? finalRule.name : `Client Discount (${selectedClient.name})`,
        ruleType: finalRule ? finalRule.ruleType : 'percentage_discount',
        discountAmount: finalDiscount,
        description: finalRule ? 
          `${finalRule.name} - ${finalRule.ruleType}` : 
          `Client discount applied`
      }] : [];

      console.log('📊 Final calculation result:', {
        originalSubtotal: cartSubtotal,
        discountAmount: finalDiscount,
        finalSubtotal,
        hasDiscounts: finalDiscount > 0
      });

      return {
        originalSubtotal: cartSubtotal,
        discountAmount: finalDiscount,
        finalSubtotal,
        appliedDiscounts,
        hasDiscounts: finalDiscount > 0,
        calculationResult: null
      };

    } catch (err) {
      console.error('Error calculating discounts:', err);
      return {
        originalSubtotal: cartSubtotal,
        discountAmount: 0,
        finalSubtotal: cartSubtotal,
        appliedDiscounts: [],
        hasDiscounts: false,
        calculationResult: null
      };
    }
  }, [selectedClient?.id, selectedClient?.tags, itemsCalculationKey, pricingRules, storeId]);

  // Enhanced calculation function that can be called manually with product details
  const calculateDiscountsWithProductDetails = useCallback(async (
    productsWithInventory: ProductWithInventory[]
  ): Promise<DiscountSummary> => {
    if (!selectedClient || items.length === 0) {
      const originalSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      return {
        originalSubtotal,
        discountAmount: 0,
        finalSubtotal: originalSubtotal,
        appliedDiscounts: [],
        hasDiscounts: false
      };
    }

    // Convert items to CartItem format with full product details
    const cartItems: CartItem[] = items
      .filter(item => item.productId && item.productId > 0)
      .map(item => {
        const product = productsWithInventory.find(p => p.id === item.productId);

        // Safely parse product tags
        const productTags: string[] = [];
        if (product?.tags) {
          if (Array.isArray(product.tags)) {
            productTags.push(...product.tags);
          } else if (typeof product.tags === 'string') {
            try {
              const parsed = JSON.parse(product.tags);
              if (Array.isArray(parsed)) {
                productTags.push(...parsed);
              }
            } catch {
              productTags.push(...(product.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0));
            }
          }
        }

        return {
          productId: item.productId!.toString(),
          sku: product?.sku || '',
          categoryId: product?.categoryId?.toString(),
          productTags,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.quantity * item.unitPrice,
          product: {
            name: item.productName,
            category: product?.categoryName
          }
        };
      });

    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Safely parse client tags
    const clientTags: string[] = [];
    if (selectedClient.tags) {
      if (Array.isArray(selectedClient.tags)) {
        clientTags.push(...selectedClient.tags);
      } else if (typeof selectedClient.tags === 'string') {
        try {
          const parsed = JSON.parse(selectedClient.tags);
          if (Array.isArray(parsed)) {
            clientTags.push(...parsed);
          }
        } catch {
          clientTags.push(...(selectedClient.tags as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0));
        }
      }
    }

    try {
      console.log('🔧 calculateDiscountsWithProductDetails - using same logic as main calculation');
      console.log('Cart details:', {
        cartSubtotal,
        cartQuantity,
        clientTags,
        cartItems: cartItems.length
      });

      // Use the same logic as the main calculation to avoid async DiscountEngine issues
      // Check for applicable pricing rules
      let bestDiscount = 0;
      let bestDiscountRule = null;
      
      console.log('🔍 Evaluating', pricingRules.length, 'pricing rules...');
      
      for (const rule of pricingRules) {
        console.log('📋 Checking rule:', rule.name, 'type:', rule.ruleType);
        
        // Simple rule evaluation - check common conditions
        let ruleApplies = true;
        
        // Check if rule has conditions
        if (rule.conditions && rule.conditions.length > 0) {
          console.log('  📝 Rule has', rule.conditions.length, 'conditions');
          
          for (const condition of rule.conditions) {
            console.log('  🔍 Checking condition:', condition.conditionType, condition.operator, condition.valueNumber || condition.valueText);
            
            switch (condition.conditionType) {
              case 'cart_subtotal':
                if (condition.operator === 'greater_equal' && cartSubtotal < (condition.valueNumber || 0)) {
                  console.log('    ❌ Cart subtotal too low:', cartSubtotal, '<', condition.valueNumber);
                  ruleApplies = false;
                }
                break;
              case 'cart_quantity':
                if (condition.operator === 'greater_equal' && cartQuantity < (condition.valueNumber || 0)) {
                  console.log('    ❌ Cart quantity too low:', cartQuantity, '<', condition.valueNumber);
                  ruleApplies = false;
                }
                break;
              case 'client_has_tag':
                if (condition.operator === 'equals' && !clientTags.includes(condition.valueText || '')) {
                  console.log('    ❌ Client does not have required tag:', condition.valueText);
                  ruleApplies = false;
                }
                break;
              case 'client_has_any_tags':
                if (condition.valueArray && !condition.valueArray.some(tag => clientTags.includes(tag))) {
                  console.log('    ❌ Client does not have any of required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              case 'client_has_all_tags':
                if (condition.valueArray && !condition.valueArray.every(tag => clientTags.includes(tag))) {
                  console.log('    ❌ Client does not have all required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              case 'product_has_tag':
                // Check if any product in cart has the required tag
                const hasProductWithTag = cartItems.some(item => {
                  const productTags = item.productTags || [];
                  return productTags.includes(condition.valueText || '');
                });
                if (!hasProductWithTag) {
                  console.log('    ❌ No product has required tag:', condition.valueText);
                  ruleApplies = false;
                }
                break;
              case 'product_has_any_tags':
                // Check if any product in cart has any of the required tags  
                const hasProductWithAnyTag = cartItems.some(item => {
                  const productTags = item.productTags || [];
                  return condition.valueArray ? condition.valueArray.some(tag => productTags.includes(tag)) : false;
                });
                if (!hasProductWithAnyTag) {
                  console.log('    ❌ No product has any of required tags:', condition.valueArray);
                  ruleApplies = false;
                }
                break;
              default:
                console.log('    ⚠️ Unknown condition type:', condition.conditionType);
                ruleApplies = false;
                break;
            }
            
            if (!ruleApplies) break;
          }
        } else {
          console.log('  📝 Rule has no conditions - SKIPPING (rules must have conditions to apply)');
          ruleApplies = false;
        }
        
        if (ruleApplies) {
          console.log('  ✅ Rule applies! Calculating discount...');
          
          // Calculate discount based on rule type
          let ruleDiscount = 0;
          
          switch (rule.ruleType) {
            case 'percentage_discount':
              ruleDiscount = cartSubtotal * (rule.discountPercentage / 100);
              console.log('    💰 Percentage discount:', rule.discountPercentage + '%', '=', ruleDiscount);
              break;
            case 'fixed_amount_discount':
              ruleDiscount = rule.discountAmount;
              console.log('    💰 Fixed amount discount:', ruleDiscount);
              break;
            default:
              console.log('    ⚠️ Rule type not yet supported:', rule.ruleType);
          }
          
          if (ruleDiscount > bestDiscount) {
            bestDiscount = ruleDiscount;
            bestDiscountRule = rule;
            console.log('    🏆 New best discount!', ruleDiscount);
          }
        } else {
          console.log('  ❌ Rule does not apply');
        }
      }

      // No fallback to client discount since discount_percentage field has been removed
      const clientDiscount = 0;
      
      console.log('👤 Client discount: 0 (discount_percentage field removed)');
      
      // Use the better discount
      const finalDiscount = Math.max(bestDiscount, clientDiscount);
      const finalRule = bestDiscount > clientDiscount ? bestDiscountRule : null;
      
      console.log('🎯 Final discount:', finalDiscount, 'from', finalRule ? finalRule.name : 'client discount');

      const appliedDiscounts = finalDiscount > 0 ? [{
        ruleName: finalRule ? finalRule.name : `Client Discount (${selectedClient.name})`,
        ruleType: finalRule ? finalRule.ruleType : 'percentage_discount',
        discountAmount: finalDiscount,
        description: finalRule ? 
          `${finalRule.name} - ${finalRule.ruleType}` : 
          `Client discount applied`
      }] : [];

      return {
        originalSubtotal: cartSubtotal,
        discountAmount: finalDiscount,
        finalSubtotal: cartSubtotal - finalDiscount,
        appliedDiscounts,
        hasDiscounts: finalDiscount > 0
      };

    } catch (err) {
      console.error('Error calculating discounts with product details:', err);

      // Fallback: no client discount since field was removed
      return {
        originalSubtotal: cartSubtotal,
        discountAmount: 0,
        finalSubtotal: cartSubtotal,
        appliedDiscounts: [],
        hasDiscounts: false
      };
    }
  }, [selectedClient, items, pricingRules, storeId]);

  return {
    ...discountCalculation,
    isLoading,
    error,
    calculateDiscountsWithProductDetails,
    pricingRules,
    hasActivePricingRules: pricingRules.length > 0
  };
}