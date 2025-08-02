import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import { tenants } from '@/lib/db/schema/landlord';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactName, contactEmail, phone, address, city, country } = body;

    // Get domain from request headers or subdomain
    const host = request.headers.get('host') || '';
    const domain = host.split('.')[0];

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 400 });
    }

    // Get current tenant to update meta
    const currentTenant = await db.query.tenants.findFirst({
      where: eq(tenants.domain, domain)
    });

    if (!currentTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Parse existing meta and update with new values
    const existingMeta = currentTenant.meta ? JSON.parse(currentTenant.meta) : {};
    const updatedMeta = {
      ...existingMeta,
      contact_name: contactName,
      contact_email: contactEmail,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || 'Honduras'
    };

    // Update tenant in database
    await db
      .update(tenants)
      .set({
        name,
        meta: JSON.stringify(updatedMeta)
      })
      .where(eq(tenants.id, currentTenant.id));

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      tenant: {
        ...currentTenant,
        name,
        meta: JSON.stringify(updatedMeta)
      }
    });

  } catch (error) {
    console.error('Error updating tenant profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}