const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    semester: { type: Number, required: true, index: true },
    feeHead: {
      type: String,
      enum: ['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee'],
      required: true,
    },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, required: true, default: 0 },
    scholarshipApplied: { type: Number, required: true, default: 0, min: 0 },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'failed'],
      default: 'pending',
    },
    paidAt: { type: Date },
    receiptUrl: { type: String },
    receiptNumber: { type: String },
  },
  { timestamps: true }
);

feePaymentSchema.virtual('balance').get(function () {
  return Math.max(this.amountDue - this.amountPaid - this.scholarshipApplied, 0);
});

feePaymentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FeePayment', feePaymentSchema);




















