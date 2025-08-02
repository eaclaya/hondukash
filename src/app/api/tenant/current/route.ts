import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/services/tenantService';

export async function GET(request: NextRequest) {
  try {
    // Get the host header to determine the domain
    const host = request.headers.get('host');

    if (!host) {
      return NextResponse.json({ error: 'No host header found' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    // Skip tenant detection for localhost or main domain
    if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Not a tenant domain' }, { status: 404 });
    }

    try {
      // Try to find tenant by domain
      const tenant = await TenantService.getTenantByDomain(domain);
      const meta = tenant.meta ? JSON.parse(tenant.meta) : null;

      // Return tenant information with database context
      const tenantInfo = {
        id: tenant.id.toString(),
        name: tenant.name,
        domain: tenant.domain,
        database: tenant.database,
        isActive: tenant.isActive,
        meta: meta,
        // Include database connection info for context
        databaseContext: {
          url: meta?.database_url,
          hasConnection: !!(meta?.database_url && meta?.database_auth_token)
        }
      };

      return NextResponse.json(tenantInfo);
    } catch (error) {
      // Tenant not found for this domain
      return NextResponse.json({ error: 'Tenant not found for this domain' }, { status: 404 });
    }
  } catch (error: unknown) {
    console.error('Error in tenant/current:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
