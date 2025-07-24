import { TenantService } from './tenantService';
import { Store, CreateStoreRequest, UpdateStoreRequest } from '@/lib/types';

export interface StoreServiceResult {
  success: boolean;
  store?: Store;
  stores?: Store[];
  error?: string;
}

export class StoreService {
  /**
   * Get all stores for the current tenant
   */
  static async getAllStores(domain: string): Promise<StoreServiceResult> {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      const result = await tenantDb.execute({
        sql: `SELECT * FROM stores WHERE is_active = 1 ORDER BY name ASC`
      });

      const stores: Store[] = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        location: row.location,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country || 'Honduras',
        postalCode: row.postal_code,
        phone: row.phone,
        email: row.email,
        managerName: row.manager_name,
        currency: row.currency || 'HNL',
        taxRate: row.tax_rate || 0.15,
        invoicePrefix: row.invoice_prefix || 'INV',
        invoiceCounter: row.invoice_counter || 1,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return {
        success: true,
        stores
      };
    } catch (error: any) {
      console.error('Error getting stores:', error);
      return {
        success: false,
        error: error.message || 'Failed to get stores'
      };
    }
  }

  /**
   * Get a store by ID
   */
  static async getStoreById(domain: string, storeId: number): Promise<StoreServiceResult> {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      const result = await tenantDb.execute({
        sql: `SELECT * FROM stores WHERE id = ? AND is_active = 1 LIMIT 1`,
        args: [storeId]
      });

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Store not found'
        };
      }

      const row = result.rows[0];
      const store: Store = {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        location: row.location,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country || 'Honduras',
        postalCode: row.postal_code,
        phone: row.phone,
        email: row.email,
        managerName: row.manager_name,
        currency: row.currency || 'HNL',
        taxRate: row.tax_rate || 0.15,
        invoicePrefix: row.invoice_prefix || 'INV',
        invoiceCounter: row.invoice_counter || 1,
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      return {
        success: true,
        store
      };
    } catch (error: any) {
      console.error('Error getting store:', error);
      return {
        success: false,
        error: error.message || 'Failed to get store'
      };
    }
  }

  /**
   * Create a new store
   */
  static async createStore(domain: string, request: CreateStoreRequest): Promise<StoreServiceResult> {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      // Check if code is unique (if provided)
      if (request.code) {
        const existingResult = await tenantDb.execute({
          sql: `SELECT id FROM stores WHERE code = ? AND is_active = 1 LIMIT 1`,
          args: [request.code]
        });

        if (existingResult.rows.length > 0) {
          return {
            success: false,
            error: 'Store code already exists'
          };
        }
      }

      const now = new Date().toISOString();
      
      const result = await tenantDb.execute({
        sql: `INSERT INTO stores (
          name, code, description, location, address, city, state, country, 
          postal_code, phone, email, manager_name, currency, tax_rate, 
          invoice_prefix, invoice_counter, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          request.name,
          request.code || null,
          request.description || null,
          request.location || null,
          request.address || null,
          request.city || null,
          request.state || null,
          request.country || 'Honduras',
          request.postalCode || null,
          request.phone || null,
          request.email || null,
          request.managerName || null,
          request.currency || 'HNL',
          request.taxRate || 0.15,
          request.invoicePrefix || 'INV',
          1, // invoice_counter
          1, // is_active
          now,
          now
        ]
      });

      // Get the created store
      const createdStore = await this.getStoreById(domain, Number(result.lastInsertRowid));
      
      return {
        success: true,
        store: createdStore.store
      };
    } catch (error: any) {
      console.error('Error creating store:', error);
      return {
        success: false,
        error: error.message || 'Failed to create store'
      };
    }
  }

  /**
   * Update a store
   */
  static async updateStore(domain: string, request: UpdateStoreRequest): Promise<StoreServiceResult> {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      // Check if store exists
      const existingStore = await this.getStoreById(domain, request.id);
      if (!existingStore.success || !existingStore.store) {
        return {
          success: false,
          error: 'Store not found'
        };
      }

      // Check if code is unique (if provided and different from current)
      if (request.code && request.code !== existingStore.store.code) {
        const codeResult = await tenantDb.execute({
          sql: `SELECT id FROM stores WHERE code = ? AND id != ? AND is_active = 1 LIMIT 1`,
          args: [request.code, request.id]
        });

        if (codeResult.rows.length > 0) {
          return {
            success: false,
            error: 'Store code already exists'
          };
        }
      }

      const now = new Date().toISOString();
      
      await tenantDb.execute({
        sql: `UPDATE stores SET 
          name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description),
          location = COALESCE(?, location),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          country = COALESCE(?, country),
          postal_code = COALESCE(?, postal_code),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          manager_name = COALESCE(?, manager_name),
          currency = COALESCE(?, currency),
          tax_rate = COALESCE(?, tax_rate),
          invoice_prefix = COALESCE(?, invoice_prefix),
          updated_at = ?
        WHERE id = ? AND is_active = 1`,
        args: [
          request.name || null,
          request.code || null,
          request.description || null,
          request.location || null,
          request.address || null,
          request.city || null,
          request.state || null,
          request.country || null,
          request.postalCode || null,
          request.phone || null,
          request.email || null,
          request.managerName || null,
          request.currency || null,
          request.taxRate || null,
          request.invoicePrefix || null,
          now,
          request.id
        ]
      });

      // Get the updated store
      const updatedStore = await this.getStoreById(domain, request.id);
      
      return {
        success: true,
        store: updatedStore.store
      };
    } catch (error: any) {
      console.error('Error updating store:', error);
      return {
        success: false,
        error: error.message || 'Failed to update store'
      };
    }
  }

  /**
   * Delete a store (soft delete)
   */
  static async deleteStore(domain: string, storeId: number): Promise<StoreServiceResult> {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      // Check if store exists
      const existingStore = await this.getStoreById(domain, storeId);
      if (!existingStore.success || !existingStore.store) {
        return {
          success: false,
          error: 'Store not found'
        };
      }

      // Check if store has dependencies (products, inventory, etc.)
      const dependenciesResult = await tenantDb.execute({
        sql: `SELECT 
          (SELECT COUNT(*) FROM inventory WHERE store_id = ?) as inventory_count,
          (SELECT COUNT(*) FROM clients WHERE store_id = ?) as clients_count,
          (SELECT COUNT(*) FROM invoices WHERE store_id = ?) as invoices_count`,
        args: [storeId, storeId, storeId]
      });

      const deps = dependenciesResult.rows[0];
      if (deps.inventory_count > 0 || deps.clients_count > 0 || deps.invoices_count > 0) {
        return {
          success: false,
          error: 'Cannot delete store with existing inventory, clients, or invoices'
        };
      }

      const now = new Date().toISOString();
      
      // Soft delete the store
      await tenantDb.execute({
        sql: `UPDATE stores SET is_active = 0, updated_at = ? WHERE id = ?`,
        args: [now, storeId]
      });

      return {
        success: true,
        store: existingStore.store
      };
    } catch (error: any) {
      console.error('Error deleting store:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete store'
      };
    }
  }

  /**
   * Get store statistics
   */
  static async getStoreStats(domain: string, storeId: number) {
    try {
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain);
      
      const result = await tenantDb.execute({
        sql: `SELECT 
          (SELECT COUNT(*) FROM inventory WHERE store_id = ? AND quantity > 0) as products_in_stock,
          (SELECT COUNT(*) FROM clients WHERE store_id = ? AND is_active = 1) as active_clients,
          (SELECT COUNT(*) FROM invoices WHERE store_id = ? AND status != 'cancelled') as total_invoices,
          (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE store_id = ? AND status = 'paid') as total_revenue`,
        args: [storeId, storeId, storeId, storeId]
      });

      return {
        success: true,
        stats: result.rows[0]
      };
    } catch (error: any) {
      console.error('Error getting store stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to get store statistics'
      };
    }
  }
}