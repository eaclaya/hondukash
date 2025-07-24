-- =========================================
-- HonduKash ERP - Tenant Schema Template
-- =========================================
-- This schema will be created for each tenant with the naming pattern: tenant_{subdomain}
-- Replace {TENANT_SCHEMA} with the actual schema name when creating

-- =========================================
-- STORES TABLE
-- =========================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    location VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Honduras',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),

    -- Settings
    currency VARCHAR(3) DEFAULT 'HNL',
    tax_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% default tax rate
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 1,

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- USERS TABLE (Store-level users)
-- =========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),

    -- Store access (JSON array of store IDs)
    store_access JSONB NOT NULL DEFAULT '[]',

    -- Profile
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Tegucigalpa',

    -- Permissions
    permissions JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- CATEGORIES TABLE
-- =========================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- PRODUCTS TABLE
-- =========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    -- Pricing and Costing
    base_cost DECIMAL(12,4) DEFAULT 0,              -- Original purchase/manufacturing cost
    cost DECIMAL(12,4) DEFAULT 0,           -- Current replacement cost (for inventory valuation)
    base_price DECIMAL(12,4) DEFAULT 0,             -- Suggested retail price (before discounts)
    price DECIMAL(12,4) NOT NULL,              -- Current selling price (what customer pays)
    min_price DECIMAL(12,4) DEFAULT 0,         -- Minimum selling price allowed


    -- Inventory
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    unit VARCHAR(50) DEFAULT 'unit',

    -- Tax configuration
    is_taxable BOOLEAN NOT NULL DEFAULT true,
    tax_configuration_id UUID REFERENCES tax_configurations(id),
    tax_rate DECIMAL(5,4), -- Kept for backward compatibility, but use tax_configuration_id

    -- Images and files
    image_url VARCHAR(500),
    images JSONB DEFAULT '[]',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVENTORY TABLE
-- =========================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Stock levels
    quantity DECIMAL(12,4) NOT NULL DEFAULT 0,
    price DECIMAL(12,4) NOT NULL DEFAULT 0,

    -- Location
    location VARCHAR(100), -- Aisle, bin, etc.

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, store_id)
);

-- =========================================
-- CLIENTS TABLE
-- =========================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Basic info
    name VARCHAR(255) NOT NULL,
    client_type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (client_type IN ('individual', 'company')),

    -- Primary contact (for individuals, this is the person; for companies, this is main contact)
    primary_contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- Company-specific information
    company_registration_number VARCHAR(50), -- For companies
    tax_id VARCHAR(50), -- RTN in Honduras
    industry VARCHAR(100),
    website VARCHAR(255),

    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Honduras',
    postal_code VARCHAR(20),

    -- Business settings
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    discount_percentage DECIMAL(5,2) DEFAULT 0, -- Default discount for this client

    -- Metadata
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- CLIENT CONTACTS TABLE
-- =========================================
CREATE TABLE client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

    -- Contact details
    contact_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    extension VARCHAR(10),

    -- Contact type and permissions
    contact_type VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (contact_type IN (
        'primary',      -- Primary contact (main person)
        'employee',     -- Company employee
        'manager',      -- Department manager
        'executive',    -- C-level executive
        'procurement',  -- Procurement/purchasing agent
        'accounting',   -- Accounting/finance contact
        'other'         -- Other type of contact
    )),

    -- Purchase permissions
    can_make_purchases BOOLEAN DEFAULT true,
    purchase_limit DECIMAL(12,2), -- Maximum amount this contact can authorize
    requires_approval BOOLEAN DEFAULT false, -- Does this contact need approval for purchases?

    -- Contact preferences
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Tegucigalpa',

    -- Status
    is_primary BOOLEAN DEFAULT false, -- Is this the primary contact?
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure only one primary contact per client
    CONSTRAINT unique_primary_contact EXCLUDE (client_id WITH =) WHERE (is_primary = true)
);

-- =========================================
-- INVOICES TABLE
-- =========================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    client_contact_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL, -- Who made this purchase
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Contact info at time of invoice (for historical record)
    contact_name VARCHAR(255), -- Name of person who made purchase
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),

    -- Payment
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- Additional info
    notes TEXT,
    terms TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVOICE ITEMS TABLE
-- =========================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,

    -- Item details
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit_price DECIMAL(12,4) NOT NULL,

    -- Calculated fields
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Tax
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (line_total * tax_rate) STORED,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVENTORY MOVEMENTS TABLE
-- =========================================
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Movement details
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(12,4),

    -- References
    reference_type VARCHAR(50), -- 'invoice', 'purchase', 'adjustment', 'transfer'
    reference_id UUID,

    -- Transfer specific (when movement_type = 'transfer')
    from_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    to_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TRANSFERS TABLE
-- =========================================
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    to_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Transfer details
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TRANSFER ITEMS TABLE
-- =========================================
CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Quantities
    requested_quantity DECIMAL(12,4) NOT NULL,
    sent_quantity DECIMAL(12,4) DEFAULT 0,
    received_quantity DECIMAL(12,4) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- PAYMENTS TABLE
-- =========================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Payment details
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(100),

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INDEXES
-- =========================================

-- Stores
CREATE INDEX idx_{TENANT_SCHEMA}_stores_is_active ON stores(is_active);

-- Users
CREATE INDEX idx_{TENANT_SCHEMA}_users_email ON users(email);
CREATE INDEX idx_{TENANT_SCHEMA}_users_role ON users(role);

-- Products
CREATE INDEX idx_{TENANT_SCHEMA}_products_sku ON products(sku);
CREATE INDEX idx_{TENANT_SCHEMA}_products_category_id ON products(category_id);
CREATE INDEX idx_{TENANT_SCHEMA}_products_is_active ON products(is_active);

-- Inventory
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_product_store ON inventory(product_id, store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_low_stock ON inventory(store_id) WHERE quantity_available <= min_stock;

-- Clients
CREATE INDEX idx_{TENANT_SCHEMA}_clients_store_id ON clients(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_clients_email ON clients(email);

-- Invoices
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_status ON invoices(status);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_due_date ON invoices(due_date);

-- Invoice Items
CREATE INDEX idx_{TENANT_SCHEMA}_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoice_items_product_id ON invoice_items(product_id);

-- Inventory Movements
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_movements_product_store ON inventory_movements(product_id, store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Transfers
CREATE INDEX idx_{TENANT_SCHEMA}_transfers_from_store ON transfers(from_store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_transfers_to_store ON transfers(to_store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_transfers_status ON transfers(status);

-- Payments
CREATE INDEX idx_{TENANT_SCHEMA}_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_{TENANT_SCHEMA}_payments_payment_date ON payments(payment_date);

-- =========================================
-- TRIGGERS
-- =========================================

-- Update timestamp triggers
CREATE TRIGGER update_{TENANT_SCHEMA}_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SEED DATA FOR NEW TENANT
-- =========================================

-- Insert default store
INSERT INTO stores (name, code, description, location)
VALUES ('Main Store', 'MAIN', 'Primary store location', 'Main Location');

-- Insert default admin user (will be set during tenant creation)
-- INSERT INTO users (email, password, name, role, store_access)
-- VALUES ('admin@tenant.com', 'hash', 'Admin User', 'admin', '["store-id"]');

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('General', 'General products', 1),
('Electronics', 'Electronic devices and accessories', 2),
('Clothing', 'Apparel and accessories', 3),
('Food & Beverage', 'Food and drink items', 4),
('Home & Garden', 'Home improvement and garden supplies', 5);

-- =========================================
-- TAGGING SYSTEM
-- =========================================
-- Flexible tagging system for entities (clients, products, etc.)

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Tag details
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly version (auto-generated from name)
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI display

    -- Tag category/type for organization
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN (
        'general',      -- General purpose tags
        'client',       -- Client-specific tags (wholesale, vip, etc.)
        'product',      -- Product-specific tags (featured, clearance, etc.)
        'discount',     -- Discount-related tags
        'marketing',    -- Marketing campaigns
        'custom'        -- Custom business logic
    )),

    -- Tag settings
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, slug)
);

-- Entity Tags (Polymorphic Relationship)
CREATE TABLE taggable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

    -- Polymorphic relationship
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'client',           -- clients table
        'product',          -- products table
        'invoice',          -- invoices table
        'category',         -- categories table
        'user',            -- users table
        'supplier',        -- suppliers table (if implemented)
        'expense'          -- expenses table
    )),
    entity_id UUID NOT NULL,

    -- Assignment details
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(tag_id, entity_type, entity_id)
);

-- =========================================
-- DISCOUNT & PRICING RULES SYSTEM
-- =========================================

CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Rule identification
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_code VARCHAR(50),

    -- Rule type and priority
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'percentage_discount',    -- 10% off
        'fixed_amount_discount',  -- L 50 off
        'fixed_price',           -- Set price to L 100
        'buy_x_get_y',           -- Buy 2 get 1 free
        'quantity_discount'      -- Bulk pricing tiers
    )),
    priority INTEGER NOT NULL DEFAULT 0, -- Higher number = higher priority

    -- Discount values
    discount_percentage DECIMAL(5,2) DEFAULT 0,     -- 15.50 = 15.5%
    discount_amount DECIMAL(12,4) DEFAULT 0,        -- Fixed amount off
    fixed_price DECIMAL(12,4) DEFAULT 0,            -- Set specific price

    -- Buy X Get Y settings
    buy_quantity INTEGER DEFAULT 0,                 -- Buy X items
    get_quantity INTEGER DEFAULT 0,                 -- Get Y items free/discounted
    get_discount_percentage DECIMAL(5,2) DEFAULT 0, -- Discount on Y items

    -- Rule status and dates
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,

    -- Usage limits
    usage_limit INTEGER, -- Total times rule can be used
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_customer INTEGER, -- Per customer limit

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, rule_code)
);

-- Rule Conditions
CREATE TABLE rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Condition details
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN (
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
    operator VARCHAR(20) NOT NULL CHECK (operator IN (
        'equals', 'not_equals', 'greater_than', 'greater_equal',
        'less_than', 'less_equal', 'in', 'not_in', 'between'
    )),

    -- Condition values
    value_text VARCHAR(255),        -- For text comparisons
    value_number DECIMAL(15,4),     -- For numeric comparisons
    value_array JSONB,              -- For IN/NOT IN operations (tag slugs, etc.)
    value_start DECIMAL(15,4),      -- For BETWEEN operations
    value_end DECIMAL(15,4),        -- For BETWEEN operations

    -- Logical operators
    logical_operator VARCHAR(10) DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    condition_group INTEGER DEFAULT 1, -- Group conditions together

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Rule Targets
CREATE TABLE rule_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Target type
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
        'all_products',           -- Apply to entire cart
        'specific_products',      -- Specific product IDs
        'products_with_tag',      -- Products that have specific tag
        'products_with_any_tags', -- Products with any of specified tags
        'product_category',       -- Products in category
        'cheapest_item',          -- Cheapest item in cart
        'most_expensive_item'     -- Most expensive item
    )),

    -- Target identifiers
    target_ids JSONB,              -- Array of product IDs, category IDs, etc.
    target_tags JSONB,             -- Array of tag slugs for tag-based targeting

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Discount Usage Tracking
CREATE TABLE discount_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Usage details
    discount_amount DECIMAL(12,4) NOT NULL,
    original_amount DECIMAL(12,4) NOT NULL,
    final_amount DECIMAL(12,4) NOT NULL,

    -- Applied items
    applied_items JSONB, -- Details of which items got the discount

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Quantity Price Tiers
CREATE TABLE quantity_price_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Tier definition
    min_quantity DECIMAL(12,4) NOT NULL,
    max_quantity DECIMAL(12,4), -- NULL = no upper limit

    -- Pricing
    tier_price DECIMAL(12,4),           -- Fixed price per unit
    tier_discount_percentage DECIMAL(5,2), -- Percentage discount
    tier_discount_amount DECIMAL(12,4),    -- Fixed amount discount per unit

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure no overlapping tiers for same rule
    CONSTRAINT no_overlapping_tiers EXCLUDE USING gist (
        pricing_rule_id WITH =,
        numrange(min_quantity::numeric, COALESCE(max_quantity::numeric, 'infinity'::numeric), '[]') WITH &&
    )
);

-- =========================================
-- ACCOUNTING MODULE
-- =========================================

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Account details
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
        'asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_goods_sold'
    )),
    account_subtype VARCHAR(50),

    -- Account classification
    current_account BOOLEAN DEFAULT false, -- For assets/liabilities
    parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,

    -- Settings
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system_account BOOLEAN NOT NULL DEFAULT false, -- Cannot be deleted
    requires_tax_tracking BOOLEAN DEFAULT false,

    -- Balance tracking
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
    current_balance DECIMAL(15,4) DEFAULT 0,

    -- Description and notes
    description TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, account_code)
);

-- Fiscal Periods
CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Period details
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),

    -- Closing information
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure no overlapping periods
    CONSTRAINT no_overlapping_periods EXCLUDE USING gist (
        store_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
);

-- Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    period_id UUID REFERENCES fiscal_periods(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Entry details
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (entry_type IN (
        'manual', 'automatic', 'closing', 'adjusting', 'reversing'
    )),

    -- Source information
    source_type VARCHAR(50), -- 'invoice', 'payment', 'purchase', 'adjustment'
    source_id UUID, -- Reference to source document

    -- Entry description
    description TEXT NOT NULL,
    reference VARCHAR(100),

    -- Totals (for validation)
    total_debit DECIMAL(15,4) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,4) NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    posted_at TIMESTAMP WITH TIME ZONE,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, entry_number),
    CONSTRAINT balanced_entry CHECK (total_debit = total_credit OR status = 'draft')
);

-- Journal Entry Lines
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,

    -- Line details
    line_number INTEGER NOT NULL,
    description VARCHAR(500),

    -- Amounts
    debit_amount DECIMAL(15,4) DEFAULT 0,
    credit_amount DECIMAL(15,4) DEFAULT 0,

    -- Tax information
    tax_code VARCHAR(20),
    tax_amount DECIMAL(15,4) DEFAULT 0,

    -- References
    reference_type VARCHAR(50), -- 'client', 'supplier', 'employee'
    reference_id UUID, -- ID of the referenced entity

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Basic information
    supplier_code VARCHAR(50) UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),

    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),

    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Honduras',
    postal_code VARCHAR(20),

    -- Business information
    tax_id VARCHAR(50),
    registration_number VARCHAR(50),

    -- Financial settings
    payment_terms INTEGER DEFAULT 30, -- days
    credit_limit DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'HNL',

    -- Default accounts
    accounts_payable_account_id UUID REFERENCES chart_of_accounts(id),
    expense_account_id UUID REFERENCES chart_of_accounts(id),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- PO details
    po_number VARCHAR(50) NOT NULL UNIQUE,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,

    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'
    )),

    -- Additional information
    notes TEXT,
    terms TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,

    -- Item details
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(12,4) NOT NULL,

    -- Received quantities
    quantity_received DECIMAL(12,4) DEFAULT 0,
    quantity_pending DECIMAL(12,4) GENERATED ALWAYS AS (quantity - quantity_received) STORED,

    -- Calculated amounts
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    -- Tax
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (line_total * tax_rate) STORED,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Expense details
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Category and account
    expense_category VARCHAR(100),
    expense_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,

    -- Amount information
    amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,

    -- Payment information
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_reference VARCHAR(100),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),

    -- Additional information
    description TEXT NOT NULL,
    receipt_number VARCHAR(100),
    notes TEXT,

    -- File attachments
    attachments JSONB DEFAULT '[]',

    -- Approval workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tax Configurations
CREATE TABLE tax_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Tax details
    tax_name VARCHAR(100) NOT NULL,
    tax_code VARCHAR(20) NOT NULL,
    tax_rate DECIMAL(7,4) NOT NULL,
    tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('sales', 'purchase', 'both')),

    -- Accounts
    tax_collected_account_id UUID REFERENCES chart_of_accounts(id),
    tax_paid_account_id UUID REFERENCES chart_of_accounts(id),

    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(store_id, tax_code)
);

-- Bank Accounts
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Account details
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(255) NOT NULL,
    bank_branch VARCHAR(255),

    -- Account type and currency
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit_card', 'loan')),
    currency VARCHAR(3) DEFAULT 'HNL',

    -- Balance tracking
    opening_balance DECIMAL(15,4) DEFAULT 0,
    current_balance DECIMAL(15,4) DEFAULT 0,

    -- Linked chart of accounts
    chart_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),

    -- Settings
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Bank Transactions
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,

    -- Transaction details
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee')),

    -- Amount and balance
    amount DECIMAL(15,4) NOT NULL,
    running_balance DECIMAL(15,4),

    -- Description and reference
    description TEXT NOT NULL,
    reference_number VARCHAR(100),

    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMP WITH TIME ZONE,

    -- Journal entry link
    journal_entry_id UUID REFERENCES journal_entries(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Core Tables
CREATE INDEX idx_{TENANT_SCHEMA}_stores_is_active ON stores(is_active);
CREATE INDEX idx_{TENANT_SCHEMA}_users_email ON users(email);
CREATE INDEX idx_{TENANT_SCHEMA}_users_role ON users(role);
CREATE INDEX idx_{TENANT_SCHEMA}_products_sku ON products(sku);
CREATE INDEX idx_{TENANT_SCHEMA}_products_category_id ON products(category_id);
CREATE INDEX idx_{TENANT_SCHEMA}_products_is_active ON products(is_active);
CREATE INDEX idx_{TENANT_SCHEMA}_inventory_product_store ON inventory(product_id, store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_clients_store_id ON clients(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_clients_email ON clients(email);
CREATE INDEX idx_{TENANT_SCHEMA}_clients_tax_id ON clients(tax_id);
CREATE INDEX idx_{TENANT_SCHEMA}_clients_type ON clients(client_type);

-- Client Contacts
CREATE INDEX idx_{TENANT_SCHEMA}_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_{TENANT_SCHEMA}_client_contacts_email ON client_contacts(email);
CREATE INDEX idx_{TENANT_SCHEMA}_client_contacts_type ON client_contacts(contact_type);
CREATE INDEX idx_{TENANT_SCHEMA}_client_contacts_primary ON client_contacts(client_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_{TENANT_SCHEMA}_client_contacts_active ON client_contacts(is_active);

CREATE INDEX idx_{TENANT_SCHEMA}_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_client_contact_id ON invoices(client_contact_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_status ON invoices(status);
CREATE INDEX idx_{TENANT_SCHEMA}_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_{TENANT_SCHEMA}_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_{TENANT_SCHEMA}_invoice_items_product_id ON invoice_items(product_id);

-- Tagging System
CREATE INDEX idx_{TENANT_SCHEMA}_tags_store_active ON tags(store_id, is_active);
CREATE INDEX idx_{TENANT_SCHEMA}_tags_category ON tags(category);
CREATE INDEX idx_{TENANT_SCHEMA}_tags_slug ON tags(slug);
CREATE INDEX idx_{TENANT_SCHEMA}_taggable_tag ON taggable(tag_id);
CREATE INDEX idx_{TENANT_SCHEMA}_taggable_entity ON taggable(entity_type, entity_id);
CREATE INDEX idx_{TENANT_SCHEMA}_taggable_assigned ON taggable(assigned_at);
CREATE INDEX idx_{TENANT_SCHEMA}_taggable_client_lookup ON taggable(entity_type, entity_id)
    WHERE entity_type = 'client';
CREATE INDEX idx_{TENANT_SCHEMA}_taggable_product_lookup ON taggable(entity_type, entity_id)
    WHERE entity_type = 'product';

-- Discount System
CREATE INDEX idx_{TENANT_SCHEMA}_pricing_rules_store_active ON pricing_rules(store_id, is_active);
CREATE INDEX idx_{TENANT_SCHEMA}_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX idx_{TENANT_SCHEMA}_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_{TENANT_SCHEMA}_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_{TENANT_SCHEMA}_rule_conditions_rule ON rule_conditions(pricing_rule_id);
CREATE INDEX idx_{TENANT_SCHEMA}_rule_conditions_type ON rule_conditions(condition_type);
CREATE INDEX idx_{TENANT_SCHEMA}_rule_targets_rule ON rule_targets(pricing_rule_id);
CREATE INDEX idx_{TENANT_SCHEMA}_rule_targets_type ON rule_targets(target_type);
CREATE INDEX idx_{TENANT_SCHEMA}_rule_targets_tags ON rule_targets USING GIN (target_tags);
CREATE INDEX idx_{TENANT_SCHEMA}_discount_usage_rule ON discount_usage(pricing_rule_id);
CREATE INDEX idx_{TENANT_SCHEMA}_discount_usage_invoice ON discount_usage(invoice_id);
CREATE INDEX idx_{TENANT_SCHEMA}_discount_usage_client ON discount_usage(client_id);
CREATE INDEX idx_{TENANT_SCHEMA}_quantity_price_tiers_rule ON quantity_price_tiers(pricing_rule_id);

-- Accounting Module
CREATE INDEX idx_{TENANT_SCHEMA}_chart_of_accounts_store_type ON chart_of_accounts(store_id, account_type);
CREATE INDEX idx_{TENANT_SCHEMA}_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX idx_{TENANT_SCHEMA}_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX idx_{TENANT_SCHEMA}_fiscal_periods_store_dates ON fiscal_periods(store_id, start_date, end_date);
CREATE INDEX idx_{TENANT_SCHEMA}_fiscal_periods_status ON fiscal_periods(status);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entries_store_date ON journal_entries(store_id, entry_date);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entries_source ON journal_entries(source_type, source_id);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_{TENANT_SCHEMA}_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_{TENANT_SCHEMA}_suppliers_store_id ON suppliers(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_suppliers_code ON suppliers(supplier_code);
CREATE INDEX idx_{TENANT_SCHEMA}_purchases_store_date ON purchases(store_id, po_date);
CREATE INDEX idx_{TENANT_SCHEMA}_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_{TENANT_SCHEMA}_purchases_status ON purchases(status);
CREATE INDEX idx_{TENANT_SCHEMA}_expenses_store_date ON expenses(store_id, expense_date);
CREATE INDEX idx_{TENANT_SCHEMA}_expenses_category ON expenses(expense_category);
CREATE INDEX idx_{TENANT_SCHEMA}_expenses_status ON expenses(status);
CREATE INDEX idx_{TENANT_SCHEMA}_bank_accounts_store ON bank_accounts(store_id);
CREATE INDEX idx_{TENANT_SCHEMA}_bank_accounts_chart ON bank_accounts(chart_account_id);
CREATE INDEX idx_{TENANT_SCHEMA}_bank_transactions_account_date ON bank_transactions(bank_account_id, transaction_date);
CREATE INDEX idx_{TENANT_SCHEMA}_bank_transactions_reconciled ON bank_transactions(is_reconciled);

-- =========================================
-- TRIGGERS
-- =========================================

-- Core Tables
CREATE TRIGGER update_{TENANT_SCHEMA}_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_client_contacts_updated_at
    BEFORE UPDATE ON client_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tagging System
CREATE TRIGGER update_{TENANT_SCHEMA}_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Convert name to lowercase slug (replace spaces with hyphens, remove special chars)
    NEW.slug = LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(TRIM(NEW.name), '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )
    );

    -- Ensure slug uniqueness within store
    WHILE EXISTS (
        SELECT 1 FROM tags
        WHERE store_id = NEW.store_id
          AND slug = NEW.slug
          AND (NEW.id IS NULL OR id != NEW.id)
    ) LOOP
        NEW.slug = NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_{TENANT_SCHEMA}_tag_slug
    BEFORE INSERT OR UPDATE ON tags
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '' OR OLD.name IS DISTINCT FROM NEW.name)
    EXECUTE FUNCTION generate_tag_slug();

-- Discount System
CREATE TRIGGER update_{TENANT_SCHEMA}_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Accounting Module
CREATE TRIGGER update_{TENANT_SCHEMA}_chart_of_accounts_updated_at
    BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_fiscal_periods_updated_at
    BEFORE UPDATE ON fiscal_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_tax_configurations_updated_at
    BEFORE UPDATE ON tax_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_{TENANT_SCHEMA}_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Get all tags for an entity
CREATE OR REPLACE FUNCTION get_taggable(p_entity_type VARCHAR, p_entity_id UUID)
RETURNS TABLE(
    tag_id UUID,
    tag_name VARCHAR,
    tag_slug VARCHAR,
    tag_color VARCHAR,
    tag_category VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.slug,
        t.color,
        t.category
    FROM tags t
    JOIN taggable et ON t.id = et.tag_id
    WHERE et.entity_type = p_entity_type
      AND et.entity_id = p_entity_id
      AND t.is_active = true
    ORDER BY t.sort_order, t.name;
END;
$$ LANGUAGE plpgsql;

-- Check if entity has specific tag
CREATE OR REPLACE FUNCTION entity_has_tag(p_entity_type VARCHAR, p_entity_id UUID, p_tag_slug VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM taggable et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = p_entity_type
          AND et.entity_id = p_entity_id
          AND t.slug = p_tag_slug
          AND t.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Check if client has specific tag
CREATE OR REPLACE FUNCTION client_has_tag(p_client_id UUID, p_tag_slug VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN entity_has_tag('client', p_client_id, p_tag_slug);
END;
$$ LANGUAGE plpgsql;

-- Check if client has any of specified tags
CREATE OR REPLACE FUNCTION client_has_any_tags(p_client_id UUID, p_tag_slugs JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM taggable et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = 'client'
          AND et.entity_id = p_client_id
          AND t.slug = ANY(ARRAY(SELECT jsonb_array_elements_text(p_tag_slugs)))
          AND t.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Check if client has all specified tags
CREATE OR REPLACE FUNCTION client_has_all_tags(p_client_id UUID, p_tag_slugs JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    required_count INTEGER;
    actual_count INTEGER;
BEGIN
    required_count = jsonb_array_length(p_tag_slugs);

    SELECT COUNT(DISTINCT t.id) INTO actual_count
    FROM taggable et
    JOIN tags t ON et.tag_id = t.id
    WHERE et.entity_type = 'client'
      AND et.entity_id = p_client_id
      AND t.slug = ANY(ARRAY(SELECT jsonb_array_elements_text(p_tag_slugs)))
      AND t.is_active = true;

    RETURN actual_count = required_count;
END;
$$ LANGUAGE plpgsql;

-- Get client tag slugs
CREATE OR REPLACE FUNCTION get_client_tag_slugs(p_client_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT t.slug
        FROM taggable et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = 'client'
          AND et.entity_id = p_client_id
          AND t.is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Check if product has specific tag
CREATE OR REPLACE FUNCTION product_has_tag(p_product_id UUID, p_tag_slug VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN entity_has_tag('product', p_product_id, p_tag_slug);
END;
$$ LANGUAGE plpgsql;

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

-- Default Chart of Accounts (Standard for Small Business)
INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '1000', 'Current Assets', 'asset', 'debit', true, 'Current assets header account'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '1010', 'Cash', 'asset', 'debit', true, 'Cash and cash equivalents'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '1020', 'Accounts Receivable', 'asset', 'debit', true, 'Money owed by customers'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '1030', 'Inventory', 'asset', 'debit', true, 'Inventory assets'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '2000', 'Current Liabilities', 'liability', 'credit', true, 'Current liabilities header'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '2010', 'Accounts Payable', 'liability', 'credit', true, 'Money owed to suppliers'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '2020', 'Sales Tax Payable', 'liability', 'credit', true, 'Sales tax collected'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '3000', 'Equity', 'equity', 'credit', true, 'Owner equity'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '4000', 'Revenue', 'revenue', 'credit', true, 'Sales revenue'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '5000', 'Cost of Goods Sold', 'cost_of_goods_sold', 'debit', true, 'Direct costs of goods sold'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, normal_balance, is_system_account, description)
SELECT s.id, '6000', 'Operating Expenses', 'expense', 'debit', true, 'Operating expenses header'
FROM stores s WHERE s.code = 'MAIN';

-- Default Tax Configuration (Honduras)
INSERT INTO tax_configurations (store_id, tax_name, tax_code, tax_rate, tax_type, is_default)
SELECT s.id, 'ISV (Impuesto Sobre Ventas)', 'ISV', 0.15, 'sales', true
FROM stores s WHERE s.code = 'MAIN';

-- Default Accounting Period (Current Year)
INSERT INTO fiscal_periods (store_id, name, type, start_date, end_date)
SELECT s.id,
       EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
       'yearly',
       DATE_TRUNC('year', CURRENT_DATE)::DATE,
       (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::DATE
FROM stores s WHERE s.code = 'MAIN';

-- Default Tags
INSERT INTO tags (store_id, name, category, description, color)
SELECT s.id, 'Wholesaler', 'client', 'Wholesale customers eligible for bulk discounts', '#10B981'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT s.id, 'VIP', 'client', 'VIP customers with premium benefits', '#F59E0B'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT s.id, 'Retail', 'client', 'Regular retail customers', '#6B7280'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT s.id, 'Featured', 'product', 'Featured products for promotions', '#EF4444'
FROM stores s WHERE s.code = 'MAIN';

INSERT INTO tags (store_id, name, category, description, color)
SELECT s.id, 'Clearance', 'product', 'Products on clearance sale', '#F97316'
FROM stores s WHERE s.code = 'MAIN';

-- Sample pricing rules
INSERT INTO pricing_rules (
    store_id, name, description, rule_type, priority, discount_percentage, is_active
)
SELECT
    s.id,
    'Wholesale Client Discount',
    '15% discount for clients tagged as wholesaler',
    'percentage_discount',
    100,
    15.00,
    true
FROM stores s
WHERE s.code = 'MAIN';

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

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE taggable ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your needs)
-- Store-based access control example:
CREATE POLICY store_access_policy ON clients
    FOR ALL
    TO authenticated
    USING (store_id = ANY(
        SELECT jsonb_array_elements_text(store_access)::UUID
        FROM users
        WHERE id = auth.uid()
    ));