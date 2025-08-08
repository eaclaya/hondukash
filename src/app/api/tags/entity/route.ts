import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SimpleTagService } from '@/lib/services/simpleTagService';

// GET /api/tags/entity - Get tags for a specific entity
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'client' | 'product' | 'invoice' | 'quote';
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 });
    }

    if (!['client', 'product', 'invoice', 'quote'].includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const result = await SimpleTagService.getEntityTags(domain, entityType, parseInt(entityId));

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/tags/entity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}