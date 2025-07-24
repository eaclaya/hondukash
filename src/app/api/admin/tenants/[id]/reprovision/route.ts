import { NextRequest, NextResponse } from 'next/server'
import { TenantProvisioningService } from '@/lib/services/tenantProvisioningService'

export async function POST(
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

    const result = await TenantProvisioningService.reprovisionTenant(tenantId)

    if (result.success) {
      return NextResponse.json({
        message: 'Tenant reprovisioned successfully',
        tenantId: result.tenantId,
        schemaName: result.schemaName,
        details: result.details
      })
    } else {
      return NextResponse.json(
        { 
          error: result.error,
          details: result.details
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Tenant reprovisioning error:', error)
    return NextResponse.json(
      { error: 'Internal server error during tenant reprovisioning' },
      { status: 500 }
    )
  }
}