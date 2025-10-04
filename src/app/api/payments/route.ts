import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getTenantDb } from '@/lib/turso';
import { 
  payments, 
  invoices, 
  users 
} from '@/lib/db/schema/tenant';
import { CreatePaymentRequest } from '@/lib/types';

// Generate payment number
function generatePaymentNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PAY-${timestamp}-${random}`;
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');
    const storeIdHeader = requestHeaders.get('X-Store-ID');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const storeId = storeIdHeader ? parseInt(storeIdHeader) : undefined;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const paymentData: CreatePaymentRequest = body;

    // Validate required fields
    if (!paymentData.invoiceId || !paymentData.amount || !paymentData.paymentMethod || !paymentData.paymentDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: invoiceId, amount, paymentMethod, paymentDate' 
      }, { status: 400 });
    }

    if (paymentData.amount <= 0) {
      return NextResponse.json({ 
        error: 'Payment amount must be greater than 0' 
      }, { status: 400 });
    }

    const db = await getTenantDb(domain);

    // Get the invoice to validate payment
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, paymentData.invoiceId))
      .limit(1);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice can accept payments
    if (invoice.status === 'paid') {
      return NextResponse.json({ 
        error: 'Invoice is already paid in full' 
      }, { status: 400 });
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot process payment for cancelled invoice' 
      }, { status: 400 });
    }

    // Calculate current balance due
    const currentBalanceDue = invoice.totalAmount - invoice.paidAmount;
    
    // Only restrict overpayments for non-cash payment methods
    if (paymentData.paymentMethod !== 'cash' && paymentData.amount > currentBalanceDue) {
      return NextResponse.json({ 
        error: `Payment amount (${paymentData.amount}) exceeds balance due (${currentBalanceDue}) for this payment method. Cash payments can exceed the balance due.` 
      }, { status: 400 });
    }

    // Generate payment number
    const paymentNumber = generatePaymentNumber();

    // Create payment record
    const [newPayment] = await db
      .insert(payments)
      .values({
        invoiceId: paymentData.invoiceId,
        storeId: invoice.storeId,
        userId: null, // Will be set when user authentication is implemented
        paymentNumber: paymentNumber,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference || null,
        bankName: paymentData.bankName || null,
        accountNumber: paymentData.accountNumber || null,
        status: 'completed',
        notes: paymentData.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Calculate how much to apply to the invoice (don't exceed balance due)
    const amountToApplyToInvoice = Math.min(paymentData.amount, currentBalanceDue);
    const changeAmount = paymentData.amount > currentBalanceDue ? paymentData.amount - currentBalanceDue : 0;
    
    // Update invoice paid amount and balance
    const newPaidAmount = invoice.paidAmount + amountToApplyToInvoice;
    const newBalanceDue = invoice.totalAmount - newPaidAmount;
    
    // Determine new invoice status
    let newStatus: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled' = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0 && newBalanceDue > 0) {
      newStatus = 'partial';
    }

    // Update invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      .where(eq(invoices.id, paymentData.invoiceId))
      .returning();

    return NextResponse.json({
      success: true,
      payment: {
        ...newPayment,
        invoice: updatedInvoice
      },
      changeAmount: changeAmount,
      appliedToInvoice: amountToApplyToInvoice
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/payments - Get payments for an invoice (with query param)
export async function GET(request: NextRequest) {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get('host');

    if (!host) {
      return NextResponse.json({ error: 'Host header is required' }, { status: 400 });
    }

    // Extract domain from host (remove port if present)
    const domain = host.split(':')[0];

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');

    if (!invoiceId) {
      return NextResponse.json({ 
        error: 'invoiceId query parameter is required' 
      }, { status: 400 });
    }

    const db = await getTenantDb(domain);

    // Get payments for the invoice
    const invoicePayments = await db
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        paymentDate: payments.paymentDate,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentReference: payments.paymentReference,
        bankName: payments.bankName,
        accountNumber: payments.accountNumber,
        status: payments.status,
        notes: payments.notes,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        userName: users.name
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .where(eq(payments.invoiceId, parseInt(invoiceId)))
      .orderBy(payments.createdAt);

    return NextResponse.json({
      success: true,
      payments: invoicePayments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}