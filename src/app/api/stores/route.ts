import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StoreService } from '@/lib/services/storeService';
import { CreateStoreRequest } from '@/lib/types';

// GET /api/stores - Get all stores with pagination and search
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    // Get pagination and search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    const result = await StoreService.getAllStores(domain, {
      page,
      limit,
      search
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/stores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stores - Create a new store
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
    const storeData: CreateStoreRequest = body;

    // Validate required fields
    if (!storeData.name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const result = await StoreService.createStore(domain, storeData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ store: result.store }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/stores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}