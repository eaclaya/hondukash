# HonduKash ERP Database Schema

This directory contains the database schema files for the HonduKash multi-tenant ERP system.

## Schema Overview

### Public Schema (Admin Database)
The public schema contains system-wide tables that manage tenants, admin users, and global settings.

**Key Tables:**
- `tenants` - Tenant organizations and their configuration
- `admin_users` - System administrators
- `tenant_admin_users` - Tenant administrators
- `subscription_plans` - Available pricing plans
- `system_settings` - Global system configuration
- `audit_logs` - System-wide audit trail

### Tenant Schemas
Each tenant gets their own isolated schema with the naming pattern `tenant_{subdomain}`. This ensures complete data isolation between tenants.

**Key Tables per Tenant:**
- `stores` - Physical/virtual store locations
- `users` - Tenant users with store-level access
- `products` - Product catalog
- `inventory` - Store-specific inventory levels
- `clients` - Customer/client management
- `invoices` & `invoice_items` - Invoicing system
- `transfers` & `transfer_items` - Inter-store transfers
- `payments` - Payment tracking
- `inventory_movements` - Inventory transaction log

## Setup Instructions

### 1. Initialize Public Schema

Run the public schema SQL to set up the admin database:

```sql
-- Connect to your PostgreSQL database as superuser
\i database/schema/public_schema.sql
```

This will create:
- All public schema tables
- Default admin user (admin@hondukash.test / password)
- Default subscription plans
- System settings
- Helper functions and triggers

### 2. Create Tenant Schemas

When creating a new tenant through the admin interface, the system will:

1. Create a new record in the `tenants` table
2. Generate a unique schema name (`tenant_{subdomain}`)
3. Create the tenant schema using the template
4. Set up the default store and categories
5. Create the tenant admin user

### 3. Environment Variables

Ensure these environment variables are set:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_DOMAIN=hondukash.test
```

## Security Features

### Row Level Security (RLS)
- Enabled on all sensitive tables
- Policies ensure users can only access their tenant's data
- Store-level access control within tenants

### Data Isolation
- Complete schema separation between tenants
- No cross-tenant data access possible
- Each tenant operates in isolation

### Audit Logging
- All significant actions are logged
- Includes user ID, action, and data changes
- Helps with compliance and debugging

## Database Functions

### `create_tenant()`
Helper function to create a new tenant with all necessary setup:

```sql
SELECT create_tenant(
    'Company Name',
    'subdomain',
    'admin@company.com',
    'password123',
    'Admin Name',
    'professional',
    '+504 1234-5678',
    'Address',
    'City',
    'Honduras'
);
```

### Schema Management
- Automatic schema name generation
- Trigger-based timestamp updates
- Referential integrity enforcement

## Backup and Maintenance

### Regular Backups
```bash
# Backup public schema
pg_dump -n public your_database > public_backup.sql

# Backup specific tenant schema
pg_dump -n tenant_company your_database > tenant_company_backup.sql

# Backup all tenant schemas
pg_dump -n 'tenant_*' your_database > all_tenants_backup.sql
```

### Monitoring
- Track tenant growth with dashboard queries
- Monitor schema sizes and performance
- Set up alerts for disk usage

## Performance Considerations

### Indexing
- All foreign keys are indexed
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., active records)

### Partitioning
Consider partitioning large tables like:
- `audit_logs` by date
- `inventory_movements` by date
- `invoices` by date range

### Connection Pooling
Use connection pooling to manage database connections efficiently across multiple tenants.

## Migration Strategy

### Schema Updates
When updating the tenant schema template:

1. Update `tenant_schema.sql`
2. Create migration scripts for existing tenants
3. Apply migrations to all tenant schemas
4. Test thoroughly in staging environment

### Data Migration
For major structural changes:

1. Export tenant data
2. Apply schema changes
3. Import data with transformations
4. Validate data integrity

## Troubleshooting

### Common Issues

**Schema Creation Fails:**
- Check PostgreSQL permissions
- Verify service role key has sufficient privileges
- Ensure schema name doesn't already exist

**RLS Policies Block Access:**
- Verify user authentication
- Check policy conditions
- Ensure proper role assignments

**Performance Issues:**
- Review query execution plans
- Check index usage
- Monitor connection pool status

### Logs and Monitoring

Monitor these key metrics:
- Schema creation time
- Query performance per tenant
- Storage usage per schema
- Connection count per tenant

## Development vs Production

### Development
- Use sample data for testing
- Relaxed security policies for debugging
- Additional logging enabled

### Production
- Strict security policies
- Regular automated backups
- Performance monitoring
- Audit log retention policies