# Product Costing & Profit Analysis System

This document explains how the HonduKash ERP handles product costing, pricing, and profit calculations to provide accurate business insights.

## 💰 **Product Pricing Fields Explained**

### **Cost Fields**
```sql
base_cost         -- Original purchase/manufacturing cost (what you paid)
current_cost      -- Current replacement cost (what it would cost to buy today)
```

### **Price Fields**
```sql
base_price        -- Suggested retail price (your target selling price)
sale_price        -- Current selling price (what customer actually pays)
min_sale_price    -- Minimum price allowed (prevents selling below cost)
```

### **Auto-Calculated Profit Fields**
```sql
gross_profit_amount    -- sale_price - base_cost (profit in currency)
gross_profit_margin    -- (profit / sale_price) * 100 (margin %)
markup_percentage      -- (profit / base_cost) * 100 (markup %)
```

## 🧮 **Profit Calculation Examples**

### **Example 1: Electronics Product**
```sql
INSERT INTO products (
    name, sku,
    base_cost, current_cost, base_price, sale_price, min_sale_price
) VALUES (
    'Samsung Galaxy A54', 'SAM-A54-BLK',
    12000.00,  -- Base cost (what you paid supplier)
    12500.00,  -- Current cost (current market price)
    18000.00,  -- Base price (your target price)
    16500.00,  -- Sale price (current selling price)
    13000.00   -- Min price (must cover cost + minimum margin)
);

-- Auto-calculated results:
-- gross_profit_amount = 16,500 - 12,000 = L 4,500
-- gross_profit_margin = (4,500 / 16,500) * 100 = 27.27%
-- markup_percentage = (4,500 / 12,000) * 100 = 37.50%
```

### **Example 2: Grocery Product**
```sql
INSERT INTO products (
    name, sku,
    base_cost, sale_price, min_sale_price
) VALUES (
    'Coca Cola 355ml', 'COCA-355',
    18.00,    -- Cost from distributor
    25.00,    -- Selling price
    20.00     -- Minimum price (cost + 11% margin)
);

-- Auto-calculated results:
-- gross_profit_amount = 25.00 - 18.00 = L 7.00
-- gross_profit_margin = (7.00 / 25.00) * 100 = 28.00%
-- markup_percentage = (7.00 / 18.00) * 100 = 38.89%
```

## 📊 **Invoice Item Profit Tracking**

Update invoice items to track profit per sale:

```sql
ALTER TABLE {TENANT_SCHEMA}.invoice_items 
ADD COLUMN product_base_cost DECIMAL(12,4) DEFAULT 0,
ADD COLUMN profit_amount DECIMAL(12,4) GENERATED ALWAYS AS (
    (unit_price - product_base_cost) * quantity
) STORED,
ADD COLUMN profit_margin DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE 
        WHEN unit_price > 0 THEN ((unit_price - product_base_cost) / unit_price) * 100
        ELSE 0 
    END
) STORED;
```

### **Invoice Creation with Profit Tracking**
```sql
-- When creating invoice item, capture current base_cost
INSERT INTO invoice_items (
    invoice_id, product_id, description, quantity, unit_price, product_base_cost
) 
SELECT 
    @invoice_id,
    p.id,
    p.name,
    @quantity,
    @selling_price,
    p.base_cost  -- Capture cost at time of sale
FROM products p 
WHERE p.id = @product_id;
```

## 📈 **Business Intelligence Queries**

### **1. Product Profitability Report**
```sql
SELECT 
    p.name,
    p.sku,
    p.base_cost,
    p.sale_price,
    p.gross_profit_amount,
    p.gross_profit_margin,
    p.markup_percentage,
    CASE 
        WHEN p.gross_profit_margin > 30 THEN 'High Profit'
        WHEN p.gross_profit_margin > 15 THEN 'Medium Profit'
        ELSE 'Low Profit'
    END as profit_category
FROM products p
WHERE p.is_active = true
ORDER BY p.gross_profit_margin DESC;
```

### **2. Sales Profit Analysis**
```sql
SELECT 
    DATE_TRUNC('month', i.invoice_date) as month,
    COUNT(ii.id) as items_sold,
    SUM(ii.line_total) as gross_sales,
    SUM(ii.profit_amount) as total_profit,
    AVG(ii.profit_margin) as avg_profit_margin,
    SUM(ii.line_total - ii.profit_amount) as total_cost_of_goods
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status = 'paid'
  AND i.invoice_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', i.invoice_date)
ORDER BY month;
```

### **3. Low Margin Products Alert**
```sql
SELECT 
    p.name,
    p.sku,
    p.sale_price,
    p.base_cost,
    p.gross_profit_margin,
    inv.quantity_on_hand
FROM products p
JOIN inventory inv ON p.id = inv.product_id
WHERE p.gross_profit_margin < 15  -- Less than 15% margin
  AND inv.quantity_on_hand > 0    -- Items in stock
  AND p.is_active = true
ORDER BY p.gross_profit_margin ASC;
```

## 🎯 **Pricing Strategy Support**

### **Dynamic Pricing Rules**
```sql
-- Create function to suggest pricing based on cost
CREATE OR REPLACE FUNCTION calculate_suggested_prices(
    p_base_cost DECIMAL,
    p_target_margin DECIMAL DEFAULT 25.0
)
RETURNS TABLE(
    suggested_price DECIMAL,
    min_price DECIMAL,
    premium_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT
        -- Target margin price: cost / (1 - margin%)
        ROUND(p_base_cost / (1 - p_target_margin/100), 2) as suggested_price,
        
        -- Minimum price (cost + 10%)
        ROUND(p_base_cost * 1.10, 2) as min_price,
        
        -- Premium price (cost + 50%)
        ROUND(p_base_cost * 1.50, 2) as premium_price;
END;
$$ LANGUAGE plpgsql;

-- Usage example
SELECT * FROM calculate_suggested_prices(100.00, 25.0);
-- Result: suggested_price=133.33, min_price=110.00, premium_price=150.00
```

### **Competitor Price Tracking**
```sql
-- Optional: Track competitor prices
ALTER TABLE {TENANT_SCHEMA}.products 
ADD COLUMN competitor_price_1 DECIMAL(12,4),
ADD COLUMN competitor_price_2 DECIMAL(12,4),
ADD COLUMN price_competitiveness DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE 
        WHEN competitor_price_1 > 0 THEN 
            (sale_price / competitor_price_1) * 100
        ELSE NULL 
    END
) STORED;
```

## 🏪 **Multi-Store Cost Management**

Since products are shared across stores but costs might vary:

```sql
-- Optional: Store-specific costs table
CREATE TABLE {TENANT_SCHEMA}.product_store_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES {TENANT_SCHEMA}.products(id),
    store_id UUID NOT NULL REFERENCES {TENANT_SCHEMA}.stores(id),
    
    -- Store-specific costs
    store_base_cost DECIMAL(12,4) DEFAULT 0,
    store_sale_price DECIMAL(12,4) DEFAULT 0,
    store_min_price DECIMAL(12,4) DEFAULT 0,
    
    -- Effective dates
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(product_id, store_id, effective_from)
);
```

## 💼 **Business Benefits**

### **1. Profit Visibility**
- See exactly how much money each product makes
- Identify high and low performers
- Track profit trends over time

### **2. Pricing Optimization**
- Set minimum prices to protect margins
- Compare costs vs. selling prices easily
- Adjust pricing based on profit targets

### **3. Inventory Decisions**
- Focus on high-margin products
- Liquidate low-profit inventory
- Make data-driven purchasing decisions

### **4. Financial Reporting**
- Accurate cost of goods sold calculations
- Gross profit reporting by product/category
- Integration with accounting module

### **5. Tax Compliance**
- Separate cost tracking from tax calculations
- Profit calculations exclude tax amounts
- Clean financial reporting for authorities

## 🔍 **Example Business Scenarios**

### **Scenario 1: Price Change Impact**
```sql
-- Before price change
Product: Samsung TV
Base Cost: L 15,000
Sale Price: L 20,000  
Profit: L 5,000 (25% margin)

-- After price change
UPDATE products 
SET sale_price = 22000 
WHERE sku = 'SAM-TV-55';

-- New profit automatically calculated:
Profit: L 7,000 (31.8% margin)
```

### **Scenario 2: Cost Increase Analysis**
```sql
-- Supplier increases cost
UPDATE products 
SET base_cost = 16000,
    current_cost = 16000
WHERE sku = 'SAM-TV-55';

-- If keeping same selling price (22,000):
-- New profit: L 6,000 (27.3% margin)

-- To maintain 25% margin, new price should be:
SELECT calculate_suggested_prices(16000.00, 25.0);
-- Suggested price: L 21,333
```

This comprehensive costing system ensures you always know your true profitability on every product and sale, enabling better business decisions and improved financial performance.