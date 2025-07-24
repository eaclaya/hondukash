# Store-Specific Pricing & Simplified Inventory System

This document explains the enhanced pricing model that allows each store to set different prices while maintaining centralized product management.

## 🏪 **Two-Tier Pricing Model**

### **Product Level (Global)**
```sql
-- Products table defines base/default pricing
base_cost         -- What you paid for the product
cost             -- Current replacement cost  
base_price       -- Suggested retail price
price            -- Default selling price (fallback)
min_price        -- Minimum allowed price
```

### **Inventory Level (Store-Specific)**
```sql
-- Inventory table allows per-store price overrides
quantity         -- Current stock quantity
price           -- Store-specific selling price (overrides product.price)
location        -- Where item is stored in this store
```

## 💰 **How Pricing Works**

### **Priority Order:**
1. **Inventory.price** (if set) - Store-specific price
2. **Product.price** (fallback) - Default product price
3. **Product.base_price** (fallback) - Suggested retail price

### **Example Implementation:**
```sql
-- Get effective selling price for a product at a specific store
SELECT 
    p.name,
    p.price as product_default_price,
    COALESCE(i.price, p.price) as effective_selling_price,
    i.quantity,
    i.location
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id AND i.store_id = @store_id
WHERE p.id = @product_id;
```

## 🏬 **Real-World Use Cases**

### **Use Case 1: Different Location Pricing**
```sql
-- Product: Coca Cola 355ml
INSERT INTO products (name, sku, base_cost, price, min_price) VALUES
('Coca Cola 355ml', 'COCA-355', 18.00, 25.00, 20.00);

-- Tegucigalpa Store (urban, higher rent)
INSERT INTO inventory (product_id, store_id, quantity, price) VALUES
(@coca_id, @tegucigalpa_store, 100, 27.00);  -- L 27.00

-- San Pedro Sula Store (competitive area)  
INSERT INTO inventory (product_id, store_id, quantity, price) VALUES
(@coca_id, @sps_store, 150, 24.00);  -- L 24.00

-- Small Town Store (uses default price)
INSERT INTO inventory (product_id, store_id, quantity, price) VALUES
(@coca_id, @small_town_store, 50, 25.00);  -- L 25.00 (product default)
```

### **Use Case 2: Premium vs Budget Stores**
```sql
-- Product: Samsung Galaxy A54
INSERT INTO products (name, sku, base_cost, price, min_price) VALUES
('Samsung Galaxy A54', 'SAM-A54', 12000.00, 16500.00, 13000.00);

-- Premium Store (Mall location)
INSERT INTO inventory (product_id, store_id, quantity, price) VALUES
(@samsung_id, @mall_store, 5, 18000.00);  -- Premium pricing

-- Budget Store (Street location)
INSERT INTO inventory (product_id, store_id, quantity, price) VALUES
(@samsung_id, @budget_store, 10, 15500.00);  -- Competitive pricing
```

### **Use Case 3: Clearance/Promotional Pricing**
```sql
-- Temporary price reduction at specific store
UPDATE inventory 
SET price = 12000.00  -- Clearance price
WHERE product_id = @samsung_id 
  AND store_id = @clearance_store;

-- Other stores maintain regular pricing
```

## 📊 **Inventory Management Benefits**

### **1. Simplified Stock Tracking**
```sql
-- Just track current quantity - no complex reservations
SELECT 
    p.name,
    i.quantity,
    i.price,
    (i.quantity * i.price) as inventory_value
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.store_id = @store_id
  AND i.quantity > 0;
```

### **2. Easy Stock Movements**
```sql
-- Sale: Reduce inventory
UPDATE inventory 
SET quantity = quantity - @sold_quantity
WHERE product_id = @product_id AND store_id = @store_id;

-- Restock: Increase inventory
UPDATE inventory 
SET quantity = quantity + @received_quantity
WHERE product_id = @product_id AND store_id = @store_id;

-- Transfer between stores
UPDATE inventory SET quantity = quantity - @transfer_qty 
WHERE product_id = @product_id AND store_id = @from_store;

UPDATE inventory SET quantity = quantity + @transfer_qty
WHERE product_id = @product_id AND store_id = @to_store;
```

### **3. Real-Time Availability**
```sql
-- Check product availability across all stores
SELECT 
    s.name as store_name,
    i.quantity,
    i.price,
    i.location
FROM inventory i
JOIN stores s ON i.store_id = s.id
WHERE i.product_id = @product_id
  AND i.quantity > 0
ORDER BY i.price ASC;
```

## 🧮 **Profit Calculations with Store Pricing**

### **Per-Store Profit Analysis**
```sql
-- Profit margin by store for same product
SELECT 
    s.name as store_name,
    p.name as product_name,
    p.base_cost,
    i.price as selling_price,
    (i.price - p.base_cost) as profit_amount,
    ROUND(((i.price - p.base_cost) / i.price) * 100, 2) as profit_margin_pct
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
WHERE p.id = @product_id
ORDER BY profit_margin_pct DESC;
```

### **Store Performance Comparison**
```sql
-- Compare store profitability
SELECT 
    s.name as store_name,
    COUNT(i.id) as products_count,
    SUM(i.quantity * i.price) as inventory_value,
    AVG(CASE WHEN p.base_cost > 0 THEN 
        ((i.price - p.base_cost) / i.price) * 100 
        ELSE 0 END) as avg_profit_margin
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
WHERE i.quantity > 0
GROUP BY s.id, s.name
ORDER BY avg_profit_margin DESC;
```

## 🎯 **Sales & Invoice Integration**

### **Invoice Creation with Store Pricing**
```sql
-- Create invoice item using store-specific price
INSERT INTO invoice_items (
    invoice_id, product_id, description, quantity, unit_price
)
SELECT 
    @invoice_id,
    p.id,
    p.name,
    @quantity,
    COALESCE(i.price, p.price) as unit_price  -- Use store price or fallback
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id AND i.store_id = @store_id
WHERE p.id = @product_id;

-- Update inventory after sale
UPDATE inventory 
SET quantity = quantity - @quantity
WHERE product_id = @product_id AND store_id = @store_id;
```

### **Sales Report with Pricing Source**
```sql
-- Track which price was used for each sale
SELECT 
    ii.description,
    ii.quantity,
    ii.unit_price,
    p.price as product_default_price,
    i.price as store_specific_price,
    CASE 
        WHEN i.price IS NOT NULL THEN 'Store-Specific'
        ELSE 'Product Default'
    END as price_source
FROM invoice_items ii
JOIN products p ON ii.product_id = p.id
JOIN invoices inv ON ii.invoice_id = inv.id
LEFT JOIN inventory i ON p.id = i.product_id AND i.store_id = inv.store_id
WHERE inv.invoice_date >= CURRENT_DATE - INTERVAL '30 days';
```

## 📈 **Business Intelligence Queries**

### **1. Price Variance Analysis**
```sql
-- See price differences across stores
SELECT 
    p.name,
    p.price as default_price,
    MIN(i.price) as lowest_store_price,
    MAX(i.price) as highest_store_price,
    MAX(i.price) - MIN(i.price) as price_variance
FROM products p
JOIN inventory i ON p.id = i.product_id
GROUP BY p.id, p.name, p.price
HAVING COUNT(DISTINCT i.store_id) > 1  -- Multiple stores
ORDER BY price_variance DESC;
```

### **2. Store Pricing Strategy Report**
```sql
-- Compare each store's pricing vs company average
SELECT 
    s.name as store_name,
    COUNT(i.id) as unique_products,
    AVG(i.price) as avg_store_price,
    AVG(p.price) as avg_product_price,
    AVG(i.price) - AVG(p.price) as avg_price_difference
FROM inventory i
JOIN products p ON i.product_id = p.id  
JOIN stores s ON i.store_id = s.id
GROUP BY s.id, s.name
ORDER BY avg_price_difference DESC;
```

### **3. Inventory Valuation by Store**
```sql
-- Calculate inventory value using store-specific prices
SELECT 
    s.name as store_name,
    COUNT(i.id) as products_in_stock,
    SUM(i.quantity) as total_units,
    SUM(i.quantity * p.base_cost) as cost_value,
    SUM(i.quantity * i.price) as retail_value,
    SUM(i.quantity * (i.price - p.base_cost)) as potential_profit
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
WHERE i.quantity > 0
GROUP BY s.id, s.name
ORDER BY retail_value DESC;
```

## 🔧 **Implementation Tips**

### **1. Price Synchronization**
```sql
-- Copy product default price to all stores (when needed)
INSERT INTO inventory (product_id, store_id, quantity, price)
SELECT p.id, s.id, 0, p.price
FROM products p
CROSS JOIN stores s
WHERE NOT EXISTS (
    SELECT 1 FROM inventory i 
    WHERE i.product_id = p.id AND i.store_id = s.id
);
```

### **2. Bulk Price Updates**
```sql
-- Apply 10% increase to all store prices for a category
UPDATE inventory 
SET price = price * 1.10
WHERE product_id IN (
    SELECT id FROM products WHERE category_id = @category_id
)
AND store_id = @store_id;
```

### **3. Price Consistency Checks**
```sql
-- Find prices below minimum
SELECT 
    s.name as store_name,
    p.name as product_name,
    i.price as store_price,
    p.min_price as minimum_allowed
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN stores s ON i.store_id = s.id
WHERE i.price < p.min_price
ORDER BY s.name, p.name;
```

This flexible pricing system allows each store to optimize pricing for their local market while maintaining centralized product management and accurate profit tracking across the entire business.