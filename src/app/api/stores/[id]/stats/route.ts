import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StoreService } from '@/lib/services/storeService';

// GET /api/stores/[id]/stats - Get store statistics
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
    
    const result = await StoreService.getStoreStats(domain, storeId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ stats: result.stats });
  } catch (error: unknown) {
    console.error('GET /api/stores/[id]/stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}