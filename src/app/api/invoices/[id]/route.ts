import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { InvoiceService } from '@/lib/services/invoiceService';

// GET /api/invoices/[id] - Get a single invoice
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const result = await InvoiceService.getInvoiceById(domain, invoiceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Invoice not found' ? 404 : 400 });
    }

    return NextResponse.json({ invoice: result.data });
  } catch (error: any) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const body = await request.json();
    const invoiceData = { ...body, id: invoiceId };

    const result = await InvoiceService.updateInvoice(domain, invoiceData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Invoice not found' ? 404 : 400 });
    }

    return NextResponse.json({ invoice: result.data });
  } catch (error: any) {
    console.error('PUT /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const result = await InvoiceService.deleteInvoice(domain, invoiceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Invoice not found' ? 404 : 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update invoice status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, paidAmount } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await InvoiceService.updateInvoiceStatus(domain, invoiceId, status, paidAmount);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === 'Invoice not found' ? 404 : 400 });
    }

    return NextResponse.json({ invoice: result.data });
  } catch (error: any) {
    console.error('PATCH /api/invoices/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}