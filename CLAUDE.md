# Multi-Tenant ERP SaaS Development Prompt

Build a comprehensive multi-tenant ERP SaaS application with the following specifications:

## Technology Stack
- **Frontend**: Next.js 15 with App Router
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui with Tailwind CSS
- **Multi-tenancy**: Domain-based tenant isolation
- **TypeScript**: Full type safety throughout

## Architecture Overview

### Multi-Tenancy Strategy
- **Domain-based tenancy**: Each tenant gets their own subdomain (e.g., `tenant1.yourapp.com`)
- **Schema-per-tenant isolation**: Each tenant gets their own PostgreSQL schema (e.g., `tenant_abc123`)
- **Store-scoped data**: Within each tenant schema, data is scoped by `store_id`
- **Middleware for tenant resolution**: Detect tenant from subdomain and switch database schema context
- **Admin dashboard**: Accessible only from main domain (`admin.yourapp.com` or `yourapp.com/admin`)

## Page Structure & Components

### Admin Dashboard Pages
Create the following pages under `app/admin/`:

1. **Login Page** (`/admin/login`)
   - Super admin authentication
   - Tenant admin creation flow

2. **Dashboard** (`/admin/dashboard`)
   - Overview of all tenants
   - System statistics
   - Recent activities

3. **Tenants Management** (`/admin/tenants`)
   - List all tenants
   - Create/edit/delete tenants
   - Tenant status management
   - Subdomain assignment

4. **System Settings** (`/admin/settings`)
   - Global system configuration
   - Plan management
   - Feature flags

### Tenant Dashboard Pages
Create the following pages under `app/tenant/`:

1. **Login Page** (`/login`)
   - Tenant-specific authentication
   - Password reset for tenant users
   - Automatic schema detection from subdomain

2. **Dashboard** (`/dashboard`)
   - Tenant overview with store selector
   - Key metrics per selected store
   - Cross-store analytics (for admin users)
   - Recent activities filtered by current store

3. **Stores Management** (`/stores`)
   - Store list (admin only can create/edit)
   - Store switching interface
   - Store-specific settings and configuration
   - Inter-store transfer management

4. **Clients Management** (`/clients`)
   - Client list filtered by current store
   - Create/edit client forms (store-scoped)
   - Client details view with store history
   - Import/export per store

5. **Products Management** (`/products`)
   - Global product catalog (shared across stores)
   - Store-specific inventory levels
   - Inventory management per store
   - Bulk operations and transfers
   - Store-specific pricing (optional)

6. **Invoices Management** (`/invoices`)
   - Invoice list filtered by current store
   - Store-specific invoice numbering
   - Invoice creation wizard with store context
   - PDF generation with store branding
   - Payment tracking per store

7. **Inventory** (`/inventory`)
   - Store-specific stock levels
   - Low stock alerts per store
   - Inventory movements history
   - Inter-store transfer requests
   - Stock adjustments

8. **Transfers** (`/transfers`)
   - Inter-store transfer management
   - Transfer requests and approvals
   - Transfer tracking and history
   - Bulk transfer operations

9. **Reports** (`/reports`)
   - Store-specific reports
   - Cross-store analytics (admin only)
   - Inventory reports per store
   - Sales performance by store

10. **Settings** (`/settings`)
    - User store access management
    - Store-specific configurations
    - User management and invitations
    - Integrations and billing

## Key Features to Implement

### Authentication Flow
- Multi-level authentication (super admin, tenant admin, tenant user)
- Schema-based access control with automatic tenant detection
- Store-level permissions within tenant
- Invitation system for tenant users with store access assignment
- Session management with tenant schema context

### Multi-Store Support
- Store selection context throughout the application
- Store-specific inventory with inter-store transfers
- Store-scoped reporting and analytics
- Store-level user permissions
- Cross-store data visibility for admin users

### Core ERP Functions
- Complete invoice lifecycle with store context
- Automatic inventory updates per store
- Client management scoped by store
- Inter-store inventory transfers
- Store-specific tax calculations and settings
- Multi-currency support per store (optional)

### Schema Management
- Automatic tenant schema creation on signup
- Schema migration system for updates
- Schema backup and restore per tenant
- Schema monitoring and maintenance

### Data Export/Import
- Excel/CSV export for all entities
- Bulk data import
- Data backup/restore per tenant

## UI/UX Requirements

### Design System
- Use shadcn/ui components consistently
- Dark/light theme support
- Mobile-responsive design
- Loading states and error handling

### Key Components to Build
- `TenantProvider` - Context for current tenant schema
- `StoreSelector` - Multi-store selection with permissions
- `SchemaAwareDataTable` - Tables that work with tenant schemas
- `StoreGuard` - Store-level permission component
- `TenantClient` - Supabase client with schema switching
- `InterStoreTransfer` - Transfer management component
- `StoreInventoryView` - Store-specific inventory display
- `FormBuilder` - Dynamic forms with store context
- `InvoicePDF` - PDF generation with store branding
- `FileUpload` - Image/document upload to tenant storage

### State Management
- Context for current tenant and schema
- Context for current store with permissions
- React Query with tenant-aware keys
- Zustand for cross-store state management
- Schema-aware caching strategies

## Implementation Steps

1. **Setup Project Structure**
   - Next.js project with TypeScript
   - Supabase configuration
   - shadcn/ui installation

2. **Database Setup**
   - Create public schema tables
   - Setup tenant schema creation function
   - Create initial tenant schemas
   - Setup RLS policies per schema

3. **Authentication System**
   - Implement multi-tenant auth
   - Create middleware for tenant resolution
   - Setup role-based access

4. **Core Components**
   - Build reusable UI components
   - Create data fetching hooks
   - Implement form validation

5. **Admin Dashboard**
   - Tenant management interface
   - System monitoring
   - User administration

6. **Tenant Dashboard**
   - All core ERP modules
   - Multi-store functionality
   - Data import/export

7. **Testing & Optimization**
   - Unit tests for utilities
   - Integration tests for auth
   - Performance optimization

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_DOMAIN=yourapp.com
```

## Additional Considerations

- **Security**: Implement proper input validation, SQL injection protection via Supabase RLS
- **Performance**: Use database indexes, implement caching strategy
- **Scalability**: Design for horizontal scaling, consider database partitioning
- **Monitoring**: Implement logging and error tracking
- **Backup**: Automated database backups per tenant
- **Compliance**: GDPR compliance for EU tenants

Build this as a production-ready application with proper error handling, validation, and security measures throughout.
