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
  language: text('language').default('es'), // Default language for the store
  taxRate: real('tax_rate').default(0.15), // 15% default tax rate
  invoicePrefix: text('invoice_prefix').default('INV'),
  invoiceCounter: integer('invoice_counter').default(1),
  quotePrefix: text('quote_prefix').default('QUO'),
  quoteCounter: integer('quote_counter').default(1),

  // Invoice Sequence Feature (JSON field)
  invoiceSequence: text('invoice_sequence'), // JSON: {hash, sequence_start, sequence_end, limit_date, enabled}

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
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
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// MEMBERSHIPS TABLE
// =========================================
export const memberships = sqliteTable('memberships', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
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
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
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

  // Tax rates
  isTaxable: integer('is_taxable', { mode: 'boolean' }).notNull().default(true),
  taxRateId: integer('tax_rate_id').references(() => taxRates.id),

  // Images and files
  imageUrl: text('image_url'),
  images: text('images').default('[]'),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  tags: text('tags'),

  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVENTORY TABLE
// =========================================
export const inventory = sqliteTable(
  'inventory',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    storeId: integer('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),

    // Stock levels
    quantity: real('quantity').notNull().default(0),
    price: real('price').notNull().default(0),

    // Location
    location: text('location'), // Aisle, bin, etc.

    // Metadata
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString())
  },
  (table) => ({
    uniqueProductStore: uniqueIndex('unique_product_store').on(table.productId, table.storeId)
  })
);

// =========================================
// INVENTORY MOVEMENTS TABLE
// =========================================
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),

  // Movement details
  movementType: text('movement_type', {
    enum: ['in', 'out', 'adjustment', 'transfer_in', 'transfer_out']
  }).notNull(),
  quantity: real('quantity').notNull(), // Positive for in, negative for out
  previousQuantity: real('previous_quantity').notNull(),
  newQuantity: real('new_quantity').notNull(),

  // Reference information
  referenceType: text('reference_type', {
    enum: ['invoice', 'purchase', 'adjustment', 'transfer', 'initial', 'return']
  }),
  referenceId: integer('reference_id'), // ID of invoice, purchase, etc.
  referenceNumber: text('reference_number'), // Invoice number, PO number, etc.

  // Additional details
  unitCost: real('unit_cost').default(0), // Cost per unit at time of movement
  totalValue: real('total_value').default(0), // quantity * unitCost
  notes: text('notes'),

  // Metadata
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// CLIENTS TABLE
// =========================================
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),

  // Basic info
  name: text('name').notNull(),
  clientType: text('client_type', { enum: ['individual', 'company'] })
    .notNull()
    .default('individual'),

  // Primary contact (for individuals, this is the person; for companies, this is main contact)
  primaryContactName: text('primary_contact_name'),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),

  // Company-specific information
  companyRegistrationNumber: text('company_registration_number'), // For companies
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

  // Metadata
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  tags: text('tags'),

  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// CLIENT CONTACTS TABLE
// =========================================
export const clientContacts = sqliteTable('client_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),

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
  })
    .notNull()
    .default('employee'),

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
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVOICES TABLE
// =========================================
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Invoice details
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: text('invoice_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  dueDate: text('due_date'),

  // Contact info at time of invoice (for historical record)
  clientName: text('client_name'), // Name of client who made purchase

  // Amounts
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),

  // Status
  status: text('status', { enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] })
    .notNull()
    .default('draft'),

  // Payment
  paidAmount: real('paid_amount').notNull().default(0),
  // balanceDue: real('balance_due').$defaultFn(() => totalAmount - paidAmount), // Generated column

  // Additional info
  notes: text('notes'),
  terms: text('terms'),
  tags: text('tags'),

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// INVOICE ITEMS TABLE
// =========================================
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),

  // Item details
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),

  // Calculated fields
  lineTotal: real('line_total').notNull(),

  // Tax
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),

  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// QUOTES TABLE
// =========================================
export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  clientId: integer('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'restrict' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Quote details
  quoteNumber: text('quote_number').notNull().unique(),
  quoteDate: text('quote_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  validUntil: text('valid_until'),

  // Contact info at time of quote (for historical record)
  clientName: text('client_name'), // Name of client who requested quote

  // Amounts
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),

  // Status
  status: text('status', { enum: ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'] })
    .notNull()
    .default('draft'),

  // Conversion tracking
  convertedToInvoiceId: integer('converted_to_invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  convertedAt: text('converted_at'),

  // Additional info
  notes: text('notes'),
  terms: text('terms'),
  tags: text('tags'),

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// QUOTE ITEMS TABLE
// =========================================
export const quoteItems = sqliteTable('quote_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),

  // Item details
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),

  // Calculated fields
  lineTotal: real('line_total').notNull(),

  // Tax
  taxRate: real('tax_rate').default(0),
  taxAmount: real('tax_amount').default(0),

  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// TAGGING SYSTEM
// =========================================
export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

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
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString())
  },
  (table) => ({
    uniqueName: uniqueIndex('unique_tag_name').on(table.name)
  })
);

// =========================================
// PRICING RULES SYSTEM
// =========================================
export const pricingRules = sqliteTable(
  'pricing_rules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    storeId: integer('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),

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
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString())
  },
  (table) => ({
    uniqueRuleCode: uniqueIndex('unique_rule_code').on(table.ruleCode)
  })
);

// Rule Conditions
export const ruleConditions = sqliteTable('rule_conditions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pricingRuleId: integer('pricing_rule_id')
    .notNull()
    .references(() => pricingRules.id, { onDelete: 'cascade' }),

  // Condition details
  conditionType: text('condition_type', {
    enum: [
      'cart_subtotal',
      'cart_quantity',
      'product_quantity',
      'client_has_tag',
      'client_has_any_tags',
      'product_has_tag',
      'product_has_any_tags',
      'product_category',
      'product_sku',
      'day_of_week',
      'time_of_day',
      'customer_total_purchases',
      'invoice_has_tag'
    ]
  }).notNull(),

  // Condition operators
  operator: text('operator', {
    enum: ['equals', 'not_equals', 'greater_than', 'greater_equal', 'less_than', 'less_equal', 'in', 'not_in', 'between']
  }).notNull(),

  // Condition values
  valueText: text('value_text'), // For text comparisons
  valueNumber: real('value_number'), // For numeric comparisons
  valueArray: text('value_array'), // For IN/NOT IN operations (tag slugs, etc.) - JSON array
  valueStart: real('value_start'), // For BETWEEN operations
  valueEnd: real('value_end'), // For BETWEEN operations

  // Logical operators
  logicalOperator: text('logical_operator', { enum: ['AND', 'OR'] }).default('AND'),
  conditionGroup: integer('condition_group').default(1), // Group conditions together

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// Rule Targets
export const ruleTargets = sqliteTable('rule_targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pricingRuleId: integer('pricing_rule_id')
    .notNull()
    .references(() => pricingRules.id, { onDelete: 'cascade' }),

  // Target type
  targetType: text('target_type', {
    enum: [
      'all_products',
      'specific_products',
      'products_with_tag',
      'products_with_any_tags',
      'product_category',
      'cheapest_item',
      'most_expensive_item'
    ]
  }).notNull(),

  // Target identifiers
  targetIds: text('target_ids'), // JSON array of product IDs, category IDs, etc.
  targetTags: text('target_tags'), // JSON array of tag slugs for tag-based targeting

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// Discount Usage Tracking
export const discountUsage = sqliteTable('discount_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pricingRuleId: integer('pricing_rule_id')
    .notNull()
    .references(() => pricingRules.id, { onDelete: 'cascade' }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),

  // Usage details
  discountAmount: real('discount_amount').notNull(),
  originalAmount: real('original_amount').notNull(),
  finalAmount: real('final_amount').notNull(),

  // Applied items
  appliedItems: text('applied_items'), // JSON details of which items got the discount

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// Quantity Price Tiers
export const quantityPriceTiers = sqliteTable('quantity_price_tiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pricingRuleId: integer('pricing_rule_id')
    .notNull()
    .references(() => pricingRules.id, { onDelete: 'cascade' }),

  // Tier definition
  minQuantity: real('min_quantity').notNull(),
  maxQuantity: real('max_quantity'), // NULL = no upper limit

  // Pricing
  tierPrice: real('tier_price'), // Fixed price per unit
  tierDiscountPercentage: real('tier_discount_percentage'), // Percentage discount
  tierDiscountAmount: real('tier_discount_amount'), // Fixed amount discount per unit

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// PAYMENTS TABLE
// =========================================
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'restrict' }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Payment details
  paymentNumber: text('payment_number').notNull().unique(),
  paymentDate: text('payment_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  amount: real('amount').notNull(),

  // Payment method and details
  paymentMethod: text('payment_method', {
    enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']
  }).notNull(),
  paymentReference: text('payment_reference'), // Transaction ID, check number, etc.
  bankName: text('bank_name'),
  accountNumber: text('account_number'), // Last 4 digits for cards
  
  // Status and metadata
  status: text('status', { enum: ['pending', 'completed', 'failed', 'cancelled'] })
    .notNull()
    .default('completed'),
  notes: text('notes'),

  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// CHART OF ACCOUNTS
// =========================================
export const chartOfAccounts = sqliteTable('chart_of_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),

  // Account details
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type', {
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  }).notNull(),
  accountSubType: text('account_sub_type', {
    enum: [
      // Assets
      'current_asset', 'non_current_asset', 'cash', 'accounts_receivable', 'inventory', 'prepaid_expenses', 'fixed_assets', 'intangible_assets',
      // Liabilities
      'current_liability', 'non_current_liability', 'accounts_payable', 'accrued_expenses', 'notes_payable', 'long_term_debt',
      // Equity
      'owner_equity', 'retained_earnings', 'common_stock', 'additional_paid_in_capital',
      // Revenue
      'operating_revenue', 'non_operating_revenue', 'sales_revenue', 'service_revenue', 'other_income',
      // Expenses
      'operating_expense', 'cost_of_goods_sold', 'administrative_expense', 'selling_expense', 'financial_expense', 'other_expense'
    ]
  }).notNull(),

  // Hierarchy
  parentAccountId: integer('parent_account_id').references(() => chartOfAccounts.id, { onDelete: 'set null' }),
  
  // Account behavior
  normalBalance: text('normal_balance', { enum: ['debit', 'credit'] }).notNull(),
  isSystemAccount: integer('is_system_account', { mode: 'boolean' }).default(false),
  isControlAccount: integer('is_control_account', { mode: 'boolean' }).default(false),
  
  // Settings
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  
  // Current balance (calculated field, updated by triggers/jobs)
  currentBalance: real('current_balance').default(0),
  
  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// JOURNAL ENTRIES
// =========================================
export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Entry details
  entryNumber: text('entry_number').notNull(),
  entryDate: text('entry_date').notNull(),
  description: text('description').notNull(),
  
  // Reference information
  referenceType: text('reference_type', {
    enum: ['manual', 'invoice', 'payment', 'purchase', 'adjustment', 'opening_balance', 'closing_entry']
  }).notNull().default('manual'),
  referenceId: integer('reference_id'), // ID of invoice, payment, etc.
  referenceNumber: text('reference_number'), // Invoice number, payment number, etc.
  
  // Entry status
  status: text('status', { enum: ['draft', 'posted', 'reversed'] }).notNull().default('draft'),
  reversedById: integer('reversed_by_id').references(() => journalEntries.id, { onDelete: 'set null' }),
  reversedAt: text('reversed_at'),
  
  // Totals (should always balance)
  totalDebits: real('total_debits').default(0),
  totalCredits: real('total_credits').default(0),
  
  // Metadata
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// JOURNAL ENTRY LINES
// =========================================
export const journalEntryLines = sqliteTable('journal_entry_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  journalEntryId: integer('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: integer('account_id')
    .notNull()
    .references(() => chartOfAccounts.id, { onDelete: 'restrict' }),

  // Line details
  description: text('description'),
  debitAmount: real('debit_amount').default(0),
  creditAmount: real('credit_amount').default(0),
  
  // Additional references
  referenceType: text('reference_type'),
  referenceId: integer('reference_id'),
  
  // Line order
  lineOrder: integer('line_order').default(0),
  
  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// BANK ACCOUNTS
// =========================================
export const bankAccounts = sqliteTable('bank_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  chartAccountId: integer('chart_account_id')
    .notNull()
    .references(() => chartOfAccounts.id, { onDelete: 'restrict' }),

  // Account details
  accountName: text('account_name').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountType: text('account_type', {
    enum: ['checking', 'savings', 'money_market', 'credit_card', 'cash', 'petty_cash']
  }).notNull(),
  
  // Account information
  routingNumber: text('routing_number'),
  swiftCode: text('swift_code'),
  iban: text('iban'),
  currency: text('currency').default('HNL'),
  
  // Current balance (calculated from transactions)
  currentBalance: real('current_balance').default(0),
  availableBalance: real('available_balance').default(0),
  
  // Settings
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  
  // Bank details
  branchName: text('branch_name'),
  branchAddress: text('branch_address'),
  contactPerson: text('contact_person'),
  contactPhone: text('contact_phone'),
  
  // Metadata
  description: text('description'),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// BANK TRANSACTIONS
// =========================================
export const bankTransactions = sqliteTable('bank_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bankAccountId: integer('bank_account_id')
    .notNull()
    .references(() => bankAccounts.id, { onDelete: 'cascade' }),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id, { onDelete: 'set null' }),

  // Transaction details
  transactionDate: text('transaction_date').notNull(),
  description: text('description').notNull(),
  referenceNumber: text('reference_number'), // Check number, wire reference, etc.
  
  // Amounts
  debitAmount: real('debit_amount').default(0),
  creditAmount: real('credit_amount').default(0),
  runningBalance: real('running_balance').default(0),
  
  // Transaction details
  transactionType: text('transaction_type', {
    enum: ['deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'check', 'electronic', 'adjustment']
  }).notNull(),
  
  // Status
  status: text('status', { enum: ['pending', 'cleared', 'reconciled', 'voided'] }).notNull().default('pending'),
  clearedDate: text('cleared_date'),
  reconciledDate: text('reconciled_date'),
  
  // References
  payeePayor: text('payee_payor'), // Who the transaction was to/from
  category: text('category'),
  
  // Metadata
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// SUPPLIERS/VENDORS
// =========================================
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),

  // Basic info
  name: text('name').notNull(),
  supplierType: text('supplier_type', { enum: ['individual', 'company'] })
    .notNull()
    .default('company'),
  
  // Contact info
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  website: text('website'),
  
  // Address
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country').default('Honduras'),
  postalCode: text('postal_code'),
  
  // Business details
  taxId: text('tax_id'),
  registrationNumber: text('registration_number'),
  
  // Payment terms
  paymentTerms: integer('payment_terms').default(30), // days
  creditLimit: real('credit_limit').default(0),
  
  // Settings
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  // Metadata
  notes: text('notes'),
  tags: text('tags'), // JSON array
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// PURCHASE ORDERS
// =========================================
export const purchaseOrders = sqliteTable('purchase_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // PO details
  poNumber: text('po_number').notNull(),
  poDate: text('po_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  expectedDate: text('expected_date'),
  
  // Amounts
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  
  // Status
  status: text('status', { enum: ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'] })
    .notNull()
    .default('draft'),
  
  // Additional info
  notes: text('notes'),
  terms: text('terms'),
  
  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// PURCHASE ORDER ITEMS
// =========================================
export const purchaseOrderItems = sqliteTable('purchase_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),

  // Item details
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitCost: real('unit_cost').notNull(),
  lineTotal: real('line_total').notNull(),
  
  // Receiving tracking
  quantityReceived: real('quantity_received').default(0),
  quantityInvoiced: real('quantity_invoiced').default(0),
  
  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// BILLS/VENDOR INVOICES
// =========================================
export const bills = sqliteTable('bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'restrict' }),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Bill details
  billNumber: text('bill_number').notNull(), // Our internal number
  supplierInvoiceNumber: text('supplier_invoice_number'), // Supplier's invoice number
  billDate: text('bill_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  dueDate: text('due_date'),
  
  // Amounts
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  paidAmount: real('paid_amount').notNull().default(0),
  
  // Status
  status: text('status', { enum: ['draft', 'open', 'paid', 'partial', 'overdue', 'cancelled'] })
    .notNull()
    .default('draft'),
  
  // Additional info
  notes: text('notes'),
  terms: text('terms'),
  
  // Metadata
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// BILL ITEMS
// =========================================
export const billItems = sqliteTable('bill_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  billId: integer('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'restrict' }),

  // Item details
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitCost: real('unit_cost').notNull(),
  lineTotal: real('line_total').notNull(),
  
  // Account assignment
  accountId: integer('account_id').references(() => chartOfAccounts.id, { onDelete: 'restrict' }),
  
  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// BILL PAYMENTS
// =========================================
export const billPayments = sqliteTable('bill_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  billId: integer('bill_id')
    .notNull()
    .references(() => bills.id, { onDelete: 'restrict' }),
  bankAccountId: integer('bank_account_id')
    .notNull()
    .references(() => bankAccounts.id, { onDelete: 'restrict' }),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

  // Payment details
  paymentNumber: text('payment_number').notNull(),
  paymentDate: text('payment_date')
    .notNull()
    .$defaultFn(() => new Date().toISOString().split('T')[0]),
  amount: real('amount').notNull(),
  
  // Payment method
  paymentMethod: text('payment_method', {
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'electronic', 'other']
  }).notNull(),
  referenceNumber: text('reference_number'), // Check number, confirmation number, etc.
  
  // Status
  status: text('status', { enum: ['pending', 'cleared', 'voided'] })
    .notNull()
    .default('pending'),
  
  // Metadata
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// TAX RATES
// =========================================
export const taxRates = sqliteTable('tax_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Tax details
  name: text('name').notNull(),
  code: text('code').notNull(),
  rate: real('rate').notNull(),
  type: text('type', { enum: ['sales', 'purchase', 'both'] }).notNull(),

  // Settings
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),

  // Metadata
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
});

// =========================================
// RELATIONS
// =========================================
import { relations } from 'drizzle-orm';

export const storesRelations = relations(stores, ({ many }) => ({
  memberships: many(memberships),
  clients: many(clients),
  products: many(products),
  inventory: many(inventory),
  invoices: many(invoices),
  quotes: many(quotes),
  taxRates: many(taxRates)
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  clientContacts: many(clientContacts),
  invoices: many(invoices),
  quotes: many(quotes)
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id]
  }),
  store: one(stores, {
    fields: [memberships.storeId],
    references: [stores.id]
  })
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  store: one(stores, {
    fields: [clients.storeId],
    references: [stores.id]
  }),
  contacts: many(clientContacts),
  invoices: many(invoices),
  quotes: many(quotes)
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id]
  })
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products)
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  inventory: many(inventory),
  invoiceItems: many(invoiceItems),
  taxRate: one(taxRates, {
    fields: [products.taxRateId],
    references: [taxRates.id]
  })
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id]
  }),
  store: one(stores, {
    fields: [inventory.storeId],
    references: [stores.id]
  }),
  movements: many(inventoryMovements)
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id]
  }),
  store: one(stores, {
    fields: [inventoryMovements.storeId],
    references: [stores.id]
  }),
  user: one(users, {
    fields: [inventoryMovements.userId],
    references: [users.id]
  })
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  store: one(stores, {
    fields: [invoices.storeId],
    references: [stores.id]
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id]
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id]
  }),
  items: many(invoiceItems),
  payments: many(payments)
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id]
  })
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  store: one(stores, {
    fields: [quotes.storeId],
    references: [stores.id]
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id]
  }),
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id]
  }),
  convertedToInvoice: one(invoices, {
    fields: [quotes.convertedToInvoiceId],
    references: [invoices.id]
  }),
  items: many(quoteItems)
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id]
  }),
  product: one(products, {
    fields: [quoteItems.productId],
    references: [products.id]
  })
}));

export const pricingRulesRelations = relations(pricingRules, ({ one, many }) => ({
  conditions: many(ruleConditions),
  targets: many(ruleTargets),
  usage: many(discountUsage),
  quantityTiers: many(quantityPriceTiers)
}));

export const ruleConditionsRelations = relations(ruleConditions, ({ one }) => ({
  pricingRule: one(pricingRules, {
    fields: [ruleConditions.pricingRuleId],
    references: [pricingRules.id]
  })
}));

export const ruleTargetsRelations = relations(ruleTargets, ({ one }) => ({
  pricingRule: one(pricingRules, {
    fields: [ruleTargets.pricingRuleId],
    references: [pricingRules.id]
  })
}));

export const discountUsageRelations = relations(discountUsage, ({ one }) => ({
  pricingRule: one(pricingRules, {
    fields: [discountUsage.pricingRuleId],
    references: [pricingRules.id]
  }),
  invoice: one(invoices, {
    fields: [discountUsage.invoiceId],
    references: [invoices.id]
  }),
  client: one(clients, {
    fields: [discountUsage.clientId],
    references: [clients.id]
  })
}));

export const quantityPriceTiersRelations = relations(quantityPriceTiers, ({ one }) => ({
  pricingRule: one(pricingRules, {
    fields: [quantityPriceTiers.pricingRuleId],
    references: [pricingRules.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id]
  }),
  store: one(stores, {
    fields: [payments.storeId],
    references: [stores.id]
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  })
}));

// Accounting Relations
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  store: one(stores, {
    fields: [chartOfAccounts.storeId],
    references: [stores.id]
  }),
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id]
  }),
  childAccounts: many(chartOfAccounts),
  journalEntryLines: many(journalEntryLines),
  bankAccounts: many(bankAccounts),
  billItems: many(billItems)
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  store: one(stores, {
    fields: [journalEntries.storeId],
    references: [stores.id]
  }),
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id]
  }),
  reversedBy: one(journalEntries, {
    fields: [journalEntries.reversedById],
    references: [journalEntries.id]
  }),
  lines: many(journalEntryLines),
  bankTransactions: many(bankTransactions),
  billPayments: many(billPayments)
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id]
  }),
  account: one(chartOfAccounts, {
    fields: [journalEntryLines.accountId],
    references: [chartOfAccounts.id]
  })
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  store: one(stores, {
    fields: [bankAccounts.storeId],
    references: [stores.id]
  }),
  chartAccount: one(chartOfAccounts, {
    fields: [bankAccounts.chartAccountId],
    references: [chartOfAccounts.id]
  }),
  transactions: many(bankTransactions),
  billPayments: many(billPayments)
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  bankAccount: one(bankAccounts, {
    fields: [bankTransactions.bankAccountId],
    references: [bankAccounts.id]
  }),
  journalEntry: one(journalEntries, {
    fields: [bankTransactions.journalEntryId],
    references: [journalEntries.id]
  })
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  store: one(stores, {
    fields: [suppliers.storeId],
    references: [stores.id]
  }),
  purchaseOrders: many(purchaseOrders),
  bills: many(bills)
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  store: one(stores, {
    fields: [purchaseOrders.storeId],
    references: [stores.id]
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id]
  }),
  user: one(users, {
    fields: [purchaseOrders.userId],
    references: [users.id]
  }),
  items: many(purchaseOrderItems),
  bills: many(bills)
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id]
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id]
  })
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  store: one(stores, {
    fields: [bills.storeId],
    references: [stores.id]
  }),
  supplier: one(suppliers, {
    fields: [bills.supplierId],
    references: [suppliers.id]
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [bills.purchaseOrderId],
    references: [purchaseOrders.id]
  }),
  user: one(users, {
    fields: [bills.userId],
    references: [users.id]
  }),
  items: many(billItems),
  payments: many(billPayments)
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id]
  }),
  product: one(products, {
    fields: [billItems.productId],
    references: [products.id]
  }),
  account: one(chartOfAccounts, {
    fields: [billItems.accountId],
    references: [chartOfAccounts.id]
  })
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, {
    fields: [billPayments.billId],
    references: [bills.id]
  }),
  bankAccount: one(bankAccounts, {
    fields: [billPayments.bankAccountId],
    references: [bankAccounts.id]
  }),
  journalEntry: one(journalEntries, {
    fields: [billPayments.journalEntryId],
    references: [journalEntries.id]
  }),
  user: one(users, {
    fields: [billPayments.userId],
    references: [users.id]
  })
}));

// Export all tables as schema
export const tenantSchema = {
  stores,
  users,
  memberships,
  categories,
  products,
  inventory,
  inventoryMovements,
  clients,
  clientContacts,
  invoices,
  invoiceItems,
  payments,
  quotes,
  quoteItems,
  tags,
  pricingRules,
  ruleConditions,
  ruleTargets,
  discountUsage,
  quantityPriceTiers,
  taxRates,
  // Accounting tables
  chartOfAccounts,
  journalEntries,
  journalEntryLines,
  bankAccounts,
  bankTransactions,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  bills,
  billItems,
  billPayments,
  // Relations
  storesRelations,
  usersRelations,
  membershipsRelations,
  clientsRelations,
  clientContactsRelations,
  categoriesRelations,
  productsRelations,
  inventoryRelations,
  inventoryMovementsRelations,
  invoicesRelations,
  invoiceItemsRelations,
  paymentsRelations,
  quotesRelations,
  quoteItemsRelations,
  pricingRulesRelations,
  ruleConditionsRelations,
  ruleTargetsRelations,
  discountUsageRelations,
  quantityPriceTiersRelations,
  // Accounting relations
  chartOfAccountsRelations,
  journalEntriesRelations,
  journalEntryLinesRelations,
  bankAccountsRelations,
  bankTransactionsRelations,
  suppliersRelations,
  purchaseOrdersRelations,
  purchaseOrderItemsRelations,
  billsRelations,
  billItemsRelations,
  billPaymentsRelations
};
