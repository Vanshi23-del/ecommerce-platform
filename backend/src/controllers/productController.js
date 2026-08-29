const pool = require('../config/db');
const { streamToCloudinary } = require('../utils/upload');
const cloudinary = require('../config/cloudinary');

// Public: list/search/filter products. No auth required.
async function listProducts(req, res) {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
    }
    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (minPrice) {
      values.push(minPrice);
      conditions.push(`p.price >= $${values.length}`);
    }
    if (maxPrice) {
      values.push(maxPrice);
      conditions.push(`p.price <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

    values.push(Number(limit), offset);
    const result = await pool.query(
      `SELECT p.*, u.name AS seller_name
       FROM products p JOIN users u ON u.id = p.owner_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

async function getProduct(req, res) {
  const result = await pool.query(
    `SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON u.id = p.owner_id WHERE p.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: result.rows[0] });
}

// Distinct categories, for building the filter dropdown on the frontend.
async function listCategories(req, res) {
  const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
  res.json({ categories: result.rows.map((r) => r.category) });
}

// Protected: Admin can create for anyone (owner = self by default);
// Sales Person can only create products owned by themselves.
async function createProduct(req, res) {
  try {
    const { name, description, price, category, stock } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'name, price and category are required.' });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await streamToCloudinary(req.file.buffer);
      imageUrl = result.secure_url; // only the URL is persisted — never the raw file
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, category, stock, image_url, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || '', price, category, stock || 0, imageUrl, req.user.id]
    );

    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
}

// Ownership check shared by update/delete: Admin bypasses it, Sales
// Person must own the row. This is enforced here, server-side — the
// route can't be reached without a valid role first (see routes file),
// but a Sales Person still cannot touch another seller's product.
async function assertCanModify(req, res) {
  const result = await pool.query('SELECT owner_id, image_url FROM products WHERE id = $1', [req.params.id]);
  const product = result.rows[0];
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return null;
  }
  if (req.user.role !== 'admin' && product.owner_id !== req.user.id) {
    res.status(403).json({ error: 'You can only manage your own products.' });
    return null;
  }
  return product;
}

async function updateProduct(req, res) {
  try {
    const existing = await assertCanModify(req, res);
    if (!existing) return;

    const { name, description, price, category, stock } = req.body;
    let imageUrl = existing.image_url;
    if (req.file) {
      const result = await streamToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category = COALESCE($4, category),
           stock = COALESCE($5, stock),
           image_url = $6,
           updated_at = now()
       WHERE id = $7 RETURNING *`,
      [name, description, price, category, stock, imageUrl, req.params.id]
    );

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
}

async function deleteProduct(req, res) {
  try {
    const existing = await assertCanModify(req, res);
    if (!existing) return;

    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
}

// Sales Person's own listings; Admin can pass ?ownerId= to inspect anyone's.
async function myProducts(req, res) {
  const ownerId = req.user.role === 'admin' && req.query.ownerId ? req.query.ownerId : req.user.id;
  const result = await pool.query(
    'SELECT * FROM products WHERE owner_id = $1 ORDER BY created_at DESC',
    [ownerId]
  );
  res.json({ products: result.rows });
}

module.exports = {
  listProducts,
  getProduct,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  myProducts,
};
