import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { QuoteService } from '@/lib/services/quoteService';

// GET /api/quotes/[id] - Get a specific quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

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

    const result = await QuoteService.getQuoteById(domain, quoteId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Quote not found' ? 404 : 400 });
    }

    return NextResponse.json({ quote: result.data });
  } catch (error: unknown) {
    console.error('GET /api/quotes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/quotes/[id] - Update a specific quote
export async function PUT(
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
    const quoteData = { ...body, id: quoteId, storeId };

    // Validate required fields
    if (!quoteData.clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (!quoteData.items || quoteData.items.length === 0) {
      return NextResponse.json({ error: 'Quote items are required' }, { status: 400 });
    }

    if (!quoteData.quoteDate) {
      return NextResponse.json({ error: 'Quote date is required' }, { status: 400 });
    }

    const result = await QuoteService.updateQuote(domain, quoteData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ quote: result.data });
  } catch (error: unknown) {
    console.error('PUT /api/quotes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/quotes/[id] - Delete a specific quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

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

    const result = await QuoteService.deleteQuote(domain, quoteId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Quote deleted successfully' });
  } catch (error: unknown) {
    console.error('DELETE /api/quotes/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}