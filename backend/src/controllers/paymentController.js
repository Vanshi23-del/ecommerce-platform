const crypto = require('crypto');
const pool = require('../config/db');
const razorpay = require('../config/razorpay');

// Step 1: server computes the real total from the DB cart (never trusts a
// client-sent amount) and asks Razorpay to open an order for that amount.
async function createOrder(req, res) {
  try {
    const cartResult = await pool.query(
      `SELECT c.quantity, p.id, p.name, p.price, p.owner_id
       FROM cart_items c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    const items = cartResult.rows;
    if (items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const totalAmount = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_user_${req.user.id}_${Date.now()}`,
    });

    // Persist a pending order row now, so we have somewhere to attach the
    // payment/signature once the frontend confirms checkout succeeded.
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, razorpay_order_id, total_amount, status)
       VALUES ($1, $2, $3, 'created') RETURNING id`,
      [req.user.id, razorpayOrder.id, totalAmount]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, name, price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.id, item.owner_id, item.name, item.price, item.quantity]
      );
    }

    res.json({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID, // public key id, safe to expose to the frontend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
}

// Step 2: after Razorpay's checkout modal succeeds, the frontend sends back
// the three fields below. We recompute the HMAC signature ourselves and
// compare it — this is what stops a forged/fake "success" callback from
// creating an order without an actual payment.
async function verifyPayment(req, res) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await pool.query(`UPDATE orders SET status = 'failed' WHERE id = $1`, [orderId]);
      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = 'paid', razorpay_payment_id = $1, razorpay_signature = $2
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [razorpay_payment_id, razorpay_signature, orderId, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Order not found.' });

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    res.json({ message: 'Payment verified.', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
}

module.exports = { createOrder, verifyPayment };
