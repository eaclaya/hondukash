import { NextRequest, NextResponse } from 'next/server'
import { TenantService } from '@/lib/services/tenantService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    const status = await TenantService.getTenantStatus(tenantId)

    return NextResponse.json({
      tenant: status.tenant,
      provisioning: {
        schemaExists: status.schemaExists,
        storeExists: status.storeExists,
        userExists: status.userExists,
        isFullyProvisioned: status.schemaExists && status.storeExists && status.userExists
      }
    })

  } catch (error: unknown) {
    console.error('Error getting tenant status:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant status' },
      { status: 500 }
    )
  }
}