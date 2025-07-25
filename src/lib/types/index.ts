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
  taxId?: string;
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
  taxId?: string;
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
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string;

  // Pricing and costing
  baseCost: number; // Original purchase/manufacturing cost
  cost: number; // Current replacement cost (for inventory valuation)
  basePrice: number; // Suggested retail price (before discounts)
  price: number; // Default selling price
  minPrice: number; // Minimum selling price allowed

  // Tax configuration
  isTaxable: boolean;
  taxConfigurationId?: string;
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
  id: string;
  productId: string;
  storeId: string;
  quantity: number; // Current stock quantity
  price: number; // Store-specific selling price
  location?: string; // Aisle, bin, etc.
  createdAt: string;
  updatedAt: string;

  // Related entities (populated via joins)
  product?: Product;
  store?: Store;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientContactId?: string;
  storeId: string;

  // Contact info (captured at time of invoice)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

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
  clientContact?: ClientContact;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Re-export accounting types
export * from './accounting';
