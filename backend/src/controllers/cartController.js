const pool = require('../config/db');

async function getCart(req, res) {
  const result = await pool.query(
    `SELECT c.id AS cart_item_id, c.quantity, p.*
     FROM cart_items c JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
    [req.user.id]
  );
  res.json({ items: result.rows });
}

async function addToCart(req, res) {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required.' });

  const result = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3
     RETURNING *`,
    [req.user.id, productId, quantity]
  );
  res.status(201).json({ item: result.rows[0] });
}

async function updateCartItem(req, res) {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1.' });

  const result = await pool.query(
    `UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
    [quantity, req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Cart item not found.' });
  res.json({ item: result.rows[0] });
}

async function removeCartItem(req, res) {
  const result = await pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Cart item not found.' });
  res.json({ message: 'Removed from cart.' });
}

async function clearCart(req, res) {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
  res.json({ message: 'Cart cleared.' });
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
