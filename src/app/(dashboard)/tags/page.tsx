'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tags, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  { value: 'custom', label: 'Custom', description: 'Custom category tags' },
];

export default function TagsPage() {
  const { getAuthHeaders } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<CreateTagData>({
    name: '',
    description: '',
    color: TAG_COLORS[0],
    category: 'general'
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags', {
        headers: {
          ...await getAuthHeaders(),
          'X-Store-ID': '1' // TODO: Get actual store ID
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTags(result.data || []);
      } else {
        console.error('Failed to fetch tags:', response.statusText);
        toast.error('Failed to load tags');
      }
    } catch (error: unknown) {
      console.error('Error loading tags:', error);
      toast.error('Error loading tags');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      if (editingTag) {
        const response = await fetch(`/api/tags/${editingTag.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Store-ID': '1',
            ...await getAuthHeaders()
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await loadTags();
          resetForm();
          toast.success('Tag updated successfully');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to update tag');
        }
      } else {
        const response = await fetch('/api/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Store-ID': '1',
            ...await getAuthHeaders()
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await loadTags();
          resetForm();
          toast.success('Tag created successfully');
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to create tag');
        }
      }
    } catch (error: unknown) {
      console.error('Error saving tag:', error);
      toast.error('Error saving tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      category: tag.category
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all associated items.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'X-Store-ID': '1',
          ...await getAuthHeaders()
        }
      });

      if (response.ok) {
        await loadTags();
        toast.success('Tag deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete tag');
      }
    } catch (error: unknown) {
      console.error('Error deleting tag:', error);
      toast.error('Error deleting tag');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: TAG_COLORS[0],
      category: 'general'
    });
    setEditingTag(null);
    setDialogOpen(false);
  };

  const groupedTags = tags.reduce((acc, tag) => {
    const category = tag.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tags Management</h1>
          <p className="text-slate-600">Create and manage tags for your organization</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="btn-primary-modern">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tagName">Tag Name *</Label>
                <Input
                  id="tagName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagCategory">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
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

              <div className="space-y-2">
                <Label htmlFor="tagDescription">Description</Label>
                <Textarea
                  id="tagDescription"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleInputChange('color', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-black scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading tags...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedTags).length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-slate-600">
                  <Tags className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p>No tags created yet.</p>
                  <p className="text-sm">Create your first tag to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            TAG_CATEGORIES.map(categoryInfo => {
              const categoryTags = groupedTags[categoryInfo.value] || [];
              if (categoryTags.length === 0) return null;
              
              return (
                <Card key={categoryInfo.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Hash className="h-5 w-5" />
                      <span>{categoryInfo.label} Tags</span>
                      <Badge variant="secondary">{categoryTags.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {categoryTags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <div className="font-medium text-slate-900">{tag.name}</div>
                              {tag.description && (
                                <div className="text-sm text-slate-600">{tag.description}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(tag)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(tag.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}