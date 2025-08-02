import { Store, CreateStoreRequest, UpdateStoreRequest, PaginationParams, PaginatedResponse } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { stores, clients } from '@/lib/db/schema/tenant';
import { eq, and, desc, like, or, count } from 'drizzle-orm';

export interface StoreServiceResult {
  success: boolean;
  store?: Store;
  stores?: Store[];
  data?: PaginatedResponse<Store>;
  stats?: any;
  error?: string;
}

export class StoreService {
  /**
   * Get all stores for the current tenant
   */
  static async getAllStores(domain: string, params?: PaginationParams): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const search = params?.search?.trim();
      const offset = (page - 1) * limit;

      const queryConditions = [eq(stores.isActive, true)];

      // Add search conditions
      if (search) {
        const searchConditions = or(
          like(stores.name, `%${search}%`),
          like(stores.email, `%${search}%`),
        );
        queryConditions.push(searchConditions);
      }

      // Get total count
      const totalCountResult = await db
        .select({ count: count() })
        .from(stores)
        .where(and(...queryConditions));

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      const storesResult = await db
        .select()
        .from(stores)
        .where(and(...queryConditions))
        .orderBy(stores.name)
        .limit(limit)
        .offset(offset);

      const mappedStores: Store[] = storesResult.map((store) => ({
        id: store.id,
        name: store.name,
        code: store.code || undefined,
        description: store.description || undefined,
        location: store.location || undefined,
        address: store.address || undefined,
        city: store.city || undefined,
        state: store.state || undefined,
        country: store.country,
        postalCode: store.postalCode || undefined,
        phone: store.phone || undefined,
        email: store.email || undefined,
        managerName: store.managerName || undefined,
        currency: store.currency,
        taxRate: store.taxRate,
        invoicePrefix: store.invoicePrefix,
        invoiceCounter: store.invoiceCounter,
        quotePrefix: store.quotePrefix,
        quoteCounter: store.quoteCounter,

        // Invoice Sequence Feature (JSON field)
        invoiceSequence: store.invoiceSequence ? JSON.parse(store.invoiceSequence) : undefined,

        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      }));

      return {
        success: true,
        data: {
          data: mappedStores,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      };
    } catch (error: any) {
      console.error('StoreService.getAllStores error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get a specific store by ID
   */
  static async getStoreById(domain: string, storeId: number): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId)
      });

      if (!store) {
        return {
          success: false,
          error: 'Store not found'
        };
      }

      const mappedStore: Store = {
        id: store.id,
        name: store.name,
        code: store.code || undefined,
        description: store.description || undefined,
        location: store.location || undefined,
        address: store.address || undefined,
        city: store.city || undefined,
        state: store.state || undefined,
        country: store.country,
        postalCode: store.postalCode || undefined,
        phone: store.phone || undefined,
        email: store.email || undefined,
        managerName: store.managerName || undefined,
        currency: store.currency,
        taxRate: store.taxRate,
        invoicePrefix: store.invoicePrefix,
        invoiceCounter: store.invoiceCounter,
        quotePrefix: store.quotePrefix,
        quoteCounter: store.quoteCounter,

        // Invoice Sequence Feature (JSON field)
        invoiceSequence: store.invoiceSequence ? JSON.parse(store.invoiceSequence) : undefined,

        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt
      };

      return {
        success: true,
        store: mappedStore
      };
    } catch (error: any) {
      console.error('StoreService.getStoreById error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new store
   */
  static async createStore(domain: string, storeData: CreateStoreRequest): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      const newStore = await db
        .insert(stores)
        .values({
          name: storeData.name,
          code: storeData.code || null,
          description: storeData.description || null,
          location: storeData.location || null,
          address: storeData.address || null,
          city: storeData.city || null,
          state: storeData.state || null,
          country: storeData.country || 'Honduras',
          postalCode: storeData.postalCode || null,
          phone: storeData.phone || null,
          email: storeData.email || null,
          managerName: storeData.managerName || null,
          currency: storeData.currency || 'HNL',
          taxRate: storeData.taxRate || 0.15,
          invoicePrefix: storeData.invoicePrefix || 'INV',
          quotePrefix: storeData.quotePrefix || 'QUO',

          // Invoice Sequence Feature (JSON field)
          invoiceSequence: storeData.invoiceSequence ? JSON.stringify(storeData.invoiceSequence) : null
        })
        .returning();

      if (!newStore[0]) {
        return {
          success: false,
          error: 'Failed to create store'
        };
      }

      // Fetch the created store
      const storeResult = await this.getStoreById(domain, newStore[0].id);
      return storeResult;
    } catch (error: any) {
      console.error('StoreService.createStore error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing store
   */
  static async updateStore(domain: string, storeData: UpdateStoreRequest): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      const updateData: any = {};

      if (storeData.name !== undefined) updateData.name = storeData.name;
      if (storeData.code !== undefined) updateData.code = storeData.code;
      if (storeData.description !== undefined) updateData.description = storeData.description;
      if (storeData.location !== undefined) updateData.location = storeData.location;
      if (storeData.address !== undefined) updateData.address = storeData.address;
      if (storeData.city !== undefined) updateData.city = storeData.city;
      if (storeData.state !== undefined) updateData.state = storeData.state;
      if (storeData.country !== undefined) updateData.country = storeData.country;
      if (storeData.postalCode !== undefined) updateData.postalCode = storeData.postalCode;
      if (storeData.phone !== undefined) updateData.phone = storeData.phone;
      if (storeData.email !== undefined) updateData.email = storeData.email;
      if (storeData.managerName !== undefined) updateData.managerName = storeData.managerName;
      if (storeData.currency !== undefined) updateData.currency = storeData.currency;
      if (storeData.taxRate !== undefined) updateData.taxRate = storeData.taxRate;
      if (storeData.invoicePrefix !== undefined) updateData.invoicePrefix = storeData.invoicePrefix;
      if (storeData.quotePrefix !== undefined) updateData.quotePrefix = storeData.quotePrefix;

      // Invoice Sequence Feature (JSON field)
      if (storeData.invoiceSequence !== undefined) {
        updateData.invoiceSequence = storeData.invoiceSequence ? JSON.stringify(storeData.invoiceSequence) : null;
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: 'No fields to update'
        };
      }

      updateData.updatedAt = new Date().toISOString();

      await db.update(stores).set(updateData).where(eq(stores.id, storeData.id));

      // Fetch the updated store
      const storeResult = await this.getStoreById(domain, storeData.id);
      return storeResult;
    } catch (error: any) {
      console.error('StoreService.updateStore error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a store (soft delete by setting is_active to false)
   */
  static async deleteStore(domain: string, storeId: number): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      await db
        .update(stores)
        .set({
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .where(eq(stores.id, storeId));

      return {
        success: true
      };
    } catch (error: any) {
      console.error('StoreService.deleteStore error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get store statistics
   */
  static async getStoreStats(domain: string, storeId: number): Promise<StoreServiceResult> {
    try {
      const db = await getTenantDb(domain);

      // For now, return basic stats - can be expanded later
      const stats = {
        totalProducts: 0,
        totalClients: 0,
        totalInvoices: 0,
        totalRevenue: 0
      };

      // Get client count for this store
      const clientsResult = await db.query.clients.findMany({
        where: and(eq(clients.storeId, storeId), eq(clients.isActive, true))
      });
      stats.totalClients = clientsResult.length;

      // Could add more complex queries here for products, invoices, etc.
      // For now, keeping it simple

      return {
        success: true,
        stats
      };
    } catch (error: any) {
      console.error('StoreService.getStoreStats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
