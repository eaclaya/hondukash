'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslations } from '@/contexts/LocaleContext';

interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'invoice' | 'quote' | 'custom';
}

interface SimpleTagSelectorProps {
  selectedTagNames: string[];
  onTagsChange: (tagNames: string[]) => void;
  storeId: number;
  placeholder?: string;
  categoryFilter?: string[];
  className?: string;
  label?: string;
}

export default function SimpleTagSelector({
  selectedTagNames = [],
  onTagsChange,
  storeId,
  placeholder = "Select tags...",
  categoryFilter,
  className,
  label
}: SimpleTagSelectorProps) {
  const t = useTranslations('tags');
  const tCommon = useTranslations('common');
  // Ensure selectedTagNames is always an array
  const safeSelectedTagNames = React.useMemo(() => {
    if (!selectedTagNames) return [];
    
    // If it's already an array, return it
    if (Array.isArray(selectedTagNames)) {
      return selectedTagNames;
    }
    
    // If it's a string, try to parse it as JSON or split by comma
    if (typeof selectedTagNames === 'string') {
      try {
        const parsed = JSON.parse(selectedTagNames as string);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return (selectedTagNames as string).split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
    }
    
    return [];
  }, [selectedTagNames]);
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
          'X-Store-ID': '1'
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
      toast.error(t('failedToLoadTags'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagSelect = (tag: Tag) => {
    const isSelected = safeSelectedTagNames.includes(tag.name);
    if (isSelected) {
      // Remove tag
      onTagsChange(safeSelectedTagNames.filter(name => name !== tag.name));
    } else {
      // Add tag
      onTagsChange([...safeSelectedTagNames, tag.name]);
    }
  };

  const handleTagRemove = (tagName: string) => {
    onTagsChange(safeSelectedTagNames.filter(name => name !== tagName));
  };

  // Filter available tags based on search and selection
  const filteredTags = availableTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const isTagSelected = (tagName: string) => safeSelectedTagNames.includes(tagName);

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Selected Tags Display */}
      {safeSelectedTagNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {safeSelectedTagNames.map(tagName => {
            const tag = availableTags.find(t => t.name === tagName);
            return (
              <Badge
                key={tagName}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
                style={tag ? { backgroundColor: `${tag.color}20`, borderColor: tag.color } : {}}
              >
                <Hash className="h-3 w-3" style={tag ? { color: tag.color } : {}} />
                {tagName}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tagName)}
                  className="ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tag Selector */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <span className="truncate">
              {safeSelectedTagNames.length === 0
                ? placeholder
                : `${safeSelectedTagNames.length} ${safeSelectedTagNames.length === 1 ? t('tagSelected') : t('tagsSelected')}`
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t('searchTags')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t('loadingTags') : t('noTagsFound')}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const isSelected = isTagSelected(tag.name);
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