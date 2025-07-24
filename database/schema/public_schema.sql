-- =========================================
-- HonduKash ERP - Public Schema (Admin Database)
-- =========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ADMIN USERS TABLE
-- =========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TENANTS TABLE
-- =========================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    schema_name VARCHAR(63) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    plan VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),

    -- Contact Information
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'Honduras',

    -- Billing Information
    billing_email VARCHAR(255),
    tax_id VARCHAR(50),

    -- Subscription Details
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_starts_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,

    -- Settings
    max_users INTEGER DEFAULT 5,
    max_stores INTEGER DEFAULT 1,
    storage_limit_gb INTEGER DEFAULT 1,

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$'),
    CONSTRAINT schema_name_format CHECK (schema_name ~ '^tenant_[a-z0-9_]+$')
);

-- =========================================
-- TENANT ADMIN USERS TABLE
-- =========================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant_admin' CHECK (role IN ('tenant_admin', 'tenant_user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Ensure unique email per tenant
    UNIQUE(tenant_id, email)
);

-- =========================================
-- SUBSCRIPTION PLANS TABLE
-- =========================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Limits
    max_users INTEGER NOT NULL DEFAULT 5,
    max_stores INTEGER NOT NULL DEFAULT 1,
    storage_limit_gb INTEGER NOT NULL DEFAULT 1,

    -- Features (JSON field for flexibility)
    features JSONB NOT NULL DEFAULT '{}',

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- TENANT INVITATIONS TABLE
-- =========================================
CREATE TABLE tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'tenant_user',
    invited_by UUID REFERENCES tenant_users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, email)
);

-- =========================================
-- SYSTEM SETTINGS TABLE
-- =========================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =========================================
-- AUDIT LOG TABLE
-- =========================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID, -- Can reference users or tenant_users
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'tenant_admin', 'tenant_user')),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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

-- Insert default admin user (password: 'password' - change in production!)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@hondukash.test', crypt('password', gen_salt('bf')), 'System Administrator', 'super_admin');

-- Insert system settings
INSERT INTO system_settings (key, value, description, data_type, is_public) VALUES
('app_name', 'HonduKash ERP', 'Application name', 'string', true),
('app_version', '1.0.0', 'Application version', 'string', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'boolean', false),
('max_tenants', '1000', 'Maximum number of tenants allowed', 'number', false),
('default_plan', 'basic', 'Default subscription plan for new tenants', 'string', false);

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Function to create a new tenant with all necessary setup
CREATE OR REPLACE FUNCTION create_tenant(
    p_name VARCHAR(255),
    p_subdomain VARCHAR(63),
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_contact_name VARCHAR(255),
    p_plan VARCHAR(20) DEFAULT 'basic',
    p_phone VARCHAR(50) DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL,
    p_country VARCHAR(100) DEFAULT 'Honduras'
)
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_admin_user_id UUID;
    v_schema_name VARCHAR(63);
BEGIN
    -- Create tenant record
    INSERT INTO tenants (
        name, subdomain, email, contact_name, plan,
        phone, address, city, country
    ) VALUES (
        p_name, p_subdomain, p_email, p_contact_name, p_plan,
        p_phone, p_address, p_city, p_country
    ) RETURNING id, schema_name INTO v_tenant_id, v_schema_name;

    -- Create tenant admin user
    INSERT INTO tenant_users (
        tenant_id, email, password_hash, name, role
    ) VALUES (
        v_tenant_id, p_email, crypt(p_password, gen_salt('bf')), p_contact_name, 'tenant_admin'
    ) RETURNING id INTO v_admin_user_id;

    -- TODO: Create tenant schema and tables (would be done in application code)
    -- EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);

    -- Log the creation
    INSERT INTO audit_logs (
        tenant_id, user_id, user_type, action, resource_type, resource_id, new_values
    ) VALUES (
        v_tenant_id, v_admin_user_id, 'admin', 'CREATE', 'tenant', v_tenant_id::TEXT,
        jsonb_build_object('name', p_name, 'subdomain', p_subdomain, 'plan', p_plan)
    );

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;