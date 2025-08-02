// =========================================
// TAG SERVICE
// =========================================
// Database operations for flexible tagging system

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Tag, EntityTag } from '@/lib/types/discounts'

export class TagService {
  private static supabase = createClientComponentClient()

  // =========================================
  // TAG MANAGEMENT
  // =========================================

  /**
   * Get all tags for a store
   */
  static async getTags(
    storeId: string, 
    category?: Tag['category'],
    includeInactive = false
  ): Promise<Tag[]> {
    let query = this.supabase
      .from('tags')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw error
    
    return (data || []).map(this.mapTag)
  }

  /**
   * Create a new tag
   */
  static async createTag(tag: Omit<Tag, 'id' | 'slug' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    const { data, error } = await this.supabase
      .from('tags')
      .insert({
        store_id: tag.storeId,
        name: tag.name,
        description: tag.description,
        color: tag.color,
        category: tag.category,
        is_active: tag.isActive,
        sort_order: tag.sortOrder
      })
      .select()
      .single()

    if (error) throw error
    return this.mapTag(data)
  }

  /**
   * Update tag
   */
  static async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    const { data, error } = await this.supabase
      .from('tags')
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        category: updates.category,
        is_active: updates.isActive,
        sort_order: updates.sortOrder
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return this.mapTag(data)
  }

  /**
   * Delete tag
   */
  static async deleteTag(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Toggle tag active status
   */
  static async toggleTag(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('tags')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get tag by slug
   */
  static async getTagBySlug(storeId: string, slug: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    
    return this.mapTag(data)
  }

  // =========================================
  // ENTITY TAG MANAGEMENT
  // =========================================

  /**
   * Get tags for a specific entity
   */
  static async getEntityTags(entityType: EntityTag['entityType'], entityId: string): Promise<EntityTag[]> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        *,
        tag:tags(*)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('assigned_at', { ascending: false })

    if (error) throw error
    return (data || []).map(this.mapEntityTag)
  }

  /**
   * Get tag slugs for a specific entity
   */
  static async getEntityTagSlugs(entityType: EntityTag['entityType'], entityId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        tag:tags!inner(slug)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('tags.is_active', true)

    if (error) throw error
    return (data || []).map(item => item.tag.slug).filter(Boolean)
  }

  /**
   * Assign tag to entity
   */
  static async assignTagToEntity(
    tagId: string,
    entityType: EntityTag['entityType'],
    entityId: string,
    assignedBy?: string
  ): Promise<EntityTag> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .insert({
        tag_id: tagId,
        entity_type: entityType,
        entity_id: entityId,
        assigned_by: assignedBy
      })
      .select(`
        *,
        tag:tags(*)
      `)
      .single()

    if (error) throw error
    return this.mapEntityTag(data)
  }

  /**
   * Remove tag from entity
   */
  static async removeTagFromEntity(
    tagId: string,
    entityType: EntityTag['entityType'],
    entityId: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('entity_tags')
      .delete()
      .eq('tag_id', tagId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    if (error) throw error
  }

  /**
   * Assign multiple tags to entity (bulk operation)
   */
  static async assignTagsToEntity(
    tagIds: string[],
    entityType: EntityTag['entityType'],
    entityId: string,
    assignedBy?: string
  ): Promise<EntityTag[]> {
    if (tagIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('entity_tags')
      .insert(
        tagIds.map(tagId => ({
          tag_id: tagId,
          entity_type: entityType,
          entity_id: entityId,
          assigned_by: assignedBy
        }))
      )
      .select(`
        *,
        tag:tags(*)
      `)

    if (error) throw error
    return (data || []).map(this.mapEntityTag)
  }

  /**
   * Replace all tags for an entity
   */
  static async replaceEntityTags(
    tagIds: string[],
    entityType: EntityTag['entityType'],
    entityId: string,
    assignedBy?: string
  ): Promise<EntityTag[]> {
    // Remove existing tags
    await this.supabase
      .from('entity_tags')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)

    // Assign new tags
    if (tagIds.length > 0) {
      return this.assignTagsToEntity(tagIds, entityType, entityId, assignedBy)
    }

    return []
  }

  /**
   * Check if entity has specific tag
   */
  static async entityHasTag(
    entityType: EntityTag['entityType'],
    entityId: string,
    tagSlug: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        tag:tags!inner(slug)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('tags.slug', tagSlug)
      .eq('tags.is_active', true)
      .limit(1)

    if (error) throw error
    return (data || []).length > 0
  }

  /**
   * Check if entity has any of specified tags
   */
  static async entityHasAnyTags(
    entityType: EntityTag['entityType'],
    entityId: string,
    tagSlugs: string[]
  ): Promise<boolean> {
    if (tagSlugs.length === 0) return false

    const { data, error } = await this.supabase
      .from('entity_tags')
      .select(`
        tag:tags!inner(slug)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .in('tags.slug', tagSlugs)
      .eq('tags.is_active', true)
      .limit(1)

    if (error) throw error
    return (data || []).length > 0
  }

  /**
   * Check if entity has all specified tags
   */
  static async entityHasAllTags(
    entityType: EntityTag['entityType'],
    entityId: string,
    tagSlugs: string[]
  ): Promise<boolean> {
    if (tagSlugs.length === 0) return true

    const { count, error } = await this.supabase
      .from('entity_tags')
      .select(`
        tag:tags!inner(slug)
      `, { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .in('tags.slug', tagSlugs)
      .eq('tags.is_active', true)

    if (error) throw error
    return (count || 0) === tagSlugs.length
  }

  // =========================================
  // BULK OPERATIONS
  // =========================================

  /**
   * Get all entities with specific tag
   */
  static async getEntitiesWithTag(
    tagSlug: string,
    entityType?: EntityTag['entityType']
  ): Promise<EntityTag[]> {
    let query = this.supabase
      .from('entity_tags')
      .select(`
        *,
        tag:tags!inner(*)
      `)
      .eq('tags.slug', tagSlug)
      .eq('tags.is_active', true)

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(this.mapEntityTag)
  }

  /**
   * Get usage statistics for a tag
   */
  static async getTagUsageStats(tagId: string): Promise<{
    totalUsage: number
    usageByType: Record<string, number>
  }> {
    const { data, error } = await this.supabase
      .from('entity_tags')
      .select('entity_type')
      .eq('tag_id', tagId)

    if (error) throw error

    const usageByType = (data || []).reduce((acc, item) => {
      acc[item.entity_type] = (acc[item.entity_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalUsage: data?.length || 0,
      usageByType
    }
  }

  // =========================================
  // MAPPING HELPERS
  // =========================================

  private static mapTag(data: unknown): Tag {
    return {
      id: data.id,
      storeId: data.store_id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
      category: data.category,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private static mapEntityTag(data: unknown): EntityTag {
    return {
      id: data.id,
      tagId: data.tag_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      assignedAt: data.assigned_at,
      assignedBy: data.assigned_by,
      createdAt: data.created_at,
      tag: data.tag ? this.mapTag(data.tag) : undefined
    }
  }
}