import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ProductService } from '@/lib/services/productService';

// GET /api/products - Get all products with inventory
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
    console.log('domain', domain);
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

    const result = await ProductService.getAllProducts(domain, storeId, {
      page,
      limit,
      search
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
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
    const productData = body;

    // Validate required fields
    if (!productData.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (!productData.price) {
      return NextResponse.json({ error: 'Product price is required' }, { status: 400 });
    }

    const result = await ProductService.createProduct(domain, productData, storeId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ product: result.data }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}