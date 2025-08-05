import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// =========================================
// ADMIN USERS TABLE
// =========================================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['super_admin', 'admin'] }).notNull().default('admin'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// TENANTS TABLE
// =========================================
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  database: text('database').notNull(),
  meta: text('meta'), // JSON string containing TenantMeta
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// SUBSCRIPTION PLANS TABLE
// =========================================
export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  priceMonthly: integer('price_monthly').notNull(),
  priceYearly: integer('price_yearly'),
  currency: text('currency').notNull().default('USD'),

  // Limits
  maxUsers: integer('max_users').notNull().default(5),
  maxStores: integer('max_stores').notNull().default(1),
  storageLimitGb: integer('storage_limit_gb').notNull().default(1),

  // Features (JSON field for flexibility)
  features: text('features').notNull().default('{}'),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// SYSTEM SETTINGS TABLE
// =========================================
export const systemSettings = sqliteTable('system_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  description: text('description'),
  dataType: text('data_type', { enum: ['string', 'number', 'boolean', 'json'] }).notNull().default('string'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// AUDIT LOG TABLE
// =========================================
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  userId: integer('user_id'), // Can reference users or tenant users
  userType: text('user_type', { enum: ['admin', 'tenant_admin', 'tenant_user'] }).notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

// Export all tables as schema
export const landlordSchema = {
  users,
  tenants,
  subscriptionPlans,
  systemSettings,
  auditLogs
};