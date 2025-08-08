import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SimpleTagService } from '@/lib/services/simpleTagService';

// POST /api/tags/remove-by-name - Remove tag from entity by tag name
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
    const { tagName, entityType, entityId } = body;

    // Validate required fields
    if (!tagName || !entityType || !entityId) {
      return NextResponse.json({ error: 'Tag name, entity type, and entity ID are required' }, { status: 400 });
    }

    if (!['client', 'product', 'invoice', 'quote'].includes(entityType)) {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    const result = await SimpleTagService.removeTagFromEntity(
      domain, 
      tagName, 
      entityType, 
      parseInt(entityId)
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Tag removed successfully' });
  } catch (error: unknown) {
    console.error('POST /api/tags/remove-by-name error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}