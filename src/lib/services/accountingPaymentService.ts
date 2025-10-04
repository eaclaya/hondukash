import { BillPayment, JournalEntry } from '@/lib/types/accounting';
import { getTenantDb } from '@/lib/turso';
import { eq } from 'drizzle-orm';
import { bankAccounts, chartOfAccounts } from '@/lib/db/schema/tenant';

interface CreatePaymentRequest {
  billId: number;
  bankAccountId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'electronic' | 'other';
  referenceNumber?: string;
  notes?: string;
}

interface InvoicePaymentRequest {
  invoiceId: number;
  bankAccountId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

interface PaymentProcessingResult {
  payment: BillPayment;
  journalEntry: JournalEntry;
  updatedBillStatus: string;
}

/**
 * Process a bill payment with automatic journal entry creation
 * This function handles the complete accounting workflow for bill payments
 */
export async function processBillPayment(
  domain: string,
  paymentData: CreatePaymentRequest
): Promise<PaymentProcessingResult> {
  try {
    // 1. Validate payment data
    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // 2. Get bill details
    const bill = await getBillById(paymentData.billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    const remainingBalance = bill.totalAmount - bill.paidAmount;
    if (paymentData.amount > remainingBalance) {
      throw new Error(`Payment amount (${paymentData.amount}) exceeds remaining balance (${remainingBalance})`);
    }

    // 3. Get bank account and chart account details
    const bankAccount = await getBankAccountById(domain, paymentData.bankAccountId);
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    // 4. Get accounts payable account from chart of accounts
    const accountsPayableAccount = await getAccountsPayableAccount(domain);
    if (!accountsPayableAccount) {
      throw new Error('Accounts Payable account not found in chart of accounts');
    }

    // 5. Generate payment number
    const paymentNumber = await generatePaymentNumber();

    // 6. Create journal entry for the payment
    // For bill payments: Debit A/P, Credit Cash/Bank
    const journalEntry = await createJournalEntry({
      description: `Payment for Bill ${bill.billNumber} - ${bill.supplier?.name || 'Supplier'}`,
      referenceType: 'payment',
      referenceId: bill.id,
      referenceNumber: paymentData.referenceNumber,
      entryDate: paymentData.paymentDate,
      lines: [
        {
          // Debit: Accounts Payable (reduces liability)
          accountId: accountsPayableAccount.id,
          description: `Payment for ${bill.billNumber}`,
          debitAmount: paymentData.amount,
          creditAmount: 0,
          lineOrder: 1
        },
        {
          // Credit: Bank/Cash Account (reduces asset)
          accountId: bankAccount.chartAccountId,
          description: `Payment via ${paymentData.paymentMethod}`,
          debitAmount: 0,
          creditAmount: paymentData.amount,
          lineOrder: 2
        }
      ]
    });

    // 7. Create payment record
    const payment = await createBillPayment({
      billId: paymentData.billId,
      bankAccountId: paymentData.bankAccountId,
      journalEntryId: journalEntry.id,
      paymentNumber,
      paymentDate: paymentData.paymentDate,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes,
      status: 'pending'
    });

    // 8. Update bill status and paid amount
    const newPaidAmount = bill.paidAmount + paymentData.amount;
    const newStatus = calculateBillStatus(bill.totalAmount, newPaidAmount, bill.dueDate);
    
    await updateBillPaymentStatus(bill.id, {
      paidAmount: newPaidAmount,
      status: newStatus
    });

    // 9. Update account balances
    await updateAccountBalance(accountsPayableAccount.id, -paymentData.amount); // Decrease A/P
    await updateAccountBalance(bankAccount.chartAccountId, -paymentData.amount); // Decrease Cash/Bank
    await updateBankAccountBalance(bankAccount.id, -paymentData.amount); // Update bank balance

    // 10. Post the journal entry
    await postJournalEntry(journalEntry.id);

    return {
      payment,
      journalEntry,
      updatedBillStatus: newStatus
    };

  } catch (error) {
    console.error('Error processing bill payment:', error);
    throw error;
  }
}

/**
 * Process an invoice payment with automatic journal entry creation
 */
export async function processInvoicePayment(domain: string, paymentData: InvoicePaymentRequest): Promise<any> {
  try {
    // 1. Get invoice details
    const invoice = await getInvoiceById(paymentData.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const remainingBalance = invoice.totalAmount - invoice.paidAmount;
    if (paymentData.amount > remainingBalance) {
      throw new Error(`Payment amount exceeds remaining balance`);
    }

    // 2. Get bank account details
    const bankAccount = await getBankAccountById(domain, paymentData.bankAccountId);
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    // 3. Get accounts receivable account
    const accountsReceivableAccount = await getAccountsReceivableAccount(domain);
    if (!accountsReceivableAccount) {
      throw new Error('Accounts Receivable account not found');
    }

    // 4. Create journal entry for invoice payment
    // For invoice payments: Debit Cash/Bank, Credit A/R
    const journalEntry = await createJournalEntry({
      description: `Payment received for Invoice ${invoice.invoiceNumber} - ${invoice.client?.name || 'Customer'}`,
      referenceType: 'payment',
      referenceId: invoice.id,
      referenceNumber: paymentData.referenceNumber,
      entryDate: paymentData.paymentDate,
      lines: [
        {
          // Debit: Bank/Cash Account (increases asset)
          accountId: bankAccount.chartAccountId,
          description: `Payment received via ${paymentData.paymentMethod}`,
          debitAmount: paymentData.amount,
          creditAmount: 0,
          lineOrder: 1
        },
        {
          // Credit: Accounts Receivable (reduces asset)
          accountId: accountsReceivableAccount.id,
          description: `Payment for ${invoice.invoiceNumber}`,
          debitAmount: 0,
          creditAmount: paymentData.amount,
          lineOrder: 2
        }
      ]
    });

    // 5. Create payment record
    const payment = await createInvoicePayment({
      invoiceId: paymentData.invoiceId,
      bankAccountId: paymentData.bankAccountId,
      journalEntryId: journalEntry.id,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes
    });

    // 6. Update invoice status
    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    const newStatus = calculateInvoiceStatus(invoice.totalAmount, newPaidAmount);
    
    await updateInvoicePaymentStatus(invoice.id, {
      paidAmount: newPaidAmount,
      status: newStatus
    });

    // 7. Update account balances
    await updateAccountBalance(bankAccount.chartAccountId, paymentData.amount); // Increase Cash/Bank
    await updateAccountBalance(accountsReceivableAccount.id, -paymentData.amount); // Decrease A/R
    await updateBankAccountBalance(bankAccount.id, paymentData.amount); // Update bank balance

    // 8. Post the journal entry
    await postJournalEntry(journalEntry.id);

    return {
      payment,
      journalEntry,
      updatedInvoiceStatus: newStatus
    };

  } catch (error) {
    console.error('Error processing invoice payment:', error);
    throw error;
  }
}

// Helper functions that need to be implemented based on your data layer

async function getBillById(billId: number) {
  // TODO: Implement database query to get bill details
  // This should return bill with supplier info, total amount, paid amount, etc.
  
  // Mock implementation for demo
  return {
    id: billId,
    billNumber: `BILL-${String(billId).padStart(3, '0')}`,
    totalAmount: 5000,
    paidAmount: 0,
    dueDate: '2024-02-14',
    supplier: { name: 'Distribuidora San Jorge' }
  };
}

async function getInvoiceById(invoiceId: number) {
  // TODO: Implement database query to get invoice details
  
  // Mock implementation for demo
  return {
    id: invoiceId,
    invoiceNumber: `INV-${String(invoiceId).padStart(3, '0')}`,
    totalAmount: 2000,
    paidAmount: 0,
    client: { name: 'ABC Company' }
  };
}

async function getBankAccountById(domain: string, bankAccountId: number) {
  try {
    const db = await getTenantDb(domain);
    
    const bankAccount = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, bankAccountId))
      .limit(1);
    
    if (!bankAccount.length) {
      throw new Error(`Bank account with ID ${bankAccountId} not found`);
    }
    
    return bankAccount[0];
  } catch (error) {
    console.error('Error fetching bank account:', error);
    throw error;
  }
}

async function getAccountsPayableAccount(domain: string) {
  try {
    const db = await getTenantDb(domain);
    
    const apAccount = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountSubType, 'accounts_payable'))
      .limit(1);
    
    if (!apAccount.length) {
      throw new Error('Accounts Payable account not found in chart of accounts');
    }
    
    return apAccount[0];
  } catch (error) {
    console.error('Error fetching Accounts Payable account:', error);
    throw error;
  }
}

async function getAccountsReceivableAccount(domain: string) {
  try {
    const db = await getTenantDb(domain);
    
    const arAccount = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountSubType, 'accounts_receivable'))
      .limit(1);
    
    if (!arAccount.length) {
      throw new Error('Accounts Receivable account not found in chart of accounts');
    }
    
    return arAccount[0];
  } catch (error) {
    console.error('Error fetching Accounts Receivable account:', error);
    throw error;
  }
}

async function createJournalEntry(entryData: any) {
  // TODO: Implement journal entry creation
  
  // Mock implementation for demo - this shows what should happen
  console.log('📝 Creating Journal Entry:', {
    description: entryData.description,
    entryDate: entryData.entryDate,
    referenceType: entryData.referenceType,
    lines: entryData.lines.map((line: any) => ({
      account: line.accountId === 3 ? 'Accounts Payable' : 
               line.accountId === 4 ? 'Accounts Receivable' : 
               'Cash/Bank Account',
      debit: line.debitAmount || 0,
      credit: line.creditAmount || 0,
      description: line.description
    }))
  });
  
  // Return mock journal entry
  return {
    id: Math.floor(Math.random() * 1000),
    entryNumber: `JE-${Date.now()}`,
    description: entryData.description,
    status: 'draft',
    totalDebits: entryData.lines.reduce((sum: number, line: any) => sum + (line.debitAmount || 0), 0),
    totalCredits: entryData.lines.reduce((sum: number, line: any) => sum + (line.creditAmount || 0), 0),
    createdAt: new Date().toISOString()
  };
}

async function createBillPayment(paymentData: any) {
  // TODO: Implement bill payment creation
  
  // Mock implementation for demo
  console.log('💳 Creating Bill Payment:', {
    billId: paymentData.billId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    journalEntryId: paymentData.journalEntryId
  });
  
  return {
    id: Math.floor(Math.random() * 1000),
    paymentNumber: paymentData.paymentNumber,
    billId: paymentData.billId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    status: paymentData.status,
    createdAt: new Date().toISOString()
  };
}

async function createInvoicePayment(paymentData: any) {
  // TODO: Implement invoice payment creation
  
  // Mock implementation for demo
  console.log('💰 Creating Invoice Payment:', {
    invoiceId: paymentData.invoiceId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    journalEntryId: paymentData.journalEntryId
  });
  
  return {
    id: Math.floor(Math.random() * 1000),
    invoiceId: paymentData.invoiceId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    paymentDate: paymentData.paymentDate,
    createdAt: new Date().toISOString()
  };
}

async function updateBillPaymentStatus(billId: number, updates: any) {
  // TODO: Update bill status and paid amount
  
  // Mock implementation for demo
  console.log('📄 Updating Bill Status:', {
    billId,
    newPaidAmount: updates.paidAmount,
    newStatus: updates.status
  });
  
  return { success: true };
}

async function updateInvoicePaymentStatus(invoiceId: number, updates: any) {
  // TODO: Update invoice status and paid amount
  
  // Mock implementation for demo
  console.log('📋 Updating Invoice Status:', {
    invoiceId,
    newPaidAmount: updates.paidAmount,
    newStatus: updates.status
  });
  
  return { success: true };
}

async function updateAccountBalance(accountId: number, amount: number) {
  // TODO: Update chart of accounts balance
  
  // Mock implementation for demo
  const accountName = accountId === 3 ? 'Accounts Payable' : 
                     accountId === 4 ? 'Accounts Receivable' : 
                     'Cash/Bank Account';
  console.log('📊 Updating Account Balance:', {
    accountId,
    accountName,
    changeAmount: amount,
    operation: amount > 0 ? 'increase' : 'decrease'
  });
  
  return { success: true };
}

async function updateBankAccountBalance(bankAccountId: number, amount: number) {
  // TODO: Update bank account current_balance
  
  // Mock implementation for demo
  console.log('🏦 Updating Bank Account Balance:', {
    bankAccountId,
    changeAmount: amount,
    operation: amount > 0 ? 'increase' : 'decrease'
  });
  
  return { success: true };
}

async function postJournalEntry(journalEntryId: number) {
  // TODO: Change journal entry status from 'draft' to 'posted'
  
  // Mock implementation for demo
  console.log('✅ Posting Journal Entry:', {
    journalEntryId,
    statusChange: 'draft → posted',
    timestamp: new Date().toISOString()
  });
  
  return { success: true, status: 'posted' };
}

async function generatePaymentNumber(): Promise<string> {
  // TODO: Generate unique payment number
  // For now, using timestamp, but should implement proper sequence
  const timestamp = Date.now();
  return `PAY-${timestamp}`;
}

function calculateBillStatus(totalAmount: number, paidAmount: number, dueDate?: string): string {
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0) {
    return 'partial';
  } else if (dueDate && new Date(dueDate) < new Date()) {
    return 'overdue';
  } else {
    return 'open';
  }
}

function calculateInvoiceStatus(totalAmount: number, paidAmount: number): string {
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (paidAmount > 0) {
    return 'partial';
  } else {
    return 'pending';
  }
}