const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  initiateBulkPayment,
  verifyBulkPayment,
  getPaymentHistory,
   deleteTransaction,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  validate,
  initiatePaymentSchema,
  verifyPaymentSchema,
  initiateBulkPaymentSchema,
  verifyBulkPaymentSchema,
} = require('../utils/validators');

router.post('/initiate', protect, validate(initiatePaymentSchema), initiatePayment);
router.post('/verify', protect, validate(verifyPaymentSchema), verifyPayment);

router.post('/initiate-bulk', protect, validate(initiateBulkPaymentSchema), initiateBulkPayment);
router.post('/verify-bulk', protect, validate(verifyBulkPaymentSchema), verifyBulkPayment);

router.get('/history', protect, getPaymentHistory);
router.delete('/:id', protect, authorize('admin'), deleteTransaction);

module.exports = router;