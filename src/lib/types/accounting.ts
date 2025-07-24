// =========================================
// ACCOUNTING MODULE TYPES
// =========================================

export interface ChartOfAccount {
  id: string
  storeId: string
  accountCode: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'cost_of_goods_sold'
  accountSubtype?: string
  currentAccount: boolean
  parentAccountId?: string
  isActive: boolean
  isSystemAccount: boolean
  requiresTaxTracking: boolean
  normalBalance: 'debit' | 'credit'
  currentBalance: number
  description?: string
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
  id: string
  storeId: string
  periodId?: string
  userId?: string
  entryNumber: string
  entryDate: string
  entryType: 'manual' | 'automatic' | 'closing' | 'adjusting' | 'reversing'
  sourceType?: string
  sourceId?: string
  description: string
  reference?: string
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'posted' | 'reversed'
  postedAt?: string
  reversedAt?: string
  reversedBy?: string
  lines: JournalEntryLine[]
  createdAt: string
  updatedAt: string
}

export interface JournalEntryLine {
  id: string
  journalEntryId: string
  accountId: string
  lineNumber: number
  description?: string
  debitAmount: number
  creditAmount: number
  taxCode?: string
  taxAmount: number
  referenceType?: string
  referenceId?: string
  account?: ChartOfAccount
  createdAt: string
}

export interface Supplier {
  id: string
  storeId: string
  supplierCode?: string
  companyName: string
  contactPerson?: string
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
  currency: string
  accountsPayableAccountId?: string
  expenseAccountId?: string
  isActive: boolean
  notes?: string
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
  id: string
  storeId: string
  accountName: string
  accountNumber?: string
  bankName: string
  bankBranch?: string
  accountType: 'checking' | 'savings' | 'credit_card' | 'loan'
  currency: string
  openingBalance: number
  currentBalance: number
  chartAccountId: string
  isActive: boolean
  isDefault: boolean
  notes?: string
  chartAccount?: ChartOfAccount
  createdAt: string
  updatedAt: string
}

export interface BankTransaction {
  id: string
  bankAccountId: string
  transactionDate: string
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'fee'
  amount: number
  runningBalance: number
  description: string
  referenceNumber?: string
  isReconciled: boolean
  reconciledAt?: string
  journalEntryId?: string
  createdAt: string
}

export interface FinancialReportCache {
  id: string
  storeId: string
  reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance'
  periodStart: string
  periodEnd: string
  reportData: any
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
  companyName: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  taxId?: string
  paymentTerms?: number
  creditLimit?: number
}