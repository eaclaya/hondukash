import { sqliteTable, integer, text, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// =========================================
// STORES TABLE
// =========================================
export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').unique(),
  description: text('description'),
  location: text('location'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').default('Honduras'),
  postalCode: text('postal_code'),
  phone: text('phone'),
  email: text('email'),
  managerName: text('manager_name'),

  // Settings
  currency: text('currency').default('HNL'),
  taxRate: real('tax_rate').default(0.15), // 15% default tax rate
  invoicePrefix: text('invoice_prefix').default('INV'),
  invoiceCounter: integer('invoice_counter').default(1),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// USERS TABLE (Store-level users)
// =========================================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),

  // Profile
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  language: text('language').default('es'),
  timezone: text('timezone').default('America/Tegucigalpa'),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: text('last_login_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// MEMBERSHIPS TABLE
// =========================================
export const memberships = sqliteTable('memberships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// CATEGORIES TABLE
// =========================================
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  parentId: integer('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// PRODUCTS TABLE
// =========================================
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').unique(),
  barcode: text('barcode'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),

  // Pricing and Costing
  baseCost: real('base_cost').default(0), // Original purchase/manufacturing cost
  cost: real('cost').default(0), // Current replacement cost (for inventory valuation)
  basePrice: real('base_price').default(0), // Suggested retail price (before discounts)
  price: real('price').notNull(), // Current selling price (what customer pays)
  minPrice: real('min_price').default(0), // Minimum selling price allowed

  // Inventory
  trackInventory: integer('track_inventory', { mode: 'boolean' }).notNull().default(true),
  unit: text('unit').default('unit'),

  // Tax configuration
  isTaxable: integer('is_taxable', { mode: 'boolean' }).notNull().default(true),
  taxConfigurationId: integer('tax_configuration_id').references(() => taxConfigurations.id),
  taxRate: real('tax_rate'), // Kept for backward compatibility

  // Images and files
  imageUrl: text('image_url'),
  images: text('images').default('[]'),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVENTORY TABLE
// =========================================
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // Stock levels
  quantity: real('quantity').notNull().default(0),
  price: real('price').notNull().default(0),

  // Location
  location: text('location'), // Aisle, bin, etc.

  // Metadata
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => ({
  uniqueProductStore: uniqueIndex('unique_product_store').on(table.productId, table.storeId)
}));

// =========================================
// CLIENTS TABLE
// =========================================
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // Basic info
  name: text('name').notNull(),
  clientType: text('client_type', { enum: ['individual', 'company'] }).notNull().default('individual'),

  // Primary contact (for individuals, this is the person; for companies, this is main contact)
  primaryContactName: text('primary_contact_name'),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),

  // Company-specific information
  companyRegistrationNumber: text('company_registration_number'), // For companies
  taxId: text('tax_id'), // RTN in Honduras
  industry: text('industry'),
  website: text('website'),

  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').default('Honduras'),
  postalCode: text('postal_code'),

  // Business settings
  creditLimit: real('credit_limit').default(0),
  paymentTerms: integer('payment_terms').default(30), // days
  discountPercentage: real('discount_percentage').default(0), // Default discount for this client

  // Metadata
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// CLIENT CONTACTS TABLE
// =========================================
export const clientContacts = sqliteTable('client_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),

  // Contact details
  contactName: text('contact_name').notNull(),
  jobTitle: text('job_title'),
  department: text('department'),

  // Contact information
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  extension: text('extension'),

  // Contact type and permissions
  contactType: text('contact_type', { 
    enum: ['primary', 'employee', 'manager', 'executive', 'procurement', 'accounting', 'other'] 
  }).notNull().default('employee'),

  // Purchase permissions
  canMakePurchases: integer('can_make_purchases', { mode: 'boolean' }).default(true),
  purchaseLimit: real('purchase_limit'), // Maximum amount this contact can authorize
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(false), // Does this contact need approval for purchases?

  // Contact preferences
  preferredContactMethod: text('preferred_contact_method', { enum: ['email', 'phone', 'mobile'] }).default('email'),
  language: text('language').default('es'),
  timezone: text('timezone').default('America/Tegucigalpa'),

  // Status
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false), // Is this the primary contact?
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Metadata
  notes: text('notes'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVOICES TABLE
// =========================================
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'restrict' }),
  clientId: integer('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  clientContactId: integer('client_contact_id').references(() => clientContacts.id, { onDelete: 'set null' }), // Who made this purchase
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Invoice details
  invoiceNumber: text('invoice_number').notNull().unique(),
  invoiceDate: text('invoice_date').notNull().$defaultFn(() => new Date().toISOString().split('T')[0]),
  dueDate: text('due_date'),

  // Contact info at time of invoice (for historical record)
  contactName: text('contact_name'), // Name of person who made purchase
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),

  // Amounts
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),

  // Status
  status: text('status', { enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] }).notNull().default('draft'),

  // Payment
  paidAmount: real('paid_amount').notNull().default(0),
  // balanceDue: real('balance_due').$defaultFn(() => totalAmount - paidAmount), // Generated column

  // Additional info
  notes: text('notes'),
  terms: text('terms'),

  // Metadata
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVOICE ITEMS TABLE
// =========================================
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'restrict' }),

  // Item details
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),

  // Calculated fields (handled in application code)
  // lineTotal: real('line_total'), // quantity * unitPrice

  // Tax
  taxRate: real('tax_rate').default(0),
  // taxAmount: real('tax_amount'), // lineTotal * taxRate

  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

// =========================================
// TAGGING SYSTEM
// =========================================
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // Tag details
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // Hex color for UI display

  // Tag category/type for organization
  category: text('category', { 
    enum: ['general', 'client', 'product', 'discount', 'marketing', 'custom'] 
  }).default('general'),

  // Tag settings
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').default(0),

  // Metadata
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => ({
  uniqueName: uniqueIndex('unique_tag_name').on(table.name)
}));

// Entity Tags (Polymorphic Relationship)
export const taggable = sqliteTable('taggable', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),

  // Polymorphic relationship
  entityType: text('entity_type', { 
    enum: ['client', 'product', 'invoice', 'category', 'user', 'supplier', 'expense'] 
  }).notNull(),
  entityId: integer('entity_id').notNull(),

  // Assignment details
  assignedAt: text('assigned_at').notNull().$defaultFn(() => new Date().toISOString()),
  assignedBy: integer('assigned_by').references(() => users.id, { onDelete: 'set null' }),

  // Metadata
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => ({
  uniqueTagEntity: uniqueIndex('unique_tag_entity').on(table.tagId, table.entityType, table.entityId)
}));

// =========================================
// PRICING RULES SYSTEM
// =========================================
export const pricingRules = sqliteTable('pricing_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // Rule identification
  name: text('name').notNull(),
  description: text('description'),
  ruleCode: text('rule_code'),

  // Rule type and priority
  ruleType: text('rule_type', { 
    enum: ['percentage_discount', 'fixed_amount_discount', 'fixed_price', 'buy_x_get_y', 'quantity_discount'] 
  }).notNull(),
  priority: integer('priority').notNull().default(0), // Higher number = higher priority

  // Discount values
  discountPercentage: real('discount_percentage').default(0), // 15.50 = 15.5%
  discountAmount: real('discount_amount').default(0), // Fixed amount off
  fixedPrice: real('fixed_price').default(0), // Set specific price

  // Buy X Get Y settings
  buyQuantity: integer('buy_quantity').default(0), // Buy X items
  getQuantity: integer('get_quantity').default(0), // Get Y items free/discounted
  getDiscountPercentage: real('get_discount_percentage').default(0), // Discount on Y items

  // Rule status and dates
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  startDate: text('start_date'),
  endDate: text('end_date'),

  // Usage limits
  usageLimit: integer('usage_limit'), // Total times rule can be used
  usageCount: integer('usage_count').default(0),
  usageLimitPerCustomer: integer('usage_limit_per_customer'), // Per customer limit

  // Metadata
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => ({
  uniqueStoreRuleCode: uniqueIndex('unique_store_rule_code').on(table.storeId, table.ruleCode)
}));

// =========================================
// TAX CONFIGURATIONS
// =========================================
export const taxConfigurations = sqliteTable('tax_configurations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),

  // Tax details
  taxName: text('tax_name').notNull(),
  taxCode: text('tax_code').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxType: text('tax_type', { enum: ['sales', 'purchase', 'both'] }).notNull(),

  // Settings
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Metadata
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => ({
  uniqueStoreTaxCode: uniqueIndex('unique_store_tax_code').on(table.storeId, table.taxCode)
}));

// Export all tables as schema
export const tenantSchema = {
  stores,
  users,
  memberships,
  categories,
  products,
  inventory,
  clients,
  clientContacts,
  invoices,
  invoiceItems,
  tags,
  taggable,
  pricingRules,
  taxConfigurations
};