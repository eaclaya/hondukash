import { Invoice, InvoiceItem, CreateInvoiceRequest, UpdateInvoiceRequest, PaginationParams, PaginatedResponse } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { invoices, invoiceItems, clients, products, stores } from '@/lib/db/schema/tenant';
import { eq, and, desc, like, or, count, sql } from 'drizzle-orm';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class InvoiceService {
  // =====================================================
  // INVOICE CRUD OPERATIONS
  // =====================================================

  static async getAllInvoices(domain: string, storeId?: number, params?: PaginationParams): Promise<ServiceResult<PaginatedResponse<Invoice>>> {
    try {
      const db = await getTenantDb(domain);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const search = params?.search?.trim();
      const offset = (page - 1) * limit;

      // Build where conditions
      const queryConditions = [];
      if (storeId) {
        queryConditions.push(eq(invoices.storeId, storeId));
      }

      if (search) {
        const searchConditions = or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(clients.name, `%${search}%`),
          like(invoices.status, `%${search}%`)
        );
        queryConditions.push(searchConditions);
      }

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(queryConditions.length > 0 ? and(...queryConditions) : undefined);

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Query invoices with related data
      const invoicesResult = await db
        .select({
          // Invoice fields
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          subtotal: invoices.subtotal,
          taxAmount: invoices.taxAmount,
          discountAmount: invoices.discountAmount,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          status: invoices.status,
          notes: invoices.notes,
          terms: invoices.terms,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          // Related data
          clientId: invoices.clientId,
          clientName: clients.name,
          storeId: invoices.storeId
        })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(queryConditions.length > 0 ? and(...queryConditions) : undefined)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the data to match the expected interface
      const transformedInvoices: Invoice[] = invoicesResult.map(invoice => ({
        id: invoice.id.toString(),
        number: invoice.invoiceNumber,
        clientId: invoice.clientId.toString(),
        storeId: invoice.storeId.toString(),
        items: [], // Will be loaded separately if needed
        subtotal: invoice.subtotal,
        tax: invoice.taxAmount,
        discount: invoice.discountAmount,
        total: invoice.totalAmount,
        status: invoice.status as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled',
        paidAmount: invoice.paidAmount,
        balanceDue: invoice.totalAmount - invoice.paidAmount,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || undefined,
        notes: invoice.notes || undefined,
        terms: invoice.terms || undefined,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        client: invoice.clientName ? {
          id: invoice.clientId,
          name: invoice.clientName,
          storeId: invoice.storeId,
          clientType: 'individual' as const,
          country: 'Honduras',
          creditLimit: 0,
          paymentTerms: 30,
          discountPercentage: 0,
          isActive: true,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt
        } : undefined
      }));

      return {
        success: true,
        data: {
          data: transformedInvoices,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      };
    } catch (error: any) {
      console.error('InvoiceService.getAllInvoices error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getInvoiceById(domain: string, invoiceId: number): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      // Get invoice with client data
      const invoiceResult = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          subtotal: invoices.subtotal,
          taxAmount: invoices.taxAmount,
          discountAmount: invoices.discountAmount,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          status: invoices.status,
          notes: invoices.notes,
          terms: invoices.terms,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          clientId: invoices.clientId,
          storeId: invoices.storeId,
        })
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!invoiceResult[0]) {
        return { success: false, error: 'Invoice not found' };
      }

      const invoice = invoiceResult[0];

      // Get invoice items
      const itemsResult = await db
        .select({
          id: invoiceItems.id,
          productId: invoiceItems.productId,
          description: invoiceItems.description,
          quantity: invoiceItems.quantity,
          unitPrice: invoiceItems.unitPrice,
          lineTotal: invoiceItems.lineTotal,
          productName: products.name
        })
        .from(invoiceItems)
        .leftJoin(products, eq(products.id, invoiceItems.productId))
        .where(eq(invoiceItems.invoiceId, invoiceId));

      const items: InvoiceItem[] = itemsResult.map(item => ({
        id: item.id.toString(),
        productId: item.productId?.toString() || '',
        productName: item.productName || item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      }));

      const transformedInvoice: Invoice = {
        id: invoice.id.toString(),
        number: invoice.invoiceNumber,
        clientId: invoice.clientId.toString(),
        storeId: invoice.storeId.toString(),
        items,
        subtotal: invoice.subtotal,
        tax: invoice.taxAmount,
        discount: invoice.discountAmount,
        total: invoice.totalAmount,
        status: invoice.status as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled',
        paidAmount: invoice.paidAmount,
        balanceDue: invoice.totalAmount - invoice.paidAmount,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate || undefined,
        notes: invoice.notes || undefined,
        terms: invoice.terms || undefined,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        client: invoice.clientName ? {
          id: invoice.clientId,
          name: invoice.clientName,
          storeId: invoice.storeId,
          clientType: 'individual' as const,
          country: 'Honduras',
          creditLimit: 0,
          paymentTerms: 30,
          discountPercentage: 0,
          isActive: true,
          createdAt: invoice.createdAt,
          updatedAt: invoice.updatedAt
        } : undefined
      };

      return { success: true, data: transformedInvoice };
    } catch (error: any) {
      console.error('InvoiceService.getInvoiceById error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createInvoice(domain: string, invoiceData: CreateInvoiceRequest): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      // Generate invoice number
      const storeResult = await db
        .select({ invoicePrefix: stores.invoicePrefix, invoiceCounter: stores.invoiceCounter })
        .from(stores)
        .where(eq(stores.id, invoiceData.storeId))
        .limit(1);

      if (!storeResult[0]) {
        return { success: false, error: 'Store not found' };
      }

      const { invoicePrefix, invoiceCounter } = storeResult[0];
      const invoiceNumber = `${invoicePrefix}-${invoiceCounter?.toString().padStart(6, '0')}`;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create invoice
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            storeId: invoiceData.storeId,
            clientId: invoiceData.clientId,
            invoiceNumber,
            invoiceDate: invoiceData.invoiceDate,
            dueDate: invoiceData.dueDate || null,
            clientName: invoiceData.clientName || null,
            subtotal: invoiceData.subtotal,
            taxAmount: invoiceData.tax,
            discountAmount: invoiceData.discount,
            totalAmount: invoiceData.total,
            paidAmount: 0,
            status: invoiceData.status || 'draft',
            notes: invoiceData.notes || null,
            terms: invoiceData.terms || null
          })
          .returning();

        // Create invoice items
        if (invoiceData.items.length > 0) {
          await tx.insert(invoiceItems).values(
            invoiceData.items.map(item => ({
              invoiceId: newInvoice.id,
              productId: item.productId,
              description: '', // Will be filled from product name
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.total
            }))
          );
        }

        // Update store invoice counter
        await tx
          .update(stores)
          .set({ invoiceCounter: invoiceCounter + 1 })
          .where(eq(stores.id, invoiceData.storeId));

        return newInvoice;
      });

      // Fetch the created invoice with full data
      const createdInvoice = await this.getInvoiceById(domain, result.id);
      console.log('CREATED INVOICE', createdInvoice)
      return createdInvoice;
    } catch (error: any) {
      console.error('InvoiceService.createInvoice error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateInvoice(domain: string, invoiceData: UpdateInvoiceRequest): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      await db.transaction(async (tx) => {
        // Update invoice
        await tx
          .update(invoices)
          .set({
            clientId: invoiceData.clientId,
            invoiceDate: invoiceData.invoiceDate,
            dueDate: invoiceData.dueDate || null,
            clientName: invoiceData.clientName || null,
            subtotal: invoiceData.subtotal,
            taxAmount: invoiceData.tax,
            discountAmount: invoiceData.discount,
            totalAmount: invoiceData.total,
            status: invoiceData.status,
            notes: invoiceData.notes || null,
            terms: invoiceData.terms || null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(invoices.id, invoiceData.id));

        // Update invoice items if provided
        if (invoiceData.items) {
          // Delete existing items
          await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceData.id));

          // Insert new items
          if (invoiceData.items.length > 0) {
            await tx.insert(invoiceItems).values(
              invoiceData.items.map(item => ({
                invoiceId: invoiceData.id,
                productId: item.productId,
                description: '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.total
              }))
            );
          }
        }
      });

      // Fetch updated invoice
      const updatedInvoice = await this.getInvoiceById(domain, invoiceData.id);
      return updatedInvoice;
    } catch (error: any) {
      console.error('InvoiceService.updateInvoice error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteInvoice(domain: string, invoiceId: number): Promise<ServiceResult<void>> {
    try {
      const db = await getTenantDb(domain);

      await db.transaction(async (tx) => {
        // Delete invoice items first
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

        // Delete invoice
        await tx.delete(invoices).where(eq(invoices.id, invoiceId));
      });

      return { success: true };
    } catch (error: any) {
      console.error('InvoiceService.deleteInvoice error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateInvoiceStatus(domain: string, invoiceId: number, status: string, paidAmount?: number): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (paidAmount !== undefined) {
        updateData.paidAmount = paidAmount;
      }

      await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, invoiceId));

      // Fetch updated invoice
      const updatedInvoice = await this.getInvoiceById(domain, invoiceId);
      return updatedInvoice;
    } catch (error: any) {
      console.error('InvoiceService.updateInvoiceStatus error:', error);
      return { success: false, error: error.message };
    }
  }
}