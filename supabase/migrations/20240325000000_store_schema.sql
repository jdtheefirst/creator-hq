-- Drop tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES profiles(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('physical', 'digital', 'affiliate')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    thumbnail_url TEXT,
    affiliate_url TEXT,
    digital_file_url TEXT,
    stock_quantity INTEGER,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    sku VARCHAR(100),
    stock_quantity INTEGER,
    is_default BOOLEAN DEFAULT false,
    thumbnail_url TEXT,
    digital_file_url TEXT,
    is_active BOOLEAN DEFAULT true,
    weight DECIMAL(10,2),
    metadata JSONB;
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    creator_id UUID REFERENCES profiles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stripe_session_id VARCHAR(255),
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_variant_id UUID REFERENCES product_variants(id);
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INDEXES
CREATE INDEX products_type_idx ON products(type);
CREATE INDEX products_created_at_idx ON products(created_at);
CREATE INDEX products_creator_id_idx ON products(creator_id);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_category_idx ON products(category);
CREATE INDEX products_vip_idx ON products(vip);
CREATE INDEX products_sales_count_idx ON products(sales_count);
CREATE INDEX products_review_count_idx ON products(review_count);
CREATE INDEX products_rating_idx ON products(rating);

CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_creator_id_idx ON orders(creator_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);

CREATE INDEX order_items_product_id_idx ON order_items(product_id);
CREATE INDEX order_items_variant_id_idx ON order_items(variant_id);

CREATE INDEX product_variants_product_id_idx ON product_variants(product_id);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Products
CREATE POLICY "Products are viewable by everyone" 
    ON products FOR SELECT USING (status = 'published');

CREATE POLICY "Creators can manage their own products"
    ON products FOR ALL USING (creator_id = auth.uid());

-- Product variants
CREATE POLICY "Creators manage their own product variants"
    ON product_variants FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_variants.product_id
            AND products.creator_id = auth.uid()
        )
    );

-- Orders
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Creators can view orders for their products"
    ON orders FOR SELECT USING (creator_id = auth.uid());

-- Order Items
CREATE POLICY "Users can view their own order items"
    ON order_items FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );
