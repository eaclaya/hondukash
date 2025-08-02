import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { landlordSchema } from './db/schema/landlord';
import { tenantSchema } from './db/schema/tenant';

// Create Turso client for landlord database
export const turso = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN
});

// Create Drizzle instance for landlord database with landlord schema
export const db = drizzle(turso, { schema: landlordSchema });

// Function to get tenant database connection
export async function getTenantDb(domain: string) {
  // First get tenant info from landlord database
  // const tenant = await db.query.tenants.findFirst({
  //   where: (tenants, { eq }) => eq(tenants.domain, domain)
  // });

  // if (!tenant) {
  //   throw new Error('Tenant not found');
  // }

  // // Parse meta to get database connection info
  // const meta = JSON.parse(tenant.meta || '{}');

  // if (!meta.database_url || !meta.database_auth_token) {
  //   throw new Error('Tenant database connection info not found');
  // }

  // Create tenant-specific Turso client
  const tenantTurso = createClient({
    // url: meta.database_url,
    // authToken: meta.database_auth_token,
    url: 'libsql://tenant-mpv-eaclaya.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTM0Nzc0NTgsInAiOnsicm9hIjp7Im5zIjpbIjgyZjNmZDkwLTMxMGYtNDYwZC05ZTdlLTgyN2RhYmZlMDhkMCJdfSwicnciOnsibnMiOlsiODJmM2ZkOTAtMzEwZi00NjBkLTllN2UtODI3ZGFiZmUwOGQwIl19fSwicmlkIjoiMmUzYTBiNGYtNzY5ZS00N2I1LThiZWItZTE5MGJjOTQwMGYyIn0.FIBykfAzP_A7Ihv0q3PNpJNCrU--rkGfTi7_sy68ChesKvmvbRUrMUbNWR5_v0u09Eh0aASmKskHBx9lNVFsAg'
  });

  // Create Drizzle instance for tenant database with tenant schema
  return drizzle(tenantTurso, { schema: tenantSchema });
}

// Function to create a tenant database client with specific connection info
export function createTenantDbClient(databaseUrl: string, authToken: string) {
  const tenantTurso = createClient({
    url: databaseUrl,
    authToken: authToken
  });

  return drizzle(tenantTurso, { schema: tenantSchema });
}
