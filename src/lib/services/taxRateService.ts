import { getTenantDb } from '@/lib/turso';
import { taxRates } from '@/lib/db/schema/tenant';
import { eq, and, desc } from 'drizzle-orm';

export interface TaxRate {
  id: number;
  name: string;
  code: string;
  rate: number;
  type: 'sales' | 'purchase' | 'both';
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRateRequest {
  name: string;
  code: string;
  rate: number;
  type: 'sales' | 'purchase' | 'both';
  isDefault?: boolean;
  description?: string;
}

export interface UpdateTaxRateRequest extends Partial<CreateTaxRateRequest> {
  id: number;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TaxRateService {
  static async getAllTaxRates(domain: string): Promise<ServiceResult<TaxRate[]>> {
    try {
      const db = await getTenantDb(domain);

      const taxRatesResult = await db
        .select()
        .from(taxRates)
        .where(eq(taxRates.isActive, true))
        .orderBy(desc(taxRates.isDefault), taxRates.name);

      return {
        success: true,
        data: taxRatesResult
      };
    } catch (error: unknown) {
      console.error('TaxRateService.getAllTaxRates error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getTaxRateById(domain: string, taxRateId: number): Promise<ServiceResult<TaxRate>> {
    try {
      const db = await getTenantDb(domain);

      const taxRateResult = await db
        .select()
        .from(taxRates)
        .where(eq(taxRates.id, taxRateId))
        .limit(1);

      if (!taxRateResult[0]) {
        return { success: false, error: 'Tax rate not found' };
      }

      return { success: true, data: taxRateResult[0] };
    } catch (error: unknown) {
      console.error('TaxRateService.getTaxRateById error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async createTaxRate(domain: string, taxRateData: CreateTaxRateRequest): Promise<ServiceResult<TaxRate>> {
    try {
      const db = await getTenantDb(domain);

      // If this is being set as default, unset other defaults first
      if (taxRateData.isDefault) {
        await db
          .update(taxRates)
          .set({ isDefault: false })
          .where(eq(taxRates.isDefault, true));
      }

      const [newTaxRate] = await db
        .insert(taxRates)
        .values({
          name: taxRateData.name,
          code: taxRateData.code,
          rate: taxRateData.rate,
          type: taxRateData.type,
          isDefault: taxRateData.isDefault || false,
          description: taxRateData.description || null,
          isActive: true
        })
        .returning();

      return { success: true, data: newTaxRate };
    } catch (error: unknown) {
      console.error('TaxRateService.createTaxRate error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async updateTaxRate(domain: string, taxRateData: UpdateTaxRateRequest): Promise<ServiceResult<TaxRate>> {
    try {
      const db = await getTenantDb(domain);

      // If this is being set as default, unset other defaults first
      if (taxRateData.isDefault) {
        await db
          .update(taxRates)
          .set({ isDefault: false })
          .where(and(
            eq(taxRates.isDefault, true),
            eq(taxRates.id, taxRateData.id) // Don't update the same record
          ));
      }

      const [updatedTaxRate] = await db
        .update(taxRates)
        .set({
          name: taxRateData.name,
          code: taxRateData.code,
          rate: taxRateData.rate,
          type: taxRateData.type,
          isDefault: taxRateData.isDefault,
          description: taxRateData.description,
          updatedAt: new Date().toISOString()
        })
        .where(eq(taxRates.id, taxRateData.id))
        .returning();

      if (!updatedTaxRate) {
        return { success: false, error: 'Tax rate not found' };
      }

      return { success: true, data: updatedTaxRate };
    } catch (error: unknown) {
      console.error('TaxRateService.updateTaxRate error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async deleteTaxRate(domain: string, taxRateId: number): Promise<ServiceResult<void>> {
    try {
      const db = await getTenantDb(domain);

      // Soft delete by setting isActive to false
      await db
        .update(taxRates)
        .set({ 
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(taxRates.id, taxRateId));

      return { success: true };
    } catch (error: unknown) {
      console.error('TaxRateService.deleteTaxRate error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getDefaultTaxRate(domain: string): Promise<ServiceResult<TaxRate | null>> {
    try {
      const db = await getTenantDb(domain);

      const defaultTaxRateResult = await db
        .select()
        .from(taxRates)
        .where(and(
          eq(taxRates.isDefault, true),
          eq(taxRates.isActive, true)
        ))
        .limit(1);

      return { 
        success: true, 
        data: defaultTaxRateResult[0] || null 
      };
    } catch (error: unknown) {
      console.error('TaxRateService.getDefaultTaxRate error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}