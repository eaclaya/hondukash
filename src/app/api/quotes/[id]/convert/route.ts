import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { QuoteService } from '@/lib/services/quoteService';

// POST /api/quotes/[id]/convert - Convert a quote to an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');
    const storeIdHeader = requestHeaders.get('X-Store-ID');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    const { id } = await params;
    const quoteId = parseInt(id);

    if (isNaN(quoteId)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    const storeId = storeIdHeader ? parseInt(storeIdHeader) : undefined;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const conversionData = {
      quoteId,
      invoiceDate: body.invoiceDate,
      dueDate: body.dueDate
    };

    const result = await QuoteService.convertQuoteToInvoice(domain, conversionData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/quotes/[id]/convert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}