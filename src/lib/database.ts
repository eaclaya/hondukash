import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Server-side Supabase client with service role
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Function to create a new tenant schema
export async function createTenantSchema(subdomain: string): Promise<boolean> {
  const supabase = createAdminClient();
  const schemaName = `tenant_${subdomain}`;

  try {
    // Read the tenant schema template
    const schemaPath = path.join(process.cwd(), 'database/schema/tenant_schema.sql');
    const schemaTemplate = fs.readFileSync(schemaPath, 'utf8');

    // Replace placeholders with actual schema name
    const schemaSQL = schemaTemplate.replace(/{TENANT_SCHEMA}/g, schemaName);

    // Create the schema
    const { error: createSchemaError } = await supabase.rpc('create_schema', {
      schema_name: schemaName
    });

    if (createSchemaError) {
      console.error('Error creating schema:', createSchemaError);
      return false;
    }

    // Execute the schema creation SQL
    // Note: This would need to be done with a direct database connection
    // as Supabase doesn't allow DDL operations through the client
    // You would use pg or another PostgreSQL client for this

    console.log(`Schema ${schemaName} created successfully`);
    return true;
  } catch (error) {
    console.error('Error creating tenant schema:', error);
    return false;
  }
}

// Function to get tenant by subdomain
export async function getTenantBySubdomain(subdomain: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from('tenants').select('*').eq('subdomain', subdomain).eq('is_active', true).single();

  if (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }

  return data;
}

// Function to list all tenants
export async function getAllTenants() {
  const supabase = createAdminClient();

  const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }

  return data;
}

// Function to create a new tenant
export async function createTenant(tenantData: {
  name: string;
  subdomain: string;
  email: string;
  password: string;
  contact_name: string;
  plan?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  const supabase = createAdminClient();

  try {
    // Use the stored function to create tenant
    const { data, error } = await supabase.rpc('create_tenant', {
      p_name: tenantData.name,
      p_subdomain: tenantData.subdomain,
      p_email: tenantData.email,
      p_password: tenantData.password,
      p_contact_name: tenantData.contact_name,
      p_plan: tenantData.plan || 'basic',
      p_phone: tenantData.phone,
      p_address: tenantData.address,
      p_city: tenantData.city,
      p_country: tenantData.country || 'Honduras'
    });

    if (error) {
      console.error('Error creating tenant:', error);
      return { success: false, error: error.message };
    }

    // Create the tenant schema
    const schemaCreated = await createTenantSchema(tenantData.subdomain);

    if (!schemaCreated) {
      // Rollback tenant creation if schema creation fails
      await supabase.from('tenants').delete().eq('id', data);

      return { success: false, error: 'Failed to create tenant schema' };
    }

    return { success: true, tenantId: data };
  } catch (error) {
    console.error('Error in createTenant:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Function to update tenant
export async function updateTenant(
  tenantId: string,
  updates: Partial<{
    name: string;
    status: string;
    plan: string;
    contact_name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  }>
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tenant:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Function to delete tenant
export async function deleteTenant(tenantId: string) {
  const supabase = createAdminClient();

  try {
    // Get tenant info first
    const { data: tenant } = await supabase.from('tenants').select('subdomain, schema_name').eq('id', tenantId).single();

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    // Delete tenant record (cascade will handle related records)
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);

    if (error) {
      console.error('Error deleting tenant:', error);
      return { success: false, error: error.message };
    }

    // TODO: Drop tenant schema (would need direct DB connection)
    // await supabase.rpc('drop_schema', { schema_name: tenant.schema_name })

    return { success: true };
  } catch (error) {
    console.error('Error in deleteTenant:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Function to get tenant-specific Supabase client
export function createTenantClient(schemaName: string) {
  const supabase = createAdminClient();

  // Set the schema context
  // Note: This would require custom implementation for schema switching
  // Supabase doesn't natively support schema switching

  return {
    ...supabase,
    schema: schemaName
  };
}
