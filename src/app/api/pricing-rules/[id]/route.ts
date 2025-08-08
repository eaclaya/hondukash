import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PricingRuleService } from '@/lib/services/pricingRuleService';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/pricing-rules/[id] - Get specific pricing rule
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const ruleId = parseInt(params.id);

    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    const result = await PricingRuleService.getPricingRuleById(domain, ruleId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Pricing rule not found' ? 404 : 400 });
    }

    return NextResponse.json(result.data);

  } catch (error: unknown) {
    console.error('GET /api/pricing-rules/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/pricing-rules/[id] - Update pricing rule
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const ruleId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    // Validate required fields
    if (!body.name || !body.ruleType) {
      return NextResponse.json({ error: 'Name and rule type are required' }, { status: 400 });
    }

    // Add the ID to the rule data for the service
    const ruleData = { ...body, id: ruleId };

    const result = await PricingRuleService.updatePricingRule(domain, ruleData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Pricing rule not found' ? 404 : 400 });
    }

    return NextResponse.json(result.data);

  } catch (error: unknown) {
    console.error('PUT /api/pricing-rules/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pricing-rules/[id] - Delete pricing rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const ruleId = parseInt(params.id);

    if (isNaN(ruleId)) {
      return NextResponse.json({ error: 'Invalid rule ID' }, { status: 400 });
    }

    const result = await PricingRuleService.deletePricingRule(domain, ruleId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Pricing rule not found' ? 404 : 400 });
    }

    return NextResponse.json({ success: true, message: 'Pricing rule deleted successfully' });

  } catch (error: unknown) {
    console.error('DELETE /api/pricing-rules/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}