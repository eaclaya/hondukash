'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, User, FileText } from 'lucide-react';
import { Payment } from '@/lib/types';
import { PaymentService } from '@/lib/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LoaderSpinner from '@/components/shared/loader-spinner';

interface PaymentHistoryProps {
  invoiceId: string;
}

export default function PaymentHistory({ invoiceId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const paymentService = new PaymentService(getAuthHeaders());
      const fetchedPayments = await paymentService.getPaymentsForInvoice(invoiceId);
      setPayments(fetchedPayments);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-HN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-HN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoaderSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payments recorded for this invoice</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Payment History</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({payments.length} payment{payments.length !== 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{payment.paymentNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{formatDate(payment.paymentDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{PaymentService.getPaymentMethodIcon(payment.paymentMethod)}</span>
                    <div>
                      <div className="font-medium">
                        {PaymentService.formatPaymentMethod(payment.paymentMethod)}
                      </div>
                      {payment.bankName && (
                        <div className="text-xs text-muted-foreground">
                          {payment.bankName}
                        </div>
                      )}
                      {payment.accountNumber && (
                        <div className="text-xs text-muted-foreground">
                          **** {payment.accountNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {payment.paymentReference ? (
                      <>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{payment.paymentReference}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-green-600">
                    {formatCurrency(payment.amount)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`capitalize ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {(payment as any).userName || 'System'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Payment Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Payments:</span>
            <span className="font-bold text-green-600 text-lg">
              {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
            </span>
          </div>
        </div>

        {/* Notes Section */}
        {payments.some(p => p.notes) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Payment Notes:</h4>
            <div className="space-y-2">
              {payments.filter(p => p.notes).map((payment) => (
                <div key={payment.id} className="text-sm">
                  <span className="font-medium">{payment.paymentNumber}:</span>{' '}
                  <span className="text-muted-foreground">{payment.notes}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}