import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { landlordSchema } from './db/schema/landlord';
import { tenantSchema } from './db/schema/tenant';
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";


// Create Turso client for landlord database
export const turso = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN
});

// Create Drizzle instance for landlord database with landlord schema
export const db = drizzle(turso, { schema: landlordSchema });


// Function to get tenant database connection with caching
export async function getTenantDb(domain: string) {

  // Create tenant-specific Turso client
  const tenantTurso = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!
  });

  //Neon database
  // const sql = neon(process.env.DATABASE_URL!);
  // const tenantDb = neonDrizzle(sql, { schema: tenantSchema });

  // Create Drizzle instance for tenant database with tenant schema
  const tenantDb = drizzle(tenantTurso, { schema: tenantSchema });

  return tenantDb;
}


