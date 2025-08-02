// =========================================
// DISCOUNT CALCULATION ENGINE
// =========================================
// This service handles the core logic for applying discount rules to cart items

import type {
  DiscountCalculationContext,
  DiscountCalculationResult,
  PricingRule,
  RuleCondition,
  RuleTarget,
  CartItem,
  AppliedDiscount,
  QuantityPriceTier,
  RuleType,
  ConditionType,
  ConditionOperator,
  TargetType
} from '@/lib/types/discounts'

export class DiscountEngine {
  /**
   * Calculate discounts for a given cart context
   */
  static async calculateDiscounts(
    context: DiscountCalculationContext,
    rules: PricingRule[]
  ): Promise<DiscountCalculationResult> {
    // Filter and sort active rules by priority
    const activeRules = rules
      .filter(rule => this.isRuleActive(rule, context.currentDate))
      .sort((a, b) => b.priority - a.priority) // Higher priority first

    const appliedDiscounts: AppliedDiscount[] = []
    let workingCartItems = [...context.cartItems]
    let currentSubtotal = context.cartSubtotal

    // Apply rules in priority order
    for (const rule of activeRules) {
      // Skip if usage limit exceeded
      if (this.isUsageLimitExceeded(rule)) {
        continue
      }

      // Check if rule conditions are met
      if (!this.evaluateRuleConditions(rule, context, currentSubtotal)) {
        continue
      }

      // Apply the discount
      const discount = this.applyRule(rule, workingCartItems, currentSubtotal)
      
      if (discount && discount.discountAmount > 0) {
        appliedDiscounts.push(discount)
        
        // Update working cart items and subtotal
        workingCartItems = discount.appliedToItems.map(item => {
          const cartItem = workingCartItems.find(ci => ci.productId === item.productId)!
          return {
            ...cartItem,
            unitPrice: item.finalPrice,
            lineTotal: item.finalPrice * item.quantity
          }
        })
        
        currentSubtotal = workingCartItems.reduce((sum, item) => sum + item.lineTotal, 0)
      }
    }

    // Calculate final totals
    const originalTotal = context.cartSubtotal
    const discountTotal = appliedDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0)
    const finalTotal = originalTotal - discountTotal

    // Create updated cart items with discount info
    const updatedCartItems = workingCartItems.map(item => ({
      ...item,
      originalUnitPrice: context.cartItems.find(ci => ci.productId === item.productId)?.unitPrice || item.unitPrice,
      finalUnitPrice: item.unitPrice,
      discountAmount: (context.cartItems.find(ci => ci.productId === item.productId)?.unitPrice || 0) - item.unitPrice,
      appliedRules: appliedDiscounts
        .filter(discount => discount.appliedToItems.some(ai => ai.productId === item.productId))
        .map(discount => discount.ruleId)
    }))

    return {
      originalTotal,
      discountTotal,
      finalTotal,
      appliedDiscounts,
      updatedCartItems
    }
  }

  /**
   * Check if a rule is currently active
   */
  private static isRuleActive(rule: PricingRule, currentDate: Date): boolean {
    if (!rule.isActive) return false

    // Check date range
    if (rule.startDate && new Date(rule.startDate) > currentDate) {
      return false
    }

    if (rule.endDate && new Date(rule.endDate) < currentDate) {
      return false
    }

    return true
  }

  /**
   * Check if rule usage limit is exceeded
   */
  private static isUsageLimitExceeded(rule: PricingRule): boolean {
    if (rule.usageLimit && rule.usageCount >= rule.usageLimit) {
      return true
    }
    return false
  }

  /**
   * Evaluate all conditions for a rule
   */
  private static evaluateRuleConditions(
    rule: PricingRule,
    context: DiscountCalculationContext,
    currentSubtotal: number
  ): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true // No conditions = always apply
    }

    // Group conditions by condition_group
    const conditionGroups = new Map<number, RuleCondition[]>()
    rule.conditions.forEach(condition => {
      const group = condition.conditionGroup || 1
      if (!conditionGroups.has(group)) {
        conditionGroups.set(group, [])
      }
      conditionGroups.get(group)!.push(condition)
    })

    // Evaluate each group (groups are OR'd together)
    for (const [groupId, conditions] of conditionGroups) {
      if (this.evaluateConditionGroup(conditions, context, currentSubtotal)) {
        return true // At least one group satisfied
      }
    }

    return false // No groups satisfied
  }

  /**
   * Evaluate a group of conditions (AND/OR logic within group)
   */
  private static evaluateConditionGroup(
    conditions: RuleCondition[],
    context: DiscountCalculationContext,
    currentSubtotal: number
  ): boolean {
    let result = true
    let hasOrCondition = false

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context, currentSubtotal)

      if (condition.logicalOperator === 'OR') {
        hasOrCondition = true
        if (conditionResult) {
          return true // OR condition satisfied
        }
      } else { // AND
        if (!conditionResult) {
          result = false
        }
      }
    }

    return hasOrCondition ? false : result
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(
    condition: RuleCondition,
    context: DiscountCalculationContext,
    currentSubtotal: number
  ): boolean {
    const { conditionType, operator } = condition

    let actualValue: unknown

    switch (conditionType) {
      case 'cart_subtotal':
        actualValue = currentSubtotal
        break
      case 'cart_quantity':
        actualValue = context.cartQuantity
        break
      case 'client_has_tag':
        return this.evaluateArrayCondition(context.clientTags, condition)
      case 'client_has_any_tags':
        return context.clientTags.some(tag => 
          condition.valueArray ? condition.valueArray.includes(tag) : false
        )
      case 'client_has_all_tags':
        return condition.valueArray ? 
          condition.valueArray.every(tag => context.clientTags.includes(tag)) : 
          false
      case 'product_has_tag':
        return context.cartItems.some(item => 
          this.evaluateArrayCondition(item.productTags, condition)
        )
      case 'product_has_any_tags':
        return context.cartItems.some(item =>
          condition.valueArray ? 
            item.productTags.some(tag => condition.valueArray!.includes(tag)) :
            false
        )
      case 'product_quantity':
        // Sum quantity for specific product
        actualValue = context.cartItems
          .filter(item => item.productId === condition.valueText)
          .reduce((sum, item) => sum + item.quantity, 0)
        break
      case 'product_category':
        return context.cartItems.some(item => 
          this.evaluateArrayCondition([item.categoryId || ''], condition)
        )
      case 'product_sku':
        return context.cartItems.some(item => 
          this.evaluateStringCondition(item.sku, condition)
        )
      case 'day_of_week':
        actualValue = context.currentDate.getDay().toString()
        break
      case 'time_of_day':
        actualValue = context.currentDate.getHours()
        break
      default:
        return false
    }

    return this.evaluateOperator(actualValue, operator, condition)
  }

  /**
   * Evaluate array-based conditions
   */
  private static evaluateArrayCondition(actualArray: string[], condition: RuleCondition): boolean {
    const { operator, valueText, valueArray } = condition

    switch (operator) {
      case 'equals':
        return actualArray.includes(valueText || '')
      case 'not_equals':
        return !actualArray.includes(valueText || '')
      case 'in':
        return valueArray ? actualArray.some(val => valueArray.includes(val)) : false
      case 'not_in':
        return valueArray ? !actualArray.some(val => valueArray.includes(val)) : true
      default:
        return false
    }
  }

  /**
   * Evaluate string-based conditions
   */
  private static evaluateStringCondition(actualValue: string, condition: RuleCondition): boolean {
    const { operator, valueText } = condition

    switch (operator) {
      case 'equals':
        return actualValue === valueText
      case 'not_equals':
        return actualValue !== valueText
      default:
        return false
    }
  }

  /**
   * Evaluate numeric operators
   */
  private static evaluateOperator(
    actualValue: number,
    operator: ConditionOperator,
    condition: RuleCondition
  ): boolean {
    const { valueNumber, valueStart, valueEnd } = condition

    switch (operator) {
      case 'equals':
        return actualValue === valueNumber
      case 'not_equals':
        return actualValue !== valueNumber
      case 'greater_than':
        return actualValue > (valueNumber || 0)
      case 'greater_equal':
        return actualValue >= (valueNumber || 0)
      case 'less_than':
        return actualValue < (valueNumber || 0)
      case 'less_equal':
        return actualValue <= (valueNumber || 0)
      case 'between':
        return actualValue >= (valueStart || 0) && actualValue <= (valueEnd || 0)
      default:
        return false
    }
  }

  /**
   * Apply a pricing rule to cart items
   */
  private static applyRule(
    rule: PricingRule,
    cartItems: CartItem[],
    currentSubtotal: number
  ): AppliedDiscount | null {
    // Get target items
    const targetItems = this.getTargetItems(rule, cartItems)
    if (targetItems.length === 0) {
      return null
    }

    let appliedToItems: AppliedDiscount['appliedToItems'] = []
    let totalDiscountAmount = 0

    switch (rule.ruleType) {
      case 'percentage_discount':
        appliedToItems = targetItems.map(item => {
          const discountAmount = item.unitPrice * (rule.discountPercentage / 100)
          const finalPrice = Math.max(item.unitPrice - discountAmount, 0)
          totalDiscountAmount += discountAmount * item.quantity
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            originalPrice: item.unitPrice,
            finalPrice,
            discountAmount
          }
        })
        break

      case 'fixed_amount_discount':
        // Distribute fixed discount across target items proportionally
        const totalTargetValue = targetItems.reduce((sum, item) => sum + item.lineTotal, 0)
        appliedToItems = targetItems.map(item => {
          const itemProportion = item.lineTotal / totalTargetValue
          const itemDiscount = rule.discountAmount * itemProportion / item.quantity
          const finalPrice = Math.max(item.unitPrice - itemDiscount, 0)
          totalDiscountAmount += itemDiscount * item.quantity
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            originalPrice: item.unitPrice,
            finalPrice,
            discountAmount: itemDiscount
          }
        })
        break

      case 'fixed_price':
        appliedToItems = targetItems.map(item => {
          const discountAmount = Math.max(item.unitPrice - rule.fixedPrice, 0)
          totalDiscountAmount += discountAmount * item.quantity
          
          return {
            productId: item.productId,
            quantity: item.quantity,
            originalPrice: item.unitPrice,
            finalPrice: rule.fixedPrice,
            discountAmount
          }
        })
        break

      case 'buy_x_get_y':
        appliedToItems = this.applyBuyXGetY(rule, targetItems)
        totalDiscountAmount = appliedToItems.reduce((sum, item) => 
          sum + item.discountAmount * item.quantity, 0
        )
        break

      case 'quantity_discount':
        appliedToItems = this.applyQuantityDiscount(rule, targetItems)
        totalDiscountAmount = appliedToItems.reduce((sum, item) => 
          sum + item.discountAmount * item.quantity, 0
        )
        break
    }

    if (totalDiscountAmount === 0) {
      return null
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      discountAmount: totalDiscountAmount,
      originalAmount: appliedToItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
      finalAmount: appliedToItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0),
      appliedToItems
    }
  }

  /**
   * Get cart items that match rule targets
   */
  private static getTargetItems(rule: PricingRule, cartItems: CartItem[]): CartItem[] {
    if (!rule.targets || rule.targets.length === 0) {
      return cartItems // No targets = all items
    }

    const targetItems: CartItem[] = []

    for (const target of rule.targets) {
      switch (target.targetType) {
        case 'all_products':
          targetItems.push(...cartItems)
          break
        case 'specific_products':
          if (target.targetIds) {
            targetItems.push(...cartItems.filter(item => 
              target.targetIds!.includes(item.productId)
            ))
          }
          break
        case 'products_with_tag':
          if (target.targetTags) {
            targetItems.push(...cartItems.filter(item => 
              target.targetTags!.some(tag => item.productTags.includes(tag))
            ))
          }
          break
        case 'products_with_any_tags':
          if (target.targetTags) {
            targetItems.push(...cartItems.filter(item => 
              item.productTags.some(productTag => 
                target.targetTags!.includes(productTag)
              )
            ))
          }
          break
        case 'product_category':
          if (target.targetIds) {
            targetItems.push(...cartItems.filter(item => 
              item.categoryId && target.targetIds!.includes(item.categoryId)
            ))
          }
          break
        case 'cheapest_item':
          const cheapest = cartItems.reduce((min, item) => 
            item.unitPrice < min.unitPrice ? item : min
          )
          targetItems.push(cheapest)
          break
        case 'most_expensive_item':
          const mostExpensive = cartItems.reduce((max, item) => 
            item.unitPrice > max.unitPrice ? item : max
          )
          targetItems.push(mostExpensive)
          break
      }
    }

    // Remove duplicates
    return targetItems.filter((item, index, self) => 
      index === self.findIndex(i => i.productId === item.productId)
    )
  }

  /**
   * Apply Buy X Get Y discount
   */
  private static applyBuyXGetY(rule: PricingRule, targetItems: CartItem[]): AppliedDiscount['appliedToItems'] {
    const result: AppliedDiscount['appliedToItems'] = []
    
    for (const item of targetItems) {
      const totalQuantity = item.quantity
      const buyQuantity = rule.buyQuantity
      const getQuantity = rule.getQuantity
      const getDiscountPercentage = rule.getDiscountPercentage
      
      // Calculate how many complete "buy X get Y" sets
      const completeSet = Math.floor(totalQuantity / (buyQuantity + getQuantity))
      const freeItems = completeSet * getQuantity
      
      if (freeItems > 0) {
        const discountPerUnit = item.unitPrice * (getDiscountPercentage / 100)
        result.push({
          productId: item.productId,
          quantity: freeItems,
          originalPrice: item.unitPrice,
          finalPrice: item.unitPrice - discountPerUnit,
          discountAmount: discountPerUnit
        })
      }
      
      // Remaining items at full price
      const remainingQuantity = totalQuantity - (completeSet * (buyQuantity + getQuantity))
      if (remainingQuantity > 0) {
        result.push({
          productId: item.productId,
          quantity: remainingQuantity,
          originalPrice: item.unitPrice,
          finalPrice: item.unitPrice,
          discountAmount: 0
        })
      }
    }
    
    return result
  }

  /**
   * Apply quantity-based tiered pricing
   */
  private static applyQuantityDiscount(rule: PricingRule, targetItems: CartItem[]): AppliedDiscount['appliedToItems'] {
    const result: AppliedDiscount['appliedToItems'] = []
    
    for (const item of targetItems) {
      const applicableTier = this.findApplicableTier(rule.quantityTiers, item.quantity)
      
      if (applicableTier) {
        let finalPrice = item.unitPrice
        let discountAmount = 0
        
        if (applicableTier.tierPrice !== undefined) {
          finalPrice = applicableTier.tierPrice
          discountAmount = item.unitPrice - finalPrice
        } else if (applicableTier.tierDiscountPercentage !== undefined) {
          discountAmount = item.unitPrice * (applicableTier.tierDiscountPercentage / 100)
          finalPrice = item.unitPrice - discountAmount
        } else if (applicableTier.tierDiscountAmount !== undefined) {
          discountAmount = applicableTier.tierDiscountAmount
          finalPrice = Math.max(item.unitPrice - discountAmount, 0)
        }
        
        result.push({
          productId: item.productId,
          quantity: item.quantity,
          originalPrice: item.unitPrice,
          finalPrice,
          discountAmount
        })
      } else {
        // No applicable tier, no discount
        result.push({
          productId: item.productId,
          quantity: item.quantity,
          originalPrice: item.unitPrice,
          finalPrice: item.unitPrice,
          discountAmount: 0
        })
      }
    }
    
    return result
  }

  /**
   * Find the applicable quantity tier for a given quantity
   */
  private static findApplicableTier(tiers: QuantityPriceTier[], quantity: number): QuantityPriceTier | null {
    return tiers
      .filter(tier => 
        quantity >= tier.minQuantity && 
        (tier.maxQuantity === null || quantity <= tier.maxQuantity)
      )
      .sort((a, b) => a.minQuantity - b.minQuantity)[0] || null
  }
}