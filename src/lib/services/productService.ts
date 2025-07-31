import { Product, ProductWithInventory, Inventory, CreateProductRequest, UpdateProductRequest } from '@/lib/types';
import { getTenantDb } from '@/lib/turso';
import { products, inventory, categories } from '@/lib/db/schema/tenant';
import { eq, and, desc, sql } from 'drizzle-orm';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProductService {
  // =====================================================
  // PRODUCT CRUD OPERATIONS
  // =====================================================

  static async getAllProducts(domain: string, storeId?: number): Promise<ServiceResult<ProductWithInventory[]>> {
    try {
      const db = await getTenantDb(domain);

      if (!storeId) {
        return { success: false, error: 'Store ID is required' };
      }

      // Query products with inventory data for the specific store
      const productsWithInventory = await db
        .select({
          // Product fields
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          barcode: products.barcode,
          categoryId: products.categoryId,
          baseCost: products.baseCost,
          cost: products.cost,
          basePrice: products.basePrice,
          price: products.price,
          minPrice: products.minPrice,
          isTaxable: products.isTaxable,
          taxConfigurationId: products.taxConfigurationId,
          taxRate: products.taxRate,
          trackInventory: products.trackInventory,
          unit: products.unit,
          imageUrl: products.imageUrl,
          images: products.images,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          // Inventory fields (store-specific)
          inventoryId: inventory.id,
          quantity: sql<number>`COALESCE(${inventory.quantity}, 0)`.as('quantity'),
          storePrice: sql<number>`COALESCE(${inventory.price}, ${products.price})`.as('storePrice'),
          location: inventory.location,
          // Category name
          categoryName: categories.name
        })
        .from(products)
        .leftJoin(
          inventory, 
          sql`${inventory.productId} = ${products.id} AND ${inventory.storeId} = ${storeId}`
        )
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .where(eq(products.isActive, true))
        .orderBy(products.name);

      // Transform the data to match the expected interface
      const transformedProducts: ProductWithInventory[] = productsWithInventory.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        sku: product.sku || undefined,
        barcode: product.barcode || undefined,
        categoryId: product.categoryId || undefined,
        categoryName: product.categoryName || undefined,
        baseCost: product.baseCost,
        cost: product.cost,
        basePrice: product.basePrice,
        price: product.price,
        minPrice: product.minPrice,
        isTaxable: product.isTaxable,
        taxConfigurationId: product.taxConfigurationId || undefined,
        taxRate: product.taxRate || undefined,
        trackInventory: product.trackInventory,
        unit: product.unit,
        imageUrl: product.imageUrl || undefined,
        images: product.images && product.images !== 'null' ? JSON.parse(product.images) : [],
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Inventory data for the selected store
        inventory: {
          id: product.inventoryId || undefined,
          productId: product.id,
          storeId: storeId,
          quantity: product.quantity,
          price: product.storePrice, // Use store-specific price or fall back to product price
          location: product.location || undefined,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      }));

      return { success: true, data: transformedProducts };
    } catch (error: any) {
      console.error('ProductService.getAllProducts error:', error);
      return { success: false, error: error.message };
    }
  }

  static async getProductById(domain: string, productId: number, storeId?: number): Promise<ServiceResult<ProductWithInventory>> {
    try {
      const db = await getTenantDb(domain);

      if (!storeId) {
        return { success: false, error: 'Store ID is required' };
      }

      // Query single product with inventory data for the specific store
      const productResult = await db
        .select({
          // Product fields
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          barcode: products.barcode,
          categoryId: products.categoryId,
          baseCost: products.baseCost,
          cost: products.cost,
          basePrice: products.basePrice,
          price: products.price,
          minPrice: products.minPrice,
          isTaxable: products.isTaxable,
          taxConfigurationId: products.taxConfigurationId,
          taxRate: products.taxRate,
          trackInventory: products.trackInventory,
          unit: products.unit,
          imageUrl: products.imageUrl,
          images: products.images,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          // Inventory fields (store-specific)
          inventoryId: inventory.id,
          quantity: sql<number>`COALESCE(${inventory.quantity}, 0)`.as('quantity'),
          storePrice: sql<number>`COALESCE(${inventory.price}, ${products.price})`.as('storePrice'),
          location: inventory.location,
          // Category name
          categoryName: categories.name
        })
        .from(products)
        .leftJoin(
          inventory, 
          sql`${inventory.productId} = ${products.id} AND ${inventory.storeId} = ${storeId}`
        )
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .where(eq(products.id, productId))
        .limit(1);

      if (!productResult[0]) {
        return { success: false, error: 'Product not found' };
      }

      const product = productResult[0];

      // Transform the data to match the expected interface
      const transformedProduct: ProductWithInventory = {
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        sku: product.sku || undefined,
        barcode: product.barcode || undefined,
        categoryId: product.categoryId || undefined,
        categoryName: product.categoryName || undefined,
        baseCost: product.baseCost,
        cost: product.cost,
        basePrice: product.basePrice,
        price: product.price,
        minPrice: product.minPrice,
        isTaxable: product.isTaxable,
        taxConfigurationId: product.taxConfigurationId || undefined,
        taxRate: product.taxRate || undefined,
        trackInventory: product.trackInventory,
        unit: product.unit,
        imageUrl: product.imageUrl || undefined,
        images: product.images && product.images !== 'null' ? JSON.parse(product.images) : [],
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Inventory data for the selected store
        inventory: {
          id: product.inventoryId || undefined,
          productId: product.id,
          storeId: storeId,
          quantity: product.quantity,
          price: product.storePrice,
          location: product.location || undefined,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      };

      return { success: true, data: transformedProduct };
    } catch (error: any) {
      console.error('ProductService.getProductById error:', error);
      return { success: false, error: error.message };
    }
  }

  static async createProduct(domain: string, productData: CreateProductRequest, storeId: number): Promise<ServiceResult<ProductWithInventory>> {
    try {
      const db = await getTenantDb(domain);

      // Start a transaction to create both product and inventory record
      const result = await db.transaction(async (tx) => {
        // Create the product
        const [newProduct] = await tx
          .insert(products)
          .values({
            name: productData.name,
            description: productData.description || null,
            sku: productData.sku || null,
            barcode: productData.barcode || null,
            categoryId: productData.categoryId || null,
            baseCost: productData.baseCost || 0,
            cost: productData.cost || 0,
            basePrice: productData.basePrice || 0,
            price: productData.price,
            minPrice: productData.minPrice || 0,
            isTaxable: productData.isTaxable !== false,
            taxConfigurationId: productData.taxConfigurationId || null,
            taxRate: productData.taxRate || null,
            trackInventory: productData.trackInventory !== false,
            unit: productData.unit || 'unit',
            imageUrl: productData.imageUrl || null,
            images: productData.images ? JSON.stringify(productData.images) : '[]',
            isActive: true
          })
          .returning();

        // Create inventory record for the store if trackInventory is true
        if (productData.trackInventory !== false) {
          await tx
            .insert(inventory)
            .values({
              productId: newProduct.id,
              storeId: storeId,
              quantity: productData.quantity || 0,
              price: productData.storePrice || productData.price,
              location: productData.location || null
            });
        }

        return newProduct;
      });

      // Fetch the created product with inventory
      const productResult = await this.getProductById(domain, result.id, storeId);
      if (!productResult.success || !productResult.data) {
        return { success: false, error: 'Failed to fetch created product' };
      }

      return { success: true, data: productResult.data };
    } catch (error: any) {
      console.error('ProductService.createProduct error:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateProduct(domain: string, productData: UpdateProductRequest, storeId: number): Promise<ServiceResult<ProductWithInventory>> {
    try {
      const db = await getTenantDb(domain);

      const updateData: any = {};

      // Update product fields
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.description !== undefined) updateData.description = productData.description;
      if (productData.sku !== undefined) updateData.sku = productData.sku;
      if (productData.barcode !== undefined) updateData.barcode = productData.barcode;
      if (productData.categoryId !== undefined) updateData.categoryId = productData.categoryId;
      if (productData.baseCost !== undefined) updateData.baseCost = productData.baseCost;
      if (productData.cost !== undefined) updateData.cost = productData.cost;
      if (productData.basePrice !== undefined) updateData.basePrice = productData.basePrice;
      if (productData.price !== undefined) updateData.price = productData.price;
      if (productData.minPrice !== undefined) updateData.minPrice = productData.minPrice;
      if (productData.isTaxable !== undefined) updateData.isTaxable = productData.isTaxable;
      if (productData.taxConfigurationId !== undefined) updateData.taxConfigurationId = productData.taxConfigurationId;
      if (productData.taxRate !== undefined) updateData.taxRate = productData.taxRate;
      if (productData.trackInventory !== undefined) updateData.trackInventory = productData.trackInventory;
      if (productData.unit !== undefined) updateData.unit = productData.unit;
      if (productData.imageUrl !== undefined) updateData.imageUrl = productData.imageUrl;
      if (productData.images !== undefined) updateData.images = JSON.stringify(productData.images);

      if (Object.keys(updateData).length === 0 && 
          productData.quantity === undefined && 
          productData.storePrice === undefined && 
          productData.location === undefined) {
        return { success: false, error: 'No fields to update' };
      }

      updateData.updatedAt = new Date().toISOString();

      await db.transaction(async (tx) => {
        // Update product if there are product fields to update
        if (Object.keys(updateData).length > 1) { // More than just updatedAt
          await tx.update(products).set(updateData).where(eq(products.id, productData.id));
        }

        // Update inventory if there are inventory fields to update
        if (productData.quantity !== undefined || 
            productData.storePrice !== undefined || 
            productData.location !== undefined) {
          
          const inventoryUpdateData: any = {};
          if (productData.quantity !== undefined) inventoryUpdateData.quantity = productData.quantity;
          if (productData.storePrice !== undefined) inventoryUpdateData.price = productData.storePrice;
          if (productData.location !== undefined) inventoryUpdateData.location = productData.location;
          inventoryUpdateData.updatedAt = new Date().toISOString();

          // Try to update existing inventory record
          const existingInventory = await tx.query.inventory.findFirst({
            where: and(eq(inventory.productId, productData.id), eq(inventory.storeId, storeId))
          });

          if (existingInventory) {
            await tx.update(inventory)
              .set(inventoryUpdateData)
              .where(and(eq(inventory.productId, productData.id), eq(inventory.storeId, storeId)));
          } else {
            // Create new inventory record if it doesn't exist
            await tx.insert(inventory).values({
              productId: productData.id,
              storeId: storeId,
              quantity: productData.quantity || 0,
              price: productData.storePrice || 0,
              location: productData.location || null
            });
          }
        }
      });

      // Fetch the updated product
      const productResult = await this.getProductById(domain, productData.id, storeId);
      if (!productResult.success || !productResult.data) {
        return { success: false, error: 'Failed to fetch updated product' };
      }

      return { success: true, data: productResult.data };
    } catch (error: any) {
      console.error('ProductService.updateProduct error:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteProduct(domain: string, productId: number): Promise<ServiceResult<void>> {
    try {
      const db = await getTenantDb(domain);

      // Delete inventory records first (due to foreign key constraint)
      await db.delete(inventory).where(eq(inventory.productId, productId));
      
      // Then delete the product
      await db.delete(products).where(eq(products.id, productId));

      return { success: true };
    } catch (error: any) {
      console.error('ProductService.deleteProduct error:', error);
      return { success: false, error: error.message };
    }
  }
}