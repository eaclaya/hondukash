// =========================================
// DISCOUNT SERVICE
// =========================================
// Database operations for discount and pricing rules

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type {
  PricingRule,
  RuleCondition,
  RuleTarget,
  QuantityPriceTier,
  DiscountUsage,
  CreatePricingRuleRequest
} from '@/lib/types/discounts'

export class DiscountService {
  private static supabase = createClientComponentClient()

  // =========================================
  // CLIENT TAG HELPERS
  // =========================================

  /**
   * Get client tag slugs for discount calculation
   */
  static async getClientTagSlugs(clientId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        tag:tags!inner(slug)
      `)
      .eq('entity_type', 'client')
      .eq('entity_id', clientId)
      .eq('tags.is_active', true)

    if (error) throw error
    return (data || []).map(item => item.tag.slug).filter(Boolean)
  }

  /**
   * Get product tag slugs for cart items
   */
  static async getProductTagSlugs(productIds: string[]): Promise<Record<string, string[]>> {
    if (productIds.length === 0) return {}

    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        entity_id,
        tag:tags!inner(slug)
      `)
      .eq('entity_type', 'product')
      .in('entity_id', productIds)
      .eq('tags.is_active', true)

    if (error) throw error

    // Group by product ID
    const result: Record<string, string[]> = {}
    productIds.forEach(id => {
      result[id] = []
    })

    data?.forEach(item => {
      if (!result[item.entity_id]) {
        result[item.entity_id] = []
      }
      result[item.entity_id].push(item.tag.slug)
    })

    return result
  }

  // =========================================
  // PRICING RULES
  // =========================================

  /**
   * Get all pricing rules for a store
   */
  static async getPricingRules(storeId: string, includeInactive = false): Promise<PricingRule[]> {
    let query = this.supabase
      .from('pricing_rules')
      .select(`
        *,
        conditions:rule_conditions(*),
        targets:rule_targets(*),
        quantityTiers:quantity_price_tiers(*)
      `)
      .eq('store_id', storeId)
      .order('priority', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw error
    
    return (data || []).map(this.mapPricingRule)
  }

  /**
   * Get active pricing rules for discount calculation
   */
  static async getActivePricingRules(storeId: string): Promise<PricingRule[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from('pricing_rules')
      .select(`
        *,
        conditions:rule_conditions(*),
        targets:rule_targets(*),
        quantityTiers:quantity_price_tiers(*)
      `)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })

    if (error) throw error
    return (data || []).map(this.mapPricingRule)
  }

  /**
   * Create a new pricing rule
   */
  static async createPricingRule(storeId: string, request: CreatePricingRuleRequest): Promise<PricingRule> {
    // Create the main rule
    const { data: ruleData, error: ruleError } = await this.supabase
      .from('pricing_rules')
      .insert({
        store_id: storeId,
        name: request.name,
        description: request.description,
        rule_code: request.ruleCode,
        rule_type: request.ruleType,
        priority: request.priority || 0,
        discount_percentage: request.discountPercentage || 0,
        discount_amount: request.discountAmount || 0,
        fixed_price: request.fixedPrice || 0,
        buy_quantity: request.buyQuantity || 0,
        get_quantity: request.getQuantity || 0,
        get_discount_percentage: request.getDiscountPercentage || 0,
        start_date: request.startDate,
        end_date: request.endDate,
        usage_limit: request.usageLimit,
        usage_limit_per_customer: request.usageLimitPerCustomer
      })
      .select()
      .single()

    if (ruleError) throw ruleError

    const ruleId = ruleData.id

    // Create conditions
    if (request.conditions && request.conditions.length > 0) {
      const { error: conditionsError } = await this.supabase
        .from('rule_conditions')
        .insert(
          request.conditions.map(condition => ({
            pricing_rule_id: ruleId,
            condition_type: condition.conditionType,
            operator: condition.operator,
            value_text: condition.valueText,
            value_number: condition.valueNumber,
            value_array: condition.valueArray,
            value_start: condition.valueStart,
            value_end: condition.valueEnd,
            logical_operator: condition.logicalOperator,
            condition_group: condition.conditionGroup
          }))
        )

      if (conditionsError) throw conditionsError
    }

    // Create targets
    if (request.targets && request.targets.length > 0) {
      const { error: targetsError } = await this.supabase
        .from('rule_targets')
        .insert(
          request.targets.map(target => ({
            pricing_rule_id: ruleId,
            target_type: target.targetType,
            target_ids: target.targetIds,
            target_tags: target.targetTags
          }))
        )

      if (targetsError) throw targetsError
    }

    // Create quantity tiers
    if (request.quantityTiers && request.quantityTiers.length > 0) {
      const { error: tiersError } = await this.supabase
        .from('quantity_price_tiers')
        .insert(
          request.quantityTiers.map(tier => ({
            pricing_rule_id: ruleId,
            min_quantity: tier.minQuantity,
            max_quantity: tier.maxQuantity,
            tier_price: tier.tierPrice,
            tier_discount_percentage: tier.tierDiscountPercentage,
            tier_discount_amount: tier.tierDiscountAmount
          }))
        )

      if (tiersError) throw tiersError
    }

    // Return the complete rule
    return this.getPricingRuleById(ruleId)
  }

  /**
   * Get pricing rule by ID
   */
  static async getPricingRuleById(id: string): Promise<PricingRule> {
    const { data, error } = await this.supabase
      .from('pricing_rules')
      .select(`
        *,
        conditions:rule_conditions(*),
        targets:rule_targets(*),
        quantityTiers:quantity_price_tiers(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return this.mapPricingRule(data)
  }

  /**
   * Update pricing rule
   */
  static async updatePricingRule(id: string, updates: Partial<CreatePricingRuleRequest>): Promise<PricingRule> {
    const { error } = await this.supabase
      .from('pricing_rules')
      .update({
        name: updates.name,
        description: updates.description,
        priority: updates.priority,
        discount_percentage: updates.discountPercentage,
        discount_amount: updates.discountAmount,
        fixed_price: updates.fixedPrice,
        buy_quantity: updates.buyQuantity,
        get_quantity: updates.getQuantity,
        get_discount_percentage: updates.getDiscountPercentage,
        start_date: updates.startDate,
        end_date: updates.endDate,
        usage_limit: updates.usageLimit,
        usage_limit_per_customer: updates.usageLimitPerCustomer
      })
      .eq('id', id)

    if (error) throw error
    return this.getPricingRuleById(id)
  }

  /**
   * Toggle pricing rule active status
   */
  static async togglePricingRule(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('pricing_rules')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Delete pricing rule
   */
  static async deletePricingRule(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // =========================================
  // DISCOUNT USAGE TRACKING
  // =========================================

  /**
   * Record discount usage
   */
  static async recordDiscountUsage(usage: Omit<DiscountUsage, 'id' | 'createdAt'>): Promise<DiscountUsage> {
    const { data, error } = await this.supabase
      .from('discount_usage')
      .insert({
        pricing_rule_id: usage.pricingRuleId,
        invoice_id: usage.invoiceId,
        client_id: usage.clientId,
        discount_amount: usage.discountAmount,
        original_amount: usage.originalAmount,
        final_amount: usage.finalAmount,
        applied_items: usage.appliedItems
      })
      .select()
      .single()

    if (error) throw error
    
    // Update rule usage count
    await this.supabase
      .from('pricing_rules')
      .update({ 
        usage_count: await this.getRuleUsageCount(usage.pricingRuleId) 
      })
      .eq('id', usage.pricingRuleId)

    return this.mapDiscountUsage(data)
  }

  /**
   * Get rule usage count
   */
  static async getRuleUsageCount(ruleId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('discount_usage')
      .select('*', { count: 'exact', head: true })
      .eq('pricing_rule_id', ruleId)

    if (error) throw error
    return count || 0
  }

  /**
   * Get customer usage count for a rule
   */
  static async getCustomerRuleUsageCount(ruleId: string, clientId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('discount_usage')
      .select('*', { count: 'exact', head: true })
      .eq('pricing_rule_id', ruleId)
      .eq('client_id', clientId)

    if (error) throw error
    return count || 0
  }

  // =========================================
  // MAPPING HELPERS
  // =========================================


  private static mapPricingRule(data: unknown): PricingRule {
    return {
      id: data.id,
      storeId: data.store_id,
      name: data.name,
      description: data.description,
      ruleCode: data.rule_code,
      ruleType: data.rule_type,
      priority: data.priority,
      discountPercentage: data.discount_percentage,
      discountAmount: data.discount_amount,
      fixedPrice: data.fixed_price,
      buyQuantity: data.buy_quantity,
      getQuantity: data.get_quantity,
      getDiscountPercentage: data.get_discount_percentage,
      isActive: data.is_active,
      startDate: data.start_date,
      endDate: data.end_date,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count,
      usageLimitPerCustomer: data.usage_limit_per_customer,
      conditions: (data.conditions || []).map(this.mapRuleCondition),
      targets: (data.targets || []).map(this.mapRuleTarget),
      quantityTiers: (data.quantityTiers || []).map(this.mapQuantityTier),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private static mapRuleCondition(data: unknown): RuleCondition {
    return {
      id: data.id,
      pricingRuleId: data.pricing_rule_id,
      conditionType: data.condition_type,
      operator: data.operator,
      valueText: data.value_text,
      valueNumber: data.value_number,
      valueArray: data.value_array,
      valueStart: data.value_start,
      valueEnd: data.value_end,
      logicalOperator: data.logical_operator,
      conditionGroup: data.condition_group,
      createdAt: data.created_at
    }
  }

  private static mapRuleTarget(data: unknown): RuleTarget {
    return {
      id: data.id,
      pricingRuleId: data.pricing_rule_id,
      targetType: data.target_type,
      targetIds: data.target_ids,
      targetTags: data.target_tags,
      createdAt: data.created_at
    }
  }

  private static mapQuantityTier(data: unknown): QuantityPriceTier {
    return {
      id: data.id,
      pricingRuleId: data.pricing_rule_id,
      minQuantity: data.min_quantity,
      maxQuantity: data.max_quantity,
      tierPrice: data.tier_price,
      tierDiscountPercentage: data.tier_discount_percentage,
      tierDiscountAmount: data.tier_discount_amount,
      createdAt: data.created_at
    }
  }

  private static mapDiscountUsage(data: unknown): DiscountUsage {
    return {
      id: data.id,
      pricingRuleId: data.pricing_rule_id,
      invoiceId: data.invoice_id,
      clientId: data.client_id,
      discountAmount: data.discount_amount,
      originalAmount: data.original_amount,
      finalAmount: data.final_amount,
      appliedItems: data.applied_items,
      createdAt: data.created_at
    }
  }
}