import { NextRequest, NextResponse } from 'next/server'
import { Tenant } from '@/lib/types'

// This would normally be imported from a shared location or database
// For now, we'll use the same mock data pattern
let mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Avoca Corp',
    subdomain: 'avoca',
    schema: 'tenant_avoca',
    email: 'admin@avoca.com',
    status: 'active',
    plan: 'professional',
    contactName: 'John Avoca',
    phone: '+504 1234-5678',
    address: '123 Main St',
    city: 'Tegucigalpa',
    country: 'Honduras',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    isActive: true
  },
  {
    id: '2',
    name: 'MPV Solutions',
    subdomain: 'mpv',
    schema: 'tenant_mpv',
    email: 'admin@mpv.com',
    status: 'active',
    plan: 'basic',
    contactName: 'Maria Valdez',
    phone: '+504 8765-4321',
    address: '456 Business Ave',
    city: 'San Pedro Sula',
    country: 'Honduras',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    isActive: true
  }
]

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const tenant = mockTenants.find(t => t.id === id)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const tenantIndex = mockTenants.findIndex(t => t.id === id)
    if (tenantIndex === -1) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Update tenant
    const updatedTenant = {
      ...mockTenants[tenantIndex],
      ...data,
      updatedAt: new Date().toISOString()
    }

    mockTenants[tenantIndex] = updatedTenant

    return NextResponse.json(updatedTenant)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin-session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const tenantIndex = mockTenants.findIndex(t => t.id === id)

    if (tenantIndex === -1) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // In a real application, you would:
    // 1. Backup tenant data
    // 2. Cancel billing subscriptions
    // 3. Send notification emails
    // 4. Archive data according to data retention policies
    // 5. Remove tenant schema from database

    mockTenants.splice(tenantIndex, 1)

    return NextResponse.json({ message: 'Tenant deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}