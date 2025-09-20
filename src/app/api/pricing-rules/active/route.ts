import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getTenantDb } from '@/lib/turso';
import { pricingRules } from '@/lib/db/schema/tenant';
import { eq, and } from 'drizzle-orm';

// GET /api/pricing-rules/active - Get active pricing rules for invoice/quote calculations
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

    const db = await getTenantDb(domain);
    const currentDate = new Date().toISOString();

    // Get all active pricing rules with their conditions and targets
    // Filter by: active, store_id, and date range (if specified)
    const activeRules = await db.query.pricingRules.findMany({
      where: and(
        eq(pricingRules.storeId, storeId),
        eq(pricingRules.isActive, true)
      ),
      with: {
        conditions: true,
        targets: true,
        quantityTiers: {
          orderBy: (quantityTiers, { asc }) => [asc(quantityTiers.minQuantity)]
        }
      },
      orderBy: (pricingRules, { desc, asc }) => [
        desc(pricingRules.priority), // Higher priority first
        asc(pricingRules.name)
      ]
    });

    // Filter rules by date range if they have start/end dates
    const validRules = activeRules.filter(rule => {
      // Check start date
      if (rule.startDate && rule.startDate > currentDate) {
        return false;
      }
      
      // Check end date
      if (rule.endDate && rule.endDate < currentDate) {
        return false;
      }
      
      return true;
    });

    return NextResponse.json({
      data: validRules,
      total: validRules.length
    });

  } catch (error: unknown) {
    console.error('GET /api/pricing-rules/active error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}