-- =========================================
-- HonduKash ERP - Tenant Schema (PostgreSQL/Neon)
-- =========================================
-- This schema will be created for each tenant in their own Neon database

-- =========================================
-- STORES TABLE
-- =========================================
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
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
    tax_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% default tax rate
    invoice_prefix TEXT DEFAULT 'F',
    invoice_counter INTEGER DEFAULT 1,
    quote_prefix TEXT DEFAULT 'C',
    quote_counter INTEGER DEFAULT 1,

    -- Invoice Sequence Feature (JSON field)
    invoice_sequence TEXT, -- JSON: {hash, sequence_start, sequence_end, limit_date, enabled}

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- USERS TABLE (Store-level users)
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,

    -- Profile
    phone TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Tegucigalpa',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- MEMBERSHIPS TABLE
-- =========================================
CREATE TABLE memberships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    role TEXT NOT NULL DEFAULT 'user',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- CATEGORIES TABLE
-- =========================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- =========================================
-- TAX RATES
-- =========================================
CREATE TABLE tax_rates (
    id SERIAL PRIMARY KEY,

    -- Tax details
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sales', 'purchase', 'both')),

    -- Settings
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- =========================================
-- PRODUCTS TABLE
-- =========================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,

    -- Pricing and Costing
    base_cost DECIMAL(10,2) DEFAULT 0,              -- Original purchase/manufacturing cost
    cost DECIMAL(10,2) DEFAULT 0,                   -- Current replacement cost (for inventory valuation)
    base_price DECIMAL(10,2) DEFAULT 0,             -- Suggested retail price (before discounts)
    price DECIMAL(10,2) NOT NULL,                   -- Current selling price (what customer pays)
    min_price DECIMAL(10,2) DEFAULT 0,              -- Minimum selling price allowed

    -- Inventory
    track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    unit TEXT DEFAULT 'unit',

    -- Tax configuration
    is_taxable BOOLEAN NOT NULL DEFAULT TRUE,
    tax_rate_id INTEGER REFERENCES tax_rates(id),
    tax_rate DECIMAL(5,4), -- Kept for backward compatibility, but use tax_rate_id

    -- Images and files
    image_url TEXT,
    images TEXT DEFAULT '[]',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVENTORY TABLE
-- =========================================
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

    -- Stock levels
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Location
    location TEXT, -- Aisle, bin, etc.

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(product_id, store_id)
);

-- =========================================
-- CLIENTS TABLE
-- =========================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
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
    industry TEXT,
    website TEXT,

    -- Address
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Honduras',
    postal_code TEXT,

    -- Business settings
    credit_limit DECIMAL(10,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days

    -- Metadata
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- CLIENT CONTACTS TABLE
-- =========================================
CREATE TABLE client_contacts (
    id SERIAL PRIMARY KEY,
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
    can_make_purchases BOOLEAN DEFAULT TRUE,
    purchase_limit DECIMAL(10,2), -- Maximum amount this contact can authorize
    requires_approval BOOLEAN DEFAULT FALSE, -- Does this contact need approval for purchases?

    -- Contact preferences
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Tegucigalpa',

    -- Status
    is_primary BOOLEAN DEFAULT FALSE, -- Is this the primary contact?
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVOICES TABLE
-- =========================================
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Invoice details
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    -- Contact info at time of invoice (for historical record)
    client_name TEXT, -- Name of client who made purchase

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),

    -- Payment
    paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

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
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    -- Calculated fields
    line_total DECIMAL(10,2) NOT NULL,

    -- Tax
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- QUOTES TABLE
-- =========================================
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Quote details
    quote_number TEXT NOT NULL UNIQUE,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- Contact info at time of quote (for historical record)
    client_name TEXT, -- Name of client who requested quote

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')),

    -- Conversion tracking
    converted_to_invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,

    -- Additional info
    notes TEXT,
    terms TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- QUOTE ITEMS TABLE
-- =========================================
CREATE TABLE quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    -- Calculated fields
    line_total DECIMAL(10,2) NOT NULL,

    -- Tax
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INVENTORY MOVEMENTS TABLE
-- =========================================
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Movement details
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity DECIMAL(10,2) NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL,
    new_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(10,2),
    notes TEXT,

    -- References
    reference_type TEXT, -- 'invoice', 'purchase', 'adjustment', 'transfer'
    reference_id INTEGER,
    reference_number TEXT,

    -- Transfer specific (when movement_type = 'transfer')
    from_store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    to_store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TRANSFERS TABLE
-- =========================================
CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    from_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    to_store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Transfer details
    transfer_number TEXT NOT NULL UNIQUE,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),

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
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Quantities
    requested_quantity DECIMAL(10,2) NOT NULL,
    sent_quantity DECIMAL(10,2) DEFAULT 0,
    received_quantity DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- PAYMENTS TABLE
-- =========================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Payment details
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    reference_number TEXT,

    -- Additional info
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TAGGING SYSTEM
-- =========================================
-- Flexible tagging system for entities (clients, products, etc.)

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
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
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(name)
);

-- =========================================
-- DISCOUNT & PRICING RULES SYSTEM
-- =========================================

CREATE TABLE pricing_rules (
    id SERIAL PRIMARY KEY,
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
    discount_percentage DECIMAL(5,2) DEFAULT 0,     -- 15.50 = 15.5%
    discount_amount DECIMAL(10,2) DEFAULT 0,        -- Fixed amount off
    fixed_price DECIMAL(10,2) DEFAULT 0,            -- Set specific price

    -- Buy X Get Y settings
    buy_quantity INTEGER DEFAULT 0,                 -- Buy X items
    get_quantity INTEGER DEFAULT 0,                 -- Get Y items free/discounted
    get_discount_percentage DECIMAL(5,2) DEFAULT 0, -- Discount on Y items

    -- Rule status and dates
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE,
    end_date DATE,

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
    id SERIAL PRIMARY KEY,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Condition details
    condition_type TEXT NOT NULL CHECK (condition_type IN (
        'cart_subtotal',           -- Total cart amount
        'cart_quantity',           -- Total items in cart
        'product_quantity',        -- Quantity of specific product
        'client_has_tag',          -- Client has specific tag
        'client_has_any_tags',     -- Client has any of specified tags
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
    value_number DECIMAL(10,2),     -- For numeric comparisons
    value_array TEXT,      -- For IN/NOT IN operations (tag slugs, etc.) - JSON array
    value_start DECIMAL(10,2),      -- For BETWEEN operations
    value_end DECIMAL(10,2),        -- For BETWEEN operations

    -- Logical operators
    logical_operator TEXT DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    condition_group INTEGER DEFAULT 1, -- Group conditions together

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Rule Targets
CREATE TABLE rule_targets (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Discount Usage Tracking
CREATE TABLE discount_usage (
    id SERIAL PRIMARY KEY,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,

    -- Usage details
    discount_amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,

    -- Applied items
    applied_items TEXT, -- JSON details of which items got the discount

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Quantity Price Tiers
CREATE TABLE quantity_price_tiers (
    id SERIAL PRIMARY KEY,
    pricing_rule_id INTEGER NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,

    -- Tier definition
    min_quantity DECIMAL(10,2) NOT NULL,
    max_quantity DECIMAL(10,2), -- NULL = no upper limit

    -- Pricing
    tier_price DECIMAL(10,2),           -- Fixed price per unit
    tier_discount_percentage DECIMAL(5,2), -- Percentage discount
    tier_discount_amount DECIMAL(10,2),    -- Fixed amount discount per unit

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Core Tables
CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_memberships_role ON memberships(role);
CREATE INDEX idx_memberships_user_store ON memberships(user_id, store_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_inventory_product_store ON inventory(product_id, store_id);
CREATE INDEX idx_clients_store_id ON clients(store_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_type ON clients(client_type);

-- Client Contacts
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_contacts_email ON client_contacts(email);
CREATE INDEX idx_client_contacts_type ON client_contacts(contact_type);
CREATE INDEX idx_client_contacts_active ON client_contacts(is_active);

-- Invoices
CREATE INDEX idx_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

-- Quotes
CREATE INDEX idx_quotes_store_id ON quotes(store_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_quote_date ON quotes(quote_date);
CREATE INDEX idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX idx_quotes_converted_invoice ON quotes(converted_to_invoice_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);

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