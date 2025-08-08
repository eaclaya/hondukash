import { Quote, QuoteItem, CreateQuoteRequest, UpdateQuoteRequest, ConvertQuoteToInvoiceRequest, PaginationParams, PaginatedResponse } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { quotes, quoteItems, clients, products, stores, invoices, invoiceItems } from '@/lib/db/schema/tenant';
import { eq, and, desc, like, or, count, sql } from 'drizzle-orm';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class QuoteService {
  // =====================================================
  // QUOTE CRUD OPERATIONS
  // =====================================================

  static async getAllQuotes(domain: string, storeId?: number, params?: PaginationParams): Promise<ServiceResult<PaginatedResponse<Quote>>> {
    try {
      const db = await getTenantDb(domain);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const search = params?.search?.trim();
      const offset = (page - 1) * limit;

      // Build where conditions
      const queryConditions = [];
      if (storeId) {
        queryConditions.push(eq(quotes.storeId, storeId));
      }

      if (search) {
        const searchConditions = or(
          like(quotes.quoteNumber, `%${search}%`),
          like(clients.name, `%${search}%`),
          like(quotes.status, `%${search}%`)
        );
        queryConditions.push(searchConditions);
      }

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(quotes)
        .leftJoin(clients, eq(clients.id, quotes.clientId))
        .where(queryConditions.length > 0 ? and(...queryConditions) : undefined);

      const totalCount = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Query quotes with related data
      const quotesResult = await db
        .select({
          // Quote fields
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          quoteDate: quotes.quoteDate,
          validUntil: quotes.validUntil,
          subtotal: quotes.subtotal,
          taxAmount: quotes.taxAmount,
          discountAmount: quotes.discountAmount,
          totalAmount: quotes.totalAmount,
          status: quotes.status,
          convertedToInvoiceId: quotes.convertedToInvoiceId,
          convertedAt: quotes.convertedAt,
          notes: quotes.notes,
          terms: quotes.terms,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          // Related data
          clientId: quotes.clientId,
          clientName: clients.name,
          storeId: quotes.storeId
        })
        .from(quotes)
        .leftJoin(clients, eq(clients.id, quotes.clientId))
        .where(queryConditions.length > 0 ? and(...queryConditions) : undefined)
        .orderBy(desc(quotes.createdAt))
        .limit(limit)
        .offset(offset);

      // Transform the data to match the expected interface
      const transformedQuotes: Quote[] = quotesResult.map(quote => ({
        id: quote.id.toString(),
        number: quote.quoteNumber,
        clientId: quote.clientId.toString(),
        storeId: quote.storeId.toString(),
        clientName: quote.clientName || undefined,
        items: [], // Will be loaded separately if needed
        subtotal: quote.subtotal,
        tax: quote.taxAmount,
        discount: quote.discountAmount,
        total: quote.totalAmount,
        status: quote.status as 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted',
        convertedToInvoiceId: quote.convertedToInvoiceId?.toString(),
        convertedAt: quote.convertedAt || undefined,
        quoteDate: quote.quoteDate,
        validUntil: quote.validUntil || undefined,
        notes: quote.notes || undefined,
        terms: quote.terms || undefined,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        client: quote.clientName ? {
          id: quote.clientId,
          name: quote.clientName,
          storeId: quote.storeId,
          clientType: 'individual' as const,
          country: 'Honduras',
          creditLimit: 0,
          paymentTerms: 30,
          discountPercentage: 0,
          isActive: true,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        } : undefined
      }));

      return {
        success: true,
        data: {
          data: transformedQuotes,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      };
    } catch (error: unknown) {
      console.error('QuoteService.getAllQuotes error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async getQuoteById(domain: string, quoteId: number): Promise<ServiceResult<Quote>> {
    try {
      const db = await getTenantDb(domain);

      // Get quote with client data
      const quoteResult = await db
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          quoteDate: quotes.quoteDate,
          validUntil: quotes.validUntil,
          subtotal: quotes.subtotal,
          taxAmount: quotes.taxAmount,
          discountAmount: quotes.discountAmount,
          totalAmount: quotes.totalAmount,
          status: quotes.status,
          convertedToInvoiceId: quotes.convertedToInvoiceId,
          convertedAt: quotes.convertedAt,
          notes: quotes.notes,
          terms: quotes.terms,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          clientId: quotes.clientId,
          storeId: quotes.storeId,
          clientName: clients.name
        })
        .from(quotes)
        .leftJoin(clients, eq(clients.id, quotes.clientId))
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!quoteResult[0]) {
        return { success: false, error: 'Quote not found' };
      }

      const quote = quoteResult[0];

      // Get quote items
      const itemsResult = await db
        .select({
          id: quoteItems.id,
          productId: quoteItems.productId,
          description: quoteItems.description,
          quantity: quoteItems.quantity,
          unitPrice: quoteItems.unitPrice,
          lineTotal: quoteItems.lineTotal,
          productName: products.name
        })
        .from(quoteItems)
        .leftJoin(products, eq(products.id, quoteItems.productId))
        .where(eq(quoteItems.quoteId, quoteId));

      const items: QuoteItem[] = itemsResult.map(item => ({
        id: item.id.toString(),
        productId: item.productId?.toString() || '',
        productName: item.productName || item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal || 0
      }));

      const transformedQuote: Quote = {
        id: quote.id.toString(),
        number: quote.quoteNumber,
        clientId: quote.clientId.toString(),
        storeId: quote.storeId.toString(),
        clientName: quote.clientName || undefined,
        items,
        subtotal: quote.subtotal,
        tax: quote.taxAmount,
        discount: quote.discountAmount,
        total: quote.totalAmount,
        status: quote.status as 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted',
        convertedToInvoiceId: quote.convertedToInvoiceId?.toString(),
        convertedAt: quote.convertedAt || undefined,
        quoteDate: quote.quoteDate,
        validUntil: quote.validUntil || undefined,
        notes: quote.notes || undefined,
        terms: quote.terms || undefined,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        client: quote.clientName ? {
          id: quote.clientId,
          name: quote.clientName,
          storeId: quote.storeId,
          clientType: 'individual' as const,
          country: 'Honduras',
          creditLimit: 0,
          paymentTerms: 30,
          discountPercentage: 0,
          isActive: true,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        } : undefined
      };

      return { success: true, data: transformedQuote };
    } catch (error: unknown) {
      console.error('QuoteService.getQuoteById error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async createQuote(domain: string, quoteData: CreateQuoteRequest): Promise<ServiceResult<Quote>> {
    try {
      const db = await getTenantDb(domain);

      // Generate quote number
      const storeResult = await db
        .select({ quotePrefix: stores.quotePrefix, quoteCounter: stores.quoteCounter })
        .from(stores)
        .where(eq(stores.id, quoteData.storeId))
        .limit(1);

      if (!storeResult[0]) {
        return { success: false, error: 'Store not found' };
      }

      const { quotePrefix, quoteCounter } = storeResult[0];
      const defaultPrefix = quotePrefix || '';
      const quoteNumber = `${defaultPrefix}${quoteCounter?.toString().padStart(6, '0')}`;
      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create quote
        const [newQuote] = await tx
          .insert(quotes)
          .values({
            storeId: quoteData.storeId,
            clientId: quoteData.clientId,
            quoteNumber,
            quoteDate: quoteData.quoteDate,
            validUntil: quoteData.validUntil || null,
            clientName: quoteData.clientName || null,
            subtotal: quoteData.subtotal,
            taxAmount: quoteData.tax,
            discountAmount: quoteData.discount,
            totalAmount: quoteData.total,
            status: quoteData.status || 'draft',
            notes: quoteData.notes || null,
            terms: quoteData.terms || null
          })
          .returning();

        // Create quote items
        if (quoteData.items.length > 0) {
          await tx.insert(quoteItems).values(
            quoteData.items
              .filter(item => item.productId && item.productId > 0) // Only items with valid productId
              .map(item => ({
                quoteId: newQuote.id,
                productId: item.productId,
                description: item.description || 'Quote item',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.total,
                taxRate: 0,
                taxAmount: 0
              }))
          );
        }

        // Update store quote counter
        await tx
          .update(stores)
          .set({ quoteCounter: quoteCounter + 1 })
          .where(eq(stores.id, quoteData.storeId));

        return newQuote;
      });

      // Fetch the created quote with full data
      const createdQuote = await this.getQuoteById(domain, result.id);
      return createdQuote;
    } catch (error: unknown) {
      console.error('QuoteService.createQuote error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async updateQuote(domain: string, quoteData: UpdateQuoteRequest): Promise<ServiceResult<Quote>> {
    try {
      const db = await getTenantDb(domain);

      await db.transaction(async (tx) => {
        // Update quote
        await tx
          .update(quotes)
          .set({
            clientId: quoteData.clientId,
            quoteDate: quoteData.quoteDate,
            validUntil: quoteData.validUntil || null,
            clientName: quoteData.clientName || null,
            subtotal: quoteData.subtotal,
            taxAmount: quoteData.tax,
            discountAmount: quoteData.discount,
            totalAmount: quoteData.total,
            status: quoteData.status,
            notes: quoteData.notes || null,
            terms: quoteData.terms || null,
            updatedAt: new Date().toISOString()
          })
          .where(eq(quotes.id, quoteData.id));

        // Update quote items if provided
        if (quoteData.items) {
          // Delete existing items
          await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteData.id));

          // Insert new items
          if (quoteData.items.length > 0) {
            await tx.insert(quoteItems).values(
              quoteData.items
                .filter(item => item.productId && item.productId > 0) // Only items with valid productId
                .map(item => ({
                  quoteId: quoteData.id,
                  productId: item.productId,
                  description: item.description || 'Quote item',
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

      // Fetch updated quote
      const updatedQuote = await this.getQuoteById(domain, quoteData.id);
      return updatedQuote;
    } catch (error: unknown) {
      console.error('QuoteService.updateQuote error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async deleteQuote(domain: string, quoteId: number): Promise<ServiceResult<void>> {
    try {
      const db = await getTenantDb(domain);

      await db.transaction(async (tx) => {
        // Delete quote items first
        await tx.delete(quoteItems).where(eq(quoteItems.quoteId, quoteId));

        // Delete quote
        await tx.delete(quotes).where(eq(quotes.id, quoteId));
      });

      return { success: true };
    } catch (error: unknown) {
      console.error('QuoteService.deleteQuote error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async updateQuoteStatus(domain: string, quoteId: number, status: string): Promise<ServiceResult<Quote>> {
    try {
      const db = await getTenantDb(domain);

      await db
        .update(quotes)
        .set({
          status,
          updatedAt: new Date().toISOString()
        })
        .where(eq(quotes.id, quoteId));

      // Fetch updated quote
      const updatedQuote = await this.getQuoteById(domain, quoteId);
      return updatedQuote;
    } catch (error: unknown) {
      console.error('QuoteService.updateQuoteStatus error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // =====================================================
  // QUOTE TO INVOICE CONVERSION
  // =====================================================

  static async convertQuoteToInvoice(domain: string, conversionData: ConvertQuoteToInvoiceRequest): Promise<ServiceResult<{ invoiceId: number; invoiceNumber: string; message: string }>> {
    try {
      const db = await getTenantDb(domain);

      // Get the quote to convert
      const quoteResult = await this.getQuoteById(domain, conversionData.quoteId);
      if (!quoteResult.success || !quoteResult.data) {
        return { success: false, error: 'Quote not found' };
      }

      const quote = quoteResult.data;

      // Check if quote can be converted
      if (quote.status === 'converted') {
        return { success: false, error: 'Quote has already been converted to an invoice' };
      }

      if (quote.status === 'declined' || quote.status === 'expired') {
        return { success: false, error: 'Cannot convert declined or expired quotes' };
      }

      // Generate invoice number
      const storeResult = await db
        .select({ invoicePrefix: stores.invoicePrefix, invoiceCounter: stores.invoiceCounter })
        .from(stores)
        .where(eq(stores.id, parseInt(quote.storeId)))
        .limit(1);

      if (!storeResult[0]) {
        return { success: false, error: 'Store not found' };
      }

      const { invoicePrefix, invoiceCounter } = storeResult[0];
      const invoiceNumber = `${invoicePrefix}-${invoiceCounter?.toString().padStart(6, '0')}`;

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create invoice from quote
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            storeId: parseInt(quote.storeId),
            clientId: parseInt(quote.clientId),
            invoiceNumber,
            invoiceDate: conversionData.invoiceDate || new Date().toISOString().split('T')[0],
            dueDate: conversionData.dueDate || null,
            clientName: quote.clientName || null,
            subtotal: quote.subtotal,
            taxAmount: quote.tax,
            discountAmount: quote.discount,
            totalAmount: quote.total,
            status: 'draft',
            paidAmount: 0,
            notes: quote.notes || null,
            terms: quote.terms || null
          })
          .returning();

        // Create invoice items from quote items
        if (quote.items.length > 0) {
          await tx.insert(invoiceItems).values(
            quote.items.map(item => ({
              invoiceId: newInvoice.id,
              productId: item.productId ? parseInt(item.productId) : null,
              description: item.productName || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal
            }))
          );
        }

        // Update quote status to converted and link to invoice
        await tx
          .update(quotes)
          .set({
            status: 'converted',
            convertedToInvoiceId: newInvoice.id,
            convertedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .where(eq(quotes.id, conversionData.quoteId));

        // Update store invoice counter
        await tx
          .update(stores)
          .set({ invoiceCounter: invoiceCounter + 1 })
          .where(eq(stores.id, parseInt(quote.storeId)));

        return newInvoice;
      });

      return {
        success: true,
        data: {
          invoiceId: result.id,
          invoiceNumber,
          message: 'Quote successfully converted to invoice'
        }
      };
    } catch (error: unknown) {
      console.error('QuoteService.convertQuoteToInvoice error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
}