import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { TaxRateService } from '@/lib/services/taxRateService';

// GET /api/tenant/tax-rates/[id] - Get a single tax rate
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const { id } = await params;
    const taxRateId = parseInt(id);
    if (isNaN(taxRateId)) {
      return NextResponse.json({ error: 'Invalid tax rate ID' }, { status: 400 });
    }

    const result = await TaxRateService.getTaxRateById(domain, taxRateId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Tax rate not found' ? 404 : 400 });
    }

    return NextResponse.json({ taxRate: result.data });
  } catch (error: unknown) {
    console.error('GET /api/tenant/tax-rates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tenant/tax-rates/[id] - Update a tax rate
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const { id } = await params;
    const taxRateId = parseInt(id);
    if (isNaN(taxRateId)) {
      return NextResponse.json({ error: 'Invalid tax rate ID' }, { status: 400 });
    }

    const body = await request.json();
    const taxRateData = { ...body, id: taxRateId };

    const result = await TaxRateService.updateTaxRate(domain, taxRateData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Tax rate not found' ? 404 : 400 });
    }

    return NextResponse.json({ taxRate: result.data });
  } catch (error: unknown) {
    console.error('PUT /api/tenant/tax-rates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tenant/tax-rates/[id] - Delete a tax rate
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const { id } = await params;
    const taxRateId = parseInt(id);
    if (isNaN(taxRateId)) {
      return NextResponse.json({ error: 'Invalid tax rate ID' }, { status: 400 });
    }

    const result = await TaxRateService.deleteTaxRate(domain, taxRateId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/tenant/tax-rates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}