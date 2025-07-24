import { NextRequest, NextResponse } from 'next/server'
import { TenantProvisioningService, TenantProvisioningRequest } from '@/lib/services/tenantProvisioningService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['tenantName', 'subdomain', 'adminEmail', 'adminPassword', 'adminName', 'contactName', 'country', 'plan']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Create provisioning request
    const provisioningRequest: TenantProvisioningRequest = {
      tenantName: body.tenantName,
      subdomain: body.subdomain.toLowerCase().trim(),
      adminEmail: body.adminEmail.toLowerCase().trim(),
      adminPassword: body.adminPassword,
      adminName: body.adminName,
      contactName: body.contactName,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country,
      plan: body.plan
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$/
    if (!subdomainRegex.test(provisioningRequest.subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Provision the tenant
    const result = await TenantProvisioningService.provisionTenant(provisioningRequest)

    if (result.success) {
      return NextResponse.json({
        message: 'Tenant provisioned successfully',
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
    console.error('Tenant provisioning error:', error)
    return NextResponse.json(
      { error: 'Internal server error during tenant provisioning' },
      { status: 500 }
    )
  }
}