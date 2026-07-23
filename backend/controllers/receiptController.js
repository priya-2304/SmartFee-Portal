const path = require('path');
const fs = require('fs');
const https = require('https');
const FeePayment = require('../models/FeePayment');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateReceiptPdf } = require('../services/pdfService');

const downloadReceipt = asyncHandler(async (req, res) => {
  const feePayment = await FeePayment.findById(req.params.paymentId).populate('studentId');
  if (!feePayment || !feePayment.receiptUrl || !feePayment.studentId) {
    return res.status(404).json({ success: false, message: 'Receipt not found for this payment' });
  }

  if (req.user.role === 'student' && String(feePayment.studentId._id) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Cannot access another student\'s receipt' });
  }

  const fileName = `${feePayment.receiptNumber || 'receipt'}.pdf`;

  if (/^https?:\/\//i.test(feePayment.receiptUrl)) {
    return https
      .get(feePayment.receiptUrl, async (remoteRes) => {
        if (remoteRes.statusCode !== 200) {
          return regenerateAndServe(feePayment, res, fileName);
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        remoteRes.pipe(res);
      })
      .on('error', () => res.status(502).json({ success: false, message: 'Failed to fetch receipt' }));
  }

  const filePath = path.join(__dirname, '..', feePayment.receiptUrl);
  if (!fs.existsSync(filePath)) {
    return regenerateAndServe(feePayment, res, fileName);
  }

  res.download(filePath, fileName);
});

const regenerateAndServe = async (feePayment, res, fileName) => {
  try {
    const newUrl = await generateReceiptPdf({
      receiptNumber: feePayment.receiptNumber || `RCPT-${Date.now()}`,
      student: feePayment.studentId,
      feeHead: feePayment.feeHead,
      amount: feePayment.amountPaid,
      transactionId: feePayment.razorpayPaymentId || 'N/A',
      paidAt: feePayment.paidAt || feePayment.updatedAt,
    });

    feePayment.receiptUrl = newUrl;
    await feePayment.save();

    return https
      .get(newUrl, (remoteRes) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        remoteRes.pipe(res);
      })
      .on('error', () => res.status(502).json({ success: false, message: 'Failed to fetch regenerated receipt' }));
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not regenerate receipt', error: err.message });
  }
};

module.exports = { downloadReceipt };