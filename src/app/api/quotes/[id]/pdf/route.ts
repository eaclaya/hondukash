import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/lib/services/quoteService';
import { requireTenantAuth } from '@/lib/auth/tenantAuth';
import { renderToBuffer } from '@react-pdf/renderer';
import { createQuotePDF } from '@/components/pdf/QuotePDF';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = requireTenantAuth(request);

    const quoteId = parseInt(params.id);
    if (isNaN(quoteId)) {
      return NextResponse.json({ error: 'Invalid quote ID' }, { status: 400 });
    }

    // Get quote data
    const result = await QuoteService.getQuoteById(session.domain, quoteId);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Quote not found' }, { status: 404 });
    }

    const quote = result.data;

    // Get store data for sequence information
    const { StoreService } = await import('@/lib/services/storeService');
    const storeResult = await StoreService.getStoreById(session.domain, parseInt(quote.storeId));
    const store = storeResult.success ? storeResult.store : null;

    // Generate PDF using react-pdf
    const pdfBuffer = await renderToBuffer(createQuotePDF(quote, store));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.number}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Error generating quote PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

