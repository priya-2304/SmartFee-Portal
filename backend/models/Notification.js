const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: false, index: true },
     recipientRole: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    type: {
      type: String,
      enum: ['due_reminder_7d', 'due_reminder_3d', 'due_reminder_1d', 'payment_success', 'scholarship_update',
      'scholarship_applied',
      'general'],
      required: true,
    },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);