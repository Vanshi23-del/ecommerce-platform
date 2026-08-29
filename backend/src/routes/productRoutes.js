const express = require('express');
const {
  listProducts,
  getProduct,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  myProducts,
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { upload } = require('../utils/upload');

const router = express.Router();

// Public
router.get('/', listProducts);
router.get('/categories', listCategories);

// Protected — must come before /:id so it isn't swallowed by the param route
router.get('/mine', requireAuth, requireRole('admin', 'sales_person'), myProducts);

router.get('/:id', getProduct);

router.post(
  '/',
  requireAuth,
  requireRole('admin', 'sales_person'),
  upload.single('image'),
  createProduct
);
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'sales_person'),
  upload.single('image'),
  updateProduct
);
router.delete('/:id', requireAuth, requireRole('admin', 'sales_person'), deleteProduct);

module.exports = router;
