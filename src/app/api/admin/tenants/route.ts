import { NextRequest, NextResponse } from 'next/server';
import { CreateTenantRequest } from '@/lib/types';
import { TenantService } from '@/lib/services/tenantService';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin-session');
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    const allTenants = await TenantService.getAllTenants(searchTerm);
    return NextResponse.json(allTenants);
  } catch (error) {
    console.error('Error in GET /api/admin/tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin-session');
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const createRequest: CreateTenantRequest = {
      name: body.name,
      domain: body.domain,
      email: body.email,
      password: body.password,
      plan: body.plan || 'basic',
      contactName: body.contactName,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country || 'Honduras',
      fee: body.fee,
      due_date: body.due_date
    };

    // Validate required fields
    if (!createRequest.name || !createRequest.domain || !createRequest.email || !createRequest.contactName || !createRequest.plan) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, email, contactName, plan' },
        { status: 400 }
      );
    }

    const result = await TenantService.createTenant(createRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Tenant created successfully',
      tenant: result.tenant,
      database: result.database
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/tenants:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
