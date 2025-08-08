import { getTenantDb } from '@/lib/turso';
import { tags, products, clients, invoices, quotes } from '@/lib/db/schema/tenant';
import { eq, and, sql, like, or, count, desc, asc } from 'drizzle-orm';

// Types
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'invoice' | 'quote' | 'custom';
  isActive: boolean;
  sortOrder: number;
}

interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
  category?: 'general' | 'client' | 'product' | 'invoice' | 'quote' | 'custom';
  sortOrder?: number;
  isActive?: boolean;
}

export class SimpleTagService {
  // =====================================================
  // TAG CRUD OPERATIONS (unchanged from original)
  // =====================================================

  static async getAllTags(domain: string, params?: PaginationParams): Promise<ServiceResult<PaginatedResponse<Tag>>> {
    try {
      const db = await getTenantDb(domain);

      const page = params?.page || 1;
      const limit = Math.min(params?.limit || 50, 100);
      const search = params?.search?.trim();
      const sortBy = params?.sortBy || 'name';
      const sortOrder = params?.sortOrder || 'asc';
      const offset = (page - 1) * limit;

      // Build where conditions
      let whereConditions = and(
        eq(tags.isActive, true)
      );

      if (search) {
        const searchConditions = or(
          like(tags.name, `%${search}%`),
          like(tags.description, `%${search}%`)
        );
        whereConditions = and(whereConditions, searchConditions);
      }

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(tags)
        .where(whereConditions);

      const totalCount = totalCountResult[0]?.count || 0;

      // Build sort condition
      const sortField = (tags as any)[sortBy] || tags.name;
      const sortCondition = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

      // Get paginated results
      const tagList = await db
        .select()
        .from(tags)
        .where(whereConditions)
        .limit(limit)
        .offset(offset)
        .orderBy(sortCondition);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          data: tagList as Tag[],
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      };

    } catch (error: unknown) {
      console.error('Get all tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags'
      };
    }
  }

  static async createTag(domain: string, tagData: CreateTagRequest): Promise<ServiceResult<Tag>> {
    try {
      const db = await getTenantDb(domain);

      // Check if tag name already exists
      const existingTag = await db
        .select()
        .from(tags)
        .where(and(
          eq(tags.name, tagData.name)
        ))
        .limit(1);

      if (existingTag.length > 0) {
        return {
          success: false,
          error: 'A tag with this name already exists'
        };
      }

      // Create tag
      const newTag = await db.insert(tags).values({
        name: tagData.name,
        description: tagData.description || null,
        color: tagData.color || '#3B82F6',
        category: tagData.category || 'general',
        isActive: tagData.isActive ?? true,
        sortOrder: tagData.sortOrder || 0
      }).returning();

      return {
        success: true,
        data: newTag[0] as Tag
      };

    } catch (error: unknown) {
      console.error('Create tag error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag'
      };
    }
  }

  // =====================================================
  // SIMPLIFIED TAG OPERATIONS FOR ENTITIES
  // =====================================================

  static async getEntityTags(
    domain: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number
  ): Promise<ServiceResult<Tag[]>> {
    try {
      const db = await getTenantDb(domain);

      // Get entity with tags
      let entityResult;
      switch (entityType) {
        case 'client':
          entityResult = await db.select({ tags: clients.tags }).from(clients).where(eq(clients.id, entityId)).limit(1);
          break;
        case 'product':
          entityResult = await db.select({ tags: products.tags }).from(products).where(eq(products.id, entityId)).limit(1);
          break;
        case 'invoice':
          entityResult = await db.select({ tags: invoices.tags }).from(invoices).where(eq(invoices.id, entityId)).limit(1);
          break;
        case 'quote':
          entityResult = await db.select({ tags: quotes.tags }).from(quotes).where(eq(quotes.id, entityId)).limit(1);
          break;
      }

      if (!entityResult || entityResult.length === 0) {
        return {
          success: false,
          error: `${entityType} not found`
        };
      }

      const entityTagsString = entityResult[0].tags;
      if (!entityTagsString) {
        return {
          success: true,
          data: []
        };
      }

      // Parse tag names from JSON string
      let tagNames: string[];
      try {
        tagNames = JSON.parse(entityTagsString);
      } catch {
        // Fallback: treat as comma-separated string
        tagNames = entityTagsString.split(',').map(name => name.trim()).filter(name => name.length > 0);
      }

      if (tagNames.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      // Get full tag objects
      const entityTags = await db
        .select()
        .from(tags)
        .where(and(
          sql`${tags.name} IN (${tagNames.map(() => '?').join(', ')})`,
          eq(tags.isActive, true)
        ))
        .orderBy(asc(tags.sortOrder), asc(tags.name));

      return {
        success: true,
        data: entityTags as Tag[]
      };

    } catch (error: unknown) {
      console.error('Get entity tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch entity tags'
      };
    }
  }

  static async updateEntityTags(
    domain: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number,
    tagNames: string[]
  ): Promise<ServiceResult<boolean>> {
    try {
      const db = await getTenantDb(domain);

      // Convert tag names to JSON string
      const tagsJson = JSON.stringify(tagNames);

      // Update the appropriate table
      switch (entityType) {
        case 'client':
          await db.update(clients).set({ tags: tagsJson }).where(eq(clients.id, entityId));
          break;
        case 'product':
          await db.update(products).set({ tags: tagsJson }).where(eq(products.id, entityId));
          break;
        case 'invoice':
          await db.update(invoices).set({ tags: tagsJson }).where(eq(invoices.id, entityId));
          break;
        case 'quote':
          await db.update(quotes).set({ tags: tagsJson }).where(eq(quotes.id, entityId));
          break;
      }

      return {
        success: true,
        data: true
      };

    } catch (error: unknown) {
      console.error('Update entity tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update entity tags'
      };
    }
  }

  static async assignTagToEntity(
    domain: string,
    tagName: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number
  ): Promise<ServiceResult<boolean>> {
    try {
      // Get current tags
      const currentTagsResult = await this.getEntityTags(domain, entityType, entityId);
      if (!currentTagsResult.success) {
        return currentTagsResult;
      }

      const currentTagNames = currentTagsResult.data!.map(tag => tag.name);

      // Add new tag if not already present
      if (!currentTagNames.includes(tagName)) {
        const updatedTagNames = [...currentTagNames, tagName];
        return await this.updateEntityTags(domain, entityType, entityId, updatedTagNames);
      }

      return {
        success: true,
        data: true
      };

    } catch (error: unknown) {
      console.error('Assign tag to entity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign tag'
      };
    }
  }

  static async removeTagFromEntity(
    domain: string,
    tagName: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number
  ): Promise<ServiceResult<boolean>> {
    try {
      // Get current tags
      const currentTagsResult = await this.getEntityTags(domain, entityType, entityId);
      if (!currentTagsResult.success) {
        return currentTagsResult;
      }

      const currentTagNames = currentTagsResult.data!.map(tag => tag.name);

      // Remove tag if present
      const updatedTagNames = currentTagNames.filter(name => name !== tagName);
      return await this.updateEntityTags(domain, entityType, entityId, updatedTagNames);

    } catch (error: unknown) {
      console.error('Remove tag from entity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove tag'
      };
    }
  }

  // =====================================================
  // TAG CHECKING FOR PRICING RULES
  // =====================================================

  static async checkEntityHasTag(
    domain: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number,
    tagName: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const tagsResult = await this.getEntityTags(domain, entityType, entityId);
      if (!tagsResult.success) {
        return tagsResult;
      }

      const hasTag = tagsResult.data!.some(tag => tag.name === tagName);

      return {
        success: true,
        data: hasTag
      };

    } catch (error: unknown) {
      console.error('Check entity has tag error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check entity tag'
      };
    }
  }

  static async checkEntityHasAnyTags(
    domain: string,
    entityType: 'client' | 'product' | 'invoice' | 'quote',
    entityId: number,
    tagNames: string[]
  ): Promise<ServiceResult<boolean>> {
    try {
      const tagsResult = await this.getEntityTags(domain, entityType, entityId);
      if (!tagsResult.success) {
        return tagsResult;
      }

      const hasAnyTag = tagsResult.data!.some(tag => tagNames.includes(tag.name));

      return {
        success: true,
        data: hasAnyTag
      };

    } catch (error: unknown) {
      console.error('Check entity has any tags error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check entity tags'
      };
    }
  }
}