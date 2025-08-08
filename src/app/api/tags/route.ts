import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SimpleTagService } from '@/lib/services/simpleTagService';

// GET /api/tags - List tags
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    const result = await SimpleTagService.getAllTags(domain, storeId, {
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
    console.error('GET /api/tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tags - Create tag
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
    const tagData = body;

    // Validate required fields
    if (!tagData.name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const result = await SimpleTagService.createTag(domain, tagData, storeId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}