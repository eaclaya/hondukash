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

// Types for caching
interface TenantCacheEntry {
  id: number;
  name: string;
  domain: string;
  database: string;
  meta: string;
  isActive: boolean;
  cachedAt: number;
}

interface TenantDbConnection {
  db: ReturnType<typeof drizzle>;
  cachedAt: number;
}

// In-memory caches
const tenantMetaCache = new Map<string, TenantCacheEntry>();
const tenantDbCache = new Map<string, TenantDbConnection>();

// Cache configuration
const TENANT_META_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const TENANT_DB_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

// Utility function to check if cache entry is valid
function isCacheValid(cachedAt: number, ttl: number): boolean {
  return Date.now() - cachedAt < ttl;
}

// Utility function to manage cache size (LRU-like behavior)
function manageCacheSize<T>(cache: Map<string, T>, maxSize: number): void {
  if (cache.size >= maxSize) {
    // Remove oldest entries (first 10% of cache)
    const entriesToRemove = Math.ceil(maxSize * 0.1);
    const keys = Array.from(cache.keys());
    for (let i = 0; i < entriesToRemove && keys.length > 0; i++) {
      cache.delete(keys[i]);
    }
  }
}

// Function to get tenant metadata with caching
async function getCachedTenantMeta(domain: string): Promise<TenantCacheEntry> {
  // Check cache first
  const cached = tenantMetaCache.get(domain);
  if (cached && isCacheValid(cached.cachedAt, TENANT_META_CACHE_TTL)) {
    return cached;
  }

  // Fetch from database
  const tenant = await db.query.tenants.findFirst({
    where: (tenants, { eq }) => eq(tenants.domain, domain)
  });

  if (!tenant) {
    throw new Error(`Tenant not found for domain: ${domain}`);
  }

  // Create cache entry
  const cacheEntry: TenantCacheEntry = {
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    database: tenant.database,
    meta: tenant.meta || '{}',
    isActive: tenant.isActive,
    cachedAt: Date.now()
  };

  // Manage cache size before adding new entry
  manageCacheSize(tenantMetaCache, MAX_CACHE_SIZE);

  // Cache the result
  tenantMetaCache.set(domain, cacheEntry);

  return cacheEntry;
}

// Function to get tenant database connection with caching
export async function getTenantDb(domain: string) {

  // Generate cache key for the database connection
  const dbCacheKey = `db_${domain}`;

  // Check if we have a valid database connection in cache
  const cachedDb = tenantDbCache.get(dbCacheKey);
  if (cachedDb && isCacheValid(cachedDb.cachedAt, TENANT_DB_CACHE_TTL)) {
    return cachedDb.db;
  }

  // Get tenant metadata (this uses its own cache)
  const tenant = await getCachedTenantMeta(domain);

  if (!tenant.isActive) {
    throw new Error(`Tenant is inactive: ${domain}`);
  }

  // Parse meta to get database connection info
  const meta = JSON.parse(tenant.meta);

  if (!meta.database_url || !meta.database_auth_token) {
    throw new Error(`Tenant database connection info not found for domain: ${domain}`);
  }

  // Create tenant-specific Turso client
  const tenantTurso = createClient({
    url: meta.database_url,
    authToken: meta.database_auth_token
  });


  // Create Drizzle instance for tenant database with tenant schema
  const tenantDb = drizzle(tenantTurso, { schema: tenantSchema });


  // Manage cache size before adding new entry
  manageCacheSize(tenantDbCache, MAX_CACHE_SIZE);

  // Cache the database connection
  tenantDbCache.set(dbCacheKey, {
    db: tenantDb,
    cachedAt: Date.now()
  });

  return tenantDb;
}

// Function to create a tenant database client with specific connection info
export function createTenantDbClient(databaseUrl: string, authToken: string) {
  const tenantTurso = createClient({
    url: databaseUrl,
    authToken: authToken
  });

  return drizzle(tenantTurso, { schema: tenantSchema });
}

// Cache invalidation and management functions
export function invalidateTenantCache(domain: string): void {
  tenantMetaCache.delete(domain);
  tenantDbCache.delete(`db_${domain}`);
}

export function invalidateAllTenantCaches(): void {
  tenantMetaCache.clear();
  tenantDbCache.clear();
}

export function getTenantCacheStats(): {
  metaCache: { size: number; keys: string[] };
  dbCache: { size: number; keys: string[] };
} {
  return {
    metaCache: {
      size: tenantMetaCache.size,
      keys: Array.from(tenantMetaCache.keys())
    },
    dbCache: {
      size: tenantDbCache.size,
      keys: Array.from(tenantDbCache.keys())
    }
  };
}

// Function to preload tenant into cache (useful for warming up)
export async function preloadTenantCache(domain: string): Promise<void> {
  try {
    await getCachedTenantMeta(domain);
    await getTenantDb(domain);
  } catch (error) {
    console.error(`Failed to preload cache for tenant ${domain}:`, error);
    throw error;
  }
}

// Function to refresh a specific tenant's cache
export async function refreshTenantCache(domain: string): Promise<void> {
  invalidateTenantCache(domain);
  await preloadTenantCache(domain);
}

// Cleanup function to remove expired entries (can be called periodically)
export function cleanupExpiredCaches(): { removedMeta: number; removedDb: number } {
  let removedMeta = 0;
  let removedDb = 0;

  // Clean up tenant metadata cache
  for (const [domain, entry] of tenantMetaCache.entries()) {
    if (!isCacheValid(entry.cachedAt, TENANT_META_CACHE_TTL)) {
      tenantMetaCache.delete(domain);
      removedMeta++;
    }
  }

  // Clean up database connection cache
  for (const [key, entry] of tenantDbCache.entries()) {
    if (!isCacheValid(entry.cachedAt, TENANT_DB_CACHE_TTL)) {
      tenantDbCache.delete(key);
      removedDb++;
    }
  }

  return { removedMeta, removedDb };
}

// Auto-cleanup: Run cleanup every 15 minutes (only in server environment)
if (typeof globalThis !== 'undefined' && typeof globalThis.setInterval === 'function') {
  setInterval(() => {
    const cleaned = cleanupExpiredCaches();
    if (cleaned.removedMeta > 0 || cleaned.removedDb > 0) {

    }
  }, 15 * 60 * 1000); // 15 minutes
}
