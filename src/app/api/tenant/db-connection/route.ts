import { NextRequest, NextResponse } from 'next/server'
import { TenantService } from '@/lib/services/tenantService'

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    try {
      // Get tenant by domain to verify it exists and is active
      const tenant = await TenantService.getTenantByDomain(domain)
      
      if (!tenant.isActive) {
        return NextResponse.json({ error: 'Tenant is not active' }, { status: 403 })
      }

      // Get database connection for this tenant
      const tenantDb = await TenantService.connectToTenantDatabaseByDomain(domain)
      
      // Return connection status and basic info (not the actual connection)
      return NextResponse.json({
        success: true,
        tenantId: tenant.id,
        database: tenant.database,
        domain: tenant.domain,
        connectionAvailable: true
      })
    } catch (error: unknown) {
      console.error('Database connection error:', error)
      return NextResponse.json({ 
        error: 'Failed to establish database connection',
        details: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, { status: 500 })
    }
  } catch (error: unknown) {
    console.error('Error in tenant/db-connection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}