# HonduKash ERP - Accounting Module

The accounting module provides comprehensive financial management capabilities for small and medium-sized businesses. It follows standard accounting principles and is designed specifically for Central American businesses.

## 📊 **Core Features**

### 1. **Chart of Accounts**
- **Structured account hierarchy** with standard account types
- **Pre-configured accounts** for Honduras tax regulations
- **Custom account creation** for specific business needs
- **Account grouping** and reporting structures

### 2. **Double-Entry Bookkeeping**
- **Journal entries** with automatic debit/credit validation
- **Multiple entry types** (manual, automatic, adjusting, closing)
- **Source document tracking** (invoice, payment, purchase links)
- **Entry reversal** capability with audit trail

### 3. **Supplier Management**
- **Complete supplier profiles** with contact information
- **Payment terms** and credit limit tracking
- **Purchase order** creation and management
- **Accounts payable** integration

### 4. **Expense Management**
- **Expense tracking** by category and account
- **Receipt attachment** support (JSONB storage)
- **Approval workflow** with user permissions
- **Multiple payment methods** support

### 5. **Banking & Cash Management**
- **Multiple bank account** support
- **Bank transaction** import and reconciliation
- **Cash flow** tracking and reporting
- **Account balance** monitoring

### 6. **Financial Reporting**
- **Balance Sheet** - Assets, Liabilities, Equity
- **Income Statement** - Revenue, Expenses, Net Income
- **Cash Flow Statement** - Operating, Investing, Financing
- **Trial Balance** - Account balance verification


### 7. **Tax Management**
- **Honduras ISV (Sales Tax)** pre-configured at 15%
- **Multiple tax rates** support
- **Tax collection** and payment tracking
- **Tax reporting** preparation

## 🏗️ **Database Structure**

### **Core Accounting Tables**

#### `chart_of_accounts`
```sql
- Account hierarchy with codes (1000, 1010, etc.)
- Account types: asset, liability, equity, revenue, expense, COGS
- Normal balance tracking (debit/credit)
- Current balance calculation
- Parent-child relationships for account grouping
```

#### `journal_entries` & `journal_entry_lines`
```sql
- Double-entry bookkeeping implementation
- Automatic balance validation (debits = credits)
- Source document references
- Entry status tracking (draft, posted, reversed)
- Line-level detail with tax support
```

#### `accounting_periods`
```sql
- Fiscal period management
- Period closing controls
- Date range validation
- Multi-period reporting support
```

### **Operational Tables**

#### `suppliers` & `purchase_orders`
```sql
- Supplier master data
- Purchase order lifecycle
- Receiving and payment tracking
- Integration with inventory
```

#### `expenses`
```sql
- Expense categorization
- Approval workflow
- Receipt attachment storage
- Account coding integration
```

#### `bank_accounts` & `bank_transactions`
```sql
- Multi-bank support
- Transaction reconciliation
- Balance tracking
- Journal entry integration
```


## 📈 **Standard Chart of Accounts**

The module includes a pre-configured chart of accounts suitable for Honduran businesses:

### **Assets (1000-1999)**
- `1010` - Cash
- `1020` - Accounts Receivable  
- `1030` - Inventory
- `1500` - Fixed Assets

### **Liabilities (2000-2999)**
- `2010` - Accounts Payable
- `2020` - Sales Tax Payable (ISV)

### **Equity (3000-3999)**
- `3000` - Owner's Equity

### **Revenue (4000-4999)**
- `4000` - Sales Revenue

### **Cost of Goods Sold (5000-5999)**
- `5000` - Cost of Goods Sold

### **Expenses (6000-9999)**
- `6010` - Rent Expense
- `6020` - Office Supplies
- `6030` - Utilities
- `6040` - Marketing Expenses

## 🔧 **Key Features for Small/Medium Business**

### **1. Automated Transactions**
- **Invoice posting** automatically creates:
  - DR: Accounts Receivable
  - CR: Sales Revenue
  - DR: Cost of Goods Sold
  - CR: Inventory

- **Payment receipt** creates:
  - DR: Cash/Bank Account
  - CR: Accounts Receivable

- **Purchase entries** create:
  - DR: Inventory/Expenses
  - CR: Accounts Payable

### **2. Tax Compliance**
- **ISV (Impuesto Sobre Ventas)** - Honduras 15% sales tax
- **Tax collection** tracking
- **Tax payment** recording
- **Tax reporting** data preparation

### **3. Multi-Currency Support**
- **Base currency** configuration (HNL default)
- **Foreign currency** transaction support
- **Exchange rate** tracking
- **Multi-currency** reporting

### **4. Financial Controls**
- **Period closing** prevents backdated entries
- **Balance validation** ensures accounting equation
- **User permissions** control access levels
- **Audit trail** tracks all changes

### **5. Reporting & Analytics**
- **Real-time** financial statements
- **Period comparison** reports
- **Cash flow** forecasting
- **Profitability** by product/store

## 🚀 **Implementation Guide**

### **1. Setup Process**
1. **Initialize** with default chart of accounts
2. **Configure** tax rates for your location
3. **Set up** bank accounts
4. **Create** accounting periods
5. **Import** opening balances

### **2. Daily Operations**
1. **Record** sales through invoicing
2. **Enter** purchase transactions
3. **Track** expenses with receipts
4. **Reconcile** bank statements
5. **Review** financial reports

### **3. Period-End Processes**
1. **Review** trial balance
2. **Make** adjusting entries
3. **Generate** financial statements
4. **Close** accounting period
5. **Prepare** tax returns

## 🔐 **Security & Compliance**

### **Data Security**
- **Row-level security** by store
- **User permissions** by role
- **Audit logging** for all transactions
- **Data encryption** in transit and at rest

### **Compliance Features**
- **Honduran tax** regulation compliance
- **Accounting standards** adherence
- **Data retention** policies
- **Backup and recovery** procedures

## 📊 **Report Examples**

### **Balance Sheet**
```
ASSETS
Current Assets:
  Cash                     L 50,000
  Accounts Receivable      L 25,000
  Inventory               L 100,000
  Total Current Assets    L 175,000

LIABILITIES & EQUITY
Current Liabilities:
  Accounts Payable        L 30,000
  Sales Tax Payable       L  5,000
  Total Liabilities       L 35,000

Equity:
  Owner's Equity         L 140,000
  Total Equity           L 140,000

Total Liab. & Equity     L 175,000
```

### **Income Statement**
```
REVENUE
  Sales Revenue           L 200,000

COST OF GOODS SOLD
  Cost of Goods Sold      L 120,000
  Gross Profit            L  80,000

EXPENSES
  Rent Expense            L  10,000
  Utilities               L   3,000
  Office Supplies         L   2,000
  Total Expenses          L  15,000

NET INCOME                L  65,000
```

## 🎯 **Benefits for SME**

### **Financial Visibility**
- **Real-time** financial position
- **Profit and loss** tracking
- **Cash flow** monitoring
- **Trend analysis** capabilities

### **Operational Efficiency**
- **Automated** journal entries
- **Integrated** inventory costing
- **Streamlined** expense approval
- **Electronic** document storage

### **Compliance & Control**
- **Tax calculation** automation
- **Regulatory reporting** support
- **Internal control** frameworks
- **Audit trail** maintenance

### **Growth Support**
- **Multi-store** accounting
- **Scalable** chart of accounts
- **Budget planning** tools
- **Performance metrics** tracking

This comprehensive accounting module provides everything a small to medium business needs for complete financial management while maintaining simplicity and ease of use.