'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, CreatePaymentRequest } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { processInvoicePayment } from '@/lib/services/accountingPaymentService';

interface PaymentFormProps {
  invoice: Invoice;
  onPaymentSuccess?: (payment: any) => void;
}

export default function PaymentForm({ invoice, onPaymentSuccess }: PaymentFormProps) {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    invoiceId: parseInt(invoice.id),
    amount: invoice.balanceDue,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    bankName: '',
    accountNumber: '',
    notes: ''
  });

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/tenant/bank-accounts', {
        headers: await getAuthHeaders()
      });

      if (response.ok) {
        const accounts = await response.json();
        setBankAccounts(accounts);
      } else {
        console.error('Failed to fetch bank accounts:', response.statusText);
        // Fallback to empty array if API fails
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      // Fallback to empty array if network error
      setBankAccounts([]);
    }
  };

  // Create payment options by combining payment methods with bank accounts
  const getPaymentOptions = () => {
    const options: Array<{value: string, label: string, paymentMethod: string, bankAccountId: number, accountType: string}> = [];
    
    bankAccounts.forEach(account => {
      if (account.accountType === 'petty_cash') {
        options.push({
          value: `cash-${account.id}`,
          label: `Cash - ${account.accountName} (${formatCurrency(account.currentBalance)})`,
          paymentMethod: 'cash',
          bankAccountId: account.id,
          accountType: account.accountType
        });
      } else if (account.accountType === 'checking' || account.accountType === 'savings') {
        // Add bank transfer option
        options.push({
          value: `bank_transfer-${account.id}`,
          label: `Bank Transfer - ${account.accountName} - ${account.bankName} (${formatCurrency(account.currentBalance)})`,
          paymentMethod: 'bank_transfer',
          bankAccountId: account.id,
          accountType: account.accountType
        });
        
        // Add check option for checking accounts
        if (account.accountType === 'checking') {
          options.push({
            value: `check-${account.id}`,
            label: `Check - ${account.accountName} - ${account.bankName} (${formatCurrency(account.currentBalance)})`,
            paymentMethod: 'check',
            bankAccountId: account.id,
            accountType: account.accountType
          });
        }
        
        // Add credit card option
        options.push({
          value: `credit_card-${account.id}`,
          label: `Credit Card - ${account.accountName} - ${account.bankName} (${formatCurrency(account.currentBalance)})`,
          paymentMethod: 'credit_card',
          bankAccountId: account.id,
          accountType: account.accountType
        });
        
        // Add debit card option
        options.push({
          value: `debit_card-${account.id}`,
          label: `Debit Card - ${account.accountName} - ${account.bankName} (${formatCurrency(account.currentBalance)})`,
          paymentMethod: 'debit_card',
          bankAccountId: account.id,
          accountType: account.accountType
        });
      }
    });
    
    return options;
  };

  const getSelectedOption = () => {
    if (!selectedPaymentOption) return null;
    return getPaymentOptions().find(option => option.value === selectedPaymentOption);
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

  // Calculate change for cash payments
  const calculateChange = (): number => {
    if (getSelectedOption()?.paymentMethod === 'cash' && formData.amount > invoice.balanceDue) {
      return formData.amount - invoice.balanceDue;
    }
    return 0;
  };

  const change = calculateChange();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Payment amount is required and must be greater than 0';
    }

    // Only restrict overpayments for non-cash payment methods
    if (getSelectedOption()?.paymentMethod !== 'cash' && formData.amount > invoice.balanceDue) {
      newErrors.amount = 'Payment amount cannot exceed the balance due for this payment method';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!selectedPaymentOption) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') {
      if (!formData.accountNumber) {
        newErrors.accountNumber = 'Card number (last 4 digits) is required';
      }
    }

    if (formData.paymentMethod === 'bank_transfer') {
      if (!formData.bankName) {
        newErrors.bankName = 'Bank name is required for bank transfers';
      }
      if (!formData.paymentReference) {
        newErrors.paymentReference = 'Transaction reference is required for bank transfers';
      }
    }

    if (formData.paymentMethod === 'check') {
      if (!formData.paymentReference) {
        newErrors.paymentReference = 'Check number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreatePaymentRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const selectedOption = getSelectedOption();
      if (!selectedOption) {
        throw new Error('Please select a payment method');
      }

      // Get domain from current location
      const domain = window.location.hostname;

      // Process invoice payment with automatic journal entry creation
      const result = await processInvoicePayment(domain, {
        invoiceId: parseInt(invoice.id),
        bankAccountId: selectedOption.bankAccountId,
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        paymentMethod: selectedOption.paymentMethod,
        referenceNumber: formData.paymentReference,
        notes: formData.notes
      });

      // Show success message with journal entry information
      let successMessage = 'Payment processed successfully!';
      if (result.journalEntry) {
        successMessage += ` Journal Entry ${result.journalEntry.entryNumber} created.`;
      }
      
      // Show change information if applicable (for cash payments)
      const change = calculateChange();
      if (change > 0) {
        successMessage += ` Change: ${formatCurrency(change)}`;
      }
      
      toast.success(successMessage);

      if (onPaymentSuccess) {
        onPaymentSuccess(result.payment);
      } else {
        router.push(`/invoices/${invoice.id}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Payment for Invoice {invoice.number}
            </h1>
            <p className="text-slate-600">
              Client: {invoice.client?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Total:</span>
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Already Paid:</span>
                <span>-{formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Balance Due:</span>
              <span className="text-red-600">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
              <NumericInput
                id="amount"
                placeholder="0.00"
                value={formData.amount.toString()}
                onValueChange={(value) => handleInputChange('amount', value || 0)}
                allowDecimals={true}
                maxDecimals={4}
                allowNegative={false}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
              {/* Show change calculation for cash payments */}
              {getSelectedOption()?.paymentMethod === 'cash' && change > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Change to return:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(change)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className={errors.paymentDate ? 'border-red-500' : ''}
              />
              {errors.paymentDate && (
                <p className="text-sm text-red-500 mt-1">{errors.paymentDate}</p>
              )}
            </div>

            {/* Payment Method & Account */}
            <div>
              <Label htmlFor="paymentMethod">Payment Method & Account *</Label>
              <Select
                value={selectedPaymentOption}
                onValueChange={(value) => {
                  setSelectedPaymentOption(value);
                  const option = getPaymentOptions().find(opt => opt.value === value);
                  if (option) {
                    handleInputChange('paymentMethod', option.paymentMethod);
                  }
                  // Clear error when user selects an option
                  if (errors.paymentMethod) {
                    setErrors(prev => ({ ...prev, paymentMethod: '' }));
                  }
                }}
              >
                <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select payment method and account" />
                </SelectTrigger>
                <SelectContent>
                  {getPaymentOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-red-500 mt-1">{errors.paymentMethod}</p>
              )}
              {getSelectedOption()?.paymentMethod === 'cash' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-600">
                    💡 Tip: Cash payments can exceed the balance due. The system will calculate change automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Conditional Fields Based on Payment Method */}
            {(getSelectedOption()?.paymentMethod === 'credit_card' || getSelectedOption()?.paymentMethod === 'debit_card') && (
              <div>
                <Label htmlFor="accountNumber">Card Number (Last 4 Digits) *</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className={errors.accountNumber ? 'border-red-500' : ''}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
                )}
              </div>
            )}

            {getSelectedOption()?.paymentMethod === 'bank_transfer' && (
              <>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="Bank name"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className={errors.bankName ? 'border-red-500' : ''}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="paymentReference">Transaction Reference *</Label>
                  <Input
                    id="paymentReference"
                    type="text"
                    placeholder="Transaction ID or reference number"
                    value={formData.paymentReference}
                    onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                    className={errors.paymentReference ? 'border-red-500' : ''}
                  />
                  {errors.paymentReference && (
                    <p className="text-sm text-red-500 mt-1">{errors.paymentReference}</p>
                  )}
                </div>
              </>
            )}

            {getSelectedOption()?.paymentMethod === 'check' && (
              <div>
                <Label htmlFor="paymentReference">Check Number *</Label>
                <Input
                  id="paymentReference"
                  type="text"
                  placeholder="Check number"
                  value={formData.paymentReference}
                  onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                  className={errors.paymentReference ? 'border-red-500' : ''}
                />
                {errors.paymentReference && (
                  <p className="text-sm text-red-500 mt-1">{errors.paymentReference}</p>
                )}
              </div>
            )}

            {/* Optional Reference for other methods */}
            {!['bank_transfer', 'check'].includes(getSelectedOption()?.paymentMethod || '') && (
              <div>
                <Label htmlFor="paymentReference">Reference (Optional)</Label>
                <Input
                  id="paymentReference"
                  type="text"
                  placeholder="Transaction reference, receipt number, etc."
                  value={formData.paymentReference}
                  onChange={(e) => handleInputChange('paymentReference', e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional payment notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/invoices/${invoice.id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}