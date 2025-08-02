import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { QuoteService } from '@/lib/services/quoteService';

// GET /api/quotes - Get all quotes with pagination and search
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

    // Get pagination and search parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await QuoteService.getAllQuotes(domain, storeId, {
      page,
      limit,
      search
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('GET /api/quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/quotes - Create a new quote
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
    const quoteData = { ...body, storeId };

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

    const result = await QuoteService.createQuote(domain, quoteData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ quote: result.data }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}