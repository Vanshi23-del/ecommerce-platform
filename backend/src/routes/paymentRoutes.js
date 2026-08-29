const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
