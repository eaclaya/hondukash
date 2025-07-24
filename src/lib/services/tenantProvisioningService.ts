// =========================================
// TENANT PROVISIONING SERVICE
// =========================================
// Handles database schema creation and setup for new tenants

import { db } from '@/lib/turso';
import { tenants } from '@/lib/db/schema';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export interface TenantProvisioningRequest {
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  contactName: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  plan: 'basic' | 'professional' | 'enterprise';
}

export interface TenantProvisioningResult {
  success: boolean;
  tenantId?: string;
  schemaName?: string;
  error?: string;
  details?: {
    tenantCreated: boolean;
    schemaCreated: boolean;
    storeCreated: boolean;
    userCreated: boolean;
  };
}

export class TenantProvisioningService {
  /**
   * Provision a new tenant with complete setup
   */
  static async provisionTenant(request: TenantProvisioningRequest): Promise<TenantProvisioningResult> {
    const result: TenantProvisioningResult = {
      success: false,
      details: {
        tenantCreated: false,
        schemaCreated: false,
        storeCreated: false,
        userCreated: false
      }
    };

    try {
      // 1. Validate subdomain availability
      const isAvailable = await this.validateSubdomainAvailability(request.subdomain);
      if (!isAvailable) {
        return {
          ...result,
          error: 'Subdomain is already taken'
        };
      }

      // 2. Create tenant record
      const tenant = await this.createTenantRecord(request);
      result.tenantId = tenant.id;
      result.details!.tenantCreated = true;

      // 3. Create tenant schema
      const schemaName = `tenant_${request.subdomain}`;
      result.schemaName = schemaName;
      await this.createTenantSchema(schemaName);
      result.details!.schemaCreated = true;

      // 4. Create default store
      const store = await this.createDefaultStore(schemaName, request);
      result.details!.storeCreated = true;

      // 5. Create admin user
      await this.createAdminUser(schemaName, request, store.id);
      result.details!.userCreated = true;

      // 6. Schema name is already set in the tenant record, no need to update

      result.success = true;
      return result;
    } catch (error: any) {
      console.error('Tenant provisioning failed:', error);

      // Attempt cleanup on failure
      if (result.schemaName) {
        try {
          await this.cleanupFailedTenant(result.schemaName, result.tenantId);
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
      }

      return {
        ...result,
        error: error.message || 'Unknown error occurred during tenant provisioning'
      };
    }
  }

  /**
   * Validate subdomain availability
   */
  private static async validateSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      const existing = await db.select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.subdomain, subdomain))
        .limit(1);

      // If no rows returned, subdomain is available
      return existing.length === 0;
    } catch (error: any) {
      console.error('Unexpected error in subdomain validation:', error);
      throw error;
    }
  }

  /**
   * Create tenant record in public schema
   */
  private static async createTenantRecord(request: TenantProvisioningRequest) {
    const schemaName = `tenant_${request.subdomain}`;

    try {
      const newTenant = await db.insert(tenants).values({
        name: request.tenantName,
        subdomain: request.subdomain,
        schemaName,
        email: request.adminEmail,
        contactName: request.contactName,
        phone: request.phone || null,
        address: request.address || null,
        city: request.city || null,
        country: request.country || 'Honduras',
        plan: request.plan,
        status: 'active',
        maxUsers: request.plan === 'basic' ? 5 : request.plan === 'professional' ? 25 : 100,
        maxStores: request.plan === 'basic' ? 1 : request.plan === 'professional' ? 5 : 20,
        storageLimitGb: request.plan === 'basic' ? 1 : request.plan === 'professional' ? 10 : 100,
        isActive: true,
      }).returning();

      if (!newTenant[0]) {
        throw new Error('Failed to create tenant record');
      }

      return newTenant[0];
    } catch (error: any) {
      console.error('Detailed error creating tenant record:', error);
      throw new Error(`Failed to create tenant record: ${error.message}`);
    }
  }

  /**
   * Create tenant database schema
   */
  private static async createTenantSchema(schemaName: string): Promise<void> {
    try {
      // Read the tenant schema SQL file
      const schemaPath = join(process.cwd(), 'database', 'schema', 'tenant_schema.sql');
      let schemaSql = readFileSync(schemaPath, 'utf8');

      // Replace placeholder with actual schema name
      schemaSql = schemaSql.replaceAll('{TENANT_SCHEMA}', schemaName);

      // For SQLite, we'll need to create separate tables with prefixed names instead of schemas
      // This is a placeholder - actual implementation depends on your schema structure
      await turso.execute(schemaSql);
    } catch (error: any) {
      throw new Error(`Schema creation failed: ${error.message}`);
    }
  }

  /**
   * Create default store for tenant
   */
  private static async createDefaultStore(schemaName: string, request: TenantProvisioningRequest) {
    const { data, error } = await supabase
      .schema(schemaName)
      .from('stores')
      .insert({
        name: 'Main Store',
        code: 'MAIN',
        description: 'Primary store location',
        location: 'Main Location',
        city: request.city,
        country: request.country,
        phone: request.phone,
        email: request.adminEmail,
        manager_name: request.contactName
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create default store: ${error.message}`);
    }

    return data;
  }

  /**
   * Create admin user for tenant
   */
  private static async createAdminUser(schemaName: string, request: TenantProvisioningRequest, storeId: string): Promise<void> {
    // Hash password
    const hashedPassword = await bcrypt.hash(request.adminPassword, 12);

    const { error } = await supabase
      .schema(schemaName)
      .from('users')
      .insert({
        email: request.adminEmail,
        password: hashedPassword,
        name: request.adminName,
        role: 'admin',
        store_access: [storeId],
        permissions: {
          all: true,
          stores: { read: true, write: true, delete: true },
          products: { read: true, write: true, delete: true },
          clients: { read: true, write: true, delete: true },
          invoices: { read: true, write: true, delete: true },
          reports: { read: true, write: true },
          settings: { read: true, write: true }
        },
        language: 'es',
        timezone: 'America/Tegucigalpa'
      });

    if (error) {
      throw new Error(`Failed to create admin user: ${error.message}`);
    }
  }

  /**
   * Cleanup failed tenant (remove schema and tenant record)
   */
  private static async cleanupFailedTenant(schemaName: string, tenantId?: string): Promise<void> {
    try {
      // Drop the schema if it was created
      await supabase.rpc('exec_sql', {
        sql: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`
      });

      // Remove tenant record if it was created
      if (tenantId) {
        await supabase.from('tenants').delete().eq('id', tenantId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      // Don't throw - this is best effort cleanup
    }
  }

  /**
   * Get tenant provisioning status
   */
  static async getTenantStatus(tenantId: number): Promise<{
    tenant: any;
    schemaExists: boolean;
    storeExists: boolean;
    userExists: boolean;
  }> {
    try {
      // Get tenant record using Drizzle
      const tenant = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (tenant.length === 0) {
        throw new Error('Tenant not found');
      }

      const tenantRecord = tenant[0];

      if (!tenantRecord.schemaName) {
        return {
          tenant: tenantRecord,
          schemaExists: false,
          storeExists: false,
          userExists: false
        };
      }

      // For SQLite, check if tenant-specific tables exist
      // This is a simplified check - adjust based on your actual table structure
      const schemaExists = true; // Since we're using table prefixes instead of schemas

      // These would need to be implemented based on your actual tenant table structure
      // For now, returning simplified status
      const storeExists = true; // Placeholder
      const userExists = true; // Placeholder

      return {
        tenant: tenantRecord,
        schemaExists,
        storeExists,
        userExists
      };
    } catch (error: any) {
      throw new Error(`Failed to get tenant status: ${error.message}`);
    }
  }

  /**
   * Re-provision failed tenant (retry setup)
   */
  static async reprovisionTenant(tenantId: string): Promise<TenantProvisioningResult> {
    const status = await this.getTenantStatus(tenantId);

    if (!status.tenant) {
      return {
        success: false,
        error: 'Tenant not found'
      };
    }

    // Create a provisioning request from existing tenant data
    const request: TenantProvisioningRequest = {
      tenantName: status.tenant.name,
      subdomain: status.tenant.subdomain,
      adminEmail: status.tenant.email,
      adminPassword: 'temp-password-needs-reset', // Will need to be reset
      adminName: status.tenant.contact_name,
      contactName: status.tenant.contact_name,
      phone: status.tenant.phone,
      address: status.tenant.address,
      city: status.tenant.city,
      country: status.tenant.country,
      plan: status.tenant.plan
    };

    // Clean up existing partial setup
    if (status.tenant.schema_name) {
      await this.cleanupFailedTenant(status.tenant.schema_name);
    }

    // Retry provisioning
    return this.provisionTenant(request);
  }
}
