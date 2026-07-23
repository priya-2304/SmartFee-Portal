const crypto = require('crypto');
const FeePayment = require('../models/FeePayment');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorHandler');
const { createOrder, verifySignature } = require('../services/razorpayService');
const { generateReceiptPdf, generateBulkReceiptPdf } = require('../services/pdfService');
const { sendPaymentSuccessEmail } = require('../services/emailService');

const initiatePayment = asyncHandler(async (req, res) => {
  const { feePaymentId, amount, paymentMethod = 'upi' } = req.body;

  const feePayment = await FeePayment.findById(feePaymentId);
  if (!feePayment) return res.status(404).json({ success: false, message: 'Fee record not found' });

  if (String(feePayment.studentId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Cannot pay another student\'s fee' });
  }

 const balance = feePayment.amountDue - feePayment.amountPaid - feePayment.scholarshipApplied;
  if (amount > balance) {
    return res.status(400).json({ success: false, message: `Amount exceeds pending balance of Rs. ${balance}` });
  }

  const order = await createOrder(amount, `fp_${feePaymentId}`.slice(0, 40));

  const transaction = await Transaction.create({
    studentId: req.user._id,
    feePaymentId,
    amount,
    paymentMethod,
    status: 'initiated',
    gatewayReference: order.id,
  });

  res.json({
    success: true,
    order,
    transactionId: transaction._id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

const initiateBulkPayment = asyncHandler(async (req, res) => {
  const { feePaymentIds, paymentMethod = 'upi', amount } = req.body;

  const feePayments = await FeePayment.find({ _id: { $in: feePaymentIds } });

  if (feePayments.length !== feePaymentIds.length) {
    return res.status(404).json({ success: false, message: 'One or more fee records not found' });
  }

  const notOwned = feePayments.find((fp) => String(fp.studentId) !== String(req.user._id));
  if (notOwned) {
    return res.status(403).json({ success: false, message: "Cannot pay another student's fee" });
  }

  const totalAmount = feePayments.reduce(
  (sum, fp) => sum + Math.max(fp.amountDue - fp.amountPaid - fp.scholarshipApplied, 0), 0);
  if (totalAmount <= 0) {
    return res.status(400).json({ success: false, message: 'No pending balance to pay' });
  }

  // `amount` lets the student pay less than the full combined balance of the
  // selected fee heads (a "partial" bulk payment). If omitted, default to the
  // full total so the existing "Pay Full Fee at Once" flow is unaffected.
  const payAmount = amount === undefined || amount === null ? totalAmount : Number(amount);
  if (!Number.isFinite(payAmount) || payAmount <= 0 || payAmount > totalAmount) {
    return res.status(400).json({
      success: false,
      message: `Amount must be between Rs. 1 and Rs. ${totalAmount}`,
    });
  }

  const order = await createOrder(payAmount, `bulk_${req.user._id}_${Date.now()}`.slice(0, 40));

  const transaction = await Transaction.create({
    studentId: req.user._id,
    feePaymentIds,
    isBulk: true,
    amount: payAmount,
    paymentMethod,
    status: 'initiated',
    gatewayReference: order.id,
  });

  res.json({
    success: true,
    order,
    transactionId: transaction._id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});


const verifyBulkPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feePaymentIds } = req.body;

  const isValid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!isValid) {
    await Transaction.findOneAndUpdate(
      { gatewayReference: razorpay_order_id },
      { status: 'failed', failureReason: 'Signature verification failed' }
    );
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const pendingTransaction = await Transaction.findOne({ gatewayReference: razorpay_order_id });
  if (!pendingTransaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  if (String(pendingTransaction.studentId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'This transaction does not belong to you' });
  }
  const expectedIds = (pendingTransaction.feePaymentIds || []).map(String).sort();
  const submittedIds = (feePaymentIds || []).map(String).sort();
  if (JSON.stringify(expectedIds) !== JSON.stringify(submittedIds)) {
    return res.status(400).json({ success: false, message: 'Fee records do not match this payment' });
  }
  if (pendingTransaction.status === 'success') {
    return res.status(400).json({ success: false, message: 'This payment has already been verified' });
  }

  const transaction = await Transaction.findOneAndUpdate(
    { gatewayReference: razorpay_order_id },
    { status: 'success', gatewayReference: razorpay_payment_id },
    { new: true }
  );

  const feePayments = await FeePayment.find({ _id: { $in: feePaymentIds } }).populate('studentId');

  const notOwned = feePayments.find((fp) => String(fp.studentId._id) !== String(req.user._id));
  if (notOwned) {
    return res.status(403).json({ success: false, message: "Cannot pay another student's fee" });
  }

  const orderedIds = (pendingTransaction.feePaymentIds || []).map(String);
  const feePaymentsById = new Map(feePayments.map((fp) => [String(fp._id), fp]));
  const orderedFeePayments = orderedIds.map((id) => feePaymentsById.get(id)).filter(Boolean);

  // First pass: apply the payment across the selected fee heads (in order)
  // without generating any PDF yet, so we know exactly which heads/amounts
  // need to go into a single combined receipt.
  let remainingAmount = transaction.amount;
  const feeItems = [];
  const touchedPayments = [];
  for (const feePayment of orderedFeePayments) {
    if (remainingAmount <= 0) break;

    const balance = Math.max(feePayment.amountDue - feePayment.amountPaid - feePayment.scholarshipApplied, 0);
    if (balance <= 0) continue;

    const amountForThisHead = Math.min(balance, remainingAmount);
    remainingAmount -= amountForThisHead;

    feePayment.amountPaid += amountForThisHead;
    feePayment.status =
      feePayment.amountPaid + feePayment.scholarshipApplied >= feePayment.amountDue ? 'paid' : 'partial';
    feePayment.razorpayOrderId = razorpay_order_id;
    feePayment.razorpayPaymentId = razorpay_payment_id;
    feePayment.razorpaySignature = razorpay_signature;
    feePayment.paidAt = new Date();

    feeItems.push({ feeHead: feePayment.feeHead, amount: amountForThisHead });
    touchedPayments.push(feePayment);
  }

  // One combined receipt for the whole bulk payment, instead of a separate
  // PDF per fee head — every fee record involved points at the same file.
  const receiptNumber = `RCPT-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const receiptUrl = await generateBulkReceiptPdf({
    receiptNumber,
    student: feePayments[0].studentId,
    items: feeItems,
    totalAmount: transaction.amount,
    transactionId: razorpay_payment_id,
    paidAt: new Date(),
  });

  for (const feePayment of touchedPayments) {
    feePayment.receiptNumber = receiptNumber;
    feePayment.receiptUrl = receiptUrl;
    await feePayment.save();
  }

  const receipts = [{ receiptUrl, items: feeItems, amount: transaction.amount }];

  const primaryStudent = feePayments[0]?.studentId;
  if (primaryStudent?.email) {
    sendPaymentSuccessEmail(
      primaryStudent.email,
      primaryStudent.name,
      transaction.amount,
      receipts[0]?.receiptUrl
    ).catch((e) => console.error('Email send failed:', e.message));
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    feePayments,
    receipts,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feePaymentId } = req.body;

  const isValid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!isValid) {
    await Transaction.findOneAndUpdate(
      { gatewayReference: razorpay_order_id },
      { status: 'failed', failureReason: 'Signature verification failed' }
    );
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const pendingTransaction = await Transaction.findOne({ gatewayReference: razorpay_order_id });
  if (!pendingTransaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  if (String(pendingTransaction.studentId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'This transaction does not belong to you' });
  }
  if (String(pendingTransaction.feePaymentId) !== String(feePaymentId)) {
    return res.status(400).json({ success: false, message: 'Fee record does not match this payment' });
  }
  if (pendingTransaction.status === 'success') {
    return res.status(400).json({ success: false, message: 'This payment has already been verified' });
  }

  const transaction = await Transaction.findOneAndUpdate(
    { gatewayReference: razorpay_order_id },
    { status: 'success', gatewayReference: razorpay_payment_id },
    { new: true }
  );

  const feePayment = await FeePayment.findById(feePaymentId).populate('studentId');
  if (!feePayment) return res.status(404).json({ success: false, message: 'Fee record not found' });

  if (String(feePayment.studentId._id) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Cannot pay another student's fee" });
  }

  feePayment.amountPaid += transaction.amount;
 feePayment.status = feePayment.amountPaid + feePayment.scholarshipApplied >= feePayment.amountDue ? 'paid' : 'partial';
  feePayment.razorpayOrderId = razorpay_order_id;
  feePayment.razorpayPaymentId = razorpay_payment_id;
  feePayment.razorpaySignature = razorpay_signature;
  feePayment.paidAt = new Date();

  const receiptNumber = `RCPT-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  feePayment.receiptNumber = receiptNumber;

  const receiptUrl = await generateReceiptPdf({
    receiptNumber,
    student: feePayment.studentId,
    feeHead: feePayment.feeHead,
    amount: transaction.amount,
    transactionId: razorpay_payment_id,
    paidAt: feePayment.paidAt,
  });
  feePayment.receiptUrl = receiptUrl;

  await feePayment.save();

  sendPaymentSuccessEmail(
    feePayment.studentId.email,
    feePayment.studentId.name,
    transaction.amount,
    receiptUrl
  ).catch((e) => console.error('Email send failed:', e.message));

  res.json({ success: true, message: 'Payment verified successfully', feePayment, receiptUrl });
});

const getPaymentHistory = asyncHandler(async (req,res)=>{
  let query = {};
  if(req.user.role === "student"){
    query.studentId = req.user._id;
  }
  else{
    if(req.query.studentId){
    const search = req.query.studentId;
    const student = await Student.findOne({
      $or:[
        {name: {$regex: search, $options:"i"}},
        {enrollmentNo: {$regex: search, $options:"i"}}
      ]
    });
    if(student){
      query.studentId = student._id;
    }
    else{
      return res.json({
        success:true,
        transactions:[]
      });
    }
    }}

  const transactions = await Transaction.find(query)
    .sort({createdAt:-1})
   .populate({
      path: "studentId",
      select: "name enrollmentNo"
    })
    .populate("feePaymentId")
    .populate("feePaymentIds");

  res.json({
    success:true,
    transactions
  });

});

const deleteTransaction = asyncHandler(async(req,res)=>{

  const transaction = await Transaction.findById(req.params.id);

  if(!transaction){
    return res.status(404).json({
      success:false,
      message:"Transaction not found"
    });
  }
  await transaction.deleteOne();

  res.json({
    success:true,
    message:"Transaction deleted successfully"
  });

});

module.exports = {
  initiatePayment,
  verifyPayment,
  initiateBulkPayment,
  verifyBulkPayment,
  getPaymentHistory,
   deleteTransaction,
};