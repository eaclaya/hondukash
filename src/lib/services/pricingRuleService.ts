import { getTenantDb } from '@/lib/turso';
import { pricingRules, ruleConditions, ruleTargets, quantityPriceTiers, discountUsage } from '@/lib/db/schema/tenant';
import { eq, and, sql, like, or, count, desc, asc } from 'drizzle-orm';

// Types
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

interface CreatePricingRuleRequest {
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
  usageCount?: number;
  usageLimitPerCustomer?: number;
  conditions?: Array<{
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
  targets?: Array<{
    targetType: string;
    targetIds?: string;
    targetTags?: string;
  }>;
  quantityTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    tierPrice?: number;
    tierDiscountPercentage?: number;
    tierDiscountAmount?: number;
  }>;
}

interface UpdatePricingRuleRequest extends CreatePricingRuleRequest {
  id: number;
}

export class PricingRuleService {
  // =====================================================
  // PRICING RULE CRUD OPERATIONS
  // =====================================================

  static async getAllPricingRules(domain: string, storeId: number, params?: PaginationParams): Promise<ServiceResult<PaginatedResponse<any>>> {
    try {
      const db = await getTenantDb(domain);

      const page = params?.page || 1;
      const limit = Math.min(params?.limit || 10, 50);
      const search = params?.search?.trim();
      const sortBy = params?.sortBy || 'createdAt';
      const sortOrder = params?.sortOrder || 'desc';
      const offset = (page - 1) * limit;

      // Always filter by store_id
      const storeCondition = eq(pricingRules.storeId, storeId);
      
      let whereConditions;

      if (search) {
        whereConditions = and(
          storeCondition,
          or(
            like(pricingRules.name, `%${search}%`),
            like(pricingRules.description, `%${search}%`),
            like(pricingRules.ruleCode, `%${search}%`)
          )
        );
      } else {
        whereConditions = storeCondition;
      }

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(pricingRules)
        .where(whereConditions);

      const totalCount = totalCountResult[0]?.count || 0;

      // Get paginated results with related data
      const rules = await db.query.pricingRules.findMany({
        where: whereConditions,
        limit: limit,
        offset: offset,
        orderBy: (pricingRules, { asc, desc }) => {
          const sortField = (pricingRules as any)[sortBy] || pricingRules.createdAt;
          return sortOrder === 'asc' ? [asc(sortField)] : [desc(sortField)];
        },
        with: {
          conditions: true,
          targets: true,
          quantityTiers: true
        }
      });

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          data: rules,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      };

    } catch (error: unknown) {
      console.error('Get all pricing rules error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing rules'
      };
    }
  }

  static async getPricingRuleById(domain: string, ruleId: number): Promise<ServiceResult<any>> {
    try {
      const db = await getTenantDb(domain);

      const rule = await db.query.pricingRules.findFirst({
        where: eq(pricingRules.id, ruleId),
        with: {
          conditions: true,
          targets: true,
          quantityTiers: true,
          usage: true
        }
      });

      if (!rule) {
        return {
          success: false,
          error: 'Pricing rule not found'
        };
      }

      return {
        success: true,
        data: rule
      };

    } catch (error: unknown) {
      console.error('Get pricing rule by ID error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pricing rule'
      };
    }
  }

  static async createPricingRule(domain: string, ruleData: CreatePricingRuleRequest, storeId: number): Promise<ServiceResult<any>> {
    try {
      const db = await getTenantDb(domain);

      // Extract related data
      const {
        conditions = [],
        targets = [],
        quantityTiers = [],
        ...coreRuleData
      } = ruleData;

      // Create pricing rule in database
      const newRule = await db.insert(pricingRules).values({
        storeId: storeId,
        name: coreRuleData.name,
        description: coreRuleData.description || null,
        ruleCode: coreRuleData.ruleCode || null,
        ruleType: coreRuleData.ruleType,
        priority: coreRuleData.priority || 0,
        discountPercentage: coreRuleData.discountPercentage || 0,
        discountAmount: coreRuleData.discountAmount || 0,
        fixedPrice: coreRuleData.fixedPrice || 0,
        buyQuantity: coreRuleData.buyQuantity || 0,
        getQuantity: coreRuleData.getQuantity || 0,
        getDiscountPercentage: coreRuleData.getDiscountPercentage || 0,
        isActive: coreRuleData.isActive ?? true,
        startDate: coreRuleData.startDate || null,
        endDate: coreRuleData.endDate || null,
        usageLimit: coreRuleData.usageLimit || null,
        usageCount: coreRuleData.usageCount || 0,
        usageLimitPerCustomer: coreRuleData.usageLimitPerCustomer || null
      }).returning();

      const pricingRuleId = newRule[0].id;

      // Create conditions if provided
      if (conditions.length > 0) {
        await db.insert(ruleConditions).values(
          conditions.map((condition: any) => ({
            pricingRuleId,
            conditionType: condition.conditionType,
            operator: condition.operator,
            valueText: condition.valueText || null,
            valueNumber: condition.valueNumber || null,
            valueArray: condition.valueArray || null,
            valueStart: condition.valueStart || null,
            valueEnd: condition.valueEnd || null,
            logicalOperator: condition.logicalOperator || 'AND',
            conditionGroup: condition.conditionGroup || 1
          }))
        );
      }

      // Create targets if provided
      if (targets.length > 0) {
        await db.insert(ruleTargets).values(
          targets.map((target: any) => ({
            pricingRuleId,
            targetType: target.targetType,
            targetIds: target.targetIds || null,
            targetTags: target.targetTags || null
          }))
        );
      }

      // Create quantity tiers if provided and rule type is quantity_discount
      if (coreRuleData.ruleType === 'quantity_discount' && quantityTiers.length > 0) {
        await db.insert(quantityPriceTiers).values(
          quantityTiers.map((tier: any) => ({
            pricingRuleId,
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity || null,
            tierPrice: tier.tierPrice || null,
            tierDiscountPercentage: tier.tierDiscountPercentage || null,
            tierDiscountAmount: tier.tierDiscountAmount || null
          }))
        );
      }

      // Return the created rule with its related data
      const createdRule = await db.query.pricingRules.findFirst({
        where: eq(pricingRules.id, pricingRuleId),
        with: {
          conditions: true,
          targets: true,
          quantityTiers: true
        }
      });

      return {
        success: true,
        data: createdRule
      };

    } catch (error: unknown) {
      console.error('Create pricing rule error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create pricing rule'
      };
    }
  }

  static async updatePricingRule(domain: string, ruleData: UpdatePricingRuleRequest): Promise<ServiceResult<any>> {
    try {
      const db = await getTenantDb(domain);

      // Extract related data
      const {
        id: ruleId,
        conditions = [],
        targets = [],
        quantityTiers = [],
        ...coreRuleData
      } = ruleData;

      // Check if rule exists
      const existingRule = await db.query.pricingRules.findFirst({
        where: eq(pricingRules.id, ruleId)
      });

      if (!existingRule) {
        return {
          success: false,
          error: 'Pricing rule not found'
        };
      }

      // Update pricing rule
      await db.update(pricingRules).set({
        name: coreRuleData.name,
        description: coreRuleData.description || null,
        ruleCode: coreRuleData.ruleCode || null,
        ruleType: coreRuleData.ruleType,
        priority: coreRuleData.priority || 0,
        discountPercentage: coreRuleData.discountPercentage || 0,
        discountAmount: coreRuleData.discountAmount || 0,
        fixedPrice: coreRuleData.fixedPrice || 0,
        buyQuantity: coreRuleData.buyQuantity || 0,
        getQuantity: coreRuleData.getQuantity || 0,
        getDiscountPercentage: coreRuleData.getDiscountPercentage || 0,
        isActive: coreRuleData.isActive ?? true,
        startDate: coreRuleData.startDate || null,
        endDate: coreRuleData.endDate || null,
        usageLimit: coreRuleData.usageLimit || null,
        usageLimitPerCustomer: coreRuleData.usageLimitPerCustomer || null,
        updatedAt: new Date().toISOString()
      }).where(eq(pricingRules.id, ruleId));

      // Delete existing conditions, targets, and tiers
      await db.delete(ruleConditions).where(eq(ruleConditions.pricingRuleId, ruleId));
      await db.delete(ruleTargets).where(eq(ruleTargets.pricingRuleId, ruleId));
      await db.delete(quantityPriceTiers).where(eq(quantityPriceTiers.pricingRuleId, ruleId));

      // Create new conditions if provided
      if (conditions.length > 0) {
        await db.insert(ruleConditions).values(
          conditions.map((condition: any) => ({
            pricingRuleId: ruleId,
            conditionType: condition.conditionType,
            operator: condition.operator,
            valueText: condition.valueText || null,
            valueNumber: condition.valueNumber || null,
            valueArray: condition.valueArray || null,
            valueStart: condition.valueStart || null,
            valueEnd: condition.valueEnd || null,
            logicalOperator: condition.logicalOperator || 'AND',
            conditionGroup: condition.conditionGroup || 1
          }))
        );
      }

      // Create new targets if provided
      if (targets.length > 0) {
        await db.insert(ruleTargets).values(
          targets.map((target: any) => ({
            pricingRuleId: ruleId,
            targetType: target.targetType,
            targetIds: target.targetIds || null,
            targetTags: target.targetTags || null
          }))
        );
      }

      // Create new quantity tiers if provided and rule type is quantity_discount
      if (coreRuleData.ruleType === 'quantity_discount' && quantityTiers.length > 0) {
        await db.insert(quantityPriceTiers).values(
          quantityTiers.map((tier: any) => ({
            pricingRuleId: ruleId,
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity || null,
            tierPrice: tier.tierPrice || null,
            tierDiscountPercentage: tier.tierDiscountPercentage || null,
            tierDiscountAmount: tier.tierDiscountAmount || null
          }))
        );
      }

      // Return the updated rule with its related data
      const updatedRule = await db.query.pricingRules.findFirst({
        where: eq(pricingRules.id, ruleId),
        with: {
          conditions: true,
          targets: true,
          quantityTiers: true
        }
      });

      return {
        success: true,
        data: updatedRule
      };

    } catch (error: unknown) {
      console.error('Update pricing rule error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update pricing rule'
      };
    }
  }

  static async deletePricingRule(domain: string, ruleId: number): Promise<ServiceResult<boolean>> {
    try {
      const db = await getTenantDb(domain);

      // Check if rule exists
      const existingRule = await db.query.pricingRules.findFirst({
        where: eq(pricingRules.id, ruleId)
      });

      if (!existingRule) {
        return {
          success: false,
          error: 'Pricing rule not found'
        };
      }

      // Delete the rule (cascade will handle related tables)
      await db.delete(pricingRules).where(eq(pricingRules.id, ruleId));

      return {
        success: true,
        data: true
      };

    } catch (error: unknown) {
      console.error('Delete pricing rule error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete pricing rule'
      };
    }
  }
}