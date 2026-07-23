const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['merit', 'need-based', 'sports', 'government', 'other'],
      required: true,
    },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedAmount: { type: Number, default: 0, min: 0 }, 
allocations: [
  {
    feePaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment' },
    amount: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now },
  },
],
    appliedAt: { type: Date, default: Date.now },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', scholarshipSchema);
