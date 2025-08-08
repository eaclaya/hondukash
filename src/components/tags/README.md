# Tag Components

A comprehensive tagging system for managing tags across different entities (clients, products, invoices) in the HonduKash ERP system.

## Components

### EntityTagManager
A complete tag management interface for entities with features like:
- View current entity tags
- Search and filter available tags
- Assign/remove tags from entities
- Create new tags with categories and colors

### TagBadge & TagList
Display components for showing tags with customizable styling:
- Color-coded tags based on tag settings
- Removable tags with click handlers
- Different sizes (sm, md, lg)
- Support for truncation and "show more" functionality

### TagSelector
A dropdown selector for choosing tags:
- Multi-select or single-select mode
- Search functionality
- Category filtering
- Real-time tag loading

## Usage Examples

### In a Client Detail Page

```tsx
import { EntityTagManager, TagList } from '@/components/tags';

export default function ClientDetailPage({ client }: { client: Client }) {
  const [clientTags, setClientTags] = useState<Tag[]>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>{client.name}</h1>
        
        {/* Quick tag display */}
        <TagList 
          tags={clientTags}
          size="sm"
          maxTags={3}
          showMore
        />
      </div>

      {/* Full tag management */}
      <EntityTagManager
        entityType="client"
        entityId={client.id}
        entityName={client.name}
        storeId={client.storeId}
        onTagsChanged={setClientTags}
      />
    </div>
  );
}
```

### In a Product Form

```tsx
import { TagSelector } from '@/components/tags';

export default function ProductForm() {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  return (
    <form>
      {/* Other form fields */}
      
      <div className="space-y-2">
        <Label>Product Tags</Label>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          storeId={storeId}
          categoryFilter={['product', 'general']}
          placeholder="Select product tags..."
        />
      </div>
    </form>
  );
}
```

### In a Data Table

```tsx
import { TagBadge } from '@/components/tags';

export default function ProductsTable() {
  return (
    <Table>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell>
              {product.tags?.slice(0, 2).map(tag => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {product.tags?.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{product.tags.length - 2} more
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## API Endpoints

The components use the following API endpoints:

- `GET /api/tags` - Get all available tags
- `GET /api/tags/entity` - Get tags for a specific entity
- `POST /api/tags` - Create a new tag
- `POST /api/tags/update-entity-tags` - Update all tags for an entity
- `POST /api/tags/assign-by-name` - Assign tag to entity by tag name
- `POST /api/tags/remove-by-name` - Remove tag from entity by tag name

## Features

### Simplified Tag Storage
Tags are now stored directly in entity tables as JSON arrays for better performance:

**Storage Method:**
- Tags stored as JSON arrays in `tags` column of each entity table
- No complex JOIN operations needed
- Direct access for pricing rules and filtering
- Better performance with immediate tag checking

### Tag Categories
- **general**: General purpose tags
- **client**: Client-specific tags (wholesale, vip, etc.)
- **product**: Product-specific tags (featured, clearance, etc.)
- **discount**: Discount-related tags
- **marketing**: Marketing campaigns
- **custom**: Custom business logic

### Pricing Rules Integration
Tags can be used in pricing rules conditions:
- `client_has_tag`: Apply rule if client has specific tag
- `product_has_tag`: Apply rule if product has specific tag
- `invoice_has_tag`: Apply rule if invoice has specific tag