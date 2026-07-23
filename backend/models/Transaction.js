const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    feePaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' },
    feePaymentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' }], // used for combined "pay all at once" payments
    isBulk: { type: Boolean, default: false },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'offline_challan'],
      required: true,
    },
    status: { type: String, enum: ['initiated', 'success', 'failed', 'refunded'], default: 'initiated' },
    gatewayReference: { type: String }, // Razorpay order/payment id
    failureReason: { type: String },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);