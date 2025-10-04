import { CreatePaymentRequest, Payment } from '@/lib/types';

export class PaymentService {
  private authHeaders: Record<string, string>;

  constructor(authHeaders: Record<string, string>) {
    this.authHeaders = authHeaders;
  }

  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        ...this.authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process payment');
    }

    const data = await response.json();
    return data.payment;
  }

  async getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await fetch(`/api/payments?invoiceId=${invoiceId}`, {
      headers: this.authHeaders
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch payments');
    }

    const data = await response.json();
    return data.payments;
  }

  static formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card', 
      bank_transfer: 'Bank Transfer',
      check: 'Check',
      other: 'Other'
    };
    return methodMap[method] || method;
  }

  static getPaymentMethodIcon(method: string): string {
    const iconMap: Record<string, string> = {
      cash: '💵',
      credit_card: '💳',
      debit_card: '💳',
      bank_transfer: '🏦',
      check: '📝',
      other: '💰'
    };
    return iconMap[method] || '💰';
  }
}