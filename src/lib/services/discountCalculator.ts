import { PricingRule, RuleCondition, RuleTarget, QuantityTier } from '@/hooks/usePricingRules';

export interface DiscountCalculationItem {
  productId: number | null;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  tags?: string[];
  categoryId?: number;
}

export interface DiscountCalculationContext {
  items: DiscountCalculationItem[];
  clientId?: number;
  subtotal: number;
  clientTags?: string[];
  invoiceTags?: string[];
}

export interface AppliedDiscount {
  ruleId: number;
  ruleName: string;
  ruleType: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  appliedToItems: {
    itemIndex: number;
    productId: number | null;
    discountAmount: number;
    originalPrice: number;
    finalPrice: number;
  }[];
}

export interface DiscountCalculationResult {
  originalSubtotal: number;
  totalDiscountAmount: number;
  finalSubtotal: number;
  appliedDiscounts: AppliedDiscount[];
  updatedItems: DiscountCalculationItem[];
}

export class DiscountCalculator {
  /**
   * Calculate discounts for a given context using pricing rules
   */
  static calculateDiscounts(context: DiscountCalculationContext, pricingRules: PricingRule[]): DiscountCalculationResult {
    const result: DiscountCalculationResult = {
      originalSubtotal: context.subtotal,
      totalDiscountAmount: 0,
      finalSubtotal: context.subtotal,
      appliedDiscounts: [],
      updatedItems: [...context.items]
    };

    // Sort rules by priority (higher priority first)
    const sortedRules = [...pricingRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Check if rule can be applied
      if (!this.canApplyRule(rule, context, result)) {
        continue;
      }

      // Apply the rule
      const discount = this.applyRule(rule, context, result);
      console.log('discount', discount);
      if (discount) {
        result.appliedDiscounts.push(discount);
        result.totalDiscountAmount += discount.discountAmount;
      }
    }

    result.finalSubtotal = result.originalSubtotal - result.totalDiscountAmount;
    return result;
  }

  /**
   * Check if a rule can be applied to the current context
   */
  private static canApplyRule(rule: PricingRule, context: DiscountCalculationContext, currentResult: DiscountCalculationResult): boolean {
    console.log('canApplyRule', rule);
    // Check if rule is active
    if (!rule.isActive) {
      return false;
    }

    // Check date constraints
    const now = new Date();
    if (rule.startDate && new Date(rule.startDate) > now) {
      return false;
    }
    if (rule.endDate && new Date(rule.endDate) < now) {
      return false;
    }

    // Check usage limits
    if (rule.usageLimit && rule.usageCount >= rule.usageLimit) {
      return false;
    }

    // Check if any targets match
    if (!this.hasMatchingTargets(rule.targets, context)) {
      return false;
    }

    // Check if all conditions are met
    if (!this.evaluateConditions(rule.conditions, context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if rule targets match the context
   */
  private static hasMatchingTargets(targets: RuleTarget[], context: DiscountCalculationContext): boolean {
    if (!targets || targets.length === 0) {
      return true; // No targets means apply to all
    }

    for (const target of targets) {
      switch (target.targetType) {
        case 'all_products':
          return true;

        case 'specific_products':
          if (target.targetIds) {
            const productIds = JSON.parse(target.targetIds) as number[];
            const hasMatchingProduct = context.items.some((item) => item.productId && productIds.includes(item.productId));
            if (hasMatchingProduct) return true;
          }
          break;

        case 'products_with_tag':
          if (target.targetTags) {
            const requiredTags = JSON.parse(target.targetTags) as string[];
            const hasMatchingTag = context.items.some((item) => item.tags && requiredTags.every((tag) => item.tags!.includes(tag)));
            if (hasMatchingTag) return true;
          }
          break;

        case 'products_with_any_tags':
          if (target.targetTags) {
            const anyTags = JSON.parse(target.targetTags) as string[];
            const hasAnyTag = context.items.some((item) => item.tags && anyTags.some((tag) => item.tags!.includes(tag)));
            if (hasAnyTag) return true;
          }
          break;

        case 'cheapest_item':
        case 'most_expensive_item':
          return context.items.length > 0;
      }
    }

    return false;
  }

  /**
   * Evaluate rule conditions
   */
  private static evaluateConditions(conditions: RuleCondition[], context: DiscountCalculationContext): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always apply
    }

    // Group conditions by condition_group
    const groups: { [key: number]: RuleCondition[] } = {};
    conditions.forEach((condition) => {
      if (!groups[condition.conditionGroup]) {
        groups[condition.conditionGroup] = [];
      }
      groups[condition.conditionGroup].push(condition);
    });

    // All groups must evaluate to true (groups are AND'ed together)
    return Object.values(groups).every((group) => this.evaluateConditionGroup(group, context));
  }

  /**
   * Evaluate a group of conditions (within a group, conditions are AND/OR'ed based on logical_operator)
   */
  private static evaluateConditionGroup(conditions: RuleCondition[], context: DiscountCalculationContext): boolean {
    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);
      console.log('conditionResult', conditionResult, context);
      if (currentOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentOperator = condition.logicalOperator;
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(condition: RuleCondition, context: DiscountCalculationContext): boolean {
    let requiredTags = [];
    switch (condition.conditionType) {
      case 'cart_total':
        return this.evaluateNumericCondition(condition, context.subtotal);

      case 'cart_quantity':
        const totalQuantity = context.items.reduce((sum, item) => sum + item.quantity, 0);
        return this.evaluateNumericCondition(condition, totalQuantity);

      case 'client_id':
        return this.evaluateNumericCondition(condition, context.clientId || 0);

      case 'client_has_tag':
      case 'client_has_any_tags':
        requiredTags = condition.valueText ? [condition.valueText] : condition.valueArray ? (JSON.parse(condition.valueArray) as string[]) : [];
        if (requiredTags && context.clientTags) {
          return requiredTags.some((tag) => context.clientTags!.includes(tag));
        }
        return false;

      case 'invoice_has_tag':
      case 'invoice_has_any_tags':
        requiredTags = condition.valueText ? [condition.valueText] : condition.valueArray ? (JSON.parse(condition.valueArray) as string[]) : [];
        if (requiredTags && context.invoiceTags) {
          return requiredTags.some((tag) => context.invoiceTags!.includes(tag));
        }
        return false;

      case 'item_quantity':
        return context.items.some((item) => this.evaluateNumericCondition(condition, item.quantity));

      case 'item_price':
        return context.items.some((item) => this.evaluateNumericCondition(condition, item.unitPrice));

      default:
        return true;
    }
  }

  /**
   * Evaluate numeric conditions (greater_than, less_than, etc.)
   */
  private static evaluateNumericCondition(condition: RuleCondition, value: number): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === (condition.valueNumber || 0);
      case 'not_equals':
        return value !== (condition.valueNumber || 0);
      case 'greater_than':
        return value > (condition.valueNumber || 0);
      case 'greater_equal':
        return value >= (condition.valueNumber || 0);
      case 'less_than':
        return value < (condition.valueNumber || 0);
      case 'less_equal':
        return value <= (condition.valueNumber || 0);
      case 'between':
        return value >= (condition.valueStart || 0) && value <= (condition.valueEnd || 0);
      default:
        return true;
    }
  }

  /**
   * Apply a specific rule to the context
   */
  private static applyRule(rule: PricingRule, context: DiscountCalculationContext, currentResult: DiscountCalculationResult): AppliedDiscount | null {
    switch (rule.ruleType) {
      case 'percentage_discount':
        return this.applyPercentageDiscount(rule, context, currentResult);

      case 'fixed_amount_discount':
        return this.applyFixedAmountDiscount(rule, context, currentResult);

      case 'fixed_price':
        return this.applyFixedPrice(rule, context, currentResult);

      case 'buy_x_get_y':
        return this.applyBuyXGetY(rule, context, currentResult);

      case 'quantity_discount':
        return this.applyQuantityDiscount(rule, context, currentResult);

      default:
        return null;
    }
  }

  /**
   * Apply percentage discount
   */
  private static applyPercentageDiscount(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentResult: DiscountCalculationResult
  ): AppliedDiscount | null {
    const targetItems = this.getTargetItems(rule.targets, context);
    if (targetItems.length === 0) return null;

    const appliedToItems: AppliedDiscount['appliedToItems'] = [];
    let totalDiscountAmount = 0;

    targetItems.forEach(({ item, index }) => {
      const discountAmount = item.lineTotal * (rule.discountPercentage / 100);
      totalDiscountAmount += discountAmount;

      appliedToItems.push({
        itemIndex: index,
        productId: item.productId,
        discountAmount,
        originalPrice: item.lineTotal,
        finalPrice: item.lineTotal - discountAmount
      });
    });

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount: totalDiscountAmount,
      originalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0),
      finalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0) - totalDiscountAmount,
      appliedToItems
    };
  }

  /**
   * Apply fixed amount discount
   */
  private static applyFixedAmountDiscount(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentResult: DiscountCalculationResult
  ): AppliedDiscount | null {
    const targetItems = this.getTargetItems(rule.targets, context);
    if (targetItems.length === 0) return null;

    const totalTargetAmount = targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0);
    const discountAmount = Math.min(rule.discountAmount, totalTargetAmount);

    const appliedToItems: AppliedDiscount['appliedToItems'] = [];

    // Distribute discount proportionally across target items
    targetItems.forEach(({ item, index }) => {
      const itemDiscountAmount = (item.lineTotal / totalTargetAmount) * discountAmount;

      appliedToItems.push({
        itemIndex: index,
        productId: item.productId,
        discountAmount: itemDiscountAmount,
        originalPrice: item.lineTotal,
        finalPrice: item.lineTotal - itemDiscountAmount
      });
    });

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount,
      originalAmount: totalTargetAmount,
      finalAmount: totalTargetAmount - discountAmount,
      appliedToItems
    };
  }

  /**
   * Apply fixed price rule
   */
  private static applyFixedPrice(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentResult: DiscountCalculationResult
  ): AppliedDiscount | null {
    const targetItems = this.getTargetItems(rule.targets, context);
    if (targetItems.length === 0) return null;

    const appliedToItems: AppliedDiscount['appliedToItems'] = [];
    let totalDiscountAmount = 0;

    targetItems.forEach(({ item, index }) => {
      const newPrice = rule.fixedPrice * item.quantity;
      const discountAmount = item.lineTotal - newPrice;

      if (discountAmount > 0) {
        totalDiscountAmount += discountAmount;

        appliedToItems.push({
          itemIndex: index,
          productId: item.productId,
          discountAmount,
          originalPrice: item.lineTotal,
          finalPrice: newPrice
        });
      }
    });

    if (totalDiscountAmount === 0) return null;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount: totalDiscountAmount,
      originalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0),
      finalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0) - totalDiscountAmount,
      appliedToItems
    };
  }

  /**
   * Apply buy X get Y discount
   */
  private static applyBuyXGetY(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentResult: DiscountCalculationResult
  ): AppliedDiscount | null {
    // This is a simplified implementation - you may need to enhance based on specific requirements
    const targetItems = this.getTargetItems(rule.targets, context);
    if (targetItems.length === 0) return null;

    const totalQuantity = targetItems.reduce((sum, { item }) => sum + item.quantity, 0);
    const setsEligible = Math.floor(totalQuantity / rule.buyQuantity);

    if (setsEligible === 0) return null;

    const freeQuantity = setsEligible * rule.getQuantity;
    const discountPercentage = rule.getDiscountPercentage / 100;

    // Apply discount to the cheapest items up to the free quantity
    const sortedItems = [...targetItems].sort((a, b) => a.item.unitPrice - b.item.unitPrice);

    const appliedToItems: AppliedDiscount['appliedToItems'] = [];
    let totalDiscountAmount = 0;
    let remainingFreeQuantity = freeQuantity;

    for (const { item, index } of sortedItems) {
      if (remainingFreeQuantity <= 0) break;

      const quantityToDiscount = Math.min(item.quantity, remainingFreeQuantity);
      const discountAmount = quantityToDiscount * item.unitPrice * discountPercentage;

      totalDiscountAmount += discountAmount;
      remainingFreeQuantity -= quantityToDiscount;

      appliedToItems.push({
        itemIndex: index,
        productId: item.productId,
        discountAmount,
        originalPrice: item.lineTotal,
        finalPrice: item.lineTotal - discountAmount
      });
    }

    if (totalDiscountAmount === 0) return null;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount: totalDiscountAmount,
      originalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0),
      finalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0) - totalDiscountAmount,
      appliedToItems
    };
  }

  /**
   * Apply quantity discount using tiers
   */
  private static applyQuantityDiscount(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentResult: DiscountCalculationResult
  ): AppliedDiscount | null {
    if (!rule.quantityTiers || rule.quantityTiers.length === 0) return null;

    const targetItems = this.getTargetItems(rule.targets, context);
    if (targetItems.length === 0) return null;

    const appliedToItems: AppliedDiscount['appliedToItems'] = [];
    let totalDiscountAmount = 0;

    targetItems.forEach(({ item, index }) => {
      // Find the appropriate tier for this item's quantity
      const tier = rule.quantityTiers
        .filter((t) => item.quantity >= t.minQuantity && (!t.maxQuantity || item.quantity <= t.maxQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0]; // Get the highest matching tier

      if (!tier) return;

      let discountAmount = 0;

      if (tier.tierPrice !== undefined && tier.tierPrice !== null) {
        // Fixed price per unit
        const newTotal = tier.tierPrice * item.quantity;
        discountAmount = item.lineTotal - newTotal;
      } else if (tier.tierDiscountPercentage !== undefined && tier.tierDiscountPercentage !== null) {
        // Percentage discount
        discountAmount = item.lineTotal * (tier.tierDiscountPercentage / 100);
      } else if (tier.tierDiscountAmount !== undefined && tier.tierDiscountAmount !== null) {
        // Fixed amount discount per unit
        discountAmount = tier.tierDiscountAmount * item.quantity;
      }

      if (discountAmount > 0) {
        totalDiscountAmount += discountAmount;

        appliedToItems.push({
          itemIndex: index,
          productId: item.productId,
          discountAmount,
          originalPrice: item.lineTotal,
          finalPrice: item.lineTotal - discountAmount
        });
      }
    });

    if (totalDiscountAmount === 0) return null;

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount: totalDiscountAmount,
      originalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0),
      finalAmount: targetItems.reduce((sum, { item }) => sum + item.lineTotal, 0) - totalDiscountAmount,
      appliedToItems
    };
  }

  /**
   * Get items that match the rule targets
   */
  private static getTargetItems(targets: RuleTarget[], context: DiscountCalculationContext): { item: DiscountCalculationItem; index: number }[] {
    if (!targets || targets.length === 0) {
      // No targets means apply to all items
      return context.items.map((item, index) => ({ item, index }));
    }

    const matchingItems: { item: DiscountCalculationItem; index: number }[] = [];

    for (const target of targets) {
      switch (target.targetType) {
        case 'all_products':
          return context.items.map((item, index) => ({ item, index }));

        case 'specific_products':
          if (target.targetIds) {
            const productIds = JSON.parse(target.targetIds) as number[];
            context.items.forEach((item, index) => {
              if (item.productId && productIds.includes(item.productId)) {
                matchingItems.push({ item, index });
              }
            });
          }
          break;

        case 'products_with_tag':
          if (target.targetTags) {
            const requiredTags = JSON.parse(target.targetTags) as string[];
            context.items.forEach((item, index) => {
              if (item.tags && requiredTags.every((tag) => item.tags!.includes(tag))) {
                matchingItems.push({ item, index });
              }
            });
          }
          break;

        case 'products_with_any_tags':
          if (target.targetTags) {
            const anyTags = JSON.parse(target.targetTags) as string[];
            context.items.forEach((item, index) => {
              if (item.tags && anyTags.some((tag) => item.tags!.includes(tag))) {
                matchingItems.push({ item, index });
              }
            });
          }
          break;

        case 'cheapest_item':
          if (context.items.length > 0) {
            const cheapestIndex = context.items.reduce(
              (minIndex, item, index) => (item.unitPrice < context.items[minIndex].unitPrice ? index : minIndex),
              0
            );
            matchingItems.push({ item: context.items[cheapestIndex], index: cheapestIndex });
          }
          break;

        case 'most_expensive_item':
          if (context.items.length > 0) {
            const expensiveIndex = context.items.reduce(
              (maxIndex, item, index) => (item.unitPrice > context.items[maxIndex].unitPrice ? index : maxIndex),
              0
            );
            matchingItems.push({ item: context.items[expensiveIndex], index: expensiveIndex });
          }
          break;
      }
    }

    // Remove duplicates
    const uniqueItems = matchingItems.filter((item, index, self) => self.findIndex((other) => other.index === item.index) === index);

    return uniqueItems;
  }
}
