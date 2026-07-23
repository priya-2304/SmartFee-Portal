const express = require('express');
const router = express.Router();
const { downloadReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.get('/:paymentId/pdf', protect, downloadReceipt);

module.exports = router;
