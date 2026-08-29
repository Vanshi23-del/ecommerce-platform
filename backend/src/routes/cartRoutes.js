const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth); // every cart route needs a logged-in user

router.get('/', getCart);
router.post('/', addToCart);
router.patch('/:id', updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/', clearCart);

module.exports = router;
