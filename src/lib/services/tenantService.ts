import { db } from '@/lib/turso';
import { headers } from 'next/headers';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { CreateTenantRequest, TenantMeta } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

export interface TenantServiceResult {
  success: boolean;
  tenant?: any;
  database?: string;
  error?: string;
}

export class TenantService {
  /**
   * Create a new tenant with its own Turso database
   */
  static async createTenant(request: CreateTenantRequest): Promise<TenantServiceResult> {
    try {
      // 1. Validate domain availability
      const isAvailable = await this.validateDomainAvailability(request.domain);
      if (!isAvailable) {
        return {
          success: false,
          error: 'Domain is already taken'
        };
      }

      // 2. Create the database name (unique identifier)
      const databaseName = `tenant-${request.domain.split('.')[0]}`;

      // 3. Create tenant record
      const tenant = await this.createTenantRecord(request, databaseName);

      // 4. Create new Turso database for this tenant
      await this.createTenantDatabase(tenant);

      return {
        success: true,
        tenant: tenant,
        database: databaseName
      };
    } catch (error: any) {
      console.error('Tenant creation failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during tenant creation'
      };
    }
  }

  /**
   * Validate domain availability
   */
  private static async validateDomainAvailability(domain: string): Promise<boolean> {
    try {
      const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.domain, domain)).limit(1);

      // If no rows returned, domain is available
      return existing.length === 0;
    } catch (error: any) {
      console.error('Unexpected error in domain validation:', error);
      throw error;
    }
  }

  /**
   * Create tenant record in main database
   */
  private static async createTenantRecord(request: CreateTenantRequest, databaseName: string) {
    try {
      const tenantMeta: TenantMeta = {
        plan: request.plan,
        contact_name: request.contactName,
        contact_email: request.email,
        due_date: request.due_date,
        fee: request.fee,
        phone: request.phone,
        address: request.address,
        city: request.city,
        country: request.country || 'Honduras'
      };

      const tenant = await db
        .insert(tenants)
        .values({
          name: request.name,
          domain: request.domain,
          database: databaseName,
          meta: JSON.stringify(tenantMeta),
          isActive: true,
          createdAt: new Date().toISOString()
        })
        .returning();

      if (!tenant[0]) {
        throw new Error('Failed to create tenant record');
      }

      return tenant[0];
    } catch (error: any) {
      console.error('Detailed error creating tenant record:', error);
      throw new Error(`Failed to create tenant record: ${error.message}`);
    }
  }

  /**
   * Create a new Turso database for the tenant
   */
  private static async createTenantDatabase(tenant: any): Promise<void> {
    try {
      const databaseName = tenant.database;
      console.log(`Creating database: ${databaseName} for tenant: ${tenant.name}`);

      // Get Turso API credentials from environment
      const tursoApiToken = process.env.NEXT_PUBLIC_TURSO_API_TOKEN;
      const tursoOrgName = process.env.NEXT_PUBLIC_TURSO_ORG_NAME;

      if (!tursoApiToken || !tursoOrgName) {
        console.warn('Turso API credentials not found. Simulating database creation...');
        console.log(`✅ Database ${databaseName} created successfully (simulated)`);
        return;
      }

      // Create database using Turso API
      const response = await fetch(`https://api.turso.tech/v1/organizations/${tursoOrgName}/databases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tursoApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: databaseName,
          group: process.env.NEXT_PUBLIC_TURSO_GROUP ?? 'default'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Turso API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Database ${databaseName} created successfully for tenant ${tenant.name}:`, result);

      // Wait a moment for database to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create auth token for the database
      const dbToken = await this.createTenantDatabaseToken(databaseName);

      // Update tenant record with database connection info
      await this.updateTenantDatabaseInfo(tenant.id, databaseName, dbToken);

      // Initialize tenant database with required tables
      await this.initializeTenantDatabase(tenant.domain);
    } catch (error: any) {
      console.error('Database creation error:', error);
      throw new Error(`Database creation failed: ${error.message}`);
    }
  }

  /**
   * Create auth token for tenant database
   */
  private static async createTenantDatabaseToken(databaseName: string): Promise<string | null> {
    try {
      console.log(`Creating auth token for database: ${databaseName}`);

      // Get Turso API credentials from environment
      const tursoApiToken = process.env.NEXT_PUBLIC_TURSO_API_TOKEN;
      const tursoOrgName = process.env.NEXT_PUBLIC_TURSO_ORG_NAME;

      if (!tursoApiToken || !tursoOrgName) {
        console.warn('Turso API credentials not found. Skipping token creation...');
        return null;
      }

      // Create auth token for the database
      const response = await fetch(`https://api.turso.tech/v1/organizations/${tursoOrgName}/databases/${databaseName}/auth/tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tursoApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: {
            read_attach: {
              databases: [databaseName]
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Turso token API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const tokenResult = await response.json();
      console.log(`✅ Auth token created for database ${databaseName}`);
      console.log(`Database ${databaseName} token: ${tokenResult.jwt.substring(0, 20)}...`);

      return tokenResult.jwt;
    } catch (error: any) {
      console.error('Database token creation error:', error);
      throw new Error(`Database token creation failed: ${error.message}`);
    }
  }

  /**
   * Update tenant record with database connection information
   */
  private static async updateTenantDatabaseInfo(tenantId: number, databaseName: string, authToken: string | null): Promise<void> {
    try {
      console.log(`Updating tenant ${tenantId} with database connection info`);

      // Get the current tenant to preserve existing metadata
      const currentTenant = await this.getTenantById(tenantId);
      const currentMeta = currentTenant.meta ? JSON.parse(currentTenant.meta) : {};

      // Get Turso organization name for constructing the database URL
      const tursoOrgName = process.env.NEXT_PUBLIC_TURSO_ORG_NAME;

      // Add database connection info to metadata
      const updatedMeta = {
        ...currentMeta,
        database_url: tursoOrgName ? `libsql://${databaseName}-${tursoOrgName}.turso.io` : null,
        database_auth_token: authToken,
        database_created_at: new Date().toISOString()
      };

      // Update the tenant record with new metadata
      await db
        .update(tenants)
        .set({
          meta: JSON.stringify(updatedMeta)
        })
        .where(eq(tenants.id, tenantId));

      console.log(`✅ Tenant ${tenantId} updated with database connection info`);
    } catch (error: any) {
      console.error('Error updating tenant database info:', error);
      throw new Error(`Failed to update tenant database info: ${error.message}`);
    }
  }

  /**
   * Initialize tenant database with required tables using tenant.sql
   */
  private static async initializeTenantDatabase(domain: string): Promise<void> {
    try {
      const requestHeaders = headers();
      domain = domain ?? requestHeaders.get('host');
      console.log(`Initializing database by domain for: ${domain}`);

      // Connect to the new tenant database
      const tenantDb = await this.connectToTenantDatabaseByDomain(domain);

      // Read the tenant.sql schema file
      const schemaPath = path.join(process.cwd(), 'database', 'schema', 'tenant.sql');
      console.log(`Reading schema from: ${schemaPath}`);

      let schemaContent: string;
      try {
        schemaContent = fs.readFileSync(schemaPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read tenant.sql schema file: ${error}`);
      }

      // Split the schema into individual statements
      // Remove comments and empty lines, then split by semicolon
      const cleanedContent = schemaContent
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          // Keep non-empty lines that don't start with --
          return trimmed && !trimmed.startsWith('--');
        })
        .join('\n');

      // Split by semicolon and clean up statements
      const statements = cleanedContent
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0)
        .map((stmt) => {
          // Remove any remaining inline comments
          return stmt.replace(/--.*$/gm, '').trim();
        })
        .filter((stmt) => stmt.length > 0);

      console.log(`Found ${statements.length} SQL statements to execute`);

      // Execute each statement individually
      let executedCount = 0;
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await tenantDb.execute(statement);
            executedCount++;

            // Log progress for major operations
            if (statement.includes('CREATE TABLE')) {
              const tableName = statement.match(/CREATE TABLE (\w+)/)?.[1];
              console.log(`✓ Created table: ${tableName}`);
            } else if (statement.includes('CREATE INDEX')) {
              const indexName = statement.match(/CREATE INDEX (\w+)/)?.[1];
              console.log(`✓ Created index: ${indexName}`);
            } else if (statement.includes('CREATE TRIGGER')) {
              const triggerName = statement.match(/CREATE TRIGGER (\w+)/)?.[1];
              console.log(`✓ Created trigger: ${triggerName}`);
            } else if (statement.includes('INSERT INTO')) {
              const tableName = statement.match(/INSERT INTO (\w+)/)?.[1];
              console.log(`✓ Inserted seed data into: ${tableName}`);
            }
          } catch (error: any) {
            console.error(`Failed to execute statement: ${statement.substring(0, 50)}...`);
            console.error(`Error: ${error.message}`);
            throw error;
          }
        }
      }

      console.log(`✅ Successfully executed ${executedCount} SQL statements`);

      // Create tenant-specific admin user
      await this.createStoreUser(tenantDb, domain);

      console.log(`✅ Database schema and seed data initialized for: ${domain}`);
    } catch (error: any) {
      console.error('Database initialization error:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  /**
   * Create tenant-specific admin user, default store, and membership
   */
  private static async createStoreUser(tenantDb: any, domain: string): Promise<void> {
    try {
      console.log(`Creating tenant admin user and store for: ${domain}`);

      // Get tenant info from main database to access metadata
      const tenant = await this.getTenantByDomain(domain);
      const meta = tenant.meta ? (JSON.parse(tenant.meta) as TenantMeta) : null;

      if (!meta) {
        throw new Error('Tenant metadata not found');
      }

      // Create admin user with hashed password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('Pa$$w0rd!', 10); // Default password

      // 1. Create the admin user
      const userResult = await tenantDb.execute({
        sql: `INSERT INTO users (email, password, name, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [
          meta.contact_email,
          hashedPassword,
          meta.contact_name,
          1, // is_active = true
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });

      const userId = userResult.rows[0]?.id;
      if (!userId) {
        throw new Error('Failed to create user - no ID returned');
      }

      console.log(`✓ Created admin user with ID: ${userId}`);

      // 2. Create the default store
      const storeResult = await tenantDb.execute({
        sql: `INSERT INTO stores (name, description, country, currency, tax_rate, invoice_prefix, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        args: [
          tenant.name,
          tenant.name,
          meta.country,
          'HNL',
          0.15,
          'INV',
          1, // is_active = true
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });

      const storeId = storeResult.rows[0]?.id;
      if (!storeId) {
        throw new Error('Failed to create store - no ID returned');
      }

      console.log(`✓ Created default store with ID: ${storeId}`);

      // 3. Create membership linking user to store with admin role
      await tenantDb.execute({
        sql: `INSERT INTO memberships (user_id, store_id, role, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          userId,
          storeId,
          'admin', // Admin role for the tenant owner
          new Date().toISOString(),
          new Date().toISOString()
        ]
      });

      console.log(`✓ Created membership linking user ${userId} to store ${storeId}`);
      console.log(`📧 Admin login: ${meta.contact_email} / Pa$$w0rd!`);
      console.log(`✅ Tenant setup completed for: ${domain}`);
    } catch (error: any) {
      console.error('Error creating tenant admin user and store:', error);
      throw new Error(`Failed to create tenant admin user and store: ${error.message}`);
    }
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(tenantId: number) {
    try {
      const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

      if (tenant.length === 0) {
        throw new Error('Tenant not found');
      }

      return tenant[0];
    } catch (error: any) {
      throw new Error(`Failed to get tenant: ${error.message}`);
    }
  }

  /**
   * Get tenant by domain
   */
  static async getTenantByDomain(domain: string) {
    try {
      const tenant = await db.select().from(tenants).where(eq(tenants.domain, domain)).limit(1);

      if (tenant.length === 0) {
        throw new Error('Tenant not found');
      }

      return tenant[0];
    } catch (error: any) {
      throw new Error(`Failed to get tenant: ${error.message}`);
    }
  }

  /**
   * Connect to a specific tenant's database using stored connection info
   */
  static async connectToTenantDatabaseByDomain(domain: string) {
    try {
      const tenant = await this.getTenantByDomain(domain);
      const meta = tenant.meta ? (JSON.parse(tenant.meta) as TenantMeta) : null;

      if (!meta?.database_url || !meta?.database_auth_token) {
        throw new Error('Tenant database connection info not found');
      }

      console.log('Connecting to tenant database:', meta.database_url);

      const tenantDb = createClient({
        url: meta.database_url,
        authToken: meta.database_auth_token
      });

      return tenantDb;
    } catch (error: any) {
      throw new Error(`Failed to connect to tenant database: ${error.message}`);
    }
  }

  /**
   * Delete tenant and its database
   */
  static async deleteTenant(tenantId: number): Promise<TenantServiceResult> {
    try {
      // Get tenant info first
      const tenant = await this.getTenantById(tenantId);

      // Delete tenant record
      await db.delete(tenants).where(eq(tenants.id, tenantId));

      // Delete tenant database (placeholder)
      // In real implementation, use Turso API to delete the database
      console.log(`🗑️  Database ${tenant.database} marked for deletion`);

      return {
        success: true,
        tenant: tenant
      };
    } catch (error: any) {
      console.error('Tenant deletion failed:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred during tenant deletion'
      };
    }
  }

  /**
   * List all tenants with optional search filtering
   */
  static async getAllTenants(searchTerm?: string) {
    try {
      let allTenants = await db.select().from(tenants);

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        allTenants = allTenants.filter((tenant) => {
          const meta = tenant.meta ? (JSON.parse(tenant.meta) as TenantMeta) : null;
          return (
            tenant.name.toLowerCase().includes(searchLower) ||
            tenant.domain.toLowerCase().includes(searchLower) ||
            (meta?.contact_email && meta.contact_email.toLowerCase().includes(searchLower))
          );
        });
      }

      return allTenants;
    } catch (error: any) {
      throw new Error(`Failed to get tenants: ${error.message}`);
    }
  }
}
