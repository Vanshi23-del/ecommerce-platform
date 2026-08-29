const express = require('express');
const { myOrders, sellerOrders, allOrders, stats } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();
router.use(requireAuth);

router.get('/mine', myOrders); // any authenticated user, their own orders
router.get('/seller', requireRole('sales_person', 'admin'), sellerOrders);
router.get('/all', requireRole('admin'), allOrders);
router.get('/stats', requireRole('admin'), stats);

module.exports = router;
