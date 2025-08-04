-- =========================================
-- HonduKash ERP - Landlord Schema (SQLite/Turso)
-- =========================================
-- This is the main landlord database that manages tenants

-- =========================================
-- ADMIN USERS TABLE
-- =========================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- TENANTS TABLE
-- =========================================
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    database TEXT NOT NULL UNIQUE,
    meta TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Tenant admin users are now stored in each tenant's own database
-- This table is kept for reference but not used

-- =========================================
-- SUBSCRIPTION PLANS TABLE
-- =========================================
CREATE TABLE subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly REAL NOT NULL,
    price_yearly REAL,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Limits
    max_users INTEGER NOT NULL DEFAULT 5,
    max_stores INTEGER NOT NULL DEFAULT 1,
    storage_limit_gb INTEGER NOT NULL DEFAULT 1,

    -- Features (JSON field for flexibility)
    features TEXT NOT NULL DEFAULT '{}',

    -- Metadata
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Tenant invitations are now handled in each tenant's own database
-- This table is kept for reference but not used

-- =========================================
-- SYSTEM SETTINGS TABLE
-- =========================================
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- AUDIT LOG TABLE
-- =========================================
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
    user_id INTEGER, -- Can reference users or tenant users
    user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'tenant_admin', 'tenant_user')),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- =========================================
-- INDEXES
-- =========================================

-- Tenants
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Admin Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tenant Admin Users
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);

-- Audit Logs
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Tenant Invitations
CREATE INDEX idx_tenant_invitations_tenant_id ON tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_expires_at ON tenant_invitations(expires_at);

-- =========================================
-- FUNCTIONS AND TRIGGERS
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at
    BEFORE UPDATE ON tenant_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create schema name from subdomain
CREATE OR REPLACE FUNCTION generate_schema_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.schema_name = 'tenant_' || NEW.subdomain;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate schema name
CREATE TRIGGER set_tenant_schema_name
    BEFORE INSERT OR UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION generate_schema_name();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

-- Enable RLS on sensitive tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (these would be customized based on your security requirements)
-- Example: Allow admin users to see all tenants
CREATE POLICY admin_tenants_policy ON tenants
    FOR ALL
    TO authenticated
    USING (true); -- This would be more restrictive in production

-- =========================================
-- SEED DATA
-- =========================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_users, max_stores, storage_limit_gb, features) VALUES
('Basic', 'basic', 'Perfect for small businesses', 29.00, 290.00, 5, 1, 1, '{"invoicing": true, "inventory": true, "reports": "basic"}'),
('Professional', 'professional', 'For growing businesses', 99.00, 990.00, 25, 5, 10, '{"invoicing": true, "inventory": true, "reports": "advanced", "api_access": true, "integrations": true}'),
('Enterprise', 'enterprise', 'For large organizations', 299.00, 2990.00, 100, 20, 100, '{"invoicing": true, "inventory": true, "reports": "premium", "api_access": true, "integrations": true, "white_label": true, "priority_support": true}');


-- Insert system settings
INSERT INTO system_settings (key, value, description, data_type, is_public) VALUES
('app_name', 'HonduKash ERP', 'Application name', 'string', 1),
('app_version', '1.0.0', 'Application version', 'string', 1),
('maintenance_mode', 'false', 'Enable maintenance mode', 'boolean', 0),
('max_tenants', '1000', 'Maximum number of tenants allowed', 'number', 0),
('default_plan', 'basic', 'Default subscription plan for new tenants', 'string', 0);

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Tenant creation is now handled in application code using TenantService
-- This creates separate Turso databases for each tenant
