-- Role-Based E-Commerce Platform — PostgreSQL schema
-- Run with: psql <connection_string> -f schema.sql

CREATE TYPE user_role AS ENUM ('admin', 'sales_person', 'user');
CREATE TYPE order_status AS ENUM ('created', 'paid', 'failed');

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category     VARCHAR(100) NOT NULL,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url    TEXT,              -- Cloudinary secure_url only, never a local file path
  owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- seller/admin who created it
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_name_trgm ON products USING gin (to_tsvector('english', name));

CREATE TABLE cart_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE wishlist_items (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id   VARCHAR(120) NOT NULL,
  razorpay_payment_id VARCHAR(120),
  razorpay_signature  TEXT,
  total_amount        NUMERIC(10, 2) NOT NULL,
  status              order_status NOT NULL DEFAULT 'created',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Line items snapshot seller_id + price at time of purchase so history
-- stays correct even if a product is later edited or deleted.
CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  seller_id   INTEGER NOT NULL REFERENCES users(id),
  name        VARCHAR(200) NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
