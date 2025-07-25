import { NextRequest, NextResponse } from 'next/server'
import { TenantProvisioningService } from '@/lib/services/tenantProvisioningService'

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

    const status = await TenantProvisioningService.getTenantStatus(tenantId)

    return NextResponse.json({
      tenant: status.tenant,
      provisioning: {
        schemaExists: status.schemaExists,
        storeExists: status.storeExists,
        userExists: status.userExists,
        isFullyProvisioned: status.schemaExists && status.storeExists && status.userExists
      }
    })

  } catch (error: any) {
    console.error('Error getting tenant status:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant status' },
      { status: 500 }
    )
  }
}