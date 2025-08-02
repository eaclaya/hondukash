import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StoreService } from '@/lib/services/storeService';
import { UpdateStoreRequest } from '@/lib/types';

// GET /api/stores/[id] - Get store by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestHeaders = headers();
    const host = requestHeaders.get('host');
    
    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    const storeId = parseInt(id);
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }
    
    const result = await StoreService.getStoreById(domain, storeId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ store: result.store });
  } catch (error: unknown) {
    console.error('GET /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/stores/[id] - Update store
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestHeaders = headers();
    const host = requestHeaders.get('host');
    
    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    const storeId = parseInt(id);
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const updateData: UpdateStoreRequest = { ...body, id: storeId };

    const result = await StoreService.updateStore(domain, updateData);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ store: result.store });
  } catch (error: unknown) {
    console.error('PUT /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/stores/[id] - Delete store
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestHeaders = headers();
    const host = requestHeaders.get('host');
    
    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    const storeId = parseInt(id);
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 });
    }
    
    const result = await StoreService.deleteStore(domain, storeId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Store deleted successfully' });
  } catch (error: unknown) {
    console.error('DELETE /api/stores/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}