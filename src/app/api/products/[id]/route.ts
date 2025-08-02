import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ProductService } from '@/lib/services/productService';

// GET /api/products/[id] - Get a single product with inventory
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const result = await ProductService.getProductById(domain, productId, storeId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Product not found' ? 404 : 400 });
    }

    return NextResponse.json({ product: result.data });
  } catch (error: unknown) {
    console.error('GET /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const productData = { ...body, id: productId };

    const result = await ProductService.updateProduct(domain, productData, storeId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Product not found' ? 404 : 400 });
    }

    return NextResponse.json({ product: result.data });
  } catch (error: unknown) {
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const result = await ProductService.deleteProduct(domain, productId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Product not found' ? 404 : 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/products/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}