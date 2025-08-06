export interface TenantMeta {
  plan: string;
  contact_name: string;
  contact_email: string;
  due_date?: string;
  fee?: number;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  database_url?: string;
  database_auth_token?: string;
  database_created_at?: string;
}

export interface InvoiceSequence {
  enabled: boolean;
  hash: string;
  sequence_start: string;
  sequence_end: string;
  limit_date?: string;
}

export interface Tenant {
  id: number;
  name: string;
  domain: string;
  database: string;
  meta: string; // JSON string containing TenantMeta
  isActive: boolean;
  createdAt: string;
}

export interface CreateTenantRequest {
  name: string;
  domain: string;
  email: string;
  password: string;
  plan: string;
  contactName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  fee?: number;
  due_date?: string;
}

export interface Store {
  id: number;
  name: string;
  code?: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;

  // Settings
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  invoiceCounter: number;
  quotePrefix: string;
  quoteCounter: number;

  // Invoice Sequence Feature (JSON field)
  invoiceSequence?: InvoiceSequence;

  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  storeId: string;
  role: string;
  createdAt: string;
  updatedAt: string;

  // Related entities (populated via joins)
  user?: User;
  store?: Store;
}

export interface CreateStoreRequest {
  name: string;
  code?: string;
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  currency?: string;
  taxRate?: number;
  invoicePrefix?: string;
  quotePrefix?: string;

  // Invoice Sequence Feature (JSON field)
  invoiceSequence?: InvoiceSequence;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  id: number;
}

export interface CreateClientRequest {
  storeId?: number;
  name: string;
  clientType: 'individual' | 'company';
  primaryContactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  companyRegistrationNumber?: string;
  taxRateId?: number;
  industry?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  creditLimit?: number;
  paymentTerms?: number;
  discountPercentage?: number;
  notes?: string;
  contacts?: CreateClientContactRequest[];
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number;
  contacts?: CreateClientContactRequest[];
}

export interface CreateClientContactRequest {
  clientId?: number;
  contactName: string;
  jobTitle?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  extension?: string;
  contactType?: 'primary' | 'employee' | 'manager' | 'executive' | 'procurement' | 'accounting' | 'other';
  canMakePurchases?: boolean;
  purchaseLimit?: number;
  requiresApproval?: boolean;
  preferredContactMethod?: 'email' | 'phone' | 'mobile';
  language?: string;
  timezone?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateClientContactRequest extends Partial<CreateClientContactRequest> {
  id: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'tenant_admin' | 'store_admin' | 'user';
  tenantId?: string;
  storeAccess?: string[];
}

export interface Client {
  id: number;
  storeId: number;
  name: string;
  clientType: 'individual' | 'company';

  // Primary contact info
  primaryContactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;

  // Company-specific
  companyRegistrationNumber?: string;
  industry?: string;
  website?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;

  // Business settings
  creditLimit: number;
  paymentTerms: number;
  discountPercentage: number;

  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Related entities
  contacts?: ClientContact[];
}

export interface ClientContact {
  id: number;
  clientId: number;
  contactName: string;
  jobTitle?: string;
  department?: string;

  // Contact info
  email?: string;
  phone?: string;
  mobile?: string;
  extension?: string;

  // Contact type and permissions
  contactType: 'primary' | 'employee' | 'manager' | 'executive' | 'procurement' | 'accounting' | 'other';
  canMakePurchases: boolean;
  purchaseLimit?: number;
  requiresApproval: boolean;

  // Preferences
  preferredContactMethod: 'email' | 'phone' | 'mobile';
  language: string;
  timezone: string;

  // Status
  isPrimary: boolean;
  isActive: boolean;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: number;
  categoryName?: string;

  // Pricing and costing
  baseCost: number; // Original purchase/manufacturing cost
  cost: number; // Current replacement cost (for inventory valuation)
  basePrice: number; // Suggested retail price (before discounts)
  price: number; // Default selling price
  minPrice: number; // Minimum selling price allowed

  // Tax configuration
  isTaxable: boolean;
  taxRateId?: number;
  taxRate?: number;

  // Inventory settings
  trackInventory: boolean;
  unit: string;

  // Media
  imageUrl?: string;
  images: string[];

  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id?: number;
  productId: number;
  storeId: number;
  quantity: number; // Current stock quantity
  price: number; // Store-specific selling price
  location?: string; // Aisle, bin, etc.
  createdAt: string;
  updatedAt: string;

  // Related entities (populated via joins)
  product?: Product;
  store?: Store;
}

export interface ProductWithInventory extends Product {
  inventory: Inventory;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: number;
  baseCost?: number;
  cost?: number;
  basePrice?: number;
  price: number;
  minPrice?: number;
  isTaxable?: boolean;
  taxRateId?: number;
  taxRate?: number;
  trackInventory?: boolean;
  unit?: string;
  imageUrl?: string;
  images?: string[];
  // Initial inventory data
  quantity?: number;
  storePrice?: number;
  location?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  storeId: string;

  // Contact info (captured at time of invoice)
  clientName?: string;

  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

  // Payment tracking
  paidAmount: number;
  balanceDue: number;

  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;

  createdAt: string;
  updatedAt: string;

  // Related entities
  client?: Client;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  total: number; // lineTotal + taxAmount
}

export interface CreateInvoiceRequest {
  clientId: number;
  storeId: number;
  clientName: string;
  items: CreateInvoiceItemRequest[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  description: string;
  taxRateId?: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  total: number;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  id: number;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  storeId: string;

  // Contact info (captured at time of quote)
  clientName?: string;

  items: QuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

  // Conversion tracking
  convertedToInvoiceId?: string;
  convertedAt?: string;

  quoteDate: string;
  validUntil?: string;
  notes?: string;
  terms?: string;

  createdAt: string;
  updatedAt: string;

  // Related entities
  client?: Client;
  convertedToInvoice?: Invoice;
}

export interface QuoteItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateQuoteRequest {
  clientId: number;
  storeId: number;
  clientName?: string;
  items: CreateQuoteItemRequest[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status?: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';
  quoteDate: string;
  validUntil?: string;
  notes?: string;
  terms?: string;
}

export interface CreateQuoteItemRequest {
  productId: number; // Required - must be > 0
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  id: number;
}

export interface ConvertQuoteToInvoiceRequest {
  quoteId: number;
  invoiceDate?: string;
  dueDate?: string;
}

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tax Rate types
export interface TaxRate {
  id: number;
  name: string;
  code: string;
  rate: number;
  type: 'sales' | 'purchase' | 'both';
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export accounting types
export * from './accounting';
