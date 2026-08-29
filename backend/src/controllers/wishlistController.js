const pool = require('../config/db');

async function getWishlist(req, res) {
  const result = await pool.query(
    `SELECT w.id AS wishlist_item_id, p.*
     FROM wishlist_items w JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({ items: result.rows });
}

async function addToWishlist(req, res) {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required.' });

  const result = await pool.query(
    `INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *`,
    [req.user.id, productId]
  );
  res.status(201).json({ item: result.rows[0] || null });
}

async function removeFromWishlist(req, res) {
  const result = await pool.query(
    'DELETE FROM wishlist_items WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Wishlist item not found.' });
  res.json({ message: 'Removed from wishlist.' });
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
