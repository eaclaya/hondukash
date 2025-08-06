import { Invoice, InvoiceItem, CreateInvoiceRequest, UpdateInvoiceRequest, PaginationParams, PaginatedResponse } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { invoices, invoiceItems, clients, products, stores, inventory, inventoryMovements } from '@/lib/db/schema/tenant';
import { eq, and, desc, like, or, count, sql, inArray } from 'drizzle-orm';
import { InvoiceNumberService } from './invoiceNumberService';

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
    } catch (error: unknown) {
      console.error('InvoiceService.getAllInvoices error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getInvoiceById(domain: string, invoiceId: number): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      // Get invoice with client data
      const [invoice] = await db
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
          clientName: clients.name,
          storeId: invoices.storeId
        })
        .from(invoices)
        .leftJoin(clients, eq(clients.id, invoices.clientId))
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

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
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal
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
    } catch (error: unknown) {
      console.error('InvoiceService.getInvoiceById error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

static async createInvoice(domain: string, invoiceData: CreateInvoiceRequest): Promise<ServiceResult<Invoice>> {
    try {

      const db = await getTenantDb(domain);

      // Single optimized query to get store data and client name if needed
      const productIds = invoiceData.items.map(item => item.productId);

      const [storeResult, inventoryResult] = await Promise.all([
        // Get store configuration
        db.select({
          invoicePrefix: stores.invoicePrefix,
          invoiceCounter: stores.invoiceCounter,
          invoiceSequence: stores.invoiceSequence
        })
        .from(stores)
        .where(eq(stores.id, invoiceData.storeId))
        .limit(1),

        // Get inventory data for validation
        db.select({
          productId: inventory.productId,
          quantity: inventory.quantity,
          productName: products.name
        })
        .from(inventory)
        .innerJoin(products, eq(products.id, inventory.productId))
        .where(
          and(
            inArray(inventory.productId, productIds),
            eq(inventory.storeId, invoiceData.storeId)
          )
        ),

      ]);

      if (!storeResult[0]) {
        return { success: false, error: 'Store not found' };
      }

      // Validate stock availability
      const stockMap = new Map(inventoryResult.map(item => [item.productId, item]));
      for (const item of invoiceData.items) {
        const stockData = stockMap.get(item.productId);
        if (!stockData) {
          return { success: false, error: `Product with ID ${item.productId} not found in inventory` };
        }
        if (stockData.quantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${stockData.productName}. Available: ${stockData.quantity}, Required: ${item.quantity}`
          };
        }
      }

      // Generate invoice number using the dedicated service
      const invoiceNumberResult = InvoiceNumberService.generateNextInvoiceNumber(
        storeResult[0]
      );

      if (!invoiceNumberResult.success) {
        return { success: false, error: invoiceNumberResult.error };
      }

      const invoiceNumber = invoiceNumberResult.invoiceNumber!;
      const isSequenceEnabled = InvoiceNumberService.isSequenceEnabled(storeResult[0].invoiceSequence);

      // Create stock quantity map for movements
      const currentStockQuantities = new Map(inventoryResult.map(item => [item.productId, item.quantity]));

      // Single transaction with all operations
      const newInvoice = await db.transaction(async (tx) => {
        // Create invoice
        const [invoice] = await tx
          .insert(invoices)
          .values({
            storeId: invoiceData.storeId,
            clientId: invoiceData.clientId,
            invoiceNumber,
            clientName: invoiceData.clientName,
            invoiceDate: invoiceData.invoiceDate,
            dueDate: invoiceData.dueDate || null,
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

        // Create invoice items, update inventory, and movements in parallel
        const operations = [];

        if (invoiceData.items.length > 0) {
          // Insert invoice items
          operations.push(
            tx.insert(invoiceItems).values(
              invoiceData.items.map(item => ({
                invoiceId: invoice.id,
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.total,
                taxRate: 0,
                taxAmount: 0
              }))
            )
          );

          // Update inventory quantities
          const caseConditions = invoiceData.items.map(item =>
            `WHEN product_id = ${item.productId} THEN quantity - ${item.quantity}`
          ).join(' ');

          operations.push(
            tx.update(inventory)
              .set({
                quantity: sql.raw(`CASE ${caseConditions} ELSE quantity END`),
                updatedAt: new Date().toISOString()
              })
              .where(
                and(
                  inArray(inventory.productId, productIds),
                  eq(inventory.storeId, invoiceData.storeId)
                )
              )
          );

          // Create inventory movements
          const movementRecords = invoiceData.items.map(item => {
            const previousQty = currentStockQuantities.get(item.productId) || 0;
            return {
              productId: item.productId,
              storeId: invoiceData.storeId,
              movementType: 'out' as const,
              quantity: -item.quantity,
              previousQuantity: previousQty,
              newQuantity: previousQty - item.quantity,
              referenceType: 'invoice' as const,
              referenceId: invoice.id,
              referenceNumber: invoiceNumber,
              unitCost: item.unitPrice,
              totalValue: -item.quantity * item.unitPrice,
              notes: `Invoice sale - ${invoiceNumber}`,
              userId: null
            };
          });

          operations.push(tx.insert(inventoryMovements).values(movementRecords));
        }

        // Update store counter (for both traditional and sequence-based invoices)
        // Even sequence-based invoices need the counter to track position in sequence
        operations.push(
          tx.update(stores)
            .set({ invoiceCounter: (storeResult[0].invoiceCounter || 0) + 1 })
            .where(eq(stores.id, invoiceData.storeId))
        );

        // Execute all operations in parallel
        await Promise.all(operations);

        return invoice;
      });

      // Return created invoice data directly without additional queries
      const transformedInvoice: Invoice = {
        id: newInvoice.id.toString(),
        number: invoiceNumber,
        clientId: invoiceData.clientId.toString(),
        clientName: invoiceData.clientName,
        storeId: invoiceData.storeId.toString(),
        items: invoiceData.items.map((item, index) => ({
          id: (newInvoice.id * 1000 + index).toString(), // Generate predictable item ID
          productId: item.productId.toString(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.total
        })),
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        discount: invoiceData.discount,
        total: invoiceData.total,
        status: (invoiceData.status || 'draft') as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled',
        paidAmount: 0,
        balanceDue: invoiceData.total,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes,
        terms: invoiceData.terms,
        createdAt: newInvoice.createdAt,
        updatedAt: newInvoice.updatedAt,
        client: invoiceData.clientName ? {
          id: invoiceData.clientId,
          name: invoiceData.clientName,
          storeId: invoiceData.storeId,
          clientType: 'individual' as const,
          country: 'Honduras',
          creditLimit: 0,
          paymentTerms: 30,
          discountPercentage: 0,
          isActive: true,
          createdAt: newInvoice.createdAt,
          updatedAt: newInvoice.updatedAt
        } : undefined
      };

      return { success: true, data: transformedInvoice };
    } catch (error: unknown) {
      console.error('InvoiceService.createInvoice error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
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
              invoiceData.items
                .filter(item => item.productId && item.productId > 0) // Only items with valid productId
                .map(item => ({
                  invoiceId: invoiceData.id,
                  productId: item.productId,
                  description: '',
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  lineTotal: item.total,
                  taxRate: 0,
                  taxAmount: 0
                }))
            );
          }
        }
      });

      // Fetch updated invoice
      const updatedInvoice = await this.getInvoiceById(domain, invoiceData.id);
      return updatedInvoice;
    } catch (error: unknown) {
      console.error('InvoiceService.updateInvoice error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
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
    } catch (error: unknown) {
      console.error('InvoiceService.deleteInvoice error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async updateInvoiceStatus(domain: string, invoiceId: number, status: string, paidAmount?: number): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      const updateData: Record<string, unknown> = {
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
    } catch (error: unknown) {
      console.error('InvoiceService.updateInvoiceStatus error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
}