const pool = require('../config/db');

// User: their own past orders.
async function myOrders(req, res) {
  const orders = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 AND status = 'paid' ORDER BY created_at DESC`,
    [req.user.id]
  );
  const orderIds = orders.rows.map((o) => o.id);
  const items = orderIds.length
    ? await pool.query('SELECT * FROM order_items WHERE order_id = ANY($1)', [orderIds])
    : { rows: [] };

  const withItems = orders.rows.map((o) => ({
    ...o,
    items: items.rows.filter((i) => i.order_id === o.id),
  }));
  res.json({ orders: withItems });
}

// Sales Person: orders that contain at least one of their products.
async function sellerOrders(req, res) {
  const result = await pool.query(
    `SELECT oi.*, o.created_at AS order_date, o.status, o.user_id AS buyer_id, u.name AS buyer_name
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN users u ON u.id = o.user_id
     WHERE oi.seller_id = $1 AND o.status = 'paid'
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ items: result.rows });
}

// Admin: every paid order, plus a stats summary.
async function allOrders(req, res) {
  const result = await pool.query(
    `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.status = 'paid'
     ORDER BY o.created_at DESC`
  );
  res.json({ orders: result.rows });
}

async function stats(req, res) {
  const totals = await pool.query(
    `SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_amount), 0)::float AS total_sales
     FROM orders WHERE status = 'paid'`
  );
  const topProducts = await pool.query(
    `SELECT oi.name, SUM(oi.quantity)::int AS units_sold
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'paid'
     GROUP BY oi.name ORDER BY units_sold DESC LIMIT 5`
  );
  const userCount = await pool.query('SELECT COUNT(*)::int AS total_users FROM users');

  res.json({
    totalOrders: totals.rows[0].total_orders,
    totalSales: totals.rows[0].total_sales,
    totalUsers: userCount.rows[0].total_users,
    topProducts: topProducts.rows,
  });
}

module.exports = { myOrders, sellerOrders, allOrders, stats };
