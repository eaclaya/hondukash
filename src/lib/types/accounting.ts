// =========================================
// ACCOUNTING MODULE TYPES
// =========================================

export interface ChartOfAccount {
  id: number
  storeId: number
  accountCode: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  accountSubType: 'current_asset' | 'non_current_asset' | 'cash' | 'accounts_receivable' | 'inventory' | 'prepaid_expenses' | 'fixed_assets' | 'intangible_assets' | 'current_liability' | 'non_current_liability' | 'accounts_payable' | 'accrued_expenses' | 'notes_payable' | 'long_term_debt' | 'owner_equity' | 'retained_earnings' | 'common_stock' | 'additional_paid_in_capital' | 'operating_revenue' | 'non_operating_revenue' | 'sales_revenue' | 'service_revenue' | 'other_income' | 'operating_expense' | 'cost_of_goods_sold' | 'administrative_expense' | 'selling_expense' | 'financial_expense' | 'other_expense'
  parentAccountId?: number
  normalBalance: 'debit' | 'credit'
  isSystemAccount: boolean
  isControlAccount: boolean
  isActive: boolean
  description?: string
  currentBalance: number
  createdAt: string
  updatedAt: string
}

export interface FiscalPeriod {
  id: string
  storeId: string
  name: string
  type: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  status: 'open' | 'closed' | 'locked'
  closedAt?: string
  closedBy?: string
  createdAt: string
  updatedAt: string
}

export interface JournalEntry {
  id: number
  storeId: number
  userId?: number
  entryNumber: string
  entryDate: string
  description: string
  referenceType: 'manual' | 'invoice' | 'payment' | 'purchase' | 'adjustment' | 'opening_balance' | 'closing_entry'
  referenceId?: number
  referenceNumber?: string
  status: 'draft' | 'posted' | 'reversed'
  reversedById?: number
  reversedAt?: string
  totalDebits: number
  totalCredits: number
  notes?: string
  lines: JournalEntryLine[]
  createdAt: string
  updatedAt: string
}

export interface JournalEntryLine {
  id: number
  journalEntryId: number
  accountId: number
  description?: string
  debitAmount: number
  creditAmount: number
  referenceType?: string
  referenceId?: number
  lineOrder: number
  account?: ChartOfAccount
  createdAt: string
}

export interface Supplier {
  id: number
  storeId: number
  name: string
  supplierType: 'individual' | 'company'
  contactName?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country: string
  postalCode?: string
  taxId?: string
  registrationNumber?: string
  paymentTerms: number
  creditLimit: number
  isActive: boolean
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  storeId: string
  supplierId: string
  userId?: string
  poNumber: string
  poDate: string
  expectedDate?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled'
  notes?: string
  terms?: string
  supplier?: Supplier
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId?: string
  description: string
  quantity: number
  unitCost: number
  quantityReceived: number
  quantityPending: number
  lineTotal: number
  taxRate: number
  taxAmount: number
  sortOrder: number
  createdAt: string
}

export interface Expense {
  id: string
  storeId: string
  supplierId?: string
  userId?: string
  expenseNumber: string
  expenseDate: string
  expenseCategory?: string
  expenseAccountId: string
  amount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  paymentReference?: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  description: string
  receiptNumber?: string
  notes?: string
  attachments: string[]
  approvedBy?: string
  approvedAt?: string
  account?: ChartOfAccount
  supplier?: Supplier
  createdAt: string
  updatedAt: string
}


export interface TaxConfiguration {
  id: string
  storeId: string
  taxName: string
  taxCode: string
  taxRate: number
  taxType: 'sales' | 'purchase' | 'both'
  taxCollectedAccountId?: string
  taxPaidAccountId?: string
  isDefault: boolean
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface BankAccount {
  id: number
  storeId: number
  chartAccountId: number
  accountName: string
  bankName: string
  accountNumber: string
  accountType: 'checking' | 'savings' | 'money_market' | 'credit_card' | 'cash' | 'petty_cash'
  routingNumber?: string
  swiftCode?: string
  iban?: string
  currency: string
  currentBalance: number
  availableBalance: number
  isActive: boolean
  isDefault: boolean
  branchName?: string
  branchAddress?: string
  contactPerson?: string
  contactPhone?: string
  description?: string
  notes?: string
  chartAccount?: ChartOfAccount
  createdAt: string
  updatedAt: string
}

export interface BankTransaction {
  id: number
  bankAccountId: number
  journalEntryId?: number
  transactionDate: string
  description: string
  referenceNumber?: string
  debitAmount: number
  creditAmount: number
  runningBalance: number
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'interest' | 'check' | 'electronic' | 'adjustment'
  status: 'pending' | 'cleared' | 'reconciled' | 'voided'
  clearedDate?: string
  reconciledDate?: string
  payeePayor?: string
  category?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface FinancialReportCache {
  id: string
  storeId: string
  reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance'
  periodStart: string
  periodEnd: string
  reportData: unknown
  generatedAt: string
  expiresAt: string
}

// Report Data Structures
export interface BalanceSheetData {
  assets: {
    current: { [accountId: string]: { name: string; balance: number } }
    fixed: { [accountId: string]: { name: string; balance: number } }
    total: number
  }
  liabilities: {
    current: { [accountId: string]: { name: string; balance: number } }
    longTerm: { [accountId: string]: { name: string; balance: number } }
    total: number
  }
  equity: {
    accounts: { [accountId: string]: { name: string; balance: number } }
    total: number
  }
  totalLiabilitiesAndEquity: number
}

export interface IncomeStatementData {
  revenue: {
    accounts: { [accountId: string]: { name: string; amount: number } }
    total: number
  }
  costOfGoodsSold: {
    accounts: { [accountId: string]: { name: string; amount: number } }
    total: number
  }
  grossProfit: number
  expenses: {
    accounts: { [accountId: string]: { name: string; amount: number } }
    total: number
  }
  netIncome: number
}

export interface TrialBalanceData {
  accounts: Array<{
    accountCode: string
    accountName: string
    debitBalance: number
    creditBalance: number
  }>
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
}

// Form Types
export interface CreateJournalEntryRequest {
  description: string
  reference?: string
  entryDate: string
  lines: Array<{
    accountId: string
    description?: string
    debitAmount?: number
    creditAmount?: number
  }>
}

export interface CreateExpenseRequest {
  supplierId?: string
  expenseDate: string
  expenseCategory?: string
  expenseAccountId: string
  amount: number
  taxAmount?: number
  paymentMethod: string
  paymentReference?: string
  description: string
  receiptNumber?: string
  notes?: string
}

export interface CreateSupplierRequest {
  name: string
  supplierType: 'individual' | 'company'
  contactName?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  taxId?: string
  registrationNumber?: string
  paymentTerms?: number
  creditLimit?: number
  notes?: string
}

// New interfaces for Bills and Purchase Orders
export interface Bill {
  id: number
  storeId: number
  supplierId: number
  purchaseOrderId?: number
  userId?: number
  billNumber: string
  supplierInvoiceNumber?: string
  billDate: string
  dueDate?: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'open' | 'paid' | 'partial' | 'overdue' | 'cancelled'
  notes?: string
  terms?: string
  supplier?: Supplier
  purchaseOrder?: PurchaseOrder
  items: BillItem[]
  payments: BillPayment[]
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: number
  billId: number
  productId?: number
  description: string
  quantity: number
  unitCost: number
  lineTotal: number
  accountId?: number
  sortOrder: number
  account?: ChartOfAccount
  createdAt: string
}

export interface BillPayment {
  id: number
  billId: number
  bankAccountId: number
  journalEntryId?: number
  userId?: number
  paymentNumber: string
  paymentDate: string
  amount: number
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'electronic' | 'other'
  referenceNumber?: string
  status: 'pending' | 'cleared' | 'voided'
  notes?: string
  bill?: Bill
  bankAccount?: BankAccount
  createdAt: string
  updatedAt: string
}

export interface CreateBillRequest {
  supplierId: number
  purchaseOrderId?: number
  billDate: string
  dueDate?: string
  supplierInvoiceNumber?: string
  items: Array<{
    productId?: number
    description: string
    quantity: number
    unitCost: number
    accountId?: number
  }>
  notes?: string
  terms?: string
}

export interface CreateBankAccountRequest {
  accountName: string
  bankName: string
  accountNumber: string
  accountType: 'checking' | 'savings' | 'money_market' | 'credit_card' | 'cash' | 'petty_cash'
  routingNumber?: string
  currency?: string
  isDefault?: boolean
  description?: string
  notes?: string
}