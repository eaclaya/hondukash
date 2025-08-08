'use client';

import { Badge } from '@/components/ui/badge';
import { Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: number;
  name: string;
  description?: string;
  color: string;
  category: 'general' | 'client' | 'product' | 'discount' | 'marketing' | 'custom';
}

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  removable?: boolean;
  onRemove?: (tagId: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5'
};

const iconSizes = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3', 
  lg: 'h-3.5 w-3.5'
};

export function TagBadge({ 
  tag, 
  size = 'md', 
  variant = 'secondary',
  showIcon = true,
  removable = false,
  onRemove,
  className 
}: TagBadgeProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag.id);
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1 transition-colors',
        sizeClasses[size],
        removable && 'pr-1',
        className
      )}
      style={{ 
        backgroundColor: variant === 'outline' ? 'transparent' : `${tag.color}20`, 
        borderColor: tag.color,
        color: variant === 'outline' ? tag.color : 'inherit'
      }}
      title={tag.description}
    >
      {showIcon && (
        <Hash 
          className={cn('shrink-0', iconSizes[size])} 
          style={{ color: tag.color }} 
        />
      )}
      <span className="truncate">{tag.name}</span>
      {removable && (
        <button
          onClick={handleRemove}
          className={cn(
            'ml-1 hover:bg-red-100 rounded-full p-0.5 transition-colors shrink-0',
            size === 'sm' && 'p-0.5',
            size === 'lg' && 'p-1'
          )}
          title="Remove tag"
        >
          <X className={cn(iconSizes[size])} />
        </button>
      )}
    </Badge>
  );
}

interface TagListProps {
  tags: Tag[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
  showIcon?: boolean;
  removable?: boolean;
  onRemove?: (tagId: number) => void;
  className?: string;
  maxTags?: number;
  showMore?: boolean;
}

export function TagList({ 
  tags, 
  size = 'md',
  variant = 'secondary',
  showIcon = true,
  removable = false,
  onRemove,
  className,
  maxTags,
  showMore = false
}: TagListProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          showIcon={showIcon}
          removable={removable}
          onRemove={onRemove}
        />
      ))}
      {remainingCount > 0 && showMore && (
        <Badge 
          variant="outline" 
          className={cn('text-muted-foreground', sizeClasses[size])}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}