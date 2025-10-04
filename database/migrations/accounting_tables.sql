-- =========================================
-- ACCOUNTING MODULE MIGRATION
-- =========================================
-- Run this SQL to add the accounting tables to your tenant databases

-- =========================================
-- CHART OF ACCOUNTS
-- =========================================
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Account details
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_sub_type TEXT NOT NULL CHECK (account_sub_type IN (
    'current_asset', 'non_current_asset', 'cash', 'accounts_receivable', 'inventory', 'prepaid_expenses', 'fixed_assets', 'intangible_assets',
    'current_liability', 'non_current_liability', 'accounts_payable', 'accrued_expenses', 'notes_payable', 'long_term_debt',
    'owner_equity', 'retained_earnings', 'common_stock', 'additional_paid_in_capital',
    'operating_revenue', 'non_operating_revenue', 'sales_revenue', 'service_revenue', 'other_income',
    'operating_expense', 'cost_of_goods_sold', 'administrative_expense', 'selling_expense', 'financial_expense', 'other_expense'
  )),
  
  -- Hierarchy
  parent_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  
  -- Account behavior
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('debit', 'credit')),
  is_system_account INTEGER DEFAULT 0 CHECK (is_system_account IN (0, 1)),
  is_control_account INTEGER DEFAULT 0 CHECK (is_control_account IN (0, 1)),
  
  -- Settings
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  description TEXT,
  
  -- Current balance (calculated field)
  current_balance REAL DEFAULT 0,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- JOURNAL ENTRIES
-- =========================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Entry details
  entry_number TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Reference information
  reference_type TEXT NOT NULL DEFAULT 'manual' CHECK (reference_type IN ('manual', 'invoice', 'payment', 'purchase', 'adjustment', 'opening_balance', 'closing_entry')),
  reference_id INTEGER,
  reference_number TEXT,
  
  -- Entry status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  reversed_by_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
  reversed_at TEXT,
  
  -- Totals (should always balance)
  total_debits REAL DEFAULT 0,
  total_credits REAL DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- JOURNAL ENTRY LINES
-- =========================================
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  -- Line details
  description TEXT,
  debit_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  
  -- Additional references
  reference_type TEXT,
  reference_id INTEGER,
  
  -- Line order
  line_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- BANK ACCOUNTS
-- =========================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  chart_account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  -- Account details
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'money_market', 'credit_card', 'cash', 'petty_cash')),
  
  -- Account information
  routing_number TEXT,
  swift_code TEXT,
  iban TEXT,
  currency TEXT DEFAULT 'HNL',
  
  -- Current balance (calculated from transactions)
  current_balance REAL DEFAULT 0,
  available_balance REAL DEFAULT 0,
  
  -- Settings
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_default INTEGER DEFAULT 0 CHECK (is_default IN (0, 1)),
  
  -- Bank details
  branch_name TEXT,
  branch_address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- BANK TRANSACTIONS
-- =========================================
CREATE TABLE IF NOT EXISTS bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_date TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  
  -- Amounts
  debit_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  running_balance REAL DEFAULT 0,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'check', 'electronic', 'adjustment')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'reconciled', 'voided')),
  cleared_date TEXT,
  reconciled_date TEXT,
  
  -- References
  payee_payor TEXT,
  category TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- SUPPLIERS/VENDORS
-- =========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'company' CHECK (supplier_type IN ('individual', 'company')),
  
  -- Contact info
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Honduras',
  postal_code TEXT,
  
  -- Business details
  tax_id TEXT,
  registration_number TEXT,
  
  -- Payment terms
  payment_terms INTEGER DEFAULT 30,
  credit_limit REAL DEFAULT 0,
  
  -- Settings
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  
  -- Metadata
  notes TEXT,
  tags TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- PURCHASE ORDERS
-- =========================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- PO details
  po_number TEXT NOT NULL,
  po_date TEXT NOT NULL DEFAULT (date('now')),
  expected_date TEXT,
  
  -- Amounts
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled')),
  
  -- Additional info
  notes TEXT,
  terms TEXT,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- PURCHASE ORDER ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Item details
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL,
  
  -- Receiving tracking
  quantity_received REAL DEFAULT 0,
  quantity_invoiced REAL DEFAULT 0,
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- BILLS/VENDOR INVOICES
-- =========================================
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Bill details
  bill_number TEXT NOT NULL,
  supplier_invoice_number TEXT,
  bill_date TEXT NOT NULL DEFAULT (date('now')),
  due_date TEXT,
  
  -- Amounts
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'partial', 'overdue', 'cancelled')),
  
  -- Additional info
  notes TEXT,
  terms TEXT,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- BILL ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Item details
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL,
  
  -- Account assignment
  account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- BILL PAYMENTS
-- =========================================
CREATE TABLE IF NOT EXISTS bill_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
  bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_number TEXT NOT NULL,
  payment_date TEXT NOT NULL DEFAULT (date('now')),
  amount REAL NOT NULL,
  
  -- Payment method
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'credit_card', 'electronic', 'other')),
  reference_number TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'voided')),
  
  -- Metadata
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Chart of Accounts indexes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_store_id ON chart_of_accounts(store_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_id ON chart_of_accounts(parent_account_id);

-- Journal Entries indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_store_id ON journal_entries(store_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

-- Journal Entry Lines indexes
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id ON journal_entry_lines(account_id);

-- Bank Accounts indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_store_id ON bank_accounts(store_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_chart_account_id ON bank_accounts(chart_account_id);

-- Bank Transactions indexes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON suppliers(store_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Purchase Orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store_id ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_date ON purchase_orders(po_date);

-- Bills indexes
CREATE INDEX IF NOT EXISTS idx_bills_store_id ON bills(store_id);
CREATE INDEX IF NOT EXISTS idx_bills_supplier_id ON bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- Bill Payments indexes
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bank_account_id ON bill_payments(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_payment_date ON bill_payments(payment_date);

-- =========================================
-- DEFAULT CHART OF ACCOUNTS SETUP
-- =========================================
-- This will create a basic chart of accounts for new stores
-- Note: Replace {store_id} with the actual store ID when setting up a new store

/*
-- Assets
INSERT INTO chart_of_accounts (store_id, account_code, account_name, account_type, account_sub_type, normal_balance, is_system_account) VALUES
({store_id}, '1000', 'Assets', 'asset', 'current_asset', 'debit', 1),
({store_id}, '1100', 'Current Assets', 'asset', 'current_asset', 'debit', 1),
({store_id}, '1110', 'Cash and Cash Equivalents', 'asset', 'cash', 'debit', 1),
({store_id}, '1120', 'Accounts Receivable', 'asset', 'accounts_receivable', 'debit', 1),
({store_id}, '1130', 'Inventory', 'asset', 'inventory', 'debit', 1),
({store_id}, '1140', 'Prepaid Expenses', 'asset', 'prepaid_expenses', 'debit', 1),
({store_id}, '1200', 'Fixed Assets', 'asset', 'fixed_assets', 'debit', 1),
({store_id}, '1210', 'Equipment', 'asset', 'fixed_assets', 'debit', 1),

-- Liabilities
({store_id}, '2000', 'Liabilities', 'liability', 'current_liability', 'credit', 1),
({store_id}, '2100', 'Current Liabilities', 'liability', 'current_liability', 'credit', 1),
({store_id}, '2110', 'Accounts Payable', 'liability', 'accounts_payable', 'credit', 1),
({store_id}, '2120', 'Accrued Expenses', 'liability', 'accrued_expenses', 'credit', 1),
({store_id}, '2130', 'Sales Tax Payable', 'liability', 'current_liability', 'credit', 1),

-- Equity
({store_id}, '3000', 'Equity', 'equity', 'owner_equity', 'credit', 1),
({store_id}, '3100', 'Owner Equity', 'equity', 'owner_equity', 'credit', 1),
({store_id}, '3200', 'Retained Earnings', 'equity', 'retained_earnings', 'credit', 1),

-- Revenue
({store_id}, '4000', 'Revenue', 'revenue', 'sales_revenue', 'credit', 1),
({store_id}, '4100', 'Sales Revenue', 'revenue', 'sales_revenue', 'credit', 1),
({store_id}, '4200', 'Service Revenue', 'revenue', 'service_revenue', 'credit', 1),

-- Expenses
({store_id}, '5000', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', 'debit', 1),
({store_id}, '5100', 'Cost of Goods Sold', 'expense', 'cost_of_goods_sold', 'debit', 1),
({store_id}, '6000', 'Operating Expenses', 'expense', 'operating_expense', 'debit', 1),
({store_id}, '6100', 'Salaries and Wages', 'expense', 'operating_expense', 'debit', 1),
({store_id}, '6200', 'Rent Expense', 'expense', 'operating_expense', 'debit', 1),
({store_id}, '6300', 'Utilities Expense', 'expense', 'operating_expense', 'debit', 1),
({store_id}, '6400', 'Office Supplies', 'expense', 'operating_expense', 'debit', 1),
({store_id}, '6500', 'Marketing and Advertising', 'expense', 'operating_expense', 'debit', 1);
*/