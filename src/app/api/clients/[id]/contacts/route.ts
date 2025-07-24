import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ClientService } from '@/lib/services/clientService';
import { CreateClientContactRequest } from '@/lib/types';

// GET /api/clients/[id]/contacts - Get all contacts for a client
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
    const clientId = parseInt(id);
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }
    
    const result = await ClientService.getClientContacts(domain, clientId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ contacts: result.data });
  } catch (error: any) {
    console.error('GET /api/clients/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/clients/[id]/contacts - Create a new contact for a client
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestHeaders = headers();
    const host = requestHeaders.get('host');
    
    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];
    const clientId = parseInt(id);
    
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const contactData: CreateClientContactRequest = { ...body, clientId };

    // Validate required fields
    if (!contactData.contactName) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }

    const result = await ClientService.createClientContact(domain, contactData);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ contact: result.data }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/clients/[id]/contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}