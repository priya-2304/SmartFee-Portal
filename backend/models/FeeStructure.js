const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['Tuition Fee', 'Hostel Fee', 'Bus Fee', 'Exam Fee', 'Library Fee'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    batch: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    semester: { type: Number, required: true, min: 1, max: 8 },
    feeHeads: { type: [feeHeadSchema], required: true, validate: (v) => v.length > 0 },
    totalAmount: { type: Number }, 
    dueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  },
  { timestamps: true }
);

feeStructureSchema.pre('save', function (next) {
  this.totalAmount = this.feeHeads.reduce((sum, h) => sum + h.amount, 0);
  next();
});

feeStructureSchema.index({ batch: 1, branch: 1, year: 1 });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
