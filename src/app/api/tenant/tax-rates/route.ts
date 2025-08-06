import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { TaxRateService } from '@/lib/services/taxRateService';

// GET /api/tenant/tax-rates - Get all tax rates
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const result = await TaxRateService.getAllTaxRates(domain);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/tenant/tax-rates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tenant/tax-rates - Create a new tax rate
export async function POST(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Tax rate name is required' }, { status: 400 });
    }

    if (!body.code) {
      return NextResponse.json({ error: 'Tax rate code is required' }, { status: 400 });
    }

    if (body.rate === undefined || body.rate === null) {
      return NextResponse.json({ error: 'Tax rate is required' }, { status: 400 });
    }

    if (!body.type) {
      return NextResponse.json({ error: 'Tax rate type is required' }, { status: 400 });
    }

    const result = await TaxRateService.createTaxRate(domain, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ taxRate: result.data }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/tenant/tax-rates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}