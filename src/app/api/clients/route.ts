import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ClientService } from '@/lib/services/clientService';
import { CreateClientRequest } from '@/lib/types';

// GET /api/clients - Get all clients
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

    const result = await ClientService.getAllClients(domain, storeId, {
      page,
      limit,
      search
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    console.error('GET /api/clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
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
    const clientData: CreateClientRequest = body;

    // Validate required fields
    if (!clientData.name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    if (!clientData.clientType) {
      return NextResponse.json({ error: 'Client type is required' }, { status: 400 });
    }

    const result = await ClientService.createClient(domain, clientData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ client: result.data }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
