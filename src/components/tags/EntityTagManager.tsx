'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tags, Plus, X, Search, Loader2, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

// Types
interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'invoice' | 'quote' | 'custom';
  isActive: boolean;
  sortOrder: number;
}

interface CreateTagData {
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'invoice' | 'quote' | 'custom';
}

interface EntityTagManagerProps {
  entityType: 'client' | 'product' | 'invoice' | 'quote';
  entityId: number;
  entityName?: string;
  storeId: number;
  tags?: string[]; // Existing tag names from the entity
  onTagsChanged?: (tagNames: string[]) => void;
}

const TAG_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#DC2626', // Red 600
  '#059669'  // Green 600
];

const TAG_CATEGORIES = [
  { value: 'general', label: 'General', description: 'General purpose tags' },
  { value: 'client', label: 'Client', description: 'Client specific tags' },
  { value: 'product', label: 'Product', description: 'Product specific tags' },
  { value: 'invoice', label: 'Invoice', description: 'Invoice specific tags' },
  { value: 'quote', label: 'Quote', description: 'Quote specific tags' },
];

export default function EntityTagManager({
  entityType,
  entityId,
  entityName,
  storeId,
  tags = [],
  onTagsChanged
}: EntityTagManagerProps) {
  const [entityTagNames, setEntityTagNames] = useState<string[]>(tags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);

  // Create tag form state
  const [newTag, setNewTag] = useState<CreateTagData>({
    name: '',
    description: '',
    color: TAG_COLORS[0],
    category: 'general'
  });


  // Load entity tags and available tags on mount
  useEffect(() => {
    loadEntityTags();
    loadAvailableTags();
  }, [entityType, entityId, storeId]);

  // Refresh data when dialog is opened (in case tags were modified elsewhere)
  useEffect(() => {
    if (isDialogOpen) {
      loadEntityTags();
      loadAvailableTags();
    }
  }, [isDialogOpen]);

  const loadEntityTags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tags/entity?entityType=${entityType}&entityId=${entityId}`, {
        headers: {
          'X-Store-ID': storeId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load entity tags');
      }

      const result = await response.json();
      const tagNames = result.tags || [];
      setEntityTagNames(tagNames);
      onTagsChanged?.(tagNames);
    } catch (error) {
      console.error('Error loading entity tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const response = await fetch('/api/tags', {
        headers: {
          'X-Store-ID': storeId.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load available tags');
      }

      const result = await response.json();
      setAvailableTags(result.data || []);
    } catch (error) {
      console.error('Error loading available tags:', error);
      toast.error('Failed to load available tags');
    }
  };

  const assignTag = async (tagName: string) => {
    try {
      const updatedTags = [...entityTagNames, tagName];
      const response = await fetch('/api/tags/update-entity-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-ID': storeId.toString()
        },
        body: JSON.stringify({
          entityType,
          entityId,
          tagNames: updatedTags
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign tag');
      }

      setEntityTagNames(updatedTags);
      onTagsChanged?.(updatedTags);

      toast.success('Tag assigned successfully');
    } catch (error) {
      console.error('Error assigning tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign tag');
    }
  };

  const removeTag = async (tagName: string) => {
    try {
      const updatedTags = entityTagNames.filter(name => name !== tagName);
      const response = await fetch('/api/tags/update-entity-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-ID': storeId.toString()
        },
        body: JSON.stringify({
          entityType,
          entityId,
          tagNames: updatedTags
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove tag');
      }

      setEntityTagNames(updatedTags);
      onTagsChanged?.(updatedTags);

      toast.success('Tag removed successfully');
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove tag');
    }
  };

  const createTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-ID': storeId.toString()
        },
        body: JSON.stringify(newTag)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      const createdTag = await response.json();

      // Reset form
      setNewTag({
        name: '',
        description: '',
        color: TAG_COLORS[0],
        category: 'general'
      });

      setIsCreateTagOpen(false);
      await loadAvailableTags();

      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create tag');
    }
  };

  // Filter available tags
  const filteredTags = availableTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
    const notAssigned = !entityTagNames.includes(tag.name);

    return matchesSearch && matchesCategory && notAssigned;
  });

  const getEntityTypeLabel = (type: string) => {
    const labels = {
      client: 'Client',
      product: 'Product',
      invoice: 'Invoice',
      quote: 'Quote'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-2">
      {/* Current Tags Display */}
      <div className="flex flex-wrap gap-2">
        {entityTagNames.map(tagName => {
          const tag = availableTags.find(t => t.name === tagName);
          const color = tag?.color || '#3B82F6';
          return (
            <Badge
              key={tagName}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              style={{ backgroundColor: `${color}20`, borderColor: color }}
            >
              <Hash className="h-3 w-3" style={{ color: color }} />
              {tagName}
              <button
                onClick={() => removeTag(tagName)}
                className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>

      {/* Manage Tags Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Manage Tags
          </Button>
        </DialogTrigger>
        <DialogContent className="!max-w-[700px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Manage Tags for {getEntityTypeLabel(entityType)}
              {entityName && <span className="text-muted-foreground">- {entityName}</span>}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="assign" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">Assign Tags</TabsTrigger>
              <TabsTrigger value="create">Create New Tag</TabsTrigger>
            </TabsList>

            <TabsContent value="assign" className="space-y-4">
              {/* Current Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    Current Tags ({entityTagNames.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {entityTagNames.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {entityTagNames.map(tagName => {
                        const tag = availableTags.find(t => t.name === tagName);
                        const color = tag?.color || '#3B82F6';
                        return (
                          <Badge
                            key={tagName}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            style={{ backgroundColor: `${color}20`, borderColor: color }}
                          >
                            <Hash className="h-3 w-3" style={{ color: color }} />
                            {tagName}
                            <button
                              onClick={() => removeTag(tagName)}
                              className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Available Tags</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {TAG_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 max-h-60 overflow-y-auto">
                  {filteredTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No available tags found</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredTags.map(tag => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <div className="font-medium text-sm">{tag.name}</div>
                              {tag.description && (
                                <div className="text-xs text-muted-foreground">{tag.description}</div>
                              )}
                              <Badge variant="outline" className="text-xs mt-1">
                                {TAG_CATEGORIES.find(c => c.value === tag.category)?.label}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => assignTag(tag.name)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Tag
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tagName">Tag Name *</Label>
                      <Input
                        id="tagName"
                        value={newTag.name}
                        onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter tag name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagCategory">Category</Label>
                      <Select
                        value={newTag.category}
                        onValueChange={(value) => setNewTag(prev => ({ ...prev, category: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAG_CATEGORIES.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label} - {category.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="tagDescription">Description</Label>
                      <Textarea
                        id="tagDescription"
                        value={newTag.description}
                        onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {TAG_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewTag(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newTag.color === color ? 'border-black scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setIsCreateTagOpen(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createTag}
                      disabled={!newTag.name.trim()}
                    >
                      Create Tag
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}