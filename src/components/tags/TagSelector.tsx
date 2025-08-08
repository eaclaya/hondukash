'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'discount' | 'marketing' | 'custom';
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  storeId: number;
  placeholder?: string;
  multiple?: boolean;
  categoryFilter?: string[];
  className?: string;
}

export default function TagSelector({
  selectedTags,
  onTagsChange,
  storeId,
  placeholder = "Select tags...",
  multiple = true,
  categoryFilter,
  className
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load available tags
  useEffect(() => {
    loadAvailableTags();
  }, [storeId]);

  const loadAvailableTags = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tags', {
        headers: {
          'X-Store-ID': storeId.toString()
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load tags');
      }
      
      const result = await response.json();
      let tags = result.data || [];
      
      // Apply category filter if specified
      if (categoryFilter && categoryFilter.length > 0) {
        tags = tags.filter((tag: Tag) => categoryFilter.includes(tag.category));
      }
      
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelect = (tag: Tag) => {
    if (multiple) {
      const isSelected = selectedTags.some(t => t.id === tag.id);
      if (isSelected) {
        // Remove tag
        onTagsChange(selectedTags.filter(t => t.id !== tag.id));
      } else {
        // Add tag
        onTagsChange([...selectedTags, tag]);
      }
    } else {
      // Single selection
      const isSelected = selectedTags.some(t => t.id === tag.id);
      if (isSelected) {
        onTagsChange([]);
      } else {
        onTagsChange([tag]);
      }
      setIsOpen(false);
    }
  };

  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  // Filter available tags based on search and selection
  const filteredTags = availableTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isTagSelected = (tagId: number) => selectedTags.some(t => t.id === tagId);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map(tag => (
            <Badge 
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color }}
            >
              <Hash className="h-3 w-3" style={{ color: tag.color }} />
              {tag.name}
              <button
                onClick={() => handleTagRemove(tag.id)}
                className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedTags.length === 0
                ? placeholder
                : multiple
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                : selectedTags[0].name
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search tags..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading tags...' : 'No tags found.'}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const isSelected = isTagSelected(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleTagSelect(tag)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{tag.name}</div>
                          {tag.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {tag.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}