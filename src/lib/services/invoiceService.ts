import { Invoice, InvoiceItem, CreateInvoiceRequest, UpdateInvoiceRequest, PaginationParams, PaginatedResponse } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { invoices, invoiceItems, clients, products, stores, inventory, inventoryMovements } from '@/lib/db/schema/tenant';
import { eq, and, desc, like, or, count, sql, inArray } from 'drizzle-orm';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class InvoiceService {
  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Validates stock availability for invoice items (optimized single query)
   */
  private static async validateStockAvailability(
    db: any,
    items: { productId: number; quantity: number }[],
    storeId: number
  ): Promise<{ success: boolean; error?: string }> {
    // Get all product IDs for the query
    const productIds = items.map(item => item.productId);

    // Single query to get all inventory data
    const inventoryResult = await db
      .select({
        productId: inventory.productId,
        quantity: inventory.quantity,
        productName: products.name
      })
      .from(inventory)
      .innerJoin(products, eq(products.id, inventory.productId))
      .where(
        and(
          inArray(inventory.productId, productIds),
          eq(inventory.storeId, storeId)
        )
      );

    // Create a map for quick lookup
    const stockMap = new Map<number, { quantity: number; name: string }>(
      inventoryResult.map(item => [item.productId, { quantity: item.quantity, name: item.productName }])
    );

    // Check each item against the stock data
    for (const item of items) {
      const stockData = stockMap.get(item.productId);

      if (!stockData) {
        return { success: false, error: `Product with ID ${item.productId} not found in inventory` };
      }

      if (stockData.quantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${stockData.name}. Available: ${stockData.quantity}, Required: ${item.quantity}`
        };
      }
    }

    return { success: true };
  }

  /**
   * Creates inventory movement records for invoice items
   */
  private static async createInventoryMovements(
    tx: any,
    invoiceId: number,
    invoiceNumber: string,
    items: { productId: number; quantity: number; unitPrice: number }[],
    storeId: number,
    currentStock: Map<number, number>,
    userId?: number
  ): Promise<void> {
    const movementRecords = items.map(item => {
      const previousQty = currentStock.get(item.productId) || 0;
      const newQty = previousQty - item.quantity;
      
      return {
        productId: item.productId,
        storeId,
        movementType: 'out' as const,
        quantity: -item.quantity, // Negative for outbound
        previousQuantity: previousQty,
        newQuantity: newQty,
        referenceType: 'invoice' as const,
        referenceId: invoiceId,
        referenceNumber: invoiceNumber,
        unitCost: item.unitPrice,
        totalValue: -item.quantity * item.unitPrice, // Negative for outbound value
        notes: `Invoice sale - ${invoiceNumber}`,
        userId: userId || null
      };
    });

    if (movementRecords.length > 0) {
      await tx.insert(inventoryMovements).values(movementRecords);
    }
  }

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
    } catch (error: any) {
      console.error('InvoiceService.getInvoiceById error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createInvoice(domain: string, invoiceData: CreateInvoiceRequest): Promise<ServiceResult<Invoice>> {
    try {
      const db = await getTenantDb(domain);

      // Generate invoice number (check for sequence or use prefix)
      const storeResult = await db
        .select({
          invoicePrefix: stores.invoicePrefix,
          invoiceCounter: stores.invoiceCounter,
          invoiceSequence: stores.invoiceSequence
        })
        .from(stores)
        .where(eq(stores.id, invoiceData.storeId))
        .limit(1);

      if (!storeResult[0]) {
        return { success: false, error: 'Store not found' };
      }

      // Check stock availability and get current stock levels for movement tracking
      const productIds = invoiceData.items.map(item => item.productId);
      const currentStockResult = await db
        .select({
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
        );

      // Create stock map for validation and movement tracking
      const currentStockMap = new Map<number, { quantity: number; name: string }>(
        currentStockResult.map(item => [item.productId, { quantity: item.quantity, name: item.productName }])
      );

      // Validate stock availability
      for (const item of invoiceData.items) {
        const stockData = currentStockMap.get(item.productId);

        if (!stockData) {
          return { success: false, error: `Product with ID ${item.productId} not found in inventory` };
        }

        if (stockData.quantity < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${stockData.name}. Available: ${stockData.quantity}, Required: ${item.quantity}`
          };
        }
      }

      // Create simple map for movement tracking
      const currentStockQuantities = new Map<number, number>(
        currentStockResult.map(item => [item.productId, item.quantity])
      );

      const { invoicePrefix, invoiceCounter, invoiceSequence } = storeResult[0];

      let invoiceNumber: string;
      let sequenceData = null;
      let defaultPrefix = invoicePrefix || '';

      // Check if invoice sequence is enabled
      if (invoiceSequence) {
        try {
          sequenceData = JSON.parse(invoiceSequence);

          if (sequenceData?.enabled) {
            // Check if sequence has expired
            if (sequenceData.limit_date) {
              const limitDate = new Date(sequenceData.limit_date);
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              limitDate.setHours(0, 0, 0, 0);

              if (currentDate >= limitDate) {
                return { success: false, error: 'Invoice sequence has expired. Please update the sequence configuration.' };
              }
            }

            // Extract start and end numbers from patterns
            const startMatch = sequenceData.sequence_start.match(/(\d+)$/);
            const endMatch = sequenceData.sequence_end.match(/(\d+)$/);

            if (!startMatch || !endMatch) {
              return { success: false, error: 'Invalid sequence pattern. Sequence start and end must contain numbers at the end.' };
            }

            const startNum = parseInt(startMatch[1]);
            const endNum = parseInt(endMatch[1]);

            // Get current counter from existing invoices or start from beginning
            const lastInvoiceResult = await db
              .select({ invoiceNumber: invoices.invoiceNumber })
              .from(invoices)
              .where(eq(invoices.storeId, invoiceData.storeId))
              .orderBy(desc(invoices.id))
              .limit(1);

            let currentNum = startNum;
            if (lastInvoiceResult.length > 0) {
              const lastInvoiceNumber = lastInvoiceResult[0].invoiceNumber;
              // Check if last invoice uses sequence pattern
              const sequencePrefix = sequenceData.sequence_start.replace(/\d+$/, '');
              if (lastInvoiceNumber.startsWith(sequencePrefix)) {
                const lastNumMatch = lastInvoiceNumber.match(/(\d+)$/);
                if (lastNumMatch) {
                  currentNum = parseInt(lastNumMatch[1]) + 1;
                }
              }
            }

            // Check if we've reached the sequence end
            if (currentNum > endNum) {
              return { success: false, error: `Invoice sequence has reached its maximum number (${endNum}). Please configure a new sequence.` };
            }

            // Generate sequence-based number
            const sequencePrefix = sequenceData.sequence_start.replace(/\d+$/, '');
            const numberPadding = startMatch[1].length;
            invoiceNumber = sequencePrefix + currentNum.toString().padStart(numberPadding, '0');

          } else {
            // Use traditional prefix + counter
            invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
          }
        } catch (error) {
          // If JSON parsing fails, fall back to prefix + counter
          invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
        }
      } else {
        // Use traditional prefix + counter
        invoiceNumber = `${defaultPrefix}${invoiceCounter?.toString().padStart(6, '0')}`;
      }

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
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.total,
              taxRate: 0,
              taxAmount: 0
            }))
          );

          // Update inventory quantities (deduct stock) - optimized single query
          const productIds = invoiceData.items.map(item => item.productId);
          
          // Build CASE statement for quantity updates
          const caseConditions = invoiceData.items.map(item => 
            `WHEN product_id = ${item.productId} THEN quantity - ${item.quantity}`
          ).join(' ');
          
          await tx
            .update(inventory)
            .set({
              quantity: sql.raw(`CASE ${caseConditions} ELSE quantity END`),
              updatedAt: new Date().toISOString()
            })
            .where(
              and(
                inArray(inventory.productId, productIds),
                eq(inventory.storeId, invoiceData.storeId)
              )
            );

          // Create inventory movement records
          await this.createInventoryMovements(
            tx,
            newInvoice.id,
            invoiceNumber,
            invoiceData.items,
            invoiceData.storeId,
            currentStockQuantities,
            undefined // TODO: Pass userId when available in request context
          );
        }

        // Update store counter (only for traditional prefix-based invoices)
        if (!sequenceData?.enabled) {
          // Update traditional invoice counter
          await tx
            .update(stores)
            .set({ invoiceCounter: (invoiceCounter || 0) + 1 })
            .where(eq(stores.id, invoiceData.storeId));
        }
        // Note: For sequence-based invoices, counter is derived from existing invoice numbers

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