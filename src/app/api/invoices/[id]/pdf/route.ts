import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/services/invoiceService';
import { requireTenantAuth } from '@/lib/auth/tenantAuth';
import { renderToBuffer } from '@react-pdf/renderer';
import { createInvoicePDF } from '@/components/pdf/InvoicePDF';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = requireTenantAuth(request);

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get invoice data
    const result = await InvoiceService.getInvoiceById(session.domain, invoiceId);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Invoice not found' }, { status: 404 });
    }

    const invoice = result.data;

    // Get store data for sequence information
    const { StoreService } = await import('@/lib/services/storeService');
    const storeResult = await StoreService.getStoreById(session.domain, parseInt(invoice.storeId));
    const store = storeResult.success ? storeResult.store : null;

    // Generate PDF using react-pdf
    const pdfBuffer = await renderToBuffer(createInvoicePDF(invoice, store));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`
      }
    });

  } catch (error: unknown) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

