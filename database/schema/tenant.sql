-- =========================================
-- HonduKash ERP - Tenant Schema (SQLite/Turso)
-- =========================================
-- This schema will be created for each tenant in their own Turso database

-- =========================================
-- STORES TABLE
-- =========================================
CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    location TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Honduras',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    manager_name TEXT,

    -- Settings
    currency TEXT DEFAULT 'HNL',
    tax_rate REAL DEFAULT 0.15, -- 15% default tax rate
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 1,

    -- Metadata
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- USERS TABLE (Store-level users)
-- =========================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),

    -- Store access (JSON array of store IDs)
    store_access TEXT NOT NULL DEFAULT '[]',

    -- Profile
    phone TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Tegucigalpa',

    -- Permissions
    permissions TEXT NOT NULL DEFAULT '{}',

    -- Metadata
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- CATEGORIES TABLE
-- =========================================
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- PRODUCTS TABLE
-- =========================================
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

    -- Pricing and Costing
    base_cost REAL DEFAULT 0,              -- Original purchase/manufacturing cost
    cost REAL DEFAULT 0,                   -- Current replacement cost (for inventory valuation)
    base_price REAL DEFAULT 0,             -- Suggested retail price (before discounts)
    price REAL NOT NULL,                   -- Current selling price (what customer pays)
    min_price REAL DEFAULT 0,              -- Minimum selling price allowed

    -- Inventory
    track_inventory INTEGER NOT NULL DEFAULT 1 CHECK (track_inventory IN (0, 1)),
    unit TEXT DEFAULT 'unit',

    -- Tax configuration
    is_taxable INTEGER NOT NULL DEFAULT 1 CHECK (is_taxable IN (0, 1)),
    tax_configuration_id INTEGER REFERENCES tax_configurations(id),
    tax_rate REAL, -- Kept for backward compatibility, but use tax_configuration_id

    -- Images and files
    image_url TEXT,
    images TEXT DEFAULT '[]',

    -- Metadata
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- INVENTORY TABLE
-- =========================================
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Stock levels
    quantity REAL NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0,

    -- Location
    location TEXT, -- Aisle, bin, etc.

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),

    UNIQUE(product_id, store_id)
);

-- =========================================
-- CLIENTS TABLE
-- =========================================
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    client_type TEXT NOT NULL DEFAULT 'individual' CHECK (client_type IN ('individual', 'company')),

    -- Primary contact (for individuals, this is the person; for companies, this is main contact)
    primary_contact_name TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,

    -- Company-specific information
    company_registration_number TEXT, -- For companies
    tax_id TEXT, -- RTN in Honduras
    industry TEXT,
    website TEXT,

    -- Address
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Honduras',
    postal_code TEXT,

    -- Business settings
    credit_limit REAL DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    discount_percentage REAL DEFAULT 0, -- Default discount for this client

    -- Metadata
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- CLIENT CONTACTS TABLE
-- =========================================
CREATE TABLE client_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Contact details
    contact_name TEXT NOT NULL,
    job_title TEXT,
    department TEXT,

    -- Contact information
    email TEXT,
    phone TEXT,
    mobile TEXT,
    extension TEXT,

    -- Contact type and permissions
    contact_type TEXT NOT NULL DEFAULT 'employee' CHECK (contact_type IN (
        'primary',      -- Primary contact (main person)
        'employee',     -- Company employee
        'manager',      -- Department manager
        'executive',    -- C-level executive
        'procurement',  -- Procurement/purchasing agent
        'accounting',   -- Accounting/finance contact
        'other'         -- Other type of contact
    )),

    -- Purchase permissions
    can_make_purchases INTEGER DEFAULT 1 CHECK (can_make_purchases IN (0, 1)),
    purchase_limit REAL, -- Maximum amount this contact can authorize
    requires_approval INTEGER DEFAULT 0 CHECK (requires_approval IN (0, 1)), -- Does this contact need approval for purchases?

    -- Contact preferences
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Tegucigalpa',

    -- Status
    is_primary INTEGER DEFAULT 0 CHECK (is_primary IN (0, 1)), -- Is this the primary contact?
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

    -- Metadata
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- INVOICES TABLE
-- =========================================
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_contact_id INTEGER REFERENCES client_contacts(id) ON DELETE SET NULL, -- Who made this purchase
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date TEXT NOT NULL DEFAULT (date('now')),
    due_date TEXT,

    -- Contact info at time of invoice (for historical record)
    contact_name TEXT, -- Name of person who made purchase
    contact_email TEXT,
    contact_phone TEXT,

    -- Amounts
    subtotal REAL NOT NULL DEFAULT 0,
    tax_amount REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),

    -- Payment
    paid_amount REAL NOT NULL DEFAULT 0,
    balance_due REAL GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- Additional info
    notes TEXT,
    terms TEXT,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- INVOICE ITEMS TABLE
-- =========================================
CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,

    -- Item details
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,

    -- Calculated fields
    line_total REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Tax
    tax_rate REAL DEFAULT 0,
    tax_amount REAL GENERATED ALWAYS AS (line_total * tax_rate) STORED,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- INVENTORY MOVEMENTS TABLE
-- =========================================
CREATE TABLE inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Movement details
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity REAL NOT NULL,
    unit_cost REAL,

    -- References
    reference_type TEXT, -- 'invoice', 'purchase', 'adjustment', 'transfer'
    reference_id INTEGER,

    -- Transfer specific (when movement_type = 'transfer')
    from_store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    to_store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- TRANSFERS TABLE
-- =========================================
CREATE TABLE transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    to_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Transfer details
    transfer_number TEXT NOT NULL UNIQUE,
    transfer_date TEXT NOT NULL DEFAULT (date('now')),
    expected_date TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- TRANSFER ITEMS TABLE
-- =========================================
CREATE TABLE transfer_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Quantities
    requested_quantity REAL NOT NULL,
    sent_quantity REAL DEFAULT 0,
    received_quantity REAL DEFAULT 0,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- PAYMENTS TABLE
-- =========================================
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Payment details
    payment_date TEXT NOT NULL DEFAULT (date('now')),
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    reference_number TEXT,

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- TAGGING SYSTEM
-- =========================================
-- Flexible tagging system for entities (clients, products, etc.)

CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Tag details
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Hex color for UI display

    -- Tag category/type for organization
    category TEXT DEFAULT 'general' CHECK (category IN (
        'general',      -- General purpose tags
        'client',       -- Client-specific tags (wholesale, vip, etc.)
        'product',      -- Product-specific tags (featured, clearance, etc.)
        'discount',     -- Discount-related tags
        'marketing',    -- Marketing campaigns
        'custom'        -- Custom business logic
    )),

    -- Tag settings
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),

    UNIQUE(name)
);

-- Entity Tags (Polymorphic Relationship)
CREATE TABLE taggable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    -- Polymorphic relationship
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'client',           -- clients table
        'product',          -- products table
        'invoice',          -- invoices table
        'category',         -- categories table
        'user',            -- users table
        'supplier',        -- suppliers table (if implemented)
        'expense'          -- expenses table
    )),
    entity_id INTEGER NOT NULL,

    -- Assignment details
    assigned_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),

    UNIQUE(tag_id, entity_type, entity_id)
);

-- =========================================
-- DISCOUNT & PRICING RULES SYSTEM
-- =========================================

CREATE TABLE pricing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Rule identification
    name TEXT NOT NULL,
    description TEXT,
    rule_code TEXT,

    -- Rule type and priority
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'percentage_discount',    -- 10% off
        'fixed_amount_discount',  -- L 50 off
        'fixed_price',           -- Set price to L 100
        'buy_x_get_y',           -- Buy 2 get 1 free
        'quantity_discount'      -- Bulk pricing tiers
    )),
    priority INTEGER NOT NULL DEFAULT 0, -- Higher number = higher priority

    -- Discount values
    discount_percentage REAL DEFAULT 0,     -- 15.50 = 15.5%
    discount_amount REAL DEFAULT 0,        -- Fixed amount off
    fixed_price REAL DEFAULT 0,            -- Set specific price

    -- Buy X Get Y settings
    buy_quantity INTEGER DEFAULT 0,                 -- Buy X items
    get_quantity INTEGER DEFAULT 0,                 -- Get Y items free/discounted
    get_discount_percentage REAL DEFAULT 0, -- Discount on Y items

    -- Rule status and dates
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    start_date TEXT,
    end_date TEXT,

    -- Usage limits
    usage_limit INTEGER, -- Total times rule can be used
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_customer INTEGER, -- Per customer limit

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),

    UNIQUE(store_id, rule_code)
);

-- Rule Conditions
CREATE TABLE rule_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Condition details
    condition_type TEXT NOT NULL CHECK (condition_type IN (
        'cart_subtotal',           -- Total cart amount
        'cart_quantity',           -- Total items in cart
        'product_quantity',        -- Quantity of specific product
        'client_has_tag',          -- Client has specific tag
        'client_has_any_tags',     -- Client has any of specified tags
        'client_has_all_tags',     -- Client has all specified tags
        'product_has_tag',         -- Product has specific tag
        'product_has_any_tags',    -- Product has any of specified tags
        'product_category',        -- Product in category
        'product_sku',            -- Specific product SKU
        'day_of_week',            -- Monday, Tuesday, etc.
        'time_of_day',            -- Between certain hours
        'customer_total_purchases', -- Customer lifetime value
        'invoice_has_tag'          -- Invoice has specific tag
    )),

    -- Condition operators
    operator TEXT NOT NULL CHECK (operator IN (
        'equals', 'not_equals', 'greater_than', 'greater_equal',
        'less_than', 'less_equal', 'in', 'not_in', 'between'
    )),

    -- Condition values
    value_text TEXT,        -- For text comparisons
    value_number REAL,     -- For numeric comparisons
    value_array TEXT,      -- For IN/NOT IN operations (tag slugs, etc.) - JSON array
    value_start REAL,      -- For BETWEEN operations
    value_end REAL,        -- For BETWEEN operations

    -- Logical operators
    logical_operator TEXT DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    condition_group INTEGER DEFAULT 1, -- Group conditions together

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Rule Targets
CREATE TABLE rule_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Target type
    target_type TEXT NOT NULL CHECK (target_type IN (
        'all_products',           -- Apply to entire cart
        'specific_products',      -- Specific product IDs
        'products_with_tag',      -- Products that have specific tag
        'products_with_any_tags', -- Products with any of specified tags
        'product_category',       -- Products in category
        'cheapest_item',          -- Cheapest item in cart
        'most_expensive_item'     -- Most expensive item
    )),

    -- Target identifiers
    target_ids TEXT,              -- JSON array of product IDs, category IDs, etc.
    target_tags TEXT,             -- JSON array of tag slugs for tag-based targeting

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Discount Usage Tracking
CREATE TABLE discount_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    -- Usage details
    discount_amount REAL NOT NULL,
    original_amount REAL NOT NULL,
    final_amount REAL NOT NULL,

    -- Applied items
    applied_items TEXT, -- JSON details of which items got the discount

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Quantity Price Tiers
CREATE TABLE quantity_price_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Tier definition
    min_quantity REAL NOT NULL,
    max_quantity REAL, -- NULL = no upper limit

    -- Pricing
    tier_price REAL,           -- Fixed price per unit
    tier_discount_percentage REAL, -- Percentage discount
    tier_discount_amount REAL,    -- Fixed amount discount per unit

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- TAX CONFIGURATIONS
-- =========================================
CREATE TABLE tax_configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Tax details
    tax_name TEXT NOT NULL,
    tax_code TEXT NOT NULL,
    tax_rate REAL NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('sales', 'purchase', 'both')),

    -- Settings
    is_default INTEGER DEFAULT 0 CHECK (is_default IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),

    -- Metadata
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),

    UNIQUE(store_id, tax_code)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Core Tables
CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_inventory_product_store ON inventory(product_id, store_id);
CREATE INDEX idx_clients_store_id ON clients(store_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_tax_id ON clients(tax_id);
CREATE INDEX idx_clients_type ON clients(client_type);

-- Client Contacts
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_email ON client_contacts(email);
CREATE INDEX idx_client_contacts_type ON client_contacts(contact_type);
CREATE INDEX idx_client_contacts_active ON client_contacts(is_active);

-- Invoices
CREATE INDEX idx_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_client_contact_id ON invoices(client_contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- Tagging System
CREATE INDEX idx_tags_store_active ON tags(store_id, is_active);
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_taggable_tag ON taggable(tag_id);
CREATE INDEX idx_taggable_entity ON taggable(entity_type, entity_id);
CREATE INDEX idx_taggable_assigned ON taggable(assigned_at);

-- Discount System
CREATE INDEX idx_pricing_rules_store_active ON pricing_rules(store_id, is_active);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_rule_conditions_rule ON rule_conditions(pricing_rule_id);
CREATE INDEX idx_rule_conditions_type ON rule_conditions(condition_type);
CREATE INDEX idx_rule_targets_rule ON rule_targets(pricing_rule_id);
CREATE INDEX idx_rule_targets_type ON rule_targets(target_type);
CREATE INDEX idx_discount_usage_rule ON discount_usage(pricing_rule_id);
CREATE INDEX idx_discount_usage_invoice ON discount_usage(invoice_id);
CREATE INDEX idx_discount_usage_client ON discount_usage(client_id);
CREATE INDEX idx_quantity_price_tiers_rule ON quantity_price_tiers(pricing_rule_id);

-- Inventory and Movement tracking
CREATE INDEX idx_inventory_movements_product_store ON inventory_movements(product_id, store_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Transfers
CREATE INDEX idx_transfers_from_store ON transfers(from_store_id);
CREATE INDEX idx_transfers_to_store ON transfers(to_store_id);
CREATE INDEX idx_transfers_status ON transfers(status);

-- Payments
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);


-- =========================================
-- SEED DATA FOR NEW TENANT
-- =========================================

-- Insert default store
INSERT INTO stores (name, code, description, location)
VALUES ('Main Store', 'MAIN', 'Primary store location', 'Main Location');

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('General', 'General products', 1),
('Electronics', 'Electronic devices and accessories', 2),
('Clothing', 'Apparel and accessories', 3),
('Food & Beverage', 'Food and drink items', 4),
('Home & Garden', 'Home improvement and garden supplies', 5);

-- Default Tax Configuration (Honduras)
INSERT INTO tax_configurations (store_id, tax_name, tax_code, tax_rate, tax_type, is_default)
SELECT id, 'ISV (Impuesto Sobre Ventas)', 'ISV', 0.15, 'sales', 1
FROM stores WHERE code = 'MAIN';

-- Default Tags
INSERT INTO tags (store_id, name, category, description, color)
SELECT id, 'Wholesaler', 'client', 'Wholesale customers eligible for bulk discounts', '#10B981'
FROM stores WHERE code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT id, 'VIP', 'client', 'VIP customers with premium benefits', '#F59E0B'
FROM stores WHERE code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT id, 'Retail', 'client', 'Regular retail customers', '#6B7280'
FROM stores WHERE code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT id, 'Featured', 'product', 'Featured products for promotions', '#EF4444'
FROM stores WHERE code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT id, 'Clearance', 'product', 'Products on clearance sale', '#F97316'
FROM stores WHERE code = 'MAIN';

-- Sample pricing rules
INSERT INTO pricing_rules (
    store_id, name, description, rule_type, priority, discount_percentage, is_active
)
SELECT
    id,
    'Wholesale Client Discount',
    '15% discount for clients tagged as wholesaler',
    'percentage_discount',
    100,
    15.00,
    1
FROM stores
WHERE code = 'MAIN';

-- Add condition: client must have 'wholesaler' tag
INSERT INTO rule_conditions (
    pricing_rule_id, condition_type, operator, value_text, logical_operator, condition_group
)
SELECT
    pr.id,
    'client_has_tag',
    'equals',
    'wholesaler',
    'AND',
    1
FROM pricing_rules pr
WHERE pr.name = 'Wholesale Client Discount';

-- Add target: all products
INSERT INTO rule_targets (
    pricing_rule_id, target_type
)
SELECT
    pr.id,
    'all_products'
FROM pricing_rules pr
WHERE pr.name = 'Wholesale Client Discount';