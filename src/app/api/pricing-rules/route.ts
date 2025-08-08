import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PricingRuleService } from '@/lib/services/pricingRuleService';

// GET /api/pricing-rules - List pricing rules
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');
    const storeIdHeader = requestHeaders.get('X-Store-ID');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    // Use X-Store-ID header first, then fall back to query params
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get('storeId');
    const storeId = storeIdHeader ? parseInt(storeIdHeader) : storeIdParam ? parseInt(storeIdParam) : undefined;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Get pagination and search parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await PricingRuleService.getAllPricingRules(domain, storeId, {
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/pricing-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pricing-rules - Create pricing rule
export async function POST(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');
    const storeIdHeader = requestHeaders.get('X-Store-ID');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const storeId = storeIdHeader ? parseInt(storeIdHeader) : undefined;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const ruleData = body;

    // Validate required fields
    if (!ruleData.name || !ruleData.ruleType) {
      return NextResponse.json({ error: 'Name and rule type are required' }, { status: 400 });
    }

    const result = await PricingRuleService.createPricingRule(domain, ruleData, storeId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/pricing-rules error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}