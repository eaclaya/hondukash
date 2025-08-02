// =========================================
// DISCOUNT & PRICING RULES TYPES  
// =========================================

// Tags System Types
export interface Tag {
  id: string
  storeId: string
  name: string
  slug: string
  description?: string
  color: string
  category: 'general' | 'client' | 'product' | 'discount' | 'marketing' | 'custom'
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface EntityTag {
  id: string
  tagId: string
  entityType: 'client' | 'product' | 'invoice' | 'category' | 'user' | 'supplier' | 'expense'
  entityId: string
  assignedAt: string
  assignedBy?: string
  createdAt: string
  
  // Related entities
  tag?: Tag
}

export type RuleType = 
  | 'percentage_discount'    // 10% off
  | 'fixed_amount_discount'  // L 50 off
  | 'fixed_price'           // Set price to L 100
  | 'buy_x_get_y'           // Buy 2 get 1 free
  | 'quantity_discount'     // Bulk pricing tiers

export interface PricingRule {
  id: string
  storeId: string
  name: string
  description?: string
  ruleCode?: string
  ruleType: RuleType
  priority: number
  
  // Discount values
  discountPercentage: number
  discountAmount: number
  fixedPrice: number
  
  // Buy X Get Y settings
  buyQuantity: number
  getQuantity: number
  getDiscountPercentage: number
  
  // Status and dates
  isActive: boolean
  startDate?: string
  endDate?: string
  
  // Usage limits
  usageLimit?: number
  usageCount: number
  usageLimitPerCustomer?: number
  
  // Related entities
  conditions: RuleCondition[]
  targets: RuleTarget[]
  quantityTiers: QuantityPriceTier[]
  
  createdAt: string
  updatedAt: string
}

export type ConditionType =
  | 'cart_subtotal'           // Total cart amount
  | 'cart_quantity'           // Total items in cart
  | 'product_quantity'        // Quantity of specific product
  | 'client_has_tag'          // Client has specific tag
  | 'client_has_any_tags'     // Client has any of specified tags
  | 'client_has_all_tags'     // Client has all specified tags
  | 'product_has_tag'         // Product has specific tag
  | 'product_has_any_tags'    // Product has any of specified tags
  | 'product_category'        // Product in category
  | 'product_sku'            // Specific product SKU
  | 'day_of_week'            // Monday, Tuesday, etc.
  | 'time_of_day'            // Between certain hours
  | 'customer_total_purchases' // Customer lifetime value
  | 'invoice_has_tag'         // Invoice has specific tag

export type ConditionOperator =
  | 'equals' | 'not_equals' 
  | 'greater_than' | 'greater_equal' 
  | 'less_than' | 'less_equal' 
  | 'in' | 'not_in' | 'between'

export interface RuleCondition {
  id: string
  pricingRuleId: string
  conditionType: ConditionType
  operator: ConditionOperator
  valueText?: string
  valueNumber?: number
  valueArray?: string[]
  valueStart?: number
  valueEnd?: number
  logicalOperator: 'AND' | 'OR'
  conditionGroup: number
  createdAt: string
}

export type TargetType =
  | 'all_products'           // Apply to entire cart
  | 'specific_products'      // Specific product IDs
  | 'products_with_tag'      // Products that have specific tag
  | 'products_with_any_tags' // Products with any of specified tags
  | 'product_category'       // Products in category
  | 'cheapest_item'          // Cheapest item in cart
  | 'most_expensive_item'    // Most expensive item

export interface RuleTarget {
  id: string
  pricingRuleId: string
  targetType: TargetType
  targetIds?: string[]
  targetTags?: string[]  // Tag slugs for tag-based targeting
  createdAt: string
}

export interface DiscountUsage {
  id: string
  pricingRuleId: string
  invoiceId: string
  clientId?: string
  discountAmount: number
  originalAmount: number
  finalAmount: number
  appliedItems: unknown[]
  createdAt: string
  
  // Related entities
  pricingRule?: PricingRule
}

export interface QuantityPriceTier {
  id: string
  pricingRuleId: string
  minQuantity: number
  maxQuantity?: number
  tierPrice?: number
  tierDiscountPercentage?: number
  tierDiscountAmount?: number
  createdAt: string
}

// =========================================
// DISCOUNT CALCULATION TYPES
// =========================================

export interface DiscountCalculationContext {
  storeId: string
  clientId?: string
  clientTags: string[]  // Client tag slugs (replaces customerGroups)
  cartItems: CartItem[]
  cartSubtotal: number
  cartQuantity: number
  currentDate: Date
}

export interface CartItem {
  productId: string
  sku: string
  categoryId?: string
  productTags: string[]  // Product tag slugs
  quantity: number
  unitPrice: number
  lineTotal: number
  product?: {
    name: string
    category?: string
  }
}

export interface AppliedDiscount {
  ruleId: string
  ruleName: string
  ruleType: RuleType
  discountAmount: number
  originalAmount: number
  finalAmount: number
  appliedToItems: {
    productId: string
    quantity: number
    originalPrice: number
    finalPrice: number
    discountAmount: number
  }[]
}

export interface DiscountCalculationResult {
  originalTotal: number
  discountTotal: number
  finalTotal: number
  appliedDiscounts: AppliedDiscount[]
  updatedCartItems: (CartItem & {
    originalUnitPrice: number
    finalUnitPrice: number
    discountAmount: number
    appliedRules: string[]
  })[]
}

// =========================================
// FORM TYPES FOR CREATING RULES
// =========================================

export interface CreatePricingRuleRequest {
  name: string
  description?: string
  ruleCode?: string
  ruleType: RuleType
  priority?: number
  
  // Discount configuration
  discountPercentage?: number
  discountAmount?: number
  fixedPrice?: number
  
  // Buy X Get Y
  buyQuantity?: number
  getQuantity?: number
  getDiscountPercentage?: number
  
  // Schedule
  startDate?: string
  endDate?: string
  
  // Usage limits
  usageLimit?: number
  usageLimitPerCustomer?: number
  
  // Conditions
  conditions: Omit<RuleCondition, 'id' | 'pricingRuleId' | 'createdAt'>[]
  
  // Targets
  targets: Omit<RuleTarget, 'id' | 'pricingRuleId' | 'createdAt'>[]
  
  // Quantity tiers (for quantity discount rules)
  quantityTiers?: Omit<QuantityPriceTier, 'id' | 'pricingRuleId' | 'createdAt'>[]
}

export interface PricingRuleTemplate {
  id: string
  name: string
  description: string
  template: Partial<CreatePricingRuleRequest>
}

// =========================================
// PREDEFINED RULE TEMPLATES
// =========================================

export const RULE_TEMPLATES: PricingRuleTemplate[] = [
  {
    id: 'wholesale-quantity',
    name: 'Wholesale Quantity Discount',
    description: '5% off when buying 3 or more items',
    template: {
      name: 'Wholesale Quantity Discount',
      ruleType: 'percentage_discount',
      discountPercentage: 5,
      conditions: [
        {
          conditionType: 'cart_quantity',
          operator: 'greater_equal',
          valueNumber: 3,
          logicalOperator: 'AND',
          conditionGroup: 1
        }
      ],
      targets: [
        {
          targetType: 'all_products'
        }
      ]
    }
  },
  {
    id: 'wholesale-amount',
    name: 'Wholesale Amount Discount',
    description: '10% off when spending L 1000 or more',
    template: {
      name: 'Wholesale Amount Discount',
      ruleType: 'percentage_discount',
      discountPercentage: 10,
      conditions: [
        {
          conditionType: 'cart_subtotal',
          operator: 'greater_equal',
          valueNumber: 1000,
          logicalOperator: 'AND',
          conditionGroup: 1
        }
      ],
      targets: [
        {
          targetType: 'all_products'
        }
      ]
    }
  },
  {
    id: 'wholesale-client-discount',
    name: 'Wholesale Client Discount',
    description: '15% off for clients tagged as wholesaler',
    template: {
      name: 'Wholesale Client Discount',
      ruleType: 'percentage_discount',
      discountPercentage: 15,
      conditions: [
        {
          conditionType: 'client_has_tag',
          operator: 'equals',
          valueText: 'wholesaler',
          logicalOperator: 'AND',
          conditionGroup: 1
        }
      ],
      targets: [
        {
          targetType: 'all_products'
        }
      ]
    }
  },
  {
    id: 'buy-2-get-1',
    name: 'Buy 2 Get 1 Free',
    description: 'Buy 2 items, get 1 free',
    template: {
      name: 'Buy 2 Get 1 Free',
      ruleType: 'buy_x_get_y',
      buyQuantity: 2,
      getQuantity: 1,
      getDiscountPercentage: 100,
      conditions: [],
      targets: [
        {
          targetType: 'all_products'
        }
      ]
    }
  }
]